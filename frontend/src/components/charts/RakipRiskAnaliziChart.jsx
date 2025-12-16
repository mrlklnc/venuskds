import { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { getIlceUygunlukSkoru } from '../../services/dssService';

// Mor tonlu renk paleti - skora göre renklendirme
const getColorByScore = (score) => {
  if (score >= 70) return '#7c3aed'; // purple-600 - Yüksek fırsat
  if (score >= 50) return '#a78bfa'; // purple-400 - Orta fırsat
  if (score >= 30) return '#c4b5fd'; // purple-300 - Düşük fırsat
  return '#e9d5ff'; // purple-200 - Riskli
};

/**
 * Özel Tooltip bileşeni
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-purple-200">
        <p className="font-bold text-purple-700 mb-2">{data.ilce_ad}</p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-700">
            <span className="text-red-600">Rakip Sayısı:</span>{' '}
            <strong>{data.rakip_sayisi}</strong>
          </p>
          <p className="text-gray-700">
            <span className="text-green-600">Randevu Sayısı:</span>{' '}
            <strong>{data.randevu_sayisi}</strong>
          </p>
          <p className="text-gray-700">
            <span className="text-blue-600">Ort. Gelir:</span>{' '}
            <strong>{data.ortalama_gelir?.toLocaleString('tr-TR')} ₺</strong>
          </p>
          <p className="text-gray-700">
            <span className="text-purple-600">Uygunluk Skoru:</span>{' '}
            <strong>{data.uygunluk_skoru}/100</strong>
          </p>
        </div>
        <div className="mt-2 pt-2 border-t border-purple-100 text-xs">
          {data.randevu_sayisi > 50 && data.rakip_sayisi < 5 ? (
            <span className="text-green-600 font-semibold">✓ Yatırım fırsatı!</span>
          ) : data.rakip_sayisi > 8 ? (
            <span className="text-red-600 font-semibold">⚠ Yüksek rekabet riski</span>
          ) : (
            <span className="text-purple-600">Orta seviye fırsat</span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function RakipRiskAnaliziChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getIlceUygunlukSkoru();
        // Veriyi filtrele (en az 1 randevu olan ilçeler)
        const filteredData = Array.isArray(result) 
          ? result.filter(d => d.randevu_sayisi > 0)
          : [];
        setData(filteredData);
      } catch (err) {
        console.error('Rakip risk analizi yüklenirken hata:', err);
        setError('Veri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">
          Rakip Yoğunluğu & Risk Analizi
        </h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">
          Rakip Yoğunluğu & Risk Analizi
        </h2>
        <div className="flex items-center justify-center h-64 text-purple-600">
          <p>{error || 'Henüz veri bulunamadı'}</p>
        </div>
      </div>
    );
  }

  // Bubble boyutu için gelir aralığını hesapla
  const maxGelir = Math.max(...data.map(d => d.ortalama_gelir || 0), 1);
  const minGelir = Math.min(...data.map(d => d.ortalama_gelir || 0));

  // En iyi fırsat ilçesi (yüksek randevu, düşük rakip)
  const bestOpportunity = data.reduce((best, current) => {
    const currentScore = (current.randevu_sayisi || 0) - (current.rakip_sayisi || 0) * 10;
    const bestScore = (best?.randevu_sayisi || 0) - (best?.rakip_sayisi || 0) * 10;
    return currentScore > bestScore ? current : best;
  }, data[0]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
      <h2 className="text-xl font-semibold mb-2 text-purple-700">
        Rakip Yoğunluğu & Risk Analizi
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Bubble boyutu: Ortalama gelir | Renk: Uygunluk skoru
      </p>

      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis 
            type="number" 
            dataKey="rakip_sayisi" 
            name="Rakip Sayısı"
            tick={{ fill: '#6b5b95', fontSize: 12 }}
            label={{ 
              value: 'Rakip Sayısı', 
              position: 'insideBottom', 
              offset: -10,
              fill: '#6b5b95',
              fontSize: 12
            }}
          />
          <YAxis 
            type="number" 
            dataKey="randevu_sayisi" 
            name="Randevu Sayısı"
            tick={{ fill: '#6b5b95', fontSize: 12 }}
            label={{ 
              value: 'Randevu Sayısı', 
              angle: -90, 
              position: 'insideLeft',
              fill: '#6b5b95',
              fontSize: 12
            }}
          />
          <ZAxis 
            type="number" 
            dataKey="ortalama_gelir" 
            range={[100, 1000]} 
            name="Ortalama Gelir"
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="İlçeler" data={data}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getColorByScore(entry.uygunluk_skoru)}
                fillOpacity={0.8}
                stroke="#7c3aed"
                strokeWidth={1}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Renk legendı */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-purple-600"></span>
          <span className="text-gray-600">Yüksek Fırsat (70+)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-purple-400"></span>
          <span className="text-gray-600">Orta (50-70)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-purple-300"></span>
          <span className="text-gray-600">Düşük (30-50)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-purple-200"></span>
          <span className="text-gray-600">Riskli (&lt;30)</span>
        </div>
      </div>

      {/* Yorum ve öneri */}
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
        <p className="text-sm text-purple-700 font-medium mb-2">
          💡 Yüksek talep + düşük rekabet, yatırım fırsatını gösterir.
        </p>
        {bestOpportunity && (
          <p className="text-sm text-gray-600">
            <strong>En iyi fırsat:</strong>{' '}
            <span className="text-purple-800 font-semibold">{bestOpportunity.ilce_ad}</span>{' '}
            ({bestOpportunity.randevu_sayisi} randevu, {bestOpportunity.rakip_sayisi} rakip)
          </p>
        )}
      </div>
    </div>
  );
}





