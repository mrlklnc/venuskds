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
