import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, TrendingUp, Package, Users, Search, Eye, ShoppingCart, 
  ArrowUp, ArrowDown, Star, MessageCircle, Calendar, Layers, 
  AlertTriangle, Tag, Activity as ActivityIcon, Download, ChevronDown, Clock,
  RefreshCw, Filter, User, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import AdminProfile from '../../components/AdminProfile';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { PostgrestError } from '@supabase/supabase-js';
import type { Product, Category, Activitya } from '../../types';
import { getSearchInsights, getRecentActivities } from '../../lib/supabase';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  pendingReviews: number;
  activePromotions: number;
  totalWatches: number;
  popularSearches: { term: string; count: number }[];
  categoryPerformance: {
    name: string;
    value: number;
    percentage: number;
  }[];
  inventoryHealth: {
    name: string;
    score: number;
    percentage: number;
  }[];
  latestActivities: Activitya[];
  hasMoreActivities: boolean;
  searchInsights: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalCategories: 0,
    pendingReviews: 0,
    activePromotions: 0,
    totalWatches: 0,
    popularSearches: [],
    categoryPerformance: [],
    inventoryHealth: [],
    latestActivities: [],
    hasMoreActivities: false,
    searchInsights: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activityFilter, setActivityFilter] = useState<Activitya['type'] | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const startDate = new Date();
      if (timeRange === 'day') {
        startDate.setDate(startDate.getDate() - 1);
      } else if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }

      // Fetch basic stats
      const [
        { data: productsData },
        { data: categoriesData },
        { data: reviewsData, count: reviewsCount },
        { data: promotionsData, count: promotionsCount },
        { data: watchesData, count: watchesCount }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('reviews').select('*', { count: 'exact' }).eq('is_approved', false),
        supabase.from('promotions').select('*', { count: 'exact' }).gte('end_date', new Date().toISOString()),
        supabase.from('product_watches').select('*', { count: 'exact' })
      ]);

      const products = productsData || [];
      const categories = categoriesData || [];

      // Calculate category performance
      const categoryPerformance = categories.map(category => {
        const categoryProducts = products.filter(p => p.category === category.id);
        return {
          name: category.name,
          value: categoryProducts.length,
          percentage: Math.round((categoryProducts.length / products.length) * 100)
        };
      });

      // Calculate inventory health
      const inventoryHealth = [
        {
          name: 'במלאי ובעונה',
          score: products.filter(p => p.in_stock && p.in_season).length,
          percentage: Math.round((products.filter(p => p.in_stock && p.in_season).length / products.length) * 100)
        },
        {
          name: 'במלאי',
          score: products.filter(p => p.in_stock && !p.in_season).length,
          percentage: Math.round((products.filter(p => p.in_stock && !p.in_season).length / products.length) * 100)
        },
        {
          name: 'אזל מהמלאי',
          score: products.filter(p => !p.in_stock).length,
          percentage: Math.round((products.filter(p => !p.in_stock).length / products.length) * 100)
        }
      ];

      // Fetch activities
      const { activities, hasMore } = await getRecentActivities(1, 10, activityFilter === 'all' ? undefined : activityFilter);

      setStats({
        totalProducts: products.length,
        activeProducts: products.filter(p => p.in_stock && p.in_season).length,
        totalCategories: categories.length,
        pendingReviews: reviewsCount || 0,
        activePromotions: promotionsCount || 0,
        totalWatches: watchesCount || 0,
        popularSearches: [],
        categoryPerformance,
        inventoryHealth,
        latestActivities: activities,
        hasMoreActivities: hasMore,
        searchInsights: []
      });

      // Fetch search insights
      try {
        const searchInsights = await getSearchInsights(timeRange);
        setStats(prev => ({ ...prev, searchInsights }));
      } catch (err) {
        console.error('Error getting search insights:', err);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreActivities = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = activitiesPage + 1;
      const { activities, hasMore } = await getRecentActivities(nextPage, 10, activityFilter === 'all' ? undefined : activityFilter);

      setStats(prev => ({
        ...prev,
        latestActivities: [...prev.latestActivities, ...activities],
        hasMoreActivities: hasMore
      }));
      setActivitiesPage(nextPage);
    } catch (err) {
      console.error('Error loading more activities:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const formatActivityDate = (date: string) => {
    const activityDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'עכשיו';
    if (diffInMinutes < 60) return `לפני ${diffInMinutes} דקות`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `לפני ${diffInHours} שעות`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `לפני ${diffInDays} ימים`;
    
    return activityDate.toLocaleDateString('he-IL');
  };

  const getActivityIcon = (type: Activitya['type']) => {
    switch (type) {
      case 'product_view':
        return <Eye className="w-5 h-5 text-blue-500" />;
      case 'product_update':
        return <Package className="w-5 h-5 text-green-500" />;
      case 'category_update':
        return <Tag className="w-5 h-5 text-purple-500" />;
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'promotion':
        return <ShoppingCart className="w-5 h-5 text-red-500" />;
      case 'settings_update':
        return <Layers className="w-5 h-5 text-gray-500" />;
      default:
        return <ActivityIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[200px] text-red-600">
        <AlertTriangle className="w-6 h-6 ml-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Content */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">לוח בקרה</h1>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="day">24 שעות אחרונות</option>
              <option value="week">שבוע אחרון</option>
              <option value="month">חודש אחרון</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-500" />
              <div className="mr-4">
                <p className="text-sm text-gray-600">מוצרים פעילים</p>
                <p className="text-2xl font-semibold">
                  {stats.activeProducts}/{stats.totalProducts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-500" />
              <div className="mr-4">
                <p className="text-sm text-gray-600">צפיות במוצרים</p>
                <p className="text-2xl font-semibold">{stats.totalWatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-purple-500" />
              <div className="mr-4">
                <p className="text-sm text-gray-600">ביקורות ממתינות</p>
                <p className="text-2xl font-semibold">{stats.pendingReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-yellow-500" />
              <div className="mr-4">
                <p className="text-sm text-gray-600">מבצעים פעילים</p>
                <p className="text-2xl font-semibold">{stats.activePromotions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Insights Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center">
              <Search className="w-5 h-5 ml-2" />
              תובנות חיפוש
            </h2>
          </div>

          {stats.searchInsights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              לא נמצאו נתוני חיפוש
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">חיפושים פופולריים</h3>
                {stats.searchInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="mr-3">
                        <p className="font-medium">{insight.term}</p>
                        <p className="text-sm text-gray-500">
                          {insight.count} חיפושים
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(insight.success_rate * 100)}% הצלחה
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round(insight.avg_results)} תוצאות בממוצע
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">התפלגות תוצאות</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.searchInsights.slice(0, 5)}
                        dataKey="count"
                        nameKey="term"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                      >
                        {stats.searchInsights.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center">
              <BarChart className="w-5 h-5 ml-2" />
              ביצועי קטגוריות
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {stats.categoryPerformance.map((category, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">{category.value} מוצרים</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">מצב מלאי</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.inventoryHealth}
                      dataKey="score"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {stats.inventoryHealth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>


        {/* Admin Profile Section - At bottom */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <User className="w-6 h-6 ml-2" />
              פרופיל מנהל
            </h2>
          </div>
          <AdminProfile />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;