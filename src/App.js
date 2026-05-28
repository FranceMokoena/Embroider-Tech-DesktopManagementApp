import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './HomeDashboard.css';
import AdminLogin from './AdminLogin';
import AdminRegister from './AdminRegister';
import { ToastProvider } from './context/ToastContext';
import { AssetProvider } from './context/AssetContext';
import ERPLayout from './components/ERPLayout';
import Dashboard from './pages/Dashboard';
import AssetRegistry from './pages/AssetRegistry';
import RfidVerification from './pages/RfidVerification';
import Sections from './pages/Sections';
import Transfers from './pages/Transfers';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';
import Settings from './pages/Settings';
import AssetDetails from './pages/AssetDetails';
import { getStoredAuth } from './services/authStorage';

function ProtectedERP() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getStoredAuth()
      .then(auth => {
        if (isMounted) setIsAuthenticated(Boolean(auth?.accessToken || auth?.refreshToken));
      })
      .catch(() => {
        if (isMounted) setIsAuthenticated(false);
      })
      .finally(() => {
        if (isMounted) setIsCheckingAuth(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingAuth) return null;
  if (!isAuthenticated) return <Navigate to="/admin-login" replace />;

  return (
    <AssetProvider>
      <ERPLayout />
    </AssetProvider>
  );
}

function App() {
  useEffect(() => {
    const handleAuthExpired = () => {
      if (window.location.hash !== '#/admin-login') {
        window.location.hash = '#/admin-login';
      }
    };

    window.addEventListener('erp-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('erp-auth-expired', handleAuthExpired);
  }, []);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-register" element={<AdminRegister />} />

          <Route path="/" element={<ProtectedERP />}>
            <Route index element={<Navigate to="/admin-login" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="home-dashboard" element={<Dashboard />} />
            <Route path="assets" element={<AssetRegistry />} />
            <Route path="assets/:id" element={<AssetDetails />} />
            <Route path="verify" element={<RfidVerification />} />
            <Route path="sections" element={<Sections />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin-login" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
