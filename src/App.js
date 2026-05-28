import React from 'react';
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

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-register" element={<AdminRegister />} />

          <Route path="/" element={<AssetProvider><ERPLayout /></AssetProvider>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
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

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
