import apiClient from './apiClient';

const rfidService = {
  verifyRoom: async ({ epcs, currentSection, sectionId, verifiedBy }) =>
    apiClient.post('/api/rfid/verify-room', {
      epcs,
      currentSection,
      sectionId,
      verifiedBy
    }),
  getTag: async (epc) => apiClient.get(`/api/rfid/tag/${encodeURIComponent(epc)}`),
  lookup: async (epc) => apiClient.get(`/api/rfid/lookup/${encodeURIComponent(epc)}`)
};

export default rfidService;
