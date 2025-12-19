import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { Users, DollarSign, TrendingUp, AlertTriangle, Building2, Calculator } from 'lucide-react';

export default function FinansalSenaryolar() {
  // Varsayılan değerler
  const [personelSayisi, setPersonelSayisi] = useState(5);
  const [personelMaasi, setPersonelMaasi] = useState(20000);
  const [kira, setKira] = useState(30000);
  const [digerGiderler, setDigerGiderler] = useState(10000);
  const [ortalamaHizmetFiyati, setOrtalamaHizmetFiyati] = useState(1500);
  const [baseMusteri, setBaseMusteri] = useState(60); // Baz aylık müşteri (potansiyel)

  // Müşteri segmentleri (sabit varsayım)
  const musteriSegmentleri = {
    tekSeans: { oran: 0.40, randevu: 1, aciklama: 'Tek Seans Müşterisi' },
    duzenli: { oran: 0.35, randevu: 2, aciklama: 'Düzenli Müşteri' },
    paketli: { oran: 0.20, randevu: 3, aciklama: 'Paketli Müşteri' },
    sadik: { oran: 0.05, randevu: 4, aciklama: 'Sadık Müşteri' }
  };

  // Ağırlıklı ortalama randevu hesaplama
  const agirlikliOrtalamaRandevu = 
    musteriSegmentleri.tekSeans.oran * musteriSegmentleri.tekSeans.randevu +
    musteriSegmentleri.duzenli.oran * musteriSegmentleri.duzenli.randevu +
    musteriSegmentleri.paketli.oran * musteriSegmentleri.paketli.randevu +
    musteriSegmentleri.sadik.oran * musteriSegmentleri.sadik.randevu;

  // Hesaplamalar
  const personelGideri = personelSayisi * personelMaasi;
  const toplamGider = personelGideri + kira + digerGiderler;
  
  // Randevu bazlı hesaplama (segment dağılımına göre)
  const aylikRandevu = Math.round(baseMusteri * agirlikliOrtalamaRandevu);
  const aylikCiro = aylikRandevu * ortalamaHizmetFiyati;
  const netKar = aylikCiro - toplamGider;
  const karMarji = aylikCiro > 0 ? (netKar / aylikCiro) * 100 : 0;

  // Risk Seviyesi
  let riskSeviyesi;
  let riskRenk;
  if (netKar < 0) {
    riskSeviyesi = 'Yüksek';
    riskRenk = { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
  } else if (netKar <= 30000) {
    riskSeviyesi = 'Orta';
    riskRenk = { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
  } else {
    riskSeviyesi = 'Düşük';
    riskRenk = { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
  }

  // Para formatı
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  // Grafik verisi
  const grafikVerisi = [
    {
      name: 'Aylık Ciro',
      deger: aylikCiro
    },
    {
      name: 'Toplam Gider',
      deger: toplamGider
    },
    {
      name: 'Net Kâr',
      deger: netKar
    }
  ];

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Finansal Senaryolar</h1>
        <p className="text-gray-600">İş modelinizi parametrelere göre simüle edin</p>
      </div>

      {/* Parametre Girişleri */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-800">İş Modeli Parametreleri</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Baz Aylık Müşteri (Potansiyel) - Read-only */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Baz Aylık Müşteri (Potansiyel)
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={baseMusteri}
              onChange={(e) => setBaseMusteri(Number(e.target.value) || 60)}
              className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Bu değer Şube Açma Simülasyonu sonuçlarından alınabilir.
            </p>
          </div>
          {/* Personel Sayısı */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Personel Sayısı: {personelSayisi}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={personelSayisi}
              onChange={(e) => setPersonelSayisi(Number(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>20</span>
            </div>
          </div>

          {/* Personel Maaşı */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Personel Maaşı: {formatCurrency(personelMaasi)}
            </label>
            <input
              type="range"
              min="10000"
              max="50000"
              step="1000"
              value={personelMaasi}
              onChange={(e) => setPersonelMaasi(Number(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatCurrency(10000)}</span>
              <span>{formatCurrency(50000)}</span>
            </div>
          </div>

          {/* Kira */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kira: {formatCurrency(kira)}
            </label>
            <input
              type="range"
              min="10000"
              max="100000"
              step="5000"
              value={kira}
              onChange={(e) => setKira(Number(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatCurrency(10000)}</span>
              <span>{formatCurrency(100000)}</span>
            </div>
          </div>

          {/* Diğer Giderler */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Diğer Giderler: {formatCurrency(digerGiderler)}
            </label>
            <input
              type="range"
              min="0"
              max="50000"
              step="1000"
              value={digerGiderler}
              onChange={(e) => setDigerGiderler(Number(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatCurrency(0)}</span>
              <span>{formatCurrency(50000)}</span>
            </div>
          </div>

          {/* Ortalama Hizmet Fiyatı */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ortalama Hizmet Fiyatı: {formatCurrency(ortalamaHizmetFiyati)}
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={ortalamaHizmetFiyati}
              onChange={(e) => setOrtalamaHizmetFiyati(Number(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatCurrency(500)}</span>
              <span>{formatCurrency(5000)}</span>
            </div>
          </div>


        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Aylık Ciro */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md border border-green-300 p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-green-100">Aylık Ciro</h4>
              <p className="text-2xl font-bold">{formatCurrency(aylikCiro)}</p>
            </div>
          </div>
          <p className="text-xs text-green-100">
            Aylık Randevu × Ortalama Fiyat
          </p>
          <p className="text-xs text-green-200 mt-1">
            Aylık Randevu: {aylikRandevu} | {baseMusteri} müşteri × ~{agirlikliOrtalamaRandevu.toFixed(2)} ortalama randevu/müşteri
          </p>
        </div>

        {/* Toplam Gider */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md border border-red-300 p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-100">Toplam Gider</h4>
              <p className="text-2xl font-bold">{formatCurrency(toplamGider)}</p>
            </div>
          </div>
          <p className="text-xs text-red-100">
            Personel: {formatCurrency(personelGideri)} + Kira: {formatCurrency(kira)} + Diğer: {formatCurrency(digerGiderler)}
          </p>
        </div>

        {/* Net Kâr */}
        <div className={`rounded-xl shadow-md border-2 p-6 ${
          netKar >= 0 
            ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-300 text-white' 
            : 'bg-gradient-to-br from-red-500 to-red-600 border-red-300 text-white'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`text-sm font-semibold ${netKar >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                Net Kâr
              </h4>
              <p className="text-2xl font-bold">{formatCurrency(netKar)}</p>
            </div>
          </div>
          <p className={`text-xs ${netKar >= 0 ? 'text-green-100' : 'text-red-100'}`}>
            Kâr Marjı: {karMarji.toFixed(1)}%
          </p>
        </div>

        {/* Risk Seviyesi */}
        <div className={`rounded-xl shadow-md border-2 p-6 ${riskRenk.bg} ${riskRenk.text}`} style={{ borderColor: riskSeviyesi === 'Yüksek' ? '#fca5a5' : riskSeviyesi === 'Orta' ? '#fcd34d' : '#86efac' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 rounded-lg ${riskRenk.bg}`}>
              <AlertTriangle className={`w-6 h-6 ${riskRenk.text}`} />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Risk Seviyesi</h4>
              <p className={`text-2xl font-bold ${riskRenk.text}`}>{riskSeviyesi}</p>
            </div>
          </div>
          <p className="text-xs opacity-75">
            Net kâr: {formatCurrency(netKar)}
          </p>
        </div>
      </div>

      {/* Ciro vs Gider Grafiği */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Finansal Özet (Ciro vs Gider vs Net Kâr)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={grafikVerisi} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#6b5b95', fontSize: 12 }}
            />
            <YAxis 
              tick={{ fill: '#6b5b95', fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #c4b5fd',
                borderRadius: '8px',
                padding: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="deger" 
              name="Tutar (₺)"
              radius={[8, 8, 0, 0]}
            >
              {grafikVerisi.map((entry, index) => {
                let fillColor;
                if (entry.name === 'Aylık Ciro') {
                  fillColor = '#10b981'; // Yeşil
                } else if (entry.name === 'Toplam Gider') {
                  fillColor = '#ef4444'; // Kırmızı
                } else {
                  fillColor = entry.deger >= 0 ? '#22c55e' : '#dc2626'; // Net kâr için
                }
                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 6 ve 12 Aylık Finansal Projeksiyon */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">6 ve 12 Aylık Finansal Projeksiyon</h3>
        
        {(() => {
          // Projeksiyon hesaplamaları
          const baslangicAylikMusteri = baseMusteri;
          const baslangicOrtalamaFiyat = ortalamaHizmetFiyati;
          const aylikMusteriArtisOrani = 0.03; // %3
          const aylikFiyatArtisOrani = 0.02; // %2 (enflasyon etkisi)

          const projeksiyonVerisi = [];
          let karaGecilenAy = null;

          for (let ay = 1; ay <= 12; ay++) {
            // Aylık müşteri = başlangıç * (1.03)^(ay-1)
            const aylikMusteri = Math.round(baslangicAylikMusteri * Math.pow(1 + aylikMusteriArtisOrani, ay - 1));
            
            // Ortalama hizmet fiyatı = başlangıç * (1.02)^(ay-1)
            const guncelOrtalamaFiyat = baslangicOrtalamaFiyat * Math.pow(1 + aylikFiyatArtisOrani, ay - 1);
            
            // Aylık randevu = Aylık Müşteri × Ağırlıklı Ortalama Randevu (segment bazlı hesaplanmış)
            const aylikRandevu = Math.round(aylikMusteri * agirlikliOrtalamaRandevu);
            
            // Aylık ciro = Aylık Randevu × Ortalama Hizmet Fiyatı
            const aylikCiro = aylikRandevu * guncelOrtalamaFiyat;
            
            // Net kâr = Aylık Ciro − Sabit Gider
            const netKar = aylikCiro - toplamGider;

            // Kâra geçilen ayı bul (ilk pozitif net kâr)
            if (karaGecilenAy === null && netKar > 0) {
              karaGecilenAy = ay;
            }

            projeksiyonVerisi.push({
              ay: `${ay}. Ay`,
              aylikCiro: Math.round(aylikCiro),
              netKar: Math.round(netKar),
              aylikMusteri: aylikMusteri,
              aylikRandevu: aylikRandevu,
              ortalamaFiyat: Math.round(guncelOrtalamaFiyat)
            });
          }

          const altinciAyNetKar = projeksiyonVerisi[5].netKar;
          const onikinciAyNetKar = projeksiyonVerisi[11].netKar;

          return (
            <div className="space-y-4">
              {/* Line Chart */}
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={projeksiyonVerisi} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" />
                  <XAxis 
                    dataKey="ay" 
                    tick={{ fill: '#6b5b95', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fill: '#6b5b95', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #c4b5fd',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="aylikCiro" 
                    name="Aylık Ciro" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="netKar" 
                    name="Net Kâr" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  {/* Sıfır çizgisi (referans) */}
                  <Line 
                    type="monotone" 
                    dataKey={() => 0} 
                    stroke="#9ca3af" 
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                    legendType="none"
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Açıklama */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 mt-4">
                <p className="text-sm text-purple-700 italic">
                  Bu projeksiyon, müşteri kazanımı ve enflasyon etkisi dikkate alınarak oluşturulmuştur.
                </p>
              </div>

              {/* Özet Metinler */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Kâra Geçilen Ay</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {karaGecilenAy ? `${karaGecilenAy}. Ay` : 'Henüz kâra geçilmedi'}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">6. Ay Net Kâr</p>
                  <p className={`text-2xl font-bold ${altinciAyNetKar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(altinciAyNetKar)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">12. Ay Net Kâr</p>
                  <p className={`text-2xl font-bold ${onikinciAyNetKar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(onikinciAyNetKar)}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
