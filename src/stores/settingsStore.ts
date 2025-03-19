import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface WebsiteSettings {
  show_language_switcher: boolean;
  default_language: string;
  available_languages: string[];
  site_name: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  show_reviews_section: boolean;
  show_featured_products: boolean;
  show_promotions: boolean;
  business_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

interface SettingsStore {
  settings: WebsiteSettings | null;
  isLoading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
}

const defaultSettings: WebsiteSettings = {
  show_language_switcher: true,
  default_language: 'he',
  available_languages: ['he', 'en', 'ar'],
  site_name: 'יבולי הבוסתן',
  contact_email: 'contact@example.com',
  contact_phone: '050-XXX-XXXX',
  whatsapp_number: '972XXXXXXXXX',
  show_reviews_section: true,
  show_featured_products: true,
  show_promotions: true,
  business_hours: {
    monday: '06:00 - 17:00',
    tuesday: '06:00 - 17:00',
    wednesday: '06:00 - 17:00',
    thursday: '06:00 - 17:00',
    friday: '06:00 - 14:00',
    saturday: 'סגור',
    sunday: '06:00 - 17:00'
  }
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  isLoading: true,
  error: null,
  loadSettings: async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, use default settings
          set({ settings: defaultSettings, isLoading: false, error: null });
          return defaultSettings;
        } else {
          throw error;
        }
      }

      const settings = data?.settings || defaultSettings;
      set({ settings, isLoading: false, error: null });
      return settings;
    } catch (err) {
      console.error('Error loading settings:', err);
      set({ error: 'Error loading settings', isLoading: false });
      return defaultSettings;
    }
  }
}));