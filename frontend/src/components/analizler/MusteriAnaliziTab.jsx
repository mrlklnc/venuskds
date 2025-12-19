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
import { GRID_STYLE, AXIS_STYLE, TOOLTIP_STYLE, BAR_COLORS, getBarColor } from '../../styles/chartTheme';

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
        {/* Grafik A - Müşteri Sayısı (İlçe) */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
          <h3 className="text-base font-medium text-gray-800 mb-2">Müşteri Sayısı (İlçe)</h3>
          <p className="text-xs text-gray-500 mb-4">İlçe bazında müşteri dağılımı</p>
          {musteriData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={musteriData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid {...GRID_STYLE.premium} />
                <XAxis 
                  dataKey="ilce" 
                  tick={AXIS_STYLE.premium.tick}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  axisLine={AXIS_STYLE.premium.axisLine}
                  tickLine={AXIS_STYLE.premium.tickLine}
                />
                <YAxis 
                  tick={AXIS_STYLE.premium.tick}
                  axisLine={AXIS_STYLE.premium.axisLine}
                  tickLine={AXIS_STYLE.premium.tickLine}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE.premium.contentStyle}
                  labelStyle={TOOLTIP_STYLE.premium.labelStyle}
                  itemStyle={TOOLTIP_STYLE.premium.itemStyle}
                  cursor={TOOLTIP_STYLE.premium.cursor}
                  formatter={(value) => [`${value} müşteri`, '']}
                  labelFormatter={(label) => `📍 ${label}`}
                />
                <Bar dataKey="musteri_sayisi" name="Müşteri Sayısı" radius={[8, 8, 0, 0]}>
                  {(() => {
                    const maxValue = Math.max(...musteriData.map(item => item.musteri_sayisi || 0), 1);
                    return musteriData.map((entry, index) => {
                      const musteriSayisi = entry.musteri_sayisi || 0;
                      const isMax = musteriSayisi === maxValue;
                      const fillColor = getBarColor(musteriSayisi, maxValue, isMax);
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={fillColor}
                          style={{ filter: isMax ? 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.3))' : 'none' }}
                        />
                      );
                    });
                  })()}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Veri bulunamadı
            </div>
          )}
        </div>

        {/* Grafik B - Randevu Sayısı (İlçe) */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
          <h3 className="text-base font-medium text-gray-800 mb-2">Randevu Sayısı (İlçe)</h3>
          <p className="text-xs text-gray-500 mb-4">İlçe bazında randevu dağılımı</p>
          {randevuData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={randevuData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid {...GRID_STYLE.premium} />
                <XAxis 
                  dataKey="ilce_ad" 
                  tick={AXIS_STYLE.premium.tick}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  axisLine={AXIS_STYLE.premium.axisLine}
                  tickLine={AXIS_STYLE.premium.tickLine}
                />
                <YAxis 
                  tick={AXIS_STYLE.premium.tick}
                  axisLine={AXIS_STYLE.premium.axisLine}
                  tickLine={AXIS_STYLE.premium.tickLine}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE.premium.contentStyle}
                  labelStyle={TOOLTIP_STYLE.premium.labelStyle}
                  itemStyle={TOOLTIP_STYLE.premium.itemStyle}
                  cursor={TOOLTIP_STYLE.premium.cursor}
                  formatter={(value) => [`${value} randevu`, '']}
                  labelFormatter={(label) => `📍 ${label}`}
                />
                <Bar dataKey="randevu_sayisi" name="Randevu Sayısı" radius={[8, 8, 0, 0]}>
                  {(() => {
                    const maxValue = Math.max(...randevuData.map(item => item.randevu_sayisi || 0), 1);
                    return randevuData.map((entry, index) => {
                      const randevuSayisi = entry.randevu_sayisi || 0;
                      const isMax = randevuSayisi === maxValue;
                      const fillColor = getBarColor(randevuSayisi, maxValue, isMax);
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={fillColor}
                          style={{ filter: isMax ? 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.3))' : 'none' }}
                        />
                      );
                    });
                  })()}
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





