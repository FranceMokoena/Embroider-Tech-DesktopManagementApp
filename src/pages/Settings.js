import React from 'react';

const settings = [
  ['Asset contract', 'GET/POST /api/v1/assets, GET/PATCH/DELETE /api/v1/assets/:id', 'Enforced'],
  ['Section contract', 'GET/POST /api/v1/sections, PATCH/DELETE /api/v1/sections/:id', 'Enforced'],
  ['RFID contract', 'GET /api/v1/rfid/verification-history, POST /api/v1/rfid/verify-room, PATCH /api/v1/rfid/asset-status', 'Enforced'],
  ['Lifecycle contract', 'GET/POST /api/v1/transfers, GET /api/v1/transfers/:id', 'Enforced'],
  ['Profile contract', 'GET /api/auth/profile', 'Enforced'],
  ['Desktop shell', 'Local React build loaded through Electron loadFile', 'Enforced'],
  ['RFID identity', 'Asset.epc, Asset.section, Asset.currentSection, Asset.verificationStatus', 'Enforced'],
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
