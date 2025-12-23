import api from "./api";

/* =======================
   MÜŞTERİ & RANDEVU
======================= */

export const getMusteriIlce = async () => {
  const res = await api.get("/dss/musteri-ilce");
  return res.data;
};

export const getAylikRandevu = async () => {
  const res = await api.get("/dss/aylik-randevu");
  return res.data;
};

// 🔴 EKSİK OLAN – HATA BUNDAN ÇIKIYORDU
export const getRandevuAylik = async () => {
  const res = await api.get("/dss/aylik-randevu");
  return res.data;
};

/* =======================
   HİZMET & RAKİP
======================= */

export const getHizmetPerformans = async () => {
  const res = await api.get("/dss/hizmet-performans");
  return res.data;
};

export const getRakipAnalizi = async () => {
  const res = await api.get("/dss/rakip-performans");
  return res.data;
};

/* =======================
   KAMPANYA & KAR-ZARAR
======================= */

export const getKampanyaAnalizi = async () => {
  const res = await api.get("/dss/kampanya-analizi");
  return res.data;
};

export const getKarZarar = async () => {
  const res = await api.get("/dss/kar-zarar");
  return res.data;
};

/* =======================
   İLÇE UYGUNLUK SKORU
======================= */

export const getIlceUygunlukSkoru = async () => {
  const res = await api.get("/dss/ilce-uygunluk-skoru");
  return res.data;
};

/* =======================
   BÖLGESEL HİZMET TALEBİ
======================= */

export const getBolgeselHizmetTalep = async () => {
  const res = await api.get("/dss/bolgesel-hizmet-talep");
  return res.data;
};

/* =======================
   ANALİZLER SAYFASI - YENİ ENDPOINT'LER
======================= */

// İlçe bazlı randevu sayısı
export const getIlceRandevu = async () => {
  const res = await api.get("/dss/ilce-randevu");
  return res.data;
};

// İlçe bazlı hizmet performans tablosu
export const getIlceHizmetPerformans = async () => {
  const res = await api.get("/dss/ilce-hizmet-performans");
  return res.data;
};

// Kampanyalı vs Kampanyasız randevu karşılaştırması
export const getKampanyaKarsilastirma = async () => {
  const res = await api.get("/dss/kampanya-karsilastirma");
  return res.data;
};

// Aylık gelir trendi (kampanya etkisi)
export const getAylikGelirTrendi = async () => {
  const res = await api.get("/dss/aylik-gelir-trendi");
  return res.data;
};

// İlçe bazlı rakip sayısı
export const getIlceRakip = async () => {
  const res = await api.get("/dss/ilce-rakip");
  return res.data;
};

// Talep / Rakip oranı
export const getTalepRakipOrani = async () => {
  const res = await api.get("/dss/talep-rakip-orani");
  return res.data;
};

// En karlı hizmetler (Top 5)
export const getEnKarliHizmetler = async () => {
  const res = await api.get("/dss/en-karli-hizmetler");
  return res.data;
};

// Konak vs Diğer İlçeler karşılaştırması
export const getKonakKarsilastirma = async () => {
  const res = await api.get("/dss/konak-karsilastirma");
  return res.data;
};

// İlçe Uygunluk Skoru (Yeni Şube İçin - Konak hariç)
export const getIlceUygunlukSkoruYeniSube = async () => {
  const res = await api.get("/dss/ilce-uygunluk-skoru-yeni-sube");
  return res.data;
};

// İlçe Uygunluk Skoru (Analizler için - Yeni endpoint)
export const getIlceUygunlukSkoruAnalizler = async () => {
  const res = await api.get("/analizler/ilce-uygunluk-skoru");
  return res.data;
};

// İlçe Skor Özet (Simülasyon sayfası için - Simülasyon verilerinden otomatik hesaplanan)
export const getIlceSkorOzet = async () => {
  const res = await api.get("/simulasyon/skor-ozet");
  return res.data;
};

// Kampanyalar Arası Performans Karşılaştırması
export const getKampanyalarArasiPerformans = async () => {
  const res = await api.get("/dss/kampanyalar-arasi-performans");
  return res.data;
};

// İlçe Bazlı Kampanyaların Sağladığı Kâr
export const getIlceBazliKampanyaKar = async () => {
  const res = await api.get("/dss/ilce-bazli-kampanya-kar");
  return res.data;
};

/* =======================
   ŞUBE AÇMA SİMÜLASYONU
======================= */

// İlçe Bazlı Rakip Analizi
export const getIlceRakipAnalizi = async () => {
  const res = await api.get("/simulasyon/ilce-rakip-analizi");
  return res.data;
};

// İlçe Özet (Simülasyon için - ilce_ad ile)
export const getIlceOzet = async (ilceAd) => {
  const res = await api.get("/simulasyon/ilce-ozet", {
    params: { ilce: ilceAd }
  });
  return res.data;
};

// İlçe Özet (Simülasyon için - ilce_id ile)
export const getIlceOzetById = async (ilceId) => {
  const res = await api.get("/simulasyon/ilce", {
    params: { ilce_id: ilceId }
  });
  return res.data;
};

// Nüfus Yoğunluğu (Simülasyon sayfası için)
export const getNufusYogunlugu = async () => {
  const res = await api.get("/simulasyon/nufus-yogunlugu");
  return res.data;
};

