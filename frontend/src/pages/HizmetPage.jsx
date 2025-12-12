import { useEffect, useState } from 'react';
import { hizmetService } from '../services/hizmetService';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function HizmetPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ hizmet_ad: '', fiyat_araligi: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await hizmetService.getAll({ limit: 1000 });
      setData(response.data.data || response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ hizmet_ad: '', fiyat_araligi: '' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ hizmet_ad: item.hizmet_ad || '', fiyat_araligi: item.fiyat_araligi || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) return;
    try {
      await hizmetService.delete(id);
      fetchData();
    } catch (error) {
      alert('Silme işlemi başarısız!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await hizmetService.update(editingItem.hizmet_id, formData);
      } else {
        await hizmetService.create(formData);
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
        <h1 className="text-3xl font-bold text-gray-900">Hizmet Yönetimi</h1>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Hizmet
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="text-center py-12">Yükleniyor...</div> : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hizmet Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat Aralığı</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.hizmet_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{item.hizmet_ad}</td>
                  <td className="px-6 py-4">{item.fiyat_araligi || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.hizmet_id)} className="text-red-600 hover:text-red-800">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{editingItem ? 'Hizmet Düzenle' : 'Yeni Hizmet'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hizmet Adı</label>
                <input type="text" value={formData.hizmet_ad} onChange={(e) => setFormData({ ...formData, hizmet_ad: e.target.value })} className="w-full border rounded-lg px-4 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fiyat Aralığı</label>
                <input type="text" value={formData.fiyat_araligi} onChange={(e) => setFormData({ ...formData, fiyat_araligi: e.target.value })} className="w-full border rounded-lg px-4 py-2" placeholder="örn: 500-2000 TL" />
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
