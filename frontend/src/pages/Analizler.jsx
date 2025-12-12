import { useState, useEffect } from 'react';
import { musteriService } from '../services/musteriService';
import { randevuService } from '../services/randevuService';
import { hizmetService } from '../services/hizmetService';
import { kampanyaService } from '../services/kampanyaService';
import { rakipService } from '../services/rakipService';
import { memnuniyetService } from '../services/memnuniyetService';
import { ilceService } from '../services/ilceService';
import { formatCurrency, formatDate } from '../utils/format';
import { Users, Sparkles, Building2, Gift, TrendingUp, Lightbulb } from 'lucide-react';
import CustomerAnalytics from '../components/charts/CustomerAnalytics';
import ServiceAnalytics from '../components/charts/ServiceAnalytics';
import CompetitorAnalytics from '../components/charts/CompetitorAnalytics';
import CampaignAnalytics from '../components/charts/CampaignAnalytics';
import MusteriIlceChart from '../components/charts/MusteriIlceChart';
import RandevuTrendChart from '../components/charts/RandevuTrendChart';

const tabs = [
  { id: 'musteri', label: 'Müşteri Analizi', icon: Users },
  { id: 'hizmet', label: 'Hizmet Performansı', icon: Sparkles },
  { id: 'rakip', label: 'Rakip Analizi', icon: Building2 },
  { id: 'kampanya', label: 'Kampanya Analizi', icon: Gift },
];

export default function Analizler() {
  const [activeTab, setActiveTab] = useState('musteri');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    customers: [],
    appointments: [],
    services: [],
    campaigns: [],
    competitors: [],
    satisfactions: [],
    districts: [],
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [customersRes, appointmentsRes, servicesRes, campaignsRes, competitorsRes, satisfactionsRes, districtsRes] = await Promise.all([
        musteriService.getAll({ limit: 10000 }),
        randevuService.getAll({ limit: 10000 }),
        hizmetService.getAll({ limit: 1000 }),
        kampanyaService.getAll(),
        rakipService.getAll({ limit: 1000 }),
        memnuniyetService.getAll({ limit: 1000 }),
        ilceService.getAll(),
      ]);

      setData({
        customers: customersRes.data.data || customersRes.data || [],
        appointments: appointmentsRes.data.data || appointmentsRes.data || [],
        services: servicesRes.data.data || servicesRes.data || [],
        campaigns: campaignsRes.data || [],
        competitors: competitorsRes.data.data || competitorsRes.data || [],
        satisfactions: satisfactionsRes.data.data || satisfactionsRes.data || [],
        districts: districtsRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
          Analizler
        </h1>
        <p className="text-purple-600/70">Kapsamlı iş analitiği ve karar destek raporları</p>
      </div>

      {/* Quick Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <MusteriIlceChart />
        <RandevuTrendChart />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 mb-6 overflow-hidden">
        <div className="flex flex-wrap border-b border-purple-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-4 font-semibold transition-all duration-200 relative ${
                  isActive
                    ? 'text-purple-700 bg-purple-50'
                    : 'text-purple-600 hover:bg-purple-50/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-purple-800"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'musteri' && <CustomerAnalytics data={data} />}
        {activeTab === 'hizmet' && <ServiceAnalytics data={data} />}
        {activeTab === 'rakip' && <CompetitorAnalytics data={data} />}
        {activeTab === 'kampanya' && <CampaignAnalytics data={data} />}
      </div>
    </div>
  );
}

