import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './context/ToastContext';
import './AdminLogin.css';

const DESKTOP_API = process.env.REACT_APP_DESKTOP_API || 'http://localhost:5001';
const heroImage = require('./assets/Amrod.jpg');
const typingPhrases = [
  'Precision. Integrity. Embroidery oversight with no compromises.',
  'Secure access for the teams protecting vital garment assets.',
  'Documented compliance, modern delivery, and trusted outcomes.'
];
const phraseCount = typingPhrases.length;

function AdminLogin() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhrase = typingPhrases[phraseIndex];
  const typedText = currentPhrase.slice(0, charIndex);

  useEffect(() => {
    let timeout;

    if (!isDeleting && charIndex === currentPhrase.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && charIndex === 0) {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex(prev => (prev + 1) % phraseCount);
      }, 600);
      return () => clearTimeout(timeout);
    }

    const delta = isDeleting ? 60 : 110;
    timeout = setTimeout(() => {
      setCharIndex(prev => prev + (isDeleting ? -1 : 1));
    }, delta);

    return () => clearTimeout(timeout);
  }, [charIndex, currentPhrase.length, isDeleting, phraseIndex, phraseCount]);

  const togglePassword = () => setShowPassword(prev => !prev);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${DESKTOP_API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        error(data.error || 'Login failed. Please check your credentials.');
      } else {
      localStorage.setItem('adminToken', data.token);
      sessionStorage.setItem('adminTokenBackup', data.token);
      localStorage.setItem('adminUsername', data.user.username);
      sessionStorage.setItem('adminUsernameBackup', data.user.username);

        success('Login successful! Redirecting to dashboard...', 2000);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      error('Connection error. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="hero-panel">
        <div className="hero-image-wrapper">
          <img className="hero-image" src={heroImage} alt="Company embroidery illustration" />
        </div>
        <p className="hero-tagline hero-tagline-below-image">Welcome to
 Embroideries Screen Management</p>
        <div className="hero-text">
          <h2>Official Admin Access</h2>
          <p className="typing-line">
            {typedText}
            <span className="typing-cursor" aria-hidden="true"></span>
          </p>
          <p className="hero-subtext">
            We pride ourselves in being professional and offering all our clients the best products and services you could need.
          </p>
        </div>
      </div>

      <div className="form-panel">
        <div className="form-card">
          <p className="eyebrow-text">Priority Access</p>
          <h1 className="form-title">Administrative Login</h1>

          <form onSubmit={handleLogin} className="login-form">
            <label className="sr-only" htmlFor="admin-username">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />

            <div className="password-wrapper">
              <label className="sr-only" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={togglePassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Authenticating…' : 'Secure Login'}
            </button>
          </form>

          <p className="helper-text">
            Need access? Contact EmbroideryTech compliance to provision your user.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
