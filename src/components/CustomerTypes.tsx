import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, School, UtensilsCrossed, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CustomerType } from '../types';

export default function CustomerTypes() {
  const { t, i18n } = useTranslation();
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);

  useEffect(() => {
    fetchCustomerTypes();
  }, []);

  const fetchCustomerTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_types')
        .select('*')
        .eq('is_visible', true)  // Only fetch visible customer types
        .order('created_at');

      if (error) throw error;
      setCustomerTypes(data || []);
    } catch (error) {
      console.error('Error fetching customer types:', error);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'utensils-crossed':
        return UtensilsCrossed;
      case 'building-2':
        return Building2;
      case 'school':
        return School;
      case 'building':
        return Building;
      default:
        return Building;
    }
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('customerTypes.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('customerTypes.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {customerTypes.map((type) => {
            const Icon = getIcon(type.icon);
            return (
              <div
                key={type.id}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {i18n.language === 'en' ? type.name_en :
                     i18n.language === 'ar' ? type.name_ar :
                     type.name}
                  </h3>
                  <p className="text-gray-600">
                    {i18n.language === 'en' ? type.description_en :
                     i18n.language === 'ar' ? type.description_ar :
                     type.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}