import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  AlertCircle,
  Package,
  Hammer,
  CheckCircle2,
  Coins,
  Building2,
  Sparkles
} from 'lucide-react';

/* Custom rich tooltip for the Recharts chart */
const CustomChartTooltip = ({ active, payload, label, mode, formatCurrency }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="custom-chart-tooltip">
      <div className="tooltip-header">
        <span className="tooltip-title">{data.fullName || label}</span>
        {data.company && (
          <span className="tooltip-company">
            <Building2 size={11} /> {data.company}
          </span>
        )}
      </div>

      <div className="tooltip-body">
        {mode === 'percentage' ? (
          <>
            <div className="tooltip-metric work-metric">
              <span className="metric-indicator work-indicator" />
              <span className="metric-label">🔨 Physical Work Done:</span>
              <strong className="metric-value work-text">{data.workDone}%</strong>
            </div>
            <div className="tooltip-metric payment-metric">
              <span className="metric-indicator payment-indicator" />
              <span className="metric-label">💳 Financial Payment:</span>
              <strong className="metric-value payment-text">{data.paymentPaid}%</strong>
            </div>
            <div className="tooltip-divider" />
            <div className="tooltip-mini-grid">
              <div className="mini-stat">
                <span className="mini-label">Budget:</span>
                <span className="mini-val">{formatCurrency(data.totalCost)}</span>
              </div>
              <div className="mini-stat">
                <span className="mini-label">Paid:</span>
                <span className="mini-val text-success">{formatCurrency(data.paid)}</span>
              </div>
              <div className="mini-stat">
                <span className="mini-label">Balance:</span>
                <span className="mini-val text-danger">{formatCurrency(data.balance)}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="tooltip-metric payment-metric">
              <span className="metric-indicator payment-indicator" />
              <span className="metric-label">💳 Amount Paid:</span>
              <strong className="metric-value payment-text">{formatCurrency(data.paid)}</strong>
            </div>
            <div className="tooltip-metric balance-metric">
              <span className="metric-indicator balance-indicator" />
              <span className="metric-label">⚠️ Balance Due:</span>
              <strong className="metric-value balance-text">{formatCurrency(data.balance)}</strong>
            </div>
            <div className="tooltip-divider" />
            <div className="tooltip-mini-grid">
              <div className="mini-stat">
                <span className="mini-label">Total Cost:</span>
                <span className="mini-val">{formatCurrency(data.totalCost)}</span>
              </div>
              <div className="mini-stat">
                <span className="mini-label">Work Done:</span>
                <span className="mini-val text-accent">{data.workDone}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const cleanItemName = (raw) => {
  if (!raw) return 'ITEM';
  let s = raw.trim();
  s = s.replace(/\s+plus\s+/gi, ' & ');
  s = s.replace(/\s*\([^)]*\)/g, ''); // remove parenthetical remarks
  const parts = s.split(/[/,]/).map(p => p.trim()).filter(Boolean);
  let main = parts[0];
  if (parts.length > 1 && parts[0].length < 8 && parts[1].length < 10) {
    main = parts[0] + ' & ' + parts[1];
  }
  main = main.replace(/\s+(fittings?|showers?|comde.*|inside.*|two tone.*|salary.*|cost.*)$/i, '');
  const clean = main.toUpperCase().trim();
  return clean.length > 13 ? clean.substring(0, 12) + '…' : clean;
};

const Dashboard = ({ items, selectedCategory }) => {
  const [chartMode, setChartMode] = useState('percentage'); // 'percentage' | 'financial'
  const [itemScope, setItemScope] = useState('key'); // 'key' | 'all'

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
    }).format(amount || 0);
  };

  const formatShortCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return `${num}`;
  };

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (circumference * avgWorkProgress) / 100;

  // Prepare chart data comparing Work Done % vs Payment %
  const chartData = useMemo(() => {
    if (!items || items.length === 0) return [];

    let displayList = items;

    // When viewing 'All' and we have many items, if 'key' scope is selected, prioritize major active milestones
    if (selectedCategory === 'All' && items.length > 8 && itemScope === 'key') {
      const activeItems = items.filter(it => {
        const cost = (Number(it.material_cost) || 0) + (Number(it.labor_cost) || 0);
        const work = Number(it.work_progress ?? it.progress) || 0;
        const paid = (Number(it.amount_paid) || 0) + (Number(it.labor_paid) || 0);
        return cost > 0 || work > 0 || paid > 0;
      });

      // Sort by total cost descending to feature the key project milestones
      displayList = [...activeItems].sort((a, b) => {
        const costA = (Number(a.material_cost) || 0) + (Number(a.labor_cost) || 0);
        const costB = (Number(b.material_cost) || 0) + (Number(b.labor_cost) || 0);
        return costB - costA;
      }).slice(0, 8);
    }

    return displayList.map(item => {
      const total = (Number(item.material_cost) || 0) + (Number(item.labor_cost) || 0);
      const paid = (Number(item.amount_paid) || 0) + (Number(item.labor_paid) || 0);
      const bal = Math.max(0, total - paid);
      const payPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : (paid > 0 ? 100 : 0);
      const rawWork = item.work_progress !== undefined ? item.work_progress : (item.progress || 0);
      const workVal = Math.min(100, Math.max(0, Number(rawWork) || 0));

      // When category is specifically filtered, distinguish items by Vendor/Company
      let displayName;
      if (selectedCategory !== 'All' && item.company && item.company !== 'N/A') {
        const comp = item.company.toUpperCase().trim();
        displayName = comp.length > 12 ? comp.substring(0, 11) + '…' : comp;
      } else {
        displayName = cleanItemName(item.item);
      }

      const fullName = (item.item || 'ITEM').toUpperCase().trim();

      return {
        id: item.id,
        name: displayName,
        fullName: item.company && item.company !== 'N/A' ? `${fullName} (${item.company})` : fullName,
        company: item.company || 'N/A',
        workDone: workVal,
        paymentPaid: payPct,
        totalCost: total,
        paid,
        balance: bal
      };
    });
  }, [items, selectedCategory, itemScope]);

  return (
    <div className="dashboard-section">
      {/* Top Hero Card: Overall Progress Ring + Interactive Executive Chart */}
      <div className="overall-progress-card hero-grid-card">
        {/* Left Side: Circular Gauge & Key Summary Badges */}
        <div className="hero-summary-column">
          <div className="progress-ring-container">
            <svg className="progress-ring" width="104" height="104" viewBox="0 0 100 100">
              <circle className="progress-ring-bg" cx="50" cy="50" r="40" />
              <circle
                className="progress-ring-fill"
                cx="50" cy="50" r="40"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="progress-ring-center-content">
              <span className="progress-ring-text">{avgWorkProgress}%</span>
              <span className="progress-ring-sub">Done</span>
            </div>
          </div>

          <div className="overall-progress-info">
            <div className="hero-title-wrap">
              <span className="stat-title hero-status-title">
                {selectedCategory === 'All' ? 'Overall Work Done (Physical)' : `${selectedCategory} Work Done`}
              </span>
              <span className="hero-items-pill">{items.length} items</span>
            </div>

            <div className="overall-dual-badges">
              <span className="dual-badge work-badge" title="Physical work completed on site">
                🔨 Work Done: <strong>{avgWorkProgress}%</strong>
              </span>
              <span className="dual-badge payment-badge" title="Financial payments released to contractor">
                💳 Payments: <strong>{paymentProgress}% Paid</strong>
              </span>
              <span className={`dual-badge ${balance > 0 ? 'balance-due-badge' : 'balance-cleared-badge'}`} title="Remaining balance to be paid">
                {balance > 0 ? `⚖️ Due: ${formatCurrency(balance)}` : '✓ Cleared'}
              </span>
            </div>

            <div className="hero-mini-meta">
              <span>Budget: <strong>{formatCurrency(totalCost)}</strong></span>
              <span className="meta-dot">•</span>
              <span>Paid: <strong className="text-success">{formatCurrency(totalPaid)}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Graph & Chart (filling the empty white space) */}
        <div className="hero-chart-column">
          <div className="chart-header-row">
            <div className="chart-title-group">
              <div className="chart-title-icon-wrap">
                <TrendingUp size={16} />
              </div>
              <div>
                <h4 className="chart-main-title">
                  {chartMode === 'percentage'
                    ? 'Physical Work Done vs Financial Payment'
                    : 'Budget vs Amount Paid Breakdown'}
                </h4>
                <p className="chart-subtitle">
                  {chartMode === 'percentage'
                    ? 'Comparing physical site completion (%) vs money paid (%)'
                    : 'Financial view of total cost, amount settled, and balance'}
                </p>
              </div>
            </div>

            <div className="chart-controls-group">
              {selectedCategory === 'All' && items.length > 8 && (
                <div className="chart-toggle-pill-group">
                  <button
                    type="button"
                    className={`chart-view-toggle-btn ${itemScope === 'key' ? 'active' : ''}`}
                    onClick={() => setItemScope('key')}
                    title="View top key active milestones"
                  >
                    <span>Key Milestones (8)</span>
                  </button>
                  <button
                    type="button"
                    className={`chart-view-toggle-btn ${itemScope === 'all' ? 'active' : ''}`}
                    onClick={() => setItemScope('all')}
                    title="View all project items"
                  >
                    <span>All ({items.length})</span>
                  </button>
                </div>
              )}

              <div className="chart-toggle-pill-group">
                <button
                  type="button"
                  className={`chart-view-toggle-btn ${chartMode === 'percentage' ? 'active' : ''}`}
                  onClick={() => setChartMode('percentage')}
                  title="View Work Done % vs Payment %"
                >
                  <TrendingUp size={13} />
                  <span>Work vs Paid %</span>
                </button>
                <button
                  type="button"
                  className={`chart-view-toggle-btn ${chartMode === 'financial' ? 'active' : ''}`}
                  onClick={() => setChartMode('financial')}
                  title="View Paid vs Balance in PKR"
                >
                  <Coins size={13} />
                  <span>PKR Budget</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chart Display */}
          <div className="hero-chart-wrapper">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                  barGap={4}
                >
                  <defs>
                    {/* Work Done Gradient: Electric Blue #3b82f6 */}
                    <linearGradient id="workGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.88} />
                    </linearGradient>
                    {/* Payment Paid Gradient: Emerald Green #10b981 */}
                    <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.88} />
                    </linearGradient>
                    {/* Balance Due Gradient: Rose/Red #ef4444 */}
                    <linearGradient id="dueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.88} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.7} />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    domain={chartMode === 'percentage' ? [0, 100] : [0, 'auto']}
                    tickFormatter={chartMode === 'percentage' ? (v) => `${v}%` : formatShortCurrency}
                  />
                  <Tooltip
                    content={
                      <CustomChartTooltip
                        mode={chartMode}
                        formatCurrency={formatCurrency}
                      />
                    }
                  />

                  {chartMode === 'percentage' && (
                    <ReferenceLine
                      y={100}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{
                        value: '100% Target',
                        position: 'insideTopRight',
                        fill: '#94a3b8',
                        fontSize: 10,
                        fontWeight: 600
                      }}
                    />
                  )}

                  {chartMode === 'percentage' ? (
                    <>
                      {/* Work Done Bar - Blue #3b82f6 */}
                      <Bar
                        dataKey="workDone"
                        name="Physical Work Done (%)"
                        fill="url(#workGrad)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      />
                      {/* Payment Paid Bar - Green #10b981 */}
                      <Bar
                        dataKey="paymentPaid"
                        name="Financial Payment (%)"
                        fill="url(#payGrad)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      />
                    </>
                  ) : (
                    <>
                      {/* Amount Paid Bar - Green #10b981 */}
                      <Bar
                        dataKey="paid"
                        name="Amount Paid (PKR)"
                        fill="url(#payGrad)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      />
                      {/* Balance Due Bar - Red #ef4444 */}
                      <Bar
                        dataKey="balance"
                        name="Balance Due (PKR)"
                        fill="url(#dueGrad)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={22}
                      />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-state">
                <Sparkles size={20} className="empty-sparkle" />
                <p>No work items to display in chart</p>
              </div>
            )}
          </div>

          {/* Chart Legend Footer */}
          <div className="chart-legend-row">
            {chartMode === 'percentage' ? (
              <>
                <div className="legend-chip">
                  <span className="legend-dot" style={{ backgroundColor: '#3b82f6' }} />
                  <span>🔨 Work Done (%)</span>
                </div>
                <div className="legend-chip">
                  <span className="legend-dot" style={{ backgroundColor: '#10b981' }} />
                  <span>💳 Payment Paid (%)</span>
                </div>
              </>
            ) : (
              <>
                <div className="legend-chip">
                  <span className="legend-dot" style={{ backgroundColor: '#10b981' }} />
                  <span>💳 Amount Paid (PKR)</span>
                </div>
                <div className="legend-chip">
                  <span className="legend-dot" style={{ backgroundColor: '#ef4444' }} />
                  <span>⚠️ Balance Due (PKR)</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid: Highly Colorful & Distinctive Cards */}
      <div className="stats-grid">
        {/* Total Balance Card (Red) */}
        <div className="stat-card card-balance">
          <div className="stat-card-header">
            <span className="stat-title">
              {selectedCategory === 'All' ? 'Total Balance Due' : `${selectedCategory} Balance`}
            </span>
            <div className="stat-icon-wrapper icon-balance">
              <AlertCircle size={18} />
            </div>
          </div>
          <span className="stat-value text-danger">{formatCurrency(balance)}</span>
          <div className="stat-card-footer">
            <span className={`stat-pill ${balance > 0 ? 'pill-balance' : 'pill-paid'}`}>
              {balance > 0 ? `⚠️ ${100 - paymentProgress}% Unpaid` : '✓ Fully Settled'}
            </span>
            <span className="stat-subtext">of {formatCurrency(totalCost)} total</span>
          </div>
        </div>

        {/* Material Cost Card (Indigo / Purple #6366f1) */}
        <div className="stat-card card-material">
          <div className="stat-card-header">
            <span className="stat-title">Material Cost</span>
            <div className="stat-icon-wrapper icon-material">
              <Package size={18} />
            </div>
          </div>
          <span className="stat-value text-indigo">{formatCurrency(totals.material)}</span>
          <div className="stat-card-footer">
            <div className="stat-mini-bar">
              <div
                className="stat-mini-bar-fill fill-indigo"
                style={{
                  width: `${totals.material > 0 ? Math.min(100, Math.round((totals.materialPaid / totals.material) * 100)) : 0}%`
                }}
              />
            </div>
            <span className="stat-subtext">
              Paid: <strong>{formatCurrency(totals.materialPaid)}</strong> ({totals.material > 0 ? Math.round((totals.materialPaid / totals.material) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Labor Cost Card (Warm Amber / Orange #f59e0b) */}
        <div className="stat-card card-labor">
          <div className="stat-card-header">
            <span className="stat-title">Labor Cost</span>
            <div className="stat-icon-wrapper icon-labor">
              <Hammer size={18} />
            </div>
          </div>
          <span className="stat-value text-amber">{formatCurrency(totals.labor)}</span>
          <div className="stat-card-footer">
            <div className="stat-mini-bar">
              <div
                className="stat-mini-bar-fill fill-amber"
                style={{
                  width: `${totals.labor > 0 ? Math.min(100, Math.round((totals.laborPaid / totals.labor) * 100)) : 0}%`
                }}
              />
            </div>
            <span className="stat-subtext">
              Paid: <strong>{formatCurrency(totals.laborPaid)}</strong> ({totals.labor > 0 ? Math.round((totals.laborPaid / totals.labor) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Total Amount Paid Card (Emerald Green) */}
        <div className="stat-card card-paid">
          <div className="stat-card-header">
            <span className="stat-title">Total Amount Paid</span>
            <div className="stat-icon-wrapper icon-paid">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <span className="stat-value text-success">{formatCurrency(totalPaid)}</span>
          <div className="stat-card-footer">
            <span className="stat-pill pill-paid">
              ✓ {paymentProgress}% Settled
            </span>
            <span className="stat-subtext">Materials & Labor combined</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
