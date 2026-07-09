import React, { useEffect, useState } from 'react';
import './Toast.css';

const icons = {
  success: '✓',
  error: '!',
  warning: '!',
  info: 'i'
};

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div className={`toast ${type} ${isVisible ? 'show' : 'hide'}`}>
      <div className="toast-content">
        <span className="toast-icon">{icons[type] || icons.info}</span>
        <span className="toast-message">{message}</span>
        <button className="toast-close" type="button" onClick={handleClose} aria-label="Dismiss notification">×</button>
      </div>
    </div>
  );
};

export default Toast;
