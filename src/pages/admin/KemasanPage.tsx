import React, { useEffect, useState } from 'react';
import { Package, Plus, Edit3, Trash2, AlertCircle, CheckCircle, ShoppingBag } from 'lucide-react';
import { packagingApi } from '../../api/endpoints/packagingApi';
import { PackagingMaterial } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';

export const KemasanPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [packagingList, setPackagingList] = useState<PackagingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('Semua');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<PackagingMaterial>>({
    kodeKemasan: '',
    namaKemasan: '',
    kategori: 'Standing Pouch',
    kapasitas: '500g',
    stokTersedia: 2000,
    satuan: 'Pcs',
    stokMinimal: 500,
    pemasok: 'PT Kemasan Mulia Jaya Yogyakarta',
    hargaPerUnitRp: 1850,
  });

  const fetchPackaging = async () => {
    setLoading(true);
    const data = await packagingApi.getAll();
    setPackagingList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPackaging();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      kodeKemasan: `KMG-POUCH-00${packagingList.length + 1}`,
      namaKemasan: '',
      kategori: 'Standing Pouch',
      kapasitas: '500 gram',
      stokTersedia: 2000,
      satuan: 'Pcs',
      stokMinimal: 500,
      pemasok: 'PT Kemasan Mulia Jaya Yogyakarta',
      hargaPerUnitRp: 1850,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PackagingMaterial) => {
    setEditId(item.id);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await packagingApi.update(editId, formData);
    } else {
      await packagingApi.create(formData);
    }
    setIsModalOpen(false);
    fetchPackaging();
  };

  const handleDelete = async (id: string) => {
    await packagingApi.delete(id);
    fetchPackaging();
  };

  const categoriesList = ['Semua', 'Standing Pouch', 'Box Custom', 'Karung Bulk', 'Botol Kaca', 'Aksesoris'];

  const filteredList = packagingList.filter((item) => {
    const matchesSearch =
      item.kodeKemasan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.namaKemasan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pemasok.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      activeCategoryTab === 'Semua' || item.kategori === activeCategoryTab;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">Kelola Data Bahan Kemasan</h1>
        </div>

        <div className="w-full sm:w-auto">
          <Button onClick={handleOpenAdd} icon={<Plus className="w-3.5 h-3.5" />} variant="primary" className="w-full sm:w-auto text-xs py-1.5 px-3 justify-center">
            Tambah Stok Kemasan
          </Button>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL ITEM KEMASAN</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">{packagingList.length} Kategori Material</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Standing Pouch, Aluminium & Karung</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">STOK MENIPIS (&lt; MINIMAL)</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {packagingList.filter((p) => p.statusStok === 'Stok Menipis').length} Jenis Item
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Perlu re-stock dalam waktu dekat</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-red-600">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">STOK HABIS (PERLU ORDER)</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {packagingList.filter((p) => p.statusStok === 'Habis').length} Jenis Item
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Segera lakukan pemesanan ulang</p>
        </div>
      </div>

      {/* CRUD Table Card with Category Filter Tabs */}
      <div className="bg-white rounded-xl shadow-2xs border border-[#c4c8bb]/30 overflow-hidden">
        {/* Category filter tabs */}
        <div className="p-3.5 sm:p-4 border-b border-[#c4c8bb]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-[#2C4219] text-sm">
            Daftar Persediaan Material Kemasan
          </h3>

          <div className="flex items-center gap-1 bg-[#F7F7F5] p-1 rounded-lg border border-[#c4c8bb]/30 overflow-x-auto max-w-full custom-scrollbar">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryTab(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategoryTab === cat
                    ? 'bg-[#C3E28D] text-[#172C05] shadow-2xs'
                    : 'text-[#44483e] hover:text-[#172C05]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-b border-[#c4c8bb]/20">
                <th className="py-2.5 px-3 pl-4 whitespace-nowrap">KODE KEMASAN</th>
                <th className="py-2.5 px-3 whitespace-nowrap">NAMA KEMASAN</th>
                <th className="py-2.5 px-3 whitespace-nowrap">STOK TERSEDIA</th>
                <th className="py-2.5 px-3 whitespace-nowrap">HARGA / UNIT</th>
                <th className="py-2.5 px-3 whitespace-nowrap">STATUS STOK</th>
                <th className="py-2.5 px-3 pr-4 text-center whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 text-[#221A12] font-medium">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-[#F7F7F5] transition-colors">
                  <td className="py-2.5 px-3 pl-4 font-bold text-[#2C4219] whitespace-nowrap">{item.kodeKemasan}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#221A12]">{item.namaKemasan}</td>
                  <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                    {item.stokTersedia.toLocaleString('id-ID')} {item.satuan}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#2C4219] whitespace-nowrap">
                    Rp {item.hargaPerUnitRp.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {/* Stock Status Indicator */}
                    <Badge
                      variant={
                        item.statusStok === 'Stok Cukup'
                          ? 'success'
                          : item.statusStok === 'Stok Menipis'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {item.statusStok}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 pr-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-[#2C4219] hover:bg-[#efe0d2] rounded transition-colors cursor-pointer"
                        title="Edit Data Kemasan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Hapus Data Kemasan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? 'Edit Data Kemasan' : 'Tambah Material Kemasan Baru'}
        subtitle="Input detail stok dan harga unit dari pemasok kemasan"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kode Kemasan
              </label>
              <input
                type="text"
                value={formData.kodeKemasan}
                onChange={(e) => setFormData({ ...formData, kodeKemasan: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kategori
              </label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="Standing Pouch">Standing Pouch</option>
                <option value="Box Custom">Box Custom</option>
                <option value="Karung Bulk">Karung Bulk</option>
                <option value="Botol Kaca">Botol Kaca</option>
                <option value="Aksesoris">Aksesoris</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Nama Kemasan
            </label>
            <input
              type="text"
              value={formData.namaKemasan}
              onChange={(e) => setFormData({ ...formData, namaKemasan: e.target.value })}
              placeholder="Contoh: Standing Pouch Alufoil Ziplock 500g"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Stok Tersedia
              </label>
              <input
                type="number"
                value={formData.stokTersedia}
                onChange={(e) => setFormData({ ...formData, stokTersedia: Number(e.target.value) })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Stok Minimal
              </label>
              <input
                type="number"
                value={formData.stokMinimal}
                onChange={(e) => setFormData({ ...formData, stokMinimal: Number(e.target.value) })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Harga per Unit (Rp)
              </label>
              <input
                type="number"
                value={formData.hargaPerUnitRp}
                onChange={(e) => setFormData({ ...formData, hargaPerUnitRp: Number(e.target.value) })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Pemasok / Vendor Kemasan
            </label>
            <input
              type="text"
              value={formData.pemasok}
              onChange={(e) => setFormData({ ...formData, pemasok: e.target.value })}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              {editId ? 'Perbarui Data' : 'Simpan Kemasan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
