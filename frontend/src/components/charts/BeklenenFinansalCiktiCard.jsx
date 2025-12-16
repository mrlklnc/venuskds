import { useState, useEffect } from 'react';
import { getIlceUygunlukSkoru } from '../../services/dssService';
import { MapPin, TrendingUp, Wallet, Clock, Target } from 'lucide-react';

// Sabit varsayımlar
const AYLIK_GIDER_VARSAYIM = 45000; // TL (kira, maaş, fatura vb.)
const ILK_YATIRIM = 350000; // TL (dekorasyon, cihazlar, depozito vb.)
const ORTALAMA_HIZMET_FIYATI = 850; // TL

export default function BeklenenFinansalCiktiCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getIlceUygunlukSkoru();
        
        if (Array.isArray(result) && result.length > 0) {
          // En yüksek skorlu ilçeyi seç
          const enUygunIlce = result[0];
          
          // Finansal hesaplamalar
          const aylikRandevuTahmini = Math.round(enUygunIlce.randevu_sayisi / 12); // Yıllık randevuyu aylığa böl
          const beklenenAylikGelir = aylikRandevuTahmini * ORTALAMA_HIZMET_FIYATI;
          const aylikKar = beklenenAylikGelir - AYLIK_GIDER_VARSAYIM;
          const geriDonusSuresi = aylikKar > 0 ? Math.ceil(ILK_YATIRIM / aylikKar) : 0;

          setData({
            ilce: enUygunIlce.ilce_ad,
            uygunlukSkoru: enUygunIlce.uygunluk_skoru,
            musteriSayisi: enUygunIlce.musteri_sayisi,
            randevuSayisi: enUygunIlce.randevu_sayisi,
            rakipSayisi: enUygunIlce.rakip_sayisi,
            aylikRandevuTahmini,
            beklenenAylikGelir,
            tahminiAylikGider: AYLIK_GIDER_VARSAYIM,
            aylikKar,
            geriDonusSuresi,
            ilkYatirim: ILK_YATIRIM
          });
        }
      } catch (err) {
        console.error('Finansal veriler yüklenirken hata:', err);
        setError('Veri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h3 className="text-xl font-semibold mb-4 text-purple-700">Beklenen Finansal Çıktılar</h3>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h3 className="text-xl font-semibold mb-4 text-purple-700">Beklenen Finansal Çıktılar</h3>
        <div className="flex items-center justify-center h-48 text-purple-600">
          <p>{error || 'Henüz veri bulunamadı'}</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Ana Öneri Kartı */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-purple-200 text-sm font-medium">Önerilen İlçe</p>
            <h3 className="text-3xl font-bold mt-1">{data.ilce}</h3>
            <p className="text-purple-200 text-sm mt-1">
              Uygunluk Skoru: <span className="font-bold text-white">{data.uygunlukSkoru}/100</span>
            </p>
          </div>
          <div className="bg-white/20 p-3 rounded-xl">
            <MapPin className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-purple-200 text-xs">Müşteri</p>
            <p className="text-xl font-bold">{data.musteriSayisi}</p>
          </div>
          <div>
            <p className="text-purple-200 text-xs">Randevu</p>
            <p className="text-xl font-bold">{data.randevuSayisi}</p>
          </div>
          <div>
            <p className="text-purple-200 text-xs">Rakip</p>
            <p className="text-xl font-bold">{data.rakipSayisi}</p>
          </div>
        </div>
      </div>

      {/* Finansal KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Beklenen Aylık Gelir */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-transparent bg-gradient-to-br from-white to-purple-50/30 p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-600/70 mb-1">Beklenen Aylık Gelir</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mt-2">
                {formatCurrency(data.beklenenAylikGelir)}
              </p>
              <p className="text-xs text-purple-500/60 mt-1">
                ~{data.aylikRandevuTahmini} randevu/ay
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Tahmini Aylık Gider */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-transparent bg-gradient-to-br from-white to-purple-50/30 p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-600/70 mb-1">Tahmini Aylık Gider</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mt-2">
                {formatCurrency(data.tahminiAylikGider)}
              </p>
              <p className="text-xs text-purple-500/60 mt-1">
                Kira, maaş, faturalar
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-700 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Aylık Kar */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-transparent bg-gradient-to-br from-white to-purple-50/30 p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-600/70 mb-1">Tahmini Aylık Kar</p>
              <p className={`text-2xl font-bold mt-2 ${data.aylikKar > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.aylikKar)}
              </p>
              <p className="text-xs text-purple-500/60 mt-1">
                Gelir - Gider
              </p>
            </div>
            <div className={`${data.aylikKar > 0 ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-red-700'} p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Geri Dönüş Süresi */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-transparent bg-gradient-to-br from-white to-purple-50/30 p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-600/70 mb-1">Geri Dönüş Süresi</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mt-2">
                {data.geriDonusSuresi > 0 ? `${data.geriDonusSuresi} ay` : 'Hesaplanamadı'}
              </p>
              <p className="text-xs text-purple-500/60 mt-1">
                İlk yatırım: {formatCurrency(data.ilkYatirim)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Bilgi Notu */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
        <p className="text-sm text-purple-700">
          <strong>Not:</strong> Bu hesaplamalar tahmini değerlerdir. Gerçek sonuçlar pazar koşullarına, 
          yönetim kalitesine ve ekonomik faktörlere göre değişiklik gösterebilir.
        </p>
      </div>
    </div>
  );
}





