import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';

const AddWorkItem = ({ onAddItem }) => {
  const [formData, setFormData] = useState({
    item: '',
    company: '',
    material_cost: '',
    amount_paid: '',
    labor_name: '',
    labor_cost: '',
    labor_paid: '',
    work_progress: '',
    progress: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.company) return;

    const workDoneVal = Math.min(100, Math.max(0, Number(formData.work_progress ?? formData.progress) || 0));

    onAddItem({
      id: crypto.randomUUID(),
      item: formData.item,
      company: formData.company,
      material_cost: Number(formData.material_cost) || 0,
      amount_paid: Number(formData.amount_paid) || 0,
      labor_name: formData.labor_name || 'N/A',
      labor_cost: Number(formData.labor_cost) || 0,
      labor_paid: Number(formData.labor_paid) || 0,
      work_progress: workDoneVal,
      progress: workDoneVal,
      notes: formData.notes || '',
      date: new Date().toISOString()
    });

    setFormData({
      item: '', company: '', material_cost: '', amount_paid: '',
      labor_name: '', labor_cost: '', labor_paid: '', work_progress: '', progress: '', notes: ''
    });
  };

  return (
    <div className="card add-item-card">
      <h2><PlusCircle size={24} /> New Work Item</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item / Category</label>
          <input type="text" name="item" value={formData.item} onChange={handleChange} placeholder="e.g. TILES" required />
        </div>
        <div className="form-group">
          <label>Company / Vendor</label>
          <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="e.g. SHAKEEL TRDRS" required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Material Cost</label>
            <input type="number" name="material_cost" value={formData.material_cost} onChange={handleChange} placeholder="0" min="0" />
          </div>
          <div className="form-group">
            <label>Material Paid</label>
            <input type="number" name="amount_paid" value={formData.amount_paid} onChange={handleChange} placeholder="0" min="0" />
          </div>
        </div>
        <div className="form-group">
          <label>Labor Name</label>
          <input type="text" name="labor_name" value={formData.labor_name} onChange={handleChange} placeholder="e.g. AMIR" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Labor Cost</label>
            <input type="number" name="labor_cost" value={formData.labor_cost} onChange={handleChange} placeholder="0" min="0" />
          </div>
          <div className="form-group">
            <label>Labor Paid</label>
            <input type="number" name="labor_paid" value={formData.labor_paid} onChange={handleChange} placeholder="0" min="0" />
          </div>
        </div>
        <div className="form-group">
          <label>Work Done / Physical Progress (%)</label>
          <input
            type="number"
            name="work_progress"
            value={formData.work_progress ?? formData.progress ?? ''}
            onChange={handleChange}
            placeholder="e.g. 10 (Physical work done on site)"
            min="0"
            max="100"
          />
        </div>
        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g. 2 boxes broken on delivery..." rows="2" />
        </div>
        <button type="submit">Add Work Item</button>
      </form>
    </div>
  );
};

export default AddWorkItem;
