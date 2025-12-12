import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getMusteriIlce } from "../../services/dssService";

const COLORS = ["#7c3aed", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f3e8ff"];

export default function MusteriIlceChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMusteriIlce()
      .then((res) => {
        console.log("MusteriIlce API Response:", res.data);
        const data = res.data || [];
        if (data.length === 0) {
          console.warn("No customer distribution data received from API");
        }
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching customer distribution:", err);
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
      <h2 className="text-xl font-semibold mb-4 text-purple-700">İlçelere Göre Müşteri Dağılımı</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="sayi"
            nameKey="ilce"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ ilce, sayi }) => `${ilce}: ${sayi}`}
          >
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#faf5ff', 
              border: '1px solid #c4b5fd',
              borderRadius: '8px'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

