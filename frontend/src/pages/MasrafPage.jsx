import { useEffect, useState } from 'react';
import { masrafService } from '../services/masrafService';
import { formatDate, formatCurrency } from '../utils/format';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import apiClient from '../services/apiClient';

export default function MasrafPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subeler, setSubeler] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ sube_id: '', tutar: '', tarih: '', aciklama: '' });

  useEffect(() => {
    fetchSubeler();
    fetchData();
  }, [page]);

  const fetchSubeler = async () => {
    try {
      const response = await apiClient.get('/sube');
      setSubeler(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await masrafService.getAll({ page, limit: 20 });
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
    setFormData({ sube_id: '', tutar: '', tarih: '', aciklama: '' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      sube_id: item.sube_id || '',
      tutar: item.tutar || '',
      tarih: item.tarih ? item.tarih.split('T')[0] : '',
      aciklama: item.aciklama || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu masrafı silmek istediğinizden emin misiniz?')) return;
    try {
      await masrafService.delete(id);
      fetchData();
    } catch (error) {
      alert('Silme işlemi başarısız!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await masrafService.update(editingItem.masraf_id, formData);
      } else {
        await masrafService.create(formData);
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
        <h1 className="text-3xl font-bold text-gray-900">Şube Masrafları</h1>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Masraf
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="text-center py-12">Yükleniyor...</div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Şube</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.masraf_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{item.sube?.sube_ad || '-'}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(item.tutar || 0)}</td>
                      <td className="px-6 py-4">{formatDate(item.tarih)}</td>
                      <td className="px-6 py-4">{item.aciklama || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.masraf_id)} className="text-red-600 hover:text-red-800">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{editingItem ? 'Masraf Düzenle' : 'Yeni Masraf'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Şube</label>
                <select value={formData.sube_id} onChange={(e) => setFormData({ ...formData, sube_id: e.target.value })} className="w-full border rounded-lg px-4 py-2" required>
                  <option value="">Seçin...</option>
                  {subeler.map(s => (
                    <option key={s.sube_id} value={s.sube_id}>{s.sube_ad}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tutar</label>
                <input type="number" step="0.01" value={formData.tutar} onChange={(e) => setFormData({ ...formData, tutar: e.target.value })} className="w-full border rounded-lg px-4 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tarih</label>
                <input type="date" value={formData.tarih} onChange={(e) => setFormData({ ...formData, tarih: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Açıklama</label>
                <input type="text" value={formData.aciklama} onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
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
