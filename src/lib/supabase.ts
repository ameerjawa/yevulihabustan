import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth functions
export const loginAdmin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
};

export const logoutAdmin = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Activity tracking functions
export const trackProductUpdate = async (productId: string, productName: string, metadata: any) => {
  try {
    const { error } = await supabase
      .from('activities')
      .insert({
        type: 'product_update',
        description: `Updated product: ${productName}`,
        metadata
      });

    if (error) throw error;
  } catch (err) {
    console.error('Error tracking product update:', err);
  }
};

export const trackCategoryUpdate = async (categoryId: string, categoryName: string, metadata: any) => {
  try {
    const { error } = await supabase
      .from('activities')
      .insert({
        type: 'category_update',
        description: `Updated category: ${categoryName}`,
        metadata
      });

    if (error) throw error;
  } catch (err) {
    console.error('Error tracking category update:', err);
  }
};

export const trackReviewActivity = async (restaurantName: string, action: 'approve' | 'reject') => {
  try {
    const { error } = await supabase
      .from('activities')
      .insert({
        type: 'review',
        description: `${action === 'approve' ? 'Approved' : 'Rejected'} review from ${restaurantName}`,
        metadata: { action, restaurant_name: restaurantName }
      });

    if (error) throw error;
  } catch (err) {
    console.error('Error tracking review activity:', err);
  }
};

export const trackSettingsUpdate = async (settings: any) => {
  try {
    const { error } = await supabase
      .from('activities')
      .insert({
        type: 'settings_update',
        description: 'Updated website settings',
        metadata: { settings }
      });

    if (error) throw error;
  } catch (err) {
    console.error('Error tracking settings update:', err);
  }
};

export const trackSearch = async (term: string, results: any[], metadata: any = {}) => {
  try {
    const { error } = await supabase
      .from('search_stats')
      .insert({
        term,
        results_count: results.length,
        filters: metadata
      });

    if (error) throw error;
  } catch (err) {
    console.error('Error tracking search:', err);
  }
};

export const getSearchInsights = async (timeRange: 'day' | 'week' | 'month') => {
  try {
    const startDate = new Date();
    if (timeRange === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (timeRange === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setDate(startDate.getDate() - 30);
    }

    const { data, error } = await supabase.rpc('get_search_insights', {
      search_start_date: startDate.toISOString()
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error getting search insights:', err);
    return [];
  }
};

export const getRecentActivities = async (page: number, limit: number, type?: string) => {
  try {
    let query = supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      activities: data || [],
      hasMore: (count || 0) > page * limit
    };
  } catch (err) {
    console.error('Error getting recent activities:', err);
    return {
      activities: [],
      hasMore: false
    };
  }
};

// Price update functions
export const checkPriceUpdates = async () => {
  try {
    await supabase.rpc('update_all_prices');
  } catch (error) {
    console.error('Error checking price updates:', error);
  }
};

export const getCurrentServerTime = async () => {
  const { data, error } = await supabase
    .rpc('get_current_time');
  
  if (error) {
    console.error('Error getting server time:', error);
    return null;
  }
  
  return data;
};
