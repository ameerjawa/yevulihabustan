import React, { useState, useEffect } from 'react';
import { Star, Check, X, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { trackReviewActivity } from '../../lib/supabase';
import type { Review } from '../../types';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveReview = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({ is_approved: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Track review approval
      await trackReviewActivity(data.restaurant_name, 'approve');

      setReviews(reviews.map(r => r.id === id ? data : r));
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleRejectReview = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק ביקורת זו?')) return;

    try {
      const review = reviews.find(r => r.id === id);
      if (!review) return;

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Track review rejection
      await trackReviewActivity(review.restaurant_name, 'reject');

      setReviews(reviews.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ניהול ביקורות</h1>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          לא נמצאו ביקורות
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-lg shadow-sm p-6 ${
                !review.is_approved ? 'border-2 border-yellow-400' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{review.restaurant_name}</h3>
                  <p className="text-gray-600 text-sm">{review.customer_name}</p>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.content}</p>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString('he-IL')}
                </span>

                <div className="flex gap-2">
                  {!review.is_approved && (
                    <button
                      onClick={() => handleApproveReview(review.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                      title="אשר ביקורת"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRejectReview(review.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                    title="מחק ביקורת"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}