import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { MapPin, Info, AlertTriangle, TrendingUp } from 'lucide-react';
import { getIlceRakip, getTalepRakipOrani, getIlceUygunlukSkoruAnalizler } from '../services/dssService';
// Leaflet CSS is loaded from index.html CDN

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

// Minimum randevu eşiği (bu değerin altındaki ilçeler "düşük veri" olarak işaretlenir)
const MIN_RANDEVU_ESIGI = 5;

// İzmir ilçe koordinatları (tüm 30 ilçe - haritada gösterilecek)
const ILCE_KOORDINATLARI = {
  // 8 Ana İlçe (analiz_kapsami = 1)
  'Konak': [38.4189, 27.1287],
  'Karşıyaka': [38.4561, 27.1094],
  'Bornova': [38.4697, 27.2164],
  'Buca': [38.3886, 27.1742],
  'Bayraklı': [38.4622, 27.1644],
  'Çiğli': [38.5008, 27.0608],
  'Gaziemir': [38.3178, 27.1314],
  'Balçova': [38.3897, 27.0453],
  // 22 Mikro İlçe (analiz_kapsami = 0)
  'Karabağlar': [38.3750, 27.1250],
  'Narlıdere': [38.4019, 27.0089],
  'Torbalı': [38.1567, 27.3633],
  'Menemen': [38.6103, 27.0753],
  'Kemalpaşa': [38.4275, 27.4172],
  'Menderes': [38.2536, 27.1331],
  'Urla': [38.3236, 26.7647],
  'Seferihisar': [38.1967, 26.8375],
  'Foça': [38.6708, 26.7544],
  'Aliağa': [38.8003, 26.9711],
  'Bergama': [39.1206, 27.1783],
  'Dikili': [39.0719, 26.8881],
  'Güzelbahçe': [38.3689, 26.8900],
  'Karaburun': [38.6389, 26.5147],
  'Kiraz': [38.2303, 28.2047],
  'Kınık': [39.0856, 27.3850],
  'Ödemiş': [38.2272, 27.9661],
  'Selçuk': [37.9508, 27.3681],
  'Tire': [38.0883, 27.7336],
  'Beydağ': [38.0831, 28.2144],
  'Bayındır': [38.2194, 27.6492],
  'Çeşme': [38.3236, 26.3031]
};

// İzmir merkez koordinatları
const IZMIR_CENTER = [38.4237, 27.1428];
const DEFAULT_ZOOM = 10;

// Risk seviyesine göre renk
const getRiskRengi = (riskSeviyesi) => {
  switch (riskSeviyesi?.toLowerCase()) {
    case 'düşük':
      return '#22c55e'; // Yeşil
    case 'orta':
      return '#eab308'; // Sarı
    case 'yüksek':
      return '#ef4444'; // Kırmızı
    default:
      return '#9ca3af'; // Gri
  }
};

// Yatırım fırsatı rengi
const getYatirimRengi = (yatirimFirsati) => {
  switch (yatirimFirsati?.toLowerCase()) {
    case 'yüksek':
      return '#22c55e'; // Yeşil
    case 'orta':
      return '#eab308'; // Sarı
    case 'düşük':
      return '#ef4444'; // Kırmızı
    default:
      return '#9ca3af'; // Gri
  }
};

// Risk seviyesi hesaplama (mevcut mantıkla uyumlu)
const hesaplaRiskSeviyesi = (normalizeRakip, talepRakipOrani) => {
  // Yüksek rakip ve düşük talep/rakip oranı = Yüksek risk
  if (normalizeRakip >= 15 || talepRakipOrani < 5) {
    return 'Yüksek';
  }
  if (normalizeRakip >= 8 || talepRakipOrani < 15) {
    return 'Orta';
  }
  return 'Düşük';
};

// Yatırım fırsatı hesaplama
const hesaplaYatirimFirsati = (riskSeviyesi, talepRakipOrani) => {
  if (riskSeviyesi === 'Düşük' && talepRakipOrani >= 20) {
    return 'Yüksek';
  }
  if (riskSeviyesi === 'Orta' || (riskSeviyesi === 'Düşük' && talepRakipOrani < 20)) {
    return 'Orta';
  }
  return 'Düşük';
};

