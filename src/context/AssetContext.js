import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

export function AssetProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [sections, setSections] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [verificationResults, setVerificationResults] = useState([]);
  const [verificationHistory, setVerificationHistory] = useState([]);
  const [rfidLookup, setRfidLookup] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalAssets: 0,
    verified: 0,
    missing: 0,
    sectionMismatch: 0,
    sections: 0,
    transfers: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const extractRecords = (res) => {
    if (Array.isArray(res)) return res;
    return res?.records || [];
  };

  const verificationRowsFromAudit = (audit) => {
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
      verifiedAt
    }));

    return [
      ...fromAssets(audit.matchedAssets, 'Verified'),
      ...fromAssets(audit.missingAssets, 'Missing'),
      ...fromAssets(audit.unexpectedAssets, 'Section Mismatch'),
      ...fromAssets(audit.unregisteredTags, 'Unregistered')
    ];
  };

  const extractVerificationRows = (res) => {
    const directRows = [
      ...(res?.results || []),
      ...(res?.verificationResults || []),
      ...(res?.verificationHistory || []),
      ...(res?.verifications || []),
      ...verificationRowsFromAudit(res?.audit)
    ];

    return directRows.map(v => VerificationModel.normalizeVerification(v)).filter(Boolean);
  };

  const calculateMetrics = useCallback((assetRecords, sectionRecords = [], transferRecords = []) => {
    const history = assetRecords.flatMap(asset => asset.verificationHistory || []);
    const latestResults = history.reduce((acc, item) => {
      if (item?.status) acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    setDashboardMetrics({
      totalAssets: assetRecords.length,
      verified: latestResults.Verified || latestResults.verified || 0,
      missing: latestResults.Missing || latestResults.missing || 0,
      sectionMismatch: latestResults['Section Mismatch'] || latestResults.sectionMismatch || 0,
      sections: sectionRecords.length,
      transfers: transferRecords.length
    });
  }, []);

  const loadAssets = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await assetsService.list(params);
      const mapped = extractRecords(res).map(a => AssetModel.normalizeAsset(a)).filter(Boolean);
      setAssets(mapped);
      calculateMetrics(mapped);
      setError(null);
      return mapped;
    } catch (err) {
      console.error('Asset load error', err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSections = useCallback(async () => {
    let res;
    try {
      res = await sectionsService.options();
    } catch (err) {
      res = await sectionsService.list();
    }
    const mapped = extractRecords(res).map(s => SectionModel.normalizeSection(s)).filter(Boolean);
    setSections(mapped);
    return mapped;
  }, []);

  const loadVerificationHistory = useCallback(async (params = {}) => {
    const res = await assetsService.verificationHistory(params);
    const mapped = extractVerificationRows(res);
    setVerificationHistory(mapped);
    setVerificationResults(prev => (prev.length ? prev : mapped.slice(0, 10)));
    return mapped;
  }, []);

  const loadTransfers = useCallback(async (params = {}) => {
    const res = await transfersService.list(params);
    const mapped = extractRecords(res);
    setTransfers(mapped);
    return mapped;
  }, []);

  const loadTechnicians = useCallback(async (params = {}) => {
    const res = await techniciansService.list(params);
    const mapped = extractRecords(res).map(t => TechnicianModel.normalizeTechnician(t)).filter(Boolean);
    setTechnicians(mapped);
    return mapped;
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      const res = await assetsService.metrics();
      if (res && typeof res === 'object' && !Array.isArray(res)) {
        setDashboardMetrics(prev => ({ ...prev, ...res }));
      }
      return res;
    } catch (err) {
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    const [assetRecords, sectionRecords, transferRecords] = await Promise.all([
      loadAssets(),
      loadSections().catch(() => []),
      loadTransfers().catch(() => [])
    ]);
    calculateMetrics(assetRecords, sectionRecords, transferRecords);
    loadVerificationHistory().catch(() => []);
    loadTechnicians().catch(() => []);
    loadMetrics().catch(() => null);
  }, [calculateMetrics, loadAssets, loadMetrics, loadSections, loadTechnicians, loadTransfers, loadVerificationHistory]);

  const verifyRoom = useCallback(async (body) => {
    setLoading(true);
    try {
      const res = await rfidService.verifyRoom(body);
      const results = extractVerificationRows(res);

      setVerificationResults(results);

      const updatedAssetIds = res?.updatedAssetIds || res?.audit?.updatedAssetIds || [];
      if (updatedAssetIds.length) {
        await loadAssets({ ids: updatedAssetIds.join(',') });
      } else {
        await loadAssets();
      }

      await loadVerificationHistory().catch(() => []);
      return res;
    } catch (err) {
      console.error('RFID verify error', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAssets, loadVerificationHistory]);

  const lookupEpc = useCallback(async (epc) => {
    const res = await rfidService.lookup(epc);
    const normalized = RFIDTagModel.normalizeTag(res?.tag || res?.data || res);
    setRfidLookup(normalized);
    return normalized;
  }, []);

  const deleteAsset = useCallback(async (id) => {
    await assetsService.delete(id);
    setAssets(prev => prev.filter(a => a._id !== id));
  }, []);

  const updateAsset = useCallback(async (id, body) => {
    const updated = await assetsService.update(id, body);
    const norm = AssetModel.normalizeAsset(updated?.asset || updated?.data || updated);
    setAssets(prev => prev.map(a => a._id === norm._id ? norm : a));
    return norm;
  }, []);

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
    setSections(prev => prev.filter(section => section._id !== id));
  }, []);

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
    setTechnicians(prev => prev.filter(technician => technician._id !== id));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value = {
    assets,
    sections,
    technicians,
    verificationResults,
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
