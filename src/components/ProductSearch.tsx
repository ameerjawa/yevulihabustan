import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

export default function ProductSearch() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    quality: '',
    inStock: true,
    inSeason: true
  });

  useEffect(() => {
    const fetchProducts = async () => {
      let query = supabase
        .from('products')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.ilike(`name_${i18n.language}`, `%${searchTerm}%`);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.quality) {
        query = query.eq('quality', filters.quality);
      }

      if (filters.inStock) {
        query = query.eq('in_stock', true);
      }

      if (filters.inSeason) {
        query = query.eq('in_season', true);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data);
    };

    fetchProducts();
  }, [searchTerm, filters, i18n.language]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">{t('search.filters.category')}</option>
            {/* Categories will be populated from the database */}
          </select>

          <select
            value={filters.quality}
            onChange={(e) => setFilters({ ...filters, quality: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">{t('search.filters.quality')}</option>
            <option value="premium">{t('product.quality.premium')}</option>
            <option value="a">{t('product.quality.a')}</option>
            <option value="b">{t('product.quality.b')}</option>
            <option value="c">{t('product.quality.c')}</option>
          </select>

          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="mr-2">{t('search.filters.inStock')}</span>
          </label>

          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={filters.inSeason}
              onChange={(e) => setFilters({ ...filters, inSeason: e.target.checked })}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="mr-2">{t('search.filters.season')}</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={product.image}
                alt={product[`name_${i18n.language}` as keyof Product] as string}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">
                {product[`name_${i18n.language}` as keyof Product]}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {product[`description_${i18n.language}` as keyof Product]}
              </p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-green-600">
                  ₪{product.price}/ק"ג
                </span>
                {!product.inStock && (
                  <span className="text-red-500 text-sm">
                    {t('product.outOfStock')}
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <span className={`text-sm px-2 py-1 rounded ${
                  product.quality === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                  product.quality === 'a' ? 'bg-green-100 text-green-800' :
                  product.quality === 'b' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {t(`product.quality.${product.quality}`)}
                </span>
                <span className={`text-sm px-2 py-1 rounded ${
                  product.inSeason ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {t(product.inSeason ? 'product.inSeason' : 'product.outOfSeason')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}