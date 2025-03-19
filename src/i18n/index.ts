import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import he from './locales/he.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      he: { translation: he },
      en: { translation: en },
      ar: { translation: ar }
    },
    lng: 'he',
    fallbackLng: 'he',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Set initial direction
document.documentElement.dir = 'rtl';
document.documentElement.lang = 'he';

export default i18n;