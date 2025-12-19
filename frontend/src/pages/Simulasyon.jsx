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
  ReferenceLine
} from 'recharts';
import { Building2, MapPin, Users, TrendingUp, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  getIlceOzetById,
  getMusteriIlce,
  getIlceRandevu,
  getIlceRakip,
  getTalepRakipOrani
} from '../services/dssService';
import { ilceService } from '../services/ilceService';

export default function Simulasyon() {
  const [ilceList, setIlceList] = useState([]);
  const [selectedIlce, setSelectedIlce] = useState('');
  const [selectedIlceId, setSelectedIlceId] = useState(null);
  const [ilceOzet, setIlceOzet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ozetLoading, setOzetLoading] = useState(false);

  // Karar destek grafikleri için state'ler
  const [musteriData, setMusteriData] = useState([]);
  const [randevuData, setRandevuData] = useState([]);
  const [rakipSayisiData, setRakipSayisiData] = useState([]);
  const [talepRakipOraniData, setTalepRakipOraniData] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setChartsLoading(true);
        const [
          ilceRes,
          musteriRes,
          randevuRes,
          rakipSayisiRes,
          talepRakipOraniRes
        ] = await Promise.all([
          ilceService.getAll(),
          getMusteriIlce().catch(() => []),
          getIlceRandevu().catch(() => []),
          getIlceRakip().catch(() => []),
          getTalepRakipOrani().catch(() => [])
        ]);
        const ilceData = ilceRes?.data || ilceRes || [];
        setIlceList(Array.isArray(ilceData) ? ilceData : []);
        setMusteriData(Array.isArray(musteriRes) ? musteriRes.slice(0, 10) : []);
        setRandevuData(Array.isArray(randevuRes) ? randevuRes.slice(0, 10) : []);
        // normalize_rakip yoksa fallback: normalize_rakip ?? gercek_rakip_sayisi ?? rakip_sayisi
        const processedRakipSayisi = Array.isArray(rakipSayisiRes) 
          ? rakipSayisiRes.slice(0, 10).map(item => ({
              ...item,
              normalize_rakip: item.normalize_rakip ?? item.gercek_rakip_sayisi ?? item.rakip_sayisi ?? 0
            }))
          : [];
        setRakipSayisiData(processedRakipSayisi);
        setTalepRakipOraniData(Array.isArray(talepRakipOraniRes) ? talepRakipOraniRes.slice(0, 10) : []);
      } catch (err) {
        console.error('Veri yüklenemedi:', err);
        setIlceList([]);
      } finally {
        setLoading(false);
        setChartsLoading(false);
      }
    };
    fetchData();
  }, []);

  // İlçe seçildiğinde özet bilgileri çek (ilce_id ile)
  useEffect(() => {
    const fetchIlceOzet = async () => {
      if (!selectedIlceId) {
        setIlceOzet(null);
        return;
      }

      try {
        setOzetLoading(true);
        console.log('🔄 İlçe özeti API çağrısı başlatılıyor, ilce_id:', selectedIlceId);
        const data = await getIlceOzetById(selectedIlceId);
        console.log('✅ İlçe özeti API response:', data);
        setIlceOzet(data);
      } catch (err) {
        console.error('❌ İlçe özeti yüklenemedi:', err);
        setIlceOzet(null);
      } finally {
        setOzetLoading(false);
      }
    };

    fetchIlceOzet();
  }, [selectedIlceId]);

  // Seçilen ilçenin rakip bilgisini bul
  const selectedIlceData = rakipSayisiData.find(item => item.ilce_ad === selectedIlce);

  // Rakip yoğunluğu seviyesi belirleme
  const getRakipYoğunlukSeviyesi = (rakipSayisi) => {
    if (rakipSayisi === 0) return 'Yok';
    if (rakipSayisi <= 2) return 'Düşük';
    if (rakipSayisi <= 5) return 'Orta';
    return 'Yüksek';
  };

  // Para formatı
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // ✅ Normalize rakibe göre risk (Buca normalize=10 => "Orta" olacak şekilde ayarlı)
  const getNormalizeRakibeGoreRisk = (normalizeRakip) => {
    const n = Number(normalizeRakip || 0);
    if (n <= 2) return 'Düşük';
    if (n <= 10) return 'Orta';
    if (n <= 15) return 'Orta-Yüksek';
    return 'Yüksek';
  };

  // Risk seviyesi renk ve stil
  const getRiskSeviyesiStil = (riskSeviyesi) => {
    const riskValue = riskSeviyesi || '';
    switch (riskValue) {
      case 'Düşük':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
      case 'Orta':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
      case 'Orta-Yüksek':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
      case 'Yüksek':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
    }
  };

  // Profesyonel mor paleti (tek renk sistemi)
  const MOR_PALETI = {
    cokAcik: '#e9d5ff',  // Çok açık mor
    acik: '#c4b5fd',     // Açık mor
    orta: '#a78bfa',     // Orta mor
    koyu: '#8b5cf6',     // Koyu mor
    enKoyu: '#7c3aed',   // En koyu mor (vurgu için)
    cokKoyu: '#6d28d9'   // Çok koyu (en vurgulu)
  };

  // Aynı tür metrikler için aynı renk mantığı
  const getBarColor = (value, maxValue, isHighlight = false) => {
    if (isHighlight) return MOR_PALETI.cokKoyu;
    
    // Değere göre mor tonu seç (yüksek değer = daha koyu)
    const ratio = maxValue > 0 ? value / maxValue : 0;
    if (ratio >= 0.8) return MOR_PALETI.enKoyu;
    if (ratio >= 0.6) return MOR_PALETI.koyu;
    if (ratio >= 0.4) return MOR_PALETI.orta;
    if (ratio >= 0.2) return MOR_PALETI.acik;
    return MOR_PALETI.cokAcik;
  };

  // En yüksek/en düşük değeri bul (vurgu için)
  const getMaxValue = (data, key) => {
    return Math.max(...data.map(item => item[key] || 0), 1);
  };

  const getMinValue = (data, key) => {
    return Math.min(...data.map(item => item[key] || 0), 0);
  };


  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Şube Açma Simülasyonu</h1>
        <p className="text-gray-600">Yeni şube açma senaryolarını simüle edin ve sonuçları analiz edin</p>
      </div>

      {/* Karar Destek Özeti - 2x2 Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Karar Destek Özeti</h2>

        {chartsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Kart: Talep Payı (%) - Premium Style */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
              <h3 className="text-base font-medium text-gray-800 mb-2">Talep Payı (%)</h3>
              <p className="text-xs text-gray-500 mb-4">İlçenin toplam randevu içindeki payı</p>
              {(() => {
                // Talep payı hesaplama: (İlçe Randevu Sayısı / Toplam Randevu Sayısı) * 100
                const toplamRandevu = randevuData.reduce((sum, item) => sum + (item.randevu_sayisi || 0), 0);
                const talepPayiData = randevuData.map(item => ({
                  ilce_ad: item.ilce_ad,
                  talep_payi: toplamRandevu > 0 ? Number(((item.randevu_sayisi || 0) / toplamRandevu * 100).toFixed(2)) : 0,
                  randevu_sayisi: item.randevu_sayisi || 0
                }));

                return talepPayiData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={talepPayiData} margin={{ top: 10, right: 10, left: 5, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#c9b8ff" strokeOpacity={0.2} />
                      <XAxis
                        dataKey="ilce_ad"
                        tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                        axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                        tickLine={{ stroke: '#c4b5fd' }}
                      />
                      <YAxis 
                        tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                        axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                        tickLine={{ stroke: '#c4b5fd' }}
                        width={45}
                        label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#5b21b6', fontSize: 11, fontWeight: 500, dx: -5 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid #c4b5fd',
                          borderRadius: '12px',
                          padding: '14px 18px',
                          boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.2), 0 8px 10px -6px rgba(124, 58, 237, 0.1)'
                        }}
                        labelStyle={{ color: '#5b21b6', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}
                        itemStyle={{ color: '#7c3aed', fontSize: '13px', fontWeight: 500 }}
                        formatter={(value) => [`${Number(value).toFixed(2)}%`, '']}
                        labelFormatter={(label) => `📊 ${label}`}
                        cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
                      />
                      <Bar dataKey="talep_payi" name="Talep Payı (%)" radius={[8, 8, 0, 0]}>
                        {(() => {
                          const maxValue = Math.max(...talepPayiData.map(item => item.talep_payi || 0), 1);
                          return talepPayiData.map((entry, index) => {
                            const talepPayi = entry.talep_payi || 0;
                            const isMax = talepPayi === maxValue;
                            const fillColor = getBarColor(talepPayi, maxValue, isMax);
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
                );
              })()}
            </div>

            {/* 2. Kart: Müşteri Sayısı (İlçe) - Premium Style */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
              <h3 className="text-base font-medium text-gray-800 mb-2">Müşteri Sayısı (İlçe)</h3>
              <p className="text-xs text-gray-500 mb-4">İlçe bazında müşteri dağılımı</p>
              {musteriData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={musteriData} margin={{ top: 10, right: 10, left: 5, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#c9b8ff" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="ilce"
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                    />
                    <YAxis 
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #c4b5fd',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.2), 0 8px 10px -6px rgba(124, 58, 237, 0.1)'
                      }}
                      labelStyle={{ color: '#5b21b6', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}
                      itemStyle={{ color: '#7c3aed', fontSize: '13px', fontWeight: 500 }}
                      formatter={(value) => [`${value} müşteri`, '']}
                      labelFormatter={(label) => `📍 ${label}`}
                      cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
                    />
                    <Bar dataKey="musteri_sayisi" name="Müşteri Sayısı" radius={[8, 8, 0, 0]}>
                      {(() => {
                        const maxValue = getMaxValue(musteriData, 'musteri_sayisi');
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

            {/* 3. Kart: Rakip Sayısı (İlçe) - Premium Style */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
              <h3 className="text-base font-medium text-gray-800 mb-2">Rakip Sayısı (İlçe)</h3>
              <p className="text-xs text-gray-500 mb-4">Normalize edilmiş rakip sayısı</p>
              {rakipSayisiData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rakipSayisiData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#c9b8ff" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="ilce_ad"
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                    />
                    <YAxis 
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #c4b5fd',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.2), 0 8px 10px -6px rgba(124, 58, 237, 0.1)'
                      }}
                      labelStyle={{ color: '#5b21b6', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}
                      itemStyle={{ color: '#7c3aed', fontSize: '13px', fontWeight: 500 }}
                      formatter={(value) => [`${value} rakip`, '']}
                      labelFormatter={(label) => `📍 ${label}`}
                      cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
                    />
                    <Bar dataKey="normalize_rakip" name="Rakip Sayısı" radius={[8, 8, 0, 0]}>
                      {(() => {
                        const maxValue = getMaxValue(rakipSayisiData, 'normalize_rakip');
                        return rakipSayisiData.map((entry, index) => {
                          const normalizeRakip = entry.normalize_rakip ?? entry.gercek_rakip_sayisi ?? entry.rakip_sayisi ?? 0;
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

            {/* 4. Kart: Talep / Rakip Oranı - Premium Style */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-4 shadow-sm">
              <h3 className="text-base font-medium text-gray-800 mb-2">Talep / Rakip Oranı</h3>
              <p className="text-xs text-gray-500 mb-4">Yatırım fırsatı göstergesi</p>
              {talepRakipOraniData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={talepRakipOraniData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#c9b8ff" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="ilce_ad"
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                    />
                    <YAxis 
                      tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#c4b5fd', strokeWidth: 1 }}
                      tickLine={{ stroke: '#c4b5fd' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid #c4b5fd',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.2), 0 8px 10px -6px rgba(124, 58, 237, 0.1)'
                      }}
                      labelStyle={{ color: '#5b21b6', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}
                      itemStyle={{ color: '#7c3aed', fontSize: '13px', fontWeight: 500 }}
                      formatter={(value) => [`${value.toFixed(2)} oran`, '']}
                      labelFormatter={(label) => `📊 ${label}`}
                      cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
                    />
                    <Bar dataKey="talep_rakip_orani" name="Talep/Rakip Oranı" radius={[8, 8, 0, 0]}>
                      {(() => {
                        const maxValue = getMaxValue(talepRakipOraniData, 'talep_rakip_orani');
                        return talepRakipOraniData.map((entry, index) => {
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
        )}
      </div>

      {/* İlçe Seçimi ve Simülasyon */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Simülasyon</h2>

        {/* İlçe Seçimi */}
        <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
          <label htmlFor="ilce-select" className="block text-sm font-semibold text-gray-700 mb-2">
            Simülasyon İçin İlçe Seçiniz
          </label>
          <select
            id="ilce-select"
            value={selectedIlceId || ''}
            onChange={(e) => {
              const selectedId = e.target.value ? parseInt(e.target.value) : null;
              const selectedName = e.target.value ? ilceList.find(i => i.ilce_id === selectedId)?.ilce_ad || '' : '';
              setSelectedIlceId(selectedId);
              setSelectedIlce(selectedName);
            }}
            className="w-full md:w-64 px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 bg-white"
          >
            <option value="">İlçe Seçiniz</option>
            {ilceList.map((ilce) => (
              <option key={ilce.ilce_id} value={ilce.ilce_id}>
                {ilce.ilce_ad}
              </option>
            ))}
          </select>
        </div>

        {/* Seçilen İlçe Açıklaması */}
        {selectedIlce && selectedIlceData && ilceOzet && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-purple-700">Seçilen ilçe:</span>{' '}
              <span className="font-medium">{selectedIlce}</span>
              {' — '}
              <span className="font-semibold text-purple-700">Rakip yoğunluğu:</span>{' '}
              <span className="font-medium">
                {getRakipYoğunlukSeviyesi(ilceOzet.gercek_rakip_sayisi || ilceOzet.normalize_rakip || selectedIlceData.rakip_sayisi)}
              </span>
              {' '}({selectedIlceData.rakip_sayisi} bilinen rakip)
            </p>
            {(ilceOzet.gercek_rakip_sayisi !== undefined || ilceOzet.normalize_rakip !== undefined) && (
              <p className="text-xs text-gray-600 italic">
                Gerçekçi tahmini rakip sayısı: <span className="font-semibold">{ilceOzet.gercek_rakip_sayisi || ilceOzet.normalize_rakip}</span> (ilçe bazlı normalize edilmiştir)
              </p>
            )}
          </div>
        )}

        {/* Simülasyon Sonuç Kartları */}
        {selectedIlceId && (
          <>
            {ozetLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : ilceOzet ? (() => {
              // ═══════════════════════════════════════════════════════════════
              // TEK KAYNAK: Normal Senaryo Müşteri Hesaplama
              // ═══════════════════════════════════════════════════════════════
              const baseMusteri = ilceOzet.tahmini_musteri || 0;
              
              // Çarpanlar (açılış + kampanya + transfer etkileri)
              const ACILIS_ETKISI = 0.15;    // +%15
              const KAMPANYA_ETKISI = 0.10;  // +%10
              const YAKINLIK_ETKISI = 0.05;  // +%5
              const TOPLAM_CARPAN = 1 + ACILIS_ETKISI + KAMPANYA_ETKISI + YAKINLIK_ETKISI; // 1.30
              
              // Normal Senaryo = Gerçekçi Tahmin (TEK KAYNAK)
              const normalSenaryoMusteri = Math.round(baseMusteri * TOPLAM_CARPAN);
              const ortalamaFiyat = 4500;
              
              return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gerçekçi Aylık Müşteri Tahmini = Normal Senaryo Değeri */}
                <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600">Gerçekçi Aylık Müşteri Tahmini</h4>
                      <p className="text-2xl font-bold text-gray-800">{normalSenaryoMusteri}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Açılış, kampanya ve transfer etkileri dahil edilmiştir.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Normal Senaryo referans değeri
                  </p>
                </div>

                {/* Tahmini Aylık Gelir */}
                <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600">Tahmini Aylık Gelir</h4>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrency(normalSenaryoMusteri * ortalamaFiyat)}</p>
                    </div>
                  </div>
                </div>

                {/* ✅ Risk Seviyesi (SADECE BURASI DÜZELTİLDİ) */}
                <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
                  {(() => {
                    const normalizeRakip =
                      ilceOzet.gercek_rakip_sayisi ??
                      ilceOzet.normalize_rakip ??
                      ilceOzet.rakip_sayisi ??
                      0;

                    const riskValue = getNormalizeRakibeGoreRisk(normalizeRakip);
                    const riskStil = getRiskSeviyesiStil(riskValue);

                    return (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-3 rounded-lg ${riskStil.bg}`}>
                            <AlertTriangle className={`w-6 h-6 ${riskStil.text}`} />
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-600">Risk Seviyesi (Normalize Rakibe Göre)</h4>
                            <p className="text-xs text-gray-500 mt-1">Gerçekçi tahmini rakip sayısı esas alınır</p>
                            <p className={`text-2xl font-bold ${riskStil.text}`}>{riskValue}</p>
                          </div>
                        </div>

                        <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${riskStil.bg} ${riskStil.text} border ${riskStil.border}`}>
                          {normalizeRakip} rakip (normalize edilmiş)
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              );
            })() : (
              <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6 text-center">
                <p className="text-gray-500">Simülasyon verisi yükleniyor...</p>
              </div>
            )}
          </>
        )}

        {/* Senaryo Analizi */}
        {selectedIlceId && ilceOzet && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Senaryo Analizi</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(() => {
                // ═══════════════════════════════════════════════════════════════
                // TEK KAYNAK HESAPLAMA
                // ═══════════════════════════════════════════════════════════════
                const baseMusteri = ilceOzet.tahmini_musteri || 0;
                const sabitGider = ilceOzet.toplam_gider || 130000;
                const ortalamaFiyat = 4500;
                
                // Çarpanlar (açılış + kampanya + transfer etkileri)
                const ACILIS_ETKISI = 0.15;    // +%15
                const KAMPANYA_ETKISI = 0.10;  // +%10
                const YAKINLIK_ETKISI = 0.05;  // +%5
                const TOPLAM_CARPAN = 1 + ACILIS_ETKISI + KAMPANYA_ETKISI + YAKINLIK_ETKISI; // 1.30
                
                // Normal Senaryo = Referans (Gerçekçi Tahmin ile aynı)
                const normalSenaryoMusteri = Math.round(baseMusteri * TOPLAM_CARPAN);

                // Senaryolar (Normal referans alınarak)
                const senaryolar = [
                  { 
                    ad: 'Kötü', 
                    musteri: Math.round(normalSenaryoMusteri * 0.54), // ≈ baseMusteri * 0.7
                    renk: 'red',
                    aciklama: 'Muhafazakâr tahmin'
                  },
                  { 
                    ad: 'Normal', 
                    musteri: normalSenaryoMusteri, // TEK KAYNAK
                    renk: 'yellow',
                    aciklama: 'Gerçekçi tahmin (referans)'
                  },
                  { 
                    ad: 'İyi', 
                    musteri: Math.round(normalSenaryoMusteri * 1.25),
                    renk: 'green',
                    aciklama: 'Optimistik senaryo'
                  }
                ];

                return senaryolar.map((senaryo, index) => {
                  const ciro = senaryo.musteri * ortalamaFiyat;
                  const netKar = ciro - sabitGider;

                  // Risk seviyesi
                  let riskSeviyesi;
                  let riskRenk;
                  if (netKar < 0) {
                    riskSeviyesi = 'Yüksek';
                    riskRenk = 'text-red-700 bg-red-100 border-red-300';
                  } else if (netKar <= 20000) {
                    riskSeviyesi = 'Orta';
                    riskRenk = 'text-yellow-700 bg-yellow-100 border-yellow-300';
                  } else {
                    riskSeviyesi = 'Düşük';
                    riskRenk = 'text-green-700 bg-green-100 border-green-300';
                  }

                  // Kart renk sınıfları
                  const kartRenkSınıfları = {
                    red: 'border-red-300 bg-red-50',
                    yellow: 'border-yellow-300 bg-yellow-50',
                    green: 'border-green-300 bg-green-50'
                  };

                  return (
                    <div
                      key={index}
                      className={`bg-white rounded-xl shadow-md border-2 ${kartRenkSınıfları[senaryo.renk]} p-6`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3
                          className={`text-lg font-bold ${
                            senaryo.renk === 'red'
                              ? 'text-red-700'
                              : senaryo.renk === 'yellow'
                                ? 'text-yellow-700'
                                : 'text-green-700'
                          }`}
                        >
                          {senaryo.ad} Senaryo
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskRenk}`}>
                          {riskSeviyesi}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Aylık Müşteri</p>
                          <p className="text-2xl font-bold text-gray-800">{senaryo.musteri}</p>
                          {senaryo.aciklama && (
                            <p className="text-xs text-gray-400 mt-0.5">{senaryo.aciklama}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Aylık Ciro</p>
                          <p className="text-xl font-semibold text-gray-800">
                            {formatCurrency(ciro)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Sabit Gider</p>
                          <p className="text-lg font-medium text-gray-700">
                            {formatCurrency(sabitGider)}
                          </p>
                        </div>

                        <div
                          className={`pt-3 border-t-2 ${
                            senaryo.renk === 'red'
                              ? 'border-red-200'
                              : senaryo.renk === 'yellow'
                                ? 'border-yellow-200'
                                : 'border-green-200'
                          }`}
                        >
                          <p className="text-sm text-gray-600 mb-1">Net Kâr</p>
                          <p className={`text-2xl font-bold ${netKar < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(netKar)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
