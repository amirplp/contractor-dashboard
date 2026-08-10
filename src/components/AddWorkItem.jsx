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
    progress: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.company) return;

    onAddItem({
      id: crypto.randomUUID(),
      item: formData.item,
      company: formData.company,
      material_cost: Number(formData.material_cost) || 0,
      amount_paid: Number(formData.amount_paid) || 0,
      labor_name: formData.labor_name || 'N/A',
      labor_cost: Number(formData.labor_cost) || 0,
      progress: Math.min(100, Math.max(0, Number(formData.progress) || 0)),
      date: new Date().toISOString()
    });

    setFormData({
      item: '',
      company: '',
      material_cost: '',
      amount_paid: '',
      labor_name: '',
      labor_cost: '',
      progress: ''
    });
  };

  return (
    <div className="card add-item-card">
      <h2><PlusCircle size={24} /> New Work Item</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item / Category (e.g., Tiles, Wood)</label>
          <input
            type="text"
            name="item"
            value={formData.item}
            onChange={handleChange}
            placeholder="e.g. TILES"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Company / Vendor</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="e.g. SHAKEEL TRDRS"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Material Cost</label>
            <input
              type="number"
              name="material_cost"
              value={formData.material_cost}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label>Amount Paid</label>
            <input
              type="number"
              name="amount_paid"
              value={formData.amount_paid}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Labor Name</label>
            <input
              type="text"
              name="labor_name"
              value={formData.labor_name}
              onChange={handleChange}
              placeholder="e.g. AMIR"
            />
          </div>
          
          <div className="form-group">
            <label>Labor Cost</label>
            <input
              type="number"
              name="labor_cost"
              value={formData.labor_cost}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Work Progress (%)</label>
          <input
            type="number"
            name="progress"
            value={formData.progress}
            onChange={handleChange}
            placeholder="e.g. 20"
            min="0"
            max="100"
          />
        </div>

        <button type="submit">Add Work Item</button>
      </form>
    </div>
  );
};

export default AddWorkItem;
