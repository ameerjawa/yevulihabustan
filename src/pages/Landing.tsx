import React, { useEffect } from 'react';
import Hero from '../components/Hero';
import ProductCatalog from '../components/ProductCatalog';
import FeaturedProducts from '../components/FeaturedProducts';
import Testimonials from '../components/Testimonials';
import ContactCTA from '../components/ContactCTA';
import Services from '../components/Services';
import CustomerTypes from '../components/CustomerTypes';
import { useSettingsStore } from '../stores/settingsStore';

export default function Landing() {
  const { settings, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (!settings) return null;

  return (
    <div className="min-h-screen">
      <Hero />
      <div className="bg-white py-16">
        <Services />
      </div>
      <div className="bg-gray-50 py-16">
        <CustomerTypes />
      </div>
      <div className="bg-white py-16">
        <ProductCatalog />
      </div>
      {settings.show_featured_products && (
        <div className="bg-gray-50 py-16">
          <FeaturedProducts />
        </div>
      )}
      {settings.show_reviews_section && (
        <div className="bg-white py-16">
          <Testimonials />
        </div>
      )}
      <ContactCTA />
    </div>
  );
}