import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getBolgeselHizmetTalep } from '../../services/dssService';

// Mor tonlu renk paleti (mevcut tasarımla uyumlu)
const COLORS = [
  '#7c3aed', // purple-600
  '#a78bfa', // purple-400
  '#c4b5fd', // purple-300
  '#8b5cf6', // violet-500
  '#6366f1', // indigo-500
  '#818cf8', // indigo-400
  '#a5b4fc', // indigo-300
  '#9333ea', // purple-700
];

/**
 * Özel Tooltip bileşeni
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-purple-200">
        <p className="font-bold text-purple-700 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <p key={index} className="text-sm flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-sm inline-block" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700">{entry.name}:</span>
              <strong className="text-purple-600">{entry.value} randevu</strong>
            </p>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-purple-100">
          <p className="text-sm font-semibold text-purple-700">
            Toplam: {payload.reduce((sum, p) => sum + (p.value || 0), 0)} randevu
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function BolgeselHizmetTalepChart() {
  const [data, setData] = useState([]);
  const [hizmetler, setHizmetler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getBolgeselHizmetTalep();
        setData(result.data || []);
        setHizmetler(result.hizmetler || []);
      } catch (err) {
        console.error('Bölgesel hizmet talebi yüklenirken hata:', err);
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
          Bölgesel Hizmet Talebi
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
          Bölgesel Hizmet Talebi
        </h2>
        <div className="flex items-center justify-center h-64 text-purple-600">
          <p>{error || 'Henüz veri bulunamadı'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
      <h2 className="text-xl font-semibold mb-2 text-purple-700">
        Bölgesel Hizmet Talebi
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        İlçe bazında hizmet dağılımı (randevu sayısı)
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis 
            dataKey="ilce_ad" 
            tick={{ fill: '#6b5b95', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            tick={{ fill: '#6b5b95', fontSize: 12 }}
            label={{ 
              value: 'Randevu Sayısı', 
              angle: -90, 
              position: 'insideLeft',
              fill: '#6b5b95',
              fontSize: 12
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
          />
          {hizmetler.map((hizmet, index) => (
            <Bar
              key={hizmet}
              dataKey={hizmet}
              stackId="a"
              fill={COLORS[index % COLORS.length]}
              name={hizmet}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* En popüler hizmet özeti */}
      {data.length > 0 && hizmetler.length > 0 && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-sm text-purple-700">
            <strong>Özet:</strong> En yoğun ilçe{' '}
            <span className="font-bold text-purple-800">{data[0]?.ilce_ad}</span>{' '}
            ({data[0]?.toplam} toplam randevu). 
            {hizmetler.length > 0 && (
              <> Bu bölgede {hizmetler.length} farklı hizmet talep ediliyor.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}





