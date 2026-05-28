import React from 'react';

const roles = [
  ['Administrator', 'Full registry, verification, transfer, and settings access', 'Controlled'],
  ['Auditor', 'Read-only access to registry, reports, and verification history', 'Controlled'],
  ['Technician', 'Mobile RFID capture and assigned verification duties', 'Operational']
];

export default function Users() {
  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">Access Control</p>
          <h1>Users & Roles</h1>
        </div>
      </header>
      <section className="erp-panel">
        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Scope</th>
                <th>Control Level</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(([role, scope, level]) => (
                <tr key={role}>
                  <td>{role}</td>
                  <td>{scope}</td>
                  <td><span className="status-badge verified">{level}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
