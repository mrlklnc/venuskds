import { useEffect, useState, useMemo } from "react";
import { getDashboardSummary } from "../services/dashboardService";
import { getRandevuAylik, getMusteriIlce } from "../services/dssService";
import KPICard from "../components/KPICard";
import { DollarSign, Users, Calendar, TrendingUp, TrendingDown, Minus, Lightbulb } from "lucide-react";
import { formatCurrency } from "../utils/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";

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
          setAylikRandevu(formattedData);
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
      <h1 className="text-3xl font-semibold mb-8 text-purple-700">
        Dashboard - 2025
      </h1>

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

      {/* Aylık Randevu Trendi */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">
          Aylık Randevu Trendi
        </h2>
        {aylikRandevu && aylikRandevu.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={aylikRandevu}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
              <XAxis 
                dataKey="ay" 
                tick={{ fill: '#6b5b95', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#6b5b95' }}
                label={{ value: 'Randevu Sayısı', angle: -90, position: 'insideLeft', fill: '#6b5b95' }}
              />
              <Tooltip 
                formatter={(value) => [value, 'Randevu Sayısı']}
                labelFormatter={(label) => `Ay: ${label}`}
                contentStyle={{ 
                  backgroundColor: '#faf5ff', 
                  border: '1px solid #c4b5fd',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="randevuSayisi" 
                stroke="#7c3aed" 
                strokeWidth={3}
                dot={{ fill: '#a78bfa', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-purple-600">
            <p>Henüz yeterli veri yok</p>
          </div>
        )}
      </div>

      {/* En Yoğun İlçeler */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">
          En Yoğun İlçeler
        </h2>
        {musteriIlce && musteriIlce.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={musteriIlce}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
              <XAxis 
                dataKey="ilce" 
                tick={{ fill: '#6b5b95', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis 
                tick={{ fill: '#6b5b95' }}
                label={{ value: 'Müşteri Sayısı', angle: -90, position: 'insideLeft', fill: '#6b5b95' }}
              />
              <Tooltip 
                formatter={(value) => [value, 'Müşteri Sayısı']}
                labelFormatter={(label) => `İlçe: ${label}`}
                contentStyle={{ 
                  backgroundColor: '#faf5ff', 
                  border: '1px solid #c4b5fd',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="musteriSayisi" 
                fill="#7c3aed"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-purple-600">
            <p>Henüz yeterli veri yok</p>
          </div>
        )}
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
