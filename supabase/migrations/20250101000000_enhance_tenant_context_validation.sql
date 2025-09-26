/**
 * ENHANCED TENANT CONTEXT VALIDATION
 * Additional database-level checks and monitoring for tenant context
 */

-- Add a function to validate tenant context before any operation
create or replace function validate_tenant_context_for_operation(
  p_operation_name text,
  p_table_name text default null,
  p_resource_id text default null
)
returns uuid as $$
declare
  tenant_uuid uuid;
  operation_log_id uuid;
begin
  -- Get current tenant context
  tenant_uuid := get_current_tenant();
  
  -- Log the operation attempt for monitoring
  if tenant_uuid is not null then
    -- Log successful context validation
    insert into audit_logs (
      tenant_id, action, resource_type, resource_id, metadata
    ) values (
      tenant_uuid, 
      'tenant_context_validated', 
      'system_operation',
      p_operation_name,
      jsonb_build_object(
        'operation', p_operation_name,
        'table_name', p_table_name,
        'resource_id', p_resource_id,
        'validated_at', now()
      )
    ) returning id into operation_log_id;
  else
    -- Log failed context validation attempt
    insert into audit_logs (
      tenant_id, action, resource_type, resource_id, metadata
    ) values (
      '00000000-0000-0000-0000-000000000000'::uuid, -- Special UUID for context failures
      'tenant_context_validation_failed', 
      'system_operation',
      p_operation_name,
      jsonb_build_object(
        'operation', p_operation_name,
        'table_name', p_table_name,
        'resource_id', p_resource_id,
        'failed_at', now(),
        'error', 'No tenant context set'
      )
    ) returning id into operation_log_id;
    
    raise exception 'Operation % requires tenant context to be set. Call set_current_tenant() first.', p_operation_name;
  end if;
  
  return tenant_uuid;
end;
$$ language plpgsql security definer;

-- Enhanced ensure_tenant_context function with better logging
create or replace function ensure_tenant_context()
returns uuid as $$
declare
  tenant_uuid uuid;
begin
  -- Use the validation function which includes logging
  tenant_uuid := validate_tenant_context_for_operation('ensure_tenant_context');
  return tenant_uuid;
end;
$$ language plpgsql;

-- Function to check if a tenant exists and is active
create or replace function validate_tenant_exists(tenant_uuid uuid)
returns boolean as $$
declare
  tenant_active boolean;
begin
  select active into tenant_active 
  from tenants 
  where id = tenant_uuid;
  
  if tenant_active is null then
    raise exception 'Tenant % does not exist', tenant_uuid;
  end if;
  
  if not tenant_active then
    raise exception 'Tenant % is not active', tenant_uuid;
  end if;
  
  return true;
end;
$$ language plpgsql security definer;

-- Enhanced set_current_tenant function with validation
create or replace function set_current_tenant(tenant_uuid uuid)
returns void as $$
begin
  -- Validate that the tenant exists and is active
  if not validate_tenant_exists(tenant_uuid) then
    raise exception 'Cannot set context for invalid tenant %', tenant_uuid;
  end if;
  
  -- Set the tenant context
  perform set_config('app.current_tenant', tenant_uuid::text, true);
  
  -- Log the context change
  insert into audit_logs (
    tenant_id, action, resource_type, resource_id, metadata
  ) values (
    tenant_uuid,
    'tenant_context_set',
    'tenant',
    tenant_uuid::text,
    jsonb_build_object(
      'set_at', now(),
      'session_user', session_user,
      'application_name', current_setting('application_name', true)
    )
  );
end;
$$ language plpgsql security definer;

-- Function to get tenant context with validation
create or replace function get_current_tenant_validated()
returns uuid as $$
declare
  tenant_uuid uuid;
begin
  tenant_uuid := get_current_tenant();
  
  if tenant_uuid is null then
    raise exception 'No tenant context is currently set';
  end if;
  
  -- Validate the tenant still exists and is active
  if not validate_tenant_exists(tenant_uuid) then
    raise exception 'Current tenant context % is invalid', tenant_uuid;
  end if;
  
  return tenant_uuid;
