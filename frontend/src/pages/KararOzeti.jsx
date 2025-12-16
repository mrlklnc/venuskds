import { FileText, CheckCircle, AlertTriangle, Lightbulb, Target, MapPin, TrendingUp } from 'lucide-react';
import IlceUygunlukSkoruBölüm from '../components/analizler/IlceUygunlukSkoruBölüm';

export default function KararOzeti() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Yönetici Karar Özeti</h1>
        <p className="text-gray-600">Tüm analizlerin özeti ve stratejik karar önerileri</p>
      </div>

      {/* 1. Ana Karar Kutusu */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg border border-purple-300 p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Önerilen Şube Açılış Stratejisi</h2>
        </div>
        <p className="text-lg mb-2">
          Buca merkezli, kademeli çoklu şube açılışı önerilmektedir.
        </p>
        <p className="text-purple-100 text-sm">
          Veriler Buca'nın ana yatırım noktası olduğunu, Bornova ve Karşıyaka'nın
          ikinci faz için uygun ilçeler olduğunu göstermektedir.
        </p>
      </div>

      {/* 2. Stratejik Şube Önerileri (3 Kart) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KART 1: 1. Öncelik - Buca */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md border-2 border-green-300 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              1. Öncelik
            </div>
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Buca</h3>
          <div className="space-y-3">
            <div>
              <p className="text-green-100 text-sm mb-1">Uygunluk Skoru</p>
              <p className="text-3xl font-bold">83 / 100</p>
            </div>
            <div className="pt-3 border-t border-green-400/30">
              <p className="text-green-100 text-sm mb-1">Rol</p>
              <p className="text-lg font-semibold">Ana Şube</p>
            </div>
            <div>
              <p className="text-green-100 text-sm mb-1">Açıklama</p>
              <p className="text-green-50 text-sm">Yüksek talep ve hızlı geri dönüş potansiyeli</p>
            </div>
          </div>
        </div>

        {/* KART 2: 2. Öncelik - Bornova */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md border-2 border-blue-300 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              2. Öncelik
            </div>
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Bornova</h3>
          <div className="space-y-3">
            <div className="pt-3">
              <p className="text-blue-100 text-sm mb-1">Rol</p>
              <p className="text-lg font-semibold">Büyüme Şubesi</p>
            </div>
            <div>
              <p className="text-blue-100 text-sm mb-1">Açıklama</p>
              <p className="text-blue-50 text-sm">Yüksek müşteri hacmi, orta rekabet</p>
            </div>
          </div>
        </div>

        {/* KART 3: 3. Öncelik - Karşıyaka */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md border-2 border-amber-300 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              3. Öncelik
            </div>
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Karşıyaka</h3>
          <div className="space-y-3">
            <div className="pt-3">
              <p className="text-amber-100 text-sm mb-1">Rol</p>
              <p className="text-lg font-semibold">Premium Şube</p>
            </div>
            <div>
              <p className="text-amber-100 text-sm mb-1">Açıklama</p>
              <p className="text-amber-50 text-sm">Gelir seviyesi yüksek müşteri profili</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. İlçe Uygunluk Skoru Grafiği */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">İlçe Uygunluk Skoru Analizi</h3>
          <p className="text-sm text-gray-600">
            Bu grafik, yeni şubelerin hangi ilçelerde hangi sırayla açılması gerektiğini
            göstermektedir.
          </p>
        </div>
        <IlceUygunlukSkoruBölüm />
      </div>

      {/* 4. Finansal Strateji Özeti */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Finansal Strateji Özeti</h3>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-semibold text-purple-700 mb-3">Önerilen Açılış Takvimi:</p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              <span><strong>Faz 1 (0–6 Ay):</strong> Buca</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              <span><strong>Faz 2 (6–12 Ay):</strong> Bornova</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              <span><strong>Faz 3 (12+ Ay):</strong> Karşıyaka</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 5. Risk Değerlendirmesi */}
      <div className="bg-white rounded-xl shadow-md border border-purple-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-800">Genel Risk Değerlendirmesi</h3>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-gray-700 mb-3">
            Çok şubeli yapı sayesinde gelir tek bir ilçeye bağlı değildir.
            Bu durum operasyonel riski azaltmaktadır.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-full border border-yellow-300">
            <AlertTriangle className="w-5 h-5 text-yellow-700" />
            <span className="text-yellow-700 font-semibold">Risk Seviyesi: Orta</span>
          </div>
        </div>
      </div>

      {/* 6. Nihai Karar Metni */}
      <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl shadow-md border-2 border-purple-300 p-6">
        <div className="flex items-start gap-3">
          <FileText className="w-8 h-8 text-purple-700 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-purple-900 mb-3">Nihai Öneri:</h3>
            <p className="text-lg text-purple-800 leading-relaxed">
              Buca'da pilot şube açılarak başlanmalı,
              6. ayda performans hedefleri sağlanırsa Bornova,
              12. ayda Karşıyaka yatırımı yapılmalıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
