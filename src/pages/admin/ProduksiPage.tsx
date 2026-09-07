import React, { useEffect, useState } from 'react';
import { Factory, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, User, MapPin, Sprout, Eye, Warehouse as WarehouseIcon, Package, CalendarDays, Hash } from 'lucide-react';
import { productionApi } from '../../api/endpoints/productionApi';
import { productApi, Product } from '../../api/endpoints/productApi';
import { ProductionBatch } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';

import { useUnitSettings } from '../../context/UnitSettingsContext';
import { warehouseApi } from '../../api/endpoints/warehouseApi';
import { WarehouseOption } from '../../types';
import { Toast } from '../../components/common/Toast';
import { Combobox } from '../../components/common/Combobox';
import { formatTanggalId, formatDateTimeId } from '../../utils/dateUtils';

export const ProduksiPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatBerat } = useUnitSettings();
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  // Master produk (dropdown pilihan produk olahan)
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductionBatch | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<ProductionBatch | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bahan baku: pilih batch stok dari gudang (bukan asal panen)
  const [selectedStockBatch, setSelectedStockBatch] = useState<{
    id: string;
    kodeBatchStok: string;
    asalBatch?: { id: string; kodeBatchStok: string } | null;
    kodePanen: string | null;
    sisaKg: number;
    tanggalMasuk: string | null;
  } | null>(null);

  const [formData, setFormData] = useState<
    Partial<ProductionBatch> & { jumlahHasil?: string }
  >({
    kodeBatch: '',
    namaProduk: '',
    tanggalProduksi: new Date().toLocaleDateString('id-ID'),
    tanggalKadaluarsa: '',
    jumlahHasil: '',
    satuan: 'Pouch',
    bahanDigunakan: null as any,
    satuanBahan: 'Kg',
    nomorBatchBahanBaku: '',
    harvestId: null as any,
    stockBatchId: null as any,
    operatorProduksi: '',
    lokasiGudang: '',
    gudangId: null as any,
  });

  // Daftar gudang untuk pilihan bahan baku
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>([]);
  // Batch stok dari gudang terpilih (dropdown bahan)
  const [stockBatches, setStockBatches] = useState<{
    id: string;
    kodeBatchStok: string;
    jenis?: string;
    asalBatch?: { id: string; kodeBatchStok: string } | null;
    harvestId: string | null;
    kodePanen: string | null;
    jumlahMasukKg: number;
    sisaKg: number;
    tanggalMasuk: string | null;
  }[]>([]);

  const fetchProduction = async (targetPage = page, search = searchTerm) => {
    setLoading(true);
    try {
      const res = await productionApi.getAll({
        page: targetPage,
        limit,
        search: search || undefined,
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

  // Muat master produk aktif untuk dropdown pilihan produk
  useEffect(() => {
    productApi.getAll({ isActive: true }).then((res) => {
      setProductOptions(res.data || []);
    }).catch(() => setProductOptions([]));
  }, []);

  useEffect(() => {
    setPage(1); // Reset ke halaman 1 saat search berubah
  }, [searchTerm]);

  useEffect(() => {
    fetchProduction(page, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  // Muat opsi gudang untuk pilihan bahan baku (batch stok dimuat saat pilih gudang)
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await warehouseApi.getOptions();
        setWarehouseOptions(res.data || []);
      } catch {
        setWarehouseOptions([]);
      }
    };
    fetchWarehouses();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setSelectedStockBatch(null);
    setStockBatches([]);
    setSelectedProductId(null);
    setFormData({
      kodeBatch: '', // dibuat otomatis backend: PRD-<nama lahan>-<tgl produksi>-<urutan>
      namaProduk: '',
      tanggalProduksi: new Date().toLocaleDateString('id-ID'),
      tanggalKadaluarsa: '',
      jumlahHasil: '',
      satuan: 'Pouch',
      bahanDigunakan: null as any,
      satuanBahan: 'Kg',
      nomorBatchBahanBaku: '',
      harvestId: null as any,
      stockBatchId: null as any,
      operatorProduksi: '',
      lokasiGudang: '',
      gudangId: null as any,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ProductionBatch) => {
    setEditId(item.id);
    setSelectedStockBatch(null);
    setStockBatches([]);
    setFormData({
      ...item,
      jumlahHasil: String(item.jumlahHasil ?? ''),
      bahanDigunakan: item.bahanDigunakan != null ? String(item.bahanDigunakan) : '',
      satuanBahan: item.satuanBahan || 'Kg',
      harvestId: (item as any).harvestId || null,
      stockBatchId: (item as any).stockBatchId || null,
      gudangId: (item as any).gudangId || null,
    });
    setSelectedProductId((item as any).productId || null);
    // Jika batch stok sudah terhubung, muat daftar batch gudang untuk ditampilkan
    const gid = (item as any).gudangId;
    const sbId = (item as any).stockBatchId;
    if (gid) {
      warehouseApi.getStockBatches(String(gid)).then((res) => {
        const list = res.data || [];
        setStockBatches(list);
        const match = list.find((b) => String(b.id) === String(sbId));
        if (match) {
          setSelectedStockBatch({
            id: match.id,
            kodeBatchStok: match.kodeBatchStok,
            asalBatch: match.asalBatch,
            kodePanen: match.kodePanen,
            sisaKg: match.sisaKg,
            tanggalMasuk: match.tanggalMasuk,
          });
        }
      }).catch(() => {});
    }
    setIsModalOpen(true);
  };

  // Pilih gudang → muat batch stok yang masih ada sisa
  const handleGudangChange = async (gudangId: string) => {
    setFormData((prev) => ({ ...prev, gudangId: gudangId || (null as any), stockBatchId: null as any }));
    setSelectedStockBatch(null);
    setStockBatches([]);
    if (!gudangId) return;
    try {
      const res = await warehouseApi.getStockBatches(gudangId);
      setStockBatches(res.data || []);
    } catch {
      setStockBatches([]);
    }
  };

  // Pilih batch stok → isi asal (nomor batch bahan baku) + jumlah bahan otomatis
  const handleStockBatchChange = (id: string) => {
    const b = stockBatches.find((x) => String(x.id) === id) || null;
    setSelectedStockBatch(b);
    setFormData((prev) => ({
      ...prev,
      stockBatchId: id || (null as any),
      nomorBatchBahanBaku: b ? `${b.kodeBatchStok}${b.asalBatch?.kodeBatchStok ? ` (sosoh dari ${b.asalBatch.kodeBatchStok})` : ''}` : '',
    }));
  };

  // Pilih produk master → isi nama produk & satuan hasil otomatis (terkunci)
  const handleProductChange = (productId: string) => {
    const prod = productOptions.find((x) => String(x.id) === productId) || null;
    setSelectedProductId(prod ? String(prod.id) : null);
    setFormData((prev) => ({
      ...prev,
      productId: prod ? String(prod.id) : (null as any),
      namaProduk: prod ? prod.name : '',
      satuan: prod ? (prod.satuanHasil || 'Pouch') : prev.satuan,
    }));
  };

  // Cari produk master yang cocok dengan productId (untuk edit)
  const selectedProduct = productOptions.find((x) => String(x.id) === String(selectedProductId || '')) || null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const bahan = formData.bahanDigunakan != null && String(formData.bahanDigunakan).trim() !== ''
      ? Number(formData.bahanDigunakan)
      : 0;
    // Validasi: produk master wajib dipilih (nama & satuan terkunci mengikuti master)
    if (!selectedProduct) {
      setToast({ msg: 'Pilih produk dari master data dulu (nama & satuan otomatis terisi).', type: 'error' });
      return;
    }
    // Validasi: bahan tidak boleh melebihi sisa batch stok terpilih
    if (bahan > 0) {
      if (!formData.gudangId) {
        setToast({ msg: 'Pilih gudang asal bahan dulu.', type: 'error' });
        return;
      }
      if (!formData.stockBatchId || !selectedStockBatch) {
        setToast({ msg: 'Pilih stok batch (asal bahan) dulu.', type: 'error' });
        return;
      }
      if (bahan > selectedStockBatch.sisaKg) {
        setToast({
          msg: `Bahan yang digunakan (${bahan} kg) melebihi sisa stok batch ${selectedStockBatch.kodeBatchStok} (${selectedStockBatch.sisaKg} kg). Kurangi jumlah bahan atau pilih batch lain.`,
          type: 'error',
        });
        return;
      }
    }
    const payload = {
      ...formData,
      productId: selectedProduct ? String(selectedProduct.id) : null,
      jumlahHasil: Number(formData.jumlahHasil) || 0,
      bahanDigunakan: bahan > 0 ? bahan : null,
      gudangId: formData.gudangId ? String(formData.gudangId) : null,
      stockBatchId: formData.stockBatchId ? String(formData.stockBatchId) : null,
    };
    try {
      if (editId) {
        await productionApi.update(editId, payload);
      } else {
        await productionApi.create(payload);
      }
      setIsModalOpen(false);
      fetchProduction();
      setToast({ msg: editId ? 'Batch olahan diperbarui.' : 'Batch olahan berhasil ditambahkan.', type: 'success' });
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan batch olahan.', type: 'error' });
    }
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
  const totalVolumeHasil = batches.reduce((acc, curr) => acc + curr.jumlahHasil, 0);

  return (
    <div className="space-y-5 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">Kelola Olahan Sorgum</h1>
        </div>

        <div className="w-full sm:w-auto">
          <Button onClick={handleOpenAdd} icon={<Plus className="w-3.5 h-3.5" />} variant="primary" className="w-full sm:w-auto text-xs py-1.5 px-3 justify-center">
            Buat Batch Olahan Baru
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
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL BATCH OLAHAN</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">{totalProdukOlahan} Batch</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Siap Konsumsi & Bahan Mentah</p>
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
              Tabel Data Batch Olahan
            </h3>
          </div>
        </div>

        {/* Full-width CRUD Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[680px]">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-b border-[#c4c8bb]/20">
                <th className="py-2.5 px-3 pl-4">KODE</th>
                <th className="py-2.5 px-3">NAMA PRODUK OLAHAN</th>
                <th className="py-2.5 px-3">JUMLAH HASIL</th>
                <th className="py-2.5 px-3">BAHAN DIGUNAKAN</th>
                <th className="py-2.5 px-3">PENANGGUNG JAWAB</th>
                <th className="py-2.5 px-3 pr-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 text-[#221A12] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                    <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                    Memuat data olahan...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                    Tidak ada batch olahan yang ditemukan.
                  </td>
                </tr>
              ) : (
              batches.map((item) => (
                <tr key={item.id} className="hover:bg-[#F7F7F5] transition-colors">
                  <td className="py-2.5 px-3 pl-4 font-bold text-[#2C4219] whitespace-nowrap">{item.kodeBatch}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#172C05]">{item.namaProduk}</td>
                  <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                    {item.jumlahHasil.toLocaleString('id-ID')} {item.satuan}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-[#44483e]">
                    {item.bahanDigunakan != null
                      ? `${Number(item.bahanDigunakan).toLocaleString('id-ID')} ${item.satuanBahan || 'Kg'}`
                      : <span className="text-[#9CA3AF]">-</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 text-[#44483e]">
                      <User className="w-3 h-3 text-[#6B7280] shrink-0" />
                      {item.operatorProduksi || '-'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 pr-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedDetail(item)}
                        className="min-h-8 px-2.5 py-1.5 text-[#2C4219] hover:bg-[#2C4219]/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                        title="Lihat Detail Batch"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
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

      {/* Modal Form Batch Olahan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? 'Edit Batch Olahan' : 'Catat Batch Olahan Baru'}
        subtitle={editId ? 'Perbarui data batch olahan' : 'Lengkapi data batch olahan sorgum'}
        maxWidth="6xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm">Batal</Button>
            <Button type="submit" form="produksi-form" variant="primary" className="px-8 py-3 text-sm">
              {editId ? 'Simpan Perubahan' : 'Simpan Batch Produksi'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-6" id="produksi-form">
          {/* ── Bagian 1: Informasi Produk ─────────────────────────────── */}
          <div className="p-5 sm:p-6 bg-[#FFF8F4] border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">1</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Informasi Produk</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Kode Olahan</label>
                <input
                  type="text"
                  value={formData.kodeBatch}
                  readOnly
                  disabled
                  placeholder={editId ? '' : 'Otomatis — PRD-LUS-15092026-01'}
                  title="Kode dibuat otomatis: 3 huruf nama lahan asal + tanggal produksi + urutan"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold text-[#6B7280] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Nama Produk Olahan <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={productOptions.map((p) => ({
                    value: String(p.id),
                    label: `${p.name} — ${p.satuanHasil || 'Pouch'}`,
                    searchText: `${p.name} ${p.satuanHasil || ''}`,
                  }))}
                  value={selectedProductId || ''}
                  onChange={(v) => handleProductChange(v)}
                  placeholder="-- Pilih Nama Produk --"
                  searchPlaceholder="Cari nama produk..."
                  emptyText="Belum ada produk master. Tambahkan dulu di menu Produk Olahan."
                />
              </div>
            </div>
          </div>

          {/* ── Bagian 2: Jumlah Hasil & Bahan ─────────────────────────── */}
          <div className="p-5 sm:p-6 bg-white border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">2</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Jumlah Hasil & Bahan</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Jumlah Hasil <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.jumlahHasil}
                  onChange={(e) => setFormData({ ...formData, jumlahHasil: e.target.value })}
                  placeholder="Contoh: 1000"
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Satuan Hasil</label>
                <input
                  type="text"
                  value={formData.satuan || 'Pouch'}
                  readOnly
                  disabled
                  className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold text-[#6B7280] cursor-not-allowed"
                />
              </div>
            </div>

            {/* Bahan yang Digunakan — jumlah & satuan bahan baku */}
            <div className="p-4 bg-[#F1F8E9] border border-[#C3E28D]/50 rounded-2xl space-y-3">
              <p className="text-sm font-extrabold text-[#2C4219]">Bahan yang Digunakan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2C4219] mb-1">Jumlah Bahan</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bahanDigunakan != null ? String(formData.bahanDigunakan) : ''}
                    onChange={(e) => setFormData({ ...formData, bahanDigunakan: e.target.value })}
                    placeholder="Contoh: 50"
                    className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2C4219] mb-1">Satuan Bahan</label>
                  <select
                    value={formData.satuanBahan || 'Kg'}
                    onChange={(e) => setFormData({ ...formData, satuanBahan: e.target.value })}
                    className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    <option value="Kg">Kg</option>
                    <option value="Gram">Gram</option>
                    <option value="Liter">Liter</option>
                    <option value="Botol">Botol</option>
                    <option value="Karung">Karung</option>
                    <option value="Sak">Sak</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#2C4219] mb-1">Gudang Asal Bahan</label>
                  <Combobox
                    options={warehouseOptions.map((w) => ({
                      value: String(w.id),
                      label: `${w.namaGudang} (${w.kodeGudang}) — ${w.totalStokKg > 0 ? `${w.totalStokKg} kg tersedia` : 'kosong'}`,
                      searchText: `${w.namaGudang} ${w.kodeGudang} ${w.namaLahan || ''} ${w.totalStokKg}`,
                    }))}
                    value={formData.gudangId ? String(formData.gudangId) : ''}
                    onChange={(v) => handleGudangChange(v)}
                    placeholder="-- Pilih Gudang --"
                    searchPlaceholder="Cari nama gudang / kode gudang / lahan..."
                    emptyText="Tidak ada gudang tersedia."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Bagian 3: Asal Bahan & Penanggung Jawab ────────────────── */}
          <div className="p-5 sm:p-6 bg-white border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">3</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Asal Bahan & Penanggung Jawab</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Stok Batch (Sorgum Sosoh) <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={stockBatches.map((b) => ({
                    value: String(b.id),
                    label: `${b.kodeBatchStok}${b.asalBatch?.kodeBatchStok ? ` (dari ${b.asalBatch.kodeBatchStok})` : ''} • sisa ${formatBerat(b.sisaKg)}`,
                    searchText: `${b.kodeBatchStok} ${b.asalBatch?.kodeBatchStok || ''} ${b.kodePanen || ''} ${b.sisaKg}`,
                  }))}
                  value={formData.stockBatchId ? String(formData.stockBatchId) : ''}
                  onChange={(v) => handleStockBatchChange(v)}
                  placeholder={stockBatches.length === 0 ? '-- Pilih Gudang dulu (tidak ada sorgum sosoh) --' : '-- Pilih Stok Sorgum Sosoh --'}
                  searchPlaceholder="Cari kode batch / asal gabah / panen..."
                  emptyText="Tidak ada stok SORGUM yang cocok."
                />
                {formData.gudangId && stockBatches.length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1.5">Gudang ini tidak punya stok sorgum sosoh.</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Penanggung Jawab Produksi</label>
                <input
                  type="text"
                  value={formData.operatorProduksi}
                  onChange={(e) => setFormData({ ...formData, operatorProduksi: e.target.value })}
                  placeholder="Contoh: Ibu Hastuti / Tim KWT Asri"
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                  required
                />
              </div>
            </div>
          </div>

        </form>
      </Modal>

      {/* Modal Detail Batch Olahan */}
      <Modal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title={selectedDetail ? `Detail Batch — ${selectedDetail.kodeBatch}` : 'Detail Batch'}
        subtitle={selectedDetail ? selectedDetail.namaProduk : ''}
        maxWidth="2xl"
      >
        {selectedDetail && (
          <div className="space-y-4">
            {/* Ringkasan utama */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-[#FFF8F4] rounded-2xl border border-[#c4c8bb]/20">
              <div className="w-12 h-12 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center shrink-0">
                <Factory className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-black text-[#2C4219] leading-tight truncate">{selectedDetail.namaProduk}</p>
                <p className="text-[11px] text-[#6B7280] font-medium">{selectedDetail.kodeBatch}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase">Jumlah Hasil</p>
                <p className="text-lg font-black text-[#2C4219] leading-tight">
                  {Number(selectedDetail.jumlahHasil).toLocaleString('id-ID')} {selectedDetail.satuan}
                </p>
              </div>
            </div>

            {/* Asal bahan: gudang + batch stok + panen */}
            <div className="p-3.5 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20">
              <p className="text-[10px] font-bold text-[#2C4219] uppercase mb-2 flex items-center gap-1.5">
                <WarehouseIcon className="w-3.5 h-3.5" /> Asal Bahan (Dari Gudang)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-white rounded-lg border border-[#c4c8bb]/20">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase">Gudang Asal</p>
                  <p className="font-bold text-[#172C05] mt-0.5">
                    {selectedDetail.gudang ? `${selectedDetail.gudang.namaGudang} (${selectedDetail.gudang.kodeGudang})` : '-'}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#c4c8bb]/20">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase">Stok Sorgum</p>
                  <p className="font-bold text-[#172C05] mt-0.5">
                    {selectedDetail.stockBatch ? (
                      <span className="inline-flex items-center gap-1">
                        <Package className="w-3 h-3 text-[#2C4219]" /> {selectedDetail.stockBatch.kodeBatchStok}
                      </span>
                    ) : '-'}
                  </p>
                  {selectedDetail.stockBatch?.asalBatch?.kodeBatchStok && (
                    <p className="text-[10px] text-[#8C5A2B] mt-0.5">
                      sosoh dari {selectedDetail.stockBatch.asalBatch.kodeBatchStok}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#c4c8bb]/20">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase">Dari Panen</p>
                  <p className="font-bold text-[#172C05] mt-0.5">
                    {selectedDetail.harvest ? (
                      <span className="inline-flex items-center gap-1">
                        <Sprout className="w-3 h-3 text-[#2C4219]" /> {selectedDetail.harvest.kodePanen}
                      </span>
                    ) : '-'}
                  </p>
                  {(selectedDetail.lahan?.namaLahan || selectedDetail.harvest?.tanggalPanen) && (
                    <p className="text-[10px] text-[#6B7280] mt-0.5">
                      {selectedDetail.lahan?.namaLahan ? `${selectedDetail.lahan.namaLahan} • ` : ''}
                      {selectedDetail.harvest?.tanggalPanen ? `Panen ${formatDateTimeId(selectedDetail.harvest.tanggalPanen)}` : ''}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-white rounded-lg border border-[#c4c8bb]/20">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase">Bahan Digunakan</p>
                  <p className="font-bold text-[#172C05] mt-0.5">
                    {selectedDetail.bahanDigunakan != null
                      ? `${Number(selectedDetail.bahanDigunakan).toLocaleString('id-ID')} ${selectedDetail.satuanBahan || 'Kg'}`
                      : '-'}
                  </p>
                </div>
              </div>
              {selectedDetail.nomorBatchBahanBaku && (
                <p className="text-[11px] text-[#6B7280] mt-2">No. Batch Bahan: <b className="text-[#172C05]">{selectedDetail.nomorBatchBahanBaku}</b></p>
              )}
            </div>

            {/* Data penting lainnya */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#c4c8bb]/20">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Tanggal Produksi</p>
                <p className="font-bold text-[#172C05] mt-0.5">{formatTanggalId(selectedDetail.tanggalProduksi) || '-'}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#c4c8bb]/20">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase flex items-center gap-1"><User className="w-3 h-3" /> Penanggung Jawab</p>
                <p className="font-bold text-[#172C05] mt-0.5">{selectedDetail.operatorProduksi || '-'}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#c4c8bb]/20">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> Lokasi Gudang</p>
                <p className="font-bold text-[#172C05] mt-0.5">{selectedDetail.lokasiGudang || '-'}</p>
              </div>
            </div>
          </div>
        )}
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

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
