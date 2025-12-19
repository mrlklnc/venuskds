import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { getIlceRakip, getTalepRakipOrani } from '../../services/dssService';
import { MapPin, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { GRID_STYLE, AXIS_STYLE, TOOLTIP_STYLE, getBarColor } from '../../styles/chartTheme';

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
        // Simulasyon sayfası ile aynı normalize işlemi (TEK KAYNAK)
        const processedRakipData = Array.isArray(rakipRes) 
          ? rakipRes.slice(0, 10).map(item => ({
              ...item,
              normalize_rakip: item.normalize_rakip ?? item.gercek_rakip_sayisi ?? item.rakip_sayisi ?? 0
            }))
          : [];
        setRakipData(processedRakipData);
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
        {/* Grafik A - Rakip Sayısı (İlçe) */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
          <h3 className="text-base font-medium text-gray-800 mb-2">Rakip Sayısı (İlçe)</h3>
          <p className="text-xs text-gray-500 mb-4">İlçe bazında rakip dağılımı</p>
          {rakipData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rakipData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
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
                  formatter={(value) => [`${value} rakip`, '']}
                  labelFormatter={(label) => `📍 ${label}`}
                />
                <Bar dataKey="normalize_rakip" name="Rakip Sayısı" radius={[8, 8, 0, 0]}>
                  {(() => {
                    // Simulasyon sayfası ile aynı normalize_rakip alanını kullan (TEK KAYNAK)
                    const maxValue = Math.max(...rakipData.map(item => item.normalize_rakip || 0), 1);
                    return rakipData.map((entry, index) => {
                      const normalizeRakip = entry.normalize_rakip || 0;
                      const isMax = normalizeRakip === maxValue;
                      const fillColor = getBarColor(normalizeRakip, maxValue, isMax);
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

        {/* Grafik B - Talep / Rakip Oranı */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
          <h3 className="text-base font-medium text-gray-800 mb-2">Talep / Rakip Oranı</h3>
          <p className="text-xs text-gray-500 mb-4">Yatırım fırsatı göstergesi</p>
          {oranData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={oranData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
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
                  formatter={(value) => [`${Number(value).toFixed(2)} oran`, '']}
                  labelFormatter={(label) => `📊 ${label}`}
                />
                <Bar dataKey="talep_rakip_orani" name="Talep/Rakip Oranı" radius={[8, 8, 0, 0]}>
                  {(() => {
                    const maxValue = Math.max(...oranData.map(item => item.talep_rakip_orani || 0), 1);
                    return oranData.map((entry, index) => {
                      const oran = entry.talep_rakip_orani || 0;
                      const isMax = oran === maxValue;
                      const fillColor = getBarColor(oran, maxValue, isMax);
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





