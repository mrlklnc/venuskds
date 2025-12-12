import api from './api';

export const dssService = {
  getOverview: (year = 2025) => api.get('/dss/overview', { params: { year } }),
  getBestDistrict: () => api.get('/dss/best-district'),
  getServicePerformance: (year = 2025) => api.get('/dss/service-performance', { params: { year } }),
  getCampaignEffectiveness: () => api.get('/dss/campaign-effectiveness'),
  getCustomerSatisfaction: () => api.get('/dss/customer-satisfaction'),
  getDistrictDemand: (year = 2025) => api.get('/dss/district-demand', { params: { year } }),
  getCompetitorAnalysis: () => api.get('/dss/competitor-analysis'),
  getBranchROI: (ilceId) => api.get('/dss/branch-roi', { params: { ilce_id: ilceId } }),
  // New analytics endpoints
  getMusteriIlce: () => api.get('/dss/musteri-ilce'),
  getRandevuAylik: () => api.get('/dss/randevu-aylik'),
};

// Export individual functions for direct use
export const getMusteriIlce = () => api.get('/dss/musteri-ilce');
export const getRandevuAylik = () => api.get('/dss/randevu-aylik');

