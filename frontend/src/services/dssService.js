import api from './api';

export const getMusteriIlce = () => api.get('/dss/musteri-ilce');

export const getAylikRandevu = () => api.get('/dss/aylik-randevu');

export const getRandevuAylik = () => api.get('/dss/aylik-randevu');

export const getHizmetPerformans = () => api.get('/dss/hizmet-performans');

export const getRakipAnalizi = () => api.get('/dss/rakip-performans');

export const getKampanyaAnalizi = () => api.get('/dss/kampanya-analizi');

export const getKarZarar = () => api.get('/dss/kar-zarar');
