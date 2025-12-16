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
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-purple-100 p-4">
          <div className="mb-4">
            <h4 className="text-base font-semibold text-gray-800">Yeni Şube İçin İlçe Uygunluk Skoru</h4>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                <XAxis 
                  dataKey="ilce_ad" 
                  tick={{ fill: '#6b5b95', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: '#6b5b95', fontSize: 11 }}
                  label={{ value: 'Uygunluk Skoru (0-100)', angle: -90, position: 'insideLeft', fill: '#6b5b95', fontSize: 12 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
                          <p className="font-semibold text-purple-700 text-sm mb-2">{item.ilce_ad}</p>
                          <p className="text-xs text-gray-700 mb-1">
                            <span className="font-medium">Uygunluk Skoru:</span>{' '}
                            <span className="font-bold text-purple-600">{item.uygunluk_skoru}/100</span>
                          </p>
                          <div className="mt-2 pt-2 border-t border-gray-200 space-y-0.5 text-xs">
                            <p className="text-gray-600">Talep: {item.talep_skoru} puan ({item.randevu_sayisi} randevu)</p>
                            <p className="text-gray-600">Gelir: {item.gelir_skoru} puan</p>
                            <p className="text-gray-600">Rekabet: {item.rakip_skoru} puan</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="uygunluk_skoru" name="Uygunluk Skoru" radius={[4, 4, 0, 0]}>
                  {chartData.slice(0, 10).map((entry, index) => {
                    const maxScore = Math.max(...chartData.map(d => d.uygunluk_skoru), 0);
                    const isHighest = entry.uygunluk_skoru === maxScore;
                    // Mor tonları - birbirinden ayırt edilebilir
                    const colors = [
                      '#7c3aed', // Koyu mor - en yüksek skor
                      '#8b5cf6', // Mor
                      '#a78bfa', // Orta mor
                      '#c4b5fd', // Açık mor
                      '#ddd6fe', // Çok açık mor
                      '#ede9fe', // En açık mor
                      '#f3e8ff', // Çok açık
                      '#faf5ff', // Neredeyse beyaz
                    ];
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isHighest ? HIGHEST_SCORE_COLOR : colors[index % colors.length]}
                        stroke={isHighest ? '#5b21b6' : 'transparent'}
                        strokeWidth={isHighest ? 2 : 0}
                      />
                    );
                  })}
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

