import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './context/ToastContext';
import authService from './services/authService';
import './AdminLogin.css';

function AdminLogin() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const togglePassword = () => setShowPassword(prev => !prev);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.login({ username, password });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('adminUsername', data.user.username);

      success('Login successful. Redirecting to dashboard...', 2000);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error(err);
      error(err.message || 'Connection error. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="AdminApp">
      <header className="Admin-header">
        <h1 className="login-title">
          <span className="lock-emoji">🔒</span>
          Admin Login
        </h1>

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <span className="toggle-password" onClick={togglePassword}>
              {showPassword ? '🙈' : '👀'}
            </span>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '15px', fontSize: '14px', color: '#555' }}>
          New admin?{' '}
          <span
            style={{ color: '#2c3e50', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/admin-register')}
          >
            Register here
          </span>
        </p>
      </header>
    </div>
  );
}

export default AdminLogin;
