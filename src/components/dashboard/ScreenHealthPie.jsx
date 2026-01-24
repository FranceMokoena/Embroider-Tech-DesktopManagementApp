// file: src/components/dashboard/ScreenHealthPie.jsx
import React, { useMemo } from 'react';

const colors = {
  healthy: '#0f766e',
  repairable: '#d97706',
  beyondRepair: '#b91c1c'
};

const buildGradient = (segments) => {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;
  let start = 0;
  const gradient = segments
    .map((segment) => {
      const percent = (segment.value / total) * 100;
      const entry = `${segment.color} ${start}% ${start + percent}%`;
      start += percent;
      return entry;
    })
    .join(', ');
  return gradient || '#e2e8f0';
};

export default function ScreenHealthPie({ stats = {} }) {
  const segments = useMemo(() => [
    { label: 'Healthy Screens', value: stats.healthy ?? 0, color: colors.healthy },
    { label: 'Repairable', value: stats.repairable ?? 0, color: colors.repairable },
    { label: 'Beyond Repair', value: stats.beyondRepair ?? 0, color: colors.beyondRepair }
  ], [stats]);

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <div className="pie-wrapper">
      <div className="pie-chart" style={{ background: `conic-gradient(${buildGradient(segments)})` }}>
        <div className="pie-center">
          <span className="pie-label">Total Screens</span>
          <span className="pie-total">{total}</span>
        </div>
      </div>
      <div className="pie-legend">
        {segments.map((segment) => (
          <div className="pie-legend-item" key={segment.label}>
            <span className="legend-color" style={{ background: segment.color }} />
            <div className="legend-text">
              <span className="legend-label">{segment.label}</span>
              <span className="legend-value">
                {segment.value} ({total ? ((segment.value / total) * 100).toFixed(1) : '0.0'}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
