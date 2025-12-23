import pool from '../lib/db.js';
import { 
  hesaplaNormalizeRakip, 
  hesaplaRiskSeviyesiHarita, 
  computeIlceUygunlukSkoru 
} from '../utils/ilceSkorUtil.js';

/**
 * Hizmet isimlerini normalize eden yardımcı fonksiyon
 * Örnek: "Kaş - Kalıcı Makyaj" ve "Kalıcı Makyaj (Kaş)" → "Kalıcı Makyaj - Kaş"
 */
const normalizeHizmetAdi = (hizmetAd) => {
  if (!hizmetAd) return "Bilinmeyen Hizmet";
  
  const normalized = hizmetAd.trim();
  
  // Kalıcı Makyaj varyasyonları
  if (normalized.toLowerCase().includes('kalıcı makyaj') && normalized.toLowerCase().includes('kaş')) {
    return 'Kalıcı Makyaj - Kaş';
  }
  if (normalized.toLowerCase().includes('kalıcı makyaj') && normalized.toLowerCase().includes('dudak')) {
    return 'Kalıcı Makyaj - Dudak';
  }
  if (normalized.toLowerCase().includes('kalıcı makyaj') && normalized.toLowerCase().includes('eyeliner')) {
    return 'Kalıcı Makyaj - Eyeliner';
  }
  
  // Lazer varyasyonları
  if (normalized.toLowerCase().includes('lazer') && normalized.toLowerCase().includes('epilasyon')) {
    return 'Lazer Epilasyon';
  }
  
  // Cilt bakımı varyasyonları
  if (normalized.toLowerCase().includes('hydrafacial') || normalized.toLowerCase().includes('hidrafacial')) {
    return 'HydraFacial';
  }
  
  return normalized;
};

/**
 * Customer Distribution by District
 * GET /api/dss/musteri-ilce
 * Returns: ilce, musteri_sayisi
 */
export const getMusteriIlce = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        i.ilce_ad AS ilce,
        COUNT(m.musteri_id) AS musteri_sayisi
      FROM musteri m
      LEFT JOIN ilce i ON m.ilce_id = i.ilce_id
      WHERE m.is_test = 0
      GROUP BY m.ilce_id, i.ilce_ad
      ORDER BY musteri_sayisi DESC
    `);

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
 * 
 * IMPORTANT: Uses same filter as dashboard (m.is_test = 0) to ensure consistency
 */
export const getAylikRandevu = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        DATE_FORMAT(r.tarih, '%Y-%m') AS ay,
        COUNT(*) AS toplam_randevu
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      WHERE r.tarih IS NOT NULL
        AND m.is_test = 0
      GROUP BY ay
      ORDER BY ay DESC
    `);

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
    const [data] = await pool.execute(`
      SELECT 
        h.hizmet_ad,
        h.fiyat_araligi,
        COUNT(r.randevu_id) AS toplam_randevu
      FROM randevu r
      JOIN hizmet h ON r.hizmet_id = h.hizmet_id
      GROUP BY h.hizmet_id, h.hizmet_ad, h.fiyat_araligi
      ORDER BY toplam_randevu DESC
    `);

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
    const [data] = await pool.execute(`
      SELECT 
        h.hizmet_ad,
        ROUND(AVG(rh.fiyat), 2) AS avg_fiyat,
        MIN(rh.fiyat) AS min_fiyat,
        MAX(rh.fiyat) AS max_fiyat
      FROM hizmet h
      LEFT JOIN rakip_hizmet rh ON h.hizmet_id = rh.hizmet_id
      GROUP BY h.hizmet_id, h.hizmet_ad
      HAVING avg_fiyat IS NOT NULL
      ORDER BY h.hizmet_ad
    `);

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
    const [data] = await pool.execute(`
      SELECT 
        k.aciklama AS kampanya_aciklama,
        h.hizmet_ad,
        k.indirim_orani,
        COUNT(r.randevu_id) AS randevu_sayisi
      FROM kampanya k
      LEFT JOIN hizmet h ON k.hizmet_id = h.hizmet_id
      LEFT JOIN randevu r ON r.hizmet_id = h.hizmet_id
      GROUP BY k.kampanya_id, k.aciklama, h.hizmet_ad, k.indirim_orani
      ORDER BY randevu_sayisi DESC
    `);

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
 * İlçe Uygunluk Skoru
 * GET /api/dss/ilce-uygunluk-skoru
 * Returns: ilce_ad, musteri_sayisi, randevu_sayisi, ortalama_gelir, rakip_sayisi, uygunluk_skoru
 */
