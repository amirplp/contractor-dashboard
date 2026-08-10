import React from 'react';

const Dashboard = ({ items, selectedCategory }) => {
  const totals = items.reduce(
    (acc, item) => {
      acc.material += Number(item.material_cost) || 0;
      acc.labor += Number(item.labor_cost) || 0;
      acc.paid += Number(item.amount_paid) || 0;
      acc.progressSum += Number(item.progress) || 0;
      return acc;
    },
    { material: 0, labor: 0, paid: 0, progressSum: 0 }
  );

  const totalCost = totals.material + totals.labor;
  const balance = totalCost - totals.paid;
  const avgProgress = items.length > 0 ? Math.round(totals.progressSum / items.length) : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency', currency: 'PKR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (circumference * avgProgress) / 100;

  return (
    <div className="dashboard-section">
      {/* Overall Progress Ring */}
      <div className="overall-progress-card">
        <div className="progress-ring-container">
          <svg className="progress-ring" width="100" height="100" viewBox="0 0 100 100">
            <circle className="progress-ring-bg" cx="50" cy="50" r="40" />
            <circle
              className="progress-ring-fill"
              cx="50" cy="50" r="40"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span className="progress-ring-text">{avgProgress}%</span>
        </div>
        <div className="overall-progress-info">
          <span className="stat-title">
            {selectedCategory === 'All' ? 'Overall Project Progress' : `${selectedCategory} Progress`}
          </span>
          <span className="overall-items">{items.length} work item{items.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <span className="stat-title">
            {selectedCategory === 'All' ? 'Total Balance' : `${selectedCategory} Balance`}
          </span>
          <span className="stat-value">{formatCurrency(balance)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Material Cost</span>
          <span className="stat-value">{formatCurrency(totals.material)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Labor Cost</span>
          <span className="stat-value">{formatCurrency(totals.labor)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Amount Paid</span>
          <span className="stat-value text-success">{formatCurrency(totals.paid)}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
