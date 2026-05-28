import React, { useMemo, useState } from 'react';
import { useAssets } from '../context/AssetContext';

function badgeClass(status) {
  return String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function RfidVerification() {
  const [epcs, setEpcs] = useState('');
  const [currentSection, setCurrentSection] = useState('');
  const { assets, sections, verificationResults, verifyRoom, loading } = useAssets();

  const sectionOptions = useMemo(() => {
    const assetSections = assets.map(asset => asset.currentSection).filter(Boolean);
    const registeredSections = sections.map(section => section.name || section.code).filter(Boolean);
    return Array.from(new Set([...registeredSections, ...assetSections]));
  }, [assets, sections]);

  const submit = async event => {
    event.preventDefault();
    const list = epcs.split(/[,\n\s]+/).filter(Boolean);
    if (!list.length) return;
    await verifyRoom({ epcs: list, currentSection });
  };

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">RFID Control</p>
          <h1>Room Verification</h1>
        </div>
      </header>

      <section className="erp-panel">
        <form className="verification-form" onSubmit={submit}>
          <label>
            Current section
            <select value={currentSection} onChange={event => setCurrentSection(event.target.value)}>
              <option value="">Unassigned section</option>
              {sectionOptions.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </label>
          <label>
            EPC input
            <textarea rows={5} value={epcs} onChange={event => setEpcs(event.target.value)} />
          </label>
          <button className="erp-button primary" type="submit" disabled={loading}>Verify Room</button>
        </form>
      </section>

      <section className="erp-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Results</p>
            <h2>Verification Table</h2>
          </div>
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
              {verificationResults.map(result => (
                <tr key={result._id || `${result.epc}-${result.verifiedAt}`}>
                  <td>{result.epc || '-'}</td>
                  <td>{result.currentSection || '-'}</td>
                  <td>{result.expectedSection || '-'}</td>
                  <td><span className={`status-badge ${badgeClass(result.status)}`}>{result.status || 'Unknown'}</span></td>
                  <td>{result.verifiedAt ? new Date(result.verifiedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!verificationResults.length && (
                <tr><td className="empty-cell" colSpan="5">No RFID verification results yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
