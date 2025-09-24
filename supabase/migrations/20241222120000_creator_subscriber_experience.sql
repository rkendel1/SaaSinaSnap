/**
* Additional SQL functions and improvements for creator analytics
*/

-- Function to increment product sales statistics
CREATE OR REPLACE FUNCTION increment_product_sales(product_id uuid, amount decimal)
RETURNS void AS $$
BEGIN
  UPDATE creator_products 
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'total_sales', COALESCE((metadata->>'total_sales')::decimal, 0) + amount,
    'sales_count', COALESCE((metadata->>'sales_count')::integer, 0) + 1,
    'last_sale_at', now()
  )
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get creator dashboard analytics
CREATE OR REPLACE FUNCTION get_creator_dashboard_stats(creator_uuid uuid)
RETURNS TABLE (
  total_revenue decimal,
  total_sales bigint,
  active_products bigint,
  recent_sales_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM((cp.metadata->>'total_sales')::decimal), 0) as total_revenue,
    COALESCE(SUM((cp.metadata->>'sales_count')::bigint), 0) as total_sales,
    COUNT(CASE WHEN cp.active = true THEN 1 END) as active_products,
    COUNT(CASE WHEN (cp.metadata->>'last_sale_at')::timestamp > (now() - interval '30 days') THEN 1 END) as recent_sales_count
  FROM creator_products cp
  WHERE cp.creator_id = creator_uuid;
END;
$$ LANGUAGE plpgsql;

-- Index to improve creator lookup performance  
CREATE INDEX IF NOT EXISTS idx_creator_profiles_custom_domain ON creator_profiles(custom_domain) WHERE custom_domain IS NOT NULL;

-- Index to improve product lookup performance
CREATE INDEX IF NOT EXISTS idx_creator_products_creator_active ON creator_products(creator_id, active) WHERE active = true;

-- Index to improve analytics queries
CREATE INDEX IF NOT EXISTS idx_creator_analytics_creator_metric ON creator_analytics(creator_id, metric_name, period_start);

-- Add some sample testimonials data for white-labeled pages
INSERT INTO white_labeled_pages (creator_id, page_slug, page_title, page_config, active, created_at, updated_at)
SELECT 
  id as creator_id,
  'testimonials' as page_slug,
  'Customer Testimonials' as page_title,
  jsonb_build_object(
    'testimonials', jsonb_build_array(
      jsonb_build_object('name', 'Sarah Johnson', 'role', 'Product Manager', 'content', 'This platform has transformed how we deliver our SaaS products. The experience is seamless and our customers love it!'),
      jsonb_build_object('name', 'Mike Chen', 'role', 'Startup Founder', 'content', 'The white-labeled experience is exactly what we needed. Our brand stays consistent throughout the entire customer journey.'),
      jsonb_build_object('name', 'Emily Davis', 'role', 'SaaS Owner', 'content', 'Setup was incredibly easy and the analytics give us great insights into our customer behavior.')
    )
  ) as page_config,
  true as active,
  now() as created_at,
  now() as updated_at
FROM creator_profiles 
WHERE NOT EXISTS (
  SELECT 1 FROM white_labeled_pages 
  WHERE creator_id = creator_profiles.id AND page_slug = 'testimonials'
);