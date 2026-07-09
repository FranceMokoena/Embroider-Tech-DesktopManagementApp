import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';

function badgeClass(status) {
  return String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

const emptyAsset = {
  assetName: '',
  assetNumber: '',
  serialNumber: '',
  epc: '',
  section: '',
  status: 'Healthy'
};

export default function AssetRegistry() {
  const {
    assets,
    sections,
    createAsset,
    deleteAsset,
    loading,
    verifyRoom
  } = useAssets();
  const [assetForm, setAssetForm] = useState(emptyAsset);
  const [assetSaving, setAssetSaving] = useState(false);
  const [assetError, setAssetError] = useState(null);
  const [epcInput, setEpcInput] = useState('');
  const [currentSection, setCurrentSection] = useState('');

  const sectionOptions = useMemo(() => {
    const fromAssets = assets.map(asset => asset.currentSection).filter(Boolean);
    const fromSections = sections.map(section => section.name || section.code).filter(Boolean);
    return Array.from(new Set([...fromSections, ...fromAssets]));
  }, [assets, sections]);

  const filteredAssets = useMemo(() => {
    if (!currentSection) return assets;
    return assets.filter(asset => asset.currentSection === currentSection);
  }, [assets, currentSection]);

  const updateAssetField = (key, value) => {
    setAssetForm(prev => ({ ...prev, [key]: value }));
  };

  const submitAsset = async event => {
    event.preventDefault();
    setAssetSaving(true);
    setAssetError(null);

    try {
      await createAsset({
        assetName: assetForm.assetName,
        assetNumber: assetForm.assetNumber,
        serialNumber: assetForm.serialNumber,
        epc: assetForm.epc,
        section: assetForm.section,
        status: assetForm.status
      });
      setAssetForm(emptyAsset);
    } catch (err) {
      setAssetError(err.message || 'Unable to create asset.');
    } finally {
      setAssetSaving(false);
    }
  };

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
          <p className="eyebrow">Assets</p>
          <h1>All Assets</h1>
        </div>
      </header>

      <section className="erp-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Registration</p>
            <h2>Register New Asset</h2>
          </div>
        </div>
 
        {assetError && <div className="erp-alert">{assetError}</div>}

        <form className="management-form" onSubmit={submitAsset}>
          <label>
            Asset Name
            <input value={assetForm.assetName} onChange={event => updateAssetField('assetName', event.target.value)} required />
          </label>
          <label>
            Asset Number
            <input value={assetForm.assetNumber} onChange={event => updateAssetField('assetNumber', event.target.value)} required />
          </label>
          <label>
            Serial Number
            <input value={assetForm.serialNumber} onChange={event => updateAssetField('serialNumber', event.target.value)} />
          </label>
          <label>
            EPC
            <input
              value={assetForm.epc}
              onChange={event => updateAssetField('epc', event.target.value)}
              pattern="[A-Za-z0-9]{12,24}"
              required
            />
          </label>
          <label>
            Section
            <select value={assetForm.section} onChange={event => updateAssetField('section', event.target.value)}>
              <option value="">Unassigned</option>
              {sectionOptions.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select value={assetForm.status} onChange={event => updateAssetField('status', event.target.value)}>
              <option value="Healthy">Healthy</option>
              <option value="Repairable">Repairable</option>
              <option value="Beyond Repair">Beyond Repair</option>
            </select>
          </label>
          <button className="erp-button primary" type="submit" disabled={assetSaving}>
            {assetSaving ? 'Saving...' : 'Register Asset'}
          </button>
        </form>
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
              className="compact-epc-input"
              rows={2}
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
                <th>Asset Name</th>
                <th>Asset Number</th>
                <th>Section</th>
                <th>Status</th>
                <th>Serial Number</th>
                <th>Created Date</th>
                <th>Updated Date</th>
                <th>Current Section</th>
                <th>Verification Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => (
                <tr key={asset._id || asset.epc}>
                  <td>{asset.epc || 'Unassigned'}</td>
                  <td>{asset.assetName || asset.name || '-'}</td>
                  <td>{asset.assetNumber || '-'}</td>
                  <td>{asset.section || asset.currentSection || '-'}</td>
                  <td><span className={`status-badge ${badgeClass(asset.status)}`}>{asset.status || 'Unknown'}</span></td>
                  <td>{asset.serialNumber || '-'}</td>
                  <td>{asset.createdAt ? new Date(asset.createdAt).toLocaleString() : '-'}</td>
                  <td>{asset.updatedAt ? new Date(asset.updatedAt).toLocaleString() : '-'}</td>
                  <td>{asset.currentSection || '-'}</td>
                  <td>{asset.verificationStatus || '-'}</td>
                  <td className="table-actions">
                    <Link className="erp-button" to={`/assets/${asset._id || asset.epc}`}>View</Link>
                    <button className="erp-button" type="button" disabled={loading || !asset._id} onClick={() => deleteAsset(asset._id)}>
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredAssets.length && (
                <tr><td className="empty-cell" colSpan="11">No assets returned by the ERP API.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
