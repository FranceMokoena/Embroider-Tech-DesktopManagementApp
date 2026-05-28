import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './context/ToastContext';
import authService from './services/authService';
import './AdminLogin.css';

const typingPhrases = [
  'Documented compliance,',
  'modern delivery,',
  'and trusted oversight'
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

  const activePhrase = useMemo(() => typingPhrases[phraseIndex], [phraseIndex]);

  useEffect(() => {
    const typeDelay = isDeleting ? 34 : 58;
    const pauseDelay = typedText === activePhrase && !isDeleting ? 1500 : typeDelay;
    const nextDelay = typedText === '' && isDeleting ? 360 : pauseDelay;

    const timer = setTimeout(() => {
      if (!isDeleting && typedText === activePhrase) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && typedText === '') {
        setIsDeleting(false);
        setPhraseIndex(index => (index + 1) % typingPhrases.length);
        return;
      }

      setTypedText(current =>
        isDeleting
          ? activePhrase.slice(0, Math.max(current.length - 1, 0))
          : activePhrase.slice(0, current.length + 1)
      );
    }, nextDelay);

    return () => clearTimeout(timer);
  }, [activePhrase, isDeleting, typedText]);

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.login({ username, password });

      success('Login successful. Redirecting to dashboard...', 2000);
      setTimeout(() => {
        navigate('/dashboard');
      }, 900);
    } catch (err) {
      console.error(err);
      error(err.message || 'Connection error. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="AdminApp">
      <section className="login-brand-panel" aria-label="RFID ERP platform identity">
        <div className="brand-content">
          <div className="brand-logo-lockup">
            <img src={`${process.env.PUBLIC_URL || ''}/logo256.png`} alt="EmbroideryTech" />
            <div>
              <span>EmbroideryTech</span>
              <strong>RFID Asset ERP</strong>
            </div>
          </div>

          <div className="brand-copy">
            <p className="brand-kicker">Government Registry Platform</p>
            <h1>Official Admin Access</h1>
            <div className="typing-line" aria-live="polite">
              <span>{typedText}</span>
              <i aria-hidden="true" />
            </div>
            <p className="brand-description">
              Secure administrative access for RFID asset registration, section control,
              transfer governance, audit verification, and centralized operational oversight.
            </p>
          </div>

          <div className="brand-assurance">
            <span>Centralized RFID identity</span>
            <span>Audit-ready asset movement</span>
            <span>Encrypted desktop sessions</span>
          </div>
        </div>
      </section>

      <section className="login-auth-panel" aria-label="Administrative login">
        <div className="login-card">
          <div className="login-card-header">
            <span className="access-label">Priority Access</span>
            <h2>Administrative Login</h2>
            <p>Authenticate to manage the national RFID asset registry console.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <label className="field-group">
              <span>Username</span>
              <input
                type="text"
                autoComplete="username"
                placeholder="Enter admin username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </label>

            <label className="field-group">
              <span>Password</span>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter secure password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  className="toggle-password"
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </label>

            <button className="secure-login-button" type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          <div className="login-compliance-note">
            Need access? Contact system compliance administrator.
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminLogin;
