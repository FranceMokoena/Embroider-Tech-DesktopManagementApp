import React from 'react';
import './InsightsPage.css';

const topics = [
  {
    title: 'Dashboard',
    detail:
      'Aggregates live session, scanner and department trends. Pay attention to the pie charts because they signal balance between healthy, repairable and written-off screens.'
  },
  {
    title: 'History & Sessions',
    detail:
      'History profiles every scanned screen, while Sessions focuses on repeated technician activity. Use both to track coverage, technician churn, and outlier durations.'
  },
  {
    title: 'Technicians & Departments',
    detail:
      'Technicians store identities plus department assignments and scan counts. Departments summarize team performance and help route assignments or notify managers.'
  },
  {
    title: 'Notifications',
    detail:
      'Streams scan actions pulled from the mobile backend—production, repair, and write-off buckets. The screen lets you delete individual scans when you want to clean data or resolve a mistake.'
  },
  {
    title: 'All Screens',
    detail:
      'Lists every barcode scanned across the platform with start/end metadata. Filter by day, week, or month to roll up national coverage or cadence goals.'
  }
];

export default function InsightsPage() {
  return (
    <div className="insights-page">
      <header className="insights-page__header">
        <h2>System Insights</h2>
        <p>How this platform keeps EmbroideryTech in control and where it can grow.</p>
      </header>
      <section className="insights-grid">
        {topics.map((topic) => (
          <article key={topic.title} className="insights-card">
            <h3>{topic.title}</h3>
            <p>{topic.detail}</p>
          </article>
        ))}
      </section>
      <section className="insights-improvements-card">
        <article className="insights-card insights-card--improvements">
          <header>
            <h3>🚀 Future System Enhancements</h3>
            <p>
              As your business grows and expands to multiple departments and locations, our system is designed to scale with you.
              Here are the advanced features we can add to support your growth:
            </p>
          </header>
          <div className="improvement-section">
            <h4>🏢 Multi-Location Management</h4>
            <ul>
              <li>Multiple Factory Sites – Manage different production facilities from one system</li>
              <li>Location-Specific Dashboards – Each factory has its own overview screen</li>
              <li>Cross-Site Comparisons – See which locations perform best</li>
              <li>Centralized Control – Manage all locations from one admin panel</li>
              <li>Site-Specific Settings – Different rules and processes for each location</li>
            </ul>
          </div>
          <div className="improvement-section">
            <h4>🏭 Advanced Department Structure</h4>
            <ul>
              <li>Multiple Departments – Production, Quality Control, Maintenance, etc.</li>
              <li>Department Managers – Supervisors can oversee their specific areas</li>
              <li>Department Performance – Track efficiency by work area</li>
              <li>Cross-Department Reports – Compare how different areas perform</li>
              <li>Department-Specific Alerts – Notifications for specific work areas</li>
            </ul>
          </div>
          <div className="improvement-section">
            <h4>👥 Scalable User Management</h4>
            <ul>
              <li>Role-Based Access – Different permission levels for different people</li>
              <li>Location-Based Access – Users only see their assigned factory</li>
              <li>Department-Based Access – Users only see their work area</li>
              <li>Multi-Site Technicians – Staff who work across different locations</li>
              <li>Temporary Access – Short-term access for contractors or visitors</li>
            </ul>
          </div>
          <div className="improvement-section">
            <h4>📊 Advanced Reporting & Analytics</h4>
            <ul>
              <li>Multi-Location Dashboards – Overview of all your factories</li>
              <li>Location Comparison Reports – See which sites are most efficient</li>
              <li>Department Efficiency Reports – Which work areas perform best</li>
              <li>Company-Wide Trends – Patterns across all locations</li>
              <li>Executive Summaries – High-level reports for management</li>
            </ul>
          </div>
          <div className="improvement-section">
            <h4>🔄 Communication & Coordination</h4>
            <ul>
              <li>Inter-Site Messaging – Communication between different factories</li>
              <li>Company-Wide Announcements – Send messages to all locations</li>
              <li>Department-Specific Alerts – Targeted notifications for specific areas</li>
              <li>Issue Escalation – Problems that need management attention</li>
              <li>Best Practice Sharing – Share successful methods across locations</li>
            </ul>
          </div>
          <div className="improvement-section">
            <h4>🔒 Enhanced Security & Data Management</h4>
            <ul>
              <li>Location-Based Data – Secure separation of data by factory</li>
              <li>Backup Per Location – Protect data for each site separately</li>
              <li>Compliance Support – Meet different regulatory requirements</li>
              <li>Audit Trails – Track all changes by location and department</li>
              <li>Data Migration – Move data between locations when needed</li>
            </ul>
          </div>
          <div className="improvement-section">
            <h4>📱 Mobile App Enhancements</h4>
            <ul>
              <li>Location Detection – App automatically knows which factory you're in</li>
              <li>Department Switching – Technicians can work in multiple areas</li>
              <li>Site-Specific Workflows – Different processes for different locations</li>
              <li>Offline Work Per Location – Work without internet at each site</li>
              <li>Location-Based Notifications – Alerts specific to each factory</li>
            </ul>
          </div>
          <div className="improvement-section">
            <h4>🔗 Integration Capabilities</h4>
            <ul>
              <li>ERP System Connection – Connect with your existing business software</li>
              <li>HR System Integration – Sync with employee management systems</li>
              <li>Inventory System Connection – Track screen stock across all locations</li>
              <li>Accounting Integration – Track costs by location and department</li>
              <li>Custom Integrations – Connect with your specific business tools</li>
            </ul>
          </div>
          <div className="improvement-section">
            <h4>🎯 Operational Improvements</h4>
            <ul>
              <li>Shift Management – Track different work shifts across locations</li>
              <li>Equipment Tracking – Monitor screen inventory across all sites</li>
              <li>Maintenance Scheduling – Plan repairs and maintenance by location</li>
              <li>Quality Standards – Different standards for different departments</li>
              <li>Training Management – Track training across all locations</li>
            </ul>
          </div>
          <hr />
          <header>
            <h3>📈 Growth Benefits</h3>
          </header>
          <div className="improvement-section">
            <h4>For Expanding Businesses:</h4>
            <ul>
              <li>Seamless Scaling – Add new locations without changing systems</li>
              <li>Standardized Processes – Same quality control across all sites</li>
              <li>Centralized Management – Oversee everything from one place</li>
              <li>Performance Comparison – See which locations are most efficient</li>
              <li>Resource Optimization – Distribute staff and equipment effectively</li>
            </ul>
          </div>
          <div className="improvement-section">
            <h4>For Multi-Department Operations:</h4>
            <ul>
              <li>Department Accountability – Track performance by work area</li>
              <li>Cross-Department Learning – Share best practices between areas</li>
              <li>Specialized Workflows – Different processes for different departments</li>
              <li>Department-Specific Reporting – Focus on what matters to each area</li>
              <li>Coordinated Quality Control – Ensure consistency across departments</li>
            </ul>
          </div>
        </article>
      </section>
    </div>
  );
}
