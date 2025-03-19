import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, RefreshCw, Filter, Download,Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';
import * as XLSX from 'xlsx';
import LiveTime from '../../components/LiveTime';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    quality: '',
    inStock: false,
    inSeason: false,
    search: ''
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    name_en: '',
    name_ar: '',
    description: '',
    description_en: '',
    description_ar: '',
    price: 0,
    tomorrow_price: null as number | null,
    price_unit: 'kg' as const,
    category: '',
    quality: 'a' as const,
    in_stock: true,
    in_season: true,
    image: ''
  });

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').order('name')
      ]);

      if (productsResponse.error) throw productsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      setProducts(productsResponse.data || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!newProduct.name || !newProduct.category || !newProduct.price || newProduct.price <= 0) {
        alert('נא למלא את כל השדות הנדרשים');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .insert([{
          ...newProduct,
          name_en: newProduct.name_en || newProduct.name,
          name_ar: newProduct.name_ar || newProduct.name,
          description_en: newProduct.description_en || newProduct.description,
          description_ar: newProduct.description_ar || newProduct.description,
          image: newProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800'
        }])
        .select()
        .single();

      if (error) throw error;

      setProducts([data, ...products]);
      setShowAddModal(false);
      setNewProduct({
        name: '',
        name_en: '',
        name_ar: '',
        description: '',
        description_en: '',
        description_ar: '',
        price: 0,
        tomorrow_price: null,
        price_unit: 'kg',
        category: '',
        quality: 'a',
        in_stock: true,
        in_season: true,
        image: ''
      });
    } catch (error) {
      console.error('Error adding product:', error);
      alert('שגיאה בהוספת המוצר');
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProducts(products.map(p => p.id === id ? data : p));
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('שגיאה בעדכון המוצר');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('שגיאה במחיקת המוצר');
    }
  };

  const exportToCSV = () => {
    const wb = XLSX.utils.book_new();
    
    const wsData = products.map(product => ({
      'Name': product.name,
      'Name (English)': product.name_en,
      'Name (Arabic)': product.name_ar,
      'Description': product.description,
      'Description (English)': product.description_en,
      'Description (Arabic)': product.description_ar,
      'Today Price': `₪${product.price}`,
      'Tomorrow Price': product.tomorrow_price ? `₪${product.tomorrow_price}` : 'Not set',
      'Unit': product.price_unit,
      'Quality': product.quality,
      'Category': categories.find(c => c.id === product.category)?.name || '',
      'In Stock': product.in_stock ? 'Yes' : 'No',
      'In Season': product.in_season ? 'Yes' : 'No',
      'Last Price Update': product.price_updated_at ? new Date(product.price_updated_at).toLocaleString() : 'N/A'
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
        'Name': product.name,
        'Name (English)': product.name_en,
        'Name (Arabic)': product.name_ar,
        'Today Price': `₪${product.price}`,
        'Tomorrow Price': product.tomorrow_price ? `₪${product.tomorrow_price}` : 'Not set',
        'Unit': product.price_unit,
        'Quality': product.quality,
        'In Stock': product.in_stock ? 'Yes' : 'No',
        'In Season': product.in_season ? 'Yes' : 'No',
        'Last Price Update': product.price_updated_at ? new Date(product.price_updated_at).toLocaleString() : 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, category);
    });

    XLSX.writeFile(wb, 'products_by_category.xlsx');
  };

  const filteredProducts = products.filter(product => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.quality && product.quality !== filters.quality) return false;
    if (filters.inStock && !product.in_stock) return false;
    if (filters.inSeason && !product.in_season) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchTerm) ||
        product.name_en.toLowerCase().includes(searchTerm) ||
        product.name_ar.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  return (
    <div className="p-6 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">ניהול מוצרים</h1>
        <div className="text-sm text-gray-600 flex items-center gap-2">
  <Clock className="w-4 h-4" />
  <LiveTime />
</div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 ${
              showFilters ? 'bg-green-50 border-green-500 text-green-700' : ''
            }`}
          >
            <Filter className="w-4 h-4 ml-1.5" />
            סינון
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 ml-1.5" />
            ייצא לאקסל
          </button>
          <button
            onClick={exportCategorizedCSV}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 ml-1.5" />
            ייצא לפי קטגוריות
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4 ml-1.5" />
            הוסף מוצר חדש
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">חיפוש</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="חפש לפי שם או תיאור..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">כל הקטגוריות</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">איכות</label>
              <select
                value={filters.quality}
                onChange={(e) => setFilters({ ...filters, quality: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">כל האיכויות</option>
                <option value="premium">פרימיום</option>
                <option value="a">סוג א׳</option>
                <option value="b">סוג ב׳</option>
                <option value="c">סוג ג׳</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="mr-2">במלאי בלבד</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.inSeason}
                    onChange={(e) => setFilters({ ...filters, inSeason: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="mr-2">בעונה בלבד</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  שם
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קטגוריה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
      מחיר היום {todayDate}
    </th>
    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
      מחיר מחר {tomorrowDate}
    </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  איכות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    לא נמצאו מוצרים
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100'}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover ml-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.name_en} / {product.name_ar}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {categories.find(c => c.id === product.category)?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        ₪{product.price}/{product.price_unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.price_updated_at ? 
                          `עודכן: ${new Date(product.price_updated_at).toLocaleDateString()}` : 
                          'לא עודכן'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {product.tomorrow_price ? 
                          `₪${product.tomorrow_price}/${product.price_unit}` : 
                          'לא נקבע'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        product.quality === 'premium' ? 'bg-yellow-100 text-yellow-800' :
                        product.quality === 'a' ? 'bg-green-100 text-green-800' :
                        product.quality === 'b' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {product.quality === 'premium' ? 'פרימיום' :
                         product.quality === 'a' ? 'סוג א׳' :
                         product.quality === 'b' ? 'סוג ב׳' :
                         'סוג ג׳'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.in_stock ? 'במלאי' : 'אזל מהמלאי'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          product.in_season ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.in_season ? 'בעונה' : 'לא בעונה'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-indigo-600 hover:text-indigo-900 ml-3"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">הוספת מוצר חדש</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם בעברית</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם באנגלית</label>
                    <input
                      type="text"
                      value={newProduct.name_en}
                      onChange={(e) => setNewProduct({ ...newProduct, name_en: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם בערבית</label>
                    <input
                      type="text"
                      value={newProduct.name_ar}
                      onChange={(e) => setNewProduct({ ...newProduct, name_ar: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור בעברית</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור באנגלית</label>
                    <textarea
                      value={newProduct.description_en}
                      onChange={(e) => setNewProduct({ ...newProduct, description_en: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור בערבית</label>
                    <textarea
                      value={newProduct.description_ar}
                      onChange={(e) => setNewProduct({ ...newProduct, description_ar: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">בחר קטגוריה</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מחיר היום</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={newProduct.price || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      />
                      <select
                        value={newProduct.price_unit}
                        onChange={(e) => setNewProduct({ ...newProduct, price_unit: e.target.value as 'kg' | 'g' | 'unit' })}
                        className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      >
                        <option value="kg">ק"ג</option>
                        <option value="g">גרם</option>
                        <option value="unit">יחידה</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מחיר מחר</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={newProduct.tomorrow_price || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, tomorrow_price: parseFloat(e.target.value) || null })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="השאר ריק אם אין שינוי"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">איכות</label>
                    <select
                      value={newProduct.quality}
                      onChange={(e) => setNewProduct({ ...newProduct, quality: e.target.value as 'premium' | 'a' | 'b' | 'c' })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    > ```jsx
                      <option value="premium">פרימיום</option>
                      <option value="a">סוג א׳</option>
                      <option value="b">סוג ב׳</option>
                      <option value="c">סוג ג׳</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">קישור לתמונה</label>
                    <input
                      type="text"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.in_stock}
                        onChange={(e) => setNewProduct({ ...newProduct, in_stock: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="mr-2 text-sm text-gray-700">במלאי</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newProduct.in_season}
                        onChange={(e) => setNewProduct({ ...newProduct, in_season: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="mr-2 text-sm text-gray-700">בעונה</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-6 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ביטול
                </button>
                <button
                  onClick={handleAddProduct}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  הוסף מוצר
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">עריכת מוצר</h2>
              <button onClick={() => setEditingProduct(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם בעברית</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם באנגלית</label>
                    <input
                      type="text"
                      value={editingProduct.name_en}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name_en: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם בערבית</label>
                    <input
                      type="text"
                      value={editingProduct.name_ar}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name_ar: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור בעברית</label>
                    <textarea
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור באנגלית</label>
                    <textarea
                      value={editingProduct.description_en || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description_en: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור בערבית</label>
                    <textarea
                      value={editingProduct.description_ar || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description_ar: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מחיר היום</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={editingProduct.price || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      />
                      <select
                        value={editingProduct.price_unit}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price_unit: e.target.value as 'kg' | 'g' | 'unit' })}
                        className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      >
                        <option value="kg">ק"ג</option>
                        <option value="g">גרם</option>
                        <option value="unit">יחידה</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">מחיר מחר</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editingProduct.tomorrow_price || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, tomorrow_price: parseFloat(e.target.value) || null })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="השאר ריק אם אין שינוי"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">איכות</label>
                    <select
                      value={editingProduct.quality}
                      onChange={(e) => setEditingProduct({ ...editingProduct, quality: e.target.value as 'premium' | 'a' | 'b' | 'c' })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    >
                      <option value="premium">פרימיום</option>
                      <option value="a">סוג א׳</option>
                      <option value="b">סוג ב׳</option>
                      <option value="c">סוג ג׳</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">קישור לתמונה</label>
                    <input
                      type="text"
                      value={editingProduct.image || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingProduct.in_stock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, in_stock: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="mr-2 text-sm text-gray-700">במלאי</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingProduct.in_season}
                        onChange={(e) => setEditingProduct({ ...editingProduct, in_season: e.target.checked })}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="mr-2 text-sm text-gray-700">בעונה</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-6 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ביטול
                </button>
                <button
                  onClick={() => handleUpdateProduct(editingProduct.id, editingProduct)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}