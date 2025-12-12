import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#7c3aed", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f3e8ff"];

export default function MusteriIlceChart({ data = [] }) {
  console.log("MusteriIlceChart data:", data);

  if (!data || data.length === 0) {
    return <div style={{ color: "red" }}>Musteri ilçe verisi BOŞ</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
      <h2 className="text-xl font-semibold mb-4 text-purple-700">İlçelere Göre Müşteri Dağılımı</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
          <XAxis 
            dataKey="ilce" 
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: '#6b5b95', fontSize: 12 }}
          />
          <YAxis tick={{ fill: '#6b5b95' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#faf5ff', 
              border: '1px solid #c4b5fd',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="musteri_sayisi" fill="#7c3aed" radius={[8, 8, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
