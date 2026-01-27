import React, { useEffect, useMemo, useState } from 'react';
import './HistoryPage.css';
import StatsCards from '../../components/dashboard/StatsCards';
import { getSessions, getUsers, deleteScreens } from '../../services/apiClient';
import {
  extractSessionsFromResponse,
  resolveSessionScans,
  buildUsersLookup,
  buildScanRows
} from '../../utils/sessionAggregators';
import { buildStatusNotice } from '../../utils/errorMessaging';

const PAGE_SIZE = 12;

const formatDate = (value) => {
  if (!value) return 'Unknown';
  try {
    return new Date(value).toLocaleString('en-US');
  } catch {
    return String(value);
  }
};

export default function HistoryPage() {
  const [historyPayload, setHistoryPayload] = useState(null);
  const [sessionList, setSessionList] = useState([]);
  const [scanRows, setScanRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingBarcode, setDeletingBarcode] = useState(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getSessions(), getUsers()])
      .then(([payload, usersResponse]) => {
        if (cancelled) return;
        const sessions = extractSessionsFromResponse(payload);
        const lookup = buildUsersLookup(usersResponse?.data ?? []);
        setHistoryPayload(payload);
        setSessionList(sessions);
        setScanRows(buildScanRows(sessions, lookup));
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sessions = sessionList;

  const totalScans = useMemo(() => {
    if (historyPayload?.totalScans >= 0) {
      return historyPayload.totalScans;
    }
    return sessions.reduce((sum, session) => sum + resolveSessionScans(session), 0);
  }, [historyPayload, sessions]);

  const statsCards = useMemo(() => {
    return [
      {
        label: 'Total Sessions',
        value: historyPayload?.totalSessions ?? sessions.length,
        subtitle: 'Historic captures'
      },
      {
        label: 'Total Screens',
        value: totalScans,
        subtitle: 'Recorded scans'
      },
      {
        label: 'Repairable',
        value: historyPayload?.totalReparable ?? 0,
        subtitle: 'Marked for repair'
      },
      {
        label: 'Written Off',
        value: historyPayload?.totalBeyondRepair ?? 0,
        subtitle: 'Beyond repair'
      }
    ];
  }, [historyPayload, sessions.length, totalScans]);

  const totalPages = useMemo(
    () => (scanRows.length ? Math.ceil(scanRows.length / PAGE_SIZE) : 1),
    [scanRows.length]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedScans = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return scanRows.slice(start, start + PAGE_SIZE);
  }, [scanRows, currentPage]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const handleDeleteScan = async (scan) => {
    if (!scan?.barcode) return;
    if (!window.confirm(`Delete scan ${scan.barcode}? This action cannot be undone.`)) {
      return;
    }
    setDeletingBarcode(scan.id);
    try {
      await deleteScreens({ barcodes: [scan.barcode] });
      setScanRows((prev) => prev.filter((row) => row.id !== scan.id));
    } catch (err) {
      setError(err.message || 'Failed to delete scan');
    } finally {
      setDeletingBarcode(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!scanRows.length) return;
    if (
      !window.confirm(
        `Delete all ${scanRows.length.toLocaleString()} scans shown here? This action cannot be undone.`
      )
    ) {
      return;
    }
    setBulkDeleting(true);
    try {
      await deleteScreens({ barcodes: scanRows.map((row) => row.barcode) });
      setScanRows([]);
    } catch (err) {
      setError(err.message || 'Failed to delete scans');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="page-view history-page">
      <header className="page-view__header">
        <div>
          <h2>History</h2>
          <p>Full production history retrieved directly from the mobile backend.</p>
        </div>
      </header>

      {loading && <p className="dashboard-page__status">Loading history...</p>}
      {error && (() => {
        const notice = buildStatusNotice(error, 'Unable to load history');
        return (
          <p
            className={`dashboard-page__status ${
              notice?.tone === 'error' ? 'dashboard-page__status--error' : 'dashboard-page__status--info'
            }`}
          >
            {notice?.message}
          </p>
        );
      })()}

      {!loading && !error && (
        <>
          <section className="section-card">
            <StatsCards stats={statsCards} />
          </section>

          <section className="section-card history-list">
            <div className="history-list__header">
              <div>
                <h3>Recent sessions</h3>
                <span>{sessions.length.toLocaleString()} total</span>
              </div>
              <div className="history-list__header-actions">
                <button
                  type="button"
                  className="tiny-button tiny-button--ghost"
                  onClick={handleDeleteAll}
                  disabled={!scanRows.length || bulkDeleting}
                >
                  {bulkDeleting ? 'Deleting...' : 'Delete All'}
                </button>
              </div>
            </div>
            <div className="history-table">
              <div className="history-table__row history-table__row--head">
                <span>Session ID</span>
                <span>Technician</span>
                <span>Department</span>
                <span>Barcode</span>
                <span>Status</span>
                <span>Timestamp</span>
              </div>
              {pagedScans.map((scan) => (
                <div className="history-table__row" key={scan.id}>
                  <span>#{scan.sessionId}</span>
                  <span>{scan.technician}</span>
                  <span>{scan.department}</span>
                  <span>{scan.barcode}</span>
                  <span>{scan.status}</span>
                  <span>{formatDate(scan.timestamp)}</span>
                  <button
                    type="button"
                    className="history-table__delete"
                    onClick={() => handleDeleteScan(scan)}
                    disabled={deletingBarcode === scan.id}
                    aria-label={`Delete ${scan.barcode}`}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            {scanRows.length > PAGE_SIZE && (
              <div className="history-pagination">
                <button
                  type="button"
                  className="history-pagination__button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  &lt;
                </button>
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`history-pagination__button ${page === currentPage ? 'is-active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  className="history-pagination__button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  &gt;
                </button>
                <span className="history-pagination__meta">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
