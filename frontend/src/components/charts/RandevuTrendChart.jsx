import { useEffect, useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { getRandevuAylik } from "../../services/dssService";
import { Lightbulb, TrendingUp, TrendingDown } from "lucide-react";

export default function RandevuTrendChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRandevuAylik()
      .then((res) => {
        console.log("RandevuAylik API Response:", res.data);
        const rawData = res.data || [];
        if (rawData.length === 0) {
          console.warn("No monthly appointment data received from API");
        }
        // Format the date for better display
        const formattedData = rawData.map(item => ({
          ay: item.ay ? item.ay.substring(5) : '', // Extract MM from YYYY-MM
          ay_full: item.ay || '',
          sayi: Number(item.sayi) || 0
        }));
        setData(formattedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching monthly appointments:", err);
        console.error("Error details:", err.response?.data || err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Talep Trendi Yorumu için hesaplamalar
  const trendAnalysis = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    const ilkAy = data[0];
    const sonAy = data[data.length - 1];
    
    if (!ilkAy || !sonAy) {
      return null;
    }

    const ilkAySayi = ilkAy.sayi || 0;
    const sonAySayi = sonAy.sayi || 0;

    // Artış/Azalış kontrolü
    const artiyor = sonAySayi > ilkAySayi;
    const azaliyor = sonAySayi < ilkAySayi;
    const sabit = sonAySayi === ilkAySayi;

    // Yüzde değişim hesaplama
    let yuzdeDegisim = 0;
    if (ilkAySayi > 0) {
      yuzdeDegisim = ((sonAySayi - ilkAySayi) / ilkAySayi) * 100;
    } else if (sonAySayi > 0) {
      yuzdeDegisim = 100; // İlk ay 0, son ay > 0
    }

    // En düşük randevu sayısına sahip ay (kampanya için uygun)
    const enDusukAy = data.reduce((min, item) => {
      return (item.sayi || 0) < (min.sayi || 0) ? item : min;
    }, data[0]);

    return {
      ilkAy: ilkAy.ay || '-',
      sonAy: sonAy.ay || '-',
      ilkAySayi,
      sonAySayi,
      artiyor,
      azaliyor,
      sabit,
      yuzdeDegisim: Math.abs(yuzdeDegisim),
      enDusukAy: enDusukAy?.ay || '-',
      enDusukAySayi: enDusukAy?.sayi || 0
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-purple-600">
        <p>Henüz veri bulunamadı</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-700">Aylık Randevu Trendi</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
            <XAxis 
              dataKey="ay" 
              tick={{ fill: '#6b5b95', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#6b5b95' }} />
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
              dataKey="sayi" 
              stroke="#7c3aed" 
              strokeWidth={3}
              dot={{ fill: '#a78bfa', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Talep Trendi Yorumu */}
      {trendAnalysis && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-lg border-2 border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-600 p-2 rounded-lg">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-orange-800">
              Talep Trendi Yorumu
            </h3>
          </div>

          <div className="space-y-4">
            {/* Artış/Azalış Durumu */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Randevu Sayısı Trendi
              </p>
              <div className="flex items-center gap-2">
                {trendAnalysis.artiyor && (
                  <>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <p className="text-lg font-bold text-green-700">
                      Randevu sayısı artıyor
                    </p>
                  </>
                )}
                {trendAnalysis.azaliyor && (
                  <>
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <p className="text-lg font-bold text-red-700">
                      Randevu sayısı azalıyor
                    </p>
                  </>
                )}
                {trendAnalysis.sabit && (
                  <p className="text-lg font-bold text-gray-700">
                    Randevu sayısı sabit
                  </p>
                )}
              </div>
            </div>

            {/* Yüzde Değişim */}
            <div className="bg-white rounded-lg p-4 border border-orange-100">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Son Ay ({trendAnalysis.sonAy}) ile İlk Ay ({trendAnalysis.ilkAy}) Arasındaki Değişim
              </p>
              <p className="text-lg font-bold text-orange-700">
                {trendAnalysis.yuzdeDegisim.toFixed(1)}%
                {trendAnalysis.artiyor && <span className="text-green-600 ml-2">↑ Artış</span>}
                {trendAnalysis.azaliyor && <span className="text-red-600 ml-2">↓ Azalış</span>}
                {trendAnalysis.sabit && <span className="text-gray-600 ml-2">→ Değişim yok</span>}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                İlk ay: {trendAnalysis.ilkAySayi} randevu → Son ay: {trendAnalysis.sonAySayi} randevu
              </p>
            </div>

            {/* Kampanya Önerisi */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Kampanya İçin Uygun Ay
              </p>
              <p className="text-lg font-bold text-purple-700">
                {trendAnalysis.enDusukAy}
                {trendAnalysis.enDusukAySayi > 0 && (
                  <span className="text-gray-600 font-normal ml-2">
                    ({trendAnalysis.enDusukAySayi} randevu - En düşük talep)
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                💡 Bu ayda düşük talep olduğu için kampanya ile randevu sayısını artırabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

