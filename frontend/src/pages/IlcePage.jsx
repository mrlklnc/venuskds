import { useEffect, useState } from 'react';
import { ilceService } from '../services/ilceService';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function IlcePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ ilce_ad: '', nufus: '', ort_gelir: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await ilceService.getAll();
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ ilce_ad: '', nufus: '', ort_gelir: '' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ilce_ad: item.ilce_ad || '',
      nufus: item.nufus || '',
      ort_gelir: item.ort_gelir ? Number(item.ort_gelir) : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ilçeyi silmek istediğinizden emin misiniz?')) return;
    try {
      await ilceService.delete(id);
      fetchData();
    } catch (error) {
      alert('Silme işlemi başarısız!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/ilce/${editingItem.ilce_id}`, formData);
      } else {
        await api.post('/ilce', formData);
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
        <h1 className="text-3xl font-bold text-gray-900">İlçeler</h1>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni İlçe
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="text-center py-12">Yükleniyor...</div> : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İlçe Adı</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nüfus</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ort. Gelir</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.ilce_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{item.ilce_ad}</td>
                  <td className="px-6 py-4 text-right">{item.nufus?.toLocaleString('tr-TR') || '-'}</td>
                  <td className="px-6 py-4 text-right">{item.ort_gelir ? formatCurrency(item.ort_gelir) : '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.ilce_id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingItem ? 'İlçe Düzenle' : 'Yeni İlçe'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">İlçe Adı</label>
                <input type="text" value={formData.ilce_ad} onChange={(e) => setFormData({ ...formData, ilce_ad: e.target.value })} className="w-full border rounded-lg px-4 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nüfus</label>
                <input type="number" value={formData.nufus} onChange={(e) => setFormData({ ...formData, nufus: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ortalama Gelir</label>
                <input type="number" step="0.01" value={formData.ort_gelir} onChange={(e) => setFormData({ ...formData, ort_gelir: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
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

