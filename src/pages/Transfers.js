import React from 'react';
import { useAssets } from '../context/AssetContext';

export default function Transfers() {
  const { transfers } = useAssets();

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">Asset Movement</p>
          <h1>Transfers</h1>
        </div>
      </header>
      <section className="erp-panel">
        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>EPC</th>
                <th>From Section</th>
                <th>To Section</th>
                <th>Status</th>
                <th>Transferred At</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(transfer => (
                <tr key={transfer._id || `${transfer.epc}-${transfer.transferredAt}`}>
                  <td>{transfer.epc || '-'}</td>
                  <td>{transfer.fromSection || '-'}</td>
                  <td>{transfer.toSection || '-'}</td>
                  <td><span className="status-badge">{transfer.status || 'Recorded'}</span></td>
                  <td>{transfer.transferredAt ? new Date(transfer.transferredAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!transfers.length && (
                <tr><td className="empty-cell" colSpan="5">No transfer records returned by the ERP API.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
