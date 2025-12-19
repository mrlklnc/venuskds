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
import { getIlceUygunlukSkoruAnalizler } from '../../services/dssService';
import { Award, Target } from 'lucide-react';

const HIGHEST_SCORE_COLOR = '#7c3aed'; // Koyu mor - en yüksek skor
const OTHER_SCORE_COLOR = '#c4b5fd';   // Açık mor - diğerleri

export default function IlceUygunlukSkoruBölüm() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const analizlerRes = await getIlceUygunlukSkoruAnalizler().catch(() => []);
        setChartData(Array.isArray(analizlerRes) ? analizlerRes : []);
      } catch (err) {
        console.error('İlçe uygunluk skoru yüklenemedi:', err);
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

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="space-y-4">
      {/* Başlık Skeleton */}
      <div className="flex items-start gap-3">
        <div className="bg-purple-100 p-2 rounded-lg">
          <Target className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-full max-w-md animate-pulse"></div>
        </div>
      </div>

      {/* Grafik ve Kart Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-purple-100 p-4">
          <div className="mb-4">
            <div className="h-5 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-[320px] bg-gray-100 rounded animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-sm">Yükleniyor...</div>
          </div>
        </div>

        {/* Kart Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg border border-purple-200 p-6 h-full">
            <div className="h-5 bg-white/20 rounded w-32 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              <div>
                <div className="h-3 bg-white/20 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-8 bg-white/20 rounded w-full mb-3 animate-pulse"></div>
                <div className="h-10 bg-white/20 rounded w-32 animate-pulse"></div>
              </div>
              <div className="pt-4 border-t border-white/20">
                <div className="space-y-2">
                  <div className="h-3 bg-white/20 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-white/20 rounded w-5/6 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }


  return (
    <div className="space-y-4">
      {/* Başlık ve Açıklama */}
      <div className="flex items-start gap-3">
        <div className="bg-purple-100 p-2 rounded-lg">
          <Target className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">İlçe Uygunluk Skoru</h3>
          <p className="text-sm text-gray-600 mt-1">
            Yeni şube açmak için en uygun ilçeler. <span className="text-purple-600 font-medium">Konak</span> mevcut şube olarak referans alınmıştır.
          </p>
        </div>
      </div>

      {/* Grafik ve Karar Yorumu - Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik - 2/3 genişlik */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
          <div className="mb-4">
            <h4 className="text-base font-medium text-gray-800">Uygunluk Skoru (İlçe)</h4>
            <p className="text-xs text-gray-500 mt-1">
              Talep, gelir potansiyeli ve rekabet verileri birlikte değerlendirilmiştir.
            </p>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={chartData.slice(0, 10)}
                margin={{ top: 5, right: 20, left: 0, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" strokeOpacity={0.15} />
                <XAxis 
                  dataKey="ilce_ad" 
                  tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 400 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0}
                  axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 400 }}
                  axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                  label={{ value: 'Uygunluk Skoru (0-100)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: '#374151', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}
                  itemStyle={{ color: '#6b7280', fontSize: '12px' }}
                />
                <Bar dataKey="uygunluk_skoru" name="Uygunluk Skoru" radius={[6, 6, 0, 0]}>
                  {(() => {
                    const maxScore = Math.max(...chartData.map(d => d.uygunluk_skoru), 0);
                    const MOR_PALETI = {
                      cokAcik: '#e9d5ff',
                      acik: '#c4b5fd',
                      orta: '#a78bfa',
                      koyu: '#8b5cf6',
                      enKoyu: '#7c3aed',
                      cokKoyu: '#6d28d9'
                    };
                    return chartData.slice(0, 10).map((entry, index) => {
                      const isHighest = entry.uygunluk_skoru === maxScore;
                      const ratio = maxScore > 0 ? entry.uygunluk_skoru / maxScore : 0;
                      let fillColor;
                      if (isHighest) {
                        fillColor = MOR_PALETI.cokKoyu;
                      } else if (ratio >= 0.8) {
                        fillColor = MOR_PALETI.enKoyu;
                      } else if (ratio >= 0.6) {
                        fillColor = MOR_PALETI.koyu;
                      } else if (ratio >= 0.4) {
                        fillColor = MOR_PALETI.orta;
                      } else if (ratio >= 0.2) {
                        fillColor = MOR_PALETI.acik;
                      } else {
                        fillColor = MOR_PALETI.cokAcik;
                      }
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={fillColor}
                        />
                      );
                    });
                  })()}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] bg-gray-100 rounded animate-pulse flex items-center justify-center">
              <div className="text-gray-400 text-sm">Yükleniyor...</div>
            </div>
          )}
        </div>

        {/* Karar Yorumu Kartı - 1/3 genişlik */}
        <div className="lg:col-span-1">
          {chartData.length > 0 ? (
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg border border-purple-200 p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-white" />
                <h4 className="font-semibold text-white text-base">Karar Yorumu</h4>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="mb-4">
                  <p className="text-purple-200 text-xs mb-1">En Uygun İlçe</p>
                  <p className="font-bold text-white text-2xl mb-2">{chartData[0]?.ilce_ad}</p>
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                    <span className="text-purple-200 text-xs">Uygunluk Skoru</span>
                    <span className="font-bold text-white text-lg">{chartData[0]?.uygunluk_skoru}/100</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white text-sm leading-relaxed">
                    {(() => {
                      const enUygun = chartData[0];
                      if (!enUygun) return '';
                      
                      let yorum = '';
                      const talepYuksek = enUygun.talep_skoru >= 70;
                      const rekabetDusuk = enUygun.rakip_skoru >= 70;
                      const gelirYuksek = enUygun.gelir_skoru >= 70;
                      
                      if (talepYuksek && rekabetDusuk) {
                        yorum = `Talep yoğunluğu ve düşük rekabet nedeniyle ${enUygun.ilce_ad} yeni şube açmak için en uygun ilçedir.`;
                      } else if (talepYuksek) {
                        yorum = `Yüksek talep seviyesi ile ${enUygun.ilce_ad} yeni şube açmak için uygun bir seçenektir.`;
                      } else if (rekabetDusuk && gelirYuksek) {
                        yorum = `Düşük rekabet ve yüksek gelir potansiyeli nedeniyle ${enUygun.ilce_ad} yeni şube için değerlendirilebilir.`;
                      } else if (rekabetDusuk) {
                        yorum = `Düşük rekabet seviyesi nedeniyle ${enUygun.ilce_ad} yeni şube açmak için uygun bir lokasyondur.`;
                      } else {
                        yorum = `${enUygun.ilce_ad} ilçesi, mevcut veriler ışığında yeni şube açmak için en uygun seçenektir.`;
                      }
                      
                      return yorum;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl shadow-lg border border-purple-200 p-6 h-full">
              <div className="h-5 bg-white/20 rounded w-32 mb-4 animate-pulse"></div>
              <div className="space-y-4">
                <div>
                  <div className="h-3 bg-white/20 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-white/20 rounded w-full mb-3 animate-pulse"></div>
                  <div className="h-10 bg-white/20 rounded w-32 animate-pulse"></div>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <div className="space-y-2">
                    <div className="h-3 bg-white/20 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-white/20 rounded w-5/6 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

