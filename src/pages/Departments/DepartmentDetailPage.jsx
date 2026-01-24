import React from 'react';
import { Link, useParams } from 'react-router-dom';
import './DepartmentsPage.css';

const departmentScreens = {
  'Quality Control': [
    { id: 'QC-001', location: 'Bay 1', status: 'Healthy', lastUpdated: 'Today' },
    { id: 'QC-002', location: 'Bay 2', status: 'Under repair', lastUpdated: '2 hours ago' },
    { id: 'QC-003', location: 'Bay 2', status: 'Repairable', lastUpdated: 'Yesterday' }
  ],
  'Production Line 1': [
    { id: 'PL1-010', location: 'Conveyor A', status: 'Healthy', lastUpdated: 'Today' },
    { id: 'PL1-011', location: 'Conveyor B', status: 'Repairable', lastUpdated: '3 hours ago' },
    { id: 'PL1-012', location: 'Conveyor B', status: 'Non-repairable', lastUpdated: 'Yesterday' }
  ],
  'Production Line 2': [
    { id: 'PL2-021', location: 'Station C', status: 'Healthy', lastUpdated: 'Today' },
    { id: 'PL2-022', location: 'Station D', status: 'Healthy', lastUpdated: 'Today' }
  ],
  Maintenance: [
    { id: 'MN-301', location: 'Workshop', status: 'Repairable', lastUpdated: '1 hour ago' },
    { id: 'MN-302', location: 'Workshop', status: 'Healthy', lastUpdated: 'Today' }
  ],
  Logistics: [
    { id: 'LG-401', location: 'Dock 1', status: 'Healthy', lastUpdated: 'Today' },
    { id: 'LG-402', location: 'Dock 2', status: 'Healthy', lastUpdated: 'Yesterday' }
  ]
};

export default function DepartmentDetailPage() {
  const { departmentName } = useParams();
  const decodedName = departmentName ? decodeURIComponent(departmentName) : 'Department';
  const screens = departmentScreens[decodedName] || [];

  return (
    <div className="page-view department-detail">
      <header className="page-view__header">
        <div>
          <h2>{decodedName}</h2>
          <p>All screens currently assigned to this department.</p>
        </div>
        <Link className="department-detail__back" to="/departments">
          ← Back to departments
        </Link>
      </header>
      <div className="department-detail__summary">
        <span>Total screens: {screens.length}</span>
        <span>
          Healthy:{' '}
          {screens.filter((screen) => screen.status.toLowerCase().includes('healthy')).length}
        </span>
      </div>
      <div className="department-detail-table">
        <table>
          <thead>
            <tr>
              <th>Screen ID</th>
              <th>Location</th>
              <th>Status</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {screens.length ? (
              screens.map((screen) => (
                <tr key={screen.id}>
                  <td>{screen.id}</td>
                  <td>{screen.location}</td>
                  <td>{screen.status}</td>
                  <td>{screen.lastUpdated}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No screen information available yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
