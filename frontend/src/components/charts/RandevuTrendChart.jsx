import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { getRandevuAylik } from "../../services/dssService";

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

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-purple-600">
        <p>Henüz veri bulunamadı</p>
      </div>
    );
  }

  return (
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
  );
}

