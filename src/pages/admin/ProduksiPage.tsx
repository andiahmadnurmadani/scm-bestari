import React, { useEffect, useState } from 'react';
import { Factory, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, User, MapPin, Sprout } from 'lucide-react';
import { productionApi } from '../../api/endpoints/productionApi';
import { ProductionBatch } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { nextCode } from '../../utils/kodeGenerator';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { HarvestRecord } from '../../types';
import { useUnitSettings } from '../../context/UnitSettingsContext';
import { warehouseApi } from '../../api/endpoints/warehouseApi';
import { WarehouseOption } from '../../types';

export const ProduksiPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('Semua');
  const { formatBerat } = useUnitSettings();

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
  const [selectedHarvestTrace, setSelectedHarvestTrace] = useState<HarvestRecord | null>(null);
  const [lokasiDipilih, setLokasiDipilih] = useState('');

  const [formData, setFormData] = useState<
    Partial<ProductionBatch> & { jumlahHasil?: string }
  >({
    kodeBatch: '',
    namaProduk: '',
    kategori: 'Ready to Eat (Siap Konsumsi)',
    tanggalProduksi: new Date().toLocaleDateString('id-ID'),
    tanggalKadaluarsa: '',
    jumlahHasil: '',
    satuan: 'Pouch',
    bahanDigunakan: null as any,
    satuanBahan: 'Kg',
    nomorBatchBahanBaku: '',
    harvestId: null as any,
    operatorProduksi: '',
    lokasiGudang: '',
    gudangId: null as any,
  });

  // Daftar gudang untuk pilihan bahan baku (FIFO)
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>([]);

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
    // Muat opsi gudang (untuk bahan baku FIFO)
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
    setSelectedHarvestTrace(null);
    setFormData({
      kodeBatch: nextCode('PRD-', batches, 3),
      namaProduk: '',
      kategori: 'Ready to Eat (Siap Konsumsi)',
      tanggalProduksi: new Date().toLocaleDateString('id-ID'),
      tanggalKadaluarsa: '',
      jumlahHasil: '',
      satuan: 'Pouch',
      bahanDigunakan: null as any,
      satuanBahan: 'Kg',
      nomorBatchBahanBaku: '',
      harvestId: null as any,
      operatorProduksi: '',
      lokasiGudang: '',
      gudangId: null as any,
    });
    setLokasiDipilih('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ProductionBatch) => {
    setEditId(item.id);
    setSelectedHarvestTrace(null);
    // coba cari harvest trace untuk ditampilkan
    const hid = (item as any).harvestId;
    if (hid) {
      const hr = harvestList.find((h) => h.id === String(hid)) || null;
      setSelectedHarvestTrace(hr as any);
    }
    setFormData({
      ...item,
      jumlahHasil: String(item.jumlahHasil ?? ''),
      bahanDigunakan: item.bahanDigunakan != null ? String(item.bahanDigunakan) : '',
      satuanBahan: item.satuanBahan || 'Kg',
      harvestId: (item as any).harvestId || null,
      gudangId: (item as any).gudangId || null,
    });
    const hr = (item as any).harvestId ? harvestList.find((h) => h.id === String((item as any).harvestId)) || null : null;
    setSelectedHarvestTrace(hr as any);
    setLokasiDipilih(hr ? String((hr as any).lahanId || (hr as any).lahan?.id || '') : '');
    setIsModalOpen(true);
  };
  const handleHarvestTraceChange = (harvestId: string) => {
    const hr = harvestList.find((h) => h.id === harvestId) || null;
    setSelectedHarvestTrace(hr as any);
    if (hr) setLokasiDipilih(String((hr as any).lahanId || (hr as any).lahan?.id || ''));
    setFormData((prev) => ({ ...prev, harvestId: harvestId || (null as any), nomorBatchBahanBaku: hr ? hr.kodePanen : prev.nomorBatchBahanBaku }));
  };

  // Daftar lahan unik dari hasil panen (untuk input Lokasi)
  const lokasiOptions = Array.from(
    new Map(
      harvestList.map((h: any) => [String(h.lahanId || h.lahan?.id || h.namaLahan), {
        id: String(h.lahanId || h.lahan?.id || h.namaLahan),
        nama: h.lahan?.namaLahan || h.namaLahan,
        desa: h.lahan?.lokasiDesa || '',
      }])
    ).values()
  );

  const handleLokasiChange = (lokasiId: string) => {
    setLokasiDipilih(lokasiId);
    setSelectedHarvestTrace(null);
    setFormData((prev) => ({ ...prev, harvestId: null as any, nomorBatchBahanBaku: '' }));
  };

  // Hasil panen yang sesuai dengan lokasi terpilih
  const panenByLokasi = lokasiDipilih
    ? harvestList.filter((h: any) => String(h.lahanId || h.lahan?.id || h.namaLahan) === lokasiDipilih)
    : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      jumlahHasil: Number(formData.jumlahHasil) || 0,
      bahanDigunakan: formData.bahanDigunakan != null && String(formData.bahanDigunakan).trim() !== '' ? Number(formData.bahanDigunakan) : null,
      gudangId: formData.gudangId ? String(formData.gudangId) : null,
    };
    if (editId) {
      await productionApi.update(editId, payload);
    } else {
      await productionApi.create(payload);
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

          {/* Filter tabs: Raw vs Ready to Eat */}
          <div className="flex items-center gap-1.5 bg-[#F7F7F5] p-1 rounded-lg border border-[#c4c8bb]/30 overflow-x-auto max-w-full custom-scrollbar">
            {(['Semua', 'Ready to Eat (Siap Konsumsi)', 'Raw (Bahan Mentah)', 'Lainnya']).map((tab) => (
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
          <table className="w-full text-left border-collapse text-xs min-w-[680px]">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-b border-[#c4c8bb]/20">
                <th className="py-2.5 px-3 pl-4">KODE</th>
                <th className="py-2.5 px-3">NAMA PRODUK OLAHAN</th>
                <th className="py-2.5 px-3">KATEGORI</th>
                <th className="py-2.5 px-3">JUMLAH HASIL</th>
                <th className="py-2.5 px-3">BAHAN DIGUNAKAN</th>
                <th className="py-2.5 px-3">ASAL PANEN</th>
                <th className="py-2.5 px-3">PENANGGUNG JAWAB</th>
                <th className="py-2.5 px-3 pr-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 text-[#221A12] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                    <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                    Memuat data olahan...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                    Tidak ada batch olahan yang ditemukan.
                  </td>
                </tr>
              ) : (
              batches.map((item) => (
                <tr key={item.id} className="hover:bg-[#F7F7F5] transition-colors">
                  <td className="py-2.5 px-3 pl-4 font-bold text-[#2C4219] whitespace-nowrap">{item.kodeBatch}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#172C05]">{item.namaProduk}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                        item.kategori.includes('Ready to Eat')
                          ? 'bg-[#C3E28D] text-[#172C05]'
                          : item.kategori.includes('Raw')
                          ? 'bg-[#fff1e5] text-[#8C5A2B]'
                          : 'bg-[#F7F7F5] text-[#44483e]'
                      }`}
                    >
                      {item.kategori.includes('Ready to Eat')
                        ? 'Siap Konsumsi'
                        : item.kategori.includes('Raw')
                        ? 'Bahan Mentah'
                        : item.kategori}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                    {item.jumlahHasil.toLocaleString('id-ID')} {item.satuan}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-[#44483e]">
                    {item.bahanDigunakan != null
                      ? `${Number(item.bahanDigunakan).toLocaleString('id-ID')} ${item.satuanBahan || 'Kg'}`
                      : <span className="text-[#9CA3AF]">-</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    {(item as any).harvest ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 font-bold text-[#2C4219] text-[11px]">
                          <Sprout className="w-3 h-3" /> {(item as any).harvest.kodePanen}
                        </span>
                        <div className="text-[10px] text-[#6B7280] flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {(item as any).lahan?.namaLahan || (item as any).harvest.namaLahan || '-'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#9CA3AF]">-</span>
                    )}
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
        subtitle="Catat produk olahan sorgum beserta asal panennya"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kode Olahan
              </label>
              <input
                type="text"
                value={formData.kodeBatch}
                readOnly
                disabled
                title="Kode dibuat otomatis oleh sistem"
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
                <option value="Ready to Eat (Siap Konsumsi)">Siap Konsumsi (Ready to Eat)</option>
                <option value="Raw (Bahan Mentah)">Bahan Mentah (Raw)</option>
                <option value="Lainnya">Lainnya</option>
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
              placeholder="Contoh: Tepung Sorgum Bioguma 500g"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Jumlah Hasil
              </label>
              <input
                type="number"
                min="0"
                value={formData.jumlahHasil}
                onChange={(e) => setFormData({ ...formData, jumlahHasil: e.target.value })}
                placeholder="Contoh: 1000"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Satuan Hasil
              </label>
              <select
                value={formData.satuan}
                onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              >
                <option value="Pouch">Pouch</option>
                <option value="Kg">Kg</option>
                <option value="Botol">Botol</option>
                <option value="Box">Box</option>
                <option value="Toples">Toples</option>
                <option value="Kemasan">Kemasan</option>
              </select>
            </div>
          </div>

          {/* Bahan yang Digunakan — jumlah & satuan bahan baku */}
          <div className="p-3.5 bg-[#F7F7F5] border border-[#c4c8bb]/20 rounded-xl">
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-2">
              Bahan yang Digunakan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-[#74796d] uppercase mb-1">
                  Jumlah Bahan
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bahanDigunakan != null ? String(formData.bahanDigunakan) : ''}
                  onChange={(e) => setFormData({ ...formData, bahanDigunakan: e.target.value })}
                  placeholder="Contoh: 50"
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#74796d] uppercase mb-1">
                  Satuan Bahan
                </label>
                <select
                  value={formData.satuanBahan || 'Kg'}
                  onChange={(e) => setFormData({ ...formData, satuanBahan: e.target.value })}
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm"
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
                <label className="block text-xs font-bold text-[#74796d] uppercase mb-1">
                  Gudang Asal Bahan
                </label>
                <select
                  value={formData.gudangId ? String(formData.gudangId) : ''}
                  onChange={(e) => setFormData({ ...formData, gudangId: e.target.value || (null as any) })}
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                >
                  <option value="">-- Pilih Gudang --</option>
                  {warehouseOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.namaGudang} ({w.kodeGudang}) — {w.totalStokKg > 0 ? `${w.totalStokKg} kg tersedia` : 'kosong'}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  Bahan diambil dari gudang pilihan secara FIFO (stok paling lama dipakai duluan).
                </p>
              </div>
            </div>
          </div>

          {/* Asal Panen — 2 input: Lokasi & Panen */}
          <div className="p-3.5 bg-[#F7F7F5] border border-[#c4c8bb]/20 rounded-xl space-y-3">
            <label className="block text-xs font-bold text-[#2C4219] uppercase">
              Asal Panen
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-bold text-[#74796d] uppercase mb-1">
                  Lokasi (Lahan)
                </label>
                <select
                  value={lokasiDipilih}
                  onChange={(e) => handleLokasiChange(e.target.value)}
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                >
                  <option value="">
                    {lokasiOptions.length === 0 ? 'Belum ada lahan' : '-- Pilih Lokasi --'}
                  </option>
                  {lokasiOptions.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.nama}{l.desa ? ` (${l.desa})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#74796d] uppercase mb-1">
                  Panen
                </label>
                <select
                  value={String((formData as any).harvestId || '')}
                  onChange={(e) => handleHarvestTraceChange(e.target.value)}
                  disabled={!lokasiDipilih}
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!lokasiDipilih
                      ? 'Pilih Lokasi dulu'
                      : panenByLokasi.length === 0
                      ? 'Belum ada panen di lokasi ini'
                      : '-- Pilih Panen --'}
                  </option>
                  {panenByLokasi.map((h: any) => (
                    <option key={h.id} value={h.id}>
                      {h.kodePanen} • {h.tanggalPanen} • {h.varietas}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedHarvestTrace && (
              <div className="p-3 bg-white rounded-lg border border-[#c4c8bb]/20 text-xs space-y-1">
                <p className="font-bold text-[#2C4219]">
                  Lokasi: {(selectedHarvestTrace as any).lahan?.namaLahan || (selectedHarvestTrace as any).namaLahan || '-'}
                </p>
                <p className="text-[#6B7280] font-medium">
                  Panen: {selectedHarvestTrace.kodePanen} • {selectedHarvestTrace.tanggalPanen} • Varietas {selectedHarvestTrace.varietas}
                </p>
                <p className="text-[#6B7280]">
                  Berat: {formatBerat(selectedHarvestTrace.jumlahHasilKg)}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Penanggung Jawab Produksi
            </label>
            <input
              type="text"
              value={formData.operatorProduksi}
              onChange={(e) => setFormData({ ...formData, operatorProduksi: e.target.value })}
              placeholder="Contoh: Ibu Hastuti / Tim KWT Asri"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              required
            />
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
