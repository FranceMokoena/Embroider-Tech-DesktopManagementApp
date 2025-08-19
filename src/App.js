import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AdminLogin from './AdminLogin';
import AdminRegister from './AdminRegister';
import HomeDashboard from './HomeDashboard';
import { ToastProvider } from './context/ToastContext';

// Main App component with Router
function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          <Route path="/home-dashboard" element={<HomeDashboard />} />
          <Route path="*" element={<AdminLogin />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
