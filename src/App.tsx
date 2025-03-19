import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSettingsStore } from './stores/settingsStore';

// Pages
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import AdminLogin from './components/AdminLogin';
import ProductCatalog from './components/ProductCatalog';
import About from './pages/About';

// Components
import Layout from './components/Layout';
import AdminRoute from './components/AdminRoute';

function App() {
  const { loadSettings } = useSettingsStore();

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="products" element={<ProductCatalog />} />
          <Route path="about" element={<About />} />
          <Route path="admin/login" element={<AdminLogin />} />
          <Route
            path="admin/*"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;