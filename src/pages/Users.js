import React, { useState } from 'react';
import { useAssets } from '../context/AssetContext';

const emptyTechnician = {
  name: '',
  surname: '',
  username: '',
  email: '',
  phone: '',
  assignedSections: '',
  active: true
};

export default function Users() {
  const {
    sections,
    technicians,
    createTechnician,
    updateTechnician,
    deleteTechnician
  } = useAssets();
  const [form, setForm] = useState(emptyTechnician);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyTechnician);
    setEditingId(null);
    setError(null);
  };

  const formPayload = () => ({
    name: form.name,
    surname: form.surname,
    username: form.username,
    email: form.email,
    phone: form.phone,
    role: 'technician',
    active: form.active,
    assignedSections: form.assignedSections.split(',').map(value => value.trim()).filter(Boolean)
  });

  const editTechnician = technician => {
    setEditingId(technician._id);
    setForm({
      name: technician.name || '',
      surname: technician.surname || '',
      username: technician.username || '',
      email: technician.email || '',
      phone: technician.phone || '',
      assignedSections: (technician.assignedSections || []).join(', '),
      active: technician.active !== false
    });
  };

  const submitTechnician = async event => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await updateTechnician(editingId, formPayload());
      } else {
        await createTechnician(formPayload());
      }
      resetForm();
    } catch (err) {
      setError(err.message || 'Unable to save technician.');
    } finally {
      setSaving(false);
    }
  };

  const removeTechnician = async technician => {
    if (!technician._id) return;
    setSaving(true);
    setError(null);

    try {
      await deleteTechnician(technician._id);
      if (editingId === technician._id) resetForm();
    } catch (err) {
      setError(err.message || 'Unable to delete technician.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="erp-dashboard">
      <header className="erp-dashboard-header">
        <div>
          <p className="eyebrow">Access Control</p>
          <h1>Technicians</h1>
        </div>
      </header>

      <section className="erp-panel">
        <div className="panel-heading">
          <h2>{editingId ? 'Edit Technician' : 'Create Technician'}</h2>
          {editingId && <button className="erp-button" type="button" onClick={resetForm}>Cancel</button>}
        </div>

        {error && <div className="erp-alert">{error}</div>}

        <form className="management-form" onSubmit={submitTechnician}>
          <label>
            Name
            <input value={form.name} onChange={event => updateField('name', event.target.value)} required />
          </label>
          <label>
            Surname
            <input value={form.surname} onChange={event => updateField('surname', event.target.value)} />
          </label>
          <label>
            Username
            <input value={form.username} onChange={event => updateField('username', event.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={event => updateField('email', event.target.value)} required />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={event => updateField('phone', event.target.value)} />
          </label>
          <label>
            Assigned Sections
            <input
              value={form.assignedSections}
              onChange={event => updateField('assignedSections', event.target.value)}
              placeholder={sections.map(section => section.name || section.code).filter(Boolean).slice(0, 2).join(', ')}
            />
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
            {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Technician'}
          </button>
        </form>
      </section>

      <section className="erp-panel">
        <div className="panel-heading">
          <h2>Technician Registry</h2>
          <span>{technicians.length} records</span>
        </div>
        <div className="table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Assigned Sections</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map(technician => (
                <tr key={technician._id || technician.email}>
                  <td>{[technician.name, technician.surname].filter(Boolean).join(' ') || technician.username || '-'}</td>
                  <td>{technician.email || '-'}</td>
                  <td>{technician.phone || '-'}</td>
                  <td>{technician.assignedSections?.join(', ') || '-'}</td>
                  <td><span className={`status-badge ${technician.active === false ? 'missing' : 'verified'}`}>{technician.active === false ? 'Inactive' : 'Active'}</span></td>
                  <td className="table-actions">
                    <button className="erp-button" type="button" disabled={saving || !technician._id} onClick={() => editTechnician(technician)}>Edit</button>
                    <button className="erp-button" type="button" disabled={saving || !technician._id} onClick={() => removeTechnician(technician)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!technicians.length && (
                <tr><td className="empty-cell" colSpan="6">No technicians returned by the ERP API.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
