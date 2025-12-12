import { useEffect, useState } from 'react';
import { rakipService } from '../services/rakipService';
import { ilceService } from '../services/ilceService';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function RakipPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ilceler, setIlceler] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ ilce_id: '', rakip_ad: '', hizmet_turu: '' });

  useEffect(() => {
    fetchIlceler();
    fetchData();
  }, [page]);

  const fetchIlceler = async () => {
    try {
      const response = await ilceService.getAll();
      setIlceler(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await rakipService.getAll({ page, limit: 20 });
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
    setFormData({ ilce_id: '', rakip_ad: '', hizmet_turu: '' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ilce_id: item.ilce_id || '',
      rakip_ad: item.rakip_ad || '',
      hizmet_turu: item.hizmet_turu || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu rakip işletmeyi silmek istediğinizden emin misiniz?')) return;
    try {
      await rakipService.delete(id);
      fetchData();
    } catch (error) {
      alert('Silme işlemi başarısız!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await rakipService.update(editingItem.rakip_id, formData);
      } else {
        await rakipService.create(formData);
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
        <h1 className="text-3xl font-bold text-gray-900">Rakip Analizi</h1>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Rakip
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="text-center py-12">Yükleniyor...</div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rakip Adı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İlçe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hizmet Türü</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.rakip_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{item.rakip_ad}</td>
                      <td className="px-6 py-4">{item.ilce?.ilce_ad || '-'}</td>
                      <td className="px-6 py-4">{item.hizmet_turu || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.rakip_id)} className="text-red-600 hover:text-red-800">
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
              <h2 className="text-2xl font-bold">{editingItem ? 'Rakip Düzenle' : 'Yeni Rakip'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rakip Adı</label>
                <input type="text" value={formData.rakip_ad} onChange={(e) => setFormData({ ...formData, rakip_ad: e.target.value })} className="w-full border rounded-lg px-4 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">İlçe</label>
                <select value={formData.ilce_id} onChange={(e) => setFormData({ ...formData, ilce_id: e.target.value })} className="w-full border rounded-lg px-4 py-2">
                  <option value="">Seçin...</option>
                  {ilceler.map(ilce => (
                    <option key={ilce.ilce_id} value={ilce.ilce_id}>{ilce.ilce_ad}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hizmet Türü</label>
                <input type="text" value={formData.hizmet_turu} onChange={(e) => setFormData({ ...formData, hizmet_turu: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
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
