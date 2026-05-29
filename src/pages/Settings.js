import React from 'react';

const settings = [
  ['API contract', '/api/v1/assets, /api/v1/assets/sections, /api/v1/assets/transfers', 'Enforced'],
  ['Desktop shell', 'Local React build loaded through Electron loadFile', 'Enforced'],
  ['RFID identity', 'Asset.epc and Asset.currentSection', 'Enforced'],
  ['Legacy guard', 'Repository contamination check before build', 'Enforced']
];

export default function Settings() {
  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">System Governance</p>
          <h1>Settings</h1>
        </div>
      </header>
      <section className="erp-panel">
        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Control</th>
                <th>Configuration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {settings.map(([control, configuration, status]) => (
                <tr key={control}>
                  <td>{control}</td>
                  <td>{configuration}</td>
                  <td><span className="status-badge verified">{status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
