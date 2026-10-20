import React, { useState } from 'react';
import { 
  Trash2, Pencil, Check, X, ChevronDown, ChevronUp, Plus, 
  GripVertical, ArrowUp, ArrowDown, ChevronsUp, Paperclip,
  Building2, Package, User, Hammer, AlertCircle
} from 'lucide-react';
import { 
  DndContext, closestCenter, PointerSensor, TouchSensor, 
  useSensor, useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AttachmentSection from './AttachmentSection';
import NotesSection from './NotesSection';

/* Priority badge styling helper */
const renderPriorityBadge = (index) => {
  if (index === 0) {
    return <span className="priority-badge p1-badge" title="Position #1 - Top Priority">🏆 #1</span>;
  }
  if (index === 1) {
    return <span className="priority-badge p2-badge" title="Position #2 Priority">🥈 #2</span>;
  }
  if (index === 2) {
    return <span className="priority-badge p3-badge" title="Position #3 Priority">🥉 #3</span>;
  }
  return <span className="priority-badge pn-badge" title={`Position #${index + 1}`}>#{index + 1}</span>;
};

/* Dynamic vibrant category styling helper */
const getCategoryStyle = (categoryName) => {
  const cat = (categoryName || '').toUpperCase().trim();
  if (cat.includes('WINDOW') || cat.includes('GLASS') || cat.includes('UPVC')) {
    return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' }; // Sky Blue
  }
  if (cat.includes('CEILING') || cat.includes('MOULD')) {
    return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' }; // Violet
  }
  if (cat.includes('TILE') || cat.includes('MARB')) {
    return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }; // Cyan / Sky
  }
  if (cat.includes('SANITARY') || cat.includes('PLUMB') || cat.includes('GEEZER') || cat.includes('SHOWER')) {
    return { bg: '#ccfbf1', text: '#0f766e', border: '#99f6e4' }; // Teal
  }
  if (cat.includes('ELECTR') || cat.includes('LIGHT') || cat.includes('WIRE') || cat.includes('SWITCH') || cat.includes('BULB')) {
    return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' }; // Amber
  }
  if (cat.includes('PAINT') || cat.includes('POLISH')) {
    return { bg: '#fae8ff', text: '#a21caf', border: '#f5d0fe' }; // Fuchsia
  }
  if (cat.includes('WOOD') || cat.includes('CARPENT') || cat.includes('DOOR') || cat.includes('CHOWKAT') || cat.includes('CABINET') || cat.includes('WARDROBE')) {
    return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' }; // Emerald
  }
  if (cat.includes('STEEL') || cat.includes('IRON') || cat.includes('METAL') || cat.includes('GRILL') || cat.includes('GATE') || cat.includes('RAILING')) {
    return { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' }; // Indigo
  }
  if (cat.includes('ROOF') || cat.includes('CHIPS') || cat.includes('CEMENT') || cat.includes('BRICK') || cat.includes('MASON')) {
    return { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }; // Orange
  }
  if (cat.includes('SALARY') || cat.includes('RENT') || cat.includes('WAGES') || cat.includes('CHOWKIDAR') || cat.includes('PETROL') || cat.includes('BILL')) {
    return { bg: '#fef9c3', text: '#854d0e', border: '#fde047' }; // Warm Gold
  }
  if (cat.includes('CCTV') || cat.includes('INTERNET') || cat.includes('MISC')) {
    return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }; // Blue
  }
  // Deterministic fallback based on hash
  let hash = 0;
  for (let i = 0; i < cat.length; i++) {
    hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [
    { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' },
    { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
    { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  ];
  return hues[Math.abs(hash) % hues.length];
};

/* ---------- Sortable Table Row ---------- */
const SortableRow = ({
  item, index, totalCount, isEditing, isExpanded, editData, balance, payments,
  attachments = [], onUploadAttachment, onDeleteAttachment,
  paymentAmount, paymentNote, setPaymentAmount, setPaymentNote,
  formatCurrency, startEdit, cancelEdit, saveEdit, handleEditChange,
  confirmDelete, toggleExpand, handleAddPayment,
  onMoveUp, onMoveDown, onMoveToTop, onMoveToPosition, onUpdateNotes,
  isAdmin = true
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 20 : 'auto',
  };

  const itemPayments = payments.filter(p => p.work_item_id === item.id);
  const itemAttachments = attachments.filter(a => a.workItemId === item.id);
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  const totalCost = (Number(item.material_cost) || 0) + (Number(item.labor_cost) || 0);
  const totalPaid = (Number(item.amount_paid) || 0) + (Number(item.labor_paid) || 0);
  const paymentPct = totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : (totalPaid > 0 ? 100 : 0);
  const rawWorkProgress = item.work_progress !== undefined ? item.work_progress : (item.progress || 0);
  const workProgress = Math.min(100, Math.max(0, Number(rawWorkProgress) || 0));
  const editBalance = (Number(editData.material_cost) || 0) + (Number(editData.labor_cost) || 0) - (Number(editData.amount_paid) || 0) - (Number(editData.labor_paid) || 0);
  const catStyle = getCategoryStyle(item.item);

  return (
    <React.Fragment>
      <tr ref={setNodeRef} style={style} className={`${isExpanded ? 'row-expanded' : ''} ${isDragging ? 'is-dragging' : ''}`}>
        {isEditing ? (
          <>
            <td style={{ width: '80px', textAlign: 'center' }}>
              {renderPriorityBadge(index)}
            </td>
            <td><input className="inline-input" value={editData.item || ''} onChange={(e) => handleEditChange('item', e.target.value)} /></td>
            <td><input className="inline-input" value={editData.company || ''} onChange={(e) => handleEditChange('company', e.target.value)} /></td>
            <td><input className="inline-input" type="number" value={editData.material_cost ?? ''} onChange={(e) => handleEditChange('material_cost', Number(e.target.value))} /></td>
            <td><input className="inline-input" type="number" value={editData.amount_paid ?? ''} onChange={(e) => handleEditChange('amount_paid', Number(e.target.value))} /></td>
            <td>
              <span className={`badge-pill ${editBalance > 0 ? 'balance-danger-pill' : 'balance-cleared-pill'}`}>
                {editBalance > 0 ? formatCurrency(editBalance) : 'Cleared'}
              </span>
            </td>
            <td><input className="inline-input" value={editData.labor_name || ''} onChange={(e) => handleEditChange('labor_name', e.target.value)} /></td>
            <td><input className="inline-input" type="number" value={editData.labor_cost ?? ''} onChange={(e) => handleEditChange('labor_cost', Number(e.target.value))} /></td>
            <td><input className="inline-input" type="number" value={editData.labor_paid ?? ''} onChange={(e) => handleEditChange('labor_paid', Number(e.target.value))} /></td>
            <td style={{ textAlign: 'center' }}>
              <span className="auto-calc-badge payment-badge" title="Auto-calculated from payments">
                {(() => {
                  const c = (Number(editData.material_cost) || 0) + (Number(editData.labor_cost) || 0);
                  const p = (Number(editData.amount_paid) || 0) + (Number(editData.labor_paid) || 0);
                  return c > 0 ? Math.min(100, Math.round((p / c) * 100)) : (p > 0 ? 100 : 0);
                })()}%
              </span>
            </td>
            <td>
              <input
                className="inline-input"
                type="number"
                value={editData.work_progress !== undefined ? editData.work_progress : (editData.progress ?? '')}
                min="0"
                max="100"
                title="Enter actual physical work completion percentage (0-100)"
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value)));
                  handleEditChange('work_progress', val);
                  handleEditChange('progress', val);
                }}
              />
            </td>
            <td>
              <div className="action-btns">
                <button className="icon-btn save-btn" onClick={saveEdit} title="Save"><Check size={16} /></button>
                <button className="icon-btn" onClick={cancelEdit} title="Cancel"><X size={16} /></button>
              </div>
            </td>
          </>
        ) : (
          <>
            {/* Priority & Reorder Controls Column */}
            {isAdmin ? (
              <td className="reorder-td">
                <div className="priority-control-group">
                  <span className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
                    <GripVertical size={16} />
                  </span>

                  {/* Priority Selector Pill */}
                  <div className="priority-select-wrap" title={`Rank #${index + 1} - Tap to change`}>
                    {renderPriorityBadge(index)}
                    <select
                      className="priority-dropdown"
                      value={index}
                      onChange={(e) => onMoveToPosition(item.id, Number(e.target.value))}
                      title="Change priority position"
                    >
                      {Array.from({ length: totalCount }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? 'Position #1 (Top Priority)' : `Position #${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 1-Tap Quick Action Buttons */}
                  <div className="quick-arrow-btns">
                    {!isFirst && (
                      <button
                        type="button"
                        className="reorder-arrow-btn top-btn"
                        onClick={() => onMoveToTop(item.id)}
                        title="Move to Top (Priority #1)"
                      >
                        <ChevronsUp size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="reorder-arrow-btn"
                      onClick={() => onMoveUp(item.id)}
                      disabled={isFirst}
                      title="Move Up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="reorder-arrow-btn"
                      onClick={() => onMoveDown(item.id)}
                      disabled={isLast}
                      title="Move Down"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>
                </div>
              </td>
            ) : (
              <td style={{ width: '80px', textAlign: 'center' }}>
                {renderPriorityBadge(index)}
              </td>
            )}

            {/* Item Title & Attachments Badge with Category Chip */}
            <td className="fw-600 clickable item-name-td" onClick={() => toggleExpand(item.id)}>
              <div className="item-title-row">
                <span
                  className="category-badge-chip"
                  style={{
                    backgroundColor: catStyle.bg,
                    color: catStyle.text,
                    borderColor: catStyle.border
                  }}
                  title={`Category: ${item.item.toUpperCase()}`}
                >
                  {item.item.toUpperCase()}
                </span>
                {itemAttachments.length > 0 && (
                  <span className="attachment-badge-pill" title={`${itemAttachments.length} attachments / proofs`}>
                    <Paperclip size={12} />
                    <span>{itemAttachments.length}</span>
                  </span>
                )}
                {isExpanded ? <ChevronUp size={14} className="expand-icon" /> : <ChevronDown size={14} className="expand-icon" />}
              </div>
            </td>

            {/* Vendor / Supplier Badge */}
            <td>
              <span className="vendor-badge" title={`Vendor: ${item.company}`}>
                <Building2 size={12} className="vendor-icon" />
                <span>{item.company}</span>
              </span>
            </td>

            {/* Material Cost (Indigo/Purple #6366f1) */}
            <td>
              <span className="badge-pill material-cost-pill" title="Material Cost (Indigo)">
                <Package size={12} />
                <span>{formatCurrency(item.material_cost)}</span>
              </span>
            </td>

            {/* Material Paid (Emerald Green #10b981) */}
            <td>
              <span className="badge-pill material-paid-pill" title="Material Amount Paid (Emerald Green)">
                <Check size={12} />
                <span>{formatCurrency(item.amount_paid)}</span>
              </span>
            </td>

            {/* Balance Due (Rose/Red #ef4444) */}
            <td>
              {balance > 0 ? (
                <span className="badge-pill balance-danger-pill" title={`Remaining Unpaid Balance: ${formatCurrency(balance)}`}>
                  <AlertCircle size={12} />
                  <span>{formatCurrency(balance)}</span>
                </span>
              ) : (
                <span className="badge-pill balance-cleared-pill" title="Fully settled! No balance due.">
                  <Check size={12} />
                  <span>Cleared</span>
                </span>
              )}
            </td>

            {/* Labor Contractor / Worker Tag (Warm Amber/Orange) */}
            <td>
              <span className="badge-pill labor-name-pill" title={`Labor Contractor / Worker: ${item.labor_name || 'N/A'}`}>
                <User size={12} />
                <span>{item.labor_name || 'N/A'}</span>
              </span>
            </td>

            {/* Labor Cost (Warm Amber/Orange #f59e0b) */}
            <td>
              <span className="badge-pill labor-cost-pill" title="Labor Cost (Warm Amber)">
                <Hammer size={12} />
                <span>{formatCurrency(item.labor_cost)}</span>
              </span>
            </td>

            {/* Labor Paid (Warm Amber/Orange #d97706) */}
            <td>
              <span className="badge-pill labor-paid-pill" title="Labor Amount Paid (Warm Amber)">
                <Check size={12} />
                <span>{formatCurrency(item.labor_paid)}</span>
              </span>
            </td>

            {/* Payment Progress % (Green) */}
            <td>
              <div className="progress-cell payment-progress-cell" title={`Payment Progress: ${paymentPct}% (${formatCurrency(totalPaid)} of ${formatCurrency(totalCost)})`}>
                <span className="progress-badge payment-badge">
                  {paymentPct === 100 ? '✓ 100%' : `${paymentPct}%`}
                </span>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill payment-fill" style={{ width: `${paymentPct}%` }}></div>
                </div>
              </div>
            </td>

            {/* Physical Work Done % (Blue) */}
            <td>
              <div className="progress-cell work-progress-cell" title={`Work Done: ${workProgress}% physical progress on site`}>
                <span className="progress-badge work-badge">
                  {workProgress === 100 ? '★ 100%' : `${workProgress}%`}
                </span>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill work-fill" style={{ width: `${workProgress}%` }}></div>
                </div>
              </div>
            </td>

            {isAdmin && (
              <td>
                <div className="action-btns">
                  <button className="icon-btn edit-btn" onClick={() => startEdit(item)} title="Edit"><Pencil size={14} /></button>
                  <button className="icon-btn delete-btn" onClick={() => confirmDelete(item.id, item.item)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </td>
            )}
          </>
        )}
      </tr>

      {/* Expanded Row: Notes, Payments, and Attachments */}
      {isExpanded && !isEditing && (
        <tr className="expanded-row">
          <td colSpan={isAdmin ? '12' : '11'}>
            <div className="expanded-content">
              {/* Editable Notes & Remarks Section */}
              <NotesSection
                workItemId={item.id}
                currentNotes={item.notes}
                onSaveNotes={onUpdateNotes}
                isAdmin={isAdmin}
              />

              {/* Attachments Section */}
              <AttachmentSection
                workItemId={item.id}
                attachments={attachments}
                onUpload={onUploadAttachment}
                onDelete={onDeleteAttachment}
                isAdmin={isAdmin}
              />

              {/* Payment History Section */}
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
                {isAdmin && (
                  <div className="add-payment-row">
                    <input
                      type="number"
                      placeholder="Amount (PKR)"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="inline-input"
                      min="0"
                    />
                    <input
                      type="text"
                      placeholder="Note / Cheque # (optional)"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="inline-input"
                    />
                    <button className="add-payment-btn" onClick={() => handleAddPayment(item.id)}>
                      <Plus size={14} /> Add Payment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

/* ---------- Sortable Mobile Card ---------- */
const SortableMobileCard = ({
  item, index, totalCount, isEditing, isExpanded, editData, balance, payments,
  attachments = [], onUploadAttachment, onDeleteAttachment,
  paymentAmount, paymentNote, setPaymentAmount, setPaymentNote,
  formatCurrency, startEdit, cancelEdit, saveEdit, handleEditChange,
  confirmDelete, toggleExpand, handleAddPayment,
  onMoveUp, onMoveDown, onMoveToTop, onMoveToPosition, onUpdateNotes,
  isAdmin = true
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const itemPayments = payments.filter(p => p.work_item_id === item.id);
  const itemAttachments = attachments.filter(a => a.workItemId === item.id);
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  const totalCost = (Number(item.material_cost) || 0) + (Number(item.labor_cost) || 0);
  const totalPaid = (Number(item.amount_paid) || 0) + (Number(item.labor_paid) || 0);
  const paymentPct = totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : (totalPaid > 0 ? 100 : 0);
  const rawWorkProgress = item.work_progress !== undefined ? item.work_progress : (item.progress || 0);
  const workProgress = Math.min(100, Math.max(0, Number(rawWorkProgress) || 0));
  const catStyle = getCategoryStyle(item.item);

  return (
    <div ref={setNodeRef} style={style} className={`mobile-item-card ${isDragging ? 'is-dragging' : ''}`}>
      {/* Mobile Card Header with Priority Reorder Controls */}
      <div className="mobile-card-top-bar">
        {isAdmin ? (
          <div className="mobile-priority-cluster">
            <span className="drag-handle-mobile" {...attributes} {...listeners} title="Drag to reorder">
              <GripVertical size={18} />
            </span>

            <div className="priority-select-wrap">
              {renderPriorityBadge(index)}
              <select
                className="priority-dropdown"
                value={index}
                onChange={(e) => onMoveToPosition(item.id, Number(e.target.value))}
              >
                {Array.from({ length: totalCount }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? 'Position #1 (Top)' : `Position #${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="quick-arrow-btns">
              {!isFirst && (
                <button
                  type="button"
                  className="reorder-arrow-btn top-btn"
                  onClick={() => onMoveToTop(item.id)}
                  title="Move to Top (Priority 1)"
                >
                  <ChevronsUp size={14} />
                </button>
              )}
              <button
                type="button"
                className="reorder-arrow-btn"
                onClick={() => onMoveUp(item.id)}
                disabled={isFirst}
                title="Move Up"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className="reorder-arrow-btn"
                onClick={() => onMoveDown(item.id)}
                disabled={isLast}
                title="Move Down"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        ) : (
          renderPriorityBadge(index)
        )}

        <span className="vendor-badge">
          <Building2 size={12} className="vendor-icon" />
          <span>{item.company}</span>
        </span>
      </div>

      <div className="mobile-item-title-section" onClick={() => toggleExpand(item.id)}>
        <div className="mobile-title-wrap">
          <span
            className="category-badge-chip"
            style={{
              backgroundColor: catStyle.bg,
              color: catStyle.text,
              borderColor: catStyle.border
            }}
          >
            {item.item.toUpperCase()}
          </span>
          {itemAttachments.length > 0 && (
            <span className="attachment-badge-pill">
              <Paperclip size={12} />
              <span>{itemAttachments.length}</span>
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {isEditing ? (
        <div className="mobile-edit-form">
          <div className="form-row">
            <div className="form-group"><label>Item</label><input value={editData.item || ''} onChange={(e) => handleEditChange('item', e.target.value)} /></div>
            <div className="form-group"><label>Company</label><input value={editData.company || ''} onChange={(e) => handleEditChange('company', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Material Cost</label><input type="number" value={editData.material_cost ?? ''} onChange={(e) => handleEditChange('material_cost', Number(e.target.value))} /></div>
            <div className="form-group"><label>Amount Paid</label><input type="number" value={editData.amount_paid ?? ''} onChange={(e) => handleEditChange('amount_paid', Number(e.target.value))} /></div>
          </div>
          <div className="form-group">
            <label>Labor Name</label>
            <input value={editData.labor_name || ''} onChange={(e) => handleEditChange('labor_name', e.target.value)} placeholder="e.g. AMIR" />
          </div>
          <div className="form-row">
            <div className="form-group"><label>Labor Cost</label><input type="number" value={editData.labor_cost ?? ''} onChange={(e) => handleEditChange('labor_cost', Number(e.target.value))} /></div>
            <div className="form-group"><label>Labor Paid</label><input type="number" value={editData.labor_paid ?? ''} onChange={(e) => handleEditChange('labor_paid', Number(e.target.value))} /></div>
          </div>
          <div className="form-group">
            <label>Payment % (Auto-calculated)</label>
            <div style={{ padding: '0.25rem 0' }}>
              <span className="auto-calc-badge payment-badge" title="Auto-calculated from payments">
                {(() => {
                  const c = (Number(editData.material_cost) || 0) + (Number(editData.labor_cost) || 0);
                  const p = (Number(editData.amount_paid) || 0) + (Number(editData.labor_paid) || 0);
                  return c > 0 ? Math.min(100, Math.round((p / c) * 100)) : (p > 0 ? 100 : 0);
                })()}% (Paid)
              </span>
            </div>
          </div>
          <div className="form-group">
            <label>Work Done / Physical Progress (%)</label>
            <input
              type="number"
              value={editData.work_progress !== undefined ? editData.work_progress : (editData.progress ?? '')}
              min="0"
              max="100"
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value)));
                handleEditChange('work_progress', val);
                handleEditChange('progress', val);
              }}
            />
          </div>
          <div className="form-group"><label>Notes</label><textarea value={editData.notes || ''} onChange={(e) => handleEditChange('notes', e.target.value)} rows="2" /></div>
          <div className="mobile-edit-actions">
            <button onClick={saveEdit} className="save-action-btn"><Check size={16} /> Save</button>
            <button onClick={cancelEdit} className="cancel-action-btn"><X size={16} /> Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mobile-item-stats">
            <div className="stat-row">
              <span className="stat-label"><Package size={13} /> Material Cost:</span>
              <span className="badge-pill material-cost-pill">{formatCurrency(item.material_cost)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label"><Check size={13} /> Material Paid:</span>
              <span className="badge-pill material-paid-pill">{formatCurrency(item.amount_paid)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label"><User size={13} /> Labor Contractor:</span>
              <span className="badge-pill labor-name-pill">{item.labor_name || 'N/A'}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label"><Hammer size={13} /> Labor Cost:</span>
              <span className="badge-pill labor-cost-pill">{formatCurrency(item.labor_cost)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label"><Check size={13} /> Labor Paid:</span>
              <span className="badge-pill labor-paid-pill">{formatCurrency(item.labor_paid)}</span>
            </div>
            <div className="stat-row highlight">
              <span className="stat-label"><AlertCircle size={13} /> Balance Due:</span>
              {balance > 0 ? (
                <span className="badge-pill balance-danger-pill">{formatCurrency(balance)}</span>
              ) : (
                <span className="badge-pill balance-cleared-pill">✓ Cleared</span>
              )}
            </div>
          </div>

          <div className="mobile-progress-dual">
            <div className="mobile-progress-section">
              <div className="progress-label">
                <span>Payment Progress (Paid)</span>
                <span className="progress-badge payment-badge">
                  {paymentPct === 100 ? '✓ 100%' : `${paymentPct}%`}
                </span>
              </div>
              <div className="progress-bar-bg"><div className="progress-bar-fill payment-fill" style={{ width: `${paymentPct}%` }}></div></div>
            </div>
            <div className="mobile-progress-section">
              <div className="progress-label">
                <span>Work Done (Physical)</span>
                <span className="progress-badge work-badge">
                  {workProgress === 100 ? '★ 100%' : `${workProgress}%`}
                </span>
              </div>
              <div className="progress-bar-bg"><div className="progress-bar-fill work-fill" style={{ width: `${workProgress}%` }}></div></div>
            </div>
          </div>

          {isExpanded && (
            <div className="mobile-expanded">
              {/* Editable Notes & Remarks Section */}
              <NotesSection
                workItemId={item.id}
                currentNotes={item.notes}
                onSaveNotes={onUpdateNotes}
                isAdmin={isAdmin}
              />

              {/* Attachments */}
              <AttachmentSection
                workItemId={item.id}
                attachments={attachments}
                onUpload={onUploadAttachment}
                onDelete={onDeleteAttachment}
                isAdmin={isAdmin}
              />

              {/* Payment History */}
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
                {isAdmin && (
                  <div className="add-payment-col">
                    <input type="number" placeholder="Amount (PKR)" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} min="0" />
                    <input type="text" placeholder="Note (optional)" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
                    <button onClick={() => handleAddPayment(item.id)}><Plus size={14} /> Add Payment</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="mobile-actions">
              <button onClick={() => startEdit(item)} className="mobile-edit-btn"><Pencil size={14} /> Edit</button>
              <button onClick={() => confirmDelete(item.id, item.item)} className="mobile-delete-btn"><Trash2 size={14} /> Delete</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ---------- Main Component ---------- */
const WorkProgressTable = ({
  items, onDelete, onEdit, payments, onAddPayment, onReorder,
  attachments = [], onUploadAttachment, onDeleteAttachment,
  onMoveUp, onMoveDown, onMoveToTop, onMoveToPosition, onUpdateNotes,
  isAdmin = true
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Enhanced sensors: PointerSensor with 6px constraint, TouchSensor with proper delay & tolerance
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({
      ...item,
      labor_paid: item.labor_paid || 0,
      work_progress: item.work_progress !== undefined ? item.work_progress : (item.progress || 0)
    });
  };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };
  const saveEdit = () => { onEdit(editData); setEditingId(null); setEditData({}); };
  const handleEditChange = (field, value) => { setEditData(prev => ({ ...prev, [field]: value })); };
  const confirmDelete = (id, itemName) => { if (window.confirm(`Are you sure you want to delete "${itemName}"? This cannot be undone.`)) onDelete(id); };
  const toggleExpand = (id) => { setExpandedId(expandedId === id ? null : id); setPaymentAmount(''); setPaymentNote(''); };
  const handleAddPaymentLocal = (workItemId) => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    onAddPayment(workItemId, Number(paymentAmount), paymentNote);
    setPaymentAmount(''); setPaymentNote('');
  };

  const handleDragEnd = (event) => {
    if (!isAdmin) return;
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id, over.id);
    }
  };

  if (items.length === 0) {
    return <div className="card empty-state"><p>No work items found. Add your first item to start tracking.</p></div>;
  }

  const sharedProps = (item, index) => {
    const totalCost = (item.material_cost || 0) + (item.labor_cost || 0);
    const totalPaid = (item.amount_paid || 0) + (item.labor_paid || 0);
    const balance = totalCost - totalPaid;
    return {
      item, index, totalCount: items.length,
      isEditing: editingId === item.id, isExpanded: expandedId === item.id,
      editData, balance, payments, paymentAmount, paymentNote,
      setPaymentAmount, setPaymentNote, formatCurrency, startEdit, cancelEdit,
      saveEdit, handleEditChange, confirmDelete, toggleExpand,
      handleAddPayment: handleAddPaymentLocal,
      attachments, onUploadAttachment, onDeleteAttachment,
      onMoveUp, onMoveDown, onMoveToTop, onMoveToPosition, onUpdateNotes,
      isAdmin
    };
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="card table-card">
          {/* Desktop Table */}
          <div className="table-responsive">
            <table className="work-table">
              <thead>
                <tr>
                  <th style={{ width: isAdmin ? '135px' : '85px', textAlign: 'center' }}>PRIORITY</th>
                  <th>ITEM / CATEGORY</th>
                  <th>VENDOR</th>
                  <th><span className="th-dot dot-indigo" />MATERIAL COST</th>
                  <th><span className="th-dot dot-emerald" />MATERIAL PAID</th>
                  <th><span className="th-dot dot-rose" />BALANCE DUE</th>
                  <th><span className="th-dot dot-amber" />LABOR</th>
                  <th><span className="th-dot dot-amber" />LABOR COST</th>
                  <th><span className="th-dot dot-orange" />LABOR PAID</th>
                  <th style={{ textAlign: 'center', minWidth: '125px' }} title="Calculated from amount paid vs total cost"><span className="th-dot dot-emerald" />PAYMENT %</th>
                  <th style={{ textAlign: 'center', minWidth: '125px' }} title="Physical work completed on site"><span className="th-dot dot-blue" />WORK DONE</th>
                  {isAdmin && <th style={{ textAlign: 'center', width: '90px' }}>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <SortableRow key={item.id} {...sharedProps(item, idx)} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-list">
            {items.map((item, idx) => (
              <SortableMobileCard key={item.id} {...sharedProps(item, idx)} />
            ))}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default WorkProgressTable;
