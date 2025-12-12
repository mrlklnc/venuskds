import { useEffect, useState } from 'react';
import { randevuService } from '../services/randevuService';
import { musteriService } from '../services/musteriService';
import { hizmetService } from '../services/hizmetService';
import { kampanyaService } from '../services/kampanyaService';
import { formatDate, formatCurrency } from '../utils/format';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function RandevuPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [musteriler, setMusteriler] = useState([]);
  const [hizmetler, setHizmetler] = useState([]);
  const [kampanyalar, setKampanyalar] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    musteri_id: '',
    hizmet_id: '',
    fiyat: '',
    tarih: '',
    saat: '',
    kampanya_id: ''
  });

  useEffect(() => {
    fetchMusteriler();
    fetchHizmetler();
    fetchKampanyalar();
    fetchData();
  }, [page]);

  const fetchMusteriler = async () => {
    try {
      const response = await musteriService.getAll({ limit: 1000 });
      setMusteriler(response.data.data || response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchHizmetler = async () => {
    try {
      const response = await hizmetService.getAll({ limit: 1000 });
      setHizmetler(response.data.data || response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchKampanyalar = async () => {
    try {
      const response = await kampanyaService.getAll();
      setKampanyalar(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await randevuService.getAll({ page, limit: 20 });
      setData(response.data.data || response.data);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      musteri_id: '',
      hizmet_id: '',
      fiyat: '',
      tarih: '',
      saat: '',
      kampanya_id: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      musteri_id: item.musteri_id || '',
      hizmet_id: item.hizmet_id || '',
      fiyat: item.fiyat || '',
      tarih: item.tarih ? item.tarih.split('T')[0] : '',
      saat: item.saat || '',
      kampanya_id: item.kampanya_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu randevuyu silmek istediğinizden emin misiniz?')) return;
    try {
      await randevuService.delete(id);
      fetchData();
    } catch (error) {
      alert('Silme işlemi başarısız!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        musteri_id: formData.musteri_id ? parseInt(formData.musteri_id) : null,
        hizmet_id: formData.hizmet_id ? parseInt(formData.hizmet_id) : null,
        kampanya_id: formData.kampanya_id ? parseInt(formData.kampanya_id) : null,
        fiyat: formData.fiyat ? parseFloat(formData.fiyat) : null
      };
      if (editingItem) {
        await randevuService.update(editingItem.randevu_id, submitData);
      } else {
        await randevuService.create(submitData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert('Kayıt işlemi başarısız!');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Randevu Yönetimi</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Randevu
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hizmet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kampanya</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.randevu_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.musteri ? `${item.musteri.ad} ${item.musteri.soyad}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.hizmet?.hizmet_ad || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.tarih)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.saat || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(item.fiyat || 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.kampanya?.kampanya_ad || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.randevu_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <span className="text-sm text-gray-600">Sayfa {page} / {totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Önceki
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Sonraki
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingItem ? 'Randevu Düzenle' : 'Yeni Randevu'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Müşteri</label>
                <select
                  value={formData.musteri_id}
                  onChange={(e) => setFormData({ ...formData, musteri_id: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Seçin...</option>
                  {musteriler.map(m => (
                    <option key={m.musteri_id} value={m.musteri_id}>
                      {m.ad} {m.soyad}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hizmet</label>
                <select
                  value={formData.hizmet_id}
                  onChange={(e) => setFormData({ ...formData, hizmet_id: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                >
                  <option value="">Seçin...</option>
                  {hizmetler.map(h => (
                    <option key={h.hizmet_id} value={h.hizmet_id}>{h.hizmet_ad}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tarih</label>
                <input
                  type="date"
                  value={formData.tarih}
                  onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Saat</label>
                <input
                  type="time"
                  value={formData.saat}
                  onChange={(e) => setFormData({ ...formData, saat: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fiyat}
                  onChange={(e) => setFormData({ ...formData, fiyat: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kampanya</label>
                <select
                  value={formData.kampanya_id}
                  onChange={(e) => setFormData({ ...formData, kampanya_id: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="">Yok</option>
                  {kampanyalar.map(k => (
                    <option key={k.kampanya_id} value={k.kampanya_id}>{k.kampanya_ad}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
