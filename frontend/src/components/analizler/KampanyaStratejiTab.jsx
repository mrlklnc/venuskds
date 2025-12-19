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
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { getKampanyaKarsilastirma, getAylikGelirTrendi, getKampanyalarArasiPerformans, getIlceBazliKampanyaKar } from '../../services/dssService';
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';
import { GRID_STYLE, AXIS_STYLE, TOOLTIP_STYLE } from '../../styles/chartTheme';

const KONAK_KAMPANYALI = '#7c3aed';
const KONAK_KAMPANYASIZ = '#a78bfa';
const OTHER_KAMPANYALI = '#c4b5fd';
const OTHER_KAMPANYASIZ = '#e9d5ff';

export default function KampanyaStratejiTab() {
  const [karsilastirmaData, setKarsilastirmaData] = useState([]);
  const [gelirTrendiData, setGelirTrendiData] = useState([]);
  const [kampanyaPerformansData, setKampanyaPerformansData] = useState([]);
  const [ilceKampanyaKarData, setIlceKampanyaKarData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [karsilastirmaRes, gelirTrendiRes, performansRes, ilceKarRes] = await Promise.all([
          getKampanyaKarsilastirma(),
          getAylikGelirTrendi(),
          getKampanyalarArasiPerformans(),
          getIlceBazliKampanyaKar()
        ]);
        setKarsilastirmaData(Array.isArray(karsilastirmaRes) ? karsilastirmaRes.slice(0, 10) : []);
        setGelirTrendiData(Array.isArray(gelirTrendiRes) ? gelirTrendiRes : []);
        setKampanyaPerformansData(Array.isArray(performansRes) ? performansRes : []);
        setIlceKampanyaKarData(Array.isArray(ilceKarRes) ? ilceKarRes : []);
      } catch (err) {
        console.error('Kampanya verisi yüklenemedi:', err);
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

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M ₺`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K ₺`;
    }
    return `${value} ₺`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isKonak = label === 'Konak';
      return (
        <div style={TOOLTIP_STYLE.premium.contentStyle}>
          <p style={TOOLTIP_STYLE.premium.labelStyle} className="flex items-center gap-1 mb-2">
            {isKonak && <MapPin className="w-4 h-4" />}
            📍 {label}
            {isKonak && <span className="text-xs bg-purple-200 px-2 py-0.5 rounded-full text-purple-800 ml-1">Mevcut Şube</span>}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={TOOLTIP_STYLE.premium.itemStyle}>
              {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const GelirTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={TOOLTIP_STYLE.premium.contentStyle}>
          <p style={TOOLTIP_STYLE.premium.labelStyle}>📅 {label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={TOOLTIP_STYLE.premium.itemStyle}>
              {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Kampanya etkisi hesapla
  const konakData = karsilastirmaData.find(d => d.ilce_ad === 'Konak');
  const konakKampanyaOrani = konakData 
    ? Math.round((konakData.kampanyali_randevu / (konakData.kampanyali_randevu + konakData.kampanyasiz_randevu)) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Açıklama */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
        <p className="text-purple-700 text-sm">
          Kampanyaların <strong>Konak</strong> ve diğer ilçelerdeki etkisi karşılaştırılır.
          <span className="inline-flex items-center ml-2 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
            <MapPin className="w-3 h-3 mr-1" /> Mevcut Şube
          </span>
        </p>
      </div>

      {/* Grafikler - Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik A - Kampanyalı vs Kampanyasız Randevu */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl shadow-sm border border-purple-100 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Kampanyalı vs Kampanyasız Randevu</h3>
          {karsilastirmaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={karsilastirmaData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
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
                <Tooltip content={<CustomTooltip />} cursor={TOOLTIP_STYLE.premium.cursor} />
                <Legend />
                <Bar 
                  dataKey="kampanyali_randevu" 
                  name="Kampanyalı" 
                  stackId="a"
                  radius={[0, 0, 0, 0]}
                >
                  {karsilastirmaData.map((entry, index) => (
                    <Cell 
                      key={`cell-k-${index}`} 
                      fill={entry.ilce_ad === 'Konak' ? KONAK_KAMPANYALI : OTHER_KAMPANYALI}
                    />
                  ))}
                </Bar>
                <Bar 
                  dataKey="kampanyasiz_randevu" 
                  name="Kampanyasız" 
                  stackId="a"
                  radius={[6, 6, 0, 0]}
                >
                  {karsilastirmaData.map((entry, index) => (
                    <Cell 
                      key={`cell-nk-${index}`} 
                      fill={entry.ilce_ad === 'Konak' ? KONAK_KAMPANYASIZ : OTHER_KAMPANYASIZ}
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

        {/* Grafik B - Kampanya Sonrası Gelir Değişimi */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl shadow-sm border border-purple-100 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aylık Gelir Trendi (Kampanya Etkisi)</h3>
          {gelirTrendiData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={gelirTrendiData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid {...GRID_STYLE.premium} />
                <XAxis 
                  dataKey="ay" 
                  tick={AXIS_STYLE.premium.tick}
                  axisLine={AXIS_STYLE.premium.axisLine}
                  tickLine={AXIS_STYLE.premium.tickLine}
                />
                <YAxis 
                  tick={AXIS_STYLE.premium.tick}
                  tickFormatter={(value) => formatCurrency(value)}
                  axisLine={AXIS_STYLE.premium.axisLine}
                  tickLine={AXIS_STYLE.premium.tickLine}
                />
                <Tooltip content={<GelirTooltip />} cursor={TOOLTIP_STYLE.premium.cursor} />
                <Legend />
                <Area 
                  type="monotone"
                  dataKey="kampanyali_gelir" 
                  name="Kampanyalı Gelir" 
                  stackId="1"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="#c4b5fd"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone"
                  dataKey="kampanyasiz_gelir" 
                  name="Kampanyasız Gelir" 
                  stackId="1"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fill="#ede9fe"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Veri bulunamadı
            </div>
          )}
        </div>
      </div>

      {/* Konak Kampanya Özeti */}
      {konakData && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5" />
            <span className="font-semibold">Konak - Kampanya Performansı</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-purple-200 text-xs">Kampanyalı Randevu</p>
              <p className="text-2xl font-bold">{konakData.kampanyali_randevu}</p>
            </div>
            <div>
              <p className="text-purple-200 text-xs">Kampanyasız Randevu</p>
              <p className="text-2xl font-bold">{konakData.kampanyasiz_randevu}</p>
            </div>
            <div>
              <p className="text-purple-200 text-xs">Kampanya Oranı</p>
              <p className="text-2xl font-bold">%{konakKampanyaOrani}</p>
            </div>
            <div>
              <p className="text-purple-200 text-xs">Toplam</p>
              <p className="text-2xl font-bold">
                {konakData.kampanyali_randevu + konakData.kampanyasiz_randevu}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Grafikler - Kampanyalar Arası Performans ve İlçe Bazlı Kâr */}
      {(kampanyaPerformansData.length > 0 || ilceKampanyaKarData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 items-stretch">
          {/* Grafik 1: Kampanyalar Arası Performans Karşılaştırması */}
          {kampanyaPerformansData.length > 0 ? (() => {
            // Performans metriğine göre yüksekten düşüğe sırala
            const sortedData = [...kampanyaPerformansData].sort((a, b) => 
              (b.performans_metriği || 0) - (a.performans_metriği || 0)
            );

            // Custom tick component - metni kelime bazlı böler ve alt satıra sarar
            const CustomXAxisTick = ({ x, y, payload }) => {
              const text = payload.value || '';
              // Kelime bazlı böl (max 2 satır)
              const words = text.split(' ');
              let lines = [];
              
              if (words.length <= 2) {
                // 2 kelime veya daha az: tek satır veya her kelime ayrı satırda
                if (text.length > 12) {
                  lines = words;
                } else {
                  lines = [text];
                }
              } else {
                // 3+ kelime: ilk satıra ilk 1-2 kelime, ikinci satıra geri kalanı
                const midPoint = Math.ceil(words.length / 2);
                lines = [
                  words.slice(0, midPoint).join(' '),
                  words.slice(midPoint).join(' ')
                ];
              }

              return (
                <g transform={`translate(${x},${y})`}>
                  {lines.map((line, index) => (
                    <text
                      key={index}
                      x={0}
                      y={index * 14}
                      dy={12}
                      textAnchor="middle"
                      fill="#5b21b6"
                      fontSize={11}
                      fontWeight={500}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            };

            return (
              <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl shadow-sm border border-purple-100 p-4">
                <h3 className="text-base font-medium text-gray-800 mb-2">Kampanyalar Arası Performans Karşılaştırması</h3>
                <p className="text-xs text-gray-500 mb-4">Gelir / Randevu oranı</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }} barCategoryGap="25%" barGap={5}>
                    <CartesianGrid {...GRID_STYLE.premium} />
                    <XAxis 
                      dataKey="kampanya_ad" 
                      tick={<CustomXAxisTick />}
                      height={60}
                      axisLine={AXIS_STYLE.premium.axisLine}
                      tickLine={AXIS_STYLE.premium.tickLine}
                      interval={0}
                    />
                    <YAxis 
                      tick={AXIS_STYLE.premium.tick}
                      axisLine={AXIS_STYLE.premium.axisLine}
                      tickLine={AXIS_STYLE.premium.tickLine}
                    />
                    <Tooltip 
                      cursor={TOOLTIP_STYLE.premium.cursor}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={TOOLTIP_STYLE.premium.contentStyle}>
                              <p style={TOOLTIP_STYLE.premium.labelStyle}>🎯 {data.kampanya_ad}</p>
                              <p style={TOOLTIP_STYLE.premium.itemStyle}>
                                Toplam Gelir: <span className="font-semibold">{formatCurrency(data.toplam_gelir)}</span>
                              </p>
                              <p style={TOOLTIP_STYLE.premium.itemStyle}>
                                Randevu Sayısı: <span className="font-semibold">{data.randevu_sayisi}</span>
                              </p>
                              <p style={TOOLTIP_STYLE.premium.itemStyle}>
                                Performans: <span className="font-semibold">{formatCurrency(data.performans_metriği)}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="performans_metriği" 
                      name="Performans Metriği (Gelir/Randevu)" 
                      fill="#7c3aed"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })() : null}

          {/* Grafik 2: İlçe Bazlı Kampanyaların Sağladığı Kâr */}
          {ilceKampanyaKarData.length > 0 ? (() => {
            // Veriyi ilçe bazında grupla ve her kampanya için ayrı bar oluştur
            const ilceMap = {};
            ilceKampanyaKarData.forEach(item => {
              if (!ilceMap[item.ilce_ad]) {
                ilceMap[item.ilce_ad] = {};
              }
              ilceMap[item.ilce_ad][item.kampanya_ad] = item.toplam_gelir;
            });

            // Tüm kampanya isimlerini topla
            const kampanyaIsimleri = [...new Set(ilceKampanyaKarData.map(item => item.kampanya_ad))];
            
            // Grafik için veri formatı ve toplam kâra göre sıralama
            const chartData = Object.keys(ilceMap).map(ilceAd => {
              const dataPoint = { ilce_ad: ilceAd };
              let toplamKar = 0;
              kampanyaIsimleri.forEach(kampanyaAd => {
                const kar = ilceMap[ilceAd][kampanyaAd] || 0;
                dataPoint[kampanyaAd] = kar;
                toplamKar += kar;
              });
              dataPoint._toplamKar = toplamKar; // Sıralama için geçici alan
              return dataPoint;
            });

            // Toplam kâra göre çoktan aza sırala
            chartData.sort((a, b) => (b._toplamKar || 0) - (a._toplamKar || 0));
            
            // Geçici alanı kaldır
            chartData.forEach(item => delete item._toplamKar);

            // Renk paleti (mor tonları)
            const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#e9d5ff', '#f3e8ff', '#ddd6fe'];

            return (
              <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl shadow-sm border border-purple-100 p-4">
                <h3 className="text-base font-medium text-gray-800 mb-2">İlçe Bazlı Kampanyaların Sağladığı Kâr</h3>
                <p className="text-xs text-gray-500 mb-4">Kampanya türlerine göre ilçe kârları</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid {...GRID_STYLE.premium} />
                    <XAxis 
                      dataKey="ilce_ad" 
                      tick={AXIS_STYLE.premium.tick}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      axisLine={AXIS_STYLE.premium.axisLine}
                      tickLine={AXIS_STYLE.premium.tickLine}
                    />
                    <YAxis 
                      tick={AXIS_STYLE.premium.tick}
                      tickFormatter={(value) => formatCurrency(value)}
                      axisLine={AXIS_STYLE.premium.axisLine}
                      tickLine={AXIS_STYLE.premium.tickLine}
                    />
                    <Tooltip 
                      cursor={TOOLTIP_STYLE.premium.cursor}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const isKonak = label === 'Konak';
                          return (
                            <div style={TOOLTIP_STYLE.premium.contentStyle}>
                              <p style={TOOLTIP_STYLE.premium.labelStyle} className="flex items-center gap-1 mb-2">
                                {isKonak && <MapPin className="w-4 h-4" />}
                                📍 {label}
                                {isKonak && <span className="text-xs bg-purple-200 px-2 py-0.5 rounded-full text-purple-800 ml-1">Mevcut Şube</span>}
                              </p>
                              {payload.map((entry, index) => (
                                <p key={index} style={TOOLTIP_STYLE.premium.itemStyle}>
                                  {entry.name}: <span className="font-semibold" style={{ color: entry.color }}>{formatCurrency(entry.value)}</span>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      wrapperStyle={{ paddingTop: '10px' }}
                    />
                    {kampanyaIsimleri.map((kampanyaAd, index) => (
                      <Bar 
                        key={kampanyaAd}
                        dataKey={kampanyaAd} 
                        name={kampanyaAd}
                        stackId="a"
                        fill={colors[index % colors.length]}
                        radius={index === kampanyaIsimleri.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })() : null}
        </div>
      )}
    </div>
  );
}


