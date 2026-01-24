// file: src/components/dashboard/StatsCards.jsx
import React from 'react';

export default function StatsCards({ stats = [] }) {
  return (
    <div className="stats-cards">
      {stats.map((item) => (
        <article className="card-stats" key={item.label}>
          <h3>{item.label}</h3>
          <div className="card-number">{item.value.toLocaleString()}</div>
          <p className="card-sub">{item.subtitle}</p>
        </article>
      ))}
    </div>
  );
}
