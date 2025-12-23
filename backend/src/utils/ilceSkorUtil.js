/**
 * İlçe Skor Hesaplama Util Fonksiyonları
 * Simülasyon sayfasındaki mantıkla birebir aynı hesaplamaları yapar
 */

/**
 * Normalize edilmiş rakip sayısını hesapla
 * Simülasyon sayfasındaki mantıkla aynı
 * @param {string} ilceAd - İlçe adı
 * @param {number} bilinenRakip - DB'deki bilinen rakip sayısı
 * @returns {number} Normalize edilmiş rakip sayısı
 */
export const hesaplaNormalizeRakip = (ilceAd, bilinenRakip) => {
  const ilceAdNorm = (ilceAd || "").trim();
  let carpan;
  
  if (ilceAdNorm === 'Karşıyaka') {
    carpan = 8;
  } else if (ilceAdNorm === 'Buca') {
    carpan = 5;
  } else if (ilceAdNorm === 'Konak') {
    carpan = 6;
  } else {
    carpan = 4;
  }
  
  return Math.round(bilinenRakip * carpan);
};

/**
 * Risk seviyesini normalize rakibe göre hesapla
 * @param {number} normalizeRakip - Normalize edilmiş rakip sayısı
 * @returns {string} Risk seviyesi (Düşük/Orta/Orta-Yüksek/Yüksek)
 */
export const hesaplaRiskSeviyesi = (normalizeRakip) => {
  const n = Number(normalizeRakip || 0);
  if (n <= 2) return 'Düşük';
  if (n <= 10) return 'Orta';
  if (n <= 15) return 'Orta-Yüksek';
  return 'Yüksek';
};

/**
 * Risk seviyesini normalize rakip ve talep/rakip oranına göre hesapla
 * Harita sayfası ve analizler için kullanılır
 * @param {number} normalizeRakip - Normalize edilmiş rakip sayısı
 * @param {number} talepRakipOrani - Talep/rakip oranı
 * @returns {string} Risk seviyesi (Düşük/Orta/Yüksek)
 */
export const hesaplaRiskSeviyesiHarita = (normalizeRakip, talepRakipOrani) => {
  const n = Number(normalizeRakip || 0);
  const oran = Number(talepRakipOrani || 0);
  
  // Yüksek rakip ve düşük talep/rakip oranı = Yüksek risk
  if (n >= 15 || oran < 5) {
    return 'Yüksek';
  }
  if (n >= 8 || oran < 15) {
    return 'Orta';
  }
  return 'Düşük';
};

/**
 * Risk katsayısını risk seviyesine göre döndürür
 * @param {string} riskSeviyesi - Risk seviyesi (Düşük/Orta/Yüksek)
 * @returns {number} Risk katsayısı
 */
export const getRiskKatsayisi = (riskSeviyesi) => {
  switch (riskSeviyesi) {
    case 'Düşük':
      return 1.00;
    case 'Orta':
    case 'Orta-Yüksek':
      return 0.85;
    case 'Yüksek':
      return 0.65;
    default:
      return 0.85; // Belirsiz durumlar için orta değer
  }
};

/**
 * İlçe Uygunluk Skoru (Yatırım Skoru) hesaplama fonksiyonu
 * Şube Açma Simülasyonu ve CBS Analizi sayfaları için TEK ORTAK fonksiyon
 * 
 * YATIRIM MANTIĞI:
 * - Pazar büyüklüğü (randevu sayısı) EN ÖNCELİKLİ
 * - Randevu < 250 olan ilçeler 1. olamaz (küçük pazar sınırlaması)
 * - Risk sadece CEZA olarak çalışır (ödül yok, düşük risk = ceza yok)
 * 
 * @param {object} params - Hesaplama parametreleri
 * @param {number} params.talepRakipOrani - Talep/rakip oranı
 * @param {number} params.randevuSayisi - Randevu sayısı (mutlak talep/pazar büyüklüğü)
 * @param {number|null} params.nufusYogunlugu - Nüfus yoğunluğu (ana ilçeler için, null olabilir)
 * @param {number} params.normalizeRakip - Normalize edilmiş rakip sayısı
 * @param {string} params.riskSeviyesi - Risk seviyesi (Düşük/Orta/Yüksek)
 * @param {object} params.maxValues - Maksimum değerler (normalize için)
 * @param {number} params.maxValues.maxTalepRakipOrani - Maksimum talep/rakip oranı
 * @param {number} params.maxValues.maxRandevu - Maksimum randevu sayısı
 * @param {number} params.maxValues.maxNufusYogunlugu - Maksimum nüfus yoğunluğu
 * @param {number} params.maxValues.maxNormalizeRakip - Maksimum normalize rakip sayısı
 * @param {boolean} params.isAnaIlce - Ana ilçe mi (nüfus yoğunluğu kullanılacak mı)
 * @param {string} params.ilceAd - İlçe adı (debug log için)
 * @returns {number} 0-100 arası yatırım skoru
 */
