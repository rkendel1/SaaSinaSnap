/**
* GRADIENT AND PATTERN SUPPORT FOR CREATOR BRANDING
* Note: Adds gradient and pattern columns to creator_profiles table
*/

-- Add columns for gradient and pattern support
alter table creator_profiles 
  add column brand_gradient jsonb,
  add column brand_pattern jsonb;

-- Add comment for documentation
comment on column creator_profiles.brand_gradient is 'Stores gradient configuration: { type: "linear|radial", colors: [color1, color2, ...], direction?: angle }';
comment on column creator_profiles.brand_pattern is 'Stores pattern configuration: { type: "stripes|dots|none", intensity?: number, angle?: number }';

-- Update existing rows to have default values
update creator_profiles 
set 
  brand_gradient = jsonb_build_object(
    'type', 'linear',
    'colors', jsonb_build_array(coalesce(brand_color, '#000000'), '#000000'),
    'direction', 45
  ),
  brand_pattern = jsonb_build_object(
    'type', 'none',
    'intensity', 0.1,
    'angle', 0
  )
where brand_gradient is null or brand_pattern is null;