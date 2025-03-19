import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, RefreshCw, X, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Promotion, Product } from '../../types';

function Promotions() {
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState<(Promotion & { product: Product })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<(Promotion & { product: Product }) | null>(null);
  const [newPromotion, setNewPromotion] = useState({
    product_id: '',
    discount_price: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch products first
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsData) {
        setProducts(productsData);
      }

      // Fetch promotions with product details
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select(`
          *,
          product:products (*)
        `)
        .order('start_date', { ascending: false });

      if (promotionsError) throw promotionsError;

      if (promotionsData) {
        setPromotions(promotionsData as (Promotion & { product: Product })[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPromotion = async () => {
    try {
      if (!newPromotion.product_id) {
        alert('נא לבחור מוצר');
        return;
      }
      if (newPromotion.discount_price <= 0) {
        alert('נא להזין מחיר מבצע תקין');
        return;
      }

      const { data, error } = await supabase
        .from('promotions')
        .insert([newPromotion])
        .select(`
          *,
          product:products (*)
        `)
        .single();

      if (error) throw error;

      setPromotions([data as (Promotion & { product: Product }), ...promotions]);
      setShowAddModal(false);
      setNewPromotion({
        product_id: '',
        discount_price: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error adding promotion:', error);
      alert('שגיאה בהוספת המבצע');
    }
  };

  const handleUpdatePromotion = async (id: string, updates: Partial<Promotion>) => {
    try {
      if (updates.discount_price && updates.discount_price <= 0) {
        alert('נא להזין מחיר מבצע תקין');
        return;
      }

      const { data, error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          product:products (*)
        `)
        .single();

      if (error) throw error;

      setPromotions(promotions.map(p => p.id === id ? (data as (Promotion & { product: Product })) : p));
      setEditingPromotion(null);
    } catch (error) {
      console.error('Error updating promotion:', error);
      alert('שגיאה בעדכון המבצע');
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק מבצע זה?')) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPromotions(promotions.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('שגיאה במחיקת המבצע');
    }
  };

  const isPromotionActive = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.start_date);
    const end = new Date(promotion.end_date);
    return now >= start && now <= end;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול מבצעים</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5 ml-2" />
          הוסף מבצע חדש
        </button>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  מוצר
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  מחיר רגיל
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  מחיר מבצע
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תאריך התחלה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תאריך סיום
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
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    לא נמצאו מבצעים
                  </td>
                </tr>
              ) : (
                promotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={promotion.product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100'}
                          alt={promotion.product.name}
                          className="w-10 h-10 rounded-lg object-cover ml-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {promotion.product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {promotion.product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₪{promotion.product.price}/ק"ג</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">₪{promotion.discount_price}/ק"ג</div>
                      <div className="text-xs text-gray-500">
                        {Math.round((1 - promotion.discount_price / promotion.product.price) * 100)}% הנחה
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(promotion.start_date).toLocaleDateString('he-IL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(promotion.end_date).toLocaleDateString('he-IL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isPromotionActive(promotion)
                          ? 'bg-green-100 text-green-800'
                          : new Date(promotion.start_date) > new Date()
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isPromotionActive(promotion)
                          ? 'פעיל'
                          : new Date(promotion.start_date) > new Date()
                          ? 'מתוכנן'
                          : 'הסתיים'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setEditingPromotion(promotion)}
                        className="text-indigo-600 hover:text-indigo-900 ml-3"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePromotion(promotion.id)}
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

      {/* Add Promotion Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">הוספת מבצע חדש</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מוצר</label>
                  <select
                    value={newPromotion.product_id}
                    onChange={(e) => setNewPromotion({ ...newPromotion, product_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">בחר מוצר</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ₪{product.price}/ק"ג
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מחיר מבצע לק"ג</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newPromotion.discount_price || ''}
                    onChange={(e) => setNewPromotion({ ...newPromotion, discount_price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך התחלה</label>
                  <input
                    type="date"
                    value={newPromotion.start_date}
                    onChange={(e) => setNewPromotion({ ...newPromotion, start_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך סיום</label>
                  <input
                    type="date"
                    value={newPromotion.end_date}
                    onChange={(e) => setNewPromotion({ ...newPromotion, end_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ביטול
                </button>
                <button
                  onClick={handleAddPromotion}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  הוסף מבצע
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Promotion Modal */}
      {editingPromotion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">עריכת מבצע</h2>
                <button onClick={() => setEditingPromotion(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מוצר</label>
                  <select
                    value={editingPromotion.product_id}
                    onChange={(e) => setEditingPromotion({ ...editingPromotion, product_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ₪{product.price}/ק"ג
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מחיר מבצע לק"ג</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingPromotion.discount_price || ''}
                    onChange={(e) => setEditingPromotion({ ...editingPromotion, discount_price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך התחלה</label>
                  <input
                    type="date"
                    value={editingPromotion.start_date.split('T')[0]}
                    onChange={(e) => setEditingPromotion({ ...editingPromotion, start_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך סיום</label>
                  <input
                    type="date"
                    value={editingPromotion.end_date.split('T')[0]}
                    onChange={(e) => setEditingPromotion({ ...editingPromotion, end_date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingPromotion(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ביטול
                </button>
                <button
                  onClick={() => handleUpdatePromotion(editingPromotion.id, {
                    product_id: editingPromotion.product_id,
                    discount_price: editingPromotion.discount_price,
                    start_date: editingPromotion.start_date,
                    end_date: editingPromotion.end_date
                  })}
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

export default Promotions;