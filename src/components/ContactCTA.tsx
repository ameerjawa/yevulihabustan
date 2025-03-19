import React from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';

export default function ContactCTA() {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();

  if (!settings) return null;

  return (
    <section className="bg-green-600 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            {t('contact.title')}
          </h2>
          <p className="text-xl text-green-100 mb-12 max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <a
              href={`tel:${settings.contact_phone}`}
              className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg hover:transform hover:scale-105 transition-transform"
            >
              <Phone className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('contact.call_us')}
              </h3>
              <p className="text-gray-600">{settings.contact_phone}</p>
            </a>

            <a
              href={`https://wa.me/${settings.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg hover:transform hover:scale-105 transition-transform"
            >
              <MessageCircle className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('contact.whatsapp')}
              </h3>
              <p className="text-gray-600">{t('contact.send_message')}</p>
            </a>

            <a
              href={`mailto:${settings.contact_email}`}
              className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg hover:transform hover:scale-105 transition-transform"
            >
              <Mail className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('contact.email')}
              </h3>
              <p className="text-gray-600">{settings.contact_email}</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}