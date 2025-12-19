import { useState, useEffect } from 'react';
import { FileText, CheckCircle, AlertTriangle, Lightbulb, Target, MapPin, TrendingUp } from 'lucide-react';
import IlceUygunlukSkoruBölüm from '../components/analizler/IlceUygunlukSkoruBölüm';
import { getIlceUygunlukSkoruAnalizler } from '../services/dssService';

export default function KararOzeti() {
  const [ilceData, setIlceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskSeviyesi, setRiskSeviyesi] = useState('Orta');

  useEffect(() => {
    fetchKararOzetiData();
  }, []);

  const fetchKararOzetiData = async () => {
    try {
      setLoading(true);
      // Grafikte kullanılan aynı endpoint'i kullan (getIlceUygunlukSkoruAnalizler)
      // Bu sayede tüm panellerde aynı skorlar görünecek
      const response = await getIlceUygunlukSkoruAnalizler();
      
      if (response && Array.isArray(response) && response.length > 0) {
        // Uygunluk skoruna göre sıralı (zaten backend'den sıralı geliyor)
        // İlk 3 ilçeyi al
        const filteredIlceler = response
          .filter(ilce => ilce.uygunluk_skoru > 0) // Sadece pozitif skorlu ilçeler
          .slice(0, 3); // İlk 3 ilçe
        
        setIlceData(filteredIlceler);

        // Genel risk seviyesi hesaplama (simulasyon mantığıyla senkronize)
        // getIlceUygunlukSkoruAnalizler response'unda normalize_rakip yoksa rakip_skoru'ndan tahmin edilebilir
        // Ancak daha basit bir yaklaşım: ortalama uygunluk skoruna göre risk belirleme
        const ortalamaUygunlukSkoru = response.length > 0
          ? response.reduce((sum, ilce) => sum + (ilce.uygunluk_skoru || 0), 0) / response.length
          : 50;

        // Risk seviyesi: düşük uygunluk skoru = yüksek risk
        // Simulasyon mantığına benzer şekilde: risk_puani = (100 - uygunluk_skoru) + (normalize_rakip * 5)
        // Burada normalize_rakip bilgisi olmadığı için sadece uygunluk skoruna göre risk belirliyoruz
        // Ortalama uygunluk skoru düşükse risk yüksek
        const riskPuani = 100 - ortalamaUygunlukSkoru;

        // Risk sınıflandırması (simulasyon mantığıyla uyumlu)
        if (riskPuani <= 30) {
          setRiskSeviyesi('Düşük');
        } else if (riskPuani <= 60) {
          setRiskSeviyesi('Orta');
        } else {
          setRiskSeviyesi('Yüksek');
        }
      }
    } catch (error) {
      console.error('Karar özeti verisi yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // İlçe kartları için dinamik veri
  const ilce1 = ilceData[0] || null;
  const ilce2 = ilceData[1] || null;
  const ilce3 = ilceData[2] || null;

  // Rol belirleme (uygunluk skoruna göre)
  const getRol = (index, uygunlukSkoru) => {
    if (index === 0) return 'Ana Şube';
    if (index === 1) return 'Büyüme Şubesi';
    if (index === 2) return 'Premium Şube';
    return 'Şube';
  };

  // Açıklama belirleme (uygunluk skoruna göre)
  const getAciklama = (index, uygunlukSkoru, randevuSayisi) => {
    if (index === 0) {
      return uygunlukSkoru >= 70 ? 'Yüksek talep ve hızlı geri dönüş potansiyeli' : 'Orta talep ve dengeli rekabet';
    }
    if (index === 1) {
      return 'Yüksek müşteri hacmi, orta rekabet';
    }
    if (index === 2) {
      return 'Gelir seviyesi yüksek müşteri profili';
    }
    return 'Potansiyel şube lokasyonu';
  };

  // Ana karar metni dinamik
  const getAnaKararMetni = () => {
    if (ilce1 && ilce2 && ilce3) {
      return `${ilce1.ilce_ad} merkezli, kademeli çoklu şube açılışı önerilmektedir.`;
    }
    return 'Buca merkezli, kademeli çoklu şube açılışı önerilmektedir.';
  };

  const getAnaKararDetay = () => {
    if (ilce1 && ilce2 && ilce3) {
      return `Veriler ${ilce1.ilce_ad}'ın ana yatırım noktası olduğunu, ${ilce2.ilce_ad} ve ${ilce3.ilce_ad}'ın ikinci faz için uygun ilçeler olduğunu göstermektedir.`;
    }
    return "Veriler Buca'nın ana yatırım noktası olduğunu, Bornova ve Karşıyaka'nın ikinci faz için uygun ilçeler olduğunu göstermektedir.";
  };

  // Nihai öneri metni dinamik
  const getNihaiOneri = () => {
    if (ilce1 && ilce2 && ilce3) {
      return `${ilce1.ilce_ad}'da pilot şube açılarak başlanmalı, 6. ayda performans hedefleri sağlanırsa ${ilce2.ilce_ad}, 12. ayda ${ilce3.ilce_ad} yatırımı yapılmalıdır.`;
    }
    return "Buca'da pilot şube açılarak başlanmalı, 6. ayda performans hedefleri sağlanırsa Bornova, 12. ayda Karşıyaka yatırımı yapılmalıdır.";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Yönetici Karar Özeti</h1>
          <p className="text-gray-600">Tüm analizlerin özeti ve stratejik karar önerileri</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Yönetici Karar Özeti</h1>
        <p className="text-gray-600">Tüm analizlerin özeti ve stratejik karar önerileri</p>
      </div>

      {/* 1. Ana Karar Kutusu */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg border border-purple-300 p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Önerilen Şube Açılış Stratejisi</h2>
        </div>
        <p className="text-lg mb-2">
          {getAnaKararMetni()}
        </p>
        <p className="text-purple-100 text-sm">
          {getAnaKararDetay()}
        </p>
      </div>

      {/* 2. Stratejik Şube Önerileri (3 Kart) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KART 1: 1. Öncelik */}
        {ilce1 ? (
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md border-2 border-green-300 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                1. Öncelik
              </div>
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">{ilce1.ilce_ad}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-green-100 text-sm mb-1">Uygunluk Skoru</p>
                <p className="text-3xl font-bold">{ilce1.uygunluk_skoru} / 100</p>
              </div>
              <div className="pt-3 border-t border-green-400/30">
                <p className="text-green-100 text-sm mb-1">Rol</p>
                <p className="text-lg font-semibold">{getRol(0, ilce1.uygunluk_skoru)}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm mb-1">Açıklama</p>
                <p className="text-green-50 text-sm">{getAciklama(0, ilce1.uygunluk_skoru, ilce1.randevu_sayisi)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md border-2 border-green-300 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                1. Öncelik
              </div>
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Buca</h3>
            <div className="space-y-3">
              <div>
                <p className="text-green-100 text-sm mb-1">Uygunluk Skoru</p>
                <p className="text-3xl font-bold">83 / 100</p>
              </div>
              <div className="pt-3 border-t border-green-400/30">
                <p className="text-green-100 text-sm mb-1">Rol</p>
                <p className="text-lg font-semibold">Ana Şube</p>
              </div>
              <div>
                <p className="text-green-100 text-sm mb-1">Açıklama</p>
                <p className="text-green-50 text-sm">Yüksek talep ve hızlı geri dönüş potansiyeli</p>
              </div>
            </div>
          </div>
        )}

        {/* KART 2: 2. Öncelik */}
        {ilce2 ? (
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md border-2 border-blue-300 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                2. Öncelik
              </div>
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">{ilce2.ilce_ad}</h3>
            <div className="space-y-3">
              <div className="pt-3">
                <p className="text-blue-100 text-sm mb-1">Rol</p>
                <p className="text-lg font-semibold">{getRol(1, ilce2.uygunluk_skoru)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Açıklama</p>
                <p className="text-blue-50 text-sm">{getAciklama(1, ilce2.uygunluk_skoru, ilce2.randevu_sayisi)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md border-2 border-blue-300 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                2. Öncelik
              </div>
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Bornova</h3>
            <div className="space-y-3">
              <div className="pt-3">
                <p className="text-blue-100 text-sm mb-1">Rol</p>
                <p className="text-lg font-semibold">Büyüme Şubesi</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Açıklama</p>
                <p className="text-blue-50 text-sm">Yüksek müşteri hacmi, orta rekabet</p>
              </div>
            </div>
          </div>
        )}

        {/* KART 3: 3. Öncelik */}
        {ilce3 ? (
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md border-2 border-amber-300 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                3. Öncelik
              </div>
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">{ilce3.ilce_ad}</h3>
            <div className="space-y-3">
              <div className="pt-3">
                <p className="text-amber-100 text-sm mb-1">Rol</p>
                <p className="text-lg font-semibold">{getRol(2, ilce3.uygunluk_skoru)}</p>
              </div>
              <div>
                <p className="text-amber-100 text-sm mb-1">Açıklama</p>
                <p className="text-amber-50 text-sm">{getAciklama(2, ilce3.uygunluk_skoru, ilce3.randevu_sayisi)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md border-2 border-amber-300 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                3. Öncelik
              </div>
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Karşıyaka</h3>
            <div className="space-y-3">
              <div className="pt-3">
                <p className="text-amber-100 text-sm mb-1">Rol</p>
                <p className="text-lg font-semibold">Premium Şube</p>
              </div>
              <div>
                <p className="text-amber-100 text-sm mb-1">Açıklama</p>
                <p className="text-amber-50 text-sm">Gelir seviyesi yüksek müşteri profili</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. İlçe Uygunluk Skoru Grafiği */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">İlçe Uygunluk Skoru Analizi</h3>
          <p className="text-sm text-gray-600">
            Bu grafik, yeni şubelerin hangi ilçelerde hangi sırayla açılması gerektiğini
            göstermektedir.
          </p>
        </div>
        <IlceUygunlukSkoruBölüm />
      </div>

      {/* 4. Finansal Strateji Özeti */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Finansal Strateji Özeti</h3>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-semibold text-purple-700 mb-3">Önerilen Açılış Takvimi:</p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              <span><strong>Faz 1 (0–6 Ay):</strong> {ilce1 ? ilce1.ilce_ad : 'Buca'}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              <span><strong>Faz 2 (6–12 Ay):</strong> {ilce2 ? ilce2.ilce_ad : 'Bornova'}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              <span><strong>Faz 3 (12+ Ay):</strong> {ilce3 ? ilce3.ilce_ad : 'Karşıyaka'}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 5. Risk Değerlendirmesi */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-800">Genel Risk Değerlendirmesi</h3>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-gray-700 mb-3">
            Çok şubeli yapı sayesinde gelir tek bir ilçeye bağlı değildir.
            Bu durum operasyonel riski azaltmaktadır.
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
            riskSeviyesi === 'Düşük' 
              ? 'bg-green-100 border-green-300' 
              : riskSeviyesi === 'Yüksek' 
              ? 'bg-red-100 border-red-300' 
              : 'bg-yellow-100 border-yellow-300'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              riskSeviyesi === 'Düşük' 
                ? 'text-green-700' 
                : riskSeviyesi === 'Yüksek' 
                ? 'text-red-700' 
                : 'text-yellow-700'
            }`} />
            <span className={`font-semibold ${
              riskSeviyesi === 'Düşük' 
                ? 'text-green-700' 
                : riskSeviyesi === 'Yüksek' 
                ? 'text-red-700' 
                : 'text-yellow-700'
            }`}>Risk Seviyesi: {riskSeviyesi}</span>
          </div>
        </div>
      </div>

      {/* 6. Nihai Karar Metni */}
      <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl shadow-md border-2 border-purple-300 p-6">
        <div className="flex items-start gap-3">
          <FileText className="w-8 h-8 text-purple-700 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-purple-900 mb-3">Nihai Öneri:</h3>
            <p className="text-lg text-purple-800 leading-relaxed">
              {getNihaiOneri()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
