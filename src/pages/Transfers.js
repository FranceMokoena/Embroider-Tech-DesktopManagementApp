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
                <th>Asset</th>
                <th>EPC</th>
                <th>From</th>
                <th>To</th>
                <th>Date</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(transfer => (
                <tr key={transfer._id || `${transfer.epc}-${transfer.transferredAt}`}>
                  <td>{transfer.assetName || transfer.assetNumber || transfer.assetId || '-'}</td>
                  <td>{transfer.epc || '-'}</td>
                  <td>{transfer.fromSection || '-'}</td>
                  <td>{transfer.toSection || '-'}</td>
                  <td>{transfer.transferredAt ? new Date(transfer.transferredAt).toLocaleString() : '-'}</td>
                  <td>{transfer.reason || transfer.transferType || '-'}</td>
                </tr>
              ))}
              {!transfers.length && (
                <tr><td className="empty-cell" colSpan="6">No transfer records returned by the ERP API.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
