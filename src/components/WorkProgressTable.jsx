import React, { useState } from 'react';
import { Trash2, Pencil, Check, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';

const WorkProgressTable = ({ items, onDelete, onEdit, payments, onAddPayment }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency', currency: 'PKR', minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = () => {
    onEdit(editData);
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const confirmDelete = (id, itemName) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}"? This cannot be undone.`)) {
      onDelete(id);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    setPaymentAmount('');
    setPaymentNote('');
  };

  const handleAddPayment = (workItemId) => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    onAddPayment(workItemId, Number(paymentAmount), paymentNote);
    setPaymentAmount('');
    setPaymentNote('');
  };

  if (items.length === 0) {
    return (
      <div className="card empty-state">
        <p>No work items found. Add your first item to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="card table-card">
      {/* Desktop Table */}
      <div className="table-responsive">
        <table className="work-table">
          <thead>
            <tr>
              <th>ITEM</th>
              <th>COMPANY</th>
              <th>MATERIAL COST</th>
              <th>AMOUNT PAID</th>
              <th>BALANCE</th>
              <th>LABOUR</th>
              <th>LABOUR COST</th>
              <th>PROGRESS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const totalCost = (item.material_cost || 0) + (item.labor_cost || 0);
              const balance = totalCost - (item.amount_paid || 0);
              const isEditing = editingId === item.id;
              const isExpanded = expandedId === item.id;
              const itemPayments = payments.filter(p => p.work_item_id === item.id);

              return (
                <React.Fragment key={item.id}>
                  <tr className={isExpanded ? 'row-expanded' : ''}>
                    {isEditing ? (
                      <>
                        <td><input className="inline-input" value={editData.item} onChange={(e) => handleEditChange('item', e.target.value)} /></td>
                        <td><input className="inline-input" value={editData.company} onChange={(e) => handleEditChange('company', e.target.value)} /></td>
                        <td><input className="inline-input" type="number" value={editData.material_cost} onChange={(e) => handleEditChange('material_cost', Number(e.target.value))} /></td>
                        <td><input className="inline-input" type="number" value={editData.amount_paid} onChange={(e) => handleEditChange('amount_paid', Number(e.target.value))} /></td>
                        <td className={balance > 0 ? 'text-danger' : 'text-success'}>{formatCurrency((editData.material_cost || 0) + (editData.labor_cost || 0) - (editData.amount_paid || 0))}</td>
                        <td><input className="inline-input" value={editData.labor_name} onChange={(e) => handleEditChange('labor_name', e.target.value)} /></td>
                        <td><input className="inline-input" type="number" value={editData.labor_cost} onChange={(e) => handleEditChange('labor_cost', Number(e.target.value))} /></td>
                        <td><input className="inline-input" type="number" value={editData.progress} min="0" max="100" onChange={(e) => handleEditChange('progress', Math.min(100, Number(e.target.value)))} /></td>
                        <td>
                          <div className="action-btns">
                            <button className="icon-btn save-btn" onClick={saveEdit} title="Save"><Check size={16} /></button>
                            <button className="icon-btn" onClick={cancelEdit} title="Cancel"><X size={16} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="fw-600 clickable" onClick={() => toggleExpand(item.id)}>
                          {item.item.toUpperCase()}
                          {isExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
                        </td>
                        <td>{item.company}</td>
                        <td>{formatCurrency(item.material_cost)}</td>
                        <td>{formatCurrency(item.amount_paid)}</td>
                        <td className={balance > 0 ? 'text-danger' : 'text-success'}>{formatCurrency(balance)}</td>
                        <td>{item.labor_name}</td>
                        <td>{formatCurrency(item.labor_cost)}</td>
                        <td>
                          <div className="progress-cell">
                            <span>{item.progress}%</span>
                            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${item.progress}%` }}></div></div>
                          </div>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="icon-btn edit-btn" onClick={() => startEdit(item)} title="Edit"><Pencil size={14} /></button>
                            <button className="icon-btn delete-btn" onClick={() => confirmDelete(item.id, item.item)} title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                  {isExpanded && !isEditing && (
                    <tr className="expanded-row">
                      <td colSpan="9">
                        <div className="expanded-content">
                          {item.notes && (
                            <div className="notes-section">
                              <strong>Notes:</strong> <span>{item.notes}</span>
                            </div>
                          )}
                          <div className="payments-section">
                            <strong>Payment History</strong>
                            {itemPayments.length > 0 ? (
                              <ul className="payment-list">
                                {itemPayments.map(p => (
                                  <li key={p.id}>
                                    <span className="payment-amount">{formatCurrency(p.amount)}</span>
                                    <span className="payment-date">{new Date(p.date).toLocaleDateString('en-PK')}</span>
                                    {p.note && <span className="payment-note">— {p.note}</span>}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="no-payments">No payment records yet.</p>
                            )}
                            <div className="add-payment-row">
                              <input type="number" placeholder="Amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="inline-input" min="0" />
                              <input type="text" placeholder="Note (optional)" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} className="inline-input" />
                              <button className="add-payment-btn" onClick={() => handleAddPayment(item.id)}><Plus size={14} /> Add Payment</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-list">
        {items.map((item) => {
          const totalCost = (item.material_cost || 0) + (item.labor_cost || 0);
          const balance = totalCost - (item.amount_paid || 0);
          const isEditing = editingId === item.id;
          const isExpanded = expandedId === item.id;
          const itemPayments = payments.filter(p => p.work_item_id === item.id);

          return (
            <div key={item.id} className="mobile-item-card">
              <div className="mobile-item-header">
                <h3 onClick={() => toggleExpand(item.id)} style={{ cursor: 'pointer' }}>
                  {item.item.toUpperCase()}
                  {isExpanded ? <ChevronUp size={14} style={{ marginLeft: '0.25rem' }} /> : <ChevronDown size={14} style={{ marginLeft: '0.25rem' }} />}
                </h3>
                <span className="company-badge">{item.company}</span>
              </div>

              {isEditing ? (
                <div className="mobile-edit-form">
                  <div className="form-row">
                    <div className="form-group"><label>Item</label><input value={editData.item} onChange={(e) => handleEditChange('item', e.target.value)} /></div>
                    <div className="form-group"><label>Company</label><input value={editData.company} onChange={(e) => handleEditChange('company', e.target.value)} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Material Cost</label><input type="number" value={editData.material_cost} onChange={(e) => handleEditChange('material_cost', Number(e.target.value))} /></div>
                    <div className="form-group"><label>Amount Paid</label><input type="number" value={editData.amount_paid} onChange={(e) => handleEditChange('amount_paid', Number(e.target.value))} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Labor Name</label><input value={editData.labor_name} onChange={(e) => handleEditChange('labor_name', e.target.value)} /></div>
                    <div className="form-group"><label>Labor Cost</label><input type="number" value={editData.labor_cost} onChange={(e) => handleEditChange('labor_cost', Number(e.target.value))} /></div>
                  </div>
                  <div className="form-group"><label>Progress %</label><input type="number" value={editData.progress} min="0" max="100" onChange={(e) => handleEditChange('progress', Math.min(100, Number(e.target.value)))} /></div>
                  <div className="form-group"><label>Notes</label><textarea value={editData.notes || ''} onChange={(e) => handleEditChange('notes', e.target.value)} rows="2" /></div>
                  <div className="mobile-edit-actions">
                    <button onClick={saveEdit} className="save-action-btn"><Check size={16} /> Save</button>
                    <button onClick={cancelEdit} className="cancel-action-btn"><X size={16} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mobile-item-stats">
                    <div className="stat-row"><span>Material Cost:</span><strong>{formatCurrency(item.material_cost)}</strong></div>
                    <div className="stat-row"><span>Labor ({item.labor_name}):</span><strong>{formatCurrency(item.labor_cost)}</strong></div>
                    <div className="stat-row"><span>Paid:</span><strong>{formatCurrency(item.amount_paid)}</strong></div>
                    <div className="stat-row highlight"><span>Balance:</span><strong className={balance > 0 ? 'text-danger' : 'text-success'}>{formatCurrency(balance)}</strong></div>
                  </div>

                  <div className="mobile-progress-section">
                    <div className="progress-label"><span>Work Progress</span><span>{item.progress}%</span></div>
                    <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${item.progress}%` }}></div></div>
                  </div>

                  {isExpanded && (
                    <div className="mobile-expanded">
                      {item.notes && <div className="notes-section"><strong>Notes:</strong> <span>{item.notes}</span></div>}
                      <div className="payments-section">
                        <strong>Payment History</strong>
                        {itemPayments.length > 0 ? (
                          <ul className="payment-list">
                            {itemPayments.map(p => (
                              <li key={p.id}>
                                <span className="payment-amount">{formatCurrency(p.amount)}</span>
                                <span className="payment-date">{new Date(p.date).toLocaleDateString('en-PK')}</span>
                                {p.note && <span className="payment-note">— {p.note}</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="no-payments">No payment records yet.</p>
                        )}
                        <div className="add-payment-col">
                          <input type="number" placeholder="Amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} min="0" />
                          <input type="text" placeholder="Note (optional)" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
                          <button onClick={() => handleAddPayment(item.id)}><Plus size={14} /> Add Payment</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mobile-actions">
                    <button onClick={() => startEdit(item)} className="mobile-edit-btn"><Pencil size={14} /> Edit</button>
                    <button onClick={() => confirmDelete(item.id, item.item)} className="mobile-delete-btn"><Trash2 size={14} /> Delete</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkProgressTable;
