import { useEffect, useState } from 'react';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function MemnuniyetPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [randevular, setRandevular] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ randevu_id: '', puan: '', yorum: '', tarih: '' });

  useEffect(() => {
    fetchRandevular();
    fetchData();
  }, [page]);

  const fetchRandevular = async () => {
    try {
      const response = await api.get('/randevu', { params: { limit: 1000 } });
      setRandevular(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/memnuniyet', { params: { page, limit: 20 } });
      setData(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ randevu_id: '', puan: '', yorum: '', tarih: '' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      randevu_id: item.randevu_id || '',
      puan: item.puan || '',
      yorum: item.yorum || '',
      tarih: item.tarih ? item.tarih.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu memnuniyet kaydını silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/memnuniyet/${id}`);
      fetchData();
    } catch (error) {
      alert('Silme işlemi başarısız!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/memnuniyet/${editingItem.memnuniyet_id}`, formData);
      } else {
        await api.post('/memnuniyet', formData);
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
        <h1 className="text-3xl font-bold text-gray-900">Müşteri Memnuniyeti</h1>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Değerlendirme
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="text-center py-12">Yükleniyor...</div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Randevu</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hizmet</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Puan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yorum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.memnuniyet_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">#{item.randevu?.randevu_id || '-'}</td>
                      <td className="px-6 py-4">{item.randevu?.hizmet?.hizmet_ad || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{item.puan}/5</span>
                      </td>
                      <td className="px-6 py-4">{item.yorum || '-'}</td>
                      <td className="px-6 py-4">{formatDate(item.tarih)}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.memnuniyet_id)} className="text-red-600 hover:text-red-800">
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
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg disabled:opacity-50">Önceki</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-lg disabled:opacity-50">Sonraki</button>
              </div>
            </div>
          </>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingItem ? 'Değerlendirme Düzenle' : 'Yeni Değerlendirme'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Randevu</label>
                <select value={formData.randevu_id} onChange={(e) => setFormData({ ...formData, randevu_id: e.target.value })} className="w-full border rounded-lg px-4 py-2" required>
                  <option value="">Seçin...</option>
                  {randevular.map(r => (
                    <option key={r.randevu_id} value={r.randevu_id}>#{r.randevu_id} - {r.hizmet?.hizmet_ad}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Puan (1-5)</label>
                <input type="number" min="1" max="5" value={formData.puan} onChange={(e) => setFormData({ ...formData, puan: e.target.value })} className="w-full border rounded-lg px-4 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Yorum</label>
                <textarea value={formData.yorum} onChange={(e) => setFormData({ ...formData, yorum: e.target.value })} className="w-full border rounded-lg px-4 py-2" rows="3" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tarih</label>
                <input type="date" value={formData.tarih} onChange={(e) => setFormData({ ...formData, tarih: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Kaydet</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

