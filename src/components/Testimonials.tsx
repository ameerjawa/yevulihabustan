import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Review } from '../types';
import ReviewForm from './ReviewForm';
import { useSettingsStore } from '../stores/settingsStore';

export default function Testimonials() {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      setReviews(data || []);
    };

    if (settings?.show_reviews_section) {
      fetchReviews();
    }
  }, [settings?.show_reviews_section]);

  if (!settings?.show_reviews_section) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            {t('testimonials.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {t('testimonials.subtitle')}
          </p>
          <button
            onClick={() => setShowReviewForm(true)}
            className="mt-6 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <MessageCircle className="w-5 h-5 ml-2" />
            {t('reviews.addReview')}
          </button>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {t('reviews.noReviews')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <div className="flex items-center mb-4">
                  {review.image && (
                    <img
                      src={review.image}
                      alt={review.restaurant_name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{review.restaurant_name}</h3>
                    <p className="text-gray-600 text-sm">{review.customer_name}</p>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-700">{review.content}</p>
              </div>
            ))}
          </div>
        )}

        {showReviewForm && (
          <ReviewForm onClose={() => setShowReviewForm(false)} />
        )}
      </div>
    </section>
  );
}