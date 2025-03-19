import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Grid, List, LayoutGrid, Table2, SortAsc, SortDesc, Download, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { trackSearch } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { useSettingsStore } from '../stores/settingsStore';

type ViewMode = 'grid' | 'list' | 'compact' | 'table';
type PriceDisplayMode = 'today' | 'tomorrow';

interface ProductWithPromotion extends Product {
  promotion?: {
    discount_price: number;
  };
}

export default function ProductCatalog() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<ProductWithPromotion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [inSeasonOnly, setInSeasonOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quality'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [priceDisplayMode, setPriceDisplayMode] = useState<PriceDisplayMode>('today');
  const settings = useSettingsStore(state => state.settings);

  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Add effect to update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Format dates for Israel timezone
  const todayDate = new Date(currentTime).toLocaleDateString('he-IL', {
    timeZone: 'Asia/Jerusalem'
  });
  
  const tomorrowDate = new Date(currentTime.getTime() + 86400000).toLocaleDateString('he-IL', {
    timeZone: 'Asia/Jerusalem'
  });
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedQuality, inStockOnly, inSeasonOnly, sortBy, sortDirection]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('products').select('*');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (selectedQuality) {
        query = query.eq('quality', selectedQuality);
      }

      if (inStockOnly) {
        query = query.eq('in_stock', true);
      }

      if (inSeasonOnly) {
        query = query.eq('in_season', true);
      }

      switch (sortBy) {
        case 'name':
          query = query.order('name', { ascending: sortDirection === 'asc' });
          break;
        case 'price':
          query = query.order('price', { ascending: sortDirection === 'asc' });
          break;
        case 'quality':
          query = query.order('quality', { ascending: sortDirection === 'asc' });
          break;
      }

      const { data: productsData, error: productsError } = await query;

      if (productsError) throw productsError;

      let productsWithPromotions = productsData || [];
      
      if (settings?.show_promotions) {
        const { data: promotionsData, error: promotionsError } = await supabase
          .from('promotions')
          .select('*')
          .lte('start_date', new Date().toISOString())
          .gte('end_date', new Date().toISOString());

        if (promotionsError) throw promotionsError;

        productsWithPromotions = productsData?.map(product => {
          const promotion = promotionsData?.find(p => p.product_id === product.id);
          return {
            ...product,
            promotion: promotion ? { discount_price: promotion.discount_price } : undefined
          };
        }) || [];
      }

      setProducts(productsWithPromotions);

      if (searchTerm) {
        await trackSearch(searchTerm, productsWithPromotions, {
          category: selectedCategory,
          filters: {
            inStockOnly,
            inSeasonOnly,
            selectedQuality,
            sortBy,
            viewMode
          }
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPrice = (product: ProductWithPromotion) => {
    const currentPrice = priceDisplayMode === 'today' ? product.price : (product.tomorrow_price || product.price);
    
    if (product.promotion && settings?.show_promotions) {
      return (
        <div>
          <div className="text-lg font-bold text-green-600">
            ₪{product.promotion.discount_price}/{t(`product.per_${product.price_unit}`)}
          </div>
          <div className="text-sm text-gray-500 line-through">
            ₪{currentPrice}/{t(`product.per_${product.price_unit}`)}
          </div>
          <div className="text-sm text-red-600">
            {Math.round((1 - product.promotion.discount_price / currentPrice) * 100)}% {t('product.discount')}
          </div>
          {priceDisplayMode === 'tomorrow' && (
            <div className="text-xs text-blue-600 mt-1">
              {t('product.tomorrow_price')}
            </div>
          )}
        </div>
      );
    }
    
    return (
  <div>
    <div className="text-lg font-bold text-green-600">
      ₪{currentPrice}/{t(`product.per_${product.price_unit}`)}
    </div>
    {priceDisplayMode === 'tomorrow' && product.tomorrow_price && (
      <div className="text-xs text-blue-600 mt-1">
      מחיר עודכן
      </div>
    )}
    <div className="text-xs text-gray-500">
      {priceDisplayMode === 'today'
        ? todayDate: tomorrowDate} {/* Show tomorrow's date */}
    </div>
  </div>
);
  };

  const exportToCSV = () => {
    const wb = XLSX.utils.book_new();
    
    const wsData = products.map(product => ({
      'Name': getLocalizedName(product),
      'Description': getLocalizedDescription(product),
      'Price': `₪${product.price}`,
      'Tommorow Price': `₪${product.tomorrow_price}`,
      'Unit': product.price_unit,
      'Quality': t(`product.quality.${product.quality}`),
      'In Stock': product.in_stock ? t('product.inStock') : t('product.outOfStock'),
      'In Season': product.in_season ? t('product.inSeason') : t('product.outOfSeason')
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    XLSX.writeFile(wb, 'products.xlsx');
  };

  const exportCategorizedCSV = () => {
    const wb = XLSX.utils.book_new();
    
    const groupedProducts = products.reduce((acc, product) => {
      const category = categories.find(c => c.id === product.category)?.name || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    Object.entries(groupedProducts).forEach(([category, products]) => {
      const wsData = products.map(product => ({
        'Name': getLocalizedName(product),
        'Description': getLocalizedDescription(product),
        'Price': `₪${product.price}`,
        'Tommorow Price': `₪${product.tomorrow_price}`,
        'Unit': product.price_unit,
        'Quality': t(`product.quality.${product.quality}`),
        'In Stock': product.in_stock ? t('product.inStock') : t('product.outOfStock'),
        'In Season': product.in_season ? t('product.inSeason') : t('product.outOfSeason')
      }));

      const ws = XLSX.utils.json_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, category);
    });

    XLSX.writeFile(wb, 'products_by_category.xlsx');
  };

  const toggleSort = (field: 'name' | 'price' | 'quality') => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const getLocalizedName = (product: Product): string => {
    if (i18n.language === 'en' && product.name_en) return product.name_en;
    if (i18n.language === 'ar' && product.name_ar) return product.name_ar;
    return product.name;
  };

  const getLocalizedDescription = (product: Product): string => {
    if (i18n.language === 'en' && product.description_en) return product.description_en || '';
    if (i18n.language === 'ar' && product.description_ar) return product.description_ar || '';
    return product.description || '';
  };

  const renderViewModeButton = (mode: ViewMode, Icon: React.ElementType, label: string) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`p-2 rounded-lg ${viewMode === mode ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
      title={label}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('product.catalog_title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          {t('product.catalog_description')}
        </p>
      </div>

      <div className="mb-8 space-y-4">
        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          {/* Controls Container */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-lg border ${
                showFilters ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 text-gray-700'
              }`}
            >
              <Filter className="w-5 h-5 ml-2" />
              {t('search.filters.toggle')}
            </button>

            {/* Price Display Toggle */}
            <div className="flex items-center gap-2 border-l pl-2">
              <button
                onClick={() => setPriceDisplayMode('today')}
                className={`flex items-center px-3 py-2 rounded-lg ${
                  priceDisplayMode === 'today'
                    ? 'bg-green-100 text-green-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                מחיר היום
              </button>
              <button
                onClick={() => setPriceDisplayMode('tomorrow')}
                className={`flex items-center px-3 py-2 rounded-lg ${
                  priceDisplayMode === 'tomorrow'
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="w-4 h-4 ml-1" />
                מחיר מחר
              </button>
            </div>

            {/* View Mode Controls */}
            <div className="flex items-center gap-1 border-l pl-2">
              {renderViewModeButton('table', Table2, t('view.table'))}
              {renderViewModeButton('grid', Grid, t('view.grid'))}
              {renderViewModeButton('list', List, t('view.list'))}
              {renderViewModeButton('compact', LayoutGrid, t('view.compact'))}
            </div>

            {/* Export Controls */}
            <div className="flex items-center gap-1 border-l pl-2">
              <button
                onClick={exportToCSV}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="w-4 h-4 ml-1" />
                {t('export.all')}
              </button>
              <button
                onClick={exportCategorizedCSV}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="w-4 h-4 ml-1" />
                {t('export.byCategory')}
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">{t('search.filters.category')}</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>

              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
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
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="mr-2">{t('search.filters.inStock')}</span>
              </label>

              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={inSeasonOnly}
                  onChange={(e) => setInSeasonOnly(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="mr-2">{t('search.filters.season')}</span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => toggleSort('name')}
                className={`flex items-center px-3 py-1 rounded ${
                  sortBy === 'name' ? 'bg-green-100 text-green-600' : 'text-gray-500'
                }`}
              >
                {t('sort.name')}
                {sortBy === 'name' && (
                  sortDirection === 'asc' ? <SortAsc className="w-4 h-4 mr-1" /> : <SortDesc className="w-4 h-4 mr-1" />
                )}
              </button>
              <button
                onClick={() => toggleSort('price')}
                className={`flex items-center px-3 py-1 rounded ${
                  sortBy === 'price' ? 'bg-green-100 text-green-600' : 'text-gray-500'
                }`}
              >
                {t('sort.price')}
                {sortBy === 'price' && (
                  sortDirection === 'asc' ? <SortAsc className="w-4 h-4 mr-1" /> : <SortDesc className="w-4 h-4 mr-1" />
                )}
              </button>
              <button
                onClick={() => toggleSort('quality')}
                className={`flex items-center px-3 py-1 rounded ${
                  sortBy === 'quality' ? 'bg-green-100 text-green-600' : 'text-gray-500'
                }`}
              >
                {t('sort.quality')}
                {sortBy === 'quality' && (
                  sortDirection === 'asc' ? <SortAsc className="w-4 h-4 mr-1" /> : <SortDesc className="w-4 h-4 mr-1" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t('search.noResults')}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6">
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className={`relative bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-200 ${
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
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {getLocalizedDescription(product)}
                    </p>
                    <div className="mt-4">
                      {renderPrice(product)}
                    </div>
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
                      <span className={`text-sm px-2 py-1 rounded ${
                        product.in_season ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.in_season ? t('product.inSeason') : t('product.outOfSeason')}
                      </span>
                    </div>
                  </div>

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
          )}

          {viewMode === 'list' && (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md p-4 flex gap-4 hover:shadow-lg transition-shadow">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200'}
                    alt={getLocalizedName(product)}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {getLocalizedName(product)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {getLocalizedDescription(product)}
                    </p>
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
                      <span className={`text-sm px-2 py-1 rounded ${
                        product.in_season ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.in_season ? t('product.inSeason') : t('product.outOfSeason')}
                      </span>
                    </div>
                    <div className="mt-4">
                      {renderPrice(product)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'compact' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100'}
                    alt={getLocalizedName(product)}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {getLocalizedName(product)}
                    </h3>
                    <div className="text-sm font-bold text-green-600">
                      {renderPrice(product)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        product.quality === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                        product.quality === 'a' ? 'bg-green-100 text-green-800' :
                        product.quality === 'b' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {t(`product.quality.${product.quality}`)}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.in_stock ? t('product.inStock') : t('product.outOfStock')}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        product.in_season ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.in_season ? t('product.inSeason') : t('product.outOfSeason')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('product.name')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('product.quality_text')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('product.price')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('product.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=50'}
                            alt={getLocalizedName(product)}
                            className="w-10 h-10 rounded-full object-cover ml-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getLocalizedName(product)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getLocalizedDescription(product)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.quality === 'premium' ? 'bg-yellow-100 text -yellow-800' :
                          product.quality === 'a' ? 'bg-green-100 text-green-800' :
                          product.quality === 'b' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {t(`product.quality.${product.quality}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderPrice(product)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.in_stock ? t('product.inStock') : t('product.outOfStock')}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            product.in_season ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.in_season ? t('product.inSeason') : t('product.outOfSeason')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}