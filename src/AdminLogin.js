// AdminLogin.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './context/ToastContext';
import authService from './services/authService';
import './AdminLogin.css';

const typingPhrases = [
  'Precision. Integrity. Amrod oversight with no compromise.',
  'RFID visibility for every controlled asset.',
  'Trusted records for accountable operations.'
];

function AdminLogin() {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const activePhrase = useMemo(
    () => typingPhrases[phraseIndex],
    [phraseIndex]
  );

  useEffect(() => {
    const speed = isDeleting ? 35 : 60;

    const timer = setTimeout(() => {
      if (!isDeleting && typedText === activePhrase) {
        setTimeout(() => setIsDeleting(true), 1200);
        return;
      }

      if (isDeleting && typedText === '') {
        setIsDeleting(false);
        setPhraseIndex(prev => (prev + 1) % typingPhrases.length);
        return;
      }

      setTypedText(current =>
        isDeleting
          ? activePhrase.slice(0, current.length - 1)
          : activePhrase.slice(0, current.length + 1)
      );
    }, speed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, activePhrase]);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.login({ username, password });

      success('Login successful');

      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err) {
      console.error(err);

      error(
        err.message ||
          'Unable to login. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* LEFT BRAND PANEL */}
      <div className="brand-panel">
        <div className="brand-overlay"></div>

        <div className="brand-content">
          <div className="logo-card">
            <img
              src={`${process.env.PUBLIC_URL || ''}/AMROD-LOGO.png`}
              alt="AMROD"
            />
          </div>

          <div className="brand-text">
            <span className="brand-tag">
              AMROD DIGITAL ASSET TRACKING MANAGEMENT SYSTEM
            </span>

            <h1>Official Admin Access</h1>

            <div className="typing-container">
              <span>{typedText}</span>
              <div className="cursor"></div>
            </div>

            <p>
              Secure RFID asset visibility, accountability, and centralized
              enterprise asset management for modern operations.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT LOGIN PANEL */}
      <div className="form-panel">
        <div className="login-card">
          <div className="card-header">
            <span className="small-label">PRIORITY ACCESS</span>
            <h2>Administrative Login</h2>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />

            <div className="password-box">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="show-btn"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
            </button>
          </form>

          <p className="footer-note">
            Need access? Contact Amrod compliance to provision your account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;