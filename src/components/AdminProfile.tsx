import React, { useState, useEffect } from 'react';
import { User, Mail, Key, Save, X, Clock, Activity as ActivityIcon, Star, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Review, Activitya } from '../types';

export default function AdminProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [recentActivities, setRecentActivities] = useState<Activitya[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [activityFilter, setActivityFilter] = useState<Activitya['type'] | 'all'>('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadProfile();
    loadRecentActivities();
    loadRecentReviews();
  }, []);

  useEffect(() => {
    loadRecentActivities();
  }, [activityFilter]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('שגיאה בטעינת הפרופיל');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentActivities = async (page = 1) => {
    try {
      const query = supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (activityFilter !== 'all') {
        query.eq('type', activityFilter);
      }

      const { data, error, count } = await query
        .range((page - 1) * 10, page * 10 - 1);

      if (error) throw error;

      if (page === 1) {
        setRecentActivities(data || []);
      } else {
        setRecentActivities(prev => [...prev, ...(data || [])]);
      }

      setHasMoreActivities((count || 0) > page * 10);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const loadRecentReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      if (profile.newPassword) {
        if (profile.newPassword !== profile.confirmPassword) {
          setError('הסיסמאות אינן תואמות');
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: profile.newPassword
        });

        if (error) throw error;
        setSuccessMessage('הסיסמה עודכנה בהצלחה');
      }

      setIsEditing(false);
      setProfile(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('שגיאה בעדכון הפרופיל');
    }
  };

  const loadMoreActivities = async () => {
    setIsLoadingMore(true);
    await loadRecentActivities(currentPage + 1);
    setIsLoadingMore(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: Activitya['type']) => {
    switch (type) {
      case 'product_view':
        return <ActivityIcon className="w-5 h-5 text-blue-500" />;
      case 'product_update':
        return <ActivityIcon className="w-5 h-5 text-green-500" />;
      case 'category_update':
        return <ActivityIcon className="w-5 h-5 text-purple-500" />;
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'promotion':
        return <ActivityIcon className="w-5 h-5 text-red-500" />;
      case 'settings_update':
        return <ActivityIcon className="w-5 h-5 text-gray-500" />;
      default:
        return <ActivityIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">פרופיל מנהל</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            {isEditing ? 'ביטול' : 'ערוך פרופיל'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              דואר אלקטרוני
            </label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>

          {isEditing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סיסמה חדשה
                </label>
                <div className="relative">
                  <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={profile.newPassword}
                    onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                    className="w-full pr-10 py-2 border border-gray-300 rounded-lg"
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  אימות סיסמה חדשה
                </label>
                <div className="relative">
                  <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={profile.confirmPassword}
                    onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                    className="w-full pr-10 py-2 border border-gray-300 rounded-lg"
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="w-4 h-4 inline-block ml-2" />
                  שמור שינויים
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Recent Activities Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Clock className="w-6 h-6 ml-2" />
            פעילות אחרונה
          </h2>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as Activitya['type'] | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="all">כל הפעילויות</option>
              <option value="product_view">צפייה במוצרים</option>
              <option value="product_update">עדכוני מוצרים</option>
              <option value="category_update">עדכוני קטגוריות</option>
              <option value="review">ביקורות</option>
              <option value="promotion">מבצעים</option>
              <option value="settings_update">הגדרות</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  {activity.actor && (
                    <span className="font-medium">{activity.actor}</span>
                  )}
                  <span>{formatDate(activity.created_at)}</span>
                </div>
                
              </div>
            </div>
          ))}

          {hasMoreActivities && (
            <div className="text-center pt-4">
              <button
                onClick={loadMoreActivities}
                disabled={isLoadingMore}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {isLoadingMore ? 'טוען...' : 'טען עוד'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Reviews Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Star className="w-6 h-6 ml-2" />
          ביקורות אחרונות
        </h2>

        <div className="space-y-4">
          {recentReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{review.restaurant_name}</h3>
                  <p className="text-sm text-gray-600">{review.customer_name}</p>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-700">{review.content}</p>
              <div className="mt-2 text-xs text-gray-500">
                {formatDate(review.created_at)}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    review.is_approved
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {review.is_approved ? 'מאושר' : 'ממתין לאישור'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}