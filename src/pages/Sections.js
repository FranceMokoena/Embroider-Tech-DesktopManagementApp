import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';

const emptySection = {
  code: '',
  name: '',
  description: '',
  active: true
};

export default function Sections() {
  const { sections, assets, createSection, updateSection, deleteSection } = useAssets();
  const [form, setForm] = useState(emptySection);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const assetCountFor = section => assets.filter(asset =>
    asset.currentSection === section.name || asset.currentSection === section.code
  ).length;

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptySection);
    setEditingId(null);
    setError(null);
  };

  const editSection = section => {
    setEditingId(section._id);
    setForm({
      code: section.code || '',
      name: section.name || '',
      description: section.description || '',
      active: section.active !== false
    });
  };

  const submitSection = async event => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await updateSection(editingId, form);
      } else {
        await createSection(form);
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save section.');
    } finally {
      setSaving(false);
    }
  };

  const removeSection = async section => {
    if (!section._id) return;
    setSaving(true);
    setError(null);

    try {
      await deleteSection(section._id);
      if (editingId === section._id) resetForm();
    } catch (err) {
      setError(err.message || 'Unable to delete section.');
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
          <h2>{editingId ? 'Edit Section' : 'Create Section'}</h2>
          {editingId && <button className="erp-button" type="button" onClick={resetForm}>Cancel</button>}
        </div>

        {error && <div className="erp-alert">{error}</div>}

        <form className="management-form" onSubmit={submitSection}>
          <label>
            Code
            <input value={form.code} onChange={event => updateField('code', event.target.value)} placeholder="PROD" />
          </label>
          <label>
            Name
            <input value={form.name} onChange={event => updateField('name', event.target.value)} placeholder="Production" required />
          </label>
          <label>
            Description
            <input value={form.description} onChange={event => updateField('description', event.target.value)} />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.active}
              onChange={event => updateField('active', event.target.checked)}
            />
            Active
          </label>
          <button className="erp-button primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Section'}
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
                <th>Code</th>
                <th>Name</th>
                <th>Description</th>
                <th>Assets</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(section => (
                <tr key={section._id || section.code || section.name}>
                  <td>{section.code || '-'}</td>
                  <td>{section.name || '-'}</td>
                  <td>{section.description || '-'}</td>
                  <td>{assetCountFor(section)}</td>
                  <td><span className={`status-badge ${section.active === false ? 'missing' : 'verified'}`}>{section.active === false ? 'Inactive' : 'Active'}</span></td>
                  <td>{section.updatedAt ? new Date(section.updatedAt).toLocaleString() : '-'}</td>
                  <td className="table-actions">
                    <button className="erp-button" type="button" disabled={saving || !section._id} onClick={() => editSection(section)}>Edit</button>
                    <button className="erp-button" type="button" disabled={saving || !section._id || assetCountFor(section) > 0} onClick={() => removeSection(section)}>Delete</button>
                  </td>
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
