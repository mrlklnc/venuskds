import express from "express";
import {
  getMusteriIlce,
  getAylikRandevu,
  getHizmetPerformans,
  getRakipAnalizi,
  getKampanyaAnalizi,
  getKarZarar,
  getIlceUygunlukSkoru,
  getBolgeselHizmetTalep,
  getIlceRandevu,
  getIlceHizmetPerformans,
  getKampanyaKarsilastirma,
  getAylikGelirTrendi,
  getIlceRakip,
  getIlceRakipNormalize,
  getTalepRakipOrani,
  getEnKarliHizmetler,
  getKonakKarsilastirma,
  getIlceUygunlukSkoruYeniSube,
  getKampanyalarArasiPerformans,
  getIlceBazliKampanyaKar
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

/**
 * GET /api/dss/ilce-uygunluk-skoru
 * Returns district suitability score for new branch
 */
router.get("/ilce-uygunluk-skoru", getIlceUygunlukSkoru);

/**
 * GET /api/dss/bolgesel-hizmet-talep
 * Returns regional service demand (stacked bar chart)
 */
router.get("/bolgesel-hizmet-talep", getBolgeselHizmetTalep);

/**
 * GET /api/dss/ilce-randevu
 * Returns appointment count per district
 */
router.get("/ilce-randevu", getIlceRandevu);

/**
 * GET /api/dss/ilce-hizmet-performans
 * Returns service performance by district (table format)
 */
router.get("/ilce-hizmet-performans", getIlceHizmetPerformans);

/**
 * GET /api/dss/kampanya-karsilastirma
 * Returns campaign vs non-campaign appointments by district
 */
router.get("/kampanya-karsilastirma", getKampanyaKarsilastirma);

/**
 * GET /api/dss/aylik-gelir-trendi
 * Returns monthly revenue trend with campaign effect
 */
router.get("/aylik-gelir-trendi", getAylikGelirTrendi);

/**
 * GET /api/dss/ilce-rakip
 * Returns competitor count per district
 */
router.get("/ilce-rakip", getIlceRakip);

/**
 * GET /api/dss/ilce-rakip-normalize
 * Returns normalized competitor count per district with multipliers
 * (Karşıyaka: 8x, Buca: 5x, Konak: 6x, others: 4x)
 */
router.get("/ilce-rakip-normalize", getIlceRakipNormalize);

/**
 * GET /api/dss/talep-rakip-orani
 * Returns demand/competitor ratio per district
 */
router.get("/talep-rakip-orani", getTalepRakipOrani);

/**
 * GET /api/dss/en-karli-hizmetler
 * Returns top 5 most profitable services
 */
router.get("/en-karli-hizmetler", getEnKarliHizmetler);

/**
 * GET /api/dss/konak-karsilastirma
 * Returns Konak vs other districts comparison by service
 */
router.get("/konak-karsilastirma", getKonakKarsilastirma);

/**
 * GET /api/dss/ilce-uygunluk-skoru-yeni-sube
 * Returns district suitability score for new branch (Konak excluded)
 */
router.get("/ilce-uygunluk-skoru-yeni-sube", getIlceUygunlukSkoruYeniSube);

/**
 * GET /api/dss/kampanyalar-arasi-performans
 * Returns campaign performance comparison (total revenue / conversion count)
 */
router.get("/kampanyalar-arasi-performans", getKampanyalarArasiPerformans);

/**
 * GET /api/dss/ilce-bazli-kampanya-kar
 * Returns campaign profit by district
 */
router.get("/ilce-bazli-kampanya-kar", getIlceBazliKampanyaKar);

export default router;
