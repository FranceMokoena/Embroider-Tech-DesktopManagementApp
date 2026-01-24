// file: src/components/dashboard/TechnicianPie.jsx
import React, { useMemo } from 'react';

const buildGradient = (segments) => {
  if (!segments.length) {
    return '#e5e7eb 0% 100%';
  }

  const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;
  let start = 0;
  return segments
    .map((segment) => {
      const percent = (segment.value / total) * 100;
      const entry = `${segment.color} ${start}% ${start + percent}%`;
      start += percent;
      return entry;
    })
    .join(', ');
};

const palette = ['#0f4c81', '#1d4ed8', '#0ea5e9', '#16a34a', '#f97316', '#ca8a04'];

export default function TechnicianPie({ segments: rawSegments = [], centerLabel = 'Technicians' }) {
  const segments = useMemo(() => {
    if (!Array.isArray(rawSegments)) {
      return [];
    }
    return rawSegments.map((segment, index) => {
      const rawValue = Number(segment?.value ?? 0);
      const value = Number.isFinite(rawValue) ? Math.max(0, rawValue) : 0;
      return {
        ...segment,
        value,
        color: segment.color || palette[index % palette.length]
      };
    });
  }, [rawSegments]);

  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <div className="pie-wrapper">
      <div className="pie-chart" style={{ background: `conic-gradient(${buildGradient(segments)})` }}>
        <div className="pie-center">
          <span className="pie-label">{centerLabel}</span>
          <span className="pie-total">{total.toLocaleString()}</span>
        </div>
      </div>
      <div className="pie-legend">
        {segments.map((segment) => (
          <div className="pie-legend-item" key={segment.label}>
            <span className="legend-color" style={{ background: segment.color }} />
            <div className="legend-text">
              <span className="legend-label">{segment.label}</span>
              <span className="legend-value">
                {segment.value.toLocaleString()} ({total ? ((segment.value / total) * 100).toFixed(1) : '0.0'}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
