import React, { useEffect, useState } from 'react';
import { Factory, Plus, Filter, Search, Edit3, Trash2, CheckCircle, Package } from 'lucide-react';
import { productionApi } from '../../api/endpoints/productionApi';
import { ProductionBatch } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';

export const ProduksiPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'Semua' | 'Raw (Bahan Mentah)' | 'Ready to Eat (Siap Konsumsi)'>('Semua');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ProductionBatch>>({
    kodeBatch: '',
    namaProduk: 'Tepung Sorgum Bioguma White Premium 500g',
    kategori: 'Ready to Eat (Siap Konsumsi)',
    tanggalProduksi: new Date().toLocaleDateString('id-ID'),
    tanggalKadaluarsa: '1 Tahun',
    jumlahHasil: 1000,
    satuan: 'Pouch',
    nomorBatchBahanBaku: 'HARVEST-S-015',
    operatorProduksi: 'Ibu KWT Tani Rahayu',
    statusQC: 'Lolos QC',
    lokasiGudang: 'Gudang Utama A',
  });

  const fetchProduction = async () => {
    setLoading(true);
    const data = await productionApi.getAll();
    setBatches(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProduction();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      kodeBatch: `PRD-2026-00${batches.length + 1}`,
      namaProduk: '',
      kategori: 'Ready to Eat (Siap Konsumsi)',
      tanggalProduksi: new Date().toLocaleDateString('id-ID'),
      tanggalKadaluarsa: '1 Tahun',
      jumlahHasil: 1000,
      satuan: 'Pouch',
      nomorBatchBahanBaku: 'HARVEST-S-010',
      operatorProduksi: 'Tim KWT Sorgum',
      statusQC: 'Lolos QC',
      lokasiGudang: 'Gudang Utama A',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ProductionBatch) => {
    setEditId(item.id);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await productionApi.update(editId, formData);
    } else {
      await productionApi.create(formData);
    }
    setIsModalOpen(false);
    fetchProduction();
  };

  const handleDelete = async (id: string) => {
    await productionApi.delete(id);
    fetchProduction();
  };

  const filteredBatches = batches.filter((item) => {
    const matchesSearch =
      item.kodeBatch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.namaProduk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.operatorProduksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nomorBatchBahanBaku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      activeCategoryTab === 'Semua' || item.kategori === activeCategoryTab;

    return matchesSearch && matchesCategory;
  });

  // Top 3 Stat Cards Calculations
  const totalProdukOlahan = batches.length;
  const activeBatchesCount = batches.filter((b) => b.statusQC === 'Lolos QC' || b.statusQC === 'Pending QC').length;
  const totalVolumeHasil = batches.reduce((acc, curr) => acc + curr.jumlahHasil, 0);

  return (
    <div className="space-y-5 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">Kelola Produksi Olahan Sorgum</h1>
        </div>

        <div className="w-full sm:w-auto">
          <Button onClick={handleOpenAdd} icon={<Plus className="w-3.5 h-3.5" />} variant="primary" className="w-full sm:w-auto text-xs py-1.5 px-3 justify-center">
            Buat Batch Produksi Baru
          </Button>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL JENIS PRODUK OLAHAN</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">{totalProdukOlahan} Jenis Produk</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Tepung, Snack & Gula Nira</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">BATCH PRODUKSI AKTIF</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">{activeBatchesCount} Batch Aktif</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Tersimpan di Gudang A & B</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL VOLUME OUTPUT</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {totalVolumeHasil.toLocaleString('id-ID')} Unit / Kg
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Kapasitas siap edar</p>
        </div>
      </div>

      {/* Main Table Card with Category Filter Tabs */}
      <div className="bg-white rounded-xl shadow-2xs border border-[#c4c8bb]/30 overflow-hidden">
        {/* Filter Tabs Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#c4c8bb]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Factory className="w-3.5 h-3.5 text-[#2C4219]" />
            <h3 className="font-semibold text-[#2C4219] text-sm">
              Tabel Data Batch Produksi
            </h3>
          </div>

          {/* Filter tabs: Raw vs Ready to Eat */}
          <div className="flex items-center gap-1.5 bg-[#F7F7F5] p-1 rounded-lg border border-[#c4c8bb]/30 overflow-x-auto max-w-full custom-scrollbar">
            {(['Semua', 'Raw (Bahan Mentah)', 'Ready to Eat (Siap Konsumsi)'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCategoryTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategoryTab === tab
                    ? 'bg-[#C3E28D] text-[#172C05] shadow-2xs'
                    : 'text-[#44483e] hover:text-[#172C05]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Full-width CRUD Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[720px]">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-b border-[#c4c8bb]/20">
                <th className="py-2 px-3 pl-4">KODE BATCH</th>
                <th className="py-2 px-3">NAMA PRODUK</th>
                <th className="py-2 px-3">KATEGORI</th>
                <th className="py-2 px-3">TANGGAL PRODUKSI</th>
                <th className="py-2 px-3">TOTAL HASIL</th>
                <th className="py-2 px-3">BATCH RAW MAT.</th>
                <th className="py-2 px-3">STATUS QC</th>
                <th className="py-2 px-3 pr-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 text-[#221A12] font-medium">
              {filteredBatches.map((item) => (
                <tr key={item.id} className="hover:bg-[#F7F7F5] transition-colors">
                  <td className="py-2 px-3 pl-4 font-bold text-[#2C4219]">{item.kodeBatch}</td>
                  <td className="py-2 px-3 font-semibold">{item.namaProduk}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.kategori.includes('Ready to Eat')
                          ? 'bg-[#C3E28D]/50 text-[#172C05]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.kategori}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap text-[#6B7280]">{item.tanggalProduksi}</td>
                  <td className="py-2 px-3 font-bold">
                    {item.jumlahHasil.toLocaleString('id-ID')} {item.satuan}
                  </td>
                  <td className="py-2 px-3 font-mono text-xs text-[#44483e]">{item.nomorBatchBahanBaku}</td>
                  <td className="py-2 px-3">
                    <Badge
                      variant={
                        item.statusQC === 'Lolos QC'
                          ? 'success'
                          : item.statusQC === 'Pending QC'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {item.statusQC}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 pr-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-[#2C4219] hover:bg-[#efe0d2] rounded transition-colors cursor-pointer"
                        title="Edit Batch"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Hapus Batch"
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

      {/* Modal Form Batch Produksi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? 'Edit Batch Produksi' : 'Catat Batch Produksi Baru'}
        subtitle="Input detail produk olahan sorgum dan penetapan QC"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kode Batch
              </label>
              <input
                type="text"
                value={formData.kodeBatch}
                onChange={(e) => setFormData({ ...formData, kodeBatch: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kategori Produk
              </label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="Ready to Eat (Siap Konsumsi)">Ready to Eat (Siap Konsumsi)</option>
                <option value="Raw (Bahan Mentah)">Raw (Bahan Mentah)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Nama Produk Olahan
            </label>
            <input
              type="text"
              value={formData.namaProduk}
              onChange={(e) => setFormData({ ...formData, namaProduk: e.target.value })}
              placeholder="Contoh: Tepung Sorgum Bioguma White 500g"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Jumlah Hasil
              </label>
              <input
                type="number"
                value={formData.jumlahHasil}
                onChange={(e) => setFormData({ ...formData, jumlahHasil: Number(e.target.value) })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Satuan
              </label>
              <input
                type="text"
                value={formData.satuan}
                onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                placeholder="Pouch / Kg / Botol"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Status QC
              </label>
              <select
                value={formData.statusQC}
                onChange={(e) => setFormData({ ...formData, statusQC: e.target.value as any })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="Lolos QC">Lolos QC</option>
                <option value="Pending QC">Pending QC</option>
                <option value="Revisi Batch">Revisi Batch</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Batch Bahan Baku Raw
              </label>
              <input
                type="text"
                value={formData.nomorBatchBahanBaku}
                onChange={(e) => setFormData({ ...formData, nomorBatchBahanBaku: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Operator / Tim Produksi KWT
              </label>
              <input
                type="text"
                value={formData.operatorProduksi}
                onChange={(e) => setFormData({ ...formData, operatorProduksi: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              {editId ? 'Perbarui Batch' : 'Simpan Batch Produksi'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
