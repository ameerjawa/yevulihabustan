import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { trackSettingsUpdate } from '../../lib/supabase';

export default function WebsiteSettings() {
  const [settings, setSettings] = useState({
    show_language_switcher: true,
    default_language: 'he',
    available_languages: ['he', 'en', 'ar'],
    site_name: 'יבולי הבוסתן',
    contact_email: '',
    contact_phone: '',
    whatsapp_number: '',
    show_reviews_section: true,
    show_featured_products: true,
    show_promotions: true,
    business_hours: {
      sunday: '06:00 - 17:00',
      monday: '06:00 - 17:00',
      tuesday: '06:00 - 17:00',
      wednesday: '06:00 - 17:00',
      thursday: '06:00 - 17:00',
      friday: '06:00 - 14:00',
      saturday: 'סגור'
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .single();

      if (error) throw error;
      if (data?.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('שגיאה בטעינת ההגדרות');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { error } = await supabase
        .from('website_settings')
        .upsert({ id: 1, settings })
        .single();

      if (error) throw error;

      // Track settings update
      await trackSettingsUpdate(settings);

      setSuccessMessage('ההגדרות נשמרו בהצלחה');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('שגיאה בשמירת ההגדרות');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">הגדרות אתר</h1>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="w-5 h-5 ml-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 ml-2" />
          )}
          {isSaving ? 'שומר...' : 'שמור הגדרות'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-6">
          {/* General Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">הגדרות כלליות</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם האתר
                </label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  דואר אלקטרוני ליצירת קשר
                </label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  טלפון ליצירת קשר
                </label>
                <input
                  type="tel"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מספר וואטסאפ
                </label>
                <input
                  type="tel"
                  value={settings.whatsapp_number}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="972XXXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h2 className="text-lg font-semibold mb-4">הגדרות תצוגה</h2>
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.show_language_switcher}
                    onChange={(e) => setSettings({ ...settings, show_language_switcher: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="mr-2 text-sm text-gray-700">הצג בורר שפות</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.show_reviews_section}
                    onChange={(e) => setSettings({ ...settings, show_reviews_section: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="mr-2 text-sm text-gray-700">הצג מדור ביקורות</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.show_featured_products}
                    onChange={(e) => setSettings({ ...settings, show_featured_products: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="mr-2 text-sm text-gray-700">הצג מוצרים מובילים</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.show_promotions}
                    onChange={(e) => setSettings({ ...settings, show_promotions: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="mr-2 text-sm text-gray-700">הצג מבצעים</span>
                </label>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h2 className="text-lg font-semibold mb-4">שעות פעילות</h2>
            <div className="space-y-4">
              {Object.entries(settings.business_hours).map(([day, hours]) => (
                <div key={day}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {day === 'sunday' && 'ראשון'}
                    {day === 'monday' && 'שני'}
                    {day === 'tuesday' && 'שלישי'}
                    {day === 'wednesday' && 'רביעי'}
                    {day === 'thursday' && 'חמישי'}
                    {day === 'friday' && 'שישי'}
                    {day === 'saturday' && 'שבת'}
                  </label>
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => setSettings({
                      ...settings,
                      business_hours: {
                        ...settings.business_hours,
                        [day]: e.target.value
                      }
                    })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="00:00 - 00:00"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}