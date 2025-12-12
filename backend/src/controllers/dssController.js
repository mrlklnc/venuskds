import { prisma } from '../server.js';

/**
 * Customer Distribution by District
 * GET /api/dss/musteri-ilce
 * Returns: ilce, musteri_sayisi
 */
export const getMusteriIlce = async (req, res) => {
  try {
    const data = await prisma.$queryRaw`
      SELECT 
        i.ilce_ad AS ilce,
        COUNT(m.musteri_id) AS musteri_sayisi
      FROM musteri m
      LEFT JOIN ilce i ON m.ilce_id = i.ilce_id
      GROUP BY m.ilce_id, i.ilce_ad
      ORDER BY musteri_sayisi DESC;
    `;

    // Convert BigInt to Number for JSON serialization
    const result = data.map(item => ({
      ilce: item.ilce || "Bilinmeyen İlçe",
      musteri_sayisi: Number(item.musteri_sayisi) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error("Error in getMusteriIlce:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Monthly Appointment Trend
 * GET /api/dss/aylik-randevu
 * Returns: ay, toplam_randevu
 */
export const getAylikRandevu = async (req, res) => {
  try {
    const data = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(tarih, '%Y-%m') AS ay,
        COUNT(*) AS toplam_randevu
      FROM randevu
      WHERE tarih IS NOT NULL
      GROUP BY ay
      ORDER BY ay DESC;
    `;

    // Convert BigInt to Number for JSON serialization
    const result = data.map(item => ({
      ay: item.ay || "",
      toplam_randevu: Number(item.toplam_randevu) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error("Error in getAylikRandevu:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Service Performance Analytics
 * GET /api/dss/hizmet-performans
 * Returns: hizmet_ad, fiyat_araligi, toplam_randevu
 * 
 * IMPORTANT: Uses h.fiyat_araligi (string) from hizmet table, NO numeric operations
 */
export const getHizmetPerformans = async (req, res) => {
  try {
    const data = await prisma.$queryRaw`
      SELECT 
        h.hizmet_ad,
        h.fiyat_araligi,
        COUNT(r.randevu_id) AS toplam_randevu
      FROM randevu r
      JOIN hizmet h ON r.hizmet_id = h.hizmet_id
      GROUP BY h.hizmet_id, h.hizmet_ad, h.fiyat_araligi
      ORDER BY toplam_randevu DESC;
    `;

    // Convert BigInt to Number for JSON serialization
    const result = data.map(item => ({
      hizmet_ad: item.hizmet_ad || "Bilinmeyen Hizmet",
      fiyat_araligi: item.fiyat_araligi || "",
      toplam_randevu: Number(item.toplam_randevu) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error("Error in getHizmetPerformans:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Competitor Analysis
 * GET /api/dss/rakip-analizi
 * Returns: hizmet_ad, avg_fiyat, min_fiyat, max_fiyat
 */
export const getRakipAnalizi = async (req, res) => {
  try {
    const data = await prisma.$queryRaw`
      SELECT 
        h.hizmet_ad,
        ROUND(AVG(rh.fiyat), 2) AS avg_fiyat,
        MIN(rh.fiyat) AS min_fiyat,
        MAX(rh.fiyat) AS max_fiyat
      FROM hizmet h
      LEFT JOIN rakip_hizmet rh ON h.hizmet_id = rh.hizmet_id
      GROUP BY h.hizmet_id, h.hizmet_ad
      HAVING avg_fiyat IS NOT NULL
      ORDER BY h.hizmet_ad;
    `;

    // Convert BigInt/Decimal to Number for JSON serialization
    const result = data.map(item => ({
      hizmet_ad: item.hizmet_ad || "Bilinmeyen Hizmet",
      avg_fiyat: Number(item.avg_fiyat) || 0,
      min_fiyat: Number(item.min_fiyat) || 0,
      max_fiyat: Number(item.max_fiyat) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error("Error in getRakipAnalizi:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Campaign Analysis
 * GET /api/dss/kampanya-analizi
 * Returns: kampanya_aciklama, hizmet_ad, indirim_orani, randevu_sayisi
 */
export const getKampanyaAnalizi = async (req, res) => {
  try {
    const data = await prisma.$queryRaw`
      SELECT 
        k.aciklama AS kampanya_aciklama,
        h.hizmet_ad,
        k.indirim_orani,
        COUNT(r.randevu_id) AS randevu_sayisi
      FROM kampanya k
      LEFT JOIN hizmet h ON k.hizmet_id = h.hizmet_id
      LEFT JOIN randevu r ON r.hizmet_id = h.hizmet_id
      GROUP BY k.kampanya_id, k.aciklama, h.hizmet_ad, k.indirim_orani
      ORDER BY randevu_sayisi DESC;
    `;

    // Convert BigInt to Number for JSON serialization
    const result = data.map(item => ({
      kampanya_aciklama: item.kampanya_aciklama || "",
      hizmet_ad: item.hizmet_ad || "Bilinmeyen Hizmet",
      indirim_orani: Number(item.indirim_orani) || 0,
      randevu_sayisi: Number(item.randevu_sayisi) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error("Error in getKampanyaAnalizi:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Profit/Loss Analysis
 * GET /api/dss/kar-zarar
 * Returns: ay, toplam_masraf, toplam_gelir, net_kar
 */
export const getKarZarar = async (req, res) => {
  try {
    // Get revenue by month
    const revenueData = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(tarih, '%Y-%m') AS ay,
        COALESCE(SUM(fiyat), 0) AS toplam_gelir
      FROM randevu
      WHERE tarih IS NOT NULL
      GROUP BY ay;
    `;

    // Get expenses by month
    const expenseData = await prisma.$queryRaw`
      SELECT 
        ay,
        COALESCE(SUM(kira + maas + elektrik + su + diger), 0) AS toplam_masraf
      FROM masraf
      GROUP BY ay;
    `;

    // Combine revenue and expenses
    const revenueMap = {};
    revenueData.forEach(item => {
      revenueMap[item.ay] = Number(item.toplam_gelir) || 0;
    });

    const expenseMap = {};
    expenseData.forEach(item => {
      expenseMap[item.ay] = Number(item.toplam_masraf) || 0;
    });

    // Get all unique months
    const allMonths = new Set([...Object.keys(revenueMap), ...Object.keys(expenseMap)]);
    
    const result = Array.from(allMonths)
      .sort()
      .reverse()
      .map(ay => ({
        ay: ay || "",
        toplam_masraf: expenseMap[ay] || 0,
        toplam_gelir: revenueMap[ay] || 0,
        net_kar: (revenueMap[ay] || 0) - (expenseMap[ay] || 0)
      }));

    res.json(result);
  } catch (err) {
    console.error("Error in getKarZarar:", err);
    res.status(500).json({ error: err.message });
  }
};
