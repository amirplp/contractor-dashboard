import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AddWorkItem from './components/AddWorkItem';
import WorkProgressTable from './components/WorkProgressTable';
import AccessGate from './components/AccessGate';
import AccessManagerModal from './components/AccessManagerModal';
import { Download, LayoutDashboard, Search, Printer, Copy, Check, LogOut, Bell, FileText, Loader2 } from 'lucide-react';
import { generatePDFReport } from './utils/generatePDFReport';
import { db } from './firebaseConfig';

import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { arrayMove } from '@dnd-kit/sortable';

function App() {
  const [currentUser, setCurrentUser] = useState(null); // null | { role: 'admin' | 'viewer', email: string }
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [workItems, setWorkItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 1. Check if Shakeel is already logged in as contractor
    const storedRole = localStorage.getItem('shakeelUserRole');
    const storedEmail = localStorage.getItem('shakeelUserEmail');
    const approvedViewer = localStorage.getItem('approvedViewerEmail');

    if (storedRole === 'admin' && storedEmail) {
      setCurrentUser({ role: 'admin', email: storedEmail });
      fetchWorkItems();
      fetchPayments();
      fetchAttachments();
    } else if (approvedViewer) {
      setCurrentUser({ role: 'viewer', email: approvedViewer });
      fetchWorkItems();
      fetchPayments();
      fetchAttachments();
    }
  }, []);

  // Listen in real time for pending access requests when Shakeel is Admin
  useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    const q = query(collection(db, 'access_requests'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingRequestsCount(snapshot.docs.length);
    }, (err) => console.log('Requests listener:', err));
    return () => unsub();
  }, [currentUser]);

  const handleApprovedViewer = (email) => {
    setCurrentUser({ role: 'viewer', email });
    localStorage.setItem('approvedViewerEmail', email);
    localStorage.setItem('shakeelUserRole', 'viewer');
    fetchWorkItems();
    fetchPayments();
    fetchAttachments();
  };

  const handleContractorLogin = (email) => {
    setCurrentUser({ role: 'admin', email });
    localStorage.setItem('shakeelUserRole', 'admin');
    localStorage.setItem('shakeelUserEmail', email);
    fetchWorkItems();
    fetchPayments();
    fetchAttachments();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('shakeelUserRole');
    localStorage.removeItem('shakeelUserEmail');
    localStorage.removeItem('approvedViewerEmail');
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleCopyClientLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {
      prompt('Copy this secure Project Dashboard link:', url);
    });
  };




  const fetchWorkItems = async () => {
    try {
      const q = query(collection(db, 'work_items'), orderBy('sort_order', 'asc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setWorkItems(items);
    } catch (error) {
      console.error('Error fetching work items:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const q = query(collection(db, 'payments'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPayments(items);
    } catch (error) {
      console.error('Error fetching payments:', error.message);
    }
  };

  const fetchAttachments = async () => {
    try {
      const q = query(collection(db, 'attachments'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAttachments(items);
    } catch (error) {
      console.error('Error fetching attachments:', error.message);
    }
  };

  const handleAddItem = async (newItem) => {
    const newItemWithOrder = { ...newItem, sort_order: workItems.length };
    setWorkItems(prev => [...prev, newItemWithOrder]);
    try {
      await setDoc(doc(db, 'work_items', newItem.id), {
        item: newItem.item, company: newItem.company,
        material_cost: newItem.material_cost, amount_paid: newItem.amount_paid,
        labor_name: newItem.labor_name, labor_cost: newItem.labor_cost,
        labor_paid: newItem.labor_paid || 0,
        progress: newItem.progress, notes: newItem.notes || '',
        date: newItem.date, sort_order: workItems.length
      });
    } catch (error) {
      console.error('Error adding item:', error.message);
      setWorkItems(prev => prev.filter(wi => wi.id !== newItem.id));
      alert('Failed to save. Check your Firebase connection!');
    }
  };

  const handleEditItem = async (updatedItem) => {
    const previousItems = [...workItems];
    setWorkItems(prev => prev.map(wi => wi.id === updatedItem.id ? updatedItem : wi));
    try {
      await updateDoc(doc(db, 'work_items', updatedItem.id), {
        item: updatedItem.item, company: updatedItem.company,
        material_cost: updatedItem.material_cost, amount_paid: updatedItem.amount_paid,
        labor_name: updatedItem.labor_name, labor_cost: updatedItem.labor_cost,
        labor_paid: updatedItem.labor_paid || 0,
        progress: updatedItem.progress, notes: updatedItem.notes || ''
      });
    } catch (error) {
      console.error('Error updating item:', error.message);
      alert('Failed to update.');
      setWorkItems(previousItems);
    }
  };

  const handleUpdateNotes = async (itemId, notes) => {
    const previousItems = [...workItems];
    setWorkItems(prev => prev.map(wi => wi.id === itemId ? { ...wi, notes } : wi));
    try {
      await updateDoc(doc(db, 'work_items', itemId), { notes: notes || '' });
    } catch (error) {
      console.error('Error updating notes:', error.message);
      alert('Failed to update note.');
      setWorkItems(previousItems);
    }
  };

  const handleDeleteItem = async (id) => {
    const previousItems = [...workItems];
    setWorkItems(prev => prev.filter(wi => wi.id !== id));
    try {
      await deleteDoc(doc(db, 'work_items', id));
    } catch (error) {
      console.error('Error deleting item:', error.message);
      alert('Failed to delete.');
      setWorkItems(previousItems);
    }
  };

  const handleAddPayment = async (workItemId, amount, note) => {
    const newPayment = {
      id: crypto.randomUUID(),
      work_item_id: workItemId,
      amount: amount,
      note: note || '',
      date: new Date().toISOString()
    };

    setPayments(prev => [newPayment, ...prev]);

    const item = workItems.find(wi => wi.id === workItemId);
    if (item) {
      const newPaid = (item.amount_paid || 0) + amount;
      setWorkItems(prev => prev.map(wi => wi.id === workItemId ? { ...wi, amount_paid: newPaid } : wi));

      try {
        await setDoc(doc(db, 'payments', newPayment.id), newPayment);
        await updateDoc(doc(db, 'work_items', workItemId), { amount_paid: newPaid });
      } catch (error) {
        console.error('Error adding payment:', error.message);
        alert('Failed to record payment.');
        fetchWorkItems();
        fetchPayments();
      }
    }
  };

  // Attachments Handlers
  const handleUploadAttachment = async (newAttachment) => {
    setAttachments(prev => [newAttachment, ...prev]);
    try {
      await setDoc(doc(db, 'attachments', newAttachment.id), newAttachment);
    } catch (error) {
      console.error('Error saving attachment:', error.message);
      setAttachments(prev => prev.filter(a => a.id !== newAttachment.id));
      alert('Failed to save attachment to cloud.');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    const prev = [...attachments];
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    try {
      await deleteDoc(doc(db, 'attachments', attachmentId));
    } catch (error) {
      console.error('Error deleting attachment:', error.message);
      setAttachments(prev);
      alert('Failed to delete attachment.');
    }
  };

  // Reordering System (Instant buttons & Drag)
  const updateItemsOrder = async (newOrderedList) => {
    const updated = newOrderedList.map((wi, i) => ({ ...wi, sort_order: i }));
    setWorkItems(updated);

    try {
      for (const wi of updated) {
        await updateDoc(doc(db, 'work_items', wi.id), { sort_order: wi.sort_order });
      }
    } catch (error) {
      console.error('Error saving order:', error.message);
    }
  };

  const handleReorder = async (activeId, overId) => {
    const oldIndex = workItems.findIndex(wi => wi.id === activeId);
    const newIndex = workItems.findIndex(wi => wi.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(workItems, oldIndex, newIndex);
    updateItemsOrder(reordered);
  };

  const handleMoveUp = (id) => {
    const idx = workItems.findIndex(wi => wi.id === id);
    if (idx <= 0) return;
    const next = [...workItems];
    const temp = next[idx];
    next[idx] = next[idx - 1];
    next[idx - 1] = temp;
    updateItemsOrder(next);
  };

  const handleMoveDown = (id) => {
    const idx = workItems.findIndex(wi => wi.id === id);
    if (idx === -1 || idx >= workItems.length - 1) return;
    const next = [...workItems];
    const temp = next[idx];
    next[idx] = next[idx + 1];
    next[idx + 1] = temp;
    updateItemsOrder(next);
  };

  const handleMoveToTop = (id) => {
    const idx = workItems.findIndex(wi => wi.id === id);
    if (idx <= 0) return;
    const item = workItems[idx];
    const next = [item, ...workItems.filter(wi => wi.id !== id)];
    updateItemsOrder(next);
  };

  const handleMoveToPosition = (id, targetIndex) => {
    const fromIndex = workItems.findIndex(wi => wi.id === id);
    if (fromIndex === -1 || targetIndex < 0 || targetIndex >= workItems.length || fromIndex === targetIndex) return;
    const reordered = arrayMove(workItems, fromIndex, targetIndex);
    updateItemsOrder(reordered);
  };

  const exportToCSV = () => {
    if (workItems.length === 0) return;
    const headers = ['Item', 'Company', 'Material Cost', 'Material Paid', 'Balance', 'Labor Name', 'Labor Cost', 'Labor Paid', 'Progress %', 'Notes', 'Date'];
    const csvContent = [
      headers.join(','),
      ...workItems.map(wi => {
        const balance = (wi.material_cost || 0) + (wi.labor_cost || 0) - (wi.amount_paid || 0) - (wi.labor_paid || 0);
        const date = new Date(wi.date).toLocaleDateString('en-PK');
        return `"${wi.item}","${wi.company}",${wi.material_cost || 0},${wi.amount_paid || 0},${balance},"${wi.labor_name || 'N/A'}",${wi.labor_cost || 0},${wi.labor_paid || 0},${wi.progress || 0},"${(wi.notes || '').replace(/"/g, '""')}","${date}"`;
      })
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `shakeel_project_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (workItems.length === 0) {
      alert('No work items found to generate report.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Small pause to let React render the spinner state on the button
      await new Promise(r => setTimeout(r, 60));

      const isFiltered = filteredItems.length !== workItems.length;
      let filterInfo = null;
      if (isFiltered) {
        if (selectedCategory !== 'All' && searchQuery.trim()) {
          filterInfo = `Category: ${selectedCategory}, Search: "${searchQuery.trim()}"`;
        } else if (selectedCategory !== 'All') {
          filterInfo = `Category: ${selectedCategory}`;
        } else {
          filterInfo = `Search: "${searchQuery.trim()}"`;
        }
      }

      generatePDFReport({
        items: filteredItems,
        totalCount: workItems.length,
        filterInfo,
        payments,
        attachments
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('An error occurred while generating the PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // If not authenticated (neither approved viewer nor contractor admin), show the secure Access Gate
  if (!currentUser) {
    return (
      <AccessGate
        onApprovedViewer={handleApprovedViewer}
        onContractorLogin={handleContractorLogin}
      />
    );
  }

  const categories = ['All', ...new Set(workItems.map(wi => wi.item.toUpperCase()))];

  let filteredItems = selectedCategory === 'All'
    ? workItems
    : workItems.filter(wi => wi.item.toUpperCase() === selectedCategory);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(wi =>
      wi.item.toLowerCase().includes(q) ||
      wi.company.toLowerCase().includes(q) ||
      (wi.labor_name || '').toLowerCase().includes(q) ||
      (wi.notes || '').toLowerCase().includes(q)
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <>
      <div className="header-actions no-print">
        <div>
          <div className="header-title-row">
            <h1>Project Progress Dashboard</h1>
            {isAdmin ? (
              <span className="role-badge admin" title="Full editing and management permissions">
                👑 Contractor Mode (Shakeel)
              </span>
            ) : (
              <span className="role-badge viewer" title={`Read-only access granted for: ${currentUser.email}`}>
                👁️ Owner / Client View ({currentUser.email})
              </span>
            )}
          </div>
          <p className="subtitle">
            {loading
              ? 'Syncing with cloud...'
              : isAdmin
                ? 'Track materials, labor, and work progress (Full Editing Access)'
                : 'Live project status, payment history, and receipts (Read-Only)'}
          </p>
        </div>
        <div className="header-btns">
          {isAdmin ? (
            <>
              <button
                onClick={() => setShowAccessModal(true)}
                className={`secondary-btn ${pendingRequestsCount > 0 ? 'alert-badge-btn' : ''}`}
                style={{ width: 'auto' }}
                title="View and approve visitor access requests"
              >
                <Bell size={18} />
                <span>Access Requests</span>
                {pendingRequestsCount > 0 && <span className="notification-bubble">{pendingRequestsCount}</span>}
              </button>
              <button
                onClick={handleCopyClientLink}
                className={`secondary-btn ${copiedLink ? 'copied-btn' : ''}`}
                style={{ width: 'auto' }}
                title="Copy secure link for Owner to view"
              >
                {copiedLink ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="secondary-btn"
                style={{ width: 'auto' }}
                title="Lock dashboard (Switch to Gatekeeper Wall)"
              >
                <LogOut size={18} /> Lock
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="secondary-btn"
              style={{ width: 'auto' }}
              title="Exit dashboard"
            >
              <LogOut size={18} /> Exit
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            className="pdf-download-btn"
            style={{ width: 'auto' }}
            disabled={isGeneratingPDF}
            title="Download comprehensive PDF report with all minute details"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileText size={18} />
                <span>Download Full PDF</span>
              </>
            )}
          </button>
          <button onClick={handlePrint} className="secondary-btn" style={{ width: 'auto' }}>
            <Printer size={18} /> Print
          </button>
          <button onClick={exportToCSV} className="secondary-btn" style={{ width: 'auto' }}>
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>


      {workItems.length > 0 && (
        <div className="controls-row no-print">
          <div className="category-tabs">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  width: 'auto', padding: '0.5rem 1.25rem', borderRadius: '999px',
                  fontWeight: '500', fontSize: '0.9rem', whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  backgroundColor: selectedCategory === cat ? 'var(--accent)' : '#ffffff',
                  color: selectedCategory === cat ? '#ffffff' : 'var(--text-muted)',
                  border: selectedCategory === cat ? 'none' : '1px solid #e2e8f0',
                  boxShadow: selectedCategory === cat ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                {cat === 'All' && <LayoutDashboard size={14} style={{ marginRight: '0.35rem', display: 'inline' }} />}
                {cat}
              </button>
            ))}
          </div>
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search items, vendors, labor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="print-only print-header">
        <h1>Project Progress Report</h1>
        <p>Generated on: {new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className={`app-container ${!isAdmin ? 'full-width' : ''}`}>
        <main className="main-content">
          <Dashboard items={filteredItems} selectedCategory={selectedCategory} />
          <WorkProgressTable
            items={filteredItems}
            isAdmin={isAdmin}
            onDelete={handleDeleteItem}
            onEdit={handleEditItem}
            payments={payments}
            onAddPayment={handleAddPayment}
            attachments={attachments}
            onUploadAttachment={handleUploadAttachment}
            onDeleteAttachment={handleDeleteAttachment}
            onReorder={handleReorder}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onMoveToTop={handleMoveToTop}
            onMoveToPosition={handleMoveToPosition}
            onUpdateNotes={handleUpdateNotes}
          />
        </main>
        {isAdmin && (
          <aside className="sidebar no-print">
            <AddWorkItem onAddItem={handleAddItem} />
          </aside>
        )}
      </div>

      {isAdmin && (
        <AccessManagerModal
          isOpen={showAccessModal}
          onClose={() => setShowAccessModal(false)}
        />
      )}
    </>
  );
}

export default App;

