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
        <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
          <p className="font-semibold text-purple-700 flex items-center gap-1 mb-2">
            {isKonak && <MapPin className="w-4 h-4" />}
            {label}
            {isKonak && <span className="text-xs bg-purple-100 px-2 py-0.5 rounded-full">Mevcut Şube</span>}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
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
        <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
          <p className="font-semibold text-purple-700 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{formatCurrency(entry.value)}</span>
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
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Kampanyalı vs Kampanyasız Randevu</h3>
          {karsilastirmaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={karsilastirmaData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
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
                  radius={[4, 4, 0, 0]}
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
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aylık Gelir Trendi (Kampanya Etkisi)</h3>
          {gelirTrendiData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={gelirTrendiData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis 
                  dataKey="ay" 
                  tick={{ fill: '#6b5b95', fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: '#6b5b95', fontSize: 12 }} 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<GelirTooltip />} />
                <Legend />
                <Area 
                  type="monotone"
                  dataKey="kampanyali_gelir" 
                  name="Kampanyalı Gelir" 
                  stackId="1"
                  stroke="#7c3aed"
                  fill="#c4b5fd"
                />
                <Area 
                  type="monotone"
                  dataKey="kampanyasiz_gelir" 
                  name="Kampanyasız Gelir" 
                  stackId="1"
                  stroke="#a78bfa"
                  fill="#ede9fe"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Grafik 1: Kampanyalar Arası Performans Karşılaştırması */}
          {kampanyaPerformansData.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Kampanyalar Arası Performans Karşılaştırması</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kampanyaPerformansData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                  <XAxis 
                    dataKey="kampanya_ad" 
                    tick={{ fill: '#6b5b95', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fill: '#6b5b95', fontSize: 12 }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
                            <p className="font-semibold text-purple-700 mb-2">{data.kampanya_ad}</p>
                            <p className="text-sm text-gray-600">
                              Toplam Gelir: <span className="font-semibold">{formatCurrency(data.toplam_gelir)}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Randevu Sayısı: <span className="font-semibold">{data.randevu_sayisi}</span>
                            </p>
                            <p className="text-sm text-purple-600">
                              Performans Metriği: <span className="font-semibold">{formatCurrency(data.performans_metriği)}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="performans_metriği" 
                    name="Performans Metriği (Gelir/Randevu)" 
                    fill="#7c3aed"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

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
            
            // Grafik için veri formatı
            const chartData = Object.keys(ilceMap).map(ilceAd => {
              const dataPoint = { ilce_ad: ilceAd };
              kampanyaIsimleri.forEach(kampanyaAd => {
                dataPoint[kampanyaAd] = ilceMap[ilceAd][kampanyaAd] || 0;
              });
              return dataPoint;
            });

            // Renk paleti (mor tonları)
            const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#e9d5ff', '#f3e8ff', '#ddd6fe'];

            return (
              <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">İlçe Bazlı Kampanyaların Sağladığı Kâr</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                    <XAxis 
                      dataKey="ilce_ad" 
                      tick={{ fill: '#6b5b95', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: '#6b5b95', fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const isKonak = label === 'Konak';
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
                              <p className="font-semibold text-purple-700 flex items-center gap-1 mb-2">
                                {isKonak && <MapPin className="w-4 h-4" />}
                                {label}
                                {isKonak && <span className="text-xs bg-purple-100 px-2 py-0.5 rounded-full">Mevcut Şube</span>}
                              </p>
                              {payload.map((entry, index) => (
                                <p key={index} className="text-sm" style={{ color: entry.color }}>
                                  {entry.name}: <span className="font-semibold">{formatCurrency(entry.value)}</span>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    {kampanyaIsimleri.map((kampanyaAd, index) => (
                      <Bar 
                        key={kampanyaAd}
                        dataKey={kampanyaAd} 
                        name={kampanyaAd}
                        stackId="a"
                        fill={colors[index % colors.length]}
                        radius={index === kampanyaIsimleri.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
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