// Harita boyutunu ayarlayan bileşen
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

export default function HaritaPage() {
  const [ilceVerileri, setIlceVerileri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('risk'); // risk, yatirim, rakip, oran

  useEffect(() => {
    fetchHaritaVerileri();
  }, []);

  const fetchHaritaVerileri = async () => {
    try {
      setLoading(true);
      
      // Mevcut API'lerden veri al (Yönetici Karar Özeti ile aynı kaynak)
      const [rakipRes, talepRakipRes, uygunlukRes] = await Promise.all([
        getIlceRakip(),
        getTalepRakipOrani(),
        getIlceUygunlukSkoruAnalizler()
      ]);

      // Verileri birleştir
      const birlesikVeri = [];
      
      // Rakip verilerini işle
      const rakipMap = new Map();
      if (Array.isArray(rakipRes)) {
        rakipRes.forEach(item => {
          const ilceAd = item.ilce_ad || item.ilce;
          if (ilceAd) {
            rakipMap.set(ilceAd, {
              normalize_rakip: item.normalize_rakip ?? item.gercek_rakip_sayisi ?? item.rakip_sayisi ?? 0
            });
          }
        });
      }

      // Yatırım skoru verilerini işle (nüfus yoğunluğu ve yatırım skoru dahil)
      const uygunlukMap = new Map();
      if (Array.isArray(uygunlukRes)) {
        uygunlukRes.forEach(item => {
          const ilceAd = item.ilce_ad || item.ilce;
          if (ilceAd) {
            uygunlukMap.set(ilceAd, {
              yatirim_skoru: item.yatirim_skoru || item.uygunluk_skoru || 0,
              uygunluk_skoru: item.uygunluk_skoru || 0,
              nufus_yogunlugu: item.nufus_yogunlugu !== null && item.nufus_yogunlugu !== undefined ? item.nufus_yogunlugu : null
            });
          }
        });
      }

      // Talep/Rakip oranı verilerini işle ve birleştir
      // Duplikasyon kontrolü için Set kullan
      const processedIlceler = new Set();
      
      // 🔍 DEBUG: Backend'den gelen veriyi kontrol et
      console.log('📊 getTalepRakipOrani RAW yanıtı:', talepRakipRes);
      console.log('📊 Toplam ilçe sayısı:', Array.isArray(talepRakipRes) ? talepRakipRes.length : 0);
      
      if (Array.isArray(talepRakipRes)) {
        talepRakipRes.forEach(item => {
          const ilceAd = (item.ilce_ad || item.ilce || '').trim();
          
          // 🔍 DEBUG: Her ilçenin randevu sayısını kontrol et
          console.log(`🏘️ ${ilceAd}: randevu_sayisi = ${item.randevu_sayisi}, analiz_kapsami = ${item.analiz_kapsami}`);
          
          // Koordinatı olmayan ilçeleri atla
          if (!ILCE_KOORDINATLARI[ilceAd]) return;
          
          // Duplikasyon kontrolü
          if (processedIlceler.has(ilceAd)) return;
          processedIlceler.add(ilceAd);
          
          const rakipBilgi = rakipMap.get(ilceAd) || { normalize_rakip: 0 };
          const normalizeRakip = rakipBilgi.normalize_rakip;
          const talepRakipOrani = item.talep_rakip_orani || item.oran || 0;
          const uygunlukBilgi = uygunlukMap.get(ilceAd) || { yatirim_skoru: null, nufus_yogunlugu: null };
          const yatirimSkoru = uygunlukBilgi.yatirim_skoru !== null && uygunlukBilgi.yatirim_skoru !== undefined ? uygunlukBilgi.yatirim_skoru : null;
          const nufusYogunlugu = uygunlukBilgi.nufus_yogunlugu;
          const randevuSayisi = item.randevu_sayisi || 0;
          
          // Ana ilçe mi kontrol et
          const isAnaIlce = ANA_ILCELER.includes(ilceAd);
          
          // Düşük talep: randevu < 5 olan TÜM ilçeler (ana ilçeler dahil)
          const isDusukTalep = randevuSayisi < MIN_RANDEVU_ESIGI;
          
          // Risk ve yatırım hesapla (düşük talepte bile hesapla, sadece haritada override olacak)
          const riskSeviyesi = hesaplaRiskSeviyesi(normalizeRakip, talepRakipOrani);
          const yatirimFirsati = hesaplaYatirimFirsati(riskSeviyesi, talepRakipOrani);

          birlesikVeri.push({
            ilce: ilceAd,
            koordinat: ILCE_KOORDINATLARI[ilceAd],
            rakip_sayisi: normalizeRakip,
            talep_rakip_orani: talepRakipOrani,
            risk_seviyesi: riskSeviyesi,
            yatirim_firsati: yatirimFirsati,
            yatirim_skoru: yatirimSkoru,
            nufus_yogunlugu: nufusYogunlugu,
            randevu_sayisi: randevuSayisi,
            is_ana_ilce: isAnaIlce,
            is_dusuk_talep: isDusukTalep // Randevu < 5 ise true
          });
        });
      }
      
      // Sıralama: Önce ana ilçeler (sabit sırada), sonra diğerleri
      birlesikVeri.sort((a, b) => {
        // Ana ilçeler önce
        if (a.is_ana_ilce && !b.is_ana_ilce) return -1;
        if (!a.is_ana_ilce && b.is_ana_ilce) return 1;
        // Ana ilçeler arasında sabit sıra
        if (a.is_ana_ilce && b.is_ana_ilce) {
          return ANA_ILCELER.indexOf(a.ilce) - ANA_ILCELER.indexOf(b.ilce);
        }
        // Diğerleri alfabetik
        return a.ilce.localeCompare(b.ilce, 'tr');
      });

      setIlceVerileri(birlesikVeri);
    } catch (error) {
      console.error('Harita verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Seçilen metriğe göre marker rengi
  const getMarkerRengi = (ilce) => {
    // ⚠️ DÜŞÜK TALEP OVERRIDE: Randevu < 5 olan ilçeler HER ZAMAN kırmızı
    // Seçili metrik ne olursa olsun bu kural geçerli
    if (ilce.is_dusuk_talep) {
      return '#ef4444'; // Kırmızı (mevcut tema rengi)
    }
    
    switch (selectedMetric) {
      case 'risk':
        return getRiskRengi(ilce.risk_seviyesi);
      case 'yatirim':
        return getYatirimRengi(ilce.yatirim_firsati);
      case 'rakip':
        // Rakip sayısına göre renk (az=yeşil, çok=kırmızı)
        if (ilce.rakip_sayisi <= 5) return '#22c55e';
        if (ilce.rakip_sayisi <= 10) return '#eab308';
        return '#ef4444';
      case 'oran':
        // Talep/Rakip oranına göre renk (yüksek=yeşil, düşük=kırmızı)
        if (ilce.talep_rakip_orani >= 20) return '#22c55e';
        if (ilce.talep_rakip_orani >= 10) return '#eab308';
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  // Marker boyutu (talep/rakip oranına göre)
  const getMarkerBoyutu = (ilce) => {
    const oran = ilce.talep_rakip_orani || 0;
    if (oran >= 30) return 18;
    if (oran >= 20) return 15;
    if (oran >= 10) return 12;
    return 10;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Harita yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Sayfa Başlığı */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <MapPin className="w-7 h-7 text-purple-600" />
          Harita (CBS Analizi)
        </h1>
        <p className="text-gray-500 mt-1">Coğrafi Bilgi Sistemi ile ilçe bazlı analiz</p>
      </div>

      {/* Bilgilendirme Kutusu */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-purple-800">
          İlçeler; rakip yoğunluğu, talep / rakip oranı ve risk seviyelerine göre harita üzerinde değerlendirilir.
        </p>
      </div>

      {/* Metrik Seçimi */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Görüntüleme Metriği</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedMetric('risk')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedMetric === 'risk'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Risk Seviyesi
          </button>
          <button
            onClick={() => setSelectedMetric('yatirim')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedMetric === 'yatirim'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Yatırım Fırsatı
          </button>
          <button
            onClick={() => setSelectedMetric('rakip')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedMetric === 'rakip'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rakip Yoğunluğu
          </button>
          <button
            onClick={() => setSelectedMetric('oran')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedMetric === 'oran'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Talep / Rakip Oranı
          </button>
        </div>
      </div>

      {/* Harita Konteyneri */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-[500px] w-full">
          <MapContainer
            center={IZMIR_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <MapResizer />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {ilceVerileri.map((ilce, index) => (
              <CircleMarker
                key={index}
                center={ilce.koordinat}
                radius={getMarkerBoyutu(ilce)}
                fillColor={getMarkerRengi(ilce)}
                color="#fff"
                weight={2}
                opacity={1}
                fillOpacity={0.8}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="p-2 min-w-[180px]">
                    <h4 className="font-bold text-gray-900 text-base border-b border-gray-200 pb-1 mb-2">
                      {ilce.ilce}
                      {ilce.is_ana_ilce && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Ana İlçe</span>
                      )}
                    </h4>
                    
                    {/* Düşük talep uyarısı - EN ÜSTTE */}
                    {ilce.is_dusuk_talep && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                        <p className="text-red-700 text-xs font-semibold">⚠️ Düşük talep (5'in altında) — analiz dışı</p>
                      </div>
                    )}
                    
                    {/* Tüm metrikler gösterilir */}
                    <div className="space-y-1 text-sm">
                      <p className="flex justify-between">
                        <span className="text-gray-600">Randevu Sayısı:</span>
                        <span className={`font-semibold ${ilce.is_dusuk_talep ? 'text-red-600' : 'text-gray-900'}`}>
                          {ilce.randevu_sayisi || 0}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Rakip Sayısı:</span>
                        <span className="font-semibold text-gray-900">{ilce.rakip_sayisi}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Talep / Rakip:</span>
                        <span className="font-semibold text-gray-900">{ilce.talep_rakip_orani?.toFixed(1) || '0'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Yatırım Skoru:</span>
                        <span className="font-semibold text-purple-600">{ilce.yatirim_skoru || '-'}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Risk Seviyesi:</span>
                        <span className={`font-semibold ${
                          ilce.risk_seviyesi === 'Düşük' ? 'text-green-600' :
                          ilce.risk_seviyesi === 'Orta' ? 'text-yellow-600' : 'text-red-600'
                        }`}>{ilce.risk_seviyesi}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Yatırım Fırsatı:</span>
                        <span className={`font-semibold ${
                          ilce.yatirim_firsati === 'Yüksek' ? 'text-green-600' :
                          ilce.yatirim_firsati === 'Orta' ? 'text-yellow-600' : 'text-red-600'
                        }`}>{ilce.yatirim_firsati}</span>
                      </p>
                    </div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Lejant */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Renk Açıklaması</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">
              {selectedMetric === 'risk' ? 'Düşük Risk' : 
               selectedMetric === 'yatirim' ? 'Yüksek Fırsat' :
               selectedMetric === 'rakip' ? 'Az Rakip (≤5)' : 'Yüksek Oran (≥20)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-600">
              {selectedMetric === 'risk' ? 'Orta Risk' : 
               selectedMetric === 'yatirim' ? 'Orta Fırsat' :
               selectedMetric === 'rakip' ? 'Orta Rakip (6-10)' : 'Orta Oran (10-20)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">
              {selectedMetric === 'risk' ? 'Yüksek Risk' : 
               selectedMetric === 'yatirim' ? 'Düşük Fırsat' :
               selectedMetric === 'rakip' ? 'Çok Rakip (>10)' : 'Düşük Oran (<10)'}
            </span>
          </div>
          {/* Düşük talep uyarısı - her zaman görünür */}
          <div className="flex items-center gap-2 border-l border-gray-300 pl-6">
            <div className="w-4 h-4 rounded-full bg-red-500 ring-2 ring-red-300"></div>
            <span className="text-sm text-red-600 font-medium">
              Talep çok düşük (&lt; 5 randevu)
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          * Daire boyutu talep/rakip oranına göre belirlenir. Büyük daire = yüksek potansiyel.
        </p>
        <p className="text-xs text-red-500 mt-1">
          * Randevu sayısı 5'in altında olan ilçeler, seçili metrikten bağımsız olarak kırmızı gösterilir.
        </p>
      </div>

      {/* İlçe Listesi */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">İlçe Özeti </h3>
        <p className="text-xs text-gray-500 mb-4">
          Yatırım sıralaması; talep/rakip oranı, rakip yoğunluğu ve risk seviyesi birlikte değerlendirilerek hesaplanan bileşik skor üzerinden yapılır.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left font-medium text-gray-600">İlçe</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">Randevu</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">Rakip</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">Talep/Rakip</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">Nüfus Yoğunluğu</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">Yatırım Skoru</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">Risk</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">Fırsat</th>
              </tr>
            </thead>
            <tbody>
              {ilceVerileri
                .filter(ilce => ilce.is_ana_ilce === true && ilce.is_dusuk_talep !== true)
                .sort((a, b) => {
                  // Ana ilçeler (skor null değil) önce
                  if (a.yatirim_skoru !== null && a.yatirim_skoru !== undefined && (b.yatirim_skoru === null || b.yatirim_skoru === undefined)) return -1;
                  if ((a.yatirim_skoru === null || a.yatirim_skoru === undefined) && b.yatirim_skoru !== null && b.yatirim_skoru !== undefined) return 1;
                  // İkisi de ana ilçe ise skora göre sırala
                  if (a.yatirim_skoru !== null && a.yatirim_skoru !== undefined && b.yatirim_skoru !== null && b.yatirim_skoru !== undefined) {
                    return b.yatirim_skoru - a.yatirim_skoru;
                  }
                  // İkisi de mikro ilçe ise alfabetik
                  return a.ilce.localeCompare(b.ilce, 'tr');
                })
                .map((ilce, index) => (
                <tr key={index} className={`border-t border-gray-100 hover:bg-gray-50 ${ilce.is_dusuk_talep ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {ilce.ilce}
                    {ilce.is_ana_ilce && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Ana</span>
                    )}
                    {ilce.is_dusuk_talep && (
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Düşük Talep</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center text-gray-700">
                    <span className={ilce.is_dusuk_talep ? 'text-red-600' : ''}>
                      {ilce.randevu_sayisi || 0}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-gray-700">{ilce.rakip_sayisi}</td>
                  <td className="px-4 py-2 text-center text-gray-700">{ilce.talep_rakip_orani?.toFixed(1) || '0'}</td>
                  <td className="px-4 py-2 text-center text-gray-700">
                    {ilce.is_ana_ilce && ilce.nufus_yogunlugu !== null && ilce.nufus_yogunlugu !== undefined
                      ? ilce.nufus_yogunlugu.toLocaleString('tr-TR')
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      ilce.yatirim_skoru !== null && ilce.yatirim_skoru >= 80 ? 'bg-purple-100 text-purple-700' :
                      ilce.yatirim_skoru !== null && ilce.yatirim_skoru >= 60 ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ilce.yatirim_skoru !== null && ilce.yatirim_skoru !== undefined ? ilce.yatirim_skoru : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      ilce.risk_seviyesi === 'Düşük' ? 'bg-green-100 text-green-700' :
                      ilce.risk_seviyesi === 'Orta' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {ilce.risk_seviyesi}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      ilce.yatirim_firsati === 'Yüksek' ? 'bg-green-100 text-green-700' :
                      ilce.yatirim_firsati === 'Orta' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {ilce.yatirim_firsati}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

