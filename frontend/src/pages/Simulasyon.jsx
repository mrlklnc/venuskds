import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { Building2, MapPin, Users, TrendingUp, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  getIlceOzetById,
  getMusteriIlce,
  getIlceRandevu,
  getIlceRakip,
  getTalepRakipOrani,
  getNufusYogunlugu
} from '../services/dssService';
import { ilceService } from '../services/ilceService';

// ═══════════════════════════════════════════════════════════════
// SABİT: 8 Ana İlçe (skor/risk/karar hesaplamalarında kullanılır)
// ═══════════════════════════════════════════════════════════════
const ANA_ILCELER = [
  'Konak',
  'Karşıyaka',
  'Bornova',
  'Buca',
  'Çiğli',
  'Gaziemir',
  'Bayraklı',
  'Balçova'
];

// Minimum randevu eşiği (bu değerin altındaki ilçeler "Diğer İlçeler" olarak gruplanır)
const MIN_RANDEVU_ESIGI = 5;

// ═══════════════════════════════════════════════════════════════
// MİKRO İLÇE HESAPLAMA MANTIĞI
// analiz_kapsami = 0 olan ilçeler için özel hesaplama
// ═══════════════════════════════════════════════════════════════

// ⚠️ TOPLAM SABİT: 22 mikro ilçe = 15 müşteri, 20 randevu
const MIKRO_ILCE_TOPLAM_MUSTERI = 15;
const MIKRO_ILCE_TOPLAM_RANDEVU = 20;

/**
 * İlçe ID'sine göre deterministik ama farklı sonuçlar üret
 * Her ilçe farklı müşteri/randevu değeri alır ama toplam sabit kalır
 */
const getMikroIlceDegerleri = (ilceId) => {
  if (!ilceId) return { musteri: 0, randevu: 0 };
  
  // İlçe ID'sini seed olarak kullan (deterministik)
  const seed = ilceId % 1000;
  
  // Müşteri: 0-2 arası (toplam 15 olacak şekilde dağıtılacak)
  // Basit hash fonksiyonu ile 0-2 arası değer
  const musteriHash = (seed * 17 + 23) % 3; // 0, 1, veya 2
  
  // Randevu: 0-3 arası (toplam 20 olacak şekilde dağıtılacak)
  const randevuHash = (seed * 31 + 47) % 4; // 0, 1, 2, veya 3
  
  return {
    musteri: musteriHash,
    randevu: randevuHash
  };
};

// Mikro ilçe talep katsayısı: (randevu / 12) + 0.2
const getMikroTalepKatsayisi = (randevuSayisi) => {
  return (randevuSayisi / 12) + 0.2;
};

// Mikro ilçe aylık müşteri: randevu bazlı hesaplama
// Müşteri 0-2 arası olduğu için, aylık müşteri de düşük olmalı
const getMikroAylikMusteri = (musteriSayisi, randevuSayisi) => {
  // Müşteri sayısı 0-2 arası, randevu 0-3 arası
  // Aylık müşteri = max(1, musteri * 2 + randevu)
  return Math.max(1, Math.round(musteriSayisi * 2 + randevuSayisi));
};

// Mikro ilçe risk seviyesi: randevuya göre
const getMikroRiskSeviyesi = (randevuSayisi) => {
  if (randevuSayisi <= 1) return 'Yüksek';
  if (randevuSayisi === 2) return 'Orta';
  return 'Düşük'; // >= 3
};

// İlçe adını normalize et (büyük/küçük harf ve boşluk kontrolü)
const normalizeIlceAd = (ad) => {
  if (!ad) return '';
  return ad.trim();
};

/**
 * Grafik verisi işleme: 
 * - 8 ana ilçe HER ZAMAN ayrı gösterilir
 * - analiz_kapsami = 0 olan ilçeler "Diğer İlçeler" olarak toplanır
 * - "Diğer İlçeler" için SABİT değerler: 15 müşteri, 20 randevu
 * - Duplikasyon engellenir
 */
