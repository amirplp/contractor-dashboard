import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AddWorkItem from './components/AddWorkItem';
import WorkProgressTable from './components/WorkProgressTable';
import Login from './components/Login';
import { Download, LayoutDashboard, Search, Printer } from 'lucide-react';
import { db } from './firebaseConfig';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { arrayMove } from '@dnd-kit/sortable';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [workItems, setWorkItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loggedIn = localStorage.getItem('isShakeelAuthenticated');
    if (loggedIn === 'true') setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkItems();
      fetchPayments();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isShakeelAuthenticated', 'true');
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

  const handleAddItem = async (newItem) => {
    const newItemWithOrder = { ...newItem, sort_order: workItems.length };
    setWorkItems(prev => [...prev, newItemWithOrder]);
    try {
      await setDoc(doc(db, 'work_items', newItem.id), {
        item: newItem.item, company: newItem.company,
        material_cost: newItem.material_cost, amount_paid: newItem.amount_paid,
        labor_name: newItem.labor_name, labor_cost: newItem.labor_cost,
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
        progress: updatedItem.progress, notes: updatedItem.notes || ''
      });
    } catch (error) {
      console.error('Error updating item:', error.message);
      alert('Failed to update.');
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

  const exportToCSV = () => {
    if (workItems.length === 0) return;
    const headers = ['Item', 'Company', 'Material Cost', 'Amount Paid', 'Balance', 'Labor Name', 'Labor Cost', 'Progress %', 'Notes', 'Date'];
    const csvContent = [
      headers.join(','),
      ...workItems.map(wi => {
        const balance = (wi.material_cost || 0) + (wi.labor_cost || 0) - (wi.amount_paid || 0);
        const date = new Date(wi.date).toLocaleDateString('en-PK');
        return `"${wi.item}","${wi.company}",${wi.material_cost},${wi.amount_paid},${balance},"${wi.labor_name}",${wi.labor_cost},${wi.progress},"${(wi.notes || '').replace(/"/g, '""')}","${date}"`;
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

  const handleReorder = async (activeId, overId) => {
    const oldIndex = workItems.findIndex(wi => wi.id === activeId);
    const newIndex = workItems.findIndex(wi => wi.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(workItems, oldIndex, newIndex);
    const updated = reordered.map((wi, i) => ({ ...wi, sort_order: i }));
    setWorkItems(updated);

    try {
      for (const wi of updated) {
        await updateDoc(doc(db, 'work_items', wi.id), { sort_order: wi.sort_order });
      }
    } catch (error) {
      console.error('Error saving order:', error.message);
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
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

  return (
    <>
      <div className="header-actions no-print">
        <div>
          <h1>Project Progress Dashboard</h1>
          <p className="subtitle">
            {loading ? 'Syncing with cloud...' : 'Track materials, labor, and work progress'}
          </p>
        </div>
        <div className="header-btns">
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

      <div className="app-container">
        <main className="main-content">
          <Dashboard items={filteredItems} selectedCategory={selectedCategory} />
          <WorkProgressTable
            items={filteredItems}
            onDelete={handleDeleteItem}
            onEdit={handleEditItem}
            payments={payments}
            onAddPayment={handleAddPayment}
            onReorder={handleReorder}
          />
        </main>
        <aside className="sidebar no-print">
          <AddWorkItem onAddItem={handleAddItem} />
        </aside>
      </div>
    </>
  );
}

export default App;
