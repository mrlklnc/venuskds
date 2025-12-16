import { useState, useEffect } from 'react';
import { 
  getMusteriIlce, 
  getAylikRandevu
} from '../services/dssService';
import AnalyticsSummary from '../components/AnalyticsSummary';
import MusteriAnaliziTab from '../components/analizler/MusteriAnaliziTab';
import HizmetPerformansiTab from '../components/analizler/HizmetPerformansiTab';
import KampanyaStratejiTab from '../components/analizler/KampanyaStratejiTab';
import RakipRiskTab from '../components/analizler/RakipRiskTab';
import IlceUygunlukSkoruBölüm from '../components/analizler/IlceUygunlukSkoruBölüm';
import { Users, Sparkles, Target, Building2 } from 'lucide-react';

export default function Analizler() {
  const [activeTab, setActiveTab] = useState('musteri');
  const [musteriIlceData, setMusteriIlceData] = useState([]);
  const [aylikRandevuData, setAylikRandevuData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      const [musteriIlceRes, aylikRandevuRes] = await Promise.all([
        getMusteriIlce().catch(() => []),
        getAylikRandevu().catch(() => [])
      ]);

      setMusteriIlceData(Array.isArray(musteriIlceRes) ? musteriIlceRes : []);
      setAylikRandevuData(Array.isArray(aylikRandevuRes) ? aylikRandevuRes : []);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'musteri', label: 'Müşteri Analizi', icon: Users },
    { id: 'hizmet', label: 'Hizmet Performansı', icon: Sparkles },
    { id: 'kampanya', label: 'Kampanya & Strateji', icon: Target },
    { id: 'rakip', label: 'Rakip & Risk Analizi', icon: Building2 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'musteri':
        return <MusteriAnaliziTab />;
      case 'hizmet':
        return <HizmetPerformansiTab />;
      case 'kampanya':
        return <KampanyaStratejiTab />;
      case 'rakip':
        return <RakipRiskTab />;
      default:
        return <MusteriAnaliziTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Karar Destek Analizleri</h1>
        <p className="text-gray-600">Detaylı analiz ve raporlar</p>
        <p className="text-purple-600 mt-2 text-sm">
          Bu sayfa, yeni şube açma kararını desteklemek için mevcut verileri bir araya getirir. 
          <span className="font-semibold ml-1">Konak</span> ilçesi mevcut şube olarak referans alınır.
        </p>
      </div>

      {/* Analytics Summary - KPI Kartları */}
      <AnalyticsSummary
        musteriIlceData={musteriIlceData}
        aylikRandevuData={aylikRandevuData}
      />

      {/* Sekmeli Yapı */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        {/* Sekme Başlıkları */}
        <div className="flex flex-wrap border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-4 font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'text-purple-600'
                    : 'text-gray-600 hover:text-purple-500 hover:bg-purple-50/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                {/* Aktif Sekme Alt Çizgisi */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Sekme İçeriği */}
        <div className="p-4 md:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>

      {/* İlçe Uygunluk Skoru Bölümü */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 md:p-6">
        <IlceUygunlukSkoruBölüm />
      </div>
    </div>
  );
}
