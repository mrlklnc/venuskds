import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getIlceUygunlukSkoru } from '../../services/dssService';

/**
 * Özel Tooltip bileşeni - skorun hangi faktörlerden oluştuğunu gösterir
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-purple-200">
        <p className="font-bold text-purple-700 mb-2">{label}</p>
        <p className="text-2xl font-bold text-purple-600 mb-3">
          Skor: {data.uygunluk_skoru}/100
        </p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-700">
            <span className="text-green-600">+</span> Müşteri Sayısı: <strong>{data.musteri_sayisi}</strong>
          </p>
          <p className="text-gray-700">
            <span className="text-green-600">+</span> Randevu Sayısı: <strong>{data.randevu_sayisi}</strong>
          </p>
          <p className="text-gray-700">
            <span className="text-green-600">+</span> Ort. Gelir: <strong>{data.ortalama_gelir?.toLocaleString('tr-TR')} ₺</strong>
          </p>
          <p className="text-gray-700">
            <span className="text-red-600">−</span> Rakip Sayısı: <strong>{data.rakip_sayisi}</strong>
          </p>
        </div>
        <div className="mt-3 pt-2 border-t border-purple-100 text-xs text-gray-500">
          Yüksek müşteri/randevu, düşük rakip = Yüksek skor
        </div>
      </div>
    );
  }
  return null;
};

export default function IlceUygunlukSkoruChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getIlceUygunlukSkoru();
        // En yüksek skorlu 10 ilçeyi al
        const topIlceler = Array.isArray(result) ? result.slice(0, 10) : [];
        setData(topIlceler);
      } catch (err) {
        console.error('İlçe uygunluk skoru yüklenirken hata:', err);
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
          İlçe Uygunluk Skoru
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
          İlçe Uygunluk Skoru
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
        İlçe Uygunluk Skoru
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Yeni şube için en uygun ilçeler (0-100 skor)
      </p>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart 
          data={data} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis 
            type="number" 
            domain={[0, 100]}
            tick={{ fill: '#6b5b95', fontSize: 12 }}
          />
          <YAxis 
            type="category" 
            dataKey="ilce_ad" 
            tick={{ fill: '#6b5b95', fontSize: 12 }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="uygunluk_skoru"
            fill="#7c3aed"
            radius={[0, 6, 6, 0]}
            name="Uygunluk Skoru"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* En iyi ilçe özeti */}
      {data[0] && (
        <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-sm text-purple-700">
            <strong>Öneri:</strong> En yüksek uygunluk skoruna sahip ilçe{' '}
            <span className="font-bold text-purple-800">{data[0].ilce_ad}</span>{' '}
            ({data[0].uygunluk_skoru} puan). Bu ilçede{' '}
            {data[0].musteri_sayisi} müşteri, {data[0].randevu_sayisi} randevu bulunuyor
            ve {data[0].rakip_sayisi} rakip işletme mevcut.
          </p>
        </div>
      )}
    </div>
  );
}





