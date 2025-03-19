import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { supabase } from '../lib/supabase';

export default function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();

  const handleProductsClick = async () => {
    try {
      await supabase
        .from('product_watches')
        .insert([{ timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error tracking product watch:', error);
    }
    navigate('/products');
  };

  if (!settings) return null;

  // Format WhatsApp number for universal compatibility
  const formatWhatsAppLink = (number: string) => {
    // Remove any non-digit characters
    const cleanNumber = number.replace(/\D/g, '');
    // Ensure number starts with country code
    const formattedNumber = cleanNumber.startsWith('972') ? cleanNumber : `972${cleanNumber}`;
    return `https://api.whatsapp.com/send?phone=${formattedNumber}`;
  };

  return (
    <div className="relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2000")',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        {/* Kosher Badge */}
        <div className="absolute top-4 left-4 bg-white text-green-600 px-4 py-2 rounded-full font-bold text-lg shadow-lg">
          כשר
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl">
          {t('hero.title')}
        </h1>
        <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-100 max-w-2xl">
          {t('hero.subtitle')}
        </p>
        <div className="mt-6 sm:mt-8 md:mt-10 flex flex-wrap gap-4">
          <button
            onClick={handleProductsClick}
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-base sm:text-lg font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            {t('hero.cta.view_products')}
          </button>
          <a
            href={formatWhatsAppLink(settings.whatsapp_number)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-base sm:text-lg font-medium rounded-md text-green-600 bg-white hover:bg-gray-50 transition-colors"
          >
            {t('hero.cta.contact_whatsapp')}
          </a>
        </div>
      </div>
    </div>
  );
}