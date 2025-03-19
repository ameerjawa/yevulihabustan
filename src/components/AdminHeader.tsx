import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, ExternalLink } from 'lucide-react';
import { logoutAdmin } from '../lib/supabase';

export default function AdminHeader() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">מערכת ניהול</h1>
        
        <div className="flex items-center gap-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            צפה באתר
            <ExternalLink className="w-4 h-4 mr-2" />
          </a>
          
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <span className="mr-2">מנהל מערכת</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showDropdown && (
              <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="w-4 h-4 ml-2" />
                    התנתק
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}