import { useEffect, useState } from 'react';
import KPICard from '../components/KPICard';
import { DollarSign, Users, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalAppointments: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data - API verisi gelmese bile ekran dolu olsun
      const mockOverview = {
        monthlyComparison: [
          { monthName: 'Ocak', appointments: 45, revenue: 12500 },
          { monthName: 'Şubat', appointments: 52, revenue: 14200 },
          { monthName: 'Mart', appointments: 48, revenue: 13800 },
          { monthName: 'Nisan', appointments: 61, revenue: 16800 },
          { monthName: 'Mayıs', appointments: 55, revenue: 15200 },
          { monthName: 'Haziran', appointments: 58, revenue: 16200 },
        ],
        serviceRanking: [
          { hizmet_id: 1, hizmet_ad: 'Lazer Epilasyon', appointments: 120, revenue: 36000 },
          { hizmet_id: 2, hizmet_ad: 'Hydrafacial', appointments: 85, revenue: 25500 },
          { hizmet_id: 3, hizmet_ad: 'Cilt Bakımı', appointments: 95, revenue: 19000 },
          { hizmet_id: 4, hizmet_ad: 'Saç Kesimi', appointments: 150, revenue: 15000 },
          { hizmet_id: 5, hizmet_ad: 'Makyaj', appointments: 60, revenue: 12000 },
        ],
        districtRanking: [
          { ilce_id: 1, ilce_ad: 'Konak', appointments: 180, revenue: 45000 },
          { ilce_id: 2, ilce_ad: 'Karşıyaka', appointments: 150, revenue: 38000 },
          { ilce_id: 3, ilce_ad: 'Bornova', appointments: 120, revenue: 30000 },
        ],
        customerSegmentation: {
          'A Segmenti': 45,
          'B Segmenti': 120,
          'C Segmenti': 85,
        },
      };

      const mockStats = {
        totalCustomers: 250,
        totalAppointments: 510,
        totalRevenue: 108500,
      };

      setOverview(mockOverview);
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Hata durumunda da mock data göster
      const mockOverview = {
        monthlyComparison: [
          { monthName: 'Ocak', appointments: 45, revenue: 12500 },
          { monthName: 'Şubat', appointments: 52, revenue: 14200 },
        ],
        serviceRanking: [
          { hizmet_id: 1, hizmet_ad: 'Lazer Epilasyon', appointments: 120, revenue: 36000 },
        ],
        districtRanking: [
          { ilce_id: 1, ilce_ad: 'Konak', appointments: 180, revenue: 45000 },
        ],
        customerSegmentation: { 'A Segmenti': 45, 'B Segmenti': 120 },
      };
      setOverview(mockOverview);
      setStats({ totalCustomers: 250, totalAppointments: 510, totalRevenue: 108500 });
    } finally {
      setLoading(false);
    }
  };

  const monthlyChartData = {
    labels: overview?.monthlyComparison?.map(m => m.monthName) || [],
    datasets: [
      {
        label: 'Randevu Sayısı',
        data: overview?.monthlyComparison?.map(m => m.appointments) || [],
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Gelir (TL)',
        data: overview?.monthlyComparison?.map(m => m.revenue) || [],
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        yAxisID: 'y1',
        tension: 0.4,
      },
    ],
  };

  const revenueChartData = {
    labels: overview?.monthlyComparison?.map(m => m.monthName) || [],
    datasets: [
      {
        label: 'Aylık Gelir',
        data: overview?.monthlyComparison?.map(m => m.revenue) || [],
        backgroundColor: 'rgba(124, 58, 237, 0.8)',
      },
    ],
  };

  const serviceChartData = {
    labels: overview?.serviceRanking?.slice(0, 5).map(s => s.hizmet_ad) || [],
    datasets: [
      {
        label: 'Gelir (TL)',
        data: overview?.serviceRanking?.slice(0, 5).map(s => s.revenue) || [],
        backgroundColor: [
          'rgba(124, 58, 237, 0.8)',
          'rgba(167, 139, 250, 0.8)',
          'rgba(196, 181, 253, 0.8)',
          'rgba(221, 214, 254, 0.8)',
          'rgba(237, 233, 254, 0.8)',
        ],
      },
    ],
  };

  const segmentChartData = {
    labels: overview?.customerSegmentation ? Object.keys(overview.customerSegmentation) : [],
    datasets: [
      {
        data: overview?.customerSegmentation ? Object.values(overview.customerSegmentation) : [],
        backgroundColor: [
          'rgba(124, 58, 237, 0.8)',
          'rgba(167, 139, 250, 0.8)',
          'rgba(196, 181, 253, 0.8)',
          'rgba(221, 214, 254, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-8 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
        Dashboard - 2025
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Toplam Müşteri"
          value={stats.totalCustomers.toLocaleString('tr-TR')}
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Toplam Randevu"
          value={stats.totalAppointments.toLocaleString('tr-TR')}
          icon={Calendar}
          color="purple"
        />
        <KPICard
          title="Toplam Gelir"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="purple"
        />
        <KPICard
          title="Ortalama Randevu Değeri"
          value={formatCurrency(
            stats.totalAppointments > 0
              ? stats.totalRevenue / stats.totalAppointments
              : 0
          )}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Aylık Randevu ve Gelir Trendi</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <Line data={monthlyChartData} options={lineChartOptions} />
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Aylık Gelir Dağılımı</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <Bar data={revenueChartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">En Çok Gelir Getiren Hizmetler (Top 5)</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <Bar data={serviceChartData} options={chartOptions} />
          )}
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Müşteri Segmentasyonu</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <Doughnut data={segmentChartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">Hizmet Sıralaması</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-100">
                  <th className="text-left py-2 text-purple-700 font-semibold">Hizmet</th>
                  <th className="text-right py-2 text-purple-700 font-semibold">Randevu</th>
                  <th className="text-right py-2 text-purple-700 font-semibold">Gelir</th>
                </tr>
              </thead>
              <tbody>
                {overview?.serviceRanking?.slice(0, 10).map((service) => (
                  <tr key={service.hizmet_id} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                    <td className="py-2 text-purple-600">{service.hizmet_ad}</td>
                    <td className="text-right py-2 text-purple-600">{service.appointments}</td>
                    <td className="text-right py-2 font-semibold text-purple-700">{formatCurrency(service.revenue)}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-purple-500">Veri yükleniyor...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">İlçe Sıralaması</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-100">
                  <th className="text-left py-2 text-purple-700 font-semibold">İlçe</th>
                  <th className="text-right py-2 text-purple-700 font-semibold">Randevu</th>
                  <th className="text-right py-2 text-purple-700 font-semibold">Gelir</th>
                </tr>
              </thead>
              <tbody>
                {overview?.districtRanking?.slice(0, 10).map((district) => (
                  <tr key={district.ilce_id} className="border-b border-purple-50 hover:bg-purple-50/50 transition-colors">
                    <td className="py-2 text-purple-600">{district.ilce_ad}</td>
                    <td className="text-right py-2 text-purple-600">{district.appointments}</td>
                    <td className="text-right py-2 font-semibold text-purple-700">{formatCurrency(district.revenue)}</td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-purple-500">Veri yükleniyor...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
