-- Add a new enum type for user roles
create type user_role as enum ('platform_owner', 'creator', 'subscriber', 'user');

-- Add the 'role' column to the 'users' table
alter table public.users
add column role user_role default 'user' not null;

-- Update RLS policy for 'users' table to allow authenticated users to read their own role
drop policy if exists "Can view own user data." on public.users;
create policy "Can view own user data."
on public.users for select
using ( auth.uid() = id );

-- Optionally, you might want to add a policy for admin roles to view all users
-- For now, we'll stick to users viewing their own data.

-- Update the 'creator_profiles' RLS policy to use the new role if desired,
-- or keep it based on creator_profiles table existence.
-- For now, we'll keep creator_profiles RLS as is, as it's based on the creator_id.