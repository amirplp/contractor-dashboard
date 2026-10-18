import React, { useState } from 'react';
import { Lock, X, ShieldCheck, Mail } from 'lucide-react';

// Shakeel's authorized email list
const AUTHORIZED_EMAILS = [
  'shakeel@gmail.com',
  'aamirhayatplp@gmail.com'
];


const ContractorLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = passcode.trim();

    // Check if the email belongs to Shakeel or authorized list
    const isAuthorized =
      AUTHORIZED_EMAILS.some(ae => ae.toLowerCase() === cleanEmail) ||
      cleanEmail.includes('shakeel') ||
      cleanEmail.includes('amir');

    if (!isAuthorized) {
      setError("Access denied. Only Shakeel's authorized email can unlock editing rights.");
      return;
    }

    if (cleanPass !== '04082213009') {
      setError('Incorrect contractor passcode. Please try again.');
      return;
    }

    onLoginSuccess(cleanEmail);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content contractor-login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <ShieldCheck size={22} color="#3b82f6" />
            </div>
            <div>
              <h3 className="modal-title">Contractor Login</h3>
              <p className="modal-subtitle">Restricted to Shakeel's email</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" title="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="contractor-login-form">
          <p className="contractor-login-note">
            Only Shakeel is authorized to modify expenses, payments, work items, and receipts. Everyone else has read-only viewing permissions.
          </p>

          <div className="form-group">
            <label>Shakeel's Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="shakeel@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contractor Passcode</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="Enter passcode..."
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                required
              />
            </div>
          </div>

          {error && <div className="login-error-box">{error}</div>}

          <div className="login-modal-actions">
            <button type="submit" className="login-submit-btn">
              <ShieldCheck size={18} /> Unlock Editing Rights
            </button>
            <button type="button" onClick={onClose} className="login-cancel-btn">
              Cancel (Stay View-Only)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractorLoginModal;
