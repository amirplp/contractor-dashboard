import React, { useState } from 'react';
import { Lock, Eye, ShieldCheck } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanPass = passcode.trim();
    if (cleanPass === '04082213009') { 
      onLogin('admin');
    } else if (['1234', '0000', 'client', 'view', 'owner'].includes(cleanPass.toLowerCase())) {
      onLogin('viewer');
    } else {
      setError('Incorrect passcode. Enter Contractor ID or view as Client.');
      setPasscode('');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">
          <Lock size={36} color="#3b82f6" />
        </div>
        <h2>Project Progress Portal</h2>
        <p className="login-subtitle">
          Secure access for contractor management & client progress review.
        </p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-input-label">Contractor Passcode</label>
          <input
            type="password"
            placeholder="Enter Contractor ID..."
            value={passcode}
            onChange={(e) => { setPasscode(e.target.value); setError(''); }}
            autoFocus
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn">
            <ShieldCheck size={18} /> Unlock Full Editor (Shakeel)
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          onClick={() => onLogin('viewer')}
          className="client-view-btn"
        >
          <Eye size={18} />
          <span>View as Client / Owner (Read-Only)</span>
        </button>
        <p className="client-view-hint">
          Owners can view live expenses, work progress, receipts, and notes without editing permissions.
        </p>
      </div>
    </div>
  );
};

export default Login;

