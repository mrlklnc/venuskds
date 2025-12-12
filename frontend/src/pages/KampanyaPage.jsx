import { useEffect, useState } from 'react';
import { kampanyaService } from '../services/kampanyaService';
import { formatDate } from '../utils/format';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function KampanyaPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ kampanya_ad: '', baslangic: '', bitis: '', indirim_orani: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await kampanyaService.getAll();
      setData(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ kampanya_ad: '', baslangic: '', bitis: '', indirim_orani: '' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      kampanya_ad: item.kampanya_ad || '',
      baslangic: item.baslangic ? item.baslangic.split('T')[0] : '',
      bitis: item.bitis ? item.bitis.split('T')[0] : '',
      indirim_orani: item.indirim_orani || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return;
    try {
      await kampanyaService.delete(id);
      fetchData();
    } catch (error) {
      alert('Silme işlemi başarısız!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await kampanyaService.update(editingItem.kampanya_id, formData);
      } else {
        await kampanyaService.create(formData);
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
        <h1 className="text-3xl font-bold text-gray-900">Kampanya Yönetimi</h1>
        <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Kampanya
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="text-center py-12">Yükleniyor...</div> : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kampanya Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlangıç</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bitiş</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İndirim %</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.kampanya_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{item.kampanya_ad}</td>
                  <td className="px-6 py-4">{formatDate(item.baslangic)}</td>
                  <td className="px-6 py-4">{formatDate(item.bitis)}</td>
                  <td className="px-6 py-4 text-right">{item.indirim_orani}%</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.kampanya_id)} className="text-red-600 hover:text-red-800">
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
              <h2 className="text-2xl font-bold">{editingItem ? 'Kampanya Düzenle' : 'Yeni Kampanya'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kampanya Adı</label>
                <input type="text" value={formData.kampanya_ad} onChange={(e) => setFormData({ ...formData, kampanya_ad: e.target.value })} className="w-full border rounded-lg px-4 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Başlangıç Tarihi</label>
                <input type="date" value={formData.baslangic} onChange={(e) => setFormData({ ...formData, baslangic: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bitiş Tarihi</label>
                <input type="date" value={formData.bitis} onChange={(e) => setFormData({ ...formData, bitis: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">İndirim Oranı (%)</label>
                <input type="number" value={formData.indirim_orani} onChange={(e) => setFormData({ ...formData, indirim_orani: e.target.value })} className="w-full border rounded-lg px-4 py-2" />
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
