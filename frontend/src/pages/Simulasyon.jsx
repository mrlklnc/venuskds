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
  getIlceRakipAnalizi, 
  getIlceOzetById,
  getMusteriIlce,
  getIlceRandevu,
  getIlceRakip,
  getTalepRakipOrani
} from '../services/dssService';
import { ilceService } from '../services/ilceService';

export default function Simulasyon() {
  const [rakipData, setRakipData] = useState([]);
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
          rakipRes, 
          ilceRes,
          musteriRes,
          randevuRes,
          rakipSayisiRes,
          talepRakipOraniRes
        ] = await Promise.all([
          getIlceRakipAnalizi(),
          ilceService.getAll(),
          getMusteriIlce().catch(() => []),
          getIlceRandevu().catch(() => []),
          getIlceRakip().catch(() => []),
          getTalepRakipOrani().catch(() => [])
        ]);
        setRakipData(Array.isArray(rakipRes) ? rakipRes : []);
        const ilceData = ilceRes?.data || ilceRes || [];
        setIlceList(Array.isArray(ilceData) ? ilceData : []);
        setMusteriData(Array.isArray(musteriRes) ? musteriRes.slice(0, 10) : []);
        setRandevuData(Array.isArray(randevuRes) ? randevuRes.slice(0, 10) : []);
        setRakipSayisiData(Array.isArray(rakipSayisiRes) ? rakipSayisiRes.slice(0, 10) : []);
        setTalepRakipOraniData(Array.isArray(talepRakipOraniRes) ? talepRakipOraniRes.slice(0, 10) : []);
      } catch (err) {
        console.error('Veri yüklenemedi:', err);
        setRakipData([]);
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
  const selectedIlceData = rakipData.find(item => item.ilce_ad === selectedIlce);
  
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

  // Risk seviyesi renk ve stil
  const getRiskSeviyesiStil = (riskSeviyesi) => {
    const riskValue = riskSeviyesi || '';
    switch (riskValue) {
      case 'Düşük':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
      case 'Orta':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
      case 'Yüksek':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
    }
  };

  // Grafik renk fonksiyonları
  const KONAK_COLOR = '#7c3aed';
  const OTHER_COLOR = '#c4b5fd';

  const getRakipColor = (rakipSayisi, isKonak) => {
    if (isKonak) return KONAK_COLOR;
    if (rakipSayisi >= 5) return '#581c87';
    if (rakipSayisi >= 3) return '#7c3aed';
    return '#c4b5fd';
  };

  const getOranColor = (oran, isKonak) => {
    if (isKonak) return KONAK_COLOR;
    if (oran >= 50) return '#059669';
    if (oran >= 20) return '#7c3aed';
    return '#dc2626';
  };

  // Tooltip component'leri
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

  const RakipTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isKonak = label === 'Konak';
      const rakipSayisi = payload[0].value;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
          <p className="font-semibold text-purple-700 flex items-center gap-1 mb-2">
            {isKonak && <MapPin className="w-4 h-4" />}
            {label}
            {isKonak && <span className="text-xs bg-purple-100 px-2 py-0.5 rounded-full">Mevcut Şube</span>}
          </p>
          <p className="text-gray-700 text-sm">
            Rakip Sayısı: <span className="font-semibold">{rakipSayisi}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const OranTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isKonak = label === 'Konak';
      const oran = payload[0].payload.talep_rakip_orani;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-purple-200">
          <p className="font-semibold text-purple-700 flex items-center gap-1 mb-2">
            {isKonak && <MapPin className="w-4 h-4" />}
            {label}
            {isKonak && <span className="text-xs bg-purple-100 px-2 py-0.5 rounded-full">Mevcut Şube</span>}
          </p>
          <p className="text-gray-700 text-sm">
            Talep/Rakip Oranı: <span className="font-semibold">{oran}</span>
          </p>
          <p className="text-gray-700 text-sm">
            Randevu: {payload[0].payload.randevu_sayisi} | Rakip: {payload[0].payload.rakip_sayisi}
          </p>
        </div>
      );
    }
    return null;
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
            {/* 1. Kart: İlçe Bazlı Rakip Yoğunluğu */}
            <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">İlçe Bazlı Rakip Yoğunluğu</h3>
              {rakipData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rakipData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                    <XAxis 
                      dataKey="ilce_ad" 
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
                          const isSelected = data.ilce_ad === selectedIlce;
                          return (
                            <div className={`bg-white p-3 rounded-lg shadow-lg border-2 ${isSelected ? 'border-purple-600' : 'border-purple-200'}`}>
                              <p className={`font-semibold mb-2 ${isSelected ? 'text-purple-700' : 'text-purple-700'}`}>
                                {data.ilce_ad}
                                {isSelected && <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Seçili</span>}
                              </p>
                              <p className="text-sm text-gray-600">
                                Rakip Sayısı: <span className="font-semibold">{data.rakip_sayisi}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="rakip_sayisi" name="Rakip Sayısı">
                      {rakipData.map((entry, index) => {
                        const isSelected = entry.ilce_ad === selectedIlce;
                        let fillColor;
                        
                        if (isSelected) {
                          fillColor = '#5b21b6';
                        } else {
                          fillColor = entry.rakip_sayisi > 5 ? '#7c3aed' : entry.rakip_sayisi > 2 ? '#a78bfa' : '#c4b5fd';
                        }
                        
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={fillColor}
                            stroke={isSelected ? '#4c1d95' : 'none'}
                            strokeWidth={isSelected ? 3 : 0}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Veri bulunamadı
                </div>
              )}
            </div>

            {/* 2. Kart: İlçeye Göre Müşteri Sayısı */}
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

            {/* 3. Kart: İlçeye Göre Rakip Sayısı */}
            <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">İlçeye Göre Rakip Sayısı</h3>
              {rakipSayisiData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rakipSayisiData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                    <XAxis 
                      dataKey="ilce_ad" 
                      tick={{ fill: '#6b5b95', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: '#6b5b95', fontSize: 12 }} />
                    <Tooltip content={<RakipTooltip />} />
                    <Bar dataKey="rakip_sayisi" name="Rakip Sayısı" radius={[4, 4, 0, 0]}>
                      {rakipSayisiData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getRakipColor(entry.rakip_sayisi, entry.ilce_ad === 'Konak')}
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

            {/* 4. Kart: Talep / Rakip Oranı */}
            <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Talep / Rakip Oranı (Yatırım Fırsatı)</h3>
              {talepRakipOraniData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={talepRakipOraniData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                    <XAxis 
                      dataKey="ilce_ad" 
                      tick={{ fill: '#6b5b95', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: '#6b5b95', fontSize: 12 }} />
                    <Tooltip content={<OranTooltip />} />
                    <ReferenceLine y={20} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Orta Risk', fill: '#f59e0b', fontSize: 10 }} />
                    <ReferenceLine y={50} stroke="#059669" strokeDasharray="3 3" label={{ value: 'Düşük Risk', fill: '#059669', fontSize: 10 }} />
                    <Bar dataKey="talep_rakip_orani" name="Talep/Rakip Oranı" radius={[4, 4, 0, 0]}>
                      {talepRakipOraniData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getOranColor(entry.talep_rakip_orani, entry.ilce_ad === 'Konak')}
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
            ) : ilceOzet ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tahmini Aylık Müşteri */}
                <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-600">Tahmini Aylık Müşteri</h4>
                      <p className="text-2xl font-bold text-gray-800">{ilceOzet.tahmini_musteri || 0}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {ilceOzet?.gercek_rakip_sayisi !== undefined && (
                      <>Gerçekçi rakip sayısı: {ilceOzet.gercek_rakip_sayisi} (normalize edilmiş)</>
                    )}
                    {!ilceOzet?.gercek_rakip_sayisi && 'Rakip yoğunluğuna göre hesaplanmıştır'}
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
                      <p className="text-2xl font-bold text-gray-800">{formatCurrency(ilceOzet.tahmini_gelir || 0)}</p>
                    </div>
                  </div>
                  {ilceOzet.aylik_randevu !== undefined && (
                    <p className="text-xs text-gray-500 mb-1">
                      Aylık Randevu: {ilceOzet.aylik_randevu.toLocaleString('tr-TR')}
                    </p>
                  )}
                  {ilceOzet.agirlikli_ortalama_randevu !== undefined && (
                    <p className="text-xs text-gray-500">
                      Varsayım: müşteri segmentli ağırlıklı ortalama = {ilceOzet.agirlikli_ortalama_randevu.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Risk Seviyesi */}
                <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    {(() => {
                      const riskValue = ilceOzet.risk_seviyesi || ilceOzet.risk;
                      const riskStil = getRiskSeviyesiStil(riskValue);
                      return (
                        <>
                          <div className={`p-3 rounded-lg ${riskStil.bg}`}>
                            <AlertTriangle className={`w-6 h-6 ${riskStil.text}`} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600">Risk Seviyesi</h4>
                            <p className={`text-2xl font-bold ${riskStil.text}`}>
                              {(() => {
                                if (!riskValue) {
                                  console.error('⚠️ Risk seviyesi bulunamadı:', ilceOzet);
                                  return null;
                                }
                                if (['Düşük', 'Orta', 'Yüksek'].includes(riskValue)) {
                                  return riskValue;
                                }
                                console.error('⚠️ Geçersiz risk seviyesi:', riskValue);
                                return null;
                              })()}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskSeviyesiStil(ilceOzet.risk_seviyesi || ilceOzet.risk).bg} ${getRiskSeviyesiStil(ilceOzet.risk_seviyesi || ilceOzet.risk).text} border ${getRiskSeviyesiStil(ilceOzet.risk_seviyesi || ilceOzet.risk).border}`}>
                    {ilceOzet.gercek_rakip_sayisi || ilceOzet.normalize_rakip || ilceOzet.rakip_sayisi || 0} rakip (normalize edilmiş)
                  </div>
                </div>
              </div>
            ) : (
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
                // Backend'den gelen değerler
                const baseMusteri = ilceOzet.tahmini_musteri || 0;
                const sabitGider = ilceOzet.toplam_gider || 130000; // Varsayılan gider
                
                // Ortalama fiyat = ortalama_ziyaret_sayisi * ortalama_sepet_tutari = 2.5 * 1800 = 4500
                const ortalamaFiyat = 4500;

                // Senaryolar
                const senaryolar = [
                  {
                    ad: 'Kötü',
                    musteri: Math.round(baseMusteri * 0.7),
                    renk: 'red'
                  },
                  {
                    ad: 'Normal',
                    musteri: baseMusteri,
                    renk: 'yellow'
                  },
                  {
                    ad: 'İyi',
                    musteri: Math.round(baseMusteri * 1.25),
                    renk: 'green'
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
                        <h3 className={`text-lg font-bold ${
                          senaryo.renk === 'red' ? 'text-red-700' : 
                          senaryo.renk === 'yellow' ? 'text-yellow-700' : 
                          'text-green-700'
                        }`}>
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

                        <div className={`pt-3 border-t-2 ${
                          senaryo.renk === 'red' ? 'border-red-200' : 
                          senaryo.renk === 'yellow' ? 'border-yellow-200' : 
                          'border-green-200'
                        }`}>
                          <p className="text-sm text-gray-600 mb-1">Net Kâr</p>
                          <p className={`text-2xl font-bold ${
                            netKar < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
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
