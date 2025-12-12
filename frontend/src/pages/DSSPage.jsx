import { useState, useEffect } from 'react';
import { dssService } from '../services/dssService';
import { ilceService } from '../services/ilceService';
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
import { Bar, Doughnut } from 'react-chartjs-2';

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

export default function DSSPage() {
  const [activeTab, setActiveTab] = useState('best-district');
  const [bestDistrict, setBestDistrict] = useState(null);
  const [servicePerformance, setServicePerformance] = useState(null);
  const [campaignEffectiveness, setCampaignEffectiveness] = useState(null);
  const [satisfaction, setSatisfaction] = useState(null);
  const [districtDemand, setDistrictDemand] = useState(null);
  const [competitorAnalysis, setCompetitorAnalysis] = useState(null);
  const [branchROI, setBranchROI] = useState(null);
  const [selectedIlceId, setSelectedIlceId] = useState('');
  const [ilceler, setIlceler] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIlceler();
  }, []);

  const fetchIlceler = async () => {
    try {
      const response = await ilceService.getAll();
      setIlceler(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchBestDistrict = async () => {
    setLoading(true);
    try {
      const response = await dssService.getBestDistrict();
      setBestDistrict(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicePerformance = async () => {
    setLoading(true);
    try {
      const response = await dssService.getServicePerformance(2025);
      setServicePerformance(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignEffectiveness = async () => {
    setLoading(true);
    try {
      const response = await dssService.getCampaignEffectiveness();
      setCampaignEffectiveness(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSatisfaction = async () => {
    setLoading(true);
    try {
      const response = await dssService.getCustomerSatisfaction();
      setSatisfaction(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistrictDemand = async () => {
    setLoading(true);
    try {
      const response = await dssService.getDistrictDemand(2025);
      setDistrictDemand(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitorAnalysis = async () => {
    setLoading(true);
    try {
      const response = await dssService.getCompetitorAnalysis();
      setCompetitorAnalysis(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchROI = async () => {
    if (!selectedIlceId) return;
    setLoading(true);
    try {
      const response = await dssService.getBranchROI(selectedIlceId);
      setBranchROI(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'best-district', label: 'En İyi İlçe', fetch: fetchBestDistrict },
    { id: 'service-performance', label: 'Hizmet Performansı', fetch: fetchServicePerformance },
    { id: 'campaign', label: 'Kampanya Etkinliği', fetch: fetchCampaignEffectiveness },
    { id: 'satisfaction', label: 'Müşteri Memnuniyeti', fetch: fetchSatisfaction },
    { id: 'district-demand', label: 'İlçe Talebi', fetch: fetchDistrictDemand },
    { id: 'competitor', label: 'Rakip Analizi', fetch: fetchCompetitorAnalysis },
    { id: 'roi', label: 'Şube ROI', fetch: fetchBranchROI },
  ];

  const handleTabChange = (tabId, fetchFn) => {
    setActiveTab(tabId);
    if (fetchFn) fetchFn();
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Karar Destek Sistemi Sonuçları</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id, tab.fetch)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      )}

      {/* Best District */}
      {activeTab === 'best-district' && bestDistrict && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-semibold mb-4">En İyi İlçe Analizi</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {bestDistrict.bestDistricts?.slice(0, 3).map((district, idx) => (
                <div key={district.ilce_id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">#{idx + 1}</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {(district.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{district.ilce_ad}</h3>
                  <div className="mt-3 space-y-1 text-sm">
                    <p>Talep: {district.demand}</p>
                    <p>Gelir: {formatCurrency(district.revenue)}</p>
                    <p>Rakip: {district.competition}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">İlçe</th>
                    <th className="text-right py-2">Skor</th>
                    <th className="text-right py-2">Talep</th>
                    <th className="text-right py-2">Gelir</th>
                    <th className="text-right py-2">Rakip</th>
                  </tr>
                </thead>
                <tbody>
                  {bestDistrict.allDistricts?.map((district) => (
                    <tr key={district.ilce_id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{district.ilce_ad}</td>
                      <td className="text-right py-2">{(district.score * 100).toFixed(1)}%</td>
                      <td className="text-right py-2">{district.demand}</td>
                      <td className="text-right py-2">{formatCurrency(district.revenue)}</td>
                      <td className="text-right py-2">{district.competition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Service Performance */}
      {activeTab === 'service-performance' && servicePerformance && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold mb-4">Hizmet Performans Analizi</h2>
          <div className="mb-6">
            <Bar
              data={{
                labels: servicePerformance.top5ByRevenue?.map(s => s.hizmet_ad) || [],
                datasets: [{
                  label: 'Gelir (TL)',
                  data: servicePerformance.top5ByRevenue?.map(s => s.totalRevenue) || [],
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                }],
              }}
              options={chartOptions}
            />
          </div>
        </div>
      )}

      {/* Campaign Effectiveness */}
      {activeTab === 'campaign' && campaignEffectiveness && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold mb-4">Kampanya Etkinlik Analizi</h2>
          <div className="mb-6">
            <Bar
              data={{
                labels: campaignEffectiveness.campaigns?.map(c => c.kampanya_ad) || [],
                datasets: [{
                  label: 'Gelir (TL)',
                  data: campaignEffectiveness.campaigns?.map(c => c.totalRevenue) || [],
                  backgroundColor: 'rgba(34, 197, 94, 0.8)',
                }],
              }}
              options={chartOptions}
            />
          </div>
        </div>
      )}

      {/* Customer Satisfaction */}
      {activeTab === 'satisfaction' && satisfaction && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Ortalama Puan</h3>
            <div className="text-4xl font-bold text-blue-600 mb-4">
              {satisfaction.averageScore?.toFixed(2)} / 5.0
            </div>
            <p className="text-sm text-gray-600">Toplam {satisfaction.totalReviews} değerlendirme</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Puan Dağılımı</h3>
            <Doughnut
              data={{
                labels: ['5 Yıldız', '4 Yıldız', '3 Yıldız', '2 Yıldız', '1 Yıldız'],
                datasets: [{
                  data: [
                    satisfaction.distribution?.[5] || 0,
                    satisfaction.distribution?.[4] || 0,
                    satisfaction.distribution?.[3] || 0,
                    satisfaction.distribution?.[2] || 0,
                    satisfaction.distribution?.[1] || 0,
                  ],
                  backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(156, 163, 175, 0.8)',
                  ],
                }],
              }}
              options={chartOptions}
            />
          </div>
        </div>
      )}

      {/* Branch ROI */}
      {activeTab === 'roi' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold mb-4">Yeni Şube ROI Analizi</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İlçe Seçin:
            </label>
            <div className="flex gap-4">
              <select
                value={selectedIlceId}
                onChange={(e) => setSelectedIlceId(e.target.value)}
                className="border rounded-lg px-4 py-2 flex-1"
              >
                <option value="">İlçe seçin...</option>
                {ilceler.map(ilce => (
                  <option key={ilce.ilce_id} value={ilce.ilce_id}>{ilce.ilce_ad}</option>
                ))}
              </select>
              <button
                onClick={fetchBranchROI}
                disabled={!selectedIlceId || loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Analiz Et
              </button>
            </div>
          </div>
          {branchROI && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Beklenen Yıllık Gelir</p>
                  <p className="text-2xl font-bold">{formatCurrency(branchROI.projections?.expectedAnnualRevenue || 0)}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">Beklenen Yıllık Kar</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(branchROI.projections?.expectedAnnualProfit || 0)}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600">ROI</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {branchROI.projections?.roi || 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
