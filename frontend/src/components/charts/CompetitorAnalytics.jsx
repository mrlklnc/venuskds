import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../utils/format';
import { Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CompetitorAnalytics({ data }) {
  // Competitor count by district
  const districtCompetitorData = useMemo(() => {
    const districtMap = {};
    data.competitors.forEach(competitor => {
      const districtName = competitor.ilce?.ilce_ad || 'Bilinmeyen';
      districtMap[districtName] = (districtMap[districtName] || 0) + 1;
    });
    return Object.entries(districtMap)
      .map(([ilce_ad, rakip_sayisi]) => ({ ilce_ad, rakip_sayisi }))
      .sort((a, b) => b.rakip_sayisi - a.rakip_sayisi);
  }, [data.competitors]);

  // Competitor price distribution (simulated from appointments)
  const competitorPriceData = useMemo(() => {
    const serviceMap = {};
    data.appointments.forEach(appointment => {
      if (appointment.hizmet?.hizmet_ad && appointment.fiyat) {
        const serviceName = appointment.hizmet.hizmet_ad;
        if (!serviceMap[serviceName]) {
          serviceMap[serviceName] = [];
        }
        serviceMap[serviceName].push(Number(appointment.fiyat));
      }
    });
    return Object.entries(serviceMap)
      .map(([hizmet_ad, prices]) => {
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        return {
          hizmet_ad,
          min_fiyat: avgPrice * 0.7,
          max_fiyat: avgPrice * 1.3,
          ort_fiyat: avgPrice * 0.85,
          bizim_fiyat: avgPrice,
        };
      })
      .slice(0, 8);
  }, [data.appointments]);

  const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

  const highestCompetition = districtCompetitorData[0];
  const lowestCompetition = districtCompetitorData[districtCompetitorData.length - 1];
  const totalCompetitors = data.competitors.length;

  // Calculate advantages/disadvantages
  const advantages = useMemo(() => {
    const lowCompDistricts = districtCompetitorData.filter(d => d.rakip_sayisi <= 2);
    return lowCompDistricts.length > 0 ? lowCompDistricts.map(d => d.ilce_ad).join(', ') : 'Yok';
  }, [districtCompetitorData]);

  return (
    <div className="space-y-6">
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">İlçelere Göre Rakip Sayısı</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={districtCompetitorData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
              <XAxis 
                dataKey="ilce_ad" 
                angle={-45}
                textAnchor="end"
                height={80}
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
              <Bar dataKey="rakip_sayisi" fill="#7c3aed" radius={[8, 8, 0, 0]}>
                {districtCompetitorData.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Rakip Fiyat Dağılımı</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={competitorPriceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
              <XAxis 
                dataKey="hizmet_ad" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: '#6b5b95', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#6b5b95' }} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: '#faf5ff', 
                  border: '1px solid #c4b5fd',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="min_fiyat" fill="#c4b5fd" name="Min Fiyat" />
              <Bar dataKey="ort_fiyat" fill="#a78bfa" name="Ort. Fiyat" />
              <Bar dataKey="max_fiyat" fill="#7c3aed" name="Max Fiyat" />
              <Bar dataKey="bizim_fiyat" fill="#fbbf24" name="Bizim Fiyat" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advantage/Disadvantage Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg border-2 border-green-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-600 p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-green-800">Avantajlarımız</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-white/80 rounded-xl p-4 border border-green-200">
              <p className="text-sm font-semibold text-green-700 mb-2">Düşük Rekabet Bölgeleri</p>
              <p className="text-base text-green-900 font-medium">{advantages}</p>
              <p className="text-xs text-green-600 mt-2">Bu bölgelerde yeni şube açmak için uygun fırsatlar var.</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 border border-green-200">
              <p className="text-sm font-semibold text-green-700 mb-2">En Düşük Rekabet</p>
              <p className="text-lg font-bold text-green-900">{lowestCompetition?.ilce_ad || 'N/A'}</p>
              <p className="text-sm text-green-600 mt-1">{lowestCompetition?.rakip_sayisi || 0} rakip</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-lg border-2 border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-600 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-orange-800">Dikkat Edilmesi Gerekenler</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-white/80 rounded-xl p-4 border border-orange-200">
              <p className="text-sm font-semibold text-orange-700 mb-2">Yüksek Rekabet Bölgeleri</p>
              <p className="text-lg font-bold text-orange-900">{highestCompetition?.ilce_ad || 'N/A'}</p>
              <p className="text-sm text-orange-600 mt-1">{highestCompetition?.rakip_sayisi || 0} rakip</p>
              <p className="text-xs text-orange-600 mt-2">Bu bölgede rekabet yoğun, farklılaşma stratejisi gerekli.</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 border border-orange-200">
              <p className="text-sm font-semibold text-orange-700 mb-2">Toplam Rakip Sayısı</p>
              <p className="text-lg font-bold text-orange-900">{totalCompetitors}</p>
              <p className="text-xs text-orange-600 mt-1">Pazarda aktif rakip işletme sayısı</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">İlçe Bazlı Rakip Analizi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-purple-100">
                <th className="text-left py-3 px-4 text-purple-700 font-semibold">İlçe</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Rakip Sayısı</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Rekabet Seviyesi</th>
                <th className="text-left py-3 px-4 text-purple-700 font-semibold">Öneri</th>
              </tr>
            </thead>
            <tbody>
              {districtCompetitorData.map((district) => {
                const competitionLevel = district.rakip_sayisi <= 2 ? 'Düşük' : district.rakip_sayisi <= 5 ? 'Orta' : 'Yüksek';
                const recommendation = district.rakip_sayisi <= 2 ? 'Şube açmak için uygun' : district.rakip_sayisi <= 5 ? 'Dikkatli değerlendir' : 'Yüksek rekabet riski';
                return (
                  <tr key={district.ilce_ad} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                    <td className="py-3 px-4 text-purple-600 font-medium">{district.ilce_ad}</td>
                    <td className="py-3 px-4 text-right text-purple-700 font-semibold">{district.rakip_sayisi}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        competitionLevel === 'Düşük' ? 'bg-green-100 text-green-700' :
                        competitionLevel === 'Orta' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {competitionLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-purple-600">{recommendation}</td>
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

