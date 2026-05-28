import React from 'react';
import { useAssets } from '../context/AssetContext';

function badgeClass(status) {
  return String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function AuditLogs() {
  const { verificationHistory } = useAssets();

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">Audit</p>
          <h1>Verification History</h1>
        </div>
      </header>
      <section className="erp-panel">
        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>EPC</th>
                <th>Asset</th>
                <th>Current Section</th>
                <th>Expected Section</th>
                <th>Status</th>
                <th>Verified At</th>
              </tr>
            </thead>
            <tbody>
              {verificationHistory.map(entry => (
                <tr key={entry._id || `${entry.epc}-${entry.verifiedAt}`}>
                  <td>{entry.epc || '-'}</td>
                  <td>{entry.assetId || '-'}</td>
                  <td>{entry.currentSection || '-'}</td>
                  <td>{entry.expectedSection || '-'}</td>
                  <td><span className={`status-badge ${badgeClass(entry.status)}`}>{entry.status || 'Unknown'}</span></td>
                  <td>{entry.verifiedAt ? new Date(entry.verifiedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!verificationHistory.length && (
                <tr><td className="empty-cell" colSpan="6">No verification history returned by the ERP API.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
