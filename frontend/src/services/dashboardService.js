import axios from "axios";

/**
 * Dashboard Ana Verilerini Getir
 * GET /api/dashboard
 * 
 * Döndürür:
 * {
 *   totalMusteri: number,    // Toplam müşteri sayısı
 *   totalRandevu: number,    // Toplam randevu sayısı
 *   toplamGelir: number,     // Tahmini toplam gelir (TL)
 *   ortalamaRandevu: number  // Randevu başına ortalama gelir (TL)
 * }
 */
export const getDashboardSummary = async () => {
  const res = await axios.get("http://localhost:4000/api/dashboard");
  return res.data;
};

/**
 * Nüfus Yoğunluğu Verisini Getir
 * GET /api/nufus-yogunlugu
 * 
 * Döndürür:
 * [
 *   { "label": "Konak", "value": 12345.67 },
 *   ...
 * ]
 */
export const getNufusYogunlugu = async () => {
  const res = await axios.get("http://localhost:4000/api/nufus-yogunlugu");
  return res.data;
};

/**
 * Talep Payı Verisini Getir
 * GET /api/talep-payi
 * 
 * Döndürür:
 * [
 *   { "label": "Konak", "value": 22.5 },
 *   ...
 * ]
 */
export const getTalepPayi = async () => {
  const res = await axios.get("http://localhost:4000/api/talep-payi");
  return res.data;
};