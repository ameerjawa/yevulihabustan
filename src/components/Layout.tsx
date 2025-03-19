import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl" lang="he">
      <Navbar />
      <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}