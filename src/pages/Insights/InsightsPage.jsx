import React from 'react';
import './InsightsPage.css';

const overviewCards = [
  {
    title: 'What this platform delivers',
    items: [
      'Real-time visibility of scanning activity across technicians and departments.',
      'Accountability through sessions, scan history, and performance summaries.',
      'Operational insights that improve planning, staffing, and maintenance decisions.'
    ]
  },
  {
    title: 'What leaders should monitor',
    items: [
      'Scan volume trends (daily / weekly / monthly).',
      'Technician productivity and session consistency.',
      'Department throughput, idle time, and target compliance.',
      'Repair vs written-off vs healthy screen ratios (quality indicators).'
    ]
  },
  {
    title: 'How to use insights effectively',
    items: [
      'Use the Dashboard for immediate operational status.',
      'Use History & Sessions to investigate root causes and anomalies.',
      'Use Technicians & Departments to manage accountability and targets.',
      'Use Notifications to validate events and correct data mistakes with audit trace.'
    ]
  }
];

const featureEducation = [
  {
    title: 'Dashboard',
    detail:
      'Provides a high-level operational snapshot: activity volumes, department distribution, and quality ratios. Review trends daily to detect workflow changes early.'
  },
  {
    title: 'History & Sessions',
    detail:
      'History tracks every scan record for traceability, while Sessions measures technician work patterns, session duration, and consistency. Use this area for investigations and performance reviews.'
  },
  {
    title: 'Technicians & Departments',
    detail:
      'Maintains technician profiles, department assignments, and aggregated performance. Supports productivity comparisons and targeted management action.'
  },
  {
    title: 'Notifications',
    detail:
      'Live feed of scan events from the mobile workflow (production, repair, write-off). Supports operational awareness and controlled correction of captured data.'
  },
  {
    title: 'All Screens',
    detail:
      'Full screen registry across the platform with timestamps and scan states. Filter by period to review coverage, compliance, and progress toward operational goals.'
  }
];

const roadmap = [
  {
    phase: 'Phase 1 - Intelligence & Accountability',
    items: [
      'Smart KPI dashboard (today/week/month totals, utilization, peak hours).',
      'Technician performance profiles (rankings, averages, active vs idle time).',
      'Historical comparisons (month vs month, department vs department).'
    ]
  }
];

export default function InsightsPage() {
  return (
    <div className="page-view insights-page">
      <section className="insights-hero">
        <p className="insights-hero__eyebrow">Insights Center</p>
        <h2 className="insights-hero__title">Operational intelligence for leadership teams</h2>
        <p className="insights-hero__subtitle">
          Use this space to align your team on the metrics that matter most, clarify where to
          investigate issues, and keep the scanning workflow accountable end-to-end.
        </p>
      </section>

      <section className="insights-section">
        <div className="insights-section__header-row">
          <h3 className="insights-section__title">Overview</h3>
          <p className="insights-section__hint">Three pillars that keep the operation aligned.</p>
        </div>
        <div className="insights-grid">
          {overviewCards.map((card) => (
            <article className="insights-card" key={card.title}>
              <h4 className="insights-card__title">{card.title}</h4>
              <ul className="insights-list">
                {card.items.map((item) => (
                  <li key={`${card.title}-${item}`}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="insights-section">
        <div className="insights-section__header-row">
          <h3 className="insights-section__title">Feature guidance</h3>
          <p className="insights-section__hint">Where to focus based on the question in front of you.</p>
        </div>
        <div className="insights-grid insights-grid--tight">
          {featureEducation.map((feature) => (
            <article className="insights-card" key={feature.title}>
              <h4 className="insights-card__title">{feature.title}</h4>
              <p className="insights-card__text">{feature.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="insights-section">
        <div className="insights-section__header-row">
          <h3 className="insights-section__title">Roadmap</h3>
          <p className="insights-section__hint">Planned intelligence upgrades for the platform.</p>
        </div>
        <div className="insights-roadmap">
          {roadmap.map((phase) => (
            <article className="insights-roadmap__item" key={phase.phase}>
              <span className="insights-roadmap__badge">Planned</span>
              <h4 className="insights-roadmap__title">{phase.phase}</h4>
              <ul className="insights-list">
                {phase.items.map((item) => (
                  <li key={`${phase.phase}-${item}`}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
