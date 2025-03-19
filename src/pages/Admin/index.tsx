import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Tag, BarChart, Settings, Menu, X, FileText, Building2, Briefcase } from 'lucide-react';

import AdminHeader from '../../components/AdminHeader';
import Dashboard from './Dashboard';
import Products from './Products';
import Categories from './Categories';
import Reviews from './Reviews';
import Promotions from './Promotions';
import WebsiteSettings from './WebsiteSettings';
import CustomerTypes from './CustomerTypes';
import Services from './Services';
import Sections from './Sections';

export default function Admin() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const NavLink = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Link
      to={to}
      onClick={() => setIsSidebarOpen(false)}
      className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-50 hover:text-green-700"
    >
      <Icon className="w-5 h-5 ml-2" />
      {children}
    </Link>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 right-0 w-64 bg-white shadow-md z-30
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">תפריט ניהול</h2>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-4">
          <NavLink to="/admin" icon={LayoutDashboard}>לוח בקרה</NavLink>
          <NavLink to="/admin/products" icon={Package}>מוצרים</NavLink>
          <NavLink to="/admin/categories" icon={Tag}>קטגוריות</NavLink>
          <NavLink to="/admin/promotions" icon={BarChart}>מבצעים</NavLink>
          <NavLink to="/admin/reviews" icon={Users}>ביקורות</NavLink>
          <NavLink to="/admin/customer-types" icon={Building2}>סוגי לקוחות</NavLink>
          <NavLink to="/admin/services" icon={Briefcase}>שירותים</NavLink>
          <NavLink to="/admin/sections" icon={FileText}>מדורים</NavLink>
          <NavLink to="/admin/settings" icon={Settings}>הגדרות אתר</NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="customer-types" element={<CustomerTypes />} />
            <Route path="services" element={<Services />} />
            <Route path="sections" element={<Sections />} />
            <Route path="settings" element={<WebsiteSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}