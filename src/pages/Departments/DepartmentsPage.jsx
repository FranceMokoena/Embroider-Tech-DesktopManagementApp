import React, { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './DepartmentsPage.css';
import { createDepartment, getDepartments, getSessions, getUsers } from '../../services/apiClient';
import {
  buildDepartmentScanTotals,
  extractSessionsFromResponse,
  normalizeDepartmentKey
} from '../../utils/sessionAggregators';

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  status: 'ACTIVE',
  managerName: '',
  managerEmail: '',
  managerPhone: '',
  locationName: '',
  locationDetails: ''
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const successTimerRef = useRef(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [departmentSessionTotals, setDepartmentSessionTotals] = useState({});

  const refreshDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDepartments();
      setDepartments(response?.departments ?? []);
    } catch (err) {
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartmentSessionTotals = async () => {
    try {
      const [sessionResponse, usersResponse] = await Promise.all([getSessions(), getUsers()]);
      const sessions = extractSessionsFromResponse(sessionResponse);
      const users = usersResponse?.data ?? [];
      setDepartmentSessionTotals(buildDepartmentScanTotals(sessions, users));
    } catch {
      setDepartmentSessionTotals({});
    }
  };

  useEffect(() => {
    refreshDepartments();
    loadDepartmentSessionTotals();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const closeModal = () => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setIsModalOpen(false);
    setSuccessMessage('');
    setFormError(null);
    setEditingDepartment(null);
  };

  const openFormModal = (initialValues = EMPTY_FORM) => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setForm(initialValues);
    setSuccessMessage('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const getDepartmentKey = (dept) => dept._id ?? dept.id ?? dept.code;

  const openAddModal = () => {
    setEditingDepartment(null);
    openFormModal(EMPTY_FORM);
  };

  const handleEditDepartment = (dept) => {
    setEditingDepartment(dept);
    openFormModal({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      status: dept.status || 'ACTIVE',
      managerName: dept.managerName || '',
      managerEmail: dept.managerEmail || '',
      managerPhone: dept.managerPhone || '',
      locationName: dept.locationName || '',
      locationDetails: dept.locationDetails || ''
    });
  };

  const handleDeleteDepartment = (dept) => {
    const confirmed = window.confirm(
      `Delete ${dept.name || 'this department'} permanently? This cannot be undone.`
    );
    if (!confirmed) return;
    setDepartments((prev) => prev.filter((item) => getDepartmentKey(item) !== getDepartmentKey(dept)));
  };

  useEffect(() => () => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
    const payload = {
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase()
    };
    const response = await createDepartment(payload);
    const returned = response?.data ?? response?.department ?? payload;
    if (editingDepartment) {
      setDepartments((prev) =>
        prev.map((item) =>
          (item._id ?? item.id ?? item.code) === (editingDepartment._id ?? editingDepartment.id ?? editingDepartment.code)
            ? { ...editingDepartment, ...returned, ...payload }
            : item
        )
      );
      setSuccessMessage('Department updated successfully');
    } else {
      setDepartments((prev) => [...prev, returned]);
      setSuccessMessage('Department created successfully');
    }
    setForm(EMPTY_FORM);
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
    successTimerRef.current = setTimeout(() => {
      closeModal();
    }, 1400);
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Unable to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const getLabelKey = (dept) =>
    normalizeDepartmentKey(dept.name ?? dept.department ?? dept.label ?? dept.code ?? '');

  const getScreenCountValue = (dept) => {
    const labelKey = getLabelKey(dept);
    const sessionTotal = departmentSessionTotals[labelKey]?.scans;
    if (typeof sessionTotal === 'number') {
      return sessionTotal;
    }
    if (typeof dept.screenCount === 'number') return dept.screenCount;
    if (typeof dept.totalScreens === 'number') return dept.totalScreens;
    if (typeof dept.scannedScreens === 'number') return dept.scannedScreens;
    return null;
  };

  const getLocationText = (dept) => {
    const parts = [];
    if (dept.locationName) parts.push(dept.locationName);
    if (dept.locationDetails) parts.push(dept.locationDetails);
    return parts.join(' — ');
  };

  const buildExportRows = () => {
    return departments.map((dept) => [
      dept.name || '',
      dept.code || '',
      (dept.status || 'ACTIVE').toLowerCase(),
      getScreenCountValue(dept) ?? 'coming soon',
      dept.managerName || '',
      getLocationText(dept)
    ]);
  };

  const exportDepartmentsAsCSV = () => {
    const headers = ['Department Name', 'Code', 'Status', 'No of Screens', 'Manager', 'Location'];
    const rows = buildExportRows();
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'departments.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportDepartmentsAsPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Enterprise Operations', 40, 40);
    doc.setFontSize(12);
    doc.text('Embroideries Screen Management System Department report', 40, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated ${new Date().toLocaleString()}`, 40, 76);

    autoTable(doc, {
      startY: 100,
      head: [['Department Name', 'Code', 'Status', 'No of Screens', 'Manager', 'Location']],
      body: buildExportRows(),
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 6,
        halign: 'left'
      },
      headStyles: {
        fillColor: '#0b2e4a',
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 55 },
        2: { cellWidth: 50 },
        3: { cellWidth: 50 },
        4: { cellWidth: 90 },
        5: { cellWidth: 90 }
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save('department-report.pdf');
  };

  const handleExport = (format) => {
    setExportMenuOpen(false);
    if (format === 'csv') {
      exportDepartmentsAsCSV();
    } else {
      exportDepartmentsAsPDF();
    }
  };

  return (
    <div className="page-view">
      <header className="page-view__header department-header">
        <div>
          <h2>Departments</h2>
          <p>Organize the teams that deliver scan coverage.</p>
        </div>
        <div className="department-header__actions">
          <button type="button" className="department-action" onClick={refreshDepartments}>
            Refresh
          </button>
          <button type="button" className="department-action department-action--primary" onClick={openAddModal}>
            + Department
          </button>
          <div className="department-export">
            <button
              type="button"
              className="department-action department-action--secondary"
              onClick={() => setExportMenuOpen((prev) => !prev)}
            >
              Export
            </button>
            {exportMenuOpen && (
              <div className="department-export__menu">
                <button type="button" onClick={() => { handleExport('csv'); }}>
                  CSV
                </button>
                <button type="button" onClick={() => { handleExport('pdf'); }}>
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {loading && <p className="dashboard-page__status">Loading departments…</p>}
      {error && <p className="dashboard-page__status dashboard-page__status--error">{error}</p>}

      {!loading && !error && (
        <div className="department-table">
          <table>
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Code</th>
                <th>Status</th>
                <th>No of Screens</th>
                <th>Manager</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept._id ?? dept.id ?? dept.code}>
                  <td>{dept.name}</td>
                  <td>{dept.code}</td>
                  <td className={`department-table__status department-table__status--${(dept.status ?? 'ACTIVE').toLowerCase()}`}>
                    {dept.status ?? 'ACTIVE'}
                  </td>
                  <td className="department-table__screens">
                    {(() => {
                      const value = getScreenCountValue(dept);
                      if (typeof value === 'number') {
                        return value.toLocaleString();
                      }
                      return <em className="department-table__placeholder">coming soon</em>;
                    })()}
                  </td>
                  <td>{dept.managerName || '—'}</td>
                  <td>
                    {dept.locationName || '—'}
                    {dept.locationDetails ? ` — ${dept.locationDetails}` : ''}
                  </td>
                  <td className="department-table__actions">
                    <div className="department-table__row-actions">
                      <button
                        type="button"
                        className="department-table__action-button"
                        aria-label="Edit department"
                        onClick={() => handleEditDepartment(dept)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="department-table__action-button"
                        aria-label="Delete department"
                        onClick={() => handleDeleteDepartment(dept)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="department-modal">
          <div className="department-modal__inner">
            <div className="department-modal__header">
              <div>
                <p className="eyebrow-text">🏷️ Add Department</p>
                <h3>Capture the department attributes.</h3>
              </div>
              <button type="button" className="department-modal__close" onClick={closeModal}>
                ✕
              </button>
            </div>
            {successMessage && <p className="department-modal__success">{successMessage}</p>}
            <form className="department-form" onSubmit={handleSubmit}>
              <label>
                Department Name *
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Quality Control" />
              </label>
              <label>
                Code *
                <input name="code" value={form.code} onChange={handleChange} required placeholder="QC" />
              </label>
              <label>
                Description
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Purpose and scope" />
              </label>
              <label>
                Status
                <select name="status" value={form.status} onChange={handleChange}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Manager Name
                <input name="managerName" value={form.managerName} onChange={handleChange} placeholder="Manager full name" />
              </label>
              <label>
                Manager Email
                <input name="managerEmail" value={form.managerEmail} onChange={handleChange} placeholder="manager@company.com" />
              </label>
              <label>
                Manager Phone
                <input name="managerPhone" value={form.managerPhone} onChange={handleChange} placeholder="+27110001234" />
              </label>
              <label>
                Location Name
                <input name="locationName" value={form.locationName} onChange={handleChange} placeholder="Factory A – Block B" />
              </label>
              <label>
                Location Details
                <textarea name="locationDetails" value={form.locationDetails} onChange={handleChange} placeholder="Floor 2, Section C" />
              </label>
              <div className="department-form__actions">
                <button type="button" className="department-form__cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="department-form__submit" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Create Department'}
                </button>
              </div>
              {formError && <p className="department-form__error">{formError}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
