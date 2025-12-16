import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';

export default function CompetitorAnalytics({ data }) {

  /* =====================
     GÜVENLİK KONTROLLERİ
  ====================== */

  const competitors = Array.isArray(data?.rakipAnalizi)
    ? data.rakipAnalizi
    : [];

  if (competitors.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-purple-100 p-6 text-purple-600">
        Rakip analizi verisi henüz bulunamadı
      </div>
    );
  }

  /* =====================
     İLÇEYE GÖRE RAKİP
  ====================== */

  const districtCompetitorData = useMemo(() => {
    const map = {};
    competitors.forEach((c) => {
      const ilce = c.ilce_ad || 'Bilinmeyen';
      map[ilce] = (map[ilce] || 0) + 1;
    });

    return Object.entries(map)
      .map(([ilce_ad, rakip_sayisi]) => ({ ilce_ad, rakip_sayisi }))
      .sort((a, b) => b.rakip_sayisi - a.rakip_sayisi);
  }, [competitors]);

  const colors = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe'];

  const highest = districtCompetitorData[0];
  const lowest = districtCompetitorData[districtCompetitorData.length - 1];

  // Rekabet Değerlendirmesi için hesaplamalar
  const enYuksekRekabetliIlce = districtCompetitorData.length > 0 
    ? districtCompetitorData[0] 
    : null;
  
  const enDusukRekabetliIlce = districtCompetitorData.length > 0 
    ? districtCompetitorData[districtCompetitorData.length - 1] 
    : null;
  
  // Şube açılması önerilen ilçe: En düşük rekabetli ilçe
  const onerilenIlce = enDusukRekabetliIlce;

  /* =====================
     RENDER
  ====================== */

  return (
    <div className="space-y-6">

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">
          İlçelere Göre Rakip Sayısı
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={districtCompetitorData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
            <XAxis
              dataKey="ilce_ad"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="rakip_sayisi">
              {districtCompetitorData.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-600" />
            <h3 className="font-semibold text-green-800">
              En Düşük Rekabet
            </h3>
          </div>
          <p className="text-green-700 font-medium">
            {lowest?.ilce_ad} – {lowest?.rakip_sayisi} rakip
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-orange-600" />
            <h3 className="font-semibold text-orange-800">
              En Yüksek Rekabet
            </h3>
          </div>
          <p className="text-orange-700 font-medium">
            {highest?.ilce_ad} – {highest?.rakip_sayisi} rakip
          </p>
        </div>

      </div>

      {/* Rekabet Değerlendirmesi */}
      {districtCompetitorData.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg border-2 border-indigo-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-indigo-800">
              Rekabet Değerlendirmesi
            </h3>
          </div>

          <div className="space-y-4">
            {/* En Düşük Rekabetli İlçe */}
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <p className="text-sm font-medium text-gray-600 mb-1">
                En Düşük Rekabetli İlçe
              </p>
              <p className="text-lg font-bold text-indigo-700">
                {enDusukRekabetliIlce?.ilce_ad || "-"}
                {enDusukRekabetliIlce?.rakip_sayisi !== undefined && (
                  <span className="text-gray-600 font-normal ml-2">
                    ({enDusukRekabetliIlce.rakip_sayisi} rakip)
                  </span>
                )}
              </p>
            </div>

            {/* En Yüksek Rekabetli İlçe */}
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <p className="text-sm font-medium text-gray-600 mb-1">
                En Yüksek Rekabetli İlçe
              </p>
              <p className="text-lg font-bold text-indigo-700">
                {enYuksekRekabetliIlce?.ilce_ad || "-"}
                {enYuksekRekabetliIlce?.rakip_sayisi !== undefined && (
                  <span className="text-gray-600 font-normal ml-2">
                    ({enYuksekRekabetliIlce.rakip_sayisi} rakip)
                  </span>
                )}
              </p>
            </div>

            {/* Şube Açılması Önerilen İlçe */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
              <p className="text-sm font-medium text-gray-600 mb-1">
                Şube Açılması Önerilen İlçe
              </p>
              <p className="text-lg font-bold text-green-700">
                {onerilenIlce?.ilce_ad || "-"}
                {onerilenIlce?.rakip_sayisi !== undefined && (
                  <span className="text-gray-600 font-normal ml-2">
                    ({onerilenIlce.rakip_sayisi} rakip - Düşük rekabet)
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                💡 Bu ilçede düşük rekabet olduğu için yeni şube açmak için uygun bir fırsat olabilir.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


