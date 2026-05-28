import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import assetsService from '../services/assetsService';
import rfidService from '../services/rfidService';
import AssetModel from '../models/AssetModel';
import SectionModel from '../models/SectionModel';
import VerificationModel from '../models/VerificationModel';
import RFIDTagModel from '../models/RFIDTagModel';

const AssetContext = createContext(null);

export const useAssets = () => useContext(AssetContext);

export function AssetProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [sections, setSections] = useState([]);
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
    const res = await assetsService.sections();
    const mapped = extractRecords(res).map(s => SectionModel.normalizeSection(s)).filter(Boolean);
    setSections(mapped);
    return mapped;
  }, []);

  const loadVerificationHistory = useCallback(async (params = {}) => {
    const res = await assetsService.verificationHistory(params);
    const mapped = extractRecords(res).map(v => VerificationModel.normalizeVerification(v)).filter(Boolean);
    setVerificationHistory(mapped);
    return mapped;
  }, []);

  const loadTransfers = useCallback(async (params = {}) => {
    const res = await assetsService.transfers(params);
    const mapped = extractRecords(res);
    setTransfers(mapped);
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
    loadMetrics().catch(() => null);
  }, [calculateMetrics, loadAssets, loadMetrics, loadSections, loadTransfers, loadVerificationHistory]);

  const verifyRoom = useCallback(async (body) => {
    setLoading(true);
    try {
      const res = await rfidService.verifyRoom(body);
      const results = (res?.results || res?.verificationResults || []).map(v =>
        VerificationModel.normalizeVerification(v)
      ).filter(Boolean);

      setVerificationResults(results);

      if (res?.updatedAssetIds?.length) {
        await loadAssets({ ids: res.updatedAssetIds.join(',') });
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

  useEffect(() => { refresh(); }, [refresh]);

  const value = {
    assets,
    sections,
    verificationResults,
    verificationHistory,
    rfidLookup,
    transfers,
    dashboardMetrics,
    loading,
    error,
    loadAssets,
    loadSections,
    loadVerificationHistory,
    loadTransfers,
    loadMetrics,
    refresh,
    verifyRoom,
    lookupEpc,
    deleteAsset,
    updateAsset,
    transferAsset
  };

  return <AssetContext.Provider value={value}>{children}</AssetContext.Provider>;
}

export default AssetContext;
