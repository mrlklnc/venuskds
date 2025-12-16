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
  Legend
} from 'recharts';
import { getMusteriIlce, getIlceRandevu } from '../../services/dssService';
import { MapPin } from 'lucide-react';

const KONAK_COLOR = '#7c3aed'; // Mor - mevcut şube
const OTHER_COLOR = '#c4b5fd'; // Açık mor - diğer ilçeler

export default function MusteriAnaliziTab() {
  const [musteriData, setMusteriData] = useState([]);
  const [randevuData, setRandevuData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [musteriRes, randevuRes] = await Promise.all([
          getMusteriIlce(),
          getIlceRandevu()
        ]);
        setMusteriData(Array.isArray(musteriRes) ? musteriRes.slice(0, 10) : []);
        setRandevuData(Array.isArray(randevuRes) ? randevuRes.slice(0, 10) : []);
      } catch (err) {
        console.error('Müşteri analizi verisi yüklenemedi:', err);
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

  const hasData = musteriData.length > 0 || randevuData.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64 text-purple-600">
        <p>Bu analiz için henüz yeterli veri bulunmamaktadır.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isKonak = label === 'Konak';
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
          <p className="font-semibold text-purple-700 flex items-center gap-1">
            {isKonak && <MapPin className="w-4 h-4" />}
            {label}
            {isKonak && <span className="text-xs bg-purple-100 px-2 py-0.5 rounded-full ml-1">Mevcut Şube</span>}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-gray-700 text-sm">
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Açıklama */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
        <p className="text-purple-700 text-sm">
          <strong>Konak</strong> mevcut şube performansı referans alınarak ilçelerin potansiyeli karşılaştırılır.
          <span className="inline-flex items-center ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
            <MapPin className="w-3 h-3 mr-1" /> Mevcut Şube
          </span>
        </p>
      </div>

      {/* Grafikler - Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik A - İlçeye Göre Müşteri Sayısı */}
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">İlçeye Göre Müşteri Sayısı</h3>
          {musteriData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={musteriData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis 
                  dataKey="ilce" 
                  tick={{ fill: '#6b5b95', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#6b5b95', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="musteri_sayisi" name="Müşteri Sayısı" radius={[4, 4, 0, 0]}>
                  {musteriData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.ilce === 'Konak' ? KONAK_COLOR : OTHER_COLOR}
                      stroke={entry.ilce === 'Konak' ? '#5b21b6' : 'transparent'}
                      strokeWidth={entry.ilce === 'Konak' ? 2 : 0}
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
        </div>

        {/* Grafik B - İlçeye Göre Randevu Sayısı */}
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">İlçeye Göre Randevu Sayısı</h3>
          {randevuData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={randevuData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis 
                  dataKey="ilce_ad" 
                  tick={{ fill: '#6b5b95', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fill: '#6b5b95', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="randevu_sayisi" name="Randevu Sayısı" radius={[4, 4, 0, 0]}>
                  {randevuData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.ilce_ad === 'Konak' ? KONAK_COLOR : OTHER_COLOR}
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
        </div>
      </div>

      {/* Konak Referans Kartı */}
      {musteriData.find(d => d.ilce === 'Konak') && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5" />
            <span className="font-semibold">Konak - Mevcut Şube Performansı</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-purple-200 text-xs">Müşteri Sayısı</p>
              <p className="text-2xl font-bold">
                {musteriData.find(d => d.ilce === 'Konak')?.musteri_sayisi || 0}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-xs">Randevu Sayısı</p>
              <p className="text-2xl font-bold">
                {randevuData.find(d => d.ilce_ad === 'Konak')?.randevu_sayisi || 0}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-xs">Müşteri Sıralaması</p>
              <p className="text-2xl font-bold">
                #{musteriData.findIndex(d => d.ilce === 'Konak') + 1 || '-'}
              </p>
            </div>
            <div>
              <p className="text-purple-200 text-xs">Randevu Sıralaması</p>
              <p className="text-2xl font-bold">
                #{randevuData.findIndex(d => d.ilce_ad === 'Konak') + 1 || '-'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





