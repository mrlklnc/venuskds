import express from "express";
import {
  getMusteriIlce,
  getAylikRandevu,
  getHizmetPerformans,
  getRakipAnalizi,
  getKampanyaAnalizi,
  getKarZarar
} from "../controllers/dssController.js";

const router = express.Router();

/**
 * GET /api/dss/musteri-ilce
 * Returns customer count per district
 */
router.get("/musteri-ilce", getMusteriIlce);

/**
 * GET /api/dss/aylik-randevu
 * Returns monthly appointment trend
 */
router.get("/aylik-randevu", getAylikRandevu);

/**
 * GET /api/dss/hizmet-performans
 * Returns service performance analytics
 */
router.get("/hizmet-performans", getHizmetPerformans);

/**
 * GET /api/dss/rakip-analizi
 * Returns competitor price analysis per service
 */
router.get("/rakip-analizi", getRakipAnalizi);

/**
 * GET /api/dss/rakip-performans
 * Returns competitor price analysis per service
 */
router.get("/rakip-performans", getRakipAnalizi);

/**
 * GET /api/dss/kampanya-analizi
 * Returns campaign effectiveness analysis
 */
router.get("/kampanya-analizi", getKampanyaAnalizi);

/**
 * GET /api/dss/kar-zarar
 * Returns monthly profit/loss analysis
 */
router.get("/kar-zarar", getKarZarar);

export default router;
