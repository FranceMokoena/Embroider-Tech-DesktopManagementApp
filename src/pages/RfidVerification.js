import React, { useMemo, useState } from 'react';
import { useAssets } from '../context/AssetContext';

function badgeClass(status) {
  return String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function RfidVerification() {
  const [epcs, setEpcs] = useState('');
  const [currentSection, setCurrentSection] = useState('');
  const { assets, sections, verificationAudit, verificationResults, verifyRoom, loading } = useAssets();

  const sectionOptions = useMemo(() => {
    const assetSections = assets.map(asset => asset.currentSection).filter(Boolean);
    const registeredSections = sections.map(section => section.name || section.code).filter(Boolean);
    return Array.from(new Set([...registeredSections, ...assetSections]));
  }, [assets, sections]);

  const submit = async event => {
    event.preventDefault();
    const list = epcs.split(/[,\n\s]+/).filter(Boolean);
    if (!list.length || !currentSection) return;
    await verifyRoom({ epcs: list, currentSection, section: currentSection });
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
            <select value={currentSection} onChange={event => setCurrentSection(event.target.value)} required>
              <option value="">Select section</option>
              {sectionOptions.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </label>
          <label>
            EPC input
            <textarea className="compact-epc-input" rows={2} value={epcs} onChange={event => setEpcs(event.target.value)} />
          </label>
          <button className="erp-button primary" type="submit" disabled={loading || !currentSection}>Verify Room</button>
        </form>
      </section>

      <section className="erp-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Results</p>
            <h2>Room Audit Summary</h2>
          </div>
        </div>
        <section className="metric-grid">
          <article className="metric-card"><span>Expected</span><strong>{verificationAudit?.expectedCount ?? 0}</strong></article>
          <article className="metric-card"><span>Scanned</span><strong>{verificationAudit?.scannedCount ?? 0}</strong></article>
          <article className="metric-card"><span>Unique Scanned</span><strong>{verificationAudit?.uniqueScannedCount ?? verificationResults.length}</strong></article>
          <article className="metric-card"><span>Verification</span><strong>{verificationAudit?.verificationPercentage ?? 0}%</strong></article>
        </section>
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
