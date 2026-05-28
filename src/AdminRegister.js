import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './context/ToastContext';
import authService from './services/authService';
import './AdminRegister.css';

function AdminRegister() {
  const navigate = useNavigate();
  const { success, error, warning } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    username: '',
    email: '',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const togglePassword = () => setShowPassword(prev => !prev);

  const handleRegister = async e => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      warning("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: formData.name,
        surname: formData.surname,
        username: formData.username,
        email: formData.email,
        department: formData.department,
        password: formData.password
      });
      success('Registration successful. Redirecting to login...', 2000);
      setTimeout(() => {
        navigate('/admin-login');
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
          Admin Registration
        </h1>

        <form onSubmit={handleRegister} className="register-form">
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
          <input type="text" name="surname" placeholder="Surname" value={formData.surname} onChange={handleChange} required />
          <input type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="text" name="department" placeholder="Department" value={formData.department} onChange={handleChange} required />

          <div className="password-wrapper">
            <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
            <span className="toggle-password" onClick={togglePassword}>{showPassword ? '🙈' : '👀'}</span>
          </div>

          <div className="password-wrapper">
            <input type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
            <span className="toggle-password" onClick={togglePassword}>{showPassword ? '🙈' : '👀'}</span>
          </div>

          <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register Admin'}</button>
        </form>

        <p style={{ marginTop: '15px', fontSize: '14px', color: '#555' }}>
          Already have an account?{' '}
          <span style={{ color: '#2c3e50', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/admin-login')}>
            Login here
          </span>
        </p>
      </header>
    </div>
  );
}

export default AdminRegister;
