import { useEffect, useState } from 'react';
import { musteriService } from '../services/musteriService';
import { ilceService } from '../services/ilceService';
import { formatDate } from '../utils/format';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';

export default function MusteriPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIlce, setFilterIlce] = useState('');
  const [ilceler, setIlceler] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    cinsiyet: '',
    dogum_tarihi: '',
    ilce_id: '',
    yas: '',
    segment: ''
  });

  useEffect(() => {
    fetchIlceler();
    fetchData();
  }, [page, searchTerm, filterIlce]);

  const fetchIlceler = async () => {
    try {
      const response = await ilceService.getAll();
      setIlceler(response.data);
    } catch (error) {
      console.error('Error fetching ilceler:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (searchTerm) params.search = searchTerm;
      if (filterIlce) params.ilce_id = filterIlce;
      const response = await musteriService.getAll(params);
      setData(response.data.data || response.data);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      ad: '',
      soyad: '',
      cinsiyet: '',
      dogum_tarihi: '',
      ilce_id: '',
      yas: '',
      segment: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ad: item.ad || '',
      soyad: item.soyad || '',
      cinsiyet: item.cinsiyet || '',
      dogum_tarihi: item.dogum_tarihi ? item.dogum_tarihi.split('T')[0] : '',
      ilce_id: item.ilce_id || '',
      yas: item.yas || '',
      segment: item.segment || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;
    try {
      await musteriService.delete(id);
      fetchData();
    } catch (error) {
      alert('Silme işlemi başarısız!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await musteriService.update(editingItem.musteri_id, formData);
      } else {
        await musteriService.create(formData);
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
        <h1 className="text-3xl font-bold text-gray-900">Müşteri Yönetimi</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Müşteri
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterIlce}
            onChange={(e) => {
              setFilterIlce(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">Tüm İlçeler</option>
            {ilceler.map(ilce => (
              <option key={ilce.ilce_id} value={ilce.ilce_id}>{ilce.ilce_ad}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Soyad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cinsiyet</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yaş</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İlçe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segment</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.musteri_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{item.ad}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.soyad}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.cinsiyet || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.yas || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.ilce?.ilce_ad || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.segment && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {item.segment}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.musteri_id)}
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
            {/* Pagination */}
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Sayfa {page} / {totalPages}
              </span>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingItem ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ad</label>
                <input
                  type="text"
                  value={formData.ad}
                  onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Soyad</label>
                <input
                  type="text"
                  value={formData.soyad}
                  onChange={(e) => setFormData({ ...formData, soyad: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cinsiyet</label>
                <select
                  value={formData.cinsiyet}
                  onChange={(e) => setFormData({ ...formData, cinsiyet: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="">Seçin...</option>
                  <option value="Kadın">Kadın</option>
                  <option value="Erkek">Erkek</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Doğum Tarihi</label>
                <input
                  type="date"
                  value={formData.dogum_tarihi}
                  onChange={(e) => setFormData({ ...formData, dogum_tarihi: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">İlçe</label>
                <select
                  value={formData.ilce_id}
                  onChange={(e) => setFormData({ ...formData, ilce_id: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="">Seçin...</option>
                  {ilceler.map(ilce => (
                    <option key={ilce.ilce_id} value={ilce.ilce_id}>{ilce.ilce_ad}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Yaş</label>
                <input
                  type="number"
                  value={formData.yas}
                  onChange={(e) => setFormData({ ...formData, yas: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Segment</label>
                <select
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="">Seçin...</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
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
