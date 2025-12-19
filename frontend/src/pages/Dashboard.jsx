import { useEffect, useState, useMemo } from "react";
import { getDashboardSummary } from "../services/dashboardService";
import { getRandevuAylik, getMusteriIlce, getEnKarliHizmetler, getTalepRakipOrani, getIlceRandevu } from "../services/dssService";
import KPICard from "../components/KPICard";
import { DollarSign, Users, Calendar, TrendingUp, TrendingDown, Minus, Lightbulb, MapPin, Star, Target } from "lucide-react";
import { formatCurrency } from "../utils/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell, Area, AreaChart, ReferenceDot } from "recharts";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalAppointments: 0,
    totalRevenue: 0,
  });

  const [aylikRandevu, setAylikRandevu] = useState([]);
  const [musteriIlce, setMusteriIlce] = useState([]);
  const [enGucluIlce, setEnGucluIlce] = useState(null);
  const [enDegerliHizmet, setEnDegerliHizmet] = useState(null);
  const [enVerimliOran, setEnVerimliOran] = useState(null);
  const [firsatIlceler, setFirsatIlceler] = useState([]);
  const [riskIlceler, setRiskIlceler] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setErrMsg("");

        console.log("🚀 dashboard summary fetch başladı...");
        const summary = await getDashboardSummary();
        console.log("✅ SUMMARY API:", summary);

        setStats({
          totalCustomers: Number(summary.totalMusteri ?? 0),
          totalAppointments: Number(summary.totalRandevu ?? 0),
          totalRevenue: Number(summary.toplamGelir ?? 0),
        });

        // Aylık randevu verisini çek
        try {
          const aylikData = await getRandevuAylik();
          console.log("✅ Aylık randevu verisi:", aylikData);
          // Backend'den gelen veri formatı: { ay, toplam_randevu }
          const formattedData = Array.isArray(aylikData) 
            ? aylikData.map(item => ({
                ay: item.ay || "",
                randevuSayisi: Number(item.toplam_randevu) || 0
              }))
            : [];
          
          // ═══════════════════════════════════════════════════════════════
          // TAMAMLANMAMIŞ MEVCUT AYI HARİÇ TUT
          // ═══════════════════════════════════════════════════════════════
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth(); // 0-11
          const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          const isMonthComplete = now.getDate() === lastDayOfMonth;
          
          // Türkçe ay isimleri (backend formatı: "Ocak 2024" veya "2024-01")
          const turkceAylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                              'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
          const currentMonthName = turkceAylar[currentMonth];
          const currentYearStr = currentYear.toString();
          
          // Mevcut ay tamamlanmadıysa, o ayı filtrele
          const filteredData = isMonthComplete 
            ? formattedData 
            : formattedData.filter(item => {
                const ayStr = item.ay || "";
                // "Ocak 2024" formatı kontrolü
                const isTurkceFormat = ayStr.includes(currentMonthName) && ayStr.includes(currentYearStr);
                // "2024-01" formatı kontrolü
                const monthNumStr = String(currentMonth + 1).padStart(2, '0');
                const isISOFormat = ayStr.startsWith(`${currentYear}-${monthNumStr}`);
                // Mevcut ay değilse dahil et
                return !isTurkceFormat && !isISOFormat;
              });
          
          setAylikRandevu(filteredData);
        } catch (e) {
          console.error("❌ Aylık randevu veri hatası:", e);
          setAylikRandevu([]);
        }

        // Müşteri ilçe verisini çek
        try {
          const ilceData = await getMusteriIlce();
          console.log("✅ Müşteri ilçe verisi:", ilceData);
          // Backend'den gelen veri formatı: { ilce, musteri_sayisi } - zaten DESC sıralı
          // En yüksek 5 ilçeyi al
          const top5Ilce = Array.isArray(ilceData) 
            ? ilceData.slice(0, 5).map(item => ({
                ilce: item.ilce || "Bilinmeyen",
                musteriSayisi: Number(item.musteri_sayisi) || 0
              }))
            : [];
          setMusteriIlce(top5Ilce);
        } catch (e) {
          console.error("❌ Müşteri ilçe veri hatası:", e);
          setMusteriIlce([]);
        }

        // Mevcut şube ilçesi (hesaplamalarda hariç tutulacak)
        const MEVCUT_SUBE_ILCE = "Konak";

        // En Güçlü İlçe (en yüksek randevu sayısı - mevcut şube hariç)
        try {
          const ilceRandevuData = await getIlceRandevu();
          if (Array.isArray(ilceRandevuData) && ilceRandevuData.length > 0) {
            // Mevcut şubeyi hariç tut
            const filteredData = ilceRandevuData.filter(item => {
              const ilceAd = (item.ilce_ad || item.ilce || "").toLowerCase();
              return ilceAd !== MEVCUT_SUBE_ILCE.toLowerCase();
            });
            
            if (filteredData.length > 0) {
              // Randevu sayısına göre sırala, eşitlik varsa gelire göre
              const sortedByRandevu = [...filteredData].sort((a, b) => {
                const randevuDiff = (Number(b.randevu_sayisi) || 0) - (Number(a.randevu_sayisi) || 0);
                if (randevuDiff !== 0) return randevuDiff;
                // Eşitlik varsa toplam gelir ile sırayı belirle
                return (Number(b.toplam_gelir) || 0) - (Number(a.toplam_gelir) || 0);
              });
              setEnGucluIlce({
                ilce: sortedByRandevu[0].ilce_ad || sortedByRandevu[0].ilce || "Bilinmeyen",
                randevuSayisi: Number(sortedByRandevu[0].randevu_sayisi) || 0
              });
            }
          }
        } catch (e) {
          console.error("❌ İlçe randevu veri hatası:", e);
        }

        // En Değerli Hizmet (Toplam Gelir / Randevu Sayısı en yüksek - ilçe filtresi yok)
        try {
          const hizmetData = await getEnKarliHizmetler();
          if (Array.isArray(hizmetData) && hizmetData.length > 0) {
            // Toplam Gelir / Randevu Sayısı hesapla ve sırala
            const hizmetlerWithRatio = hizmetData.map(item => ({
              ...item,
              gelirPerRandevu: (Number(item.randevu_sayisi) || 0) > 0 
                ? (Number(item.toplam_gelir) || 0) / (Number(item.randevu_sayisi) || 1)
                : Number(item.ortalama_gelir) || 0
            }));
            
            const sortedByGelir = [...hizmetlerWithRatio].sort((a, b) => 
              (b.gelirPerRandevu || 0) - (a.gelirPerRandevu || 0)
            );
            
            setEnDegerliHizmet({
              hizmet: sortedByGelir[0].hizmet_ad || sortedByGelir[0].hizmet || "Bilinmeyen",
              ortalamaGelir: sortedByGelir[0].gelirPerRandevu || 0
            });
          }
        } catch (e) {
          console.error("❌ Hizmet veri hatası:", e);
        }

        // En Verimli Oran ve Fırsat/Risk Listeleri (talep/rakip oranı - mevcut şube hariç)
        try {
          const oranData = await getTalepRakipOrani();
          if (Array.isArray(oranData) && oranData.length > 0) {
            // Mevcut şubeyi hariç tut
            const filteredOranData = oranData.filter(item => {
              const ilceAd = (item.ilce_ad || item.ilce || "").toLowerCase();
              return ilceAd !== MEVCUT_SUBE_ILCE.toLowerCase();
            });
            
            if (filteredOranData.length > 0) {
              // Fırsat listesi: talep/rakip oranı en yüksek, eşitlikte randevu sayısı yüksek olan öne
              const sortedForFirsat = [...filteredOranData].sort((a, b) => {
                const oranDiff = (Number(b.talep_rakip_orani) || 0) - (Number(a.talep_rakip_orani) || 0);
                if (oranDiff !== 0) return oranDiff;
                return (Number(b.randevu_sayisi) || 0) - (Number(a.randevu_sayisi) || 0);
              });
              
              // Risk listesi: talep/rakip oranı en düşük, eşitlikte randevu sayısı düşük olan öne
              const sortedForRisk = [...filteredOranData].sort((a, b) => {
                const oranDiff = (Number(a.talep_rakip_orani) || 0) - (Number(b.talep_rakip_orani) || 0);
                if (oranDiff !== 0) return oranDiff;
                return (Number(a.randevu_sayisi) || 0) - (Number(b.randevu_sayisi) || 0);
              });
              
              // En Verimli Oran
              setEnVerimliOran({
                ilce: sortedForFirsat[0].ilce_ad || sortedForFirsat[0].ilce || "Bilinmeyen",
                oran: Number(sortedForFirsat[0].talep_rakip_orani) || 0
              });
              
              // Fırsat İlçeleri (ilk 3)
              setFirsatIlceler(sortedForFirsat.slice(0, 3).map(item => ({
                ilce: item.ilce_ad || item.ilce || "Bilinmeyen",
                oran: Number(item.talep_rakip_orani) || 0,
                randevuSayisi: Number(item.randevu_sayisi) || 0
              })));
              
              // Risk İlçeleri (ilk 3)
              setRiskIlceler(sortedForRisk.slice(0, 3).map(item => ({
                ilce: item.ilce_ad || item.ilce || "Bilinmeyen",
                oran: Number(item.talep_rakip_orani) || 0,
                randevuSayisi: Number(item.randevu_sayisi) || 0
              })));
            }
          }
        } catch (e) {
          console.error("❌ Talep/Rakip oranı veri hatası:", e);
        }
      } catch (e) {
        console.error("❌ Dashboard veri hatası:", e);
        setErrMsg(
          e?.response
            ? `API hata: ${e.response.status} ${JSON.stringify(e.response.data)}`
            : `API hata: ${e.message}`
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Hızlı Karar Özetleri için analizler
  const kararOzetleri = useMemo(() => {
    const ozetler = [];

    // 1. En yoğun ilçe bilgisi
    if (musteriIlce && musteriIlce.length > 0 && musteriIlce[0]) {
      const enYogunIlce = musteriIlce[0];
      ozetler.push({
        type: "ilce",
        title: "En Yoğun İlçe",
        content: `${enYogunIlce.ilce} ilçesi ${enYogunIlce.musteriSayisi.toLocaleString("tr-TR")} müşteri ile en yoğun bölge.`,
        icon: Users,
        color: "purple"
      });
    }

    // 2. Randevu trendi artış/azalış yorumu
    // Backend'den gelen veri DESC sıralı (en yeni ilk sırada)
    if (aylikRandevu && aylikRandevu.length >= 2) {
      const enEskiAy = aylikRandevu[aylikRandevu.length - 1]; // En eski ay (zaman içinde başlangıç)
      const enYeniAy = aylikRandevu[0]; // En yeni ay (zaman içinde son)
      
      if (enEskiAy && enYeniAy) {
        const eskiAySayi = enEskiAy.randevuSayisi || 0;
        const yeniAySayi = enYeniAy.randevuSayisi || 0;
        
        let trendYorumu = "";
        let trendIcon = Minus;
        let trendColor = "gray";
        
        if (yeniAySayi > eskiAySayi) {
          const artis = yeniAySayi - eskiAySayi;
          const yuzde = eskiAySayi > 0 ? ((artis / eskiAySayi) * 100).toFixed(1) : 100;
          trendYorumu = `Randevu sayısı son dönemde %${yuzde} artış gösterdi (${eskiAySayi} → ${yeniAySayi}).`;
          trendIcon = TrendingUp;
          trendColor = "green";
        } else if (yeniAySayi < eskiAySayi) {
          const azalis = eskiAySayi - yeniAySayi;
          const yuzde = eskiAySayi > 0 ? ((azalis / eskiAySayi) * 100).toFixed(1) : 0;
          trendYorumu = `Randevu sayısı son dönemde %${yuzde} azalış gösterdi (${eskiAySayi} → ${yeniAySayi}).`;
          trendIcon = TrendingDown;
          trendColor = "red";
        } else {
          trendYorumu = `Randevu sayısı sabit kaldı (${eskiAySayi} randevu).`;
        }
        
        ozetler.push({
          type: "trend",
          title: "Randevu Trendi",
          content: trendYorumu,
          icon: trendIcon,
          color: trendColor
        });
      }
    }

    // 3. Ortalama randevu değerine dair yorum
    if (stats.totalAppointments > 0) {
      const ortalamaRandevuDegeri = stats.totalRevenue / stats.totalAppointments;
      let degerYorumu = `Ortalama randevu değeri ${formatCurrency(ortalamaRandevuDegeri)}.`;
      
      if (ortalamaRandevuDegeri > 500) {
        degerYorumu += " Yüksek değerli hizmetler tercih ediliyor.";
      } else if (ortalamaRandevuDegeri > 200) {
        degerYorumu += " Orta seviye hizmetler popüler.";
      } else {
        degerYorumu += " Ekonomik hizmetler daha çok tercih ediliyor.";
      }
      
      ozetler.push({
        type: "ortalama",
        title: "Ortalama Randevu Değeri",
        content: degerYorumu,
        icon: DollarSign,
        color: "blue"
      });
    }

    return ozetler;
  }, [musteriIlce, aylikRandevu, stats]);

  if (loading) {
    return <div className="p-10 text-xl">Yükleniyor...</div>;
  }

  if (errMsg) {
    return (
      <div className="p-10">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <b>Dashboard API çağrısı başarısız</b>
          <div className="mt-2 text-sm">{errMsg}</div>
          <div className="mt-3 text-sm">
            Tarayıcıda şu açılıyor mu?{" "}
            <code>http://localhost:4000/api/dashboard/summary
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 text-purple-700">
        Dashboard - 2025
      </h1>
      <p className="text-sm text-gray-500 mb-8">Bu ekran genel durumu ve kısa vadeli aksiyon fırsatlarını özetler.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Toplam Müşteri"
          value={stats.totalCustomers.toLocaleString("tr-TR")}
          icon={Users}
          color="purple"
        />

        <KPICard
          title="Toplam Randevu"
          value={stats.totalAppointments.toLocaleString("tr-TR")}
          icon={Calendar}
          color="purple"
        />

        <KPICard
          title="Toplam Gelir"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="purple"
        />

        <KPICard
          title="Ortalama Randevu Değeri"
          value={formatCurrency(
            stats.totalAppointments > 0
              ? stats.totalRevenue / stats.totalAppointments
              : 0
          )}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Grafik Satırı - Yan Yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
        {/* Sol: Aylık Randevu Trendi - Premium Design */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-6 shadow-sm">
          <h2 className="text-base font-medium mb-2 text-gray-800">
            Randevu Trendi (Aylık)
          </h2>
          <p className="text-xs text-gray-500 mb-4">Aylık randevu sayısı değişimi</p>
          {aylikRandevu && aylikRandevu.length > 0 ? (() => {
            // En yüksek ve en düşük noktaları bul
            const maxValue = Math.max(...aylikRandevu.map(d => d.randevuSayisi || 0));
            const minValue = Math.min(...aylikRandevu.map(d => d.randevuSayisi || Infinity));
            const maxItem = aylikRandevu.find(d => d.randevuSayisi === maxValue);
            const minItem = aylikRandevu.find(d => d.randevuSayisi === minValue);
            
            return (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={aylikRandevu} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRandevu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="50%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#6d28d9" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#c9b8ff" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="ay" 
                    tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
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
                    formatter={(value) => [`${value} randevu`, '']}
                    labelFormatter={(label) => `📅 ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="randevuSayisi"
                    stroke="url(#strokeGradient)"
                    strokeWidth={3}
                    fill="url(#colorRandevu)"
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const isMax = payload.randevuSayisi === maxValue;
                      const isMin = payload.randevuSayisi === minValue;
                      
                      if (isMax) {
                        return (
                          <g key={`dot-max-${cx}`}>
                            <circle cx={cx} cy={cy} r={8} fill="#7c3aed" fillOpacity={0.2} />
                            <circle cx={cx} cy={cy} r={5} fill="#6d28d9" stroke="#fff" strokeWidth={2} />
                            <text x={cx} y={cy - 14} textAnchor="middle" fill="#059669" fontSize={10} fontWeight={600}>
                              ▲ Zirve
                            </text>
                          </g>
                        );
                      }
                      if (isMin) {
                        return (
                          <g key={`dot-min-${cx}`}>
                            <circle cx={cx} cy={cy} r={8} fill="#f87171" fillOpacity={0.2} />
                            <circle cx={cx} cy={cy} r={5} fill="#dc2626" stroke="#fff" strokeWidth={2} />
                            <text x={cx} y={cy + 20} textAnchor="middle" fill="#dc2626" fontSize={10} fontWeight={600}>
                              ▼ Düşük
                            </text>
                          </g>
                        );
                      }
                      return (
                        <circle 
                          key={`dot-${cx}`}
                          cx={cx} 
                          cy={cy} 
                          r={4} 
                          fill="#7c3aed" 
                          stroke="#fff" 
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{
                      r: 8,
                      fill: '#6d28d9',
                      stroke: '#c4b5fd',
                      strokeWidth: 3,
                      style: { filter: 'drop-shadow(0 0 6px rgba(124, 58, 237, 0.5))' }
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            );
          })() : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>Henüz yeterli veri yok</p>
            </div>
          )}
        </div>

        {/* Sağ: En Yoğun İlçeler - Premium Style */}
        <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-xl border border-purple-100 p-6 shadow-sm">
          <h2 className="text-base font-medium mb-2 text-gray-800">
            Müşteri Sayısı (İlçe)
          </h2>
          <p className="text-xs text-gray-500 mb-4">En yoğun 5 ilçe</p>
          {musteriIlce && musteriIlce.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={musteriIlce}>
                <defs>
                  <linearGradient id="barGradientMusteri" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={1} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#c9b8ff" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="ilce" 
                  tick={{ fill: '#5b21b6', fontSize: 11, fontWeight: 500 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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
                  formatter={(value) => [`${value} müşteri`, '']}
                  labelFormatter={(label) => `📍 ${label}`}
                  cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
                />
                <Bar 
                  dataKey="musteriSayisi" 
                  radius={[8, 8, 0, 0]}
                >
                  {(() => {
                    const maxValue = Math.max(...musteriIlce.map(item => item.musteriSayisi || 0), 1);
                    // Mor paleti - gradient tonları
                    const MOR_PALETI = {
                      cokAcik: '#ede9fe',
                      acik: '#ddd6fe',
                      orta: '#c4b5fd',
                      koyu: '#a78bfa',
                      enKoyu: '#8b5cf6',
                      cokKoyu: '#7c3aed'
                    };
                    return musteriIlce.map((entry, index) => {
                      const musteriSayisi = entry.musteriSayisi || 0;
                      const isMax = musteriSayisi === maxValue;
                      const ratio = maxValue > 0 ? musteriSayisi / maxValue : 0;
                      let fillColor;
                      if (isMax) {
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
              <p>Henüz yeterli veri yok</p>
            </div>
          )}
        </div>
      </div>

      {/* Performansı En Çok Etkileyen Faktörler */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Performansı En Çok Etkileyen Faktörler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* En Güçlü İlçe */}
          <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">En Güçlü İlçe</span>
            </div>
            <p className="text-xl font-bold text-purple-700">{enGucluIlce?.ilce || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">
              {enGucluIlce ? `${enGucluIlce.randevuSayisi} randevu` : "Veri bekleniyor..."}
            </p>
          </div>

          {/* En Değerli Hizmet */}
          <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">En Değerli Hizmet</span>
            </div>
            <p className="text-xl font-bold text-amber-700">{enDegerliHizmet?.hizmet || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">
              {enDegerliHizmet ? `${formatCurrency(enDegerliHizmet.ortalamaGelir)} / randevu` : "Veri bekleniyor..."}
            </p>
          </div>

          {/* En Verimli Oran */}
          <div className="bg-white rounded-xl border border-purple-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">En Verimli Oran</span>
            </div>
            <p className="text-xl font-bold text-green-700">{enVerimliOran?.ilce || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">
              {enVerimliOran ? `Talep/Rakip: ${enVerimliOran.oran.toFixed(2)}` : "Veri bekleniyor..."}
            </p>
          </div>
        </div>
      </div>

      {/* Fırsat & Risk Özeti */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Fırsat & Risk Özeti</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sol Kutu: Kısa Vadeli Fırsatlar */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🟢</span>
              <h3 className="text-base font-semibold text-green-800">Kısa Vadeli Fırsatlar</h3>
            </div>
            {firsatIlceler.length > 0 ? (
              <ul className="space-y-3">
                {firsatIlceler.map((item, index) => (
                  <li key={index} className="flex items-center justify-between bg-white/70 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-green-600 bg-green-100 w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-800">{item.ilce}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{item.randevuSayisi} randevu</span>
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                        {item.oran.toFixed(2)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Veri bekleniyor...</p>
            )}
          </div>

          {/* Sağ Kutu: Risk / Düşük Öncelik */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🔴</span>
              <h3 className="text-base font-semibold text-red-800">Risk / Düşük Öncelik</h3>
            </div>
            {riskIlceler.length > 0 ? (
              <ul className="space-y-3">
                {riskIlceler.map((item, index) => (
                  <li key={index} className="flex items-center justify-between bg-white/70 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-red-600 bg-red-100 w-6 h-6 rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-800">{item.ilce}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{item.randevuSayisi} randevu</span>
                      <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
                        {item.oran.toFixed(2)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Veri bekleniyor...</p>
            )}
          </div>
        </div>
      </div>

      {/* Hızlı Karar Özetleri */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-purple-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-purple-800">
            Hızlı Karar Özetleri
          </h2>
        </div>

        {kararOzetleri && kararOzetleri.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kararOzetleri.map((ozet, index) => {
              const Icon = ozet.icon;
              const colorClasses = {
                purple: "bg-purple-500",
                green: "bg-green-500",
                red: "bg-red-500",
                blue: "bg-blue-500",
                gray: "bg-gray-500"
              };
              
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md border border-purple-100 p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`${colorClasses[ozet.color]} p-2 rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-700">
                      {ozet.title}
                    </h3>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {ozet.content}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-purple-600">
            <p className="text-lg">Henüz karar üretilemedi</p>
          </div>
        )}
      </div>
    </div>
  );
}