export const computeIlceUygunlukSkoru = (params) => {
  const {
    talepRakipOrani,
    randevuSayisi,
    nufusYogunlugu,
    normalizeRakip,
    riskSeviyesi,
    maxValues,
    isAnaIlce = false,
    ilceAd = ''
  } = params;

  const {
    maxTalepRakipOrani = 1,
    maxRandevu = 1,
    maxNufusYogunlugu = 1,
    maxNormalizeRakip = 1
  } = maxValues;

  // Mikro ilçeler için skor hesaplama (sadece ana ilçeler için hesapla)
  if (!isAnaIlce) {
    return null;
  }

  // 1. Normalize et (0-1 arası)
  const talepRakipOraniNorm = maxTalepRakipOrani > 0 
    ? Math.min(talepRakipOrani / maxTalepRakipOrani, 1) 
    : 0;
  
  const randevuNorm = maxRandevu > 0 
    ? Math.min(randevuSayisi / maxRandevu, 1) 
    : 0;
  
  // Nüfus yoğunluğu: sadece ana ilçeler için (destekleyici)
  let nufusYogunluguNorm = 0;
  if (isAnaIlce && nufusYogunlugu !== null && nufusYogunlugu !== undefined && nufusYogunlugu > 0) {
    nufusYogunluguNorm = maxNufusYogunlugu > 0 
      ? Math.min(nufusYogunlugu / maxNufusYogunlugu, 1) 
      : 0;
  }
  
  // Rakip: daha az rakip = daha yüksek skor (1 - normalize_rakip_ratio) - destekleyici
  const rakipNorm = maxNormalizeRakip > 0 
    ? Math.max(0, Math.min(1 - (normalizeRakip / maxNormalizeRakip), 1)) 
    : 1;

  // 2. Ham skor hesapla - Ağırlık sırası: Randevu (EN YÜKSEK) > Talep/Rakip (Yüksek) > Nüfus/Rakip (Destekleyici)
  // Randevu sayısı (pazar büyüklüğü): 45% - EN YÜKSEK ağırlık
  // Talep/Rakip oranı: 30% - Yüksek ağırlık
  // Nüfus yoğunluğu: 12.5% - Destekleyici
  // Rakip avantajı: 12.5% - Destekleyici
  const hamSkor = 
    (randevuNorm * 0.45) +           // EN YÜKSEK: Pazar büyüklüğü
    (talepRakipOraniNorm * 0.30) +   // Yüksek: Talep/Rakip oranı
    (nufusYogunluguNorm * 0.125) +   // Destekleyici
    (rakipNorm * 0.125);             // Destekleyici

  // 3. Risk cezası (sadece ceza, ödül yok)
  // Düşük risk = ceza yok (1.0), Yüksek risk = ceza var
  let riskKatsayisi = 1.0;
  switch (riskSeviyesi) {
    case 'Düşük':
      riskKatsayisi = 1.0;  // Ceza yok
      break;
    case 'Orta':
    case 'Orta-Yüksek':
      riskKatsayisi = 0.85; // %15 ceza
      break;
    case 'Yüksek':
      riskKatsayisi = 0.65; // %35 ceza
      break;
    default:
      riskKatsayisi = 0.85;
  }

  // 4. Ham skor üzerine risk cezasını uygula
  let finalSkor = hamSkor * 100 * riskKatsayisi;

  // 5. Küçük pazar sınırlaması: Randevu < 250 olan ilçeler 1. olamaz
  // Maksimum 3. sıraya kadar çıkabilmeleri için skor sınırı uygula
  // En yüksek skorlu ilçenin skorunun altında bir üst limit koy
  // Bu limit, büyük pazarlı ilçelerin skorlarının altında olacak şekilde ayarlanır
  if (randevuSayisi < 250) {
    // Küçük pazarlar için maksimum skor sınırı: 70 (büyük pazarlar genelde 75-90 arası olacak)
    finalSkor = Math.min(finalSkor, 70);
  }

  // 6. Debug log (sadece dev ortamında)
  if (process.env.NODE_ENV !== 'production' && ilceAd) {
    console.log(`📊 ${ilceAd}:`, {
      randevu: randevuSayisi,
      talep_rakip: talepRakipOrani.toFixed(2),
      rakip: normalizeRakip,
      nufus: nufusYogunlugu || 'N/A',
      ham_skor: hamSkor.toFixed(4),
      risk: riskSeviyesi,
      risk_k: riskKatsayisi.toFixed(2),
      kucuk_pazar_limiti: randevuSayisi < 250 ? '70 (uygulandı)' : 'YOK',
      final_skor: Math.round(Math.max(0, Math.min(100, finalSkor)))
    });
  }

  return Math.round(Math.max(0, Math.min(100, finalSkor)));
};

