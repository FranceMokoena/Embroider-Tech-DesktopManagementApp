import React from 'react';
import { Link } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';

function badgeClass(status) {
  return String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function AssetRegistry() {
  const { assets, deleteAsset, loading } = useAssets();

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">Registry</p>
          <h1>Asset Registry</h1>
        </div>
      </header>

      <section className="erp-panel">
        <div className="panel-heading">
          <h2>Canonical Assets</h2>
          <span>{assets.length} records</span>
        </div>
        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>EPC</th>
                <th>Asset Number</th>
                <th>Name</th>
                <th>Current Section</th>
                <th>Status</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset._id || asset.epc}>
                  <td>{asset.epc || 'Unassigned'}</td>
                  <td>{asset.assetNumber || '-'}</td>
                  <td>{asset.assetName || asset.name || '-'}</td>
                  <td>{asset.currentSection || '-'}</td>
                  <td><span className={`status-badge ${badgeClass(asset.status)}`}>{asset.status || 'Unknown'}</span></td>
                  <td>{asset.department || '-'}</td>
                  <td className="table-actions">
                    <Link className="erp-button" to={`/assets/${asset._id || asset.epc}`}>View</Link>
                    <button className="erp-button" type="button" disabled={loading || !asset._id} onClick={() => deleteAsset(asset._id)}>
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
              {!assets.length && (
                <tr><td className="empty-cell" colSpan="7">No assets returned by the ERP API.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
