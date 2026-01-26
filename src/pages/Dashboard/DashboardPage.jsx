// file: src/pages/Dashboard/DashboardPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './DashboardPage.css';
import ScreenHealthPie from '../../components/dashboard/ScreenHealthPie';
import TechnicianPie from '../../components/dashboard/TechnicianPie';
import StatsCards from '../../components/dashboard/StatsCards';
import DepartmentStatistics from '../../components/dashboard/DepartmentStatistics';
import { getDashboardStats, getDepartments, getSessions, getUsers } from '../../services/apiClient';
import {
  buildDepartmentScanTotals,
  extractSessionsFromResponse,
  normalizeDepartmentKey
} from '../../utils/sessionAggregators';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const EMPTY_STATS = {
  overview: {
    totalSessions: 0,
    totalScans: 0,
    totalUsers: 0,
    activeTechnicians: 0,
    todayScans: 0,
    weeklyScans: 0,
    departmentCount: 0
  },
  statusBreakdown: {
    Healthy: 0,
    Reparable: 0,
    'Beyond Repair': 0
  },
  departmentStats: {},
  departmentDetails: [],
  recentActivity: {}
};

const resolveDepartmentValue = (department = {}) => {
  if (department === null || department === undefined) {
    return 0;
  }
  if (typeof department === 'number' && Number.isFinite(department)) {
    return department;
  }
  if (typeof department === 'string' && department.trim()) {
    const parsed = Number(department.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const candidate =
    department.value ??
    department.scans ??
    department.screenCount ??
    department.totalScreens ??
    department.scannedScreens ??
    department.scanCount ??
    department.totalSize ??
    department.size ??
    department.count ??
    null;
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
  if (typeof candidate === 'string' && candidate.trim()) {
    const parsed = Number(candidate.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const deriveDepartmentLabel = (department = {}) => {
  if (!department) return 'Unknown Department';
  const directValue = typeof department === 'string' ? department.trim() : null;
  if (directValue) return directValue;
  const labelCandidates = [
    department.name,
    department.department,
    department.label,
    department.code,
    department.departmentName,
    department.title,
    department.value
  ];
  for (const candidate of labelCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate.toString();
    }
  }
  return 'Unknown Department';
};

const resolveDepartmentsResponse = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.departments)) return response.departments;
  if (Array.isArray(response.data?.departments)) return response.data.departments;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departmentList, setDepartmentList] = useState([]);
  const [departmentSessionTotals, setDepartmentSessionTotals] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refreshAll = async ({ skipLoading = false } = {}) => {
      if (!skipLoading) {
        setLoading(true);
        setError(null);
      }
      try {
        const [statsResponse, departmentsResponse, sessionResponse, usersResponse] =
          await Promise.all([getDashboardStats(), getDepartments(), getSessions(), getUsers()]);

        if (cancelled) return;

        setDashboardData(statsResponse?.data ?? EMPTY_STATS);

        const deptPayload = resolveDepartmentsResponse(departmentsResponse);
        setDepartmentList(deptPayload);

        const sessions = extractSessionsFromResponse(sessionResponse);
        const users = usersResponse?.data ?? [];
        setDepartmentSessionTotals(buildDepartmentScanTotals(sessions, users));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load dashboard data');
        }
      } finally {
        if (!skipLoading && !cancelled) {
          setLoading(false);
        }
      }
    };

    refreshAll();
    const intervalId = window.setInterval(() => refreshAll({ skipLoading: true }), 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);


  const screenStats = useMemo(
    () => ({
      healthy: dashboardData.statusBreakdown?.Healthy ?? 0,
      repairable: dashboardData.statusBreakdown?.Reparable ?? 0,
      beyondRepair: dashboardData.statusBreakdown?.['Beyond Repair'] ?? 0
    }),
    [dashboardData.statusBreakdown]
  );

  const departmentData = useMemo(() => {
    const tracker = new Map();

    const register = (rawName, rawValue) => {
      const label = deriveDepartmentLabel(rawName ?? rawValue);
      const normalized = normalizeDepartmentKey(label);
      if (!normalized) return;
      const resolvedValue = resolveDepartmentValue(rawValue);
      const existing = tracker.get(normalized);
      const updatedValue = (existing?.value ?? 0) + resolvedValue;
      tracker.set(normalized, {
        name: existing?.name || label,
        value: updatedValue
      });
    };

    Object.entries(dashboardData.departmentStats || {}).forEach(([name, value]) => {
      register(name, value);
    });

    const detailPayload = Array.isArray(dashboardData.departmentDetails)
      ? dashboardData.departmentDetails
      : [];
    detailPayload.forEach((detail) => register(detail, detail));

    departmentList.forEach((department) => register(department, department));

    Object.entries(departmentSessionTotals).forEach(([key, stats]) => {
      if (!key) return;
      const existing = tracker.get(key);
      const displayName = existing?.name || stats.name || key;
      const sanitizedValue =
        Number.isFinite(stats.scans) && stats.scans >= 0 ? stats.scans : existing?.value ?? 0;
      tracker.set(key, {
        name: displayName,
        value: sanitizedValue
      });
    });

    const departments = Array.from(tracker.values());
    departments.sort((a, b) => {
      if (b.value === a.value) {
        return a.name.localeCompare(b.name);
      }
      return b.value - a.value;
    });
    return departments;
  }, [
    dashboardData.departmentStats,
    dashboardData.departmentDetails,
    departmentList,
    departmentSessionTotals
  ]);

  const departmentCount = useMemo(() => {
    if (departmentData.length) {
      return departmentData.length;
    }
    return (
      dashboardData.overview?.departmentCount ??
      Object.keys(dashboardData.departmentStats ?? {}).length
    );
  }, [departmentData, dashboardData.overview, dashboardData.departmentStats]);

  const systemSegments = useMemo(() => {
    const overview = dashboardData.overview || {};
    return [
      {
        label: 'Active Technicians',
        value: overview.activeTechnicians ?? overview.totalUsers ?? 0,
        color: '#0f4c81'
      },
      {
        label: 'Departments',
        value: departmentCount,
        color: '#16a34a'
      },
      {
        label: 'Sessions',
        value: overview.totalSessions ?? 0,
        color: '#f97316'
      },
      {
        label: "Today's Scans",
        value: overview.todayScans ?? 0,
        color: '#ca8a04'
      }
    ];
  }, [dashboardData.overview, departmentCount]);

  const statsCards = useMemo(
    () => [
      {
        label: 'Total Sessions',
        value: dashboardData.overview?.totalSessions ?? 0,
        subtitle: 'Active and archived sessions'
      },
      {
        label: 'Total Screens Scanned',
        value: dashboardData.overview?.totalScans ?? 0,
        subtitle: 'Screens logged in system'
      },
      {
        label: 'Active Technicians',
        value: dashboardData.overview?.activeTechnicians ?? 0,
        subtitle: 'Currently on shift'
      }
    ],
    [dashboardData.overview]
  );

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-page__content">
          <p className="dashboard-page__status">Loading dashboard data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-page__content">
          <p className="dashboard-page__status dashboard-page__status--error">{error}</p>
        </div>
      </div>
    );
  }

  const exportDashboardPdf = async () => {
    if (isExporting) return;
    const target = document.querySelector('.dashboard-page__content');
    if (!target) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(target, { scale: 2, backgroundColor: '#fff', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`dashboard-stats-${Date.now()}.pdf`);
    } catch (err) {
      console.error('Failed to export dashboard PDF', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page__content">
        <div className="dashboard-export">
          <button
            type="button"
            className="dashboard-export__button"
            onClick={exportDashboardPdf}
            disabled={isExporting}
          >
            <span role="img" aria-label="export">📤</span>
            {isExporting ? 'Preparing PDF…' : ''}
          </button>
        </div>
        <div className="pie-row">
         <section className="section-card">
            <div className="section-card__header">
              <h2>System Snapshot</h2>
            </div>
            <TechnicianPie segments={systemSegments} centerLabel="Overview" />
          </section>






          <section className="section-card">
            <div className="section-card__header">
              <h2>Screen Health Summary</h2>
            </div>
            <ScreenHealthPie stats={screenStats} />
          </section>

          
        </div>

        <section className="section-card">
          <div className="section-card__header">
            <h2>Key Operating Metrics</h2>
          </div>
          <StatsCards stats={statsCards} />
        </section>

        <section className="section-card">
          <div className="section-card__header">
            <h2>Department Statistics</h2>
          </div>
          <DepartmentStatistics departments={departmentData} />
        </section>
      </div>
    </div>
  );
}
