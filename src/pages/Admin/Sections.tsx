import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AboutContent } from '../../types';

export default function Sections() {
  const [sections, setSections] = useState<AboutContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState<AboutContent | null>(null);
  const [newSection, setNewSection] = useState({
    title: '',
    title_en: '',
    title_ar: '',
    content: '',
    content_en: '',
    content_ar: '',
    image: '',
    section: 'main' as 'main' | 'vision' | 'advantages',
    order: 0
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSection = async () => {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .insert([newSection])
        .select()
        .single();

      if (error) throw error;

      setSections([...sections, data]);
      setShowAddModal(false);
      setNewSection({
        title: '',
        title_en: '',
        title_ar: '',
        content: '',
        content_en: '',
        content_ar: '',
        image: '',
        section: 'main',
        order: 0
      });
    } catch (error) {
      console.error('Error adding section:', error);
    }
  };

  const handleUpdateSection = async (id: string, updates: Partial<AboutContent>) => {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSections(sections.map(s => s.id === id ? data : s));
      setEditingSection(null);
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק מדור זה?')) return;

    try {
      const { error } = await supabase
        .from('about_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSections(sections.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול מדורים</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-5 h-5 ml-2" />
          הוסף מדור חדש
        </button>
      </div>

      {/* Sections Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  כותרת
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סוג
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סדר
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
              ) : sections.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    לא נמצאו מדורים
                  </td>
                </tr>
              ) : (
                sections.map((section) => (
                  <tr key={section.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {section.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {section.title_en} / {section.title_ar}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        section.section === 'main' ? 'bg-blue-100 text-blue-800' :
                        section.section === 'vision' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {section.section === 'main' ? 'ראשי' :
                         section.section === 'vision' ? 'חזון' :
                         'יתרונות'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{section.order}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditingSection(section)}
                        className="text-indigo-600 hover:text-indigo-900 ml-3"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
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

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">הוספת מדור חדש</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כותרת בעברית</label>
                  <input
                    type="text"
                    value={newSection.title}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כותרת באנגלית</label>
                  <input
                    type="text"
                    value={newSection.title_en}
                    onChange={(e) => setNewSection({ ...newSection, title_en: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כותרת בערבית</label>
                  <input
                    type="text"
                    value={newSection.title_ar}
                    onChange={(e) => setNewSection({ ...newSection, title_ar: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תוכן בעברית</label>
                  <textarea
                    value={newSection.content}
                    onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תוכן באנגלית</label>
                  <textarea
                    value={newSection.content_en}
                    onChange={(e) => setNewSection({ ...newSection, content_en: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תוכן בערבית</label>
                  <textarea
                    value={newSection.content_ar}
                    onChange={(e) => setNewSection({ ...newSection, content_ar: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">קישור לתמונה</label>
                  <input
                    type="text"
                    value={newSection.image}
                    onChange={(e) => setNewSection({ ...newSection, image: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סוג מדור</label>
                  <select
                    value={newSection.section}
                    onChange={(e) => setNewSection({ ...newSection, section: e.target.value as 'main' | 'vision' | 'advantages' })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  >
                    <option value="main">ראשי</option>
                    <option value="vision">חזון</option>
                    <option value="advantages">יתרונות</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סדר הצגה</label>
                  <input
                    type="number"
                    value={newSection.order}
                    onChange={(e) => setNewSection({ ...newSection, order: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    min="0"
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
                  onClick={handleAddSection}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  הוסף מדור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">עריכת מדור</h2>
                <button onClick={() => setEditingSection(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כותרת בעברית</label>
                  <input
                    type="text"
                    value={editingSection.title || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כותרת באנגלית</label>
                  <input
                    type="text"
                    value={editingSection.title_en || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, title_en: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">כותרת בערבית</label>
                  <input
                    type="text"
                    value={editingSection.title_ar || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, title_ar: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תוכן בעברית</label>
                  <textarea
                    value={editingSection.content || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תוכן באנגלית</label>
                  <textarea
                    value={editingSection.content_en || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, content_en: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תוכן בערבית</label>
                  <textarea
                    value={editingSection.content_ar || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, content_ar: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">קישור לתמונה</label>
                  <input
                    type="text"
                    value={editingSection.image || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, image: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סוג מדור</label>
                  <select
                    value={editingSection.section}
                    onChange={(e) => setEditingSection({ ...editingSection, section: e.target.value as 'main' | 'vision' | 'advantages' })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  >
                    <option value="main">ראשי</option>
                    <option value="vision">חזון</option>
                    <option value="advantages">יתרונות</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סדר הצגה</label>
                  <input
                    type="number"
                    value={editingSection.order || 0}
                    onChange={(e) => setEditingSection({ ...editingSection, order: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    min="0"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  ביטול
                </button>
                <button
                  onClick={() => handleUpdateSection(editingSection.id, editingSection)}
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