export const getIlceUygunlukSkoru = async (req, res) => {
  try {
    // İlçe bazında tüm metrikleri al
    const [data] = await pool.execute(`
      SELECT 
        i.ilce_id,
        i.ilce_ad,
        i.ort_gelir,
        COUNT(DISTINCT m.musteri_id) AS musteri_sayisi,
        COUNT(DISTINCT r.randevu_id) AS randevu_sayisi,
        COUNT(DISTINCT ri.rakip_id) AS rakip_sayisi
      FROM ilce i
      LEFT JOIN musteri m ON m.ilce_id = i.ilce_id AND m.is_test = 0
      LEFT JOIN randevu r ON r.musteri_id = m.musteri_id
      LEFT JOIN rakip_isletme ri ON ri.ilce_id = i.ilce_id
      GROUP BY i.ilce_id, i.ilce_ad, i.ort_gelir
      ORDER BY musteri_sayisi DESC
    `);

    // Normalize edilmiş rakip sayılarını hesapla
    const dataWithNormalizeRakip = data.map(item => {
      const ilceAd = item.ilce_ad || "";
      const bilinenRakip = Number(item.rakip_sayisi) || 0;
      
      // Normalize edilmiş rakip sayısı (rekabet yoğunluğu)
      let normalizeRakip = bilinenRakip;
      if (ilceAd === 'Karşıyaka') {
        normalizeRakip = bilinenRakip * 8;
      } else if (ilceAd === 'Buca') {
        normalizeRakip = bilinenRakip * 5;
      } else if (ilceAd === 'Konak') {
        normalizeRakip = bilinenRakip * 6;
      } else {
        normalizeRakip = bilinenRakip * 4;
      }
      
      return {
        ...item,
        normalize_rakip: normalizeRakip
      };
    });

    // Normalize için max değerleri bul
    const maxMusteri = Math.max(...dataWithNormalizeRakip.map(d => Number(d.musteri_sayisi) || 0), 1);
    const maxRandevu = Math.max(...dataWithNormalizeRakip.map(d => Number(d.randevu_sayisi) || 0), 1);
    const maxGelir = Math.max(...dataWithNormalizeRakip.map(d => Number(d.ort_gelir) || 0), 1);
    const maxNormalizeRakip = Math.max(...dataWithNormalizeRakip.map(d => Number(d.normalize_rakip) || 0), 1);

    // Uygunluk skoru hesapla (0-100)
    const result = dataWithNormalizeRakip.map(item => {
      const musteriSayisi = Number(item.musteri_sayisi) || 0;
      const randevuSayisi = Number(item.randevu_sayisi) || 0;
      const ortGelir = Number(item.ort_gelir) || 0;
      const rakipSayisi = Number(item.rakip_sayisi) || 0;
      const normalizeRakip = Number(item.normalize_rakip) || 0;

      // Normalize edilmiş değerler (0-1 arası)
      const musteriNorm = musteriSayisi / maxMusteri;
      const randevuNorm = randevuSayisi / maxRandevu;
      const gelirNorm = ortGelir / maxGelir;
      // Normalize edilmiş rakip sayısını normalize et (yüksek normalize rakip = düşük skor)
      const normalizeRakipNorm = normalizeRakip / maxNormalizeRakip;

      // Ağırlıklı skor hesaplama
      // Pozitif etki: musteri (30%), randevu (30%), gelir (20%)
      // Negatif etki: normalize edilmiş rakip (20%) - yüksek normalize rakip skoru düşürür
      const pozitifSkor = (musteriNorm * 0.30) + (randevuNorm * 0.30) + (gelirNorm * 0.20);
      const negatifSkor = normalizeRakipNorm * 0.20;
      
      // Final skor (0-100)
      const uygunlukSkoru = Math.round(Math.max(0, Math.min(100, (pozitifSkor - negatifSkor + 0.20) * 100)));

      return {
        ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
        musteri_sayisi: musteriSayisi,
        randevu_sayisi: randevuSayisi,
        ortalama_gelir: ortGelir,
        rakip_sayisi: rakipSayisi,
        uygunluk_skoru: uygunlukSkoru
      };
    });

    // Skora göre sırala (yüksekten düşüğe)
    result.sort((a, b) => b.uygunluk_skoru - a.uygunluk_skoru);

    res.json(result);
  } catch (err) {
    console.error("Error in getIlceUygunlukSkoru:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * İlçe Uygunluk Skoru (Yeni Şube İçin)
 * GET /api/dss/ilce-uygunluk-skoru-yeni-sube
 * Returns: Konak hariç tüm ilçeler için 0-100 uygunluk skoru
 * Skor bileşenleri: Talep (30), Gelir (25), Hizmet Uyumu (25), Rekabet (20)
 */
export const getIlceUygunlukSkoruYeniSube = async (req, res) => {
  try {
    // 1. Konak'ta güçlü hizmetleri bul
    const [konakHizmetData] = await pool.execute(`
      SELECT 
        h.hizmet_ad,
        h.fiyat_araligi,
        COUNT(r.randevu_id) AS toplam_randevu
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      JOIN ilce i ON m.ilce_id = i.ilce_id
      JOIN hizmet h ON r.hizmet_id = h.hizmet_id
      WHERE i.ilce_ad = 'Konak' AND m.is_test = 0
      GROUP BY h.hizmet_id, h.hizmet_ad, h.fiyat_araligi
      ORDER BY toplam_randevu DESC
    `);

    // Konak'ta güçlü hizmetleri normalize et ve en yüksek 5'ini seç
    const konakHizmetMap = {};
    konakHizmetData.forEach(item => {
      const normalizedName = normalizeHizmetAdi(item.hizmet_ad);
      if (!konakHizmetMap[normalizedName]) {
        konakHizmetMap[normalizedName] = 0;
      }
      konakHizmetMap[normalizedName] += Number(item.toplam_randevu) || 0;
    });
    const konakGucluHizmetler = Object.entries(konakHizmetMap)
      .map(([hizmet, randevu]) => ({ hizmet, randevu }))
      .sort((a, b) => b.randevu - a.randevu)
      .slice(0, 5)
      .map(h => h.hizmet);

    // 2. Tüm ilçeler için metrikleri al (Konak hariç)
    const [ilceData] = await pool.execute(`
      SELECT 
        i.ilce_id,
        i.ilce_ad,
        i.ort_gelir,
        COUNT(DISTINCT r.randevu_id) AS randevu_sayisi,
        COUNT(DISTINCT ri.rakip_id) AS rakip_sayisi
      FROM ilce i
      LEFT JOIN musteri m ON m.ilce_id = i.ilce_id AND m.is_test = 0
      LEFT JOIN randevu r ON r.musteri_id = m.musteri_id
      LEFT JOIN rakip_isletme ri ON ri.ilce_id = i.ilce_id
      WHERE i.ilce_ad != 'Konak'
      GROUP BY i.ilce_id, i.ilce_ad, i.ort_gelir
    `);

    // 3. Her ilçe için Konak'ta güçlü hizmetlerin talebini hesapla
    const [hizmetUyumData] = await pool.execute(`
      SELECT 
        i.ilce_ad,
        h.hizmet_ad,
        COUNT(r.randevu_id) AS randevu_sayisi
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      JOIN ilce i ON m.ilce_id = i.ilce_id
      JOIN hizmet h ON r.hizmet_id = h.hizmet_id
      WHERE i.ilce_ad != 'Konak' AND m.is_test = 0
      GROUP BY i.ilce_id, i.ilce_ad, h.hizmet_id, h.hizmet_ad
    `);

    // İlçe bazında hizmet uyumu skorunu hesapla
    const ilceHizmetUyumMap = {};
    hizmetUyumData.forEach(item => {
      const normalizedName = normalizeHizmetAdi(item.hizmet_ad);
      const ilceAd = item.ilce_ad || "Bilinmeyen";
      if (!ilceHizmetUyumMap[ilceAd]) {
        ilceHizmetUyumMap[ilceAd] = 0;
      }
      if (konakGucluHizmetler.includes(normalizedName)) {
        ilceHizmetUyumMap[ilceAd] += Number(item.randevu_sayisi) || 0;
      }
    });

    // 4. Normalize edilmiş rakip sayılarını hesapla (Konak hariç)
    const nonKonakIlceler = ilceData.filter(d => d.ilce_ad !== 'Konak');
    const nonKonakIlcelerWithNormalizeRakip = nonKonakIlceler.map(item => {
      const ilceAd = item.ilce_ad || "";
      const bilinenRakip = Number(item.rakip_sayisi) || 0;
      
      // Normalize edilmiş rakip sayısı (rekabet yoğunluğu)
      let normalizeRakip = bilinenRakip;
      if (ilceAd === 'Karşıyaka') {
        normalizeRakip = bilinenRakip * 8;
      } else if (ilceAd === 'Buca') {
        normalizeRakip = bilinenRakip * 5;
      } else if (ilceAd === 'Konak') {
        normalizeRakip = bilinenRakip * 6;
      } else {
        normalizeRakip = bilinenRakip * 4;
      }
      
      return {
        ...item,
        normalize_rakip: normalizeRakip
      };
    });

    // 5. Normalize için max değerleri bul (Konak hariç)
    const maxRandevu = Math.max(...nonKonakIlcelerWithNormalizeRakip.map(d => Number(d.randevu_sayisi) || 0), 1);
    const maxGelir = Math.max(...nonKonakIlcelerWithNormalizeRakip.map(d => Number(d.ort_gelir) || 0), 1);
    const maxNormalizeRakip = Math.max(...nonKonakIlcelerWithNormalizeRakip.map(d => Number(d.normalize_rakip) || 0), 1);
    const maxHizmetUyum = Math.max(...Object.values(ilceHizmetUyumMap), 1);

    // 6. Skor hesapla
    const result = nonKonakIlcelerWithNormalizeRakip.map(item => {
      const ilceAd = item.ilce_ad || "Bilinmeyen İlçe";
      const randevuSayisi = Number(item.randevu_sayisi) || 0;
      const ortGelir = Number(item.ort_gelir) || 0;
      const rakipSayisi = Number(item.rakip_sayisi) || 0;
      const normalizeRakip = Number(item.normalize_rakip) || 0;
      const hizmetUyumSayisi = ilceHizmetUyumMap[ilceAd] || 0;

      // Normalize edilmiş değerler (0-1 arası)
      const talepNorm = randevuSayisi / maxRandevu;
      const gelirNorm = ortGelir / maxGelir;
      const hizmetUyumNorm = hizmetUyumSayisi / maxHizmetUyum;
      // Normalize edilmiş rakip sayısını normalize et (yüksek normalize rakip = düşük skor)
      const normalizeRakipNorm = normalizeRakip / maxNormalizeRakip;

      // Skor bileşenleri (toplam 100)
      const talepSkor = talepNorm * 30;        // 30 puan
      const gelirSkor = gelirNorm * 25;        // 25 puan
      const hizmetUyumSkor = hizmetUyumNorm * 25; // 25 puan
      // Normalize edilmiş rakip skoru düşürücü faktör olarak kullan (yüksek normalize rakip = düşük rekabet skoru)
      const rekabetSkor = (1 - normalizeRakipNorm) * 20;   // 20 puan (ters etki)

      // Final skor (0-100)
      const uygunlukSkoru = Math.round(
        Math.max(0, Math.min(100, talepSkor + gelirSkor + hizmetUyumSkor + rekabetSkor))
      );

      return {
        ilce_ad: ilceAd,
        randevu_sayisi: randevuSayisi,
        ortalama_gelir: ortGelir,
        rakip_sayisi: rakipSayisi,
        normalize_rakip: normalizeRakip, // Normalize edilmiş rakip sayısı (risk hesaplaması için)
        hizmet_uyum_skoru: Math.round(hizmetUyumNorm * 25),
        uygunluk_skoru: uygunlukSkoru,
        skor_detay: {
          talep: Math.round(talepSkor),
          gelir: Math.round(gelirSkor),
          hizmet_uyumu: Math.round(hizmetUyumSkor),
          rekabet: Math.round(rekabetSkor)
        }
      };
    });

    // Skora göre sırala (yüksekten düşüğe)
    result.sort((a, b) => b.uygunluk_skoru - a.uygunluk_skoru);

    res.json({
      ilceler: result,
      konak_guclu_hizmetler: konakGucluHizmetler
    });
  } catch (err) {
    console.error("Error in getIlceUygunlukSkoruYeniSube:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Bölgesel Hizmet Talebi
 * GET /api/dss/bolgesel-hizmet-talep
 * Returns: İlçe bazında hizmet dağılımı (stacked bar chart için)
 */
export const getBolgeselHizmetTalep = async (req, res) => {
  try {
    // İlçe ve hizmet bazında randevu sayısını al
    const [data] = await pool.execute(`
      SELECT 
        i.ilce_ad,
        h.hizmet_ad,
        COUNT(r.randevu_id) AS randevu_sayisi
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      JOIN ilce i ON m.ilce_id = i.ilce_id
      JOIN hizmet h ON r.hizmet_id = h.hizmet_id
      WHERE i.ilce_ad IS NOT NULL AND m.is_test = 0
      GROUP BY i.ilce_id, i.ilce_ad, h.hizmet_id, h.hizmet_ad
      ORDER BY i.ilce_ad, randevu_sayisi DESC
    `);

    // Tüm hizmet adlarını topla (unique)
    const hizmetler = [...new Set(data.map(d => d.hizmet_ad))];

    // İlçe bazında grupla ve stacked bar chart için formatla
    const ilceMap = {};
    data.forEach(item => {
      const ilceAd = item.ilce_ad || "Bilinmeyen";
      if (!ilceMap[ilceAd]) {
        ilceMap[ilceAd] = { ilce_ad: ilceAd, toplam: 0 };
        // Her hizmet için 0 değeri başlat
        hizmetler.forEach(h => {
          ilceMap[ilceAd][h] = 0;
        });
      }
      ilceMap[ilceAd][item.hizmet_ad] = Number(item.randevu_sayisi) || 0;
      ilceMap[ilceAd].toplam += Number(item.randevu_sayisi) || 0;
    });

    // Array'e çevir ve toplama göre sırala
    const result = Object.values(ilceMap)
      .sort((a, b) => b.toplam - a.toplam)
      .slice(0, 10); // En yoğun 10 ilçe

    res.json({
      data: result,
      hizmetler: hizmetler
    });
  } catch (err) {
    console.error("Error in getBolgeselHizmetTalep:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * İlçe Bazlı Randevu Sayısı
 * GET /api/dss/ilce-randevu
 * Returns: ilce_ad, randevu_sayisi
 */
export const getIlceRandevu = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        i.ilce_ad,
        COUNT(r.randevu_id) AS randevu_sayisi
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      JOIN ilce i ON m.ilce_id = i.ilce_id
      WHERE m.is_test = 0
      GROUP BY i.ilce_id, i.ilce_ad
      ORDER BY randevu_sayisi DESC
    `);

    const result = data.map(item => ({
      ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
      randevu_sayisi: Number(item.randevu_sayisi) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error("Error in getIlceRandevu:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * İlçe Bazlı Hizmet Performans Tablosu
 * GET /api/dss/ilce-hizmet-performans
 * Returns: hizmet_ad, ilce_ad, toplam_randevu, ortalama_gelir, toplam_gelir
 */
export const getIlceHizmetPerformans = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        h.hizmet_ad,
        i.ilce_ad,
        COUNT(r.randevu_id) AS toplam_randevu,
        h.fiyat_araligi
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      JOIN ilce i ON m.ilce_id = i.ilce_id
      JOIN hizmet h ON r.hizmet_id = h.hizmet_id
      WHERE m.is_test = 0
      GROUP BY h.hizmet_id, h.hizmet_ad, i.ilce_id, i.ilce_ad, h.fiyat_araligi
      ORDER BY toplam_randevu DESC
    `);

    // fiyat_araligi'ndan ortalama gelir hesapla (örn: "800-1500 TL" -> 1150)
    const result = data.map(item => {
      let ortalamaGelir = 0;
      if (item.fiyat_araligi) {
        const match = item.fiyat_araligi.match(/(\d+)\s*-\s*(\d+)/);
        if (match) {
          ortalamaGelir = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
        }
      }
      const toplamRandevu = Number(item.toplam_randevu) || 0;
      const toplamGelir = ortalamaGelir * toplamRandevu;
      
      return {
        hizmet_ad: item.hizmet_ad || "Bilinmeyen Hizmet",
        ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
        toplam_randevu: toplamRandevu,
        ortalama_gelir: ortalamaGelir,
        toplam_gelir: toplamGelir
      };
    });

    // Toplam gelire göre sırala
    result.sort((a, b) => b.toplam_gelir - a.toplam_gelir);

    res.json(result);
  } catch (err) {
    console.error("Error in getIlceHizmetPerformans:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * En Karlı Hizmetler (Top 5)
 * GET /api/dss/en-karli-hizmetler
 * Returns: hizmet_ad, toplam_gelir, toplam_randevu
 */
export const getEnKarliHizmetler = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        h.hizmet_ad,
        h.fiyat_araligi,
        COUNT(r.randevu_id) AS toplam_randevu
      FROM randevu r
      JOIN hizmet h ON r.hizmet_id = h.hizmet_id
      GROUP BY h.hizmet_id, h.hizmet_ad, h.fiyat_araligi
      ORDER BY toplam_randevu DESC
    `);

    // Normalize edilmiş hizmet isimleriyle grupla
    const hizmetMap = {};
    
    data.forEach(item => {
      const normalizedName = normalizeHizmetAdi(item.hizmet_ad);
      let ortalamaGelir = 0;
      if (item.fiyat_araligi) {
        const match = item.fiyat_araligi.match(/(\d+)\s*-\s*(\d+)/);
        if (match) {
          ortalamaGelir = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
        }
      }
      const toplamRandevu = Number(item.toplam_randevu) || 0;
      const toplamGelir = ortalamaGelir * toplamRandevu;
      
      if (!hizmetMap[normalizedName]) {
        hizmetMap[normalizedName] = {
          hizmet_ad: normalizedName,
          toplam_randevu: 0,
          toplam_gelir: 0
        };
      }
      hizmetMap[normalizedName].toplam_randevu += toplamRandevu;
      hizmetMap[normalizedName].toplam_gelir += toplamGelir;
    });

    // Array'e çevir ve sırala
    const result = Object.values(hizmetMap)
      .sort((a, b) => b.toplam_gelir - a.toplam_gelir);

    // İlk 5 + "Diğer" kategorisi oluştur
    const top5 = result.slice(0, 5);
    const digerToplam = result.slice(5).reduce((sum, item) => sum + item.toplam_gelir, 0);
    
    if (digerToplam > 0) {
      top5.push({
        hizmet_ad: 'Diğer',
        toplam_randevu: result.slice(5).reduce((sum, item) => sum + item.toplam_randevu, 0),
        toplam_gelir: digerToplam
      });
    }

    res.json(top5);
  } catch (err) {
    console.error("Error in getEnKarliHizmetler:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Konak vs Diğer İlçeler Karşılaştırması
 * GET /api/dss/konak-karsilastirma
 * Returns: hizmet_ad, konak_gelir, diger_ilceler_ortalama
 */
export const getKonakKarsilastirma = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        h.hizmet_ad,
        h.fiyat_araligi,
        i.ilce_ad,
        COUNT(r.randevu_id) AS toplam_randevu
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      JOIN ilce i ON m.ilce_id = i.ilce_id
      JOIN hizmet h ON r.hizmet_id = h.hizmet_id
      WHERE m.is_test = 0
      GROUP BY h.hizmet_id, h.hizmet_ad, h.fiyat_araligi, i.ilce_id, i.ilce_ad
      ORDER BY h.hizmet_ad, toplam_randevu DESC
    `);

    // Normalize edilmiş hizmet isimleriyle grupla
    const hizmetMap = {};
    
    data.forEach(item => {
      const normalizedName = normalizeHizmetAdi(item.hizmet_ad);
      let ortalamaGelir = 0;
      if (item.fiyat_araligi) {
        const match = item.fiyat_araligi.match(/(\d+)\s*-\s*(\d+)/);
        if (match) {
          ortalamaGelir = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
        }
      }
      const toplamRandevu = Number(item.toplam_randevu) || 0;
      const toplamGelir = ortalamaGelir * toplamRandevu;

      if (!hizmetMap[normalizedName]) {
        hizmetMap[normalizedName] = {
          hizmet_ad: normalizedName,
          konak_gelir: 0,
          konak_randevu: 0,
          diger_ilceler_toplam: 0,
          diger_ilceler_sayisi: 0
        };
      }

      if (item.ilce_ad === 'Konak') {
        hizmetMap[normalizedName].konak_gelir += toplamGelir;
        hizmetMap[normalizedName].konak_randevu += toplamRandevu;
      } else {
        hizmetMap[normalizedName].diger_ilceler_toplam += toplamGelir;
        hizmetMap[normalizedName].diger_ilceler_sayisi += 1;
      }
    });

    // Sonuç formatla
    const result = Object.values(hizmetMap)
      .map(item => ({
        hizmet_ad: item.hizmet_ad,
        konak_gelir: item.konak_gelir,
        konak_randevu: item.konak_randevu,
        diger_ilceler_ortalama: item.diger_ilceler_sayisi > 0 
          ? Math.round(item.diger_ilceler_toplam / item.diger_ilceler_sayisi) 
          : 0
      }))
      .filter(item => item.konak_gelir > 0 || item.diger_ilceler_ortalama > 0)
      .sort((a, b) => (b.konak_gelir + b.diger_ilceler_ortalama) - (a.konak_gelir + a.diger_ilceler_ortalama))
      .slice(0, 8);

    res.json(result);
  } catch (err) {
    console.error("Error in getKonakKarsilastirma:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Kampanyalı vs Kampanyasız Randevu (İlçe Bazlı)
 * GET /api/dss/kampanya-karsilastirma
 * Returns: ilce_ad, kampanyali_randevu, kampanyasiz_randevu
 */
export const getKampanyaKarsilastirma = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        i.ilce_ad,
        SUM(CASE WHEN r.kampanya_id IS NOT NULL THEN 1 ELSE 0 END) AS kampanyali_randevu,
        SUM(CASE WHEN r.kampanya_id IS NULL THEN 1 ELSE 0 END) AS kampanyasiz_randevu
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      JOIN ilce i ON m.ilce_id = i.ilce_id
      WHERE m.is_test = 0
      GROUP BY i.ilce_id, i.ilce_ad
      ORDER BY (kampanyali_randevu + kampanyasiz_randevu) DESC
    `);

    const result = data.map(item => ({
      ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
      kampanyali_randevu: Number(item.kampanyali_randevu) || 0,
      kampanyasiz_randevu: Number(item.kampanyasiz_randevu) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error("Error in getKampanyaKarsilastirma:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Aylık Gelir Trendi (Kampanya Etkisi)
 * GET /api/dss/aylik-gelir-trendi
 * Returns: ay, kampanyali_gelir, kampanyasiz_gelir
 */
export const getAylikGelirTrendi = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        DATE_FORMAT(r.tarih, '%Y-%m') AS ay,
        SUM(CASE WHEN r.kampanya_id IS NOT NULL THEN h.fiyat_araligi_ort ELSE 0 END) AS kampanyali_gelir,
        SUM(CASE WHEN r.kampanya_id IS NULL THEN h.fiyat_araligi_ort ELSE 0 END) AS kampanyasiz_gelir
      FROM randevu r
      JOIN (
        SELECT 
          hizmet_id,
          hizmet_ad,
          CAST(
            (CAST(SUBSTRING_INDEX(REPLACE(fiyat_araligi, ' TL', ''), '-', 1) AS UNSIGNED) +
             CAST(SUBSTRING_INDEX(REPLACE(fiyat_araligi, ' TL', ''), '-', -1) AS UNSIGNED)) / 2 
          AS UNSIGNED) AS fiyat_araligi_ort
        FROM hizmet
      ) h ON r.hizmet_id = h.hizmet_id
      WHERE r.tarih IS NOT NULL
      GROUP BY ay
      ORDER BY ay DESC
      LIMIT 12
    `);

    const result = data.map(item => ({
      ay: item.ay || "",
      kampanyali_gelir: Number(item.kampanyali_gelir) || 0,
      kampanyasiz_gelir: Number(item.kampanyasiz_gelir) || 0
    }));

    res.json(result.reverse());
  } catch (err) {
    console.error("Error in getAylikGelirTrendi:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * İlçe Bazlı Rakip Sayısı
 * GET /api/dss/ilce-rakip
 * Returns: ilce_ad, rakip_sayisi
 */
export const getIlceRakip = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        i.ilce_ad,
        COUNT(ri.rakip_id) AS bilinen_rakip,
        COUNT(ri.rakip_id) AS rakip_sayisi,
        ROUND(
          CASE
            WHEN i.ilce_ad = 'Karşıyaka' THEN COUNT(ri.rakip_id) * 8
            WHEN i.ilce_ad = 'Buca' THEN COUNT(ri.rakip_id) * 5
            WHEN i.ilce_ad = 'Konak' THEN COUNT(ri.rakip_id) * 6
            ELSE COUNT(ri.rakip_id) * 4
          END
        ) AS normalize_rakip
      FROM ilce i
      LEFT JOIN rakip_isletme ri ON ri.ilce_id = i.ilce_id
      GROUP BY i.ilce_id, i.ilce_ad
      ORDER BY rakip_sayisi DESC
    `);

    const result = data.map(item => ({
      ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
      bilinen_rakip: Number(item.bilinen_rakip) || 0,
      rakip_sayisi: Number(item.rakip_sayisi) || 0,
      normalize_rakip: Number(item.normalize_rakip) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error("Error in getIlceRakip:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * İlçe Bazlı Normalize Edilmiş Rakip Sayısı
 * GET /api/dss/ilce-rakip-normalize
 * Returns: ilce_id, ilce_ad, bilinen_rakip, normalize_rakip
 * Applies normalization multipliers: Karşıyaka (8x), Buca (5x), Konak (6x), others (4x)
 */
export const getIlceRakipNormalize = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        i.ilce_id,
        i.ilce_ad,
        COUNT(r.rakip_id) AS bilinen_rakip,
        CASE
          WHEN i.ilce_ad = 'Karşıyaka' THEN COUNT(r.rakip_id) * 8
          WHEN i.ilce_ad = 'Buca' THEN COUNT(r.rakip_id) * 5
          WHEN i.ilce_ad = 'Konak' THEN COUNT(r.rakip_id) * 6
          ELSE COUNT(r.rakip_id) * 4
        END AS normalize_rakip
      FROM ilce i
      LEFT JOIN rakip_isletme r ON r.ilce_id = i.ilce_id
      GROUP BY i.ilce_id, i.ilce_ad
      ORDER BY normalize_rakip DESC
    `);

    const result = data.map(item => ({
      ilce_id: Number(item.ilce_id) || 0,
      ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
      bilinen_rakip: Number(item.bilinen_rakip) || 0,
      normalize_rakip: Number(item.normalize_rakip) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error("Error in getIlceRakipNormalize:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Kampanyalar Arası Performans Karşılaştırması
 * GET /api/dss/kampanyalar-arasi-performans
 * Returns: kampanya_ad, toplam_gelir, randevu_sayisi, performans_metriği
 */
export const getKampanyalarArasiPerformans = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        k.kampanya_ad,
        COUNT(r.randevu_id) AS randevu_sayisi,
        SUM(COALESCE(r.ucret, 0)) AS toplam_gelir
      FROM kampanya k
      LEFT JOIN randevu r ON r.kampanya_id = k.kampanya_id
      GROUP BY k.kampanya_id, k.kampanya_ad
      HAVING randevu_sayisi > 0
      ORDER BY toplam_gelir DESC
    `);

    const result = data.map(item => {
      const toplamGelir = Number(item.toplam_gelir) || 0;
      const randevuSayisi = Number(item.randevu_sayisi) || 0;
      const performansMetriği = randevuSayisi > 0 ? toplamGelir / randevuSayisi : 0;

      return {
        kampanya_ad: item.kampanya_ad || "Bilinmeyen Kampanya",
        toplam_gelir: toplamGelir,
        randevu_sayisi: randevuSayisi,
        performans_metriği: Math.round(performansMetriği * 100) / 100
      };
    });

    res.json(result);
  } catch (err) {
    console.error("Error in getKampanyalarArasiPerformans:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * İlçe Bazlı Kampanyaların Sağladığı Kâr
 * GET /api/dss/ilce-bazli-kampanya-kar
 * Returns: ilce_ad, kampanya_ad, toplam_gelir, randevu_sayisi
 */
export const getIlceBazliKampanyaKar = async (req, res) => {
  try {
    const [data] = await pool.execute(`
      SELECT 
        i.ilce_ad,
        k.kampanya_ad,
        COUNT(r.randevu_id) AS randevu_sayisi,
        SUM(COALESCE(r.ucret, 0)) AS toplam_gelir
      FROM ilce i
      JOIN musteri m ON m.ilce_id = i.ilce_id
      JOIN randevu r ON r.musteri_id = m.musteri_id
      JOIN kampanya k ON r.kampanya_id = k.kampanya_id
      WHERE r.kampanya_id IS NOT NULL AND m.is_test = 0
      GROUP BY i.ilce_id, i.ilce_ad, k.kampanya_id, k.kampanya_ad
      ORDER BY i.ilce_ad, toplam_gelir DESC
    `);

    const result = data.map(item => ({
      ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
      kampanya_ad: item.kampanya_ad || "Bilinmeyen Kampanya",
      toplam_gelir: Number(item.toplam_gelir) || 0,
      randevu_sayisi: Number(item.randevu_sayisi) || 0
    }));

    res.json(result);
  } catch (err) {
    console.error("Error in getIlceBazliKampanyaKar:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Talep / Rakip Oranı (Yatırım Fırsatı)
 * GET /api/dss/talep-rakip-orani
 * Returns: ilce_ad, randevu_sayisi, rakip_sayisi, talep_rakip_orani
 */
export const getTalepRakipOrani = async (req, res) => {
  try {
    // ═══════════════════════════════════════════════════════════════
    // HARİTA İÇİN: Tüm ilçeler döner (0 randevulu dahil)
    // analiz_kapsami da eklendi
    // ═══════════════════════════════════════════════════════════════
    const [data] = await pool.execute(`
      SELECT 
        i.ilce_id,
        i.ilce_ad,
        i.analiz_kapsami,
        COUNT(DISTINCT r.randevu_id) AS randevu_sayisi,
        COUNT(DISTINCT ri.rakip_id) AS rakip_sayisi
      FROM ilce i
      LEFT JOIN musteri m ON m.ilce_id = i.ilce_id AND m.is_test = 0
      LEFT JOIN randevu r ON r.musteri_id = m.musteri_id
      LEFT JOIN rakip_isletme ri ON ri.ilce_id = i.ilce_id
      GROUP BY i.ilce_id, i.ilce_ad, i.analiz_kapsami
      ORDER BY randevu_sayisi DESC
    `);

    const result = data.map(item => {
      const randevuSayisi = Number(item.randevu_sayisi) || 0;
      const rakipSayisi = Number(item.rakip_sayisi) || 1; // 0 bölme hatası için 1
      const oran = Math.round((randevuSayisi / rakipSayisi) * 10) / 10;
      
      return {
        ilce_id: item.ilce_id,
        ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
        analiz_kapsami: Number(item.analiz_kapsami) ?? 0,
        randevu_sayisi: randevuSayisi,
        rakip_sayisi: Number(item.rakip_sayisi) || 0,
        talep_rakip_orani: oran
      };
    });

    // Orana göre sırala (yüksekten düşüğe - yüksek oran = düşük risk)
    result.sort((a, b) => b.talep_rakip_orani - a.talep_rakip_orani);

    res.json(result);
  } catch (err) {
    console.error("Error in getTalepRakipOrani:", err);
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
    const [revenueData] = await pool.execute(`
      SELECT 
        DATE_FORMAT(tarih, '%Y-%m') AS ay,
        COALESCE(SUM(fiyat), 0) AS toplam_gelir
      FROM randevu
      WHERE tarih IS NOT NULL
      GROUP BY ay
    `);

    // Get expenses by month
    const [expenseData] = await pool.execute(`
      SELECT 
        ay,
        COALESCE(SUM(kira + maas + elektrik + su + diger), 0) AS toplam_masraf
      FROM masraf
      GROUP BY ay
    `);

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

/**
 * İlçe Uygunluk Skoru (Analizler için)
 * GET /api/analizler/ilce-uygunluk-skoru
 * Returns: Konak hariç ilçeler için uygunluk skoru
 */
export const getIlceUygunlukSkoruAnalizler = async (req, res) => {
  try {
    // İlçe bazında randevu, rakip sayıları ve nüfus yoğunluğunu al (Konak hariç)
    const [data] = await pool.execute(`
      SELECT 
        i.ilce_ad,
        i.analiz_kapsami,
        COUNT(DISTINCT r.randevu_id) AS randevu_sayisi,
        COUNT(DISTINCT ri.rakip_id) AS rakip_sayisi,
        CASE
          WHEN id.nufus_yogunlugu IS NOT NULL THEN id.nufus_yogunlugu
          WHEN id.nufus IS NOT NULL AND id.yuzolcumu_km2 IS NOT NULL AND id.yuzolcumu_km2 > 0 
            THEN ROUND(id.nufus / id.yuzolcumu_km2)
          WHEN i.ilce_ad = 'Bornova' THEN 1850
          WHEN i.ilce_ad = 'Karşıyaka' THEN 4120
          WHEN i.ilce_ad = 'Buca' THEN 1150
          WHEN i.ilce_ad = 'Çiğli' THEN 850
          WHEN i.ilce_ad = 'Bayraklı' THEN 3950
          WHEN i.ilce_ad = 'Gaziemir' THEN 1120
          WHEN i.ilce_ad = 'Balçova' THEN 3500
          ELSE NULL
        END AS nufus_yogunlugu
      FROM ilce i
      LEFT JOIN musteri m ON m.ilce_id = i.ilce_id AND m.is_test = 0
      LEFT JOIN randevu r ON r.musteri_id = m.musteri_id
      LEFT JOIN rakip_isletme ri ON ri.ilce_id = i.ilce_id
      LEFT JOIN ilce_demografi id ON id.ilce_id = i.ilce_id
      WHERE i.ilce_ad != 'Konak'
      GROUP BY i.ilce_id, i.ilce_ad, i.analiz_kapsami, id.nufus_yogunlugu, id.nufus, id.yuzolcumu_km2
    `);

    if (!data || data.length === 0) {
      return res.json([]);
    }

    // Normalize edilmiş rakip sayılarını hesapla ve talep/rakip oranını ekle
    const dataWithNormalizeRakip = data.map(item => {
      const ilceAd = item.ilce_ad || "";
      const bilinenRakip = Number(item.rakip_sayisi) || 0;
      const randevuSayisi = Number(item.randevu_sayisi) || 0;
      
      // Normalize edilmiş rakip sayısı
      const normalizeRakip = hesaplaNormalizeRakip(ilceAd, bilinenRakip);
      
      // Talep/rakip oranı
      const talepRakipOrani = normalizeRakip > 0 
        ? Math.round((randevuSayisi / normalizeRakip) * 10) / 10 
        : 0;
      
      return {
        ...item,
        normalize_rakip: normalizeRakip,
        talep_rakip_orani: talepRakipOrani,
        analiz_kapsami: Number(item.analiz_kapsami) ?? 0,
        nufus_yogunlugu: item.nufus_yogunlugu !== null ? Number(item.nufus_yogunlugu) : null
      };
    });

    // Maksimum değerleri hesapla (normalize için)
    const randevuSayilari = dataWithNormalizeRakip.map(d => Number(d.randevu_sayisi) || 0);
    const maxRandevu = Math.max(...randevuSayilari, 1);

    const talepRakipOranlari = dataWithNormalizeRakip.map(d => Number(d.talep_rakip_orani) || 0);
    const maxTalepRakipOrani = Math.max(...talepRakipOranlari, 1);

    const normalizeRakipSayilari = dataWithNormalizeRakip.map(d => Number(d.normalize_rakip) || 0);
    const maxNormalizeRakip = Math.max(...normalizeRakipSayilari, 1);

    // Nüfus yoğunluğu için normalize (sadece ana ilçeler için - analiz_kapsami = 1)
    const anaIlcelerNufusYogunluk = dataWithNormalizeRakip
      .filter(d => d.analiz_kapsami === 1 && d.nufus_yogunlugu !== null && d.nufus_yogunlugu > 0)
      .map(d => Number(d.nufus_yogunlugu));
    const maxNufusYogunlugu = anaIlcelerNufusYogunluk.length > 0 ? Math.max(...anaIlcelerNufusYogunluk, 1) : 1;

    // Skorları hesapla - Yeni formül kullanılıyor
    const result = dataWithNormalizeRakip.map(item => {
      const randevuSayisi = Number(item.randevu_sayisi) || 0;
      const normalizeRakip = Number(item.normalize_rakip) || 0;
      const talepRakipOrani = Number(item.talep_rakip_orani) || 0;
      const isAnaIlce = item.analiz_kapsami === 1;
      const nufusYogunlugu = item.nufus_yogunlugu;

      // Risk seviyesi hesapla
      const riskSeviyesi = hesaplaRiskSeviyesiHarita(normalizeRakip, talepRakipOrani);

      const ilceAd = item.ilce_ad || "Bilinmeyen İlçe";

      // Yatırım skoru hesapla (yeni formül - sadece ana ilçeler için)
      const yatirimSkoru = computeIlceUygunlukSkoru({
        talepRakipOrani,
        randevuSayisi,
        nufusYogunlugu,
        normalizeRakip,
        riskSeviyesi,
        maxValues: {
          maxTalepRakipOrani,
          maxRandevu,
          maxNufusYogunlugu,
          maxNormalizeRakip
        },
        isAnaIlce,
        ilceAd
      });

      // Mikro ilçeler için skor null, ana ilçeler için hesaplanan skor
      // ham_skor: sıralama için kullanılacak (response'a eklenmeyecek)
      // yatirim_skoru: normalize edilmiş gösterim skoru (UI için)
      return {
        ilce_ad: ilceAd,
        randevu_sayisi: randevuSayisi,
        talep_rakip_orani: talepRakipOrani,
        nufus_yogunlugu: nufusYogunlugu,
        ham_skor: yatirimSkoru !== null ? Math.max(0, Math.min(100, yatirimSkoru)) : null, // Sıralama için (geçici)
        yatirim_skoru: yatirimSkoru !== null ? Math.max(0, Math.min(100, yatirimSkoru)) : null, // Normalize edilecek
        risk_seviyesi: riskSeviyesi
      };
    });

    // Ham skorları normalize et (gösterim skoru için)
    // Sadece ana ilçeler için (null olmayan skorlar)
    const anaIlceSkorlari = result
      .filter(item => item.ham_skor !== null && item.ham_skor !== undefined)
      .map(item => item.ham_skor);
    
    if (anaIlceSkorlari.length > 0) {
      const minHamSkor = Math.min(...anaIlceSkorlari);
      const maxHamSkor = Math.max(...anaIlceSkorlari);
      
      // Lineer scaling: En düşük ≈ 60, En yüksek ≈ 95
      const targetMin = 60;
      const targetMax = 95;
      
      // Her ilçe için gösterim skorunu hesapla
      result.forEach(item => {
        if (item.ham_skor !== null && item.ham_skor !== undefined) {
          // Linear scaling: (score - min) / (max - min) * (targetMax - targetMin) + targetMin
          if (maxHamSkor > minHamSkor) {
            const normalized = ((item.ham_skor - minHamSkor) / (maxHamSkor - minHamSkor)) * (targetMax - targetMin) + targetMin;
            item.yatirim_skoru = Math.round(Math.max(targetMin, Math.min(targetMax, normalized)));
          } else {
            // Tüm skorlar aynıysa ortalamayı kullan
            item.yatirim_skoru = Math.round((targetMin + targetMax) / 2);
          }
        }
      });
    }

    // ham_skor'u response'dan çıkar (sadece sıralama için kullanıldı)
    result.forEach(item => {
      delete item.ham_skor;
    });

    // Ham skora göre sırala (yüksekten düşüğe) - Sıralama ham skora göre olmalı
    // Ana ilçeler önce (skor null olmayanlar), sonra mikro ilçeler
    // Sıralama HAM SKORA göre yapılmalı (gösterim skoruna değil)
    result.sort((a, b) => {
      // Ana ilçeler (ham_skor null değil) önce
      if (a.ham_skor !== null && b.ham_skor === null) return -1;
      if (a.ham_skor === null && b.ham_skor !== null) return 1;
      // İkisi de ana ilçe ise HAM SKORA göre sırala
      if (a.ham_skor !== null && b.ham_skor !== null) {
        return b.ham_skor - a.ham_skor;
      }
      // İkisi de mikro ilçe ise alfabetik
      return a.ilce_ad.localeCompare(b.ilce_ad, 'tr');
    });

    res.json(result);
  } catch (err) {
    console.error("Error in getIlceUygunlukSkoru:", err);
    res.status(500).json({ error: err.message });
  }
};
