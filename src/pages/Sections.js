import React from 'react';
import { useAssets } from '../context/AssetContext';

export default function Sections() {
  const { sections, assets } = useAssets();

  const assetCountFor = section => assets.filter(asset =>
    asset.currentSection === section.name || asset.currentSection === section.code
  ).length;

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">Registry Control</p>
          <h1>Sections</h1>
        </div>
      </header>
      <section className="erp-panel">
        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Description</th>
                <th>Assets</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(section => (
                <tr key={section._id || section.code || section.name}>
                  <td>{section.code || '-'}</td>
                  <td>{section.name || '-'}</td>
                  <td>{section.description || '-'}</td>
                  <td>{assetCountFor(section)}</td>
                  <td>{section.updatedAt ? new Date(section.updatedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!sections.length && (
                <tr><td className="empty-cell" colSpan="5">No sections returned by the ERP API.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
