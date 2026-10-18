import React, { useState, useEffect } from 'react';
import { Lock, Mail, ShieldCheck, UserCheck, Clock, Key } from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';


const SHAKEEL_EMAIL = 'nasirshakeel333@gmail.com';
const SHAKEEL_PASSCODE = '112233';

const AccessGate = ({ onApprovedViewer, onContractorLogin }) => {
  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'contractor' | 'code'
  
  // Client Request Form state
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedPasscode, setGeneratedPasscode] = useState('');

  // Passcode unlock state
  const [manualCode, setManualCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // Contractor Login state
  const [contractorEmail, setContractorEmail] = useState('');
  const [contractorPasscode, setContractorPasscode] = useState('');
  const [contractorError, setContractorError] = useState('');

  // Listen in real-time if a request is pending
  useEffect(() => {
    if (!requestId) return;

    const unsub = onSnapshot(doc(db, 'access_requests', requestId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.status === 'approved') {
          setIsPending(false);
          onApprovedViewer(data.email);
        }
      }
    });

    return () => unsub();
  }, [requestId, onApprovedViewer]);

  // Handle Client Access Request Submission
  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setRequestError('');
    const cleanEmail = visitorEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setRequestError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Check if email is already approved in system
      const q = query(collection(db, 'access_requests'), where('email', '==', cleanEmail), where('status', '==', 'approved'));
      const existing = await getDocs(q);
      if (!existing.empty) {
        onApprovedViewer(cleanEmail);
        return;
      }

      // 2. Generate a 6-digit approval passcode for Shakeel to share
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newReqId = 'req_' + Date.now();

      const newRequest = {
        id: newReqId,
        email: cleanEmail,
        name: visitorName.trim() || 'Property Owner / Client',
        status: 'pending',
        passcode: newCode,
        date: new Date().toISOString()
      };

      await setDoc(doc(db, 'access_requests', newReqId), newRequest);
      setRequestId(newReqId);
      setGeneratedPasscode(newCode);
      setIsPending(true);

      // 3. Dispatch email notification to Shakeel via FormSubmit
      try {
        fetch('https://formsubmit.co/ajax/nasirshakeel333@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `🔔 New Access Request: ${cleanEmail}`,
            requesterEmail: cleanEmail,
            requesterName: visitorName.trim() || 'Client',
            approvalPasscode: newCode,
            message: `${cleanEmail} has requested access to view the Project Progress Dashboard. Approve them in your dashboard or share passcode: ${newCode}`,
            dashboardUrl: window.location.origin
          })
        }).catch(err => console.log('Email notify skipped:', err.message));
      } catch (err) {
        console.log('Email notify catch:', err);
      }

    } catch (err) {
      console.error('Error submitting request:', err);
      setRequestError('Could not submit request. Please check your internet connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Manual Passcode Entry
  const handleUnlockWithCode = async (e) => {
    e.preventDefault();
    setCodeError('');
    const code = manualCode.trim();

    if (!code) {
      setCodeError('Please enter the 6-digit passcode.');
      return;
    }

    // Check if code matches Shakeel's master contractor passcode
    if (code === SHAKEEL_PASSCODE) {
      onContractorLogin(SHAKEEL_EMAIL);
      return;
    }

    try {
      // Check if code matches an approved or pending request
      const q = query(collection(db, 'access_requests'), where('passcode', '==', code));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const reqData = snapshot.docs[0].data();
        onApprovedViewer(reqData.email);
      } else {
        setCodeError('Invalid passcode. Please request access or ask Shakeel for approval.');
      }
    } catch (err) {
      console.error('Error checking code:', err);
      setCodeError('Error checking passcode. Please try again.');
    }
  };

  // Handle Contractor (Shakeel) Login
  const handleContractorSubmit = (e) => {
    e.preventDefault();
    setContractorError('');
    const email = contractorEmail.trim().toLowerCase();
    const pass = contractorPasscode.trim();

    const isShakeelEmail =
      email === SHAKEEL_EMAIL ||
      email.includes('nasirshakeel') ||
      email.includes('shakeel') ||
      email === 'aamirhayatplp@gmail.com';

    if (!isShakeelEmail) {
      setContractorError("Access denied. Only Shakeel's email (nasirshakeel333@gmail.com) can log in as Contractor.");
      return;
    }

    if (pass !== SHAKEEL_PASSCODE) {
      setContractorError('Incorrect passcode. Please enter Shakeel’s 6-digit passcode.');
      return;
    }

    onContractorLogin(email);
  };

  return (
    <div className="login-container">
      <div className="login-card gatekeeper-card">
        <div className="login-icon gate-icon">
          <Lock size={36} color="#3b82f6" />
        </div>

        <h2>Private Project Portal</h2>
        <p className="login-subtitle">
          All financial data, material costs, labor, and receipts are restricted behind this access wall.
        </p>

        {/* Tab Switcher */}
        <div className="gate-tab-switcher">
          <button
            type="button"
            className={`gate-tab-btn ${activeTab === 'request' ? 'active' : ''}`}
            onClick={() => { setActiveTab('request'); setRequestError(''); }}
          >
            <UserCheck size={16} />
            <span>Owner / Client</span>
          </button>
          <button
            type="button"
            className={`gate-tab-btn ${activeTab === 'contractor' ? 'active' : ''}`}
            onClick={() => { setActiveTab('contractor'); setContractorError(''); }}
          >
            <ShieldCheck size={16} />
            <span>Contractor (Shakeel)</span>
          </button>
        </div>

        {/* TAB 1: OWNER / CLIENT ACCESS REQUEST */}
        {activeTab === 'request' && (
          <div className="gate-tab-body">
            {isPending ? (
              <div className="access-pending-box">
                <div className="pending-icon-wrap">
                  <Clock size={32} className="spin-slow" color="#3b82f6" />
                </div>
                <h3>Access Request Sent!</h3>
                <p className="pending-text">
                  Your request has been sent to <strong>Shakeel</strong> ({SHAKEEL_EMAIL}).
                </p>
                <div className="pending-notice">
                  <span>⏳ Waiting for Shakeel to approve... This page will <strong>unlock automatically</strong> once approved.</span>
                </div>

                <div className="pending-code-card">
                  <span className="code-label">Your Request Passcode:</span>
                  <span className="code-value">{generatedPasscode}</span>
                  <p className="code-hint">You can also message Shakeel this passcode to get instant approval.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPending(false)}
                  className="secondary-btn"
                  style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem' }}
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestAccess} className="login-form">
                <div className="form-group" style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
                  <label className="login-input-label">Your Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      placeholder="e.g. client@gmail.com"
                      value={visitorEmail}
                      onChange={(e) => { setVisitorEmail(e.target.value); setRequestError(''); }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group" style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
                  <label className="login-input-label">Your Name or Role (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Property Owner"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    style={{ textAlign: 'left' }}
                  />
                </div>

                {requestError && <div className="login-error-box">{requestError}</div>}

                <button type="submit" className="login-btn" disabled={submitting}>
                  <UserCheck size={18} />
                  <span>{submitting ? 'Submitting Request...' : 'Request Access to View'}</span>
                </button>

                <div className="login-divider">
                  <span>OR ENTER PASSCODE</span>
                </div>

                <div className="inline-code-form">
                  <input
                    type="text"
                    placeholder="Have an approval passcode?"
                    value={manualCode}
                    onChange={(e) => { setManualCode(e.target.value); setCodeError(''); }}
                    style={{ textAlign: 'center', letterSpacing: '0.15em', fontWeight: '600' }}
                  />
                  <button type="button" onClick={handleUnlockWithCode} className="code-submit-btn">
                    <Key size={16} /> Unlock
                  </button>
                </div>
                {codeError && <div className="login-error-box" style={{ marginTop: '0.5rem' }}>{codeError}</div>}
              </form>
            )}
          </div>
        )}

        {/* TAB 2: CONTRACTOR LOGIN (SHAKEEL) */}
        {activeTab === 'contractor' && (
          <div className="gate-tab-body">
            <form onSubmit={handleContractorSubmit} className="login-form">
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
                <label className="login-input-label">Shakeel's Email</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    placeholder="nasirshakeel333@gmail.com"
                    value={contractorEmail}
                    onChange={(e) => { setContractorEmail(e.target.value); setContractorError(''); }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group" style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
                <label className="login-input-label">Contractor Passcode</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    placeholder="Enter passcode (112233)"
                    value={contractorPasscode}
                    onChange={(e) => { setContractorPasscode(e.target.value); setContractorError(''); }}
                    required
                  />
                </div>
              </div>

              {contractorError && <div className="login-error-box">{contractorError}</div>}

              <button type="submit" className="login-btn contractor-btn">
                <ShieldCheck size={18} />
                <span>Unlock Full Editor (Shakeel)</span>
              </button>

              <p className="contractor-login-hint">
                Logging in unlocks full project management, payment additions, receipt uploads, and access request approvals.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessGate;
