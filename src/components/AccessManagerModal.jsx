import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, UserPlus, ShieldCheck, Mail, RefreshCw } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, doc, updateDoc, deleteDoc, setDoc, query, orderBy, onSnapshot } from 'firebase/firestore';


const AccessManagerModal = ({ isOpen, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [addingEmail, setAddingEmail] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const q = query(collection(db, 'access_requests'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRequests(items);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching access requests:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (id, email) => {
    try {
      await updateDoc(doc(db, 'access_requests', id), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });
      setActionMessage(`Approved access for ${email}!`);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request.');
    }
  };

  const handleReject = async (id, email) => {
    if (!window.confirm(`Remove access request for "${email}"?`)) return;
    try {
      await deleteDoc(doc(db, 'access_requests', id));
      setActionMessage(`Removed ${email}`);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting request:', err);
      alert('Failed to remove request.');
    }
  };

  const handlePreApprove = async (e) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    setAddingEmail(true);
    try {
      const newId = 'req_' + Date.now();
      await setDoc(doc(db, 'access_requests', newId), {
        id: newId,
        email: cleanEmail,
        name: 'Pre-Approved Client',
        status: 'approved',
        passcode: Math.floor(100000 + Math.random() * 900000).toString(),
        date: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      });
      setNewEmail('');
      setActionMessage(`Pre-approved ${cleanEmail}! They can now view the dashboard directly.`);
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      console.error('Error pre-approving email:', err);
      alert('Failed to pre-approve email.');
    } finally {
      setAddingEmail(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content access-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <ShieldCheck size={22} color="#3b82f6" />
            </div>
            <div>
              <h3 className="modal-title">Access Requests & Viewer Permissions</h3>
              <p className="modal-subtitle">Control who is allowed to view the project progress dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" title="Close">
            <X size={20} />
          </button>
        </div>

        {actionMessage && (
          <div className="access-toast-msg">
            <Check size={16} />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Pre-Approve an Email Form */}
        <div className="pre-approve-box">
          <div className="pre-approve-title">
            <UserPlus size={16} color="#3b82f6" />
            <strong>Pre-Approve a Client Email</strong>
          </div>
          <p className="pre-approve-hint">Add the property owner's email so they can view the dashboard immediately:</p>
          <form onSubmit={handlePreApprove} className="pre-approve-form">
            <input
              type="email"
              placeholder="e.g. propertyowner@gmail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={addingEmail} className="pre-approve-submit-btn">
              {addingEmail ? 'Adding...' : '+ Pre-Approve Email'}
            </button>
          </form>
        </div>

        {/* Pending Requests Section */}
        <div className="access-section-block">
          <div className="access-section-header">
            <h4>Pending Requests ({pendingRequests.length})</h4>
            {loading && <RefreshCw size={14} className="spin" />}
          </div>

          {pendingRequests.length === 0 ? (
            <p className="access-empty-note">No pending requests right now.</p>
          ) : (
            <div className="access-list">
              {pendingRequests.map((req) => (
                <div key={req.id} className="access-card pending-card">
                  <div className="access-card-left">
                    <div className="access-user-email">
                      <Mail size={16} />
                      <strong>{req.email}</strong>
                    </div>
                    <div className="access-meta">
                      <span>{req.name || 'Client'}</span>
                      <span>•</span>
                      <span>Code: <code className="passcode-chip">{req.passcode}</code></span>
                      <span>•</span>
                      <span>{new Date(req.date).toLocaleDateString('en-PK')}</span>
                    </div>
                  </div>
                  <div className="access-card-actions">
                    <button
                      type="button"
                      onClick={() => handleApprove(req.id, req.email)}
                      className="approve-action-btn"
                      title="Approve access"
                    >
                      <Check size={16} />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(req.id, req.email)}
                      className="reject-action-btn"
                      title="Decline request"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Viewers Section */}
        <div className="access-section-block" style={{ marginTop: '1.5rem' }}>
          <div className="access-section-header">
            <h4>Approved Viewers ({approvedRequests.length})</h4>
          </div>

          {approvedRequests.length === 0 ? (
            <p className="access-empty-note">No approved viewers yet.</p>
          ) : (
            <div className="access-list">
              {approvedRequests.map((req) => (
                <div key={req.id} className="access-card approved-card">
                  <div className="access-card-left">
                    <div className="access-user-email">
                      <ShieldCheck size={16} color="#10b981" />
                      <span>{req.email}</span>
                      <span className="approved-pill">Approved Viewer</span>
                    </div>
                    <div className="access-meta">
                      <span>{req.name || 'Client'}</span>
                      <span>•</span>
                      <span>Approved on: {req.approvedAt ? new Date(req.approvedAt).toLocaleDateString('en-PK') : 'Active'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReject(req.id, req.email)}
                    className="revoke-action-btn"
                    title="Revoke access"
                  >
                    <Trash2 size={14} />
                    <span>Revoke</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessManagerModal;
