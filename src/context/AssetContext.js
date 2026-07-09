import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import assetsService from '../services/assetsService';
import rfidService from '../services/rfidService';
import sectionsService from '../services/sectionsService';
import techniciansService from '../services/techniciansService';
import transfersService from '../services/transfersService';
import AssetModel from '../models/AssetModel';
import SectionModel from '../models/SectionModel';
import VerificationModel from '../models/VerificationModel';
import RFIDTagModel from '../models/RFIDTagModel';
import TechnicianModel from '../models/TechnicianModel';

const AssetContext = createContext(null);

export const useAssets = () => useContext(AssetContext);

function extractRecords(res) {
  if (Array.isArray(res)) return res;
  return Array.isArray(res?.records) ? res.records : [];
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function verificationRowsFromAudit(audit) {
  if (!audit || typeof audit !== 'object') return [];
  const verifiedAt = audit.verifiedAt || audit.createdAt || new Date().toISOString();
  const section = audit.section || audit.currentSection || null;

  const fromAssets = (items = [], status) => items.map(item => ({
    _id: item._id || item.id || item.assetId || `${item.epc || item.assetNumber}-${status}-${verifiedAt}`,
    assetId: item.assetId || item._id || item.id || null,
    epc: item.epc || item.epcKey || null,
    currentSection: section,
    expectedSection: item.currentSection || item.section || section,
    status,
    verifiedAt,
    verifiedBy: audit.verifiedBy || null
  }));

  return [
    ...fromAssets(audit.matchedAssets, 'Verified'),
    ...fromAssets(audit.missingAssets, 'Missing'),
    ...fromAssets(audit.unexpectedAssets, 'Section Mismatch'),
    ...fromAssets(audit.unregisteredTags, 'Unregistered')
  ];
}

function uniqueVerificationRows(rows) {
  const seen = new Set();
  return rows.filter(row => {
    const key = row._id || `${row.assetId || ''}-${row.epc || ''}-${row.status || ''}-${row.verifiedAt || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractVerificationRows(res) {
  const directRows = [
    ...extractRecords(res),
    ...(res?.results || []),
    ...(res?.verificationResults || []),
    ...(res?.verificationHistory || []),
    ...(res?.verifications || []),
    ...verificationRowsFromAudit(res?.audit)
  ];

  return uniqueVerificationRows(
    directRows.map(v => VerificationModel.normalizeVerification(v)).filter(Boolean)
  ).sort((a, b) => new Date(b.verifiedAt || 0) - new Date(a.verifiedAt || 0));
}

function normalizeTransfer(transfer) {
  if (!transfer) return null;

  return {
    ...transfer,
    _id: transfer._id || transfer.id || null,
    assetId: transfer.assetId || null,
    assetName: transfer.assetName || transfer.name || null,
    assetNumber: transfer.assetNumber || null,
    epc: transfer.epc || null,
    fromSection: transfer.fromSection || transfer.initialSection || null,
    toSection: transfer.toSection || transfer.currentSection || transfer.section || null,
    transferredAt: transfer.transferredAt || transfer.assignmentDate || transfer.createdAt || transfer.updatedAt || null,
    reason: transfer.reason || transfer.transferType || null,
    raw: transfer
  };
}

function summarizeVerification(results, requestBody = {}) {
  const scannedEpcs = Array.from(new Set((requestBody.epcs || results.map(row => row.epc)).filter(Boolean)));
  const verifiedCount = results.filter(row => normalizeStatus(row.status) === 'verified').length;

  return {
    section: requestBody.currentSection || requestBody.section || requestBody.sectionId || null,
    expectedCount: results.length,
    scannedCount: Array.isArray(requestBody.epcs) ? requestBody.epcs.length : scannedEpcs.length,
    uniqueScannedCount: scannedEpcs.length,
    verifiedCount,
    verificationPercentage: percent(verifiedCount, results.length),
    verifiedAt: new Date().toISOString()
  };
}

export function AssetProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [sections, setSections] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [verificationResults, setVerificationResults] = useState([]);
  const [verificationAudit, setVerificationAudit] = useState(null);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [rfidLookup, setRfidLookup] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalAssets: 0,
    verified: 0,
    missing: 0,
    sectionMismatch: 0,
    healthy: 0,
    repairable: 0,
    beyondRepair: 0,
    sections: 0,
    transfers: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dataRef = useRef({
    assets: [],
    sections: [],
    technicians: [],
    verificationHistory: [],
    transfers: []
  });

  const commitAssets = useCallback(records => {
    dataRef.current.assets = records;
    setAssets(records);
  }, []);

  const commitSections = useCallback(records => {
    dataRef.current.sections = records;
    setSections(records);
  }, []);

  const commitTechnicians = useCallback(records => {
    dataRef.current.technicians = records;
    setTechnicians(records);
  }, []);

  const commitVerificationHistory = useCallback(records => {
    dataRef.current.verificationHistory = records;
    setVerificationHistory(records);
  }, []);

  const commitTransfers = useCallback(records => {
    dataRef.current.transfers = records;
    setTransfers(records);
  }, []);

  const buildSectionSummary = useCallback((sectionRecords = [], assetRecords = []) => {
    const byName = new Map();

    const ensureSection = (name, base = {}) => {
      const key = String(name || '').trim();
      if (!key) return null;

      if (!byName.has(key)) {
        byName.set(key, {
          ...base,
          _id: base._id || key,
          section: base.section || key,
          name: base.name || key,
          code: base.code || key,
          totalAssets: 0,
          healthy: 0,
          repairable: 0,
          beyondRepair: 0
        });
      }

      return byName.get(key);
    };

    sectionRecords.forEach(section => {
      const normalized = SectionModel.normalizeSection(section);
      if (normalized) ensureSection(normalized.name || normalized.section || normalized.code, normalized);
    });

    assetRecords.forEach(asset => {
      const name = asset.currentSection || asset.section || asset.location;
      const section = ensureSection(name);
      if (!section) return;

      section.totalAssets += 1;
      const status = normalizeStatus(asset.status || asset.assetStatus);
      if (status === 'healthy') section.healthy += 1;
      if (status === 'repairable') section.repairable += 1;
      if (status === 'beyond repair') section.beyondRepair += 1;
    });

    return Array.from(byName.values()).sort((a, b) =>
      String(a.name || a.section).localeCompare(String(b.name || b.section))
    );
  }, []);

  const calculateMetrics = useCallback((assetRecords = [], sectionRecords = [], transferRecords = [], verificationRecords = []) => {
    const latestById = new Map();
    const latestByEpc = new Map();

    verificationRecords
      .slice()
      .sort((a, b) => new Date(b.verifiedAt || 0) - new Date(a.verifiedAt || 0))
      .forEach(row => {
        if (row.assetId && !latestById.has(String(row.assetId))) {
          latestById.set(String(row.assetId), row.status);
        }
        if (row.epc && !latestByEpc.has(String(row.epc))) {
          latestByEpc.set(String(row.epc), row.status);
        }
      });

    const counts = assetRecords.reduce((acc, asset) => {
      const condition = normalizeStatus(asset.status || asset.assetStatus);
      if (condition === 'healthy') acc.healthy += 1;
      if (condition === 'repairable') acc.repairable += 1;
      if (condition === 'beyond repair') acc.beyondRepair += 1;

      const verificationStatus = normalizeStatus(
        latestById.get(String(asset._id || asset.id || '')) ||
        latestByEpc.get(String(asset.epc || '')) ||
        asset.verificationStatus
      );
      if (verificationStatus === 'verified') acc.verified += 1;
      if (verificationStatus === 'missing') acc.missing += 1;
      if (verificationStatus === 'section mismatch') acc.sectionMismatch += 1;

      return acc;
    }, {
      verified: 0,
      missing: 0,
      sectionMismatch: 0,
      healthy: 0,
      repairable: 0,
      beyondRepair: 0
    });

    const metrics = {
      totalAssets: assetRecords.length,
      ...counts,
      sections: sectionRecords.length,
      transfers: transferRecords.length
    };

    setDashboardMetrics(metrics);
    return metrics;
  }, []);

  const refreshMetrics = useCallback(() => calculateMetrics(
    dataRef.current.assets,
    dataRef.current.sections,
    dataRef.current.transfers,
    dataRef.current.verificationHistory
  ), [calculateMetrics]);

  const loadAssets = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await assetsService.list(params);
      const mapped = extractRecords(res).map(a => AssetModel.normalizeAsset(a)).filter(Boolean);
      commitAssets(mapped);
      calculateMetrics(mapped, dataRef.current.sections, dataRef.current.transfers, dataRef.current.verificationHistory);
      setError(null);
      return mapped;
    } catch (err) {
      console.error('Asset load error', err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [calculateMetrics, commitAssets]);

  const loadSections = useCallback(async (params = {}) => {
    const res = await sectionsService.list(params);
    const mapped = extractRecords(res).map(s => SectionModel.normalizeSection(s)).filter(Boolean);
    const enriched = buildSectionSummary(mapped, dataRef.current.assets);
    commitSections(enriched);
    calculateMetrics(dataRef.current.assets, enriched, dataRef.current.transfers, dataRef.current.verificationHistory);
    return enriched;
  }, [buildSectionSummary, calculateMetrics, commitSections]);

  const loadVerificationHistory = useCallback(async (params = {}) => {
    const res = await rfidService.verificationHistory(params);
    const mapped = extractVerificationRows(res);
    commitVerificationHistory(mapped);
    setVerificationResults(prev => (prev.length ? prev : mapped.slice(0, 10)));
    calculateMetrics(dataRef.current.assets, dataRef.current.sections, dataRef.current.transfers, mapped);
    return mapped;
  }, [calculateMetrics, commitVerificationHistory]);

  const loadTransfers = useCallback(async (params = {}) => {
    const res = await transfersService.list(params);
    const mapped = extractRecords(res).map(normalizeTransfer).filter(Boolean);
    commitTransfers(mapped);
    calculateMetrics(dataRef.current.assets, dataRef.current.sections, mapped, dataRef.current.verificationHistory);
    return mapped;
  }, [calculateMetrics, commitTransfers]);

  const loadTechnicians = useCallback(async (params = {}) => {
    const res = await techniciansService.list(params);
    const mapped = extractRecords(res).map(t => TechnicianModel.normalizeTechnician(t)).filter(Boolean);
    commitTechnicians(mapped);
    return mapped;
  }, [commitTechnicians]);

  const loadMetrics = useCallback(async () => refreshMetrics(), [refreshMetrics]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [assetResult, sectionResult, transferResult, historyResult, technicianResult] = await Promise.allSettled([
      assetsService.list(),
      sectionsService.list(),
      transfersService.list(),
      rfidService.verificationHistory(),
      techniciansService.list()
    ]);

    const firstFailure = [assetResult, sectionResult, transferResult, historyResult, technicianResult]
      .find(result => result.status === 'rejected');

    try {
      const nextAssets = assetResult.status === 'fulfilled'
        ? extractRecords(assetResult.value).map(a => AssetModel.normalizeAsset(a)).filter(Boolean)
        : dataRef.current.assets;
      const rawSections = sectionResult.status === 'fulfilled'
        ? extractRecords(sectionResult.value).map(s => SectionModel.normalizeSection(s)).filter(Boolean)
        : dataRef.current.sections;
      const nextTransfers = transferResult.status === 'fulfilled'
        ? extractRecords(transferResult.value).map(normalizeTransfer).filter(Boolean)
        : dataRef.current.transfers;
      const nextHistory = historyResult.status === 'fulfilled'
        ? extractVerificationRows(historyResult.value)
        : dataRef.current.verificationHistory;
      const nextTechnicians = technicianResult.status === 'fulfilled'
        ? extractRecords(technicianResult.value).map(t => TechnicianModel.normalizeTechnician(t)).filter(Boolean)
        : dataRef.current.technicians;
      const nextSections = buildSectionSummary(rawSections, nextAssets);

      commitAssets(nextAssets);
      commitSections(nextSections);
      commitTransfers(nextTransfers);
      commitVerificationHistory(nextHistory);
      commitTechnicians(nextTechnicians);
      setVerificationResults(prev => (prev.length ? prev : nextHistory.slice(0, 10)));
      calculateMetrics(nextAssets, nextSections, nextTransfers, nextHistory);
      setError(firstFailure?.reason || null);

      return {
        assets: nextAssets,
        sections: nextSections,
        transfers: nextTransfers,
        verificationHistory: nextHistory,
        technicians: nextTechnicians
      };
    } finally {
      setLoading(false);
    }
  }, [
    buildSectionSummary,
    calculateMetrics,
    commitAssets,
    commitSections,
    commitTechnicians,
    commitTransfers,
    commitVerificationHistory
  ]);

  const verifyRoom = useCallback(async (body) => {
    setLoading(true);
    try {
      const res = await rfidService.verifyRoom(body);
      const results = extractVerificationRows(res);

      setVerificationResults(results);
      setVerificationAudit(res?.audit || summarizeVerification(results, body));
      await refresh();
      return res;
    } catch (err) {
      console.error('RFID verify error', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const lookupEpc = useCallback(async (epc) => {
    const res = await rfidService.lookup(epc);
    const normalized = RFIDTagModel.normalizeTag(res?.tag || res?.data || res);
    setRfidLookup(normalized);
    return normalized;
  }, []);

  const deleteAsset = useCallback(async (id) => {
    await assetsService.delete(id);
    const nextAssets = dataRef.current.assets.filter(a => a._id !== id);
    commitAssets(nextAssets);
    calculateMetrics(nextAssets, dataRef.current.sections, dataRef.current.transfers, dataRef.current.verificationHistory);
  }, [calculateMetrics, commitAssets]);

  const createAsset = useCallback(async (body) => {
    const created = await assetsService.create(body);
    const norm = AssetModel.normalizeAsset(created?.asset || created?.data || created);
    if (norm) {
      commitAssets([norm, ...dataRef.current.assets]);
    }
    await refresh();
    return norm;
  }, [commitAssets, refresh]);

  const updateAsset = useCallback(async (id, body) => {
    const updated = await assetsService.update(id, body);
    const norm = AssetModel.normalizeAsset(updated?.asset || updated?.data || updated);
    if (norm) {
      const nextAssets = dataRef.current.assets.map(a => a._id === norm._id ? norm : a);
      commitAssets(nextAssets);
      calculateMetrics(nextAssets, dataRef.current.sections, dataRef.current.transfers, dataRef.current.verificationHistory);
    }
    return norm;
  }, [calculateMetrics, commitAssets]);

  const transferAsset = useCallback(async (id, body) => {
    const res = await assetsService.transfer(id, body);
    await refresh();
    return res;
  }, [refresh]);

  const createSection = useCallback(async (body) => {
    const res = await sectionsService.create(body);
    await loadSections();
    return res;
  }, [loadSections]);

  const updateSection = useCallback(async (id, body) => {
    const res = await sectionsService.update(id, body);
    await loadSections();
    return res;
  }, [loadSections]);

  const deleteSection = useCallback(async (id) => {
    await sectionsService.delete(id);
    const nextSections = dataRef.current.sections.filter(section => section._id !== id);
    commitSections(nextSections);
    calculateMetrics(dataRef.current.assets, nextSections, dataRef.current.transfers, dataRef.current.verificationHistory);
  }, [calculateMetrics, commitSections]);

  const createTechnician = useCallback(async (body) => {
    const res = await techniciansService.create(body);
    await loadTechnicians();
    return res;
  }, [loadTechnicians]);

  const updateTechnician = useCallback(async (id, body) => {
    const res = await techniciansService.update(id, body);
    await loadTechnicians();
    return res;
  }, [loadTechnicians]);

  const deleteTechnician = useCallback(async (id) => {
    await techniciansService.delete(id);
    const nextTechnicians = dataRef.current.technicians.filter(technician => technician._id !== id);
    commitTechnicians(nextTechnicians);
  }, [commitTechnicians]);

  useEffect(() => { refresh(); }, [refresh]);

  const value = {
    assets,
    sections,
    technicians,
    verificationResults,
    verificationAudit,
    verificationHistory,
    rfidLookup,
    transfers,
    dashboardMetrics,
    loading,
    error,
    loadAssets,
    loadSections,
    loadTechnicians,
    loadVerificationHistory,
    loadTransfers,
    loadMetrics,
    refresh,
    verifyRoom,
    lookupEpc,
    createAsset,
    deleteAsset,
    updateAsset,
    transferAsset,
    createSection,
    updateSection,
    deleteSection,
    createTechnician,
    updateTechnician,
    deleteTechnician
  };

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
}

export default AssetContext;
