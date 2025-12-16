import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Lightbulb, TrendingUp } from "lucide-react";

export default function CustomerAnalytics({ data }) {
  const customers = data?.musteriIlce || [];
  const appointments = data?.aylikRandevu || [];

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-purple-100 p-6 text-purple-600">
        Müşteri analizi verisi henüz yüklenmedi
      </div>
    );
  }

  /* ======================
     İlçe Bazlı Müşteri
  ====================== */
  const districtCustomerData = useMemo(() => {
    return customers
      .map((item) => ({
        ilce_ad: item.ilce,
        musteri_sayisi: item.musteri_sayisi
      }))
      .sort((a, b) => b.musteri_sayisi - a.musteri_sayisi);
  }, [customers]);

  /* ======================
     Aylık Randevu Trendi
  ====================== */
  const monthlyAppointmentData = useMemo(() => {
    return appointments.map((item) => ({
      ay: item.ay,
      randevu_sayisi: item.sayi
    }));
  }, [appointments]);

  const topDistrict = districtCustomerData[0];
  const totalCustomers = districtCustomerData.reduce(
    (sum, d) => sum + d.musteri_sayisi,
    0
  );

  // Müşteri Analizi Yorumu için hesaplamalar
  const enYuksekIlce = districtCustomerData.length > 0 
    ? districtCustomerData[0] 
    : null;
  
  const enDusukIlce = districtCustomerData.length > 0 
    ? districtCustomerData[districtCustomerData.length - 1] 
    : null;
  
  // Şube açmak için önerilen ilçe: En düşük müşteri sayısına sahip (düşük rekabet)
  const onerilenIlce = enDusukIlce;

  const colors = [
    "#7c3aed",
    "#a78bfa",
    "#c4b5fd",
    "#ddd6fe",
    "#ede9fe"
  ];

  return (
    <div className="space-y-6">
      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* İlçe Dağılımı */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">
            İlçelere Göre Müşteri Dağılımı
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={districtCustomerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
              <XAxis dataKey="ilce_ad" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="musteri_sayisi" radius={[8, 8, 0, 0]}>
                {districtCustomerData.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Aylık Randevu */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">
            Aylık Randevu Trendi
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyAppointmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
              <XAxis dataKey="ay" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="randevu_sayisi" fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Özet Kart */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg border-2 border-purple-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-600 p-2 rounded-lg">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-purple-800">
            Karar Destek Özeti
          </h3>
        </div>

        <div className="space-y-3">
          <p className="text-purple-700">
            <strong>En yüksek müşteri yoğunluğu:</strong>{" "}
            {topDistrict?.ilce_ad} (
            {topDistrict?.musteri_sayisi})
          </p>

          <p className="text-purple-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Toplam müşteri sayısı: {totalCustomers}
          </p>
        </div>
      </div>

      {/* Müşteri Analizi Yorumu */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-blue-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-blue-800">
            Müşteri Analizi Yorumu
          </h3>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-sm font-medium text-gray-600 mb-1">
              En Yüksek Müşteri Sayısına Sahip İlçe
            </p>
            <p className="text-lg font-bold text-blue-700">
              {enYuksekIlce?.ilce_ad || "-"} 
              {enYuksekIlce?.musteri_sayisi !== undefined && (
                <span className="text-gray-600 font-normal ml-2">
                  ({enYuksekIlce.musteri_sayisi} müşteri)
                </span>
              )}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-sm font-medium text-gray-600 mb-1">
              En Düşük Müşteri Sayısına Sahip İlçe
            </p>
            <p className="text-lg font-bold text-blue-700">
              {enDusukIlce?.ilce_ad || "-"}
              {enDusukIlce?.musteri_sayisi !== undefined && (
                <span className="text-gray-600 font-normal ml-2">
                  ({enDusukIlce.musteri_sayisi} müşteri)
                </span>
              )}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
            <p className="text-sm font-medium text-gray-600 mb-1">
              Şube Açmak İçin Önerilen İlçe
            </p>
            <p className="text-lg font-bold text-green-700">
              {onerilenIlce?.ilce_ad || "-"}
              {onerilenIlce?.musteri_sayisi !== undefined && (
                <span className="text-gray-600 font-normal ml-2">
                  ({onerilenIlce.musteri_sayisi} müşteri - Düşük rekabet potansiyeli)
                </span>
              )}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              💡 Bu ilçede düşük müşteri yoğunluğu nedeniyle rekabet daha az olabilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


