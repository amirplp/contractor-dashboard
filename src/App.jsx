import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AddWorkItem from './components/AddWorkItem';
import WorkProgressTable from './components/WorkProgressTable';
import Login from './components/Login';
import { Download, LayoutDashboard } from 'lucide-react';
import { supabase } from './supabaseClient';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const loggedIn = localStorage.getItem('isShakeelAuthenticated');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkItems();
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isShakeelAuthenticated', 'true');
  };

  const fetchWorkItems = async () => {
    try {
      const { data, error } = await supabase
        .from('work_items')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      if (data) setWorkItems(data);
    } catch (error) {
      console.error('Error fetching work items:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (newItem) => {
    setWorkItems(prev => [newItem, ...prev]);

    try {
      const { error } = await supabase
        .from('work_items')
        .insert([{
          id: newItem.id,
          item: newItem.item,
          company: newItem.company,
          material_cost: newItem.material_cost,
          amount_paid: newItem.amount_paid,
          labor_name: newItem.labor_name,
          labor_cost: newItem.labor_cost,
          progress: newItem.progress,
          date: newItem.date
        }]);

      if (error) {
        setWorkItems(prev => prev.filter(wi => wi.id !== newItem.id));
        throw error;
      }
    } catch (error) {
      console.error('Error adding item:', error.message);
      alert('Failed to save to the cloud. Make sure you created the work_items table in Supabase!');
    }
  };

  const handleDeleteItem = async (id) => {
    const previousItems = [...workItems];
    setWorkItems(prev => prev.filter(wi => wi.id !== id));

    try {
      const { error } = await supabase
        .from('work_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item:', error.message);
      alert('Failed to delete item.');
      setWorkItems(previousItems);
    }
  };

  const exportToCSV = () => {
    if (workItems.length === 0) return;
    
    const headers = ['Item', 'Company', 'Material Cost', 'Amount Paid', 'Labor Name', 'Labor Cost', 'Progress %', 'Date Added'];
    const csvContent = [
      headers.join(','),
      ...workItems.map(wi => {
        const date = new Date(wi.date).toLocaleDateString('en-PK');
        return `"${wi.item}","${wi.company}",${wi.material_cost},${wi.amount_paid},"${wi.labor_name}",${wi.labor_cost},${wi.progress},"${date}"`;
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shakeel_project_progress_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Get unique categories for tabs (capitalized to group properly)
  const categories = ['All', ...new Set(workItems.map(wi => wi.item.toUpperCase()))];
  
  const filteredItems = selectedCategory === 'All' 
    ? workItems 
    : workItems.filter(wi => wi.item.toUpperCase() === selectedCategory);

  return (
    <>
      <div className="header-actions">
        <div>
          <h1>Project Progress Dashboard</h1>
          <p className="subtitle">
            {loading ? 'Syncing with cloud...' : 'Track materials, labor, and work progress'}
          </p>
        </div>
        
        <button onClick={exportToCSV} className="secondary-btn" style={{ width: 'auto' }}>
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {workItems.length > 0 && (
        <div className="category-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'tab-active' : 'tab-inactive'}
              style={{
                width: 'auto',
                padding: '0.5rem 1.25rem',
                borderRadius: '999px',
                fontWeight: '500',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
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
      )}

      <div className="app-container">
        <main className="main-content">
          <Dashboard items={filteredItems} selectedCategory={selectedCategory} />
          <WorkProgressTable items={filteredItems} onDelete={handleDeleteItem} />
        </main>
        
        <aside className="sidebar">
          <AddWorkItem onAddItem={handleAddItem} />
        </aside>
      </div>
    </>
  );
}

export default App;
