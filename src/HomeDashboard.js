import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import './HomeDashboard.css';
import { useAssets } from './context/AssetContext';

function conditionKey(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'healthy') return 'healthy';
  if (value === 'repairable') return 'repairable';
  if (value === 'beyond repair') return 'beyondRepair';
  return 'unknown';
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function PieChart({ title, value, total, color, children }) {
  const pct = percent(value, total);

  return (
    <article className="analytics-card pie-analytics-card">
      <div
        className="animated-pie"
        style={{
          '--pie-value': `${pct}%`,
          '--pie-color': color
        }}
        aria-label={`${title}: ${pct}%`}
      >
        <span>{pct}%</span>
      </div>
      <div>
        <p className="eyebrow">{title}</p>
        <strong>{value}</strong>
        <small>{children || `${value} of ${total || 0} assets`}</small>
      </div>
    </article>
  );
}

function HomeDashboard() {
  const {
    assets,
    sections,
    technicians,
    transfers,
    verificationHistory,
    dashboardMetrics,
    loading,
    error,
    refresh
  } = useAssets();

  const conditionCounts = useMemo(() => assets.reduce((acc, asset) => {
    acc[conditionKey(asset.status || asset.assetStatus)] += 1;
    return acc;
  }, { healthy: 0, repairable: 0, beyondRepair: 0, unknown: 0 }), [assets]);

  const sectionPerformance = useMemo(() => {
    const names = Array.from(new Set([
      ...sections.map(section => section.name || section.code).filter(Boolean),
      ...assets.map(asset => asset.currentSection).filter(Boolean)
    ]));

    return names.map(name => {
      const sectionAssets = assets.filter(asset => asset.currentSection === name);
      const counts = sectionAssets.reduce((acc, asset) => {
        acc[conditionKey(asset.status || asset.assetStatus)] += 1;
        return acc;
      }, { healthy: 0, repairable: 0, beyondRepair: 0, unknown: 0 });

      return {
        name,
        total: sectionAssets.length,
        ...counts
      };
    }).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [assets, sections]);

  const technicianPerformance = useMemo(() => {
    const names = new Set([
      ...technicians.map(tech => [tech.name, tech.surname].filter(Boolean).join(' ') || tech.username || tech.email).filter(Boolean),
      ...assets.map(asset => asset.assignedTo).filter(Boolean),
      ...verificationHistory.map(row => row.verifiedBy).filter(Boolean)
    ]);

    return Array.from(names).map(name => ({
      name,
      assets: assets.filter(asset => asset.assignedTo === name).length,
      verifications: verificationHistory.filter(row => row.verifiedBy === name).length
    })).sort((a, b) => (b.verifications + b.assets) - (a.verifications + a.assets)).slice(0, 6);
  }, [assets, technicians, verificationHistory]);

  const recentAudits = useMemo(() => verificationHistory.slice(0, 5), [verificationHistory]);
  const recentTransfers = useMemo(() => transfers.slice(0, 5), [transfers]);
  const verificationRate = percent(dashboardMetrics.verified, dashboardMetrics.totalAssets);

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">Amrod ERP</p>
          <h1>Asset Management Dashboard</h1>
        </div>
        <button className="erp-button" type="button" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </header>

      {error && <div className="erp-alert">Unable to load ERP data: {error.message}</div>}

      <section className="metric-grid" aria-label="Asset metrics">
        <article className="metric-card">
          <span>Total Assets</span>
          <strong>{dashboardMetrics.totalAssets}</strong>
        </article>
        <article className="metric-card">
          <span>Verified</span>
          <strong>{dashboardMetrics.verified}</strong>
        </article>
        <article className="metric-card">
          <span>Missing</span>
          <strong>{dashboardMetrics.missing}</strong>
        </article>
        <article className="metric-card">
          <span>Section Mismatch</span>
          <strong>{dashboardMetrics.sectionMismatch}</strong>
        </article>
      </section>

      <section className="analytics-grid" aria-label="Operational readiness">
        <article className="analytics-card operation-card">
          <p className="eyebrow">System Health</p>
          <strong>{error ? 'Attention Required' : loading ? 'Synchronizing' : 'Operational'}</strong>
          <small>{error ? error.message : loading ? 'Refreshing live ERP datasets' : 'Desktop, API, and RFID data services available'}</small>
        </article>
        <article className="analytics-card operation-card">
          <p className="eyebrow">Verification Progress</p>
          <strong>{verificationRate}%</strong>
          <small>{dashboardMetrics.verified} verified of {dashboardMetrics.totalAssets} assets</small>
        </article>
        <article className="analytics-card quick-action-card">
          <p className="eyebrow">Quick Actions</p>
          <div>
            <Link className="erp-button primary" to="/assets">Register Asset</Link>
            <Link className="erp-button" to="/verify">Verify Room</Link>
            <Link className="erp-button" to="/reports">Reports</Link>
          </div>
        </article>
      </section>

      <section className="analytics-grid" aria-label="Asset condition analytics">
        <PieChart title="Healthy" value={conditionCounts.healthy} total={assets.length} color="#16a34a" />
        <PieChart title="Repairable" value={conditionCounts.repairable} total={assets.length} color="#f59e0b" />
        <PieChart title="Beyond Repair" value={conditionCounts.beyondRepair} total={assets.length} color="#dc2626" />
      </section>

      <section className="analytics-layout">
        <div className="erp-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Analytics</p>
              <h2>Performance By Section</h2>
            </div>
          </div>
          <div className="analytics-list">
            {sectionPerformance.map(section => (
              <article className="performance-row" key={section.name}>
                <div>
                  <strong>{section.name}</strong>
                  <small>{section.total} assets</small>
                </div>
                <div className="stacked-bar" aria-hidden="true">
                  <span className="healthy" style={{ width: `${percent(section.healthy, section.total)}%` }} />
                  <span className="repairable" style={{ width: `${percent(section.repairable, section.total)}%` }} />
                  <span className="beyond-repair" style={{ width: `${percent(section.beyondRepair, section.total)}%` }} />
                </div>
                <div className="performance-counts">
                  <span>H {section.healthy}</span>
                  <span>R {section.repairable}</span>
                  <span>BR {section.beyondRepair}</span>
                </div>
              </article>
            ))}
            {!sectionPerformance.length && <p className="empty-cell">No section analytics available.</p>}
          </div>
        </div>

        <div className="erp-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Analytics</p>
              <h2>Performance By Technician</h2>
            </div>
          </div>
          <div className="analytics-list">
            {technicianPerformance.map(technician => (
              <article className="technician-row" key={technician.name}>
                <div>
                  <strong>{technician.name}</strong>
                  <small>{technician.assets} assets assigned</small>
                </div>
                <span>{technician.verifications} verifications</span>
              </article>
            ))}
            {!technicianPerformance.length && <p className="empty-cell">No technician analytics available.</p>}
          </div>
        </div>
      </section>

      <section className="analytics-layout">
        <div className="erp-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>Recent Verification Audits</h2>
            </div>
            <span>{verificationHistory.length} events</span>
          </div>
          <div className="table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>EPC</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Verified At</th>
                </tr>
              </thead>
              <tbody>
                {recentAudits.map((entry, index) => (
                  <tr key={entry._id || `${entry.epc}-${entry.verifiedAt}-${index}`}>
                    <td>{entry.epc || '-'}</td>
                    <td>{entry.currentSection || entry.expectedSection || '-'}</td>
                    <td><span className={`status-badge ${String(entry.status || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{entry.status || 'Unknown'}</span></td>
                    <td>{entry.verifiedAt ? new Date(entry.verifiedAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
                {!recentAudits.length && (
                  <tr><td className="empty-cell" colSpan="4">No recent verification activity available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="erp-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Logistics</p>
              <h2>Recent Transfers</h2>
            </div>
            <span>{transfers.length} records</span>
          </div>
          <div className="analytics-list">
            {recentTransfers.map((transfer, index) => (
              <article className="technician-row" key={transfer._id || `${transfer.epc}-${transfer.transferredAt}-${index}`}>
                <div>
                  <strong>{transfer.assetName || transfer.assetNumber || transfer.epc || 'Asset Transfer'}</strong>
                  <small>{transfer.fromSection || '-'} to {transfer.toSection || '-'}</small>
                </div>
                <span>{transfer.transferredAt ? new Date(transfer.transferredAt).toLocaleDateString() : 'Pending'}</span>
              </article>
            ))}
            {!recentTransfers.length && <p className="empty-cell">No recent transfers available.</p>}
          </div>
        </div>
      </section>

    </div>
  );
}

export default HomeDashboard;
