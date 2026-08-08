import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passcode === '04082213009') { 
      onLogin();
    } else {
      setError('Incorrect passcode. Please try again.');
      setPasscode('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">
          <Lock size={36} color="#3b82f6" />
        </div>
        <h2>Private Dashboard</h2>
        <p className="login-subtitle">Please enter your ID to access the dashboard.</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            placeholder="Enter ID..."
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoFocus
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn">Unlock</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
