import { useMemo } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../utils/format';
import { Lightbulb, TrendingUp } from 'lucide-react';

export default function ServiceAnalytics({ data }) {
  // Service demand (appointment count per service)
  const serviceDemandData = useMemo(() => {
    const serviceMap = {};
    data.appointments.forEach(appointment => {
      if (appointment.hizmet?.hizmet_ad) {
        const serviceName = appointment.hizmet.hizmet_ad;
        serviceMap[serviceName] = (serviceMap[serviceName] || 0) + 1;
      }
    });
    return Object.entries(serviceMap)
      .map(([hizmet_ad, talep]) => ({ hizmet_ad, talep }))
      .sort((a, b) => b.talep - a.talep);
  }, [data.appointments]);

  // Service revenue
  const serviceRevenueData = useMemo(() => {
    const serviceMap = {};
    data.appointments.forEach(appointment => {
      if (appointment.hizmet?.hizmet_ad && appointment.fiyat) {
        const serviceName = appointment.hizmet.hizmet_ad;
        serviceMap[serviceName] = (serviceMap[serviceName] || 0) + Number(appointment.fiyat);
      }
    });
    return Object.entries(serviceMap)
      .map(([hizmet_ad, gelir]) => ({ hizmet_ad, gelir }))
      .sort((a, b) => b.gelir - a.gelir);
  }, [data.appointments]);

  // Price comparison (simplified - using average prices from appointments)
  const priceComparisonData = useMemo(() => {
    const serviceMap = {};
    data.appointments.forEach(appointment => {
      if (appointment.hizmet?.hizmet_ad && appointment.fiyat) {
        const serviceName = appointment.hizmet.hizmet_ad;
        if (!serviceMap[serviceName]) {
          serviceMap[serviceName] = { prices: [], count: 0 };
        }
        serviceMap[serviceName].prices.push(Number(appointment.fiyat));
        serviceMap[serviceName].count++;
      }
    });
    return Object.entries(serviceMap)
      .map(([hizmet_ad, data]) => ({
        hizmet_ad,
        bizim_fiyat: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
        rakip_ort_fiyat: (data.prices.reduce((a, b) => a + b, 0) / data.prices.length) * 0.85, // Simulated competitor price (15% lower)
      }))
      .slice(0, 10);
  }, [data.appointments]);

  const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f3e8ff', '#faf5ff'];

  const topService = serviceRevenueData[0];
  const mostDemanded = serviceDemandData[0];
  const totalRevenue = serviceRevenueData.reduce((sum, s) => sum + s.gelir, 0);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">En Çok Talep Edilen Hizmetler</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceDemandData.slice(0, 5)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="talep"
              >
                {serviceDemandData.slice(0, 5).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#faf5ff', 
                  border: '1px solid #c4b5fd',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Hizmet Bazlı Gelir Dağılımı</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceRevenueData.slice(0, 8)}>
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
              <Bar dataKey="gelir" fill="#7c3aed" radius={[8, 8, 0, 0]}>
                {serviceRevenueData.slice(0, 8).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Fiyat Karşılaştırması</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceComparisonData}>
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
              <Bar dataKey="bizim_fiyat" fill="#7c3aed" radius={[8, 8, 0, 0]} name="Bizim Fiyat" />
              <Bar dataKey="rakip_ort_fiyat" fill="#a78bfa" radius={[8, 8, 0, 0]} name="Rakip Ort. Fiyat" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recommendation Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border-2 border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-purple-800">Hizmet Önerileri</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-2">En Karlı Hizmet</p>
              <p className="text-lg font-bold text-purple-900">{topService?.hizmet_ad || 'N/A'}</p>
              <p className="text-sm text-purple-600 mt-1">{formatCurrency(topService?.gelir || 0)} gelir</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-2">En Çok Talep Edilen</p>
              <p className="text-lg font-bold text-purple-900">{mostDemanded?.hizmet_ad || 'N/A'}</p>
              <p className="text-sm text-purple-600 mt-1">{mostDemanded?.talep || 0} randevu</p>
            </div>
            <div className="bg-white/80 rounded-xl p-4 border border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-2">Toplam Gelir</p>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-lg font-bold text-purple-900">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">Hizmet Performans Tablosu</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-purple-100">
                <th className="text-left py-3 px-4 text-purple-700 font-semibold">Hizmet</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Talep</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Toplam Gelir</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Ort. Fiyat</th>
                <th className="text-right py-3 px-4 text-purple-700 font-semibold">Rakip Ort. Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {serviceRevenueData.map((service) => {
                const demand = serviceDemandData.find(d => d.hizmet_ad === service.hizmet_ad);
                const price = priceComparisonData.find(p => p.hizmet_ad === service.hizmet_ad);
                return (
                  <tr key={service.hizmet_ad} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                    <td className="py-3 px-4 text-purple-600 font-medium">{service.hizmet_ad}</td>
                    <td className="py-3 px-4 text-right text-purple-700 font-semibold">{demand?.talep || 0}</td>
                    <td className="py-3 px-4 text-right text-purple-700 font-semibold">{formatCurrency(service.gelir)}</td>
                    <td className="py-3 px-4 text-right text-purple-600">{formatCurrency(price?.bizim_fiyat || 0)}</td>
                    <td className="py-3 px-4 text-right text-purple-500">{formatCurrency(price?.rakip_ort_fiyat || 0)}</td>
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

