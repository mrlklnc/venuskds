import { useMemo } from 'react';
import { Lightbulb, MapPin, DollarSign, Calendar, TrendingUp } from 'lucide-react';

export default function DecisionRecommendations({ 
  musteriIlceData = [],
  aylikRandevuData = [],
  hizmetPerformansData = [],
  rakipAnaliziData = [],
  kampanyaAnaliziData = []
}) {
  
  const recommendations = useMemo(() => {
    const items = [];

    // 1. Şube açma önerisi - En düşük müşteri sayısına sahip ilçe
    if (musteriIlceData.length > 0) {
      const enDusukMusteriIlce = musteriIlceData.reduce((min, item) => {
        const musteriSayisi = item.musteri_sayisi || 0;
        const minSayisi = min.musteri_sayisi || 0;
        return musteriSayisi < minSayisi ? item : min;
      }, musteriIlceData[0]);

      if (enDusukMusteriIlce && enDusukMusteriIlce.ilce) {
        items.push({
          icon: MapPin,
          color: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          title: 'Şube Açma Önerisi',
          message: `${enDusukMusteriIlce.ilce} ilçesi yeni şube için uygun görünüyor. Düşük müşteri yoğunluğu nedeniyle rekabet potansiyeli düşük olabilir.`
        });
      }
    }

    // 2. Hizmet fiyat artırma önerisi - Talep yüksek ama gelir düşük hizmet
    if (hizmetPerformansData.length > 0) {
      // Ortalama randevu sayısını hesapla
      const ortalamaRandevu = hizmetPerformansData.reduce((sum, item) => {
        return sum + (item.toplam_randevu || 0);
      }, 0) / hizmetPerformansData.length;

      // Yüksek talep ama düşük fiyat aralığı olan hizmet bul
      const yuksekTalepHizmet = hizmetPerformansData.find(item => {
        return (item.toplam_randevu || 0) > ortalamaRandevu && 
               item.fiyat_araligi && 
               (item.fiyat_araligi.includes('Düşük') || item.fiyat_araligi.includes('düşük'));
      });

      if (yuksekTalepHizmet && yuksekTalepHizmet.hizmet_ad) {
        items.push({
          icon: DollarSign,
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          title: 'Fiyatlandırma Önerisi',
          message: `${yuksekTalepHizmet.hizmet_ad} hizmetinin fiyatı artırılabilir. Yüksek talep görüyor ancak fiyat aralığı düşük seviyede.`
        });
      }
    }

    // 3. Kampanya için ideal ay - En düşük randevu sayısına sahip ay
    if (aylikRandevuData.length > 0) {
      const enDusukRandevuAy = aylikRandevuData.reduce((min, item) => {
        const randevuSayisi = item.toplam_randevu || item.sayi || 0;
        const minSayisi = min.toplam_randevu || min.sayi || 0;
        return randevuSayisi < minSayisi ? item : min;
      }, aylikRandevuData[0]);

      if (enDusukRandevuAy && enDusukRandevuAy.ay) {
        items.push({
          icon: Calendar,
          color: 'from-purple-500 to-pink-500',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700',
          title: 'Kampanya Zamanlaması',
          message: `${enDusukRandevuAy.ay} ayı kampanya için ideal. Düşük randevu sayısı nedeniyle kampanya ile talep artırılabilir.`
        });
      }
    }

    // 4. Rekabet analizi - En düşük rekabetli ilçe
    if (rakipAnaliziData.length > 0) {
      // İlçe bazlı rakip sayısını hesapla (eğer veri varsa)
      const ilceRakipMap = {};
      rakipAnaliziData.forEach(item => {
        // Eğer veri yapısında ilçe bilgisi varsa
        if (item.ilce_ad) {
          ilceRakipMap[item.ilce_ad] = (ilceRakipMap[item.ilce_ad] || 0) + 1;
        }
      });

      if (Object.keys(ilceRakipMap).length > 0) {
        const enDusukRekabetIlce = Object.entries(ilceRakipMap)
          .sort((a, b) => a[1] - b[1])[0];

        if (enDusukRekabetIlce) {
          items.push({
            icon: TrendingUp,
            color: 'from-orange-500 to-amber-500',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-700',
            title: 'Rekabet Analizi',
            message: `${enDusukRekabetIlce[0]} ilçesi düşük rekabet seviyesine sahip. Yeni şube açmak için değerlendirilebilir.`
          });
        }
      }
    }

    // 5. En etkili kampanya tekrar önerisi
    if (kampanyaAnaliziData.length > 0) {
      const enEtkiliKampanya = kampanyaAnaliziData.reduce((max, item) => {
        const randevuSayisi = item.randevu_sayisi || 0;
        const maxSayisi = max.randevu_sayisi || 0;
        return randevuSayisi > maxSayisi ? item : max;
      }, kampanyaAnaliziData[0]);

      if (enEtkiliKampanya && enEtkiliKampanya.kampanya_aciklama) {
        items.push({
          icon: Lightbulb,
          color: 'from-indigo-500 to-violet-500',
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          textColor: 'text-indigo-700',
          title: 'Kampanya Stratejisi',
          message: `"${enEtkiliKampanya.kampanya_aciklama}" kampanyası en yüksek etkiyi göstermiş. Benzer bir kampanya tekrar düzenlenebilir.`
        });
      }
    }

    return items.slice(0, 5); // Maksimum 5 öneri
  }, [musteriIlceData, aylikRandevuData, hizmetPerformansData, rakipAnaliziData, kampanyaAnaliziData]);

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <div className="text-center py-8">
          <Lightbulb className="w-12 h-12 text-purple-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Karar Önerileri Hazırlanıyor
          </p>
          <p className="text-sm text-gray-500">
            Yeterli veri toplandığında otomatik karar önerileri burada görüntülenecektir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl shadow-lg border-2 border-purple-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-2 rounded-lg">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-semibold text-purple-800">
          Otomatik Karar Önerileri
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => {
          const Icon = rec.icon;
          return (
            <div
              key={index}
              className={`${rec.bgColor} rounded-xl p-5 border-2 ${rec.borderColor} hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start gap-3">
                <div className={`bg-gradient-to-br ${rec.color} p-2 rounded-lg flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${rec.textColor} mb-2`}>
                    {rec.title}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {rec.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}






