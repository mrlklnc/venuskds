import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  getEnKarliHizmetler, 
  getKonakKarsilastirma 
} from '../../services/dssService';
import { MapPin, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { GRID_STYLE, AXIS_STYLE, TOOLTIP_STYLE } from '../../styles/chartTheme';

// Mor tonlu renk paleti (birbirinden ayırt edilebilir)
const PIE_COLORS = [
  '#7c3aed', // Koyu mor
  '#8b5cf6', // Mor
  '#a78bfa', // Orta mor
  '#c4b5fd', // Açık mor
  '#ddd6fe', // Çok açık mor
  '#9ca3af', // Gri (Diğer için)
];

const KONAK_COLOR = '#7c3aed';
const DIGER_COLOR = '#c4b5fd';

export default function HizmetPerformansiTab() {
  const [karliHizmetler, setKarliHizmetler] = useState([]);
  const [konakKarsilastirma, setKonakKarsilastirma] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [karliRes, konakRes] = await Promise.all([
          getEnKarliHizmetler(),
          getKonakKarsilastirma()
        ]);
        // ✅ Çoktan aza sırala (toplam_gelir)
        const karliSorted = Array.isArray(karliRes) 
          ? [...karliRes].sort((a, b) => (Number(b.toplam_gelir) || 0) - (Number(a.toplam_gelir) || 0))
          : [];
        setKarliHizmetler(karliSorted);
        
        // ✅ Çoktan aza sırala (konak_gelir veya toplam)
        const konakSorted = Array.isArray(konakRes)
          ? [...konakRes].sort((a, b) => {
              const aTotal = (Number(a.konak_gelir) || 0) + (Number(a.diger_ilceler_ortalama) || 0);
              const bTotal = (Number(b.konak_gelir) || 0) + (Number(b.diger_ilceler_ortalama) || 0);
              return bTotal - aTotal;
            })
          : [];
        setKonakKarsilastirma(konakSorted);
      } catch (err) {
        console.error('Hizmet performans verisi yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Para formatı
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Kısa para formatı
  const formatShortCurrency = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  // Yüzde hesaplama
  const getTotalGelir = () => karliHizmetler.reduce((sum, item) => sum + item.toplam_gelir, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const hasData = karliHizmetler.length > 0 || konakKarsilastirma.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-64 text-purple-600">
        <p>Hizmet performansı analizi için yeterli veri bulunamadı.</p>
      </div>
    );
  }

  // Pie Chart Custom Label
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    if (percent < 0.05) return null; // %5'ten küçükse label gösterme
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Pie Tooltip - Premium Style
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = getTotalGelir();
      const percent = ((data.toplam_gelir / total) * 100).toFixed(1);
      return (
        <div style={{
          ...TOOLTIP_STYLE.premium.contentStyle,
          minWidth: '160px'
        }}>
          <p style={TOOLTIP_STYLE.premium.labelStyle}>💎 {data.hizmet_ad}</p>
          <p style={TOOLTIP_STYLE.premium.itemStyle}>
            Gelir: <span className="font-semibold">{formatCurrency(data.toplam_gelir)}</span>
          </p>
          <p style={TOOLTIP_STYLE.premium.itemStyle}>
            Pay: <span className="font-semibold">%{percent}</span>
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {data.toplam_randevu} randevu
          </p>
        </div>
      );
    }
    return null;
  };

  // Bar Tooltip - Premium Style
  const BarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={TOOLTIP_STYLE.premium.contentStyle}>
          <p style={TOOLTIP_STYLE.premium.labelStyle} className="flex items-center gap-1 mb-2">
            📍 {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={TOOLTIP_STYLE.premium.itemStyle} className="flex items-center gap-1">
              {entry.name === 'Konak (Mevcut Şube)' && <MapPin className="w-3 h-3" />}
              {entry.name}: <span className="font-semibold">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Karar özeti hesaplamaları
  const enKarliHizmet = karliHizmetler.filter(h => h.hizmet_ad !== 'Diğer')[0];
  const konakGucluhizmet = konakKarsilastirma
    .filter(k => k.konak_gelir > k.diger_ilceler_ortalama)
    .sort((a, b) => (b.konak_gelir - b.diger_ilceler_ortalama) - (a.konak_gelir - a.diger_ilceler_ortalama))[0];
  const firsatHizmet = konakKarsilastirma
    .filter(k => k.diger_ilceler_ortalama > k.konak_gelir)
    .sort((a, b) => (b.diger_ilceler_ortalama - b.konak_gelir) - (a.diger_ilceler_ortalama - a.konak_gelir))[0];

  return (
    <div className="space-y-6">
      {/* Açıklama */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-purple-700 text-sm">
            <strong>Konak</strong> mevcut ve tek şube olarak referans alınır. 
            Gelir paylarına ve karşılaştırmalara bakarak yeni şube için stratejik kararlar verebilirsiniz.
          </p>
        </div>
      </div>

      {/* GRAFİKLER - YAN YANA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Grafik 1: Hizmet Gelir Payı (Donut Chart) */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl shadow-sm border border-purple-100 p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Hizmet Gelir Payı</h3>
            <p className="text-xs text-gray-500 mt-1">Toplam gelire göre hizmet dağılımı</p>
          </div>
          
          {karliHizmetler.length > 0 ? (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={karliHizmetler}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="toplam_gelir"
                    paddingAngle={2}
                  >
                    {karliHizmetler.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {karliHizmetler.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-gray-700">{item.hizmet_ad}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Veri bulunamadı
            </div>
          )}
        </div>

        {/* Grafik 2: Konak vs Diğer İlçeler */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl shadow-sm border border-purple-100 p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Konak vs Diğer İlçeler</h3>
            <p className="text-xs text-gray-500 mt-1">Hizmet bazlı performans karşılaştırması</p>
          </div>
          
          {konakKarsilastirma.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={konakKarsilastirma.slice(0, 6)} 
                margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
              >
                <CartesianGrid {...GRID_STYLE.premium} />
                <XAxis 
                  dataKey="hizmet_ad" 
                  tick={AXIS_STYLE.premium.tick}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0}
                  axisLine={AXIS_STYLE.premium.axisLine}
                  tickLine={AXIS_STYLE.premium.tickLine}
                />
                <YAxis 
                  tick={AXIS_STYLE.premium.tick}
                  tickFormatter={formatShortCurrency}
                  axisLine={AXIS_STYLE.premium.axisLine}
                  tickLine={AXIS_STYLE.premium.tickLine}
                />
                <Tooltip content={<BarTooltip />} />
                <Legend 
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar 
                  dataKey="konak_gelir" 
                  name="Konak (Mevcut Şube)" 
                  fill={KONAK_COLOR}
                  radius={[6, 6, 0, 0]}
                />
                <Bar 
                  dataKey="diger_ilceler_ortalama" 
                  name="Diğer İlçeler (Ort.)" 
                  fill={DIGER_COLOR}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Veri bulunamadı
            </div>
          )}
        </div>
      </div>

      {/* KARAR ÖZETİ KARTLARI */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5" />
          <span className="font-semibold text-lg">Karar Özeti</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* En Karlı Hizmet */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-300" />
              <p className="text-purple-200 text-xs font-medium">En Karlı Hizmet</p>
            </div>
            <p className="font-bold text-xl mb-1">{enKarliHizmet?.hizmet_ad || '-'}</p>
            <p className="text-purple-200 text-sm">{formatCurrency(enKarliHizmet?.toplam_gelir)}</p>
            <p className="text-purple-300 text-xs mt-1">
              Yeni şubede öncelikli hizmet
            </p>
          </div>

          {/* Konak'ta Güçlü */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-purple-300" />
              <p className="text-purple-200 text-xs font-medium">Konak'ta Güçlü Hizmet</p>
            </div>
            <p className="font-bold text-xl mb-1">{konakGucluhizmet?.hizmet_ad || '-'}</p>
            {konakGucluhizmet && (
              <>
                <p className="text-green-300 text-sm">
                  +{formatCurrency(konakGucluhizmet.konak_gelir - konakGucluhizmet.diger_ilceler_ortalama)}
                </p>
                <p className="text-purple-300 text-xs mt-1">
                  Konak'ın rekabet avantajı
                </p>
              </>
            )}
          </div>

          {/* Diğer İlçelerde Fırsat */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-300" />
              <p className="text-purple-200 text-xs font-medium">Diğer İlçelerde Fırsat</p>
            </div>
            <p className="font-bold text-xl mb-1">{firsatHizmet?.hizmet_ad || '-'}</p>
            {firsatHizmet && (
              <>
                <p className="text-yellow-300 text-sm">
                  +{formatCurrency(firsatHizmet.diger_ilceler_ortalama - firsatHizmet.konak_gelir)}
                </p>
                <p className="text-purple-300 text-xs mt-1">
                  Yeni şube için potansiyel
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
