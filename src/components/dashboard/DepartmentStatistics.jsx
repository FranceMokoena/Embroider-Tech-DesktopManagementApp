// file: src/components/dashboard/DepartmentStatistics.jsx
import React from 'react';

export default function DepartmentStatistics({ departments = [] }) {
  if (!departments.length) {
    return <p className="empty-state">Department data will appear here once available.</p>;
  }

  return (
    <div className="department-grid">
      {departments.map((department) => (
        <article className="department-card" key={department.name}>
          <strong>{department.name}</strong>
          <span>{department.value.toLocaleString()} screens</span>
        </article>
      ))}
    </div>
  );
}