const processIlceDataForChart = (data, ilceKey = 'ilce', valueKey = 'musteri_sayisi', ilceList = []) => {
  if (!Array.isArray(data)) return [];
  
  const seen = new Set();
  const anaIlceler = [];
  let mikroIlceSayisi = 0;
  
  // İlçe listesinden analiz_kapsami bilgisini almak için map oluştur
  const ilceAnalizMap = new Map();
  if (Array.isArray(ilceList)) {
    ilceList.forEach(ilce => {
      if (ilce.ilce_id && ilce.ilce_ad) {
        ilceAnalizMap.set(normalizeIlceAd(ilce.ilce_ad), ilce.analiz_kapsami ?? 1);
      }
    });
  }
  
  data.forEach(item => {
    const ilceAd = normalizeIlceAd(item[ilceKey] || item.ilce_ad || item.ilce);
    if (!ilceAd || seen.has(ilceAd)) return;
    seen.add(ilceAd);
    
    const analizKapsami = ilceAnalizMap.get(ilceAd) ?? 1;
    
    // 8 ana ilçe mi? (analiz_kapsami = 1)
    if (ANA_ILCELER.includes(ilceAd) || analizKapsami === 1) {
      anaIlceler.push({ ...item, [ilceKey]: ilceAd });
    } 
    // Mikro ilçe mi? (analiz_kapsami = 0)
    else if (analizKapsami === 0) {
      mikroIlceSayisi++;
    }
  });
  
  // Ana ilçeleri sabit sıraya göre sırala
  anaIlceler.sort((a, b) => {
    const aIlce = normalizeIlceAd(a[ilceKey] || a.ilce_ad || a.ilce);
    const bIlce = normalizeIlceAd(b[ilceKey] || b.ilce_ad || b.ilce);
    return ANA_ILCELER.indexOf(aIlce) - ANA_ILCELER.indexOf(bIlce);
  });
  
  // "Diğer İlçeler" barını ekle (mikro ilçeler için SABİT değerler)
  if (mikroIlceSayisi > 0) {
    const digerItem = { 
      [ilceKey]: 'Diğer İlçeler', 
      [valueKey]: valueKey === 'musteri_sayisi' ? MIKRO_ILCE_TOPLAM_MUSTERI : MIKRO_ILCE_TOPLAM_RANDEVU
    };
    // İlce_ad key'i de ekle (bazı grafikler bu key'i kullanıyor)
    if (ilceKey !== 'ilce_ad') {
      digerItem.ilce_ad = 'Diğer İlçeler';
    }
    // Müşteri ve randevu değerlerini ekle (her iki grafik için)
    if (valueKey === 'musteri_sayisi') {
      digerItem.randevu_sayisi = MIKRO_ILCE_TOPLAM_RANDEVU;
    } else if (valueKey === 'randevu_sayisi') {
      digerItem.musteri_sayisi = MIKRO_ILCE_TOPLAM_MUSTERI;
    }
    anaIlceler.push(digerItem);
  }
  
  return anaIlceler;
};

// Sadece 8 ana ilçeyi filtrele (skor/risk hesaplamaları için)
const filterAnaIlceler = (data, ilceKey = 'ilce') => {
  if (!Array.isArray(data)) return [];
  
  const seen = new Set();
  return data
    .filter(item => {
      const ilceAd = normalizeIlceAd(item[ilceKey] || item.ilce_ad || item.ilce);
      if (!ANA_ILCELER.includes(ilceAd)) return false;
      if (seen.has(ilceAd)) return false;
      seen.add(ilceAd);
      return true;
    })
    .sort((a, b) => {
      const aIlce = normalizeIlceAd(a[ilceKey] || a.ilce_ad || a.ilce);
      const bIlce = normalizeIlceAd(b[ilceKey] || b.ilce_ad || b.ilce);
      return ANA_ILCELER.indexOf(aIlce) - ANA_ILCELER.indexOf(bIlce);
    });
};

/**
 * Grafik verisi sıralama: Çoktan aza (DESC)
 * - "Diğer İlçeler" her zaman en sonda kalır
 */
const sortDescForChart = (data, valueKey, ilceKey = 'ilce') => {
  if (!Array.isArray(data) || data.length === 0) return data;
  
  // "Diğer İlçeler"i ayır
  const digerIlceler = data.filter(item => {
    const ad = normalizeIlceAd(item[ilceKey] || item.ilce_ad || item.ilce);
    return ad === 'Diğer İlçeler';
  });
  
  // Geri kalanları sırala (DESC)
  const sorted = data
    .filter(item => {
      const ad = normalizeIlceAd(item[ilceKey] || item.ilce_ad || item.ilce);
      return ad !== 'Diğer İlçeler';
    })
    .sort((a, b) => (Number(b[valueKey]) || 0) - (Number(a[valueKey]) || 0));
  
  // "Diğer İlçeler"i en sona ekle
  return [...sorted, ...digerIlceler];
};

