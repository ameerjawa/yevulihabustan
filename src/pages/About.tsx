import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sprout, Award, Target, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AboutContent } from '../types';

export default function About() {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState<AboutContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .order('order');

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error('Error fetching about content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let channel = supabase.channel('about-content-changes');

    const setupSubscription = async () => {
      try {
        if (mounted) {
          await fetchContent();
        }

        channel = supabase
          .channel('about-content-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'about_content'
            },
            async (payload) => {
              if (mounted) {
                await fetchContent();
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED' && mounted) {
              console.log('Subscribed to about content changes');
            }
          });
      } catch (error) {
        console.error('Error setting up subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      mounted = false;
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  const getLocalizedField = (item: AboutContent, field: 'title' | 'content'): string => {
    const localizedField = item[`${field}_${i18n.language}` as keyof AboutContent];
    return (typeof localizedField === 'string' ? localizedField : item[field]) || '';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const mainContent = content.find(item => item.section === 'main');
  const visionContent = content.find(item => item.section === 'vision');
  const advantages = content.filter(item => item.section === 'advantages');

  return (
    <div className="bg-white">
      {/* Hero Section */}
      {mainContent && (
        <div className="relative py-20 bg-green-600">
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              {getLocalizedField(mainContent, 'title')}
            </h1>
            <p className="text-xl text-white max-w-3xl mx-auto">
              {getLocalizedField(mainContent, 'content')}
            </p>
          </div>
        </div>
      )}

      {/* Vision Section */}
      {visionContent && (
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:flex lg:items-center lg:justify-between">
              <div className="lg:w-1/2 lg:pr-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {getLocalizedField(visionContent, 'title')}
                </h2>
                <p className="text-lg text-gray-600">
                  {getLocalizedField(visionContent, 'content')}
                </p>
              </div>
              {visionContent.image && (
                <div className="mt-8 lg:mt-0 lg:w-1/2">
                  <img
                    src={visionContent.image}
                    alt="Our Vision"
                    className="rounded-lg shadow-lg object-cover w-full h-[400px]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advantages Section */}
      {advantages.length > 0 && (
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                {t('about.advantages.title')}
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                {t('about.advantages.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {advantages.map((advantage) => (
                <div
                  key={advantage.id}
                  className="bg-gray-50 rounded-lg p-8 text-center hover:shadow-lg transition-shadow"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {getLocalizedField(advantage, 'title')}
                  </h3>
                  <p className="text-gray-600">
                    {getLocalizedField(advantage, 'content')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}