end;
$$ language plpgsql;

-- Add a trigger to automatically validate tenant context on critical operations
create or replace function check_tenant_context_before_insert()
returns trigger as $$
declare
  current_tenant_id uuid;
begin
  -- Get current tenant context
  current_tenant_id := get_current_tenant();
  
  -- Ensure tenant context is set
  if current_tenant_id is null then
    raise exception 'Insert into % requires tenant context. Table: %, ID: %', 
      TG_TABLE_NAME, TG_TABLE_NAME, NEW.id;
  end if;
  
  -- Ensure the record's tenant_id matches current context (if the table has tenant_id)
  if TG_TABLE_NAME != 'tenants' and hstore(NEW) ? 'tenant_id' then
    if NEW.tenant_id != current_tenant_id then
      raise exception 'Tenant ID mismatch in %. Record tenant: %, Context tenant: %',
        TG_TABLE_NAME, NEW.tenant_id, current_tenant_id;
    end if;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- Apply the tenant context validation trigger to key tables
drop trigger if exists tenant_context_check_trigger on usage_events;
create trigger tenant_context_check_trigger
  before insert on usage_events
  for each row execute function check_tenant_context_before_insert();

drop trigger if exists tenant_context_check_trigger on usage_meters;
create trigger tenant_context_check_trigger
  before insert on usage_meters
  for each row execute function check_tenant_context_before_insert();

drop trigger if exists tenant_context_check_trigger on analytics_events;
create trigger tenant_context_check_trigger
  before insert on analytics_events
  for each row execute function check_tenant_context_before_insert();

drop trigger if exists tenant_context_check_trigger on audit_logs;
create trigger tenant_context_check_trigger
  before insert on audit_logs
  for each row execute function check_tenant_context_before_insert();

-- Create a view for monitoring tenant context issues
create or replace view tenant_context_monitoring as
select 
  al.created_at,
  al.action,
  al.resource_type,
  al.resource_id,
  al.metadata,
  t.name as tenant_name,
  case 
    when al.tenant_id = '00000000-0000-0000-0000-000000000000'::uuid then 'CONTEXT_FAILURE'
    else 'SUCCESS'
  end as status
from audit_logs al
left join tenants t on al.tenant_id = t.id
where al.action in (
  'tenant_context_validated',
  'tenant_context_validation_failed',
  'tenant_context_set'
)
order by al.created_at desc;

-- Grant access to the monitoring view
grant select on tenant_context_monitoring to authenticated;

-- Add index for efficient monitoring queries
create index if not exists idx_audit_logs_tenant_context_monitoring 
on audit_logs(action, created_at desc) 
where action in ('tenant_context_validated', 'tenant_context_validation_failed', 'tenant_context_set');

-- Create a function to get tenant context statistics
create or replace function get_tenant_context_stats(
  p_hours_back integer default 24
)
returns table(
  tenant_id uuid,
  tenant_name text,
  successful_operations bigint,
  failed_operations bigint,
  context_sets bigint,
  last_activity timestamp with time zone
) as $$
begin
  return query
  select 
    coalesce(al.tenant_id, '00000000-0000-0000-0000-000000000000'::uuid) as tenant_id,
    coalesce(t.name, 'UNKNOWN') as tenant_name,
    count(*) filter (where al.action = 'tenant_context_validated') as successful_operations,
    count(*) filter (where al.action = 'tenant_context_validation_failed') as failed_operations,
    count(*) filter (where al.action = 'tenant_context_set') as context_sets,
    max(al.created_at) as last_activity
  from audit_logs al
  left join tenants t on al.tenant_id = t.id
  where al.created_at >= now() - (p_hours_back || ' hours')::interval
    and al.action in ('tenant_context_validated', 'tenant_context_validation_failed', 'tenant_context_set')
  group by al.tenant_id, t.name
  order by last_activity desc;
end;
$$ language plpgsql security definer;

-- Grant execute permission on the stats function
grant execute on function get_tenant_context_stats(integer) to authenticated;