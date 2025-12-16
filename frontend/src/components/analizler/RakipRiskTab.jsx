import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { getIlceRakip, getTalepRakipOrani } from '../../services/dssService';
import { MapPin, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function RakipRiskTab() {
  const [rakipData, setRakipData] = useState([]);
  const [oranData, setOranData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rakipRes, oranRes] = await Promise.all([
          getIlceRakip(),
          getTalepRakipOrani()
        ]);
        setRakipData(Array.isArray(rakipRes) ? rakipRes.slice(0, 10) : []);
        setOranData(Array.isArray(oranRes) ? oranRes.slice(0, 10) : []);
      } catch (err) {
        console.error('Rakip verisi yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const hasData = rakipData.length > 0 || oranData.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64 text-purple-600">
        <p>Bu analiz için henüz yeterli veri bulunmamaktadır.</p>
      </div>
    );
  }

  // Rakip sayısına göre renk belirleme
  const getRakipColor = (rakipSayisi, isKonak) => {
    if (isKonak) return '#7c3aed'; // Konak mor
    if (rakipSayisi >= 5) return '#581c87'; // Çok rakip - koyu mor
    if (rakipSayisi >= 3) return '#7c3aed'; // Orta rakip - mor
    return '#c4b5fd'; // Az rakip - açık mor
  };

  // Talep/Rakip oranına göre renk (yüksek oran = düşük risk = yeşilimsi)
  const getOranColor = (oran, isKonak) => {
    if (isKonak) return '#7c3aed';
    if (oran >= 50) return '#059669'; // Düşük risk - yeşil
    if (oran >= 20) return '#7c3aed'; // Orta risk - mor
    return '#dc2626'; // Yüksek risk - kırmızı
  };

  const RakipTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isKonak = label === 'Konak';
      const rakipSayisi = payload[0].value;
      let riskSeviyesi = 'Düşük';
      let riskColor = 'text-green-600';
      if (rakipSayisi >= 5) {
        riskSeviyesi = 'Yüksek';
        riskColor = 'text-red-600';
      } else if (rakipSayisi >= 3) {
        riskSeviyesi = 'Orta';
        riskColor = 'text-yellow-600';
      }

      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
          <p className="font-semibold text-purple-700 flex items-center gap-1 mb-2">
            {isKonak && <MapPin className="w-4 h-4" />}
            {label}
            {isKonak && <span className="text-xs bg-purple-100 px-2 py-0.5 rounded-full">Mevcut Şube</span>}
          </p>
          <p className="text-gray-700 text-sm">
            Rakip Sayısı: <span className="font-semibold">{rakipSayisi}</span>
          </p>
          <p className={`text-sm ${riskColor} font-medium`}>
            Rekabet Seviyesi: {riskSeviyesi}
          </p>
        </div>
      );
    }
    return null;
  };

  const OranTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isKonak = label === 'Konak';
      const oran = payload[0].payload.talep_rakip_orani;
      let risk = 'Yüksek Risk';
      let riskColor = 'text-red-600';
      let RiskIcon = AlertTriangle;
      if (oran >= 50) {
        risk = 'Düşük Risk';
        riskColor = 'text-green-600';
        RiskIcon = CheckCircle;
      } else if (oran >= 20) {
        risk = 'Orta Risk';
        riskColor = 'text-yellow-600';
        RiskIcon = TrendingUp;
      }

      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
          <p className="font-semibold text-purple-700 flex items-center gap-1 mb-2">
            {isKonak && <MapPin className="w-4 h-4" />}
            {label}
            {isKonak && <span className="text-xs bg-purple-100 px-2 py-0.5 rounded-full">Mevcut Şube</span>}
          </p>
          <p className="text-gray-700 text-sm">
            Talep/Rakip Oranı: <span className="font-semibold">{oran}</span>
          </p>
          <p className="text-gray-700 text-sm">
            Randevu: {payload[0].payload.randevu_sayisi} | Rakip: {payload[0].payload.rakip_sayisi}
          </p>
          <p className={`text-sm ${riskColor} font-medium flex items-center gap-1 mt-1`}>
            <RiskIcon className="w-4 h-4" />
            {risk}
          </p>
        </div>
      );
    }
    return null;
  };

  // En düşük riskli ilçeler (Konak hariç)
  const lowRiskDistricts = oranData
    .filter(d => d.ilce_ad !== 'Konak' && d.talep_rakip_orani >= 20)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Açıklama */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
        <p className="text-purple-700 text-sm">
          <strong>Konak</strong> dışındaki ilçelerin rekabet ve risk durumu değerlendirilir. 
          Yüksek talep/rakip oranı, daha düşük yatırım riski anlamına gelir.
        </p>
      </div>

      {/* Grafikler - Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik A - İlçeye Göre Rakip Sayısı */}
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">İlçeye Göre Rakip Sayısı</h3>
          {rakipData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rakipData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis 
                  dataKey="ilce_ad" 
                  tick={{ fill: '#6b5b95', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#6b5b95', fontSize: 12 }} />
                <Tooltip content={<RakipTooltip />} />
                <Bar dataKey="rakip_sayisi" name="Rakip Sayısı" radius={[4, 4, 0, 0]}>
                  {rakipData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getRakipColor(entry.rakip_sayisi, entry.ilce_ad === 'Konak')}
                      stroke={entry.ilce_ad === 'Konak' ? '#5b21b6' : 'transparent'}
                      strokeWidth={entry.ilce_ad === 'Konak' ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Veri bulunamadı
            </div>
          )}
          {/* Renk Açıklaması */}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#c4b5fd' }}></div>
              <span className="text-gray-600">Az Rakip</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#7c3aed' }}></div>
              <span className="text-gray-600">Orta</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#581c87' }}></div>
              <span className="text-gray-600">Çok Rakip</span>
            </div>
          </div>
        </div>

        {/* Grafik B - Talep / Rakip Oranı */}
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Talep / Rakip Oranı (Yatırım Fırsatı)</h3>
          {oranData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={oranData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis 
                  dataKey="ilce_ad" 
                  tick={{ fill: '#6b5b95', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#6b5b95', fontSize: 12 }} />
                <Tooltip content={<OranTooltip />} />
                <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Orta Risk', fill: '#f59e0b', fontSize: 10 }} />
                <ReferenceLine y={50} stroke="#059669" strokeDasharray="3 3" label={{ value: 'Düşük Risk', fill: '#059669', fontSize: 10 }} />
                <Bar dataKey="talep_rakip_orani" name="Talep/Rakip Oranı" radius={[4, 4, 0, 0]}>
                  {oranData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getOranColor(entry.talep_rakip_orani, entry.ilce_ad === 'Konak')}
                      stroke={entry.ilce_ad === 'Konak' ? '#5b21b6' : 'transparent'}
                      strokeWidth={entry.ilce_ad === 'Konak' ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Veri bulunamadı
            </div>
          )}
          {/* Renk Açıklaması */}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }}></div>
              <span className="text-gray-600">Yüksek Risk</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#7c3aed' }}></div>
              <span className="text-gray-600">Orta Risk</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#059669' }}></div>
              <span className="text-gray-600">Düşük Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Düşük Riskli İlçeler */}
      {lowRiskDistricts.length > 0 && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Yatırım Fırsatı - Düşük Riskli İlçeler</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {lowRiskDistricts.map((item, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-3">
                <p className="font-semibold text-lg">{item.ilce_ad}</p>
                <p className="text-green-200 text-sm">Talep/Rakip: {item.talep_rakip_orani}</p>
                <p className="text-green-200 text-xs">{item.randevu_sayisi} randevu / {item.rakip_sayisi} rakip</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}





