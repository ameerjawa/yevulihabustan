import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sprout } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

export default function Footer() {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();

  if (!settings) return null;

  const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="col-span-1">
            <div className="flex items-center mb-4">
              <Sprout className="h-8 w-8 text-green-500" />
              <span className="mr-2 text-xl font-bold">
                {settings.site_name}
              </span>
            </div>
            <p className="text-gray-400 max-w-md text-sm sm:text-base">
              {t('hero.subtitle')}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold mb-4">{t('footer.business_hours')}</h3>
            <ul className="space-y-2 text-sm sm:text-base text-gray-400">
              {daysOrder.map(day => (
                <li key={day} className="flex justify-between">
                  <span>{t(`footer.days.${day}`)}</span>
                  <span>{settings.business_hours[day]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.quick_links')}</h3>
            <ul className="space-y-2 text-sm sm:text-base">
              <li>
                <a href="/" className="text-gray-400 hover:text-white transition-colors">
                  {t('nav.home')}
                </a>
              </li>
              <li>
                <a href="/products" className="text-gray-400 hover:text-white transition-colors">
                  {t('nav.products')}
                </a>
              </li>
              <li>
                <a 
                  href={`https://wa.me/${settings.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {t('nav.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-8 text-center text-sm sm:text-base text-gray-400">
          <p>© {new Date().getFullYear()} {settings.site_name}. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}