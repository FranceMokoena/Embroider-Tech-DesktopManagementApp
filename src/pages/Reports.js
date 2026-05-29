import React from 'react';
import { useAssets } from '../context/AssetContext';

export default function Reports() {
  const { dashboardMetrics, verificationHistory, transfers } = useAssets();

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">Governance</p>
          <h1>Reports</h1>
        </div>
      </header>
      <section className="metric-grid">
        <article className="metric-card"><span>Total Assets</span><strong>{dashboardMetrics.totalAssets}</strong></article>
        <article className="metric-card"><span>Verified</span><strong>{dashboardMetrics.verified}</strong></article>
        <article className="metric-card"><span>Transfer Records</span><strong>{transfers.length}</strong></article>
        <article className="metric-card"><span>Audit Events</span><strong>{verificationHistory.length}</strong></article>
      </section>
      <section className="erp-panel">
        <div className="panel-heading">
          <h2>Report Inventory</h2>
        </div>
        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Source</th>
                <th>Records</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Asset Registry</td><td>/api/v1/assets</td><td>{dashboardMetrics.totalAssets}</td><td><span className="status-badge verified">Available</span></td></tr>
              <tr><td>RFID Verification</td><td>/api/v1/assets/verification-history</td><td>{verificationHistory.length}</td><td><span className="status-badge verified">Available</span></td></tr>
              <tr><td>Transfers</td><td>/api/v1/assets/transfers</td><td>{transfers.length}</td><td><span className="status-badge verified">Available</span></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
