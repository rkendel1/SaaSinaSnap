import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { CreatorProduct } from '../types'; // Import CreatorProduct type

interface CreatorDashboardStats {
  total_revenue: number;
  total_sales: number;
  active_products: number;
  recent_sales_count: number;
}

export async function getCreatorDashboardStats(creatorId: string): Promise<CreatorDashboardStats> {
  const supabase = await createSupabaseServerClient();

  // Use a more direct query since RPC might not exist
  const { data: products, error } = await supabase
    .from('creator_products')
    .select('metadata')
    .eq('creator_id', creatorId);

  if (error) {
    console.error('Error fetching creator dashboard stats:', error);
    return {
      total_revenue: 0,
      total_sales: 0,
      active_products: 0,
      recent_sales_count: 0,
    };
  }

  // Calculate stats from metadata
  const stats = products?.reduce((acc, product) => {
    const metadata = (product as CreatorProduct).metadata as Record<string, any> || {};
    const totalSales = parseFloat(metadata.total_sales || '0');
    const salesCount = parseInt(metadata.sales_count || '0');
    
    acc.total_revenue += totalSales;
    acc.total_sales += salesCount;
    acc.active_products += 1;
    
    // Check if last sale was in the last 30 days
    const lastSaleAt = metadata.last_sale_at;
    if (lastSaleAt) {
      const lastSale = new Date(lastSaleAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (lastSale > thirtyDaysAgo) {
        acc.recent_sales_count += 1;
      }
    }
    
    return acc;
  }, {
    total_revenue: 0,
    total_sales: 0,
    active_products: 0,
    recent_sales_count: 0,
  }) || {
    total_revenue: 0,
    total_sales: 0,
    active_products: 0,
    recent_sales_count: 0,
  };

  return stats;
}

export async function getRecentCreatorAnalytics(creatorId: string, limit = 10) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('creator_analytics')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching creator analytics:', error);
    return [];
  }

  return data || [];
}