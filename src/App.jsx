import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AddWorkItem from './components/AddWorkItem';
import WorkProgressTable from './components/WorkProgressTable';
import Login from './components/Login';
import { Download, LayoutDashboard, Search, Printer } from 'lucide-react';
import { supabase } from './supabaseClient';
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
      const { data, error } = await supabase.from('work_items').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      if (data) setWorkItems(data);
    } catch (error) {
      console.error('Error fetching work items:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase.from('payments').select('*').order('date', { ascending: false });
      if (error) throw error;
      if (data) setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error.message);
    }
  };

  const handleAddItem = async (newItem) => {
    const newItemWithOrder = { ...newItem, sort_order: workItems.length };
    setWorkItems(prev => [...prev, newItemWithOrder]);
    try {
      const { error } = await supabase.from('work_items').insert([{
        id: newItem.id, item: newItem.item, company: newItem.company,
        material_cost: newItem.material_cost, amount_paid: newItem.amount_paid,
        labor_name: newItem.labor_name, labor_cost: newItem.labor_cost,
        progress: newItem.progress, notes: newItem.notes, date: newItem.date,
        sort_order: workItems.length
      }]);
      if (error) { setWorkItems(prev => prev.filter(wi => wi.id !== newItem.id)); throw error; }
    } catch (error) {
      console.error('Error adding item:', error.message);
      alert('Failed to save. Make sure you ran the latest SQL in Supabase!');
    }
  };

  const handleEditItem = async (updatedItem) => {
    const previousItems = [...workItems];
    setWorkItems(prev => prev.map(wi => wi.id === updatedItem.id ? updatedItem : wi));
    try {
      const { error } = await supabase.from('work_items').update({
        item: updatedItem.item, company: updatedItem.company,
        material_cost: updatedItem.material_cost, amount_paid: updatedItem.amount_paid,
        labor_name: updatedItem.labor_name, labor_cost: updatedItem.labor_cost,
        progress: updatedItem.progress, notes: updatedItem.notes
      }).eq('id', updatedItem.id);
      if (error) throw error;
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
      const { error } = await supabase.from('work_items').delete().eq('id', id);
      if (error) throw error;
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

    // Also update the total amount_paid on the work item
    const item = workItems.find(wi => wi.id === workItemId);
    if (item) {
      const newPaid = (item.amount_paid || 0) + amount;
      setWorkItems(prev => prev.map(wi => wi.id === workItemId ? { ...wi, amount_paid: newPaid } : wi));

      try {
        const { error: payError } = await supabase.from('payments').insert([newPayment]);
        if (payError) throw payError;

        const { error: updateError } = await supabase.from('work_items').update({ amount_paid: newPaid }).eq('id', workItemId);
        if (updateError) throw updateError;
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
    // Update sort_order on each item
    const updated = reordered.map((wi, i) => ({ ...wi, sort_order: i }));
    setWorkItems(updated);

    // Save new order to Supabase
    try {
      for (const wi of updated) {
        await supabase.from('work_items').update({ sort_order: wi.sort_order }).eq('id', wi.id);
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

      {/* Print Header (only shows when printing) */}
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
