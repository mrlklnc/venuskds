import express from "express";
import pool from "../lib/db.js";
import { hesaplaNormalizeRakip, hesaplaRiskSeviyesi, computeIlceSkoru } from "../utils/ilceSkorUtil.js";

const router = express.Router();

/**
 * GET /api/simulasyon/ilce-rakip-analizi
 * Returns district-based competitor density analysis
 */
router.get("/ilce-rakip-analizi", async (req, res) => {
  try {
    const sql = `
      SELECT
        i.ilce_ad,
        COUNT(r.rakip_id) AS bilinen_rakip,
        COUNT(r.rakip_id) AS rakip_sayisi,
        ROUND(
          CASE
            WHEN i.ilce_ad = 'Karşıyaka' THEN COUNT(r.rakip_id) * 8
            WHEN i.ilce_ad = 'Buca' THEN COUNT(r.rakip_id) * 5
            WHEN i.ilce_ad = 'Konak' THEN COUNT(r.rakip_id) * 6
            ELSE COUNT(r.rakip_id) * 4
          END
        ) AS normalize_rakip
      FROM ilce i
      LEFT JOIN rakip_isletme r ON r.ilce_id = i.ilce_id
      GROUP BY i.ilce_id, i.ilce_ad
    `;

    const [data] = await pool.execute(sql);

    const result = data.map(item => ({
      ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
      bilinen_rakip: Number(item.bilinen_rakip) || 0,
      rakip_sayisi: Number(item.rakip_sayisi) || 0,
      normalize_rakip: Number(item.normalize_rakip) || 0
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching ilce rakip analizi:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulasyon/ilce-ozet?ilce=ILCE_ADI
 * GET /api/simulasyon/ilce?ilce_id=XXX
 * Returns district summary for simulation: competitor count, estimated customers, estimated revenue, risk level
 */
router.get("/ilce-ozet", async (req, res) => {
  try {
    const { ilce } = req.query;

    if (!ilce) {
      return res.status(400).json({ error: "ilce parametresi gerekli" });
    }

    // 1. Rakip sayısını al
    const [rakipData] = await pool.execute(`
      SELECT COUNT(ri.rakip_id) AS rakip_sayisi
      FROM ilce i
      LEFT JOIN rakip_isletme ri ON ri.ilce_id = i.ilce_id
      WHERE i.ilce_ad = ?
      GROUP BY i.ilce_id
    `, [ilce]);

    // DB'deki rakip sayısı (bilinen rakipler)
    const dbRakipSayisi = rakipData.length > 0 ? Number(rakipData[0].rakip_sayisi) || 0 : 0;

    // 2. İlçedeki toplam randevu sayısını ve ay sayısını al
    const [randevuData] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT r.randevu_id) AS toplam_randevu,
        COUNT(DISTINCT DATE_FORMAT(r.tarih, '%Y-%m')) AS ay_sayisi
      FROM randevu r
      JOIN musteri m ON r.musteri_id = m.musteri_id
      JOIN ilce i ON m.ilce_id = i.ilce_id
      WHERE i.ilce_ad = ? AND r.tarih IS NOT NULL AND m.is_test = 0
    `, [ilce]);

    const toplamRandevu = randevuData.length > 0 ? Number(randevuData[0].toplam_randevu) || 0 : 0;
    const aySayisi = randevuData.length > 0 ? Number(randevuData[0].ay_sayisi) || 1 : 1; // En az 1 ay

    // İlçe bazlı mevcut aylık randevu (DB'den gelen veri)
    const mevcutAylikRandevu = toplamRandevu / aySayisi;

    // 3. İlçe bazlı çarpanlar ve taban talep belirle
    const merkeziIlceler = ['Konak', 'Bornova', 'Karşıyaka'];
    let ilceCarpani;
    let tabanTalep;
    
    if (merkeziIlceler.includes(ilce)) {
      ilceCarpani = 8; // Merkezi ilçeler
      tabanTalep = 600; // Merkezi ilçeler için taban talep
    } else if (mevcutAylikRandevu >= 50) {
      ilceCarpani = 5; // Orta ilçeler
      tabanTalep = 400; // Orta ilçeler için taban talep
    } else {
      ilceCarpani = 3; // Düşük yoğunluklu ilçeler
      tabanTalep = 250; // Düşük yoğunluklu ilçeler için taban talep
    }

    // 4. Gerçekçi rakip sayısını hesapla (normalize edilmiş)
    const gercekRakipSayisi = Math.round(dbRakipSayisi * ilceCarpani);

    // 5. Gerçek ilçe talebini hesapla (taban talep modeli)
    const mevcutTalepHesaplama = Math.round(mevcutAylikRandevu * ilceCarpani);
    const gercekIlceTalebi = Math.max(tabanTalep, mevcutTalepHesaplama);

    // 6. Gerçekçi rakip sayısına göre pazar payı belirle
    let pazarPayi;
    
    if (gercekRakipSayisi <= 1) {
      pazarPayi = 0.35; // %35
    } else if (gercekRakipSayisi >= 2 && gercekRakipSayisi <= 3) {
      pazarPayi = 0.25; // %25
    } else if (gercekRakipSayisi >= 4 && gercekRakipSayisi <= 5) {
      pazarPayi = 0.15; // %15
    } else {
      pazarPayi = 0.08; // %8
    }

    // 7. Tahmini müşteri hesaplama (gerçek ilçe talebi kullanılıyor)
    const tahminiMusteri = Math.round(gercekIlceTalebi * pazarPayi);

    // 8. Tahmini gelir hesaplama
    const ortalamaHizmetFiyati = 1500; // 1500 ₺
    const tahminiGelir = tahminiMusteri * ortalamaHizmetFiyati;

    // 9. Risk seviyesi (pazar payına göre)
    let riskSeviyesi;
    if (pazarPayi >= 0.30) {
      riskSeviyesi = "Düşük";
    } else if (pazarPayi >= 0.15 && pazarPayi <= 0.25) {
      riskSeviyesi = "Orta";
    } else {
      riskSeviyesi = "Yüksek";
    }

    const result = {
      rakip_sayisi: dbRakipSayisi, // DB'deki bilinen rakip sayısı (grafik için)
      gercek_rakip_sayisi: gercekRakipSayisi, // Normalize edilmiş gerçekçi rakip sayısı
      normalize_rakip: gercekRakipSayisi, // Alias: normalize edilmiş rakip sayısı (frontend için)
      tahmini_musteri: tahminiMusteri,
      tahmini_gelir: tahminiGelir,
      risk_seviyesi: riskSeviyesi
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching ilce ozet:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulasyon/ilce?ilce_id=XXX
 * Returns district summary for simulation (by ilce_id)
 * Response format: { db_rakip, normalize_rakip, tahmini_musteri, tahmini_gelir, risk }
 */
router.get("/ilce", async (req, res) => {
  try {
    const { ilce_id } = req.query;

    if (!ilce_id) {
      return res.status(400).json({ error: "ilce_id parametresi gerekli" });
    }

    // İlçe adını ve analiz_kapsami bilgisini ilce_id'den al
    const [ilceData] = await pool.execute(`
      SELECT ilce_ad, analiz_kapsami FROM ilce WHERE ilce_id = ?
    `, [ilce_id]);

    if (ilceData.length === 0) {
      return res.status(404).json({ error: "İlçe bulunamadı" });
    }

    const ilceAd = ilceData[0].ilce_ad;
    const analizKapsami = Number(ilceData[0].analiz_kapsami) ?? 1;

    // 1. Rakip sayısını al (rakip_isletme tablosundan)
    const [rakipData] = await pool.execute(`
      SELECT COUNT(ri.rakip_id) AS rakip_sayisi
      FROM ilce i
      LEFT JOIN rakip_isletme ri ON ri.ilce_id = i.ilce_id
      WHERE i.ilce_id = ?
      GROUP BY i.ilce_id
    `, [ilce_id]);

    // DB'deki rakip sayısı (bilinen rakipler)
    const db_rakip = rakipData.length > 0 ? Number(rakipData[0].rakip_sayisi) || 0 : 0;

    // 2. İlçe bazlı çarpanlar belirle (normalize için)
    const merkeziIlceler = ['Bornova', 'Karşıyaka', 'Konak'];
    let ilceCarpani;
    
    if (merkeziIlceler.includes(ilceAd)) {
      ilceCarpani = 8; // Merkezi ilçeler: ×8
    } else {
      // Orta veya düşük yoğunluklu ilçeler için randevu sayısına bak
      const [randevuData] = await pool.execute(`
        SELECT COUNT(DISTINCT r.randevu_id) AS toplam_randevu
        FROM randevu r
        JOIN musteri m ON r.musteri_id = m.musteri_id
        JOIN ilce i ON m.ilce_id = i.ilce_id
        WHERE i.ilce_id = ? AND r.tarih IS NOT NULL AND m.is_test = 0
      `, [ilce_id]);
      
      const toplamRandevu = randevuData.length > 0 ? Number(randevuData[0].toplam_randevu) || 0 : 0;
      
      if (toplamRandevu >= 50) {
        ilceCarpani = 5; // Orta ilçeler: ×5
      } else {
        ilceCarpani = 3; // Düşük yoğunluklu ilçeler: ×3
      }
    }

    // 3. Normalize edilmiş rakip sayısını hesapla
    const normalize_rakip = Math.round(db_rakip * ilceCarpani);

    // 3.5. MİKRO İLÇE İÇİN DB'DEN MUSTERI VE RANDEVU SAYILARI (analiz_kapsami = 0)
    let db_musteri_sayisi = null;
    let db_randevu_sayisi = null;
    
    if (analizKapsami === 0) {
      // Mikro ilçe için DB'den gerçek sayıları çek
      const [musteriCountData] = await pool.execute(`
        SELECT COUNT(DISTINCT m.musteri_id) AS musteri_sayisi
        FROM musteri m
        WHERE m.ilce_id = ? AND m.is_test = 0
      `, [ilce_id]);
      
      const [randevuCountData] = await pool.execute(`
        SELECT COUNT(DISTINCT r.randevu_id) AS randevu_sayisi
        FROM randevu r
        JOIN musteri m ON r.musteri_id = m.musteri_id
        WHERE m.ilce_id = ? AND r.tarih IS NOT NULL AND m.is_test = 0
      `, [ilce_id]);
      
      db_musteri_sayisi = musteriCountData.length > 0 ? Number(musteriCountData[0].musteri_sayisi) || 0 : 0;
      db_randevu_sayisi = randevuCountData.length > 0 ? Number(randevuCountData[0].randevu_sayisi) || 0 : 0;
    }

    // 4. İlçe uygunluk skorunu al (Analizler endpoint'inden aynı mantık)
    const [uygunlukData] = await pool.execute(`
      SELECT 
        i.ilce_ad,
        COUNT(DISTINCT r.randevu_id) AS randevu_sayisi,
        COUNT(DISTINCT ri.rakip_id) AS rakip_sayisi
      FROM ilce i
      LEFT JOIN musteri m ON m.ilce_id = i.ilce_id AND m.is_test = 0
      LEFT JOIN randevu r ON r.musteri_id = m.musteri_id
      LEFT JOIN rakip_isletme ri ON ri.ilce_id = i.ilce_id
      WHERE i.ilce_id = ?
      GROUP BY i.ilce_id, i.ilce_ad
    `, [ilce_id]);

    let ilce_uygunluk_skoru = 50; // Default skor (eğer hesaplanamazsa)

    if (uygunlukData.length > 0) {
      const item = uygunlukData[0];
      const randevuSayisi = Number(item.randevu_sayisi) || 0;
      const rakipSayisi = Number(item.rakip_sayisi) || 0;

      // Tüm ilçeler için max değerleri bul (normalize için)
      const [allData] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT r.randevu_id) AS randevu_sayisi
        FROM ilce i
        LEFT JOIN musteri m ON m.ilce_id = i.ilce_id
        LEFT JOIN randevu r ON r.musteri_id = m.musteri_id
        WHERE i.ilce_ad != 'Konak'
        GROUP BY i.ilce_id
      `);

      const randevuSayilari = allData.map(d => Number(d.randevu_sayisi) || 0);
      const maxRandevu = Math.max(...randevuSayilari, 1);

      // Talep skoru (0-100 normalize)
      const talepSkoru = maxRandevu > 0 
        ? Math.round((randevuSayisi / maxRandevu) * 100)
        : 0;

      // Potansiyel gelir
      const potansiyelGelir = randevuSayisi * 1400;
      const potansiyelGelirler = randevuSayilari.map(r => r * 1400);
      const maxGelir = Math.max(...potansiyelGelirler, 1);

      // Gelir skoru (0-100 normalize)
      const gelirSkoru = maxGelir > 0 
        ? Math.round((potansiyelGelir / maxGelir) * 100)
        : 0;

      // Rakip skoru (100 / (1 + rakip_sayisi))
      const rakipSkoru = Math.round(100 / (1 + rakipSayisi));

      // Uygunluk skoru (ağırlıklı ortalama)
      ilce_uygunluk_skoru = Math.round(
        (talepSkoru * 0.4) + 
        (gelirSkoru * 0.35) + 
        (rakipSkoru * 0.25)
      );
      ilce_uygunluk_skoru = Math.max(0, Math.min(100, ilce_uygunluk_skoru));
    }

    // 5. YENİ MODEL: Talep Katsayısı = ilce_uygunluk_skoru / 100
    const talep_katsayisi = ilce_uygunluk_skoru / 100;

    // 6. Rekabet Katsayısı (normalize_rakip'e göre)
    let rekabet_katsayisi;
    if (normalize_rakip <= 5) {
      rekabet_katsayisi = 1.0;
    } else if (normalize_rakip <= 10) {
      rekabet_katsayisi = 0.8;
    } else if (normalize_rakip <= 20) {
      rekabet_katsayisi = 0.6;
    } else {
      rekabet_katsayisi = 0.4;
    }

    // 7. Taban Aylık Müşteri = 80
    const taban_aylik_musteri = 80;

    // 8. Tahmini Aylık Müşteri = Taban × Talep Katsayısı × Rekabet Katsayısı
    const tahmini_musteri = Math.round(taban_aylik_musteri * talep_katsayisi * rekabet_katsayisi);

    // 9. SEGMENTLİ MODEL: Müşteri segmentlerine göre ağırlıklı ortalama randevu (Finansal Senaryolar ile aynı)
    // Segment dağılımı:
    // - Tek Seans Müşterisi: %40 → 1 randevu
    // - Düzenli Müşteri: %35 → 2 randevu
    // - Paketli Müşteri: %20 → 3 randevu
    // - Sadık Müşteri: %5 → 4 randevu
    const agirlikli_ortalama_randevu = (0.40 * 1) + (0.35 * 2) + (0.20 * 3) + (0.05 * 4); // = 1.90

    // 10. Aylık randevu hesaplama (segment bazlı)
    const aylik_randevu = Math.round(tahmini_musteri * agirlikli_ortalama_randevu);

    // 11. Tahmini gelir hesaplama (segment bazlı model)
    const ortalama_hizmet_fiyati = 1500; // 1500 ₺
    const tahmini_gelir = aylik_randevu * ortalama_hizmet_fiyati;

    // 10. GİDERLERİ HESAPLA
    const personel_sayisi = 3;
    const personel_maasi = 25000;
    const kira = 35000;
    const diger_giderler = 20000;

    const toplam_gider = (personel_sayisi * personel_maasi) + kira + diger_giderler;

    // 11. NET KÂR HESAPLA
    const net_kar = tahmini_gelir - toplam_gider;

    // 12. RİSK SEVİYESİ HESAPLAMA (YENİ MODEL)
    let risk_seviyesi;
    
    // Net kâr negatif ise risk otomatik YÜKSEK
    if (net_kar < 0) {
      risk_seviyesi = "Yüksek";
    } else {
      // risk_puani = (100 - ilce_uygunluk_skoru) + (normalize_edilmis_rakip_sayisi * 5) - (net_kar / 10000)
      const risk_puani = (100 - ilce_uygunluk_skoru) + (normalize_rakip * 5) - (net_kar / 10000);

      // Risk sınıflandırması
      if (risk_puani <= 30) {
        risk_seviyesi = "Düşük";
      } else if (risk_puani <= 60) {
        risk_seviyesi = "Orta";
      } else {
        risk_seviyesi = "Yüksek";
      }
    }

    // 13. Response formatı (risk_seviyesi ile tutarlı)
    const result = {
      db_rakip,
      normalize_rakip,
      ilce_uygunluk_skoru,
      tahmini_musteri,
      aylik_randevu, // Segment bazlı hesaplanan aylık randevu sayısı
      agirlikli_ortalama_randevu, // Müşteri segmentlerine göre ağırlıklı ortalama (1.90)
      tahmini_gelir,
      toplam_gider,
      net_kar,
      risk_seviyesi,
      // Mikro ilçe için DB'den gelen gerçek değerler (analiz_kapsami = 0)
      analiz_kapsami: analizKapsami,
      musteri_sayisi: db_musteri_sayisi, // Mikro ilçe için DB'den gelen musteri sayısı
      randevu_sayisi: db_randevu_sayisi  // Mikro ilçe için DB'den gelen randevu sayısı
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching ilce by id:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulasyon/skor-ozet
 * Sadece ana ilçeler (analiz_kapsami = 1) için simülasyon verilerinden skor hesaplama
 * Simülasyon sayfasındaki mantıkla birebir aynı hesaplamaları yapar
 */
router.get("/skor-ozet", async (req, res) => {
  try {
    // Sadece ana ilçeleri al (analiz_kapsami = 1)
    const [ilceList] = await pool.execute(`
      SELECT ilce_id, ilce_ad, analiz_kapsami FROM ilce WHERE analiz_kapsami = 1
    `);

    if (!ilceList || ilceList.length === 0) {
      return res.json([]);
    }

    const ortalamaFiyat = 4500; // Simülasyon sayfasındaki ile aynı

    // Tüm ilçeler için randevu, müşteri, rakip verilerini al
    const ilceDataMap = new Map();

    for (const ilce of ilceList) {
      const ilceId = ilce.ilce_id;
      const ilceAd = ilce.ilce_ad;
      const analizKapsami = Number(ilce.analiz_kapsami) ?? 1;

      // Randevu sayısı
      const [randevuData] = await pool.execute(`
        SELECT COUNT(DISTINCT r.randevu_id) AS randevu_sayisi
        FROM randevu r
        JOIN musteri m ON r.musteri_id = m.musteri_id
        WHERE m.ilce_id = ? AND r.tarih IS NOT NULL AND m.is_test = 0
      `, [ilceId]);
      const toplamRandevu = randevuData.length > 0 ? Number(randevuData[0].randevu_sayisi) || 0 : 0;

      // Müşteri sayısı
      const [musteriData] = await pool.execute(`
        SELECT COUNT(DISTINCT m.musteri_id) AS musteri_sayisi
        FROM musteri m
        WHERE m.ilce_id = ? AND m.is_test = 0
      `, [ilceId]);
      const musteriSayisi = musteriData.length > 0 ? Number(musteriData[0].musteri_sayisi) || 0 : 0;

      // Rakip sayısı (bilinen)
      const [rakipData] = await pool.execute(`
        SELECT COUNT(ri.rakip_id) AS rakip_sayisi
        FROM ilce i
        LEFT JOIN rakip_isletme ri ON ri.ilce_id = i.ilce_id
        WHERE i.ilce_id = ?
        GROUP BY i.ilce_id
      `, [ilceId]);
      const bilinenRakip = rakipData.length > 0 ? Number(rakipData[0].rakip_sayisi) || 0 : 0;

      // Normalize rakip hesapla (util fonksiyonu ile)
      const rakipNormalize = hesaplaNormalizeRakip(ilceAd, bilinenRakip);

      // Sadece ana ilçeler için hesaplama (analiz_kapsami = 1 olduğu garanti)
      // Ana ilçe: tahmini müşteri hesaplaması (simülasyon mantığı ile aynı)
      const ACILIS_ETKISI = 0.15;
      const KAMPANYA_ETKISI = 0.10;
      const YAKINLIK_ETKISI = 0.05;
      const TOPLAM_CARPAN = 1 + ACILIS_ETKISI + KAMPANYA_ETKISI + YAKINLIK_ETKISI;
      const tahminiMusteri = Math.round(musteriSayisi * TOPLAM_CARPAN); // Aylık müşteri tahmini
      const aylikGelir = tahminiMusteri * ortalamaFiyat;
      
      // Ana ilçe: normalize rakibe göre risk seviyesi
      const riskSeviyesi = hesaplaRiskSeviyesi(rakipNormalize);

      ilceDataMap.set(ilceId, {
        ilce_id: ilceId,
        ilce_ad: ilceAd,
        analiz_kapsami: analizKapsami,
        randevu_sayisi: toplamRandevu,
        rakip_normalize: rakipNormalize,
        talep_rakip_orani: rakipNormalize > 0 ? toplamRandevu / rakipNormalize : 0,
        risk: riskSeviyesi,
        tahmini_aylik_gelir: aylikGelir,
        tahmini_aylik_musteri: tahminiMusteri, // Yeni: Aylık müşteri tahmini
        aylikGelir,
        aylikMusteri: tahminiMusteri, // Skor hesaplaması için
        rakipNormalize,
        riskSeviyesi
      });
    }

    // Maksimum değerleri hesapla (normalize için)
    const maxAylikMusteri = Math.max(...Array.from(ilceDataMap.values()).map(d => d.aylikMusteri || 0), 1);
    const maxGelir = Math.max(...Array.from(ilceDataMap.values()).map(d => d.aylikGelir), 1);
    const maxRakip = Math.max(...Array.from(ilceDataMap.values()).map(d => d.rakipNormalize), 1);

    // Her ilçe için skor hesapla
    const result = Array.from(ilceDataMap.values()).map(ilceData => {
      const yatirimSkoru = computeIlceSkoru(
        {
          aylikMusteri: ilceData.aylikMusteri || 0, // Aylık müşteri tahmini (en yüksek ağırlık)
          aylikGelir: ilceData.aylikGelir,
          rakipNormalize: ilceData.rakipNormalize,
          riskSeviyesi: ilceData.riskSeviyesi
        },
        { maxAylikMusteri, maxGelir, maxRakip }
      );

      return {
        ilce_id: ilceData.ilce_id,
        ilce_ad: ilceData.ilce_ad,
        analiz_kapsami: ilceData.analiz_kapsami,
        randevu_sayisi: ilceData.randevu_sayisi,
        rakip_normalize: ilceData.rakip_normalize,
        talep_rakip_orani: Number(ilceData.talep_rakip_orani.toFixed(2)),
        risk: ilceData.risk,
        tahmini_aylik_gelir: ilceData.tahmini_aylik_gelir,
        tahmini_aylik_musteri: ilceData.tahmini_aylik_musteri, // Aylık müşteri tahmini
        uygunluk_skoru: yatirimSkoru
      };
    });

    // Skora göre sırala (yüksekten düşüğe)
    result.sort((a, b) => b.uygunluk_skoru - a.uygunluk_skoru);

    // Debug çıktısı (dev ortamında)
    if (process.env.NODE_ENV !== 'production') {
      const debugIlceler = ['Çiğli', 'Bornova', 'Karşıyaka'];
      console.log('\n=== İLÇE SKOR ÖZET DEBUG ===');
      result
        .filter(ilce => debugIlceler.includes(ilce.ilce_ad))
        .forEach(ilce => {
          console.log(`${ilce.ilce_ad}:`, {
            randevu: ilce.randevu_sayisi,
            rakip_normalize: ilce.rakip_normalize,
            talep_rakip_orani: ilce.talep_rakip_orani,
            risk: ilce.risk,
            gelir: ilce.tahmini_aylik_gelir,
            skor: ilce.uygunluk_skoru
          });
        });
      console.log('==========================\n');
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching skor-ozet:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulasyon/nufus-yogunlugu
 * Returns population density (nüfus yoğunluğu) for main districts only (analiz_kapsami = 1)
 * Response: [{ ilce_id, ilce_ad, nufus_yogunlugu }, ...] - Top 8 districts by population density
 */
router.get("/nufus-yogunlugu", async (req, res) => {
  try {
    // İlçe demografi tablosundan nüfus yoğunluğunu al
    // Sadece ana ilçeler (analiz_kapsami = 1) ve ilk 8 ilçe
    const sql = `
      SELECT 
        i.ilce_id,
        i.ilce_ad,
        CASE
          WHEN id.nufus_yogunlugu IS NOT NULL THEN id.nufus_yogunlugu
          WHEN id.nufus IS NOT NULL AND id.yuzolcumu_km2 IS NOT NULL AND id.yuzolcumu_km2 > 0 
            THEN ROUND(id.nufus / id.yuzolcumu_km2)
          WHEN i.nufus IS NOT NULL THEN 
            CASE
              WHEN i.ilce_ad = 'Konak' THEN 30181
              WHEN i.ilce_ad = 'Bornova' THEN 1850
              WHEN i.ilce_ad = 'Karşıyaka' THEN 4120
              WHEN i.ilce_ad = 'Buca' THEN 1150
              WHEN i.ilce_ad = 'Çiğli' THEN 850
              WHEN i.ilce_ad = 'Bayraklı' THEN 3950
              WHEN i.ilce_ad = 'Menemen' THEN 180
              WHEN i.ilce_ad = 'Gaziemir' THEN 1120
              ELSE 500
            END
          ELSE 0
        END AS nufus_yogunlugu
      FROM ilce i
      LEFT JOIN ilce_demografi id ON id.ilce_id = i.ilce_id
      WHERE i.analiz_kapsami = 1
      ORDER BY nufus_yogunlugu DESC
      LIMIT 8
    `;

    const [data] = await pool.execute(sql);

    const result = data.map(item => ({
      ilce_id: Number(item.ilce_id) || 0,
      ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
      nufus_yogunlugu: Number(item.nufus_yogunlugu) || 0
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching nufus yogunlugu:", error);
    // Eğer ilce_demografi tablosu yoksa, ilce tablosundan direkt veri çek
    try {
      const fallbackSql = `
        SELECT 
          i.ilce_id,
          i.ilce_ad,
          CASE
            WHEN i.ilce_ad = 'Konak' THEN 30181
            WHEN i.ilce_ad = 'Bornova' THEN 1850
            WHEN i.ilce_ad = 'Karşıyaka' THEN 4120
            WHEN i.ilce_ad = 'Buca' THEN 1150
            WHEN i.ilce_ad = 'Çiğli' THEN 850
            WHEN i.ilce_ad = 'Bayraklı' THEN 3950
            WHEN i.ilce_ad = 'Menemen' THEN 180
            WHEN i.ilce_ad = 'Gaziemir' THEN 1120
            ELSE 500
          END AS nufus_yogunlugu
        FROM ilce i
        WHERE i.analiz_kapsami = 1
        ORDER BY nufus_yogunlugu DESC
        LIMIT 8
      `;
      const [fallbackData] = await pool.execute(fallbackSql);
      const result = fallbackData.map(item => ({
        ilce_id: Number(item.ilce_id) || 0,
        ilce_ad: item.ilce_ad || "Bilinmeyen İlçe",
        nufus_yogunlugu: Number(item.nufus_yogunlugu) || 0
      }));
      res.json(result);
    } catch (fallbackError) {
      console.error("Error in fallback nufus yogunlugu:", fallbackError);
      res.status(500).json({ error: fallbackError.message });
    }
  }
});

export default router;

