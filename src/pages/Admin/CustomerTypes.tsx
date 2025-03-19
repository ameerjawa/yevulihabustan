import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { CustomerType } from '../../types';

export default function CustomerTypes() {
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingType, setEditingType] = useState<CustomerType | null>(null);
  const [newType, setNewType] = useState({
    name: '',
    name_en: '',
    name_ar: '',
    description: '',
    description_en: '',
    description_ar: '',
    icon: 'building',
    is_visible: true
  });

  useEffect(() => {
    fetchCustomerTypes();
  }, []);

  const fetchCustomerTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerTypes(data || []);
    } catch (error) {
      console.error('Error fetching customer types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddType = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_types')
        .insert([newType])
        .select()
        .single();

      if (error) throw error;

      setCustomerTypes([data, ...customerTypes]);
      setShowAddModal(false);
      setNewType({
        name: '',
        name_en: '',
        name_ar: '',
        description: '',
        description_en: '',
        description_ar: '',
        icon: 'building',
        is_visible: true
      });
    } catch (error) {
      console.error('Error adding customer type:', error);
    }
  };

  const handleUpdateType = async (id: string, updates: Partial<CustomerType>) => {
    try {
      const { data, error } = await supabase
        .from('customer_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCustomerTypes(customerTypes.map(t => t.id === id ? data : t));
      setEditingType(null);
    } catch (error) {
      console.error('Error updating customer type:', error);
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק סוג לקוח זה?')) return;

    try {
      const { error } = await supabase
        .from('customer_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomerTypes(customerTypes.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting customer type:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול סוגי לקוחות</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5 ml-2" />
          הוסף סוג לקוח חדש
        </button>
      </div>

      {/* Customer Types Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  שם
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תיאור
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
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : customerTypes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    לא נמצאו סוגי לקוחות
                  </td>
                </tr>
              ) : (
                customerTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {type.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {type.name_en} / {type.name_ar}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {type.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        type.is_visible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {type.is_visible ? 'מוצג' : 'מוסתר'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingType(type)}
                        className="text-indigo-600 hover:text-indigo-900 ml-3"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteType(type.id)}
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

      {/* Add Customer Type Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">הוספת סוג לקוח חדש</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם בעברית</label>
                  <input
                    type="text"
                    value={newType.name}
                    onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם באנגלית</label>
                  <input
                    type="text"
                    value={newType.name_en}
                    onChange={(e) => setNewType({ ...newType, name_en: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם בערבית</label>
                  <input
                    type="text"
                    value={newType.name_ar}
                    onChange={(e) => setNewType({ ...newType, name_ar: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיאור בעברית</label>
                  <textarea
                    value={newType.description}
                    onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיאור באנגלית</label>
                  <textarea
                    value={newType.description_en}
                    onChange={(e) => setNewType({ ...newType, description_en: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיאור בערבית</label>
                  <textarea
                    value={newType.description_ar}
                    onChange={(e) => setNewType({ ...newType, description_ar: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אייקון</label>
                  <input
                    type="text"
                    value={newType.icon}
                    onChange={(e) => setNewType({ ...newType, icon: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newType.is_visible}
                      onChange={(e) => setNewType({ ...newType, is_visible: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="mr-2 text-sm text-gray-700">מוצג באתר</span>
                  </label>
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
                  onClick={handleAddType}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  הוסף סוג לקוח
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Type Modal */}
      {editingType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">עריכת סוג לקוח</h2>
                <button onClick={() => setEditingType(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם בעברית</label>
                  <input
                    type="text"
                    value={editingType.name}
                    onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם באנגלית</label>
                  <input
                    type="text"
                    value={editingType.name_en}
                    onChange={(e) => setEditingType({ ...editingType, name_en: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם בערבית</label>
                  <input
                    type="text"
                    value={editingType.name_ar}
                    onChange={(e) => setEditingType({ ...editingType, name_ar: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיאור בעברית</label>
                  <textarea
                    value={editingType.description}
                    onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיאור באנגלית</label>
                  <textarea
                    value={editingType.description_en}
                    onChange={(e) => setEditingType({ ...editingType, description_en: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תיאור בערבית</label>
                  <textarea
                    value={editingType.description_ar}
                    onChange={(e) => setEditingType({ ...editingType, description_ar: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אייקון</label>
                  <input
                    type="text"
                    value={editingType.icon}
                    onChange={(e) => setEditingType({ ...editingType, icon: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingType.is_visible}
                      onChange={(e) => setEditingType({ ...editingType, is_visible: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="mr-2 text-sm text-gray-700">מוצג באתר</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingType(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ביטול
                </button>
                <button
                  onClick={() => handleUpdateType(editingType.id, editingType)}
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