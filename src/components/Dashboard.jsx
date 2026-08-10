import React from 'react';

const Dashboard = ({ items, selectedCategory }) => {
  const totals = items.reduce(
    (acc, item) => {
      const mat = Number(item.material_cost) || 0;
      const lab = Number(item.labor_cost) || 0;
      const paid = Number(item.amount_paid) || 0;
      
      acc.material += mat;
      acc.labor += lab;
      acc.paid += paid;
      return acc;
    },
    { material: 0, labor: 0, paid: 0 }
  );

  const totalCost = totals.material + totals.labor;
  const balance = totalCost - totals.paid;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="stats-grid">
      <div className="stat-card primary">
        <span className="stat-title">
          {selectedCategory === 'All' ? 'Total Project Balance' : `${selectedCategory} Balance`}
        </span>
        <span className="stat-value">{formatCurrency(balance)}</span>
      </div>
      
      <div className="stat-card">
        <span className="stat-title">Total Material Cost</span>
        <span className="stat-value">{formatCurrency(totals.material)}</span>
      </div>

      <div className="stat-card">
        <span className="stat-title">Total Labor Cost</span>
        <span className="stat-value">{formatCurrency(totals.labor)}</span>
      </div>

      <div className="stat-card">
        <span className="stat-title">Total Amount Paid</span>
        <span className="stat-value text-success">{formatCurrency(totals.paid)}</span>
      </div>
    </div>
  );
};

export default Dashboard;
