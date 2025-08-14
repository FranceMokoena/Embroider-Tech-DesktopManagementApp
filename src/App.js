import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import AdminLogin from './AdminLogin';
import AdminRegister from './AdminRegister';
import HomeDashboard from './HomeDashboard';


// Home screen component (embedded in App.js)
function Home() {
  const techEmojis = ['💻', '📲', '👨‍🏭'];
  const [currentEmoji, setCurrentEmoji] = useState(techEmojis[0]);
  const navigate = useNavigate(); // ✅ useNavigate inside Router context

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmoji(prev => {
        const currentIndex = techEmojis.indexOf(prev);
        const nextIndex = (currentIndex + 1) % techEmojis.length;
        return techEmojis[nextIndex];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="tech-emoji" role="img" aria-label="technician">
          {currentEmoji}
        </div>

        <h1>Embroidery Tech Management</h1>
        <p>Welcome to the Desktop Admin Application</p>
        <p>Use this application to manage technicians, monitor screens, and view scan history.</p>

        <div style={{ marginTop: '20px' }}>
          <button
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/admin-login')}
          >
            Go to Admin Login
          </button>
        </div>

        <footer style={{ marginTop: '40px', fontSize: '12px', color: '#aaa' }}>
          &copy; 2025 Embroidery Tech. All rights reserved.
        </footer>
      </header>
    </div>
  );
}

// Main App component with Router
function App() {
  return (
    <Router>
      <Routes>
       <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-register" element={<AdminRegister />} />
        <Route path="/home-dashboard" element={<HomeDashboard />} />
        <Route path="*" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}

export default App;
