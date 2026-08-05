import React, { useEffect, useState } from 'react';
import { Factory, Plus, Filter, Search, Edit3, Trash2, CheckCircle, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { productionApi } from '../../api/endpoints/productionApi';
import { ProductionBatch } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { nextCode } from '../../utils/kodeGenerator';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { HarvestRecord } from '../../types';

export const ProduksiPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'Semua' | 'Raw (Bahan Mentah)' | 'Ready to Eat (Siap Konsumsi)'>('Semua');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductionBatch | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bahan baku dropdown: hasil panen + raw bahan mentah
  const [harvestList, setHarvestList] = useState<HarvestRecord[]>([]);
  const [bahanBakuType, setBahanBakuType] = useState<'panen' | 'raw'>('panen');

  const [formData, setFormData] = useState<Partial<ProductionBatch>>({
    kodeBatch: '',
    namaProduk: '',
    kategori: 'Ready to Eat (Siap Konsumsi)',
    tanggalProduksi: new Date().toLocaleDateString('id-ID'),
    tanggalKadaluarsa: '',
    jumlahHasil: 0,
    satuan: 'Pouch',
    nomorBatchBahanBaku: '',
    operatorProduksi: '',
    statusQC: 'Lolos QC',
    lokasiGudang: '',
  });

  const fetchProduction = async (targetPage = page, search = searchTerm, cat = activeCategoryTab) => {
    setLoading(true);
    try {
      const res = await productionApi.getAll({
        page: targetPage,
        limit,
        search: search || undefined,
        kategori: cat === 'Semua' ? undefined : cat,
      });
      setBatches(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setBatches([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset ke halaman 1 saat search/tab berubah
  }, [searchTerm, activeCategoryTab]);

  useEffect(() => {
    fetchProduction(page, searchTerm, activeCategoryTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, activeCategoryTab]);

  // Muat daftar hasil panen untuk dropdown bahan baku
  useEffect(() => {
    const fetchHarvests = async () => {
      try {
        const res = await harvestApi.getAll({ limit: 100 });
        setHarvestList(res.data || []);
      } catch {
        setHarvestList([]);
      }
    };
    fetchHarvests();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setBahanBakuType('panen');
    setFormData({
      kodeBatch: nextCode('PRD-', batches, 3),
      namaProduk: '',
      kategori: 'Ready to Eat (Siap Konsumsi)',
      tanggalProduksi: new Date().toLocaleDateString('id-ID'),
      tanggalKadaluarsa: '',
      jumlahHasil: 0,
      satuan: 'Pouch',
      nomorBatchBahanBaku: '',
      operatorProduksi: '',
      statusQC: 'Lolos QC',
      lokasiGudang: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ProductionBatch) => {
    setEditId(item.id);
    setFormData({ ...item });
    // Deteksi jenis bahan baku dari kode: PN-* = hasil panen, PRD-* = raw mentah
    setBahanBakuType(item.nomorBatchBahanBaku?.startsWith('PN-') ? 'panen' : 'raw');
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await productionApi.delete(deleteTarget.id);
    setDeleteTarget(null);
    fetchProduction();
  };

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    setPage(targetPage);
  };

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
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                    <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                    Memuat data produksi...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                    Tidak ada batch produksi yang ditemukan.
                  </td>
                </tr>
              ) : (
              batches.map((item) => (
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
                        className="min-h-8 px-2.5 py-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                        title="Edit Batch"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="min-h-8 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                        title="Hapus Batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination */}
        {!loading && total > 0 && (
          <div className="p-3 sm:p-4 border-t border-[#c4c8bb]/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280]">
            <span className="font-medium">
              Menampilkan {batches.length === 0 ? 0 : (page - 1) * limit + 1}-
              {Math.min(page * limit, total)} dari {total} batch
            </span>
            <div className="flex items-center gap-1 font-bold">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="p-1 rounded-md border border-[#c4c8bb]/30 text-[#44483e] hover:bg-[#F7F7F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => goToPage(num)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                    num === page ? 'bg-[#2C4219] text-white' : 'hover:bg-[#F7F7F5] text-[#44483e]'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="p-1 rounded-md border border-[#c4c8bb]/30 text-[#44483e] hover:bg-[#F7F7F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
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
                readOnly
                disabled
                title="Kode dibuat otomatis oleh sistem (auto-increment)"
                className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm text-[#2C4219] font-bold cursor-not-allowed"
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
                placeholder="Contoh: 1000"
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
                Jenis Bahan Baku
              </label>
              <select
                value={bahanBakuType}
                onChange={(e) => {
                  const t = e.target.value as 'panen' | 'raw';
                  setBahanBakuType(t);
                  setFormData({ ...formData, nomorBatchBahanBaku: '' });
                }}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="panen">Hasil Panen (Sorgum Segar)</option>
                <option value="raw">Raw Bahan Mentah (Batch Produksi)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                {bahanBakuType === 'panen' ? 'Pilih Hasil Panen' : 'Pilih Raw Bahan Mentah'}
              </label>
              <select
                value={formData.nomorBatchBahanBaku}
                onChange={(e) => setFormData({ ...formData, nomorBatchBahanBaku: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              >
                <option value="" disabled>
                  {bahanBakuType === 'panen'
                    ? harvestList.length === 0
                      ? 'Belum ada hasil panen'
                      : 'Pilih kode panen...'
                    : batches.filter((b) => b.kategori === 'Raw (Bahan Mentah)').length === 0
                    ? 'Belum ada raw bahan mentah'
                    : 'Pilih batch raw...'}
                </option>
                {bahanBakuType === 'panen'
                  ? harvestList.map((h) => (
                      <option key={h.id} value={h.kodePanen}>
                        {h.kodePanen} — {h.namaLahan} ({h.varietas})
                      </option>
                    ))
                  : batches
                      .filter((b) => b.kategori === 'Raw (Bahan Mentah)')
                      .map((b) => (
                        <option key={b.id} value={b.kodeBatch}>
                          {b.kodeBatch} — {b.namaProduk}
                        </option>
                      ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Operator / Tim Produksi KWT
              </label>
              <input
                type="text"
                value={formData.operatorProduksi}
                onChange={(e) => setFormData({ ...formData, operatorProduksi: e.target.value })}
                placeholder="Contoh: Tim KWT Asri"
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

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Hapus Batch Produksi"
          maxWidth="sm"
        >
          <div className="space-y-4 text-sm text-[#221A12]">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">
                  Apakah Anda yakin ingin menghapus batch produksi ini?
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                  <strong>{deleteTarget.kodeBatch}</strong> — {deleteTarget.namaProduk}.
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#c4c8bb]/20">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Batal
              </Button>
              <Button type="button" variant="danger" onClick={confirmDelete}>
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
