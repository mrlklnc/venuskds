import { useMemo } from "react";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "../../utils/format";
import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";

export default function ServiceAnalytics({ data }) {
  /* =================================================
     🔒 GÜVENLİ VERİ ALANI (ASLA UNDEFINED DEĞİL)
  ================================================= */
  const appointments = Array.isArray(data?.appointments)
    ? data.appointments
    : [];

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-purple-100 p-6 text-purple-600">
        Hizmet performansı için yeterli veri bulunamadı
      </div>
    );
  }

  /* =================================================
     📊 HİZMET TALEBİ (RANDEVU SAYISI)
  ================================================= */
  const serviceDemandData = useMemo(() => {
    const map = {};

    appointments.forEach((apt) => {
      const hizmetAdi =
        apt.hizmet_ad ||
        apt.hizmet?.hizmet_ad ||
        "Bilinmeyen Hizmet";

      map[hizmetAdi] = (map[hizmetAdi] || 0) + 1;
    });

    return Object.entries(map)
      .map(([hizmet_ad, talep]) => ({ hizmet_ad, talep }))
      .sort((a, b) => b.talep - a.talep);
  }, [appointments]);

  /* =================================================
     💰 HİZMET GELİRİ
  ================================================= */
  const serviceRevenueData = useMemo(() => {
    const map = {};

    appointments.forEach((apt) => {
      const hizmetAdi =
        apt.hizmet_ad ||
        apt.hizmet?.hizmet_ad ||
        "Bilinmeyen Hizmet";

      const fiyat = Number(apt.ucret || apt.fiyat || 0);

      map[hizmetAdi] = (map[hizmetAdi] || 0) + fiyat;
    });

    return Object.entries(map)
      .map(([hizmet_ad, gelir]) => ({ hizmet_ad, gelir }))
      .sort((a, b) => b.gelir - a.gelir);
  }, [appointments]);

  /* =================================================
     ⚖️ FİYAT KARŞILAŞTIRMASI (ORTALAMA)
  ================================================= */
  const priceComparisonData = useMemo(() => {
    const map = {};

    appointments.forEach((apt) => {
      const hizmetAdi =
        apt.hizmet_ad ||
        apt.hizmet?.hizmet_ad ||
        "Bilinmeyen Hizmet";

      const fiyat = Number(apt.ucret || apt.fiyat || 0);

      if (!map[hizmetAdi]) map[hizmetAdi] = [];

      map[hizmetAdi].push(fiyat);
    });

    return Object.entries(map)
      .map(([hizmet_ad, prices]) => {
        const ort = prices.reduce((a, b) => a + b, 0) / prices.length;

        return {
          hizmet_ad,
          bizim_fiyat: ort,
          rakip_ort_fiyat: ort * 0.85, // simülasyon
        };
      })
      .slice(0, 10);
  }, [appointments]);

  /* =================================================
     📌 ÖZETLER
  ================================================= */
  const topService = serviceRevenueData[0];
  const mostDemanded = serviceDemandData[0];
  const totalRevenue = serviceRevenueData.reduce(
    (sum, s) => sum + s.gelir,
    0
  );

  /* =================================================
     🔍 HİZMET PERFORMANSI SONUÇLARI ANALİZİ
  ================================================= */
  const performanceAnalysis = useMemo(() => {
    if (serviceRevenueData.length === 0 || serviceDemandData.length === 0) {
      return null;
    }

    // En çok gelir getiren hizmet
    const enCokGelir = serviceRevenueData[0];

    // En çok talep edilen hizmet
    const enCokTalep = serviceDemandData[0];

    // Talep yüksek ama gelir düşük hizmetleri bul
    const uyariHizmetler = [];
    
    // Her hizmet için talep ve gelir karşılaştırması
    const hizmetMap = new Map();
    
    // Talep verilerini map'e ekle
    serviceDemandData.forEach((item) => {
      hizmetMap.set(item.hizmet_ad, {
        hizmet_ad: item.hizmet_ad,
        talep: item.talep,
        gelir: 0
      });
    });

    // Gelir verilerini map'e ekle
    serviceRevenueData.forEach((item) => {
      if (hizmetMap.has(item.hizmet_ad)) {
        hizmetMap.get(item.hizmet_ad).gelir = item.gelir;
      } else {
        hizmetMap.set(item.hizmet_ad, {
          hizmet_ad: item.hizmet_ad,
          talep: 0,
          gelir: item.gelir
        });
      }
    });

    // Ortalama talep ve gelir hesapla
    const hizmetler = Array.from(hizmetMap.values());
    const ortalamaTalep = hizmetler.reduce((sum, h) => sum + h.talep, 0) / hizmetler.length;
    const ortalamaGelir = hizmetler.reduce((sum, h) => sum + h.gelir, 0) / hizmetler.length;

    // Talep yüksek ama gelir düşük olanları bul
    hizmetler.forEach((hizmet) => {
      if (hizmet.talep > ortalamaTalep && hizmet.gelir < ortalamaGelir) {
        uyariHizmetler.push(hizmet);
      }
    });

    return {
      enCokGelir,
      enCokTalep,
      uyariHizmetler
    };
  }, [serviceRevenueData, serviceDemandData]);

  const colors = [
    "#7c3aed",
    "#a78bfa",
    "#c4b5fd",
    "#ddd6fe",
    "#ede9fe",
  ];

  /* =================================================
     🧠 RENDER
  ================================================= */
  return (
    <div className="space-y-6">
      {/* ÜST GRAFİKLER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Talep */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">
            En Çok Talep Edilen Hizmetler
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceDemandData.slice(0, 5)}
                dataKey="talep"
                nameKey="hizmet_ad"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {serviceDemandData.slice(0, 5).map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gelir */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">
            Hizmet Bazlı Gelir
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceRevenueData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hizmet_ad" angle={-30} textAnchor="end" />
              <YAxis />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="gelir">
                {serviceRevenueData.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ALT KART */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border-2 border-purple-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-purple-800">
            Hizmet Performans Özeti
          </h3>
        </div>

        <div className="space-y-2">
          <p>
            <strong>En Karlı Hizmet:</strong>{" "}
            {topService?.hizmet_ad} –{" "}
            {formatCurrency(topService?.gelir || 0)}
          </p>

          <p>
            <strong>En Çok Talep Edilen:</strong>{" "}
            {mostDemanded?.hizmet_ad} (
            {mostDemanded?.talep} randevu)
          </p>

          <p className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Toplam gelir: {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {/* HİZMET PERFORMANSI SONUÇLARI */}
      {performanceAnalysis && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg border-2 border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-blue-800">
              Hizmet Performansı Sonuçları
            </h3>
          </div>

          <div className="space-y-4">
            {/* En Çok Gelir Getiren Hizmet */}
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm font-medium text-gray-600 mb-2">
                En Çok Gelir Getiren Hizmet
              </p>
              <p className="text-lg font-bold text-blue-700">
                {performanceAnalysis.enCokGelir?.hizmet_ad || "-"}
                {performanceAnalysis.enCokGelir?.gelir !== undefined && (
                  <span className="text-gray-600 font-normal ml-2">
                    ({formatCurrency(performanceAnalysis.enCokGelir.gelir)})
                  </span>
                )}
              </p>
            </div>

            {/* En Çok Talep Edilen Hizmet */}
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <p className="text-sm font-medium text-gray-600 mb-2">
                En Çok Talep Edilen Hizmet
              </p>
              <p className="text-lg font-bold text-blue-700">
                {performanceAnalysis.enCokTalep?.hizmet_ad || "-"}
                {performanceAnalysis.enCokTalep?.talep !== undefined && (
                  <span className="text-gray-600 font-normal ml-2">
                    ({performanceAnalysis.enCokTalep.talep} randevu)
                  </span>
                )}
              </p>
            </div>

            {/* Uyarı: Talep Yüksek Ama Gelir Düşük */}
            {performanceAnalysis.uyariHizmetler.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-300">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm font-medium text-gray-700">
                    ⚠️ Talep Yüksek Ama Gelir Düşük Hizmetler
                  </p>
                </div>
                <div className="space-y-2">
                  {performanceAnalysis.uyariHizmetler.map((hizmet, index) => (
                    <div key={index} className="bg-white rounded p-3 border border-yellow-200">
                      <p className="font-semibold text-gray-800">{hizmet.hizmet_ad}</p>
                      <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span>Talep: {hizmet.talep} randevu</span>
                        <span>Gelir: {formatCurrency(hizmet.gelir)}</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-2">
                        💡 Bu hizmet yüksek talep görüyor ancak gelir düşük. Fiyatlandırma stratejisini gözden geçirmeyi düşünün.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


