import React, { useMemo, useState } from 'react';
import './HomeDashboard.css';
import { useAssets } from './context/AssetContext';

function statusClass(status) {
  if (!status) return 'unknown';
  return String(status).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function HomeDashboard() {
  const {
    assets,
    sections,
    verificationResults,
    verificationHistory,
    dashboardMetrics,
    loading,
    error,
    refresh,
    verifyRoom
  } = useAssets();
  const [epcInput, setEpcInput] = useState('');
  const [currentSection, setCurrentSection] = useState('');

  const latestVerificationRows = useMemo(
    () => (verificationResults.length ? verificationResults : verificationHistory).slice(0, 10),
    [verificationHistory, verificationResults]
  );

  const sectionOptions = useMemo(() => {
    const fromAssets = assets.map(asset => asset.currentSection).filter(Boolean);
    const fromSections = sections.map(section => section.name || section.code).filter(Boolean);
    return Array.from(new Set([...fromSections, ...fromAssets]));
  }, [assets, sections]);

  const filteredAssets = useMemo(() => {
    if (!currentSection) return assets;
    return assets.filter(asset => asset.currentSection === currentSection);
  }, [assets, currentSection]);

  const submitVerification = async event => {
    event.preventDefault();
    const epcs = epcInput.split(/[\s,]+/).map(value => value.trim()).filter(Boolean);
    if (!epcs.length) return;

    await verifyRoom({
      epcs,
      currentSection,
      section: currentSection
    });
  };

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">RFID ERP</p>
          <h1>Asset Registry Dashboard</h1>
        </div>
        <button className="erp-button" type="button" onClick={refresh} disabled={loading}>
          Refresh
        </button>
      </header>

      {error && <div className="erp-alert">Unable to load ERP data: {error.message}</div>}

      <section className="metric-grid" aria-label="Asset metrics">
        <article className="metric-card">
          <span>Total Assets</span>
          <strong>{dashboardMetrics.totalAssets}</strong>
        </article>
        <article className="metric-card">
          <span>Verified</span>
          <strong>{dashboardMetrics.verified}</strong>
        </article>
        <article className="metric-card">
          <span>Missing</span>
          <strong>{dashboardMetrics.missing}</strong>
        </article>
        <article className="metric-card">
          <span>Section Mismatch</span>
          <strong>{dashboardMetrics.sectionMismatch}</strong>
        </article>
      </section>

      <section className="erp-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Verification</p>
            <h2>RFID Room Verification</h2>
          </div>
        </div>
        <form className="verification-form" onSubmit={submitVerification}>
          <label>
            Section
            <select value={currentSection} onChange={event => setCurrentSection(event.target.value)}>
              <option value="">All sections</option>
              {sectionOptions.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </label>
          <label>
            EPC input
            <textarea
              rows={4}
              value={epcInput}
              onChange={event => setEpcInput(event.target.value)}
              placeholder="Paste EPC values separated by line breaks or commas"
            />
          </label>
          <button className="erp-button primary" type="submit" disabled={loading}>
            Verify Room
          </button>
        </form>
      </section>

      <section className="erp-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Registry</p>
            <h2>Asset Table</h2>
          </div>
          <span>{filteredAssets.length} records</span>
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
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => (
                <tr key={asset._id || asset.epc}>
                  <td>{asset.epc || 'Unassigned'}</td>
                  <td>{asset.assetNumber || '-'}</td>
                  <td>{asset.assetName || asset.name || '-'}</td>
                  <td>{asset.currentSection || '-'}</td>
                  <td><span className={`status-badge ${statusClass(asset.status)}`}>{asset.status || 'Unknown'}</span></td>
                  <td>{asset.updatedAt ? new Date(asset.updatedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="erp-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Audit</p>
            <h2>Latest Verification Results</h2>
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
              {latestVerificationRows.map(result => (
                <tr key={result._id || `${result.epc}-${result.verifiedAt}`}>
                  <td>{result.epc || '-'}</td>
                  <td>{result.currentSection || '-'}</td>
                  <td>{result.expectedSection || '-'}</td>
                  <td><span className={`status-badge ${statusClass(result.status)}`}>{result.status || 'Unknown'}</span></td>
                  <td>{result.verifiedAt ? new Date(result.verifiedAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
              {!latestVerificationRows.length && (
                <tr>
                  <td colSpan="5" className="empty-cell">No verification history returned yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default HomeDashboard;
