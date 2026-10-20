import React from 'react';

const Dashboard = ({ items, selectedCategory }) => {
  const totals = items.reduce(
    (acc, item) => {
      acc.material += Number(item.material_cost) || 0;
      acc.materialPaid += Number(item.amount_paid) || 0;
      acc.labor += Number(item.labor_cost) || 0;
      acc.laborPaid += Number(item.labor_paid) || 0;
      acc.workProgressSum += Number(item.work_progress !== undefined ? item.work_progress : item.progress) || 0;
      return acc;
    },
    { material: 0, materialPaid: 0, labor: 0, laborPaid: 0, workProgressSum: 0 }
  );

  const totalCost = totals.material + totals.labor;
  const totalPaid = totals.materialPaid + totals.laborPaid;
  const balance = totalCost - totalPaid;
  const avgWorkProgress = items.length > 0 ? Math.round(totals.workProgressSum / items.length) : 0;
  const paymentProgress = totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency', currency: 'PKR', maximumFractionDigits: 0,
    }).format(amount);
  };

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (circumference * avgWorkProgress) / 100;

  return (
    <div className="dashboard-section">
      {/* Overall Progress Ring with Both Metrics */}
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
          <span className="progress-ring-text">{avgWorkProgress}%</span>
        </div>
        <div className="overall-progress-info">
          <span className="stat-title">
            {selectedCategory === 'All' ? 'Overall Work Done (Physical)' : `${selectedCategory} Work Done`}
          </span>
          <div className="overall-dual-badges">
            <span className="dual-badge work-badge">🔨 Work Done: {avgWorkProgress}%</span>
            <span className="dual-badge payment-badge">💳 Payments: {paymentProgress}% Paid</span>
          </div>
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
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Paid: {formatCurrency(totals.materialPaid)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Labor Cost</span>
          <span className="stat-value">{formatCurrency(totals.labor)}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Paid: {formatCurrency(totals.laborPaid)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Total Amount Paid</span>
          <span className="stat-value text-success">{formatCurrency(totalPaid)}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
