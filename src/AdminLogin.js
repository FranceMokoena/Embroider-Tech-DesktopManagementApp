// AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const togglePassword = () => setShowPassword(prev => !prev);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Login failed');
      } else {
        // Save token to localStorage for future API requests
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUsername', data.admin.username);

        alert('Login successful! Redirecting to dashboard...');
        navigate('/home-dashboard');
      }
    } catch (err) {
      console.error(err);
      alert('Server error. Please try again later.');
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
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />

          <div className="password-wrapper">
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <span className="toggle-password" onClick={togglePassword}>{showPassword ? '🙈' : '👀'}</span>
          </div>

          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>

        <p style={{ marginTop: '15px', fontSize: '14px', color: '#555' }}>
          New admin?{' '}
          <span style={{ color: '#2c3e50', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/admin-register')}>
            Register here
          </span>
        </p>
      </header>
    </div>
  );
}

export default AdminLogin;
