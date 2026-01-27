import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './theme.css';
import AdminLogin from './AdminLogin';
import AdminRegister from './AdminRegister';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DepartmentsPage from './pages/Departments/DepartmentsPage';
import DepartmentDetailPage from './pages/Departments/DepartmentDetailPage';
import TechniciansPage from './pages/Technicians/TechniciansPage';
import SessionsPage from './pages/Sessions/SessionsPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import NotificationDetailPage from './pages/Notifications/NotificationDetailPage';
import InsightsPage from './pages/Insights/InsightsPage';
import HistoryPage from './pages/History/HistoryPage';
import AllScreensPage from './pages/AllScreens/AllScreensPage';
import AppShell from './layout/AppShell';
import { ToastProvider } from './context/ToastContext';

const clearAdminSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUsername');
  sessionStorage.removeItem('adminTokenBackup');
  sessionStorage.removeItem('adminUsernameBackup');
  sessionStorage.removeItem('adminTokenCleared');
};

clearAdminSession();

// Main App component with Router
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:departmentName" element={<DepartmentDetailPage />} />
            <Route path="/technicians" element={<TechniciansPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/all-screens" element={<AllScreensPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/notifications/:category" element={<NotificationDetailPage />} />
            <Route path="/insights" element={<InsightsPage />} />
          </Route>
          <Route path="*" element={<AdminLogin />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
