import { useMemo } from 'react';
import { Users, Calendar, MapPin, TrendingUp } from 'lucide-react';

export default function AnalyticsSummary({ 
  musteriIlceData = [],
  aylikRandevuData = []
}) {
  
  // Hesaplamalar - Güvenli ve undefined hatası üretmeyecek şekilde
  const calculations = useMemo(() => {
    // Toplam Müşteri = musteriIlce verisindeki musteri_sayisi toplamı
    const totalMusteri = Array.isArray(musteriIlceData) && musteriIlceData.length > 0
      ? musteriIlceData.reduce((sum, item) => {
          const musteriSayisi = item?.musteri_sayisi || 0;
          return sum + (typeof musteriSayisi === 'number' ? musteriSayisi : 0);
        }, 0)
      : null;

    // Toplam Randevu = aylikRandevu verisindeki sayi toplamı
    const totalRandevu = Array.isArray(aylikRandevuData) && aylikRandevuData.length > 0
      ? aylikRandevuData.reduce((sum, item) => {
          const randevuSayisi = item?.sayi || item?.toplam_randevu || 0;
          return sum + (typeof randevuSayisi === 'number' ? randevuSayisi : 0);
        }, 0)
      : null;

    // En Yoğun İlçe = musteriIlce içinde musteri_sayisi en yüksek olan ilce
    let enYogunIlce = null;
    if (Array.isArray(musteriIlceData) && musteriIlceData.length > 0) {
      const enYogun = musteriIlceData.reduce((max, item) => {
        const currentSayi = item?.musteri_sayisi || 0;
        const maxSayi = max?.musteri_sayisi || 0;
        return (typeof currentSayi === 'number' && currentSayi > maxSayi) ? item : max;
      }, musteriIlceData[0]);
      
      enYogunIlce = enYogun?.ilce || enYogun?.ilce_ad || null;
    }

    // Ortalama Aylık Randevu = toplam randevu / ay sayısı
    const ortalamaAylikRandevu = 
      totalRandevu !== null && 
      Array.isArray(aylikRandevuData) && 
      aylikRandevuData.length > 0
        ? totalRandevu / aylikRandevuData.length
        : null;

    return {
      totalMusteri,
      totalRandevu,
      enYogunIlce,
      ortalamaAylikRandevu
    };
  }, [musteriIlceData, aylikRandevuData]);

  const cards = [
    {
      title: 'Toplam Müşteri',
      value: calculations.totalMusteri !== null && calculations.totalMusteri !== undefined
        ? calculations.totalMusteri.toLocaleString('tr-TR')
        : '-',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Toplam Randevu',
      value: calculations.totalRandevu !== null && calculations.totalRandevu !== undefined
        ? calculations.totalRandevu.toLocaleString('tr-TR')
        : '-',
      icon: Calendar,
      color: 'from-pink-500 to-pink-600',
    },
    {
      title: 'En Yoğun İlçe',
      value: calculations.enYogunIlce || '-',
      icon: MapPin,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'Ortalama Aylık Randevu',
      value: calculations.ortalamaAylikRandevu !== null && calculations.ortalamaAylikRandevu !== undefined
        ? Math.round(calculations.ortalamaAylikRandevu).toLocaleString('tr-TR')
        : '-',
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`bg-gradient-to-br ${card.color} p-2.5 rounded-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}

