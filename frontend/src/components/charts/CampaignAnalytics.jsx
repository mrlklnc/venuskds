import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { formatDate } from '../../utils/format';
import { Lightbulb, TrendingUp, Gift, Award } from 'lucide-react';

export default function CampaignAnalytics({ data }) {

  /* =====================
     GÜVENLİ VERİLER
  ====================== */

  const campaigns = Array.isArray(data?.kampanyaAnalizi)
    ? data.kampanyaAnalizi
    : [];

  const monthlyTrend = Array.isArray(data?.aylikRandevu)
    ? data.aylikRandevu
    : [];

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-purple-100 p-6 text-purple-600">
        Kampanya analizi verisi henüz bulunamadı
      </div>
    );
  }

  /* =====================
     AYLIK TREND
  ====================== */

  const monthlyAppointmentData = useMemo(() => {
    return monthlyTrend.map(item => ({
      ay: item.ay,
      randevu_sayisi: Number(item.sayi) || 0
    }));
  }, [monthlyTrend]);

  /* =====================
     KAMPANYA ETKİSİ
  ====================== */

  const campaignEffectivenessData = useMemo(() => {
    return campaigns.map(c => ({
      kampanya_ad: c.kampanya_ad,
      talep: Number(c.toplam_randevu) || 0,
      gelir: Number(c.toplam_gelir) || 0,
      indirim_orani: Number(c.indirim_orani) || 0,
      baslangic: c.baslangic,
      bitis: c.bitis
    }));
  }, [campaigns]);

  const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe'];

  const mostEffective = campaignEffectivenessData[0];
  const totalAppointments = campaignEffectivenessData.reduce((s, c) => s + c.talep, 0);
  const totalRevenue = campaignEffectivenessData.reduce((s, c) => s + c.gelir, 0);

  const growthTrend =
    monthlyAppointmentData.length > 1
      ? ((monthlyAppointmentData.at(-1).randevu_sayisi -
          monthlyAppointmentData[0].randevu_sayisi) /
          Math.max(1, monthlyAppointmentData[0].randevu_sayisi)) *
        100
      : 0;

  /* =====================
     RENDER
  ====================== */

  return (
    <div className="space-y-6">

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">
            Aylık Randevu Trendi
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyAppointmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ay" />
              <YAxis />
              <Tooltip />
              <Line dataKey="randevu_sayisi" stroke="#7c3aed" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">
            Kampanya Etkinliği
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignEffectivenessData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kampanya_ad" angle={-30} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="talep" name="Randevu">
                {campaignEffectivenessData.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Lightbulb className="text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-800">
            Kampanya Önerisi
          </h3>
        </div>

        <p className="text-purple-700">
          {mostEffective
            ? `"${mostEffective.kampanya_ad}" kampanyası en etkili görünüyor.`
            : 'Yeni kampanya önerilmektedir.'}
        </p>

        <p className="mt-2 text-sm text-purple-600">
          Toplam kampanyalı randevu: <b>{totalAppointments}</b> <br />
          Toplam gelir: <b>{totalRevenue.toLocaleString('tr-TR')} TL</b> <br />
          Büyüme trendi: <b>{growthTrend.toFixed(1)}%</b>
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">
          Kampanya Detayları
        </h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Kampanya</th>
              <th className="text-left p-2">Başlangıç</th>
              <th className="text-left p-2">Bitiş</th>
              <th className="text-right p-2">İndirim %</th>
              <th className="text-right p-2">Randevu</th>
              <th className="text-right p-2">Gelir</th>
            </tr>
          </thead>
          <tbody>
            {campaignEffectivenessData.map(c => (
              <tr key={c.kampanya_ad} className="border-b">
                <td className="p-2">{c.kampanya_ad}</td>
                <td className="p-2">{formatDate(c.baslangic)}</td>
                <td className="p-2">{formatDate(c.bitis)}</td>
                <td className="p-2 text-right">%{c.indirim_orani}</td>
                <td className="p-2 text-right">{c.talep}</td>
                <td className="p-2 text-right">
                  {c.gelir.toLocaleString('tr-TR')} TL
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kampanya Sonuç Yorumu */}
      {campaignEffectivenessData.length > 0 ? (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-lg border-2 border-pink-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-pink-600 p-2 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-pink-800">
              Kampanya Sonuç Yorumu
            </h3>
          </div>

          <div className="space-y-4">
            {/* En Etkili Kampanya */}
            <div className="bg-white rounded-lg p-4 border border-pink-100">
              <p className="text-sm font-medium text-gray-600 mb-2">
                En Etkili Kampanya
              </p>
              <p className="text-lg font-bold text-pink-700">
                {mostEffective?.kampanya_ad || "-"}
                {mostEffective?.talep !== undefined && (
                  <span className="text-gray-600 font-normal ml-2">
                    ({mostEffective.talep} randevu)
                  </span>
                )}
              </p>
              {mostEffective?.indirim_orani !== undefined && (
                <p className="text-sm text-gray-600 mt-1">
                  İndirim Oranı: %{mostEffective.indirim_orani}
                </p>
              )}
            </div>

            {/* Toplam Kampanyalı Randevu */}
            <div className="bg-white rounded-lg p-4 border border-pink-100">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Toplam Kampanyalı Randevu
              </p>
              <p className="text-lg font-bold text-pink-700">
                {totalAppointments.toLocaleString('tr-TR')} randevu
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Tüm kampanyaların toplam randevu sayısı
              </p>
            </div>

            {/* Kampanya Tekrar Önerisi */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border-2 border-purple-200">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Kampanya Tekrar Önerisi
              </p>
              {mostEffective ? (
                <div>
                  <p className="text-base font-semibold text-purple-700 mb-2">
                    "{mostEffective.kampanya_ad}" kampanyasını tekrar düzenlemeniz önerilir.
                  </p>
                  <p className="text-sm text-gray-600">
                    Bu kampanya {mostEffective.talep} randevu ile en yüksek etkiyi göstermiştir. 
                    Benzer bir kampanya stratejisi ile müşteri çekmeye devam edebilirsiniz. 
                    İndirim oranını ve kampanya süresini optimize ederek daha da etkili sonuçlar alabilirsiniz.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Yeterli kampanya verisi bulunamadığı için öneri yapılamıyor.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <div className="text-center py-8">
            <Gift className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Kampanya Verisi Bulunamadı
            </p>
            <p className="text-sm text-gray-500">
              Henüz kampanya analizi için yeterli veri bulunmamaktadır. 
              Kampanyalar oluşturulduğunda bu bölümde detaylı analizler görüntülenecektir.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}