export default function Simulasyon() {
  const [ilceList, setIlceList] = useState([]);
  const [selectedIlce, setSelectedIlce] = useState('');
  const [selectedIlceId, setSelectedIlceId] = useState(null);
  const [ilceOzet, setIlceOzet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ozetLoading, setOzetLoading] = useState(false);

  // Karar destek grafikleri için state'ler
  const [musteriData, setMusteriData] = useState([]);
  const [randevuData, setRandevuData] = useState([]);
  const [rakipSayisiData, setRakipSayisiData] = useState([]);
  const [talepRakipOraniData, setTalepRakipOraniData] = useState([]);
  const [nufusYogunluguData, setNufusYogunluguData] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);
  
  // TÜM ilçelerin randevu verisini tut (mikro talep katsayısı için)
  const [tumIlceRandevuData, setTumIlceRandevuData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setChartsLoading(true);
        const [
          ilceRes,
          musteriRes,
          randevuRes,
          rakipSayisiRes,
          talepRakipOraniRes,
          nufusYogunluguRes
        ] = await Promise.all([
          ilceService.getAll(),
          getMusteriIlce().catch(() => []),
          getIlceRandevu().catch(() => []),
          getIlceRakip().catch(() => []),
          getTalepRakipOrani().catch(() => []),
          getNufusYogunlugu().catch(() => [])
        ]);
        const ilceData = ilceRes?.data || ilceRes || [];
        setIlceList(Array.isArray(ilceData) ? ilceData : []);
        
        // ═══════════════════════════════════════════════════════════════
        // VERİ İŞLEME: 8 ana ilçe + "Diğer İlçeler" (analiz_kapsami = 0) + SIRALAMA
        // ═══════════════════════════════════════════════════════════════
        // Müşteri verisi: ana ilçeler + mikro ilçeler "Diğer İlçeler" (15 müşteri)
        const musteriProcessed = processIlceDataForChart(musteriRes, 'ilce', 'musteri_sayisi', ilceData);
        setMusteriData(sortDescForChart(musteriProcessed, 'musteri_sayisi', 'ilce'));
        
        // Randevu verisi: ana ilçeler + mikro ilçeler "Diğer İlçeler" (20 randevu)
        const randevuProcessed = processIlceDataForChart(randevuRes, 'ilce_ad', 'randevu_sayisi', ilceData);
        setRandevuData(sortDescForChart(randevuProcessed, 'randevu_sayisi', 'ilce_ad'));
        
        // Nüfus yoğunluğu verisi: Backend'den zaten filtrelenmiş (analiz_kapsami = 1) ve sıralanmış (nufus_yogunlugu DESC) ilk 8 ilçe geliyor
        if (Array.isArray(nufusYogunluguRes)) {
          const nufusProcessed = nufusYogunluguRes.map(item => ({
            ilce: normalizeIlceAd(item.ilce_ad || ''),
            ilce_ad: normalizeIlceAd(item.ilce_ad || ''),
            nufus_yogunlugu: Number(item.nufus_yogunlugu) || 0
          }));
          // Backend zaten sıralı ve limitli veri gönderdiği için direkt set ediyoruz
          setNufusYogunluguData(nufusProcessed);
        } else {
          setNufusYogunluguData([]);
        }
        
        // ⚠️ TÜM ilçelerin randevu verisini sakla (mikro talep katsayısı için)
        // Bu veri simülasyon hesabında ilçe bazlı farklılaşma için kullanılır
        if (Array.isArray(talepRakipOraniRes)) {
          setTumIlceRandevuData(talepRakipOraniRes.map(item => ({
            ilce_ad: normalizeIlceAd(item.ilce_ad || item.ilce || ''),
            randevu_sayisi: item.randevu_sayisi || 0
          })));
        }
        
        // Rakip verisi: normalize_rakip hesapla + sadece ana ilçeler (Diğer İlçeler yok)
        const processedRakipSayisi = Array.isArray(rakipSayisiRes) 
          ? rakipSayisiRes.map(item => ({
              ...item,
              normalize_rakip: item.normalize_rakip ?? item.gercek_rakip_sayisi ?? item.rakip_sayisi ?? 0
            }))
          : [];
        const rakipFiltered = filterAnaIlceler(processedRakipSayisi, 'ilce_ad');
        // ✅ Çoktan aza sırala (rakip sayısı)
        setRakipSayisiData(sortDescForChart(rakipFiltered, 'normalize_rakip', 'ilce_ad'));
        
        // Talep/Rakip oranı: sadece ana ilçeler (risk hesabı için)
        const oranFiltered = filterAnaIlceler(talepRakipOraniRes, 'ilce_ad');
        // ✅ Çoktan aza sırala (talep/rakip oranı)
        setTalepRakipOraniData(sortDescForChart(oranFiltered, 'talep_rakip_orani', 'ilce_ad'));
      } catch (err) {
        console.error('Veri yüklenemedi:', err);
        setIlceList([]);
      } finally {
        setLoading(false);
        setChartsLoading(false);
      }
    };
    fetchData();
  }, []);

  // İlçe seçildiğinde özet bilgileri çek (ilce_id ile)
  useEffect(() => {
    const fetchIlceOzet = async () => {
      if (!selectedIlceId) {
        setIlceOzet(null);
        return;
      }

      try {
        setOzetLoading(true);
        console.log('🔄 İlçe özeti API çağrısı başlatılıyor, ilce_id:', selectedIlceId);
        const data = await getIlceOzetById(selectedIlceId);
        console.log('✅ İlçe özeti API response:', data);
        setIlceOzet(data);
      } catch (err) {
        console.error('❌ İlçe özeti yüklenemedi:', err);
        setIlceOzet(null);
      } finally {
        setOzetLoading(false);
      }
    };

    fetchIlceOzet();
  }, [selectedIlceId]);

  // Seçilen ilçenin rakip bilgisini bul
  const selectedIlceData = rakipSayisiData.find(item => item.ilce_ad === selectedIlce);

  // ═══════════════════════════════════════════════════════════════
  // SEÇİLEN İLÇE İÇİN ANALİZ KAPSAMI VE MİKRO HESAPLAMA
  // ═══════════════════════════════════════════════════════════════
  
  // Seçilen ilçenin analiz_kapsami değerini bul
  const selectedIlceInfo = ilceList.find(i => i.ilce_id === selectedIlceId);
  const analizKapsami = selectedIlceInfo?.analiz_kapsami ?? 1; // Varsayılan: ana ilçe
  const isAnaIlce = analizKapsami === 1;
  const isMikroIlce = analizKapsami === 0;
  
  // ═══════════════════════════════════════════════════════════════
  // VERİ KAYNAĞI KONTROLÜ: API VERİSİ ÖNCELİKLİ, YOKSA MİKRO SİMÜLASYON
  // analiz_kapsami sadece etiket olarak kullanılır, karar mekanizmasında kullanılmaz
  // ═══════════════════════════════════════════════════════════════
  let mikroIlceMusteri = 0;
  let mikroIlceRandevu = 0;
  let mikroAylikMusteri = 0;
  let mikroRiskSeviyesi = null;
  let mikroIlceDbKullanildi = false; // DB verisi kullanıldı mı yoksa mikro simülasyon mu?
  
  // Tüm ilçeler için API'den gelen veriyi kontrol et (analiz_kapsami ne olursa olsun)
  if (ilceOzet) {
    const dbMusteriSayisi = ilceOzet.musteri_sayisi !== undefined && ilceOzet.musteri_sayisi !== null 
      ? Number(ilceOzet.musteri_sayisi) 
      : 0;
    const dbRandevuSayisi = ilceOzet.randevu_sayisi !== undefined && ilceOzet.randevu_sayisi !== null 
      ? Number(ilceOzet.randevu_sayisi) 
      : 0;
    
    // API'den veri varsa (musteri_sayisi > 0 VEYA randevu_sayisi > 0) -> DB değerlerini kullan
    if (dbMusteriSayisi > 0 || dbRandevuSayisi > 0) {
      mikroIlceDbKullanildi = true;
      mikroIlceMusteri = dbMusteriSayisi;
      mikroIlceRandevu = dbRandevuSayisi;
      
      // Aylık müşteri = max(1, musteri_sayisi)
      mikroAylikMusteri = Math.max(1, mikroIlceMusteri);
      
      // Risk seviyesi randevu sayısına göre belirlenir
      mikroRiskSeviyesi = getMikroRiskSeviyesi(mikroIlceRandevu);
    } else if (isMikroIlce) {
      // API'de veri yok (her ikisi de 0 veya null) VE analiz_kapsami = 0 -> mikro simülasyon kullan
      mikroIlceDbKullanildi = false;
      const mikroSimulasyonDegerleri = getMikroIlceDegerleri(selectedIlceId);
      mikroIlceMusteri = mikroSimulasyonDegerleri.musteri;
      mikroIlceRandevu = mikroSimulasyonDegerleri.randevu;
      
      // Mikro simülasyon için aylık müşteri hesaplama
      mikroAylikMusteri = getMikroAylikMusteri(mikroIlceMusteri, mikroIlceRandevu);
      mikroRiskSeviyesi = getMikroRiskSeviyesi(mikroIlceRandevu);
    }
  } else if (isMikroIlce) {
    // İlçe özeti henüz yüklenmediyse VE analiz_kapsami = 0 -> mikro simülasyon kullan
    mikroIlceDbKullanildi = false;
    const mikroSimulasyonDegerleri = getMikroIlceDegerleri(selectedIlceId);
    mikroIlceMusteri = mikroSimulasyonDegerleri.musteri;
    mikroIlceRandevu = mikroSimulasyonDegerleri.randevu;
    mikroAylikMusteri = getMikroAylikMusteri(mikroIlceMusteri, mikroIlceRandevu);
    mikroRiskSeviyesi = getMikroRiskSeviyesi(mikroIlceRandevu);
  }

  // Rakip yoğunluğu seviyesi belirleme
  const getRakipYoğunlukSeviyesi = (rakipSayisi) => {
    if (rakipSayisi === 0) return 'Yok';
    if (rakipSayisi <= 2) return 'Düşük';
    if (rakipSayisi <= 5) return 'Orta';
    return 'Yüksek';
  };

  // Para formatı
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // ✅ Normalize rakibe göre risk (Buca normalize=10 => "Orta" olacak şekilde ayarlı)
  const getNormalizeRakibeGoreRisk = (normalizeRakip) => {
    const n = Number(normalizeRakip || 0);
    if (n <= 2) return 'Düşük';
    if (n <= 10) return 'Orta';
    if (n <= 15) return 'Orta-Yüksek';
    return 'Yüksek';
  };

  // Risk seviyesi renk ve stil
  const getRiskSeviyesiStil = (riskSeviyesi) => {
    const riskValue = riskSeviyesi || '';
    switch (riskValue) {
      case 'Düşük':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
      case 'Orta':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
      case 'Orta-Yüksek':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
      case 'Yüksek':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // YATIRIM SKORU HESAPLAMA: Simülasyon verilerinden otomatik türet
  // ═══════════════════════════════════════════════════════════════
  
  // Profesyonel mor paleti (tek renk sistemi)
  const MOR_PALETI = {
    cokAcik: '#e9d5ff',  // Çok açık mor
    acik: '#c4b5fd',     // Açık mor
    orta: '#a78bfa',     // Orta mor
    koyu: '#8b5cf6',     // Koyu mor
    enKoyu: '#7c3aed',   // En koyu mor (vurgu için)
    cokKoyu: '#6d28d9'   // Çok koyu (en vurgulu)
  };

  // Aynı tür metrikler için aynı renk mantığı
  const getBarColor = (value, maxValue, isHighlight = false) => {
    if (isHighlight) return MOR_PALETI.cokKoyu;
    
    // Değere göre mor tonu seç (yüksek değer = daha koyu)
    const ratio = maxValue > 0 ? value / maxValue : 0;
    if (ratio >= 0.8) return MOR_PALETI.enKoyu;
    if (ratio >= 0.6) return MOR_PALETI.koyu;
    if (ratio >= 0.4) return MOR_PALETI.orta;
    if (ratio >= 0.2) return MOR_PALETI.acik;
    return MOR_PALETI.cokAcik;
  };

  // En yüksek/en düşük değeri bul (vurgu için)
  const getMaxValue = (data, key) => {
    return Math.max(...data.map(item => item[key] || 0), 1);
  };

  const getMinValue = (data, key) => {
    return Math.min(...data.map(item => item[key] || 0), 0);
  };


  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Şube Açma Simülasyonu</h1>
        <p className="text-gray-600">Yeni şube açma senaryolarını simüle edin ve sonuçları analiz edin</p>
      </div>

      {/* Karar Destek Özeti - 2x2 Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Karar Destek Özeti</h2>

        {chartsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Kart: Talep Payı (%) - Premium Style */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
              <h3 className="text-base font-medium text-gray-800 mb-2">Talep Payı (%)</h3>
              <p className="text-xs text-gray-500 mb-4">İlçenin toplam randevu içindeki payı</p>
              {(() => {
                // Talep payı hesaplama: (İlçe Randevu Sayısı / Toplam Randevu Sayısı) * 100
                const toplamRandevu = randevuData.reduce((sum, item) => sum + (item.randevu_sayisi || 0), 0);
                const talepPayiData = randevuData.map(item => ({
                  ilce_ad: item.ilce_ad,
                  talep_payi: toplamRandevu > 0 ? Number(((item.randevu_sayisi || 0) / toplamRandevu * 100).toFixed(2)) : 0,
                  randevu_sayisi: item.randevu_sayisi || 0
                }));

                return talepPayiData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={talepPayiData} margin={{ top: 10, right: 10, left: 5, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#c9b8ff" strokeOpacity={0.2} />
                      <XAxis
                        dataKey="ilce_ad"
                        tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                        tickLine={{ stroke: '#c4b5fd' }}
                      />
                      <YAxis 
                        tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                        axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                        tickLine={{ stroke: '#c4b5fd' }}
                        width={45}
                        label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#5b21b6', fontSize: 11, fontWeight: 500, dx: -5 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid #c4b5fd',
                          borderRadius: '12px',
                          padding: '14px 18px',
                          boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.2), 0 8px 10px -6px rgba(124, 58, 237, 0.1)'
                        }}
                        labelStyle={{ color: '#5b21b6', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}
                        itemStyle={{ color: '#7c3aed', fontSize: '13px', fontWeight: 500 }}
                        formatter={(value) => [`${Number(value).toFixed(2)}%`, '']}
                        labelFormatter={(label) => `📊 ${label}`}
                        cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
                      />
                      <Bar dataKey="talep_payi" name="Talep Payı (%)" radius={[8, 8, 0, 0]}>
                        {(() => {
                          const maxValue = Math.max(...talepPayiData.map(item => item.talep_payi || 0), 1);
                          return talepPayiData.map((entry, index) => {
                            const talepPayi = entry.talep_payi || 0;
                            const isMax = talepPayi === maxValue;
                            const fillColor = getBarColor(talepPayi, maxValue, isMax);
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={fillColor}
                                style={{ filter: isMax ? 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.3))' : 'none' }}
                              />
                            );
                          });
                        })()}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    Veri bulunamadı
                  </div>
                );
              })()}
            </div>

            {/* 2. Kart: Nüfus Yoğunluğu (İlçe) - Premium Style */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
              <h3 className="text-base font-medium text-gray-800 mb-2">Nüfus Yoğunluğu (İlçe)</h3>
              <p className="text-xs text-gray-500 mb-4">Sadece ana ilçeler – ilk 8 ilçe gösterilmektedir</p>
              {nufusYogunluguData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={nufusYogunluguData} margin={{ top: 10, right: 10, left: 5, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#c9b8ff" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="ilce"
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                    />
                    <YAxis 
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #c4b5fd',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.2), 0 8px 10px -6px rgba(124, 58, 237, 0.1)'
                      }}
                      labelStyle={{ color: '#5b21b6', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}
                      itemStyle={{ color: '#7c3aed', fontSize: '13px', fontWeight: 500 }}
                      formatter={(value) => [`${value.toLocaleString('tr-TR')} kişi/km²`, '']}
                      labelFormatter={(label) => `${label}`}
                      cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
                    />
                    <Bar dataKey="nufus_yogunlugu" name="Nüfus Yoğunluğu" radius={[8, 8, 0, 0]}>
                      {(() => {
                        const maxValue = getMaxValue(nufusYogunluguData, 'nufus_yogunlugu');
                        return nufusYogunluguData.map((entry, index) => {
                          const nufusYogunlugu = entry.nufus_yogunlugu || 0;
                          const isMax = nufusYogunlugu === maxValue;
                          const fillColor = getBarColor(nufusYogunlugu, maxValue, isMax);
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={fillColor}
                              style={{ filter: isMax ? 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.3))' : 'none' }}
                            />
                          );
                        });
                      })()}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Veri bulunamadı
                </div>
              )}
            </div>

            {/* 3. Kart: Rakip Sayısı (İlçe) - Premium Style */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
              <h3 className="text-base font-medium text-gray-800 mb-2">Rakip Sayısı (İlçe)</h3>
              <p className="text-xs text-gray-500 mb-4">Normalize edilmiş rakip sayısı</p>
              {rakipSayisiData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rakipSayisiData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#c9b8ff" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="ilce_ad"
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                    />
                    <YAxis 
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #c4b5fd',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.2), 0 8px 10px -6px rgba(124, 58, 237, 0.1)'
                      }}
                      labelStyle={{ color: '#5b21b6', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}
                      itemStyle={{ color: '#7c3aed', fontSize: '13px', fontWeight: 500 }}
                      formatter={(value) => [`${value} rakip`, '']}
                      labelFormatter={(label) => `📍 ${label}`}
                      cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
                    />
                    <Bar dataKey="normalize_rakip" name="Rakip Sayısı" radius={[8, 8, 0, 0]}>
                      {(() => {
                        const maxValue = getMaxValue(rakipSayisiData, 'normalize_rakip');
                        return rakipSayisiData.map((entry, index) => {
                          const normalizeRakip = entry.normalize_rakip ?? entry.gercek_rakip_sayisi ?? entry.rakip_sayisi ?? 0;
                          const isMax = normalizeRakip === maxValue;
                          const fillColor = getBarColor(normalizeRakip, maxValue, isMax);
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={fillColor}
                              style={{ filter: isMax ? 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.3))' : 'none' }}
                            />
                          );
                        });
                      })()}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Veri bulunamadı
                </div>
              )}
            </div>

            {/* 4. Kart: Talep / Rakip Oranı - Premium Style */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
              <h3 className="text-base font-medium text-gray-800 mb-2">Talep / Rakip Oranı</h3>
              <p className="text-xs text-gray-500 mb-4">Yatırım fırsatı göstergesi</p>
              {talepRakipOraniData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={talepRakipOraniData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#c9b8ff" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="ilce_ad"
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                    />
                    <YAxis 
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #c4b5fd',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.2), 0 8px 10px -6px rgba(124, 58, 237, 0.1)'
                      }}
                      labelStyle={{ color: '#5b21b6', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}
                      itemStyle={{ color: '#7c3aed', fontSize: '13px', fontWeight: 500 }}
                      formatter={(value) => [`${value.toFixed(2)} oran`, '']}
                      labelFormatter={(label) => `📊 ${label}`}
                      cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
                    />
                    <Bar dataKey="talep_rakip_orani" name="Talep/Rakip Oranı" radius={[8, 8, 0, 0]}>
                      {(() => {
                        const maxValue = getMaxValue(talepRakipOraniData, 'talep_rakip_orani');
                        return talepRakipOraniData.map((entry, index) => {
                          const oran = entry.talep_rakip_orani || 0;
                          const isMax = oran === maxValue;
                          const fillColor = getBarColor(oran, maxValue, isMax);
                          return (
                            <Cell
                              key={`cell-${index}`}
                              fill={fillColor}
                              style={{ filter: isMax ? 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.3))' : 'none' }}
                            />
                          );
                        });
                      })()}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Veri bulunamadı
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* İlçe Seçimi ve Simülasyon */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Simülasyon</h2>

        {/* İlçe Seçimi */}
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
          <label htmlFor="ilce-select" className="block text-sm font-semibold text-gray-700 mb-2">
            Simülasyon İçin İlçe Seçiniz
          </label>
          <select
            id="ilce-select"
            value={selectedIlceId || ''}
            onChange={(e) => {
              const selectedId = e.target.value ? parseInt(e.target.value) : null;
              const selectedName = e.target.value ? ilceList.find(i => i.ilce_id === selectedId)?.ilce_ad || '' : '';
              setSelectedIlceId(selectedId);
              setSelectedIlce(selectedName);
            }}
            className="w-full md:w-64 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 bg-white"
          >
            <option value="">İlçe Seçiniz</option>
            {ilceList.map((ilce) => (
              <option key={ilce.ilce_id} value={ilce.ilce_id}>
                {ilce.ilce_ad}
              </option>
            ))}
          </select>
        </div>

        {/* Seçilen İlçe Açıklaması */}
        {selectedIlce && ilceOzet && (
          <div className={`mt-4 p-3 rounded-lg border space-y-2 ${
            isAnaIlce 
              ? 'bg-purple-50 border-purple-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                <span className={`font-semibold ${isAnaIlce ? 'text-purple-700' : 'text-orange-700'}`}>
                  Seçilen ilçe:
                </span>{' '}
                <span className="font-medium">{selectedIlce}</span>
                {isAnaIlce ? (
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                    Ana İlçe (analiz_kapsami = 1)
                  </span>
                ) : (
                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                    Mikro İlçe (analiz_kapsami = 0)
                  </span>
                )}
              </p>
            </div>
            
           
            
            {isAnaIlce && (ilceOzet.gercek_rakip_sayisi !== undefined || ilceOzet.normalize_rakip !== undefined) && (
              <p className="text-xs text-gray-600 italic">
                Gerçekçi tahmini rakip sayısı: <span className="font-semibold">{ilceOzet.gercek_rakip_sayisi || ilceOzet.normalize_rakip}</span> (ilçe bazlı normalize edilmiştir)
              </p>
            )}
            
              {isMikroIlce && (
                <div className="bg-orange-100 rounded-lg p-2 border border-orange-300">
                  <p className="text-xs text-orange-800 font-medium">
                    Bu ilçe düşük talep grubundadır.
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Simülasyon mikro veri ile hesaplanmıştır.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Simülasyon Sonuç Kartları */}
        {selectedIlceId && (
          <>
            {ozetLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : ilceOzet ? (() => {
              // ═══════════════════════════════════════════════════════════════
              // ANALİZ KAPSAMI KONTROLÜ
              // analiz_kapsami = 1 → Ana ilçe (mevcut mantık)
              // analiz_kapsami = 0 → Mikro ilçe (özel hesaplama)
              // ═══════════════════════════════════════════════════════════════
              
              const ortalamaFiyat = 4500;
              let normalSenaryoMusteri;
              let aylikGelir; // Mikro ilçeler için ayrı gelir hesaplaması
              let riskValue;
              
              if (isAnaIlce) {
                // ═══════════════════════════════════════════════════════════════
                // ANA İLÇE: Mevcut hesaplama mantığı AYNEN korunur
                // ═══════════════════════════════════════════════════════════════
                const baseMusteri = ilceOzet.tahmini_musteri || 0;
                const ACILIS_ETKISI = 0.15;
                const KAMPANYA_ETKISI = 0.10;
                const YAKINLIK_ETKISI = 0.05;
                const TOPLAM_CARPAN = 1 + ACILIS_ETKISI + KAMPANYA_ETKISI + YAKINLIK_ETKISI;
                normalSenaryoMusteri = Math.round(baseMusteri * TOPLAM_CARPAN);
                aylikGelir = normalSenaryoMusteri * ortalamaFiyat; // Ana ilçe için normal hesaplama
                
                // Risk: normalize rakibe göre
                const normalizeRakip = ilceOzet.gercek_rakip_sayisi ?? ilceOzet.normalize_rakip ?? ilceOzet.rakip_sayisi ?? 0;
                riskValue = getNormalizeRakibeGoreRisk(normalizeRakip);
              } else {
                // ═══════════════════════════════════════════════════════════════
                // MİKRO İLÇE: DB'den gelen verilerle hesaplama
                // Aylık müşteri = max(1, musteri_sayisi)
                // Aylık gelir = musteri_sayisi * ortalama_hizmet_fiyati
                // ═══════════════════════════════════════════════════════════════
                normalSenaryoMusteri = mikroAylikMusteri; // max(1, mikroIlceMusteri)
                aylikGelir = mikroIlceMusteri * ortalamaFiyat; // Direkt musteri_sayisi * ortalama_fiyat
                riskValue = mikroRiskSeviyesi;
              }
              
              const riskStil = getRiskSeviyesiStil(riskValue);
              
              return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gerçekçi Aylık Müşteri Tahmini */}
                <div className={`bg-white rounded-xl shadow-md border p-6 ${
                  isAnaIlce ? 'border-purple-100' : 'border-orange-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-3 rounded-lg ${
                      isAnaIlce ? 'bg-purple-100' : 'bg-orange-100'
                    }`}>
                      <Users className={`w-6 h-6 ${
                        isAnaIlce ? 'text-purple-600' : 'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600">
                        {isAnaIlce ? 'Gerçekçi Aylık Müşteri Tahmini' : 'Mikro İlçe Müşteri Tahmini'}
                      </h4>
                      <p className="text-2xl font-bold text-gray-800">{normalSenaryoMusteri}</p>
                    </div>
                  </div>
                  
                  {isAnaIlce ? (
                    <p className="text-xs text-gray-500">
                      Açılış, kampanya ve transfer etkileri dahil edilmiştir.
                    </p>
                  ) : (
                    <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs text-orange-700 font-medium">
                        Bu ilçe düşük talep grubundadır.
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Simülasyon mikro veri ile hesaplanmıştır.
                      </p>
                    </div>
                  )}
                </div>

                {/* Tahmini Aylık Gelir */}
                <div className={`bg-white rounded-xl shadow-md border p-6 ${
                  isAnaIlce ? 'border-purple-100' : 'border-orange-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-3 rounded-lg ${
                      isAnaIlce ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      <DollarSign className={`w-6 h-6 ${
                        isAnaIlce ? 'text-green-600' : 'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600">Tahmini Aylık Gelir</h4>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrency(isMikroIlce ? aylikGelir : normalSenaryoMusteri * ortalamaFiyat)}</p>
                    </div>
                  </div>
                </div>

                {/* Risk Seviyesi */}
                <div className={`bg-white rounded-xl shadow-md border p-6 ${
                  isAnaIlce ? 'border-purple-100' : 'border-orange-200'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-3 rounded-lg ${riskStil.bg}`}>
                      <AlertTriangle className={`w-6 h-6 ${riskStil.text}`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600">
                        Risk Seviyesi {isMikroIlce ? '(Randevu Bazlı)' : '(Normalize Rakibe Göre)'}
                      </h4>
                      <p className={`text-2xl font-bold ${riskStil.text}`}>{riskValue}</p>
                    </div>
                  </div>
                  
                  {isAnaIlce && (
                    <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${riskStil.bg} ${riskStil.text} border ${riskStil.border}`}>
                      {ilceOzet.gercek_rakip_sayisi ?? ilceOzet.normalize_rakip ?? 0} rakip (normalize)
                    </div>
                  )}
                </div>
              </div>
              );
            })() : (
              <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6 text-center">
                <p className="text-gray-500">Simülasyon verisi yükleniyor...</p>
              </div>
            )}
          </>
        )}

        {/* Senaryo Analizi */}
        {selectedIlceId && ilceOzet && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Senaryo Analizi</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                // ═══════════════════════════════════════════════════════════════
                // ANALİZ KAPSAMI KONTROLÜ - SENARYO HESAPLAMALARI
                // ═══════════════════════════════════════════════════════════════
                const sabitGider = ilceOzet.toplam_gider || 130000;
                const ortalamaFiyat = 4500;
                
                let senaryolar;
                
                if (isAnaIlce) {
                  // ═══════════════════════════════════════════════════════════════
                  // ANA İLÇE: Mevcut senaryo mantığı AYNEN korunur
                  // ═══════════════════════════════════════════════════════════════
                  const baseMusteri = ilceOzet.tahmini_musteri || 0;
                  const ACILIS_ETKISI = 0.15;
                  const KAMPANYA_ETKISI = 0.10;
                  const YAKINLIK_ETKISI = 0.05;
                  const TOPLAM_CARPAN = 1 + ACILIS_ETKISI + KAMPANYA_ETKISI + YAKINLIK_ETKISI;
                  const normalSenaryoMusteri = Math.round(baseMusteri * TOPLAM_CARPAN);
                  
                  senaryolar = [
                    { 
                      ad: 'Kötü', 
                      musteri: Math.round(normalSenaryoMusteri * 0.54),
                      renk: 'red',
                      aciklama: 'Muhafazakâr tahmin'
                    },
                    { 
                      ad: 'Normal', 
                      musteri: normalSenaryoMusteri,
                      renk: 'yellow',
                      aciklama: 'Gerçekçi tahmin (referans)'
                    },
                    { 
                      ad: 'İyi', 
                      musteri: Math.round(normalSenaryoMusteri * 1.25),
                      renk: 'green',
                      aciklama: 'Optimistik senaryo'
                    }
                  ];
                } else {
                  // ═══════════════════════════════════════════════════════════════
                  // MİKRO İLÇE: Özel senaryo hesaplaması
                  // Kötü = aylık_müşteri - 2
                  // Normal = aylık_müşteri
                  // İyi = aylık_müşteri + 2
                  // ═══════════════════════════════════════════════════════════════
                  const normalMusteri = mikroAylikMusteri;
                  
                  senaryolar = [
                    { 
                      ad: 'Kötü', 
                      musteri: Math.max(1, normalMusteri - 2), // Minimum 1 müşteri
                      renk: 'red',
                      aciklama: `Düşük talep senaryosu (${mikroIlceRandevu} randevu)`
                    },
                    { 
                      ad: 'Normal', 
                      musteri: normalMusteri,
                      renk: 'yellow',
                      aciklama: mikroIlceDbKullanildi 
                        ? `Veritabanından alınan veriler (${mikroIlceRandevu} randevu)`
                        : `Mikro simülasyon tahmini (${mikroIlceRandevu} randevu)`
                    },
                    { 
                      ad: 'İyi', 
                      musteri: normalMusteri + 2,
                      renk: 'green',
                      aciklama: 'Büyüme senaryosu'
                    }
                  ];
                }

                return senaryolar.map((senaryo, index) => {
                  const ciro = senaryo.musteri * ortalamaFiyat;
                  const netKar = ciro - sabitGider;

                  // Risk seviyesi
                  let riskSeviyesi;
                  let riskRenk;
                  if (netKar < 0) {
                    riskSeviyesi = 'Yüksek';
                    riskRenk = 'text-red-700 bg-red-100 border-red-300';
                  } else if (netKar <= 20000) {
                    riskSeviyesi = 'Orta';
                    riskRenk = 'text-yellow-700 bg-yellow-100 border-yellow-300';
                  } else {
                    riskSeviyesi = 'Düşük';
                    riskRenk = 'text-green-700 bg-green-100 border-green-300';
                  }

                  // Kart renk sınıfları
                  const kartRenkSınıfları = {
                    red: 'border-red-300 bg-red-50',
                    yellow: 'border-yellow-300 bg-yellow-50',
                    green: 'border-green-300 bg-green-50'
                  };

                  return (
                    <div
                      key={index}
                      className={`bg-white rounded-xl shadow-md border-2 ${kartRenkSınıfları[senaryo.renk]} p-6`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3
                          className={`text-lg font-bold ${
                            senaryo.renk === 'red'
                              ? 'text-red-700'
                              : senaryo.renk === 'yellow'
                                ? 'text-yellow-700'
                                : 'text-green-700'
                          }`}
                        >
                          {senaryo.ad} Senaryo
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskRenk}`}>
                          {riskSeviyesi}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Aylık Müşteri</p>
                          <p className="text-2xl font-bold text-gray-800">{senaryo.musteri}</p>
                          {senaryo.aciklama && (
                            <p className="text-xs text-gray-400 mt-0.5">{senaryo.aciklama}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Aylık Ciro</p>
                          <p className="text-xl font-semibold text-gray-800">
                            {formatCurrency(ciro)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Sabit Gider</p>
                          <p className="text-lg font-medium text-gray-700">
                            {formatCurrency(sabitGider)}
                          </p>
                        </div>

                        <div
                          className={`pt-3 border-t-2 ${
                            senaryo.renk === 'red'
                              ? 'border-red-200'
                              : senaryo.renk === 'yellow'
                                ? 'border-yellow-200'
                                : 'border-green-200'
                          }`}
                        >
                          <p className="text-sm text-gray-600 mb-1">Net Kâr</p>
                          <p className={`text-2xl font-bold ${netKar < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(netKar)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
