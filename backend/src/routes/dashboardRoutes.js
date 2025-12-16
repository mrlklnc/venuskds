import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';

const router = express.Router();

/**
 * GET /api/dashboard
 * 
 * Dashboard ana endpoint'i
 * 
 * Döndürür:
 * {
 *   totalMusteri: number,    // Toplam müşteri sayısı
 *   totalRandevu: number,    // Toplam randevu sayısı
 *   toplamGelir: number,     // Tahmini toplam gelir (TL)
 *   ortalamaRandevu: number  // Randevu başına ortalama gelir (TL)
 * }
 * 
 * Fiyat Hesaplama:
 * - hizmet.fiyat_araligi formatı: "800-1500 TL"
 * - Hesaplama: (min + max) / 2
 */
router.get('/', getDashboard);

export default router;





