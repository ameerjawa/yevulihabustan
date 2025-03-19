import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Sprout } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettingsStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'rtl';
    document.documentElement.lang = lng;
  };

  if (!settings) return null;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="flex items-center gap-3">
              <img src="../src/1236.png" alt="test" className="h-10 w-10" />
              <div className="flex flex-col">
                  <div className="text-3xl font-extrabold" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                    <span className="text-green-600">יבולי הבוסתן</span>
                  </div>
                  <div className="text-sm text-gray-500 font-bold tracking-widest -mt-1">
                    YEVULEI HABUSTAN
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex space-x-4">
              <Link to="/" className="text-gray-700 hover:text-green-600 px-3 py-2">
                {t('nav.home')}
              </Link>
              <Link to="/products" className="text-gray-700 hover:text-green-600 px-3 py-2">
                {t('nav.products')}
              </Link>
            </nav>

            {settings.show_language_switcher && (
              <div className="flex space-x-2 mr-4">
                {settings.available_languages.includes('he') && (
                  <button
                    onClick={() => changeLanguage('he')}
                    className={`px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                      i18n.language === 'he' ? 'bg-green-100 text-green-800' : ''
                    }`}
                  >
                    עב
                  </button>
                )}
                {settings.available_languages.includes('en') && (
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                      i18n.language === 'en' ? 'bg-green-100 text-green-800' : ''
                    }`}
                  >
                    EN
                  </button>
                )}
                {settings.available_languages.includes('ar') && (
                  <button
                    onClick={() => changeLanguage('ar')}
                    className={`px-2 py-1 text-sm rounded hover:bg-gray-100 ${
                      i18n.language === 'ar' ? 'bg-green-100 text-green-800' : ''
                    }`}
                  >
                    عر
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-white border-t border-gray-200`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/products"
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            onClick={() => setIsMenuOpen(false)}
          >
            {t('nav.products')}
          </Link>
        </div>

        {settings.show_language_switcher && (
          <div className="px-5 py-3 border-t border-gray-200">
            <div className="flex space-x-2">
              {settings.available_languages.includes('he') && (
                <button
                  onClick={() => {
                    changeLanguage('he');
                    setIsMenuOpen(false);
                  }}
                  className={`px-3 py-1 text-sm rounded ${
                    i18n.language === 'he' ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100'
                  }`}
                >
                  עב
                </button>
              )}
              {settings.available_languages.includes('en') && (
                <button
                  onClick={() => {
                    changeLanguage('en');
                    setIsMenuOpen(false);
                  }}
                  className={`px-3 py-1 text-sm rounded ${
                    i18n.language === 'en' ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100'
                  }`}
                >
                  EN
                </button>
              )}
              {settings.available_languages.includes('ar') && (
                <button
                  onClick={() => {
                    changeLanguage('ar');
                    setIsMenuOpen(false);
                  }}
                  className={`px-3 py-1 text-sm rounded ${
                    i18n.language === 'ar' ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100'
                  }`}
                >
                  عر
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}