import React from 'react';
import { Trash2 } from 'lucide-react';

const WorkProgressTable = ({ items, onDelete }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (items.length === 0) {
    return (
      <div className="card empty-state">
        <p>No work items found. Add your first item to start tracking progress.</p>
      </div>
    );
  }

  return (
    <div className="card table-card">
      <div className="table-responsive">
        <table className="work-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th>COMPANY</th>
              <th>MATERIAL COST</th>
              <th>AMOUNT PAID</th>
              <th>BALANCE</th>
              <th>LABOUR NAME</th>
              <th>LABOUR COST</th>
              <th>PROGRESS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const totalCost = (item.material_cost || 0) + (item.labor_cost || 0);
              const balance = totalCost - (item.amount_paid || 0);

              return (
                <tr key={item.id}>
                  <td className="fw-600">{item.item.toUpperCase()}</td>
                  <td>{item.company}</td>
                  <td>{formatCurrency(item.material_cost)}</td>
                  <td>{formatCurrency(item.amount_paid)}</td>
                  <td className={balance > 0 ? 'text-danger' : 'text-success'}>
                    {formatCurrency(balance)}
                  </td>
                  <td>{item.labor_name}</td>
                  <td>{formatCurrency(item.labor_cost)}</td>
                  <td>
                    <div className="progress-cell">
                      <span>{item.progress}%</span>
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button 
                      onClick={() => onDelete(item.id)}
                      className="icon-btn delete-btn"
                      title="Delete Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Mobile view cards (hidden on desktop) */}
      <div className="mobile-list">
        {items.map((item) => {
          const totalCost = (item.material_cost || 0) + (item.labor_cost || 0);
          const balance = totalCost - (item.amount_paid || 0);

          return (
            <div key={item.id} className="mobile-item-card">
              <div className="mobile-item-header">
                <h3>{item.item.toUpperCase()}</h3>
                <span className="company-badge">{item.company}</span>
              </div>
              
              <div className="mobile-item-stats">
                <div className="stat-row">
                  <span>Material Cost:</span>
                  <strong>{formatCurrency(item.material_cost)}</strong>
                </div>
                <div className="stat-row">
                  <span>Labor ({item.labor_name}):</span>
                  <strong>{formatCurrency(item.labor_cost)}</strong>
                </div>
                <div className="stat-row">
                  <span>Paid:</span>
                  <strong>{formatCurrency(item.amount_paid)}</strong>
                </div>
                <div className="stat-row highlight">
                  <span>Balance:</span>
                  <strong className={balance > 0 ? 'text-danger' : 'text-success'}>
                    {formatCurrency(balance)}
                  </strong>
                </div>
              </div>
              
              <div className="mobile-progress-section">
                <div className="progress-label">
                  <span>Work Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>

              <button 
                onClick={() => onDelete(item.id)}
                className="mobile-delete-btn"
              >
                <Trash2 size={16} /> Delete Item
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkProgressTable;
