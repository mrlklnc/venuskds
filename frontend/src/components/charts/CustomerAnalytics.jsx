import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../utils/format';
import { Lightbulb, TrendingUp } from 'lucide-react';

export default function CustomerAnalytics({ data }) {
  // Customer count by district
  const districtCustomerData = useMemo(() => {
    const districtMap = {};
    data.customers.forEach(customer => {
      const districtName = customer.ilce?.ilce_ad || 'Bilinmeyen';
      districtMap[districtName] = (districtMap[districtName] || 0) + 1;
    });
    return Object.entries(districtMap)
      .map(([ilce_ad, musteri_sayisi]) => ({ ilce_ad, musteri_sayisi }))
      .sort((a, b) => b.musteri_sayisi - a.musteri_sayisi);
  }, [data.customers]);

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

  // District satisfaction average
  const districtSatisfactionData = useMemo(() => {
    const districtMap = {};
    const districtCounts = {};
    
    data.satisfactions.forEach(satisfaction => {
      // Try to get district from satisfaction.randevu.musteri or from appointments
      let districtName = null;
      if (satisfaction.randevu?.musteri?.ilce?.ilce_ad) {
        districtName = satisfaction.randevu.musteri.ilce.ilce_ad;
      } else {
        const appointment = data.appointments.find(a => a.randevu_id === satisfaction.randevu_id);
        districtName = appointment?.musteri?.ilce?.ilce_ad;
      }
      
      if (districtName && satisfaction.puan) {
        districtMap[districtName] = (districtMap[districtName] || 0) + satisfaction.puan;
        districtCounts[districtName] = (districtCounts[districtName] || 0) + 1;
      }
    });
    
    return Object.entries(districtMap)
      .map(([ilce_ad, totalPuan]) => ({
        ilce_ad,
        ort_puan: totalPuan / districtCounts[ilce_ad],
        degerlendirme_sayisi: districtCounts[ilce_ad]
      }))
      .sort((a, b) => b.ort_puan - a.ort_puan);
  }, [data.satisfactions, data.appointments]);

  // Insights
  const topDistrict = districtCustomerData[0];
  const bestSatisfactionDistrict = districtSatisfactionData[0];
  const totalCustomers = data.customers.length;
  const totalAppointments = data.appointments.length;

  const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

  return (
    <div className="space-y-6">
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">İlçelere Göre Müşteri Dağılımı</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={districtCustomerData.slice(0, 10)}>
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
              <Bar dataKey="musteri_sayisi" fill="#7c3aed" radius={[8, 8, 0, 0]}>
                {districtCustomerData.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Aylık Randevu Trendi</h2>
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
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">İlçelere Göre Memnuniyet Ortalaması</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={districtSatisfactionData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
              <XAxis 
                dataKey="ilce_ad" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: '#6b5b95', fontSize: 12 }}
              />
              <YAxis domain={[0, 5]} tick={{ fill: '#6b5b95' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#faf5ff', 
                  border: '1px solid #c4b5fd',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="ort_puan" fill="#a78bfa" radius={[8, 8, 0, 0]}>
                {districtSatisfactionData.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insight Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border-2 border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-purple-800">Karar Önerileri</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-2">En Yüksek Müşteri Potansiyeli</p>
              <p className="text-lg font-bold text-purple-900">{topDistrict?.ilce_ad || 'N/A'}</p>
              <p className="text-sm text-purple-600 mt-1">{topDistrict?.musteri_sayisi || 0} müşteri</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-2">En Yüksek Memnuniyet</p>
              <p className="text-lg font-bold text-purple-900">{bestSatisfactionDistrict?.ilce_ad || 'N/A'}</p>
              <p className="text-sm text-purple-600 mt-1">
                {bestSatisfactionDistrict?.ort_puan?.toFixed(2) || '0'} / 5.0 puan
              </p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-2">Genel İstatistikler</p>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-700">
                  Toplam {totalCustomers} müşteri, {totalAppointments} randevu
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">İlçe Bazlı Detaylı Analiz</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-purple-100">
                <th className="text-left py-3 px-4 text-purple-700 font-semibold">İlçe</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Müşteri Sayısı</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Ort. Memnuniyet</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Değerlendirme</th>
              </tr>
            </thead>
            <tbody>
              {districtCustomerData.map((district) => {
                const satisfaction = districtSatisfactionData.find(d => d.ilce_ad === district.ilce_ad);
                return (
                  <tr key={district.ilce_ad} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                    <td className="py-3 px-4 text-purple-600 font-medium">{district.ilce_ad}</td>
                    <td className="py-3 px-4 text-right text-purple-700 font-semibold">{district.musteri_sayisi}</td>
                    <td className="py-3 px-4 text-right">
                      {satisfaction ? (
                        <span className="text-purple-700 font-semibold">
                          {satisfaction.ort_puan.toFixed(2)} / 5.0
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-purple-600">
                      {satisfaction?.degerlendirme_sayisi || 0}
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

