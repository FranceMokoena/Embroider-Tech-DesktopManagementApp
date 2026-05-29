import apiClient from './apiClient';

const rfidService = {
  verifyRoom: async ({ epcs, currentSection, section, sectionId, verifiedBy }) =>
    apiClient.post('/rfid/verify-room', {
      epcs,
      currentSection: currentSection || section || sectionId,
      section: section || currentSection || sectionId,
      sectionId,
      verifiedBy
    }),
  scan: async (body) => apiClient.post('/rfid/scan', body),
  getTag: async (epc) => apiClient.get(`/rfid/tags/${encodeURIComponent(epc)}`),
  lookup: async (epc) => apiClient.get(`/rfid/lookup/${encodeURIComponent(epc)}`)
};

export default rfidService;