/**
 * İlçe skoru hesaplama fonksiyonu
 * Simülasyon sayfasındaki mantıkla birebir aynı
 * Şube Açma Simülasyonu için: Aylık müşteri tahmini en yüksek ağırlıkta
 * 
 * @param {object} ilceData - İlçe verisi
 * @param {number} ilceData.aylikMusteri - Aylık müşteri tahmini (en yüksek ağırlık)
 * @param {number} ilceData.aylikGelir - Aylık gelir (TL)
 * @param {number} ilceData.rakipNormalize - Normalize edilmiş rakip sayısı (daha az = daha yüksek skor)
 * @param {string} ilceData.riskSeviyesi - Risk seviyesi (Düşük/Orta/Yüksek) (düşük risk = daha yüksek skor)
 * @param {object} maxValues - Maksimum değerler (normalize için)
 * @param {number} maxValues.maxAylikMusteri - Maksimum aylık müşteri tahmini
 * @param {number} maxValues.maxGelir - Maksimum gelir
 * @param {number} maxValues.maxRakip - Maksimum normalize rakip sayısı
 * @returns {number} 0-100 arası yatırım skoru
 */
export const computeIlceSkoru = (ilceData, maxValues) => {
  const { aylikMusteri, aylikGelir, rakipNormalize, riskSeviyesi } = ilceData;
  const { maxAylikMusteri, maxGelir, maxRakip } = maxValues;
  
  // 1. Normalize et (0-1 arası)
  const musteriOrani = maxAylikMusteri > 0 ? Math.min(aylikMusteri / maxAylikMusteri, 1) : 0;
  const gelirOrani = maxGelir > 0 ? Math.min(aylikGelir / maxGelir, 1) : 0;
  // Rakip: daha az rakip = daha yüksek skor (1 - normalize_rakip_ratio)
  const rakipOrani = maxRakip > 0 ? Math.max(0, Math.min(1 - (rakipNormalize / maxRakip), 1)) : 1;
  
  // 2. Risk katsayısı (düşük risk = daha yüksek skor)
  let riskKatsayisi = 1.0;
  switch (riskSeviyesi) {
    case 'Düşük':
      riskKatsayisi = 1.0;
      break;
    case 'Orta':
    case 'Orta-Yüksek':
      riskKatsayisi = 0.8;
      break;
    case 'Yüksek':
      riskKatsayisi = 0.6;
      break;
    default:
      riskKatsayisi = 0.7; // Belirsiz durumlar için orta değer
  }
  
  // 3. Nihai Yatırım Skoru
  // Ağırlıklar: Aylık Müşteri (45% - en yüksek), Gelir (30%), Rakip (15%), Risk katsayısı ile çarpılır
  // Toplam = 90% * riskKatsayisi (0.6-1.0 arası) = 54%-90% arası, sonra normalize edilir
  const yatirimSkoru = (musteriOrani * 45 + gelirOrani * 30 + rakipOrani * 15) * riskKatsayisi;
  
  // 4. 0-100 aralığına normalize et ve yuvarla
  // Maksimum olası değer: (45 + 30 + 15) * 1.0 = 90
  // Minimum olası değer: 0 * 0.6 = 0
  // 90'ı 100'e normalize etmek için: (değer / 90) * 100
  const normalizedSkor = (yatirimSkoru / 90) * 100;
  
  return Math.round(Math.max(0, Math.min(100, normalizedSkor)));
};


