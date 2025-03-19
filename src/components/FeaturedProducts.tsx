import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

interface ProductWithPromotion extends Product {
  promotion?: {
    discount_price: number;
  };
}

export default function FeaturedProducts() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<ProductWithPromotion[]>([]);
  const { settings } = useSettingsStore();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error fetching featured products:', error);
        return;
      }

      // Fetch active promotions if show_promotions is enabled
      let promotionsData = [];
      if (settings?.show_promotions) {
        const { data: promotions, error: promotionsError } = await supabase
          .from('promotions')
          .select('*')
          .gte('end_date', new Date().toISOString())
          .lte('start_date', new Date().toISOString());

        if (promotionsError) {
          console.error('Error fetching promotions:', promotionsError);
        } else {
          promotionsData = promotions || [];
        }
      }

      // Combine products with their active promotions
      const productsWithPromotions = data?.map(product => {
        const promotion = promotionsData.find(p => p.product_id === product.id);
        return {
          ...product,
          promotion: promotion ? { discount_price: promotion.discount_price } : undefined
        };
      }) || [];

      setProducts(productsWithPromotions);
    };

    fetchFeaturedProducts();
  }, [settings?.show_promotions]);

  const getLocalizedName = (product: Product): string => {
    const localizedName = product[`name_${i18n.language}` as keyof typeof product];
    return (typeof localizedName === 'string' ? localizedName : product.name) || '';
  };

  const renderPrice = (product: ProductWithPromotion) => {
    if (product.promotion && settings?.show_promotions) {
      return (
        <div>
          <div className="text-lg font-bold text-green-600">
            ₪{product.promotion.discount_price}/{t(`product.per_${product.price_unit}`)}
          </div>
          <div className="text-sm text-gray-500 line-through">
            ₪{product.price}/{t(`product.per_${product.price_unit}`)}
          </div>
          <div className="text-sm text-red-600">
            {Math.round((1 - product.promotion.discount_price / product.price) * 100)}% {t('product.discount')}
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-lg font-bold text-green-600">
        ₪{product.price}/{t(`product.per_${product.price_unit}`)}
      </div>
    );
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {t('featured.title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            {t('featured.description')}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div 
              key={product.id} 
              className={`relative bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 ${
                !product.in_stock ? 'opacity-60' : ''
              }`}
            >
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800'}
                  alt={getLocalizedName(product)}
                  className="object-cover w-full h-48"
                />
                {product.promotion && settings?.show_promotions && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1.5 bg-red-600 text-white rounded-full text-sm font-medium">
                      {Math.round((1 - product.promotion.discount_price / product.price) * 100)}% {t('product.discount')}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">
                  {getLocalizedName(product)}
                </h3>
                {renderPrice(product)}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`text-sm px-2 py-1 rounded ${
                    product.quality === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                    product.quality === 'a' ? 'bg-green-100 text-green-800' :
                    product.quality === 'b' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {t(`product.quality.${product.quality}`)}
                  </span>
                  
                  <span className={`text-sm px-2 py-1 rounded ${
                    product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.in_stock ? t('product.inStock') : t('product.outOfStock')}
                  </span>
                  
                  {product.in_season && (
                    <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800">
                      {t('product.inSeason')}
                    </span>
                  )}
                </div>
              </div>

              {/* Out of stock overlay */}
              {!product.in_stock && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center pointer-events-none">
                  <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
                    {t('product.outOfStock')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}