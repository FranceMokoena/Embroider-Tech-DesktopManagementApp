import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';

function badgeClass(status) {
  return String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function AssetDetails() {
  const { id } = useParams();
  const { assets } = useAssets();
  const asset = assets.find(item => item._id === id || item.epc === id);

  if (!asset) {
    return (
      <div className="erp-dashboard">
        <header className="erp-dashboard-header">
          <div>
            <p className="eyebrow">Registry</p>
            <h1>Asset Details</h1>
          </div>
          <Link className="erp-button" to="/assets">Back to Registry</Link>
        </header>
        <section className="erp-panel">
          <p className="empty-cell">Asset not found in the current registry state.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">Asset Master Record</p>
          <h1>{asset.assetNumber || asset.epc || 'Asset Details'}</h1>
        </div>
        <Link className="erp-button" to="/assets">Back to Registry</Link>
      </header>

      <section className="metric-grid">
        <article className="metric-card"><span>EPC</span><strong className="metric-text">{asset.epc || '-'}</strong></article>
        <article className="metric-card"><span>Current Section</span><strong className="metric-text">{asset.currentSection || '-'}</strong></article>
        <article className="metric-card"><span>Status</span><strong className="metric-text">{asset.verificationStatus || asset.status || '-'}</strong></article>
        <article className="metric-card"><span>Department</span><strong className="metric-text">{asset.department || '-'}</strong></article>
      </section>

      <section className="erp-panel">
        <div className="panel-heading">
          <h2>Verification History</h2>
          <span>{asset.verificationHistory.length} records</span>
        </div>
        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>EPC</th>
                <th>Current Section</th>
                <th>Expected Section</th>
                <th>Status</th>
                <th>Verified At</th>
              </tr>
            </thead>
            <tbody>
              {asset.verificationHistory.map((entry, index) => (
                <tr key={entry._id || `${entry.epc}-${index}`}>
                  <td>{entry.epc || asset.epc || '-'}</td>
                  <td>{entry.currentSection || '-'}</td>
                  <td>{entry.expectedSection || '-'}</td>
                  <td><span className={`status-badge ${badgeClass(entry.status)}`}>{entry.status || 'Unknown'}</span></td>
                  <td>{entry.verifiedAt ? new Date(entry.verifiedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!asset.verificationHistory.length && (
                <tr><td className="empty-cell" colSpan="5">No verification history is attached to this asset.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
