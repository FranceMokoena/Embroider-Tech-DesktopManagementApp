// file: src/components/dashboard/TechnicianPie.jsx
import React, { useMemo } from 'react';

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

const describeArc = (centerX, centerY, radius, startAngle, endAngle) => {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'L',
    centerX,
    centerY,
    'Z'
  ].join(' ');
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
  const size = 180;
  const radius = 80;
  const center = size / 2;

  const slices = useMemo(() => {
    if (!total) return [];
    const visualSegments = segments.filter((segment) => segment.value > 0);
    let currentAngle = 0;
    return visualSegments.map((segment) => {
      const sliceAngle = (segment.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;
      const midAngle = startAngle + sliceAngle / 2;
      const labelPos = polarToCartesian(center, center, radius * 0.62, midAngle);
      return {
        ...segment,
        startAngle,
        endAngle,
        percent: (segment.value / total) * 100,
        labelX: labelPos.x,
        labelY: labelPos.y
      };
    });
  }, [segments, total, center, radius]);

  return (
    <div className="pie-wrapper">
      <div className="pie-chart" role="img" aria-label={`${centerLabel} pie chart`}>
        <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          {total ? (
            slices.map((slice, index) => (
              <path
                key={`${slice.label}-${index}`}
                d={describeArc(center, center, radius, slice.startAngle, slice.endAngle)}
                fill={slice.color}
              />
            ))
          ) : (
            <circle cx={center} cy={center} r={radius} fill="#e5e7eb" />
          )}
          {total
            ? slices.map((slice, index) => (
                <text
                  key={`label-${slice.label}-${index}`}
                  x={slice.labelX}
                  y={slice.labelY}
                  className="pie-slice-label"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {slice.percent.toFixed(1)}%
                </text>
              ))
            : null}
        </svg>
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
