import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';

const emptySection = {
  section: '',
  manager: '',
  description: '',
};

export default function Sections() {
  const { sections, createSection } = useAssets();
  const [form, setForm] = useState(emptySection);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptySection);
    setError(null);
  };

  const submitSection = async event => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await createSection(form);
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save section.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">Registry Control</p>
          <h1>Sections</h1>
        </div>
      </header>

      <section className="erp-panel">
        <div className="panel-heading">
          <h2>Create Section</h2>
        </div>

        {error && <div className="erp-alert">{error}</div>}

        <form className="management-form" onSubmit={submitSection}>
          <label>
            Section
            <input value={form.section} onChange={event => updateField('section', event.target.value)} placeholder="Production" required />
          </label>
          <label>
            Manager
            <input value={form.manager} onChange={event => updateField('manager', event.target.value)} placeholder="Manager name" required />
          </label>
          <label>
            Description
            <input value={form.description} onChange={event => updateField('description', event.target.value)} />
          </label>
          <button className="erp-button primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Create Section'}
          </button>
        </form>
      </section>

      <section className="erp-panel">
        <div className="panel-heading">
          <h2>Section Registry</h2>
          <span>{sections.length} records</span>
        </div>
        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Created</th>
                <th>Manager</th>
                <th>Total Assets</th>
                <th>Healthy</th>
                <th>Repairable</th>
                <th>Beyond Repair</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(section => (
                <tr key={section._id || section.code || section.name}>
                  <td>{section.section || section.name || '-'}</td>
                  <td>{section.createdAt ? new Date(section.createdAt).toLocaleString() : '-'}</td>
                  <td>{section.manager || '-'}</td>
                  <td>{section.totalAssets ?? 0}</td>
                  <td>{section.healthy ?? 0}</td>
                  <td>{section.repairable ?? 0}</td>
                  <td>{section.beyondRepair ?? 0}</td>
                </tr>
              ))}
              {!sections.length && (
                <tr><td className="empty-cell" colSpan="7">No sections returned by the ERP API.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
