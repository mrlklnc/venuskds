import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatDate } from '../../utils/format';
import { Lightbulb, TrendingUp, Gift } from 'lucide-react';

export default function CampaignAnalytics({ data }) {
  // Monthly appointment trend
  const monthlyAppointmentData = useMemo(() => {
    const monthMap = {};
    data.appointments.forEach(appointment => {
      if (appointment.tarih) {
        const date = new Date(appointment.tarih);
        const month = date.getMonth() + 1;
        const monthName = date.toLocaleString('tr-TR', { month: 'long' });
        monthMap[month] = { ay: month, ay_ad: monthName, randevu_sayisi: (monthMap[month]?.randevu_sayisi || 0) + 1 };
      }
    });
    return Object.values(monthMap).sort((a, b) => a.ay - b.ay);
  }, [data.appointments]);

  // Campaign effectiveness
  const campaignEffectivenessData = useMemo(() => {
    return data.campaigns.map(campaign => {
      const campaignAppointments = data.appointments.filter(apt => {
        if (!apt.tarih || !campaign.baslangic || !campaign.bitis) return false;
        const aptDate = new Date(apt.tarih);
        const startDate = new Date(campaign.baslangic);
        const endDate = new Date(campaign.bitis);
        return aptDate >= startDate && aptDate <= endDate && apt.kampanya_id === campaign.kampanya_id;
      });
      
      const revenue = campaignAppointments.reduce((sum, apt) => sum + (Number(apt.fiyat) || 0), 0);
      
      return {
        kampanya_ad: campaign.kampanya_ad,
        talep: campaignAppointments.length,
        gelir: revenue,
        indirim_orani: campaign.indirim_orani || 0,
        baslangic: campaign.baslangic,
        bitis: campaign.bitis,
      };
    }).sort((a, b) => b.talep - a.talep);
  }, [data.campaigns, data.appointments]);

  const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

  const mostEffectiveCampaign = campaignEffectivenessData[0];
  const totalCampaignAppointments = campaignEffectivenessData.reduce((sum, c) => sum + c.talep, 0);
  const totalCampaignRevenue = campaignEffectivenessData.reduce((sum, c) => sum + c.gelir, 0);

  // Calculate growth trend
  const growthTrend = useMemo(() => {
    if (monthlyAppointmentData.length < 2) return 0;
    const first = monthlyAppointmentData[0].randevu_sayisi;
    const last = monthlyAppointmentData[monthlyAppointmentData.length - 1].randevu_sayisi;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  }, [monthlyAppointmentData]);

  return (
    <div className="space-y-6">
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Aylık Randevu Artış Trendi</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyAppointmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
              <XAxis 
                dataKey="ay_ad" 
                tick={{ fill: '#6b5b95', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#6b5b95' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#faf5ff', 
                  border: '1px solid #c4b5fd',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="randevu_sayisi" 
                stroke="#7c3aed" 
                strokeWidth={3}
                dot={{ fill: '#a78bfa', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Kampanya Etkinliği</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignEffectivenessData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
              <XAxis 
                dataKey="kampanya_ad" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: '#6b5b95', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#6b5b95' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#faf5ff', 
                  border: '1px solid #c4b5fd',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="talep" fill="#7c3aed" radius={[8, 8, 0, 0]} name="Randevu Sayısı">
                {campaignEffectivenessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendation Card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border-2 border-purple-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-purple-800">Kampanya Önerileri</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-semibold text-purple-700">En Etkili Kampanya</p>
            </div>
            <p className="text-lg font-bold text-purple-900">{mostEffectiveCampaign?.kampanya_ad || 'N/A'}</p>
            <p className="text-sm text-purple-600 mt-1">{mostEffectiveCampaign?.talep || 0} randevu</p>
            <p className="text-xs text-purple-500 mt-1">%{mostEffectiveCampaign?.indirim_orani || 0} indirim</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <p className="text-sm font-semibold text-purple-700">Büyüme Trendi</p>
            </div>
            <p className={`text-lg font-bold ${growthTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growthTrend >= 0 ? '+' : ''}{growthTrend.toFixed(1)}%
            </p>
            <p className="text-xs text-purple-500 mt-1">Aylık artış oranı</p>
          </div>
          <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
            <p className="text-sm font-semibold text-purple-700 mb-2">Toplam Kampanya Etkisi</p>
            <p className="text-lg font-bold text-purple-900">{totalCampaignAppointments}</p>
            <p className="text-sm text-purple-600 mt-1">Kampanyalı randevu</p>
            <p className="text-xs text-purple-500 mt-1">Toplam gelir: {totalCampaignRevenue.toLocaleString('tr-TR')} TL</p>
          </div>
        </div>
        <div className="mt-4 bg-white/80 rounded-xl p-4 border border-purple-200">
          <p className="text-sm font-semibold text-purple-700 mb-2">Önerilen Sonraki Kampanya</p>
          <p className="text-base text-purple-900">
            {mostEffectiveCampaign?.kampanya_ad ? 
              `"${mostEffectiveCampaign.kampanya_ad}" benzeri bir kampanya tekrarlanabilir. ` : 
              'Yeni bir kampanya başlatılabilir. '
            }
            {growthTrend > 0 ? 
              'Büyüme trendi pozitif, kampanya etkinliği artırılabilir.' : 
              'Büyüme trendi düşük, yeni kampanya stratejileri değerlendirilmeli.'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">Kampanya Detay Analizi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-purple-100">
                <th className="text-left py-3 px-4 text-purple-700 font-semibold">Kampanya Adı</th>
                <th className="text-left py-3 px-4 text-purple-700 font-semibold">Başlangıç</th>
                <th className="text-left py-3 px-4 text-purple-700 font-semibold">Bitiş</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">İndirim %</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Randevu</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Gelir</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Etkinlik</th>
              </tr>
            </thead>
            <tbody>
              {campaignEffectivenessData.map((campaign) => {
                const effectiveness = campaign.talep > 0 ? campaign.gelir / campaign.talep : 0;
                return (
                  <tr key={campaign.kampanya_ad} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                    <td className="py-3 px-4 text-purple-600 font-medium">{campaign.kampanya_ad}</td>
                    <td className="py-3 px-4 text-purple-600">{formatDate(campaign.baslangic)}</td>
                    <td className="py-3 px-4 text-purple-600">{formatDate(campaign.bitis)}</td>
                    <td className="py-3 px-4 text-right text-purple-700 font-semibold">%{campaign.indirim_orani}</td>
                    <td className="py-3 px-4 text-right text-purple-700 font-semibold">{campaign.talep}</td>
                    <td className="py-3 px-4 text-right text-purple-700 font-semibold">{campaign.gelir.toLocaleString('tr-TR')} TL</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                        {effectiveness.toFixed(0)} TL/randevu
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

