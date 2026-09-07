import React, { useEffect, useState } from 'react';
import { Warehouse as WarehouseIcon, Plus, MapPin, Sprout, Package, ArrowDownToLine, ArrowUpFromLine, History, Trash2, Pencil, QrCode, Download, Search, X, ArrowLeftRight, User } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { warehouseApi, BatchTrace, WarehouseHistoryItem } from '../../api/endpoints/warehouseApi';
import { Warehouse, WarehouseStockBatch } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { useUnitSettings } from '../../context/UnitSettingsContext';
import { formatDateTimeId } from '../../utils/dateUtils';
import { Combobox } from '../../components/common/Combobox';

// Opsi bulan (12 bulan terakhir) untuk filter riwayat sosoh — bahasa Indonesia
const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function buatBulanOptions(): { value: string; label: string }[] {
  const now = new Date();
  const opts: { value: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    opts.push({ value, label: `${BULAN_ID[d.getMonth()]} ${d.getFullYear()}` });
  }
  return opts;
}
const bulanOptions = buatBulanOptions();

export const GudangPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const { formatBerat } = useUnitSettings();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailWarehouse, setDetailWarehouse] = useState<Warehouse | null>(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockType, setStockType] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const [formData, setFormData] = useState({
    kodeGudang: '',
    namaGudang: '',
    lahanId: '',
    lokasi: '',
  });
  const [stockForm, setStockForm] = useState({
    gudangId: '',
    harvestId: '',
    stockBatchId: '',
    jumlahKg: '',
    keterangan: '',
  });
  // Opsi panen yang belum penuh masuk gudang (dropdown stok masuk)
  const [harvestOptions, setHarvestOptions] = useState<{ id: string; kodePanen: string; varietas: string; namaLahan?: string | null; sisaBelumMasukKg: number }[]>([]);
  // Batch stok yang masih punya sisa di gudang terpilih (dropdown stok keluar)
  const [stockBatchesForOut, setStockBatchesForOut] = useState<{ id: string; kodeBatchStok: string; sisaKg: number; kodePanen?: string | null }[]>([]);

  // Trace lengkap batch stok (tanam → panen → gudang → olahan → logistik)
  const [traceData, setTraceData] = useState<BatchTrace | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);

  // Modal QR batch
  const [qrTarget, setQrTarget] = useState<WarehouseStockBatch | null>(null);

  // Filter jenis di tabel stok (Semua/Gabah/Sorgum)
  const [jenisFilter, setJenisFilter] = useState<'SEMUA' | 'GABAH' | 'SORGUM'>('SEMUA');
  // Filter status & rentang tanggal masuk di tabel stok batch
  const [statusFilter, setStatusFilter] = useState<'SEMUA' | 'HABIS' | 'TERSEDIA' | 'SIAP_SOSOH'>('SEMUA');
  const [tglDari, setTglDari] = useState('');
  const [tglSampai, setTglSampai] = useState('');

  // Modal proses sosoh
  const [sosohTarget, setSosohTarget] = useState<WarehouseStockBatch | null>(null);
  const [sosohForm, setSosohForm] = useState({ kgGabah: '', kgHasil: '', operator: '' });
  const [sosohSubmitting, setSosohSubmitting] = useState(false);

  // Modal riwayat aktivitas gudang (masuk / keluar / sosoh)
  const [riwayatOpen, setRiwayatOpen] = useState(false);
  // Data riwayat (fetch per filter: bulan & pencarian)
  const [historyList, setHistoryList] = useState<WarehouseHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyBulan, setHistoryBulan] = useState('');
  const [historyTipe, setHistoryTipe] = useState<'SEMUA' | 'MASUK' | 'KELUAR' | 'SOSOH'>('SEMUA');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await warehouseApi.getAll({ page: 1, limit: 100 });
      setWarehouses(res.data || []);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat data gudang.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Muat opsi panen untuk dropdown stok masuk
  const loadHarvestOptions = async () => {
    try {
      const res = await warehouseApi.getHarvestOptions();
      setHarvestOptions(res.data || []);
    } catch {
      setHarvestOptions([]);
    }
  };

  // Muat batch stok yang masih ada sisa di gudang terpilih (untuk stok keluar)
  const loadStockBatches = async (gudangId: string) => {
    try {
      const res = await warehouseApi.getById(gudangId);
      const sorted = [...(res.data.stockBatches || [])]
        .filter((b) => b.jenis === 'SORGUM') // stok keluar hanya sorgum sosoh (bukan gabah)
        .sort((a, b) => {
          const ta = a.tanggalMasuk ? new Date(a.tanggalMasuk).getTime() : 0;
          const tb = b.tanggalMasuk ? new Date(b.tanggalMasuk).getTime() : 0;
          return ta - tb; // FIFO konsumsi: batch terlama keluar dulu
        });
      setStockBatchesForOut(
        sorted.map((b) => ({
          id: b.id,
          kodeBatchStok: b.kodeBatchStok,
          sisaKg: b.sisaKg,
          kodePanen: (b as any).harvest?.kodePanen || null,
        }))
      );
    } catch {
      setStockBatchesForOut([]);
    }
  };

  // Buka trace lengkap batch stok
  const openTrace = async (gudangId: string, batchId: string) => {
    setTraceData(null);
    setTraceLoading(true);
    try {
      const res = await warehouseApi.getBatchTrace(gudangId, batchId);
      setTraceData(res.data);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat riwayat batch.', type: 'error' });
    } finally {
      setTraceLoading(false);
    }
  };

  const filtered = warehouses.filter((w) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      w.namaGudang.toLowerCase().includes(q) ||
      w.kodeGudang.toLowerCase().includes(q) ||
      (w.lokasi || '').toLowerCase().includes(q)
    );
  });

  const totalStokSemua = warehouses.reduce((acc, w) => acc + (w.totalStokKg || 0), 0);
  const totalStokGabah = warehouses.reduce((acc, w) => acc + (w.stokGabahKg || 0), 0);

  const openAdd = () => {
    setEditId(null);
    setFormData({ kodeGudang: '', namaGudang: '', lahanId: '', lokasi: '' });
    setFormModalOpen(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditId(w.id);
    setFormData({
      kodeGudang: w.kodeGudang,
      namaGudang: w.namaGudang,
      lahanId: w.lahanId || '',
      lokasi: w.lokasi || '',
    });
    setFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaGudang.trim()) {
      setToast({ msg: 'Nama gudang wajib diisi.', type: 'error' });
      return;
    }
    try {
      const payload = {
        kodeGudang: formData.kodeGudang || undefined,
        namaGudang: formData.namaGudang.trim(),
        lahanId: formData.lahanId ? formData.lahanId : null,
        lokasi: formData.lokasi.trim(),
      };
      if (editId) {
        await warehouseApi.update(editId, payload);
        setToast({ msg: 'Data gudang berhasil diperbarui.', type: 'success' });
      } else {
        await warehouseApi.create(payload);
        setToast({ msg: 'Data gudang berhasil ditambahkan.', type: 'success' });
      }
      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan data gudang.', type: 'error' });
    }
  };

  const openStock = async (w: Warehouse, type: 'MASUK' | 'KELUAR') => {
    setStockType(type);
    setStockForm({ gudangId: w.id, harvestId: '', stockBatchId: '', jumlahKg: '', keterangan: '' });
    if (type === 'MASUK') {
      await loadHarvestOptions();
    } else {
      await loadStockBatches(w.id);
    }
    setStockModalOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(stockForm.jumlahKg);
    if (!qty || qty <= 0) {
      setToast({ msg: 'Jumlah stok tidak valid.', type: 'error' });
      return;
    }
    try {
      if (stockType === 'MASUK') {
        if (!stockForm.harvestId) {
          setToast({ msg: 'Pilih dulu dari panen mana stok masuk.', type: 'error' });
          return;
        }
        await warehouseApi.stockIn({ harvestId: stockForm.harvestId, jumlahKg: qty, keterangan: stockForm.keterangan });
        setToast({ msg: 'Stok berhasil masuk ke gudang.', type: 'success' });
      } else {
        if (!stockForm.stockBatchId) {
          setToast({ msg: 'Pilih dulu dari stok batch mana yang dikeluarkan.', type: 'error' });
          return;
        }
        // Validasi FE: jumlah tidak boleh melebihi sisa batch terpilih
        const selected = stockBatchesForOut.find((b) => b.id === stockForm.stockBatchId);
        if (selected && qty > selected.sisaKg) {
          setToast({
            msg: `Jumlah keluar (${qty} kg) melebihi sisa batch ${selected.kodeBatchStok} (${selected.sisaKg} kg). Kurangi jumlah atau pilih batch lain.`,
            type: 'error',
          });
          return;
        }
        await warehouseApi.stockOut({ gudangId: stockForm.gudangId, stockBatchId: stockForm.stockBatchId, jumlahKg: qty, keterangan: stockForm.keterangan });
        setToast({ msg: 'Stok berhasil dikeluarkan.', type: 'success' });
      }
      setStockModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memproses stok.', type: 'error' });
    }
  };

  const openSosoh = (batch: WarehouseStockBatch) => {
    setSosohTarget(batch);
    setSosohForm({ kgGabah: '', kgHasil: '', operator: '' });
  };

  const handleSosohSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosohTarget || !detailWarehouse) return;
    const kgGabah = Number(sosohForm.kgGabah);
    const kgHasil = Number(sosohForm.kgHasil);
    if (!kgGabah || kgGabah <= 0) { setToast({ msg: 'Jumlah gabah yang disosoh tidak valid.', type: 'error' }); return; }
    if (!kgHasil || kgHasil <= 0) { setToast({ msg: 'Jumlah hasil sorgum tidak valid.', type: 'error' }); return; }
    if (kgHasil > kgGabah) { setToast({ msg: 'Hasil sorgum tidak bisa melebihi gabah yang disosoh.', type: 'error' }); return; }
    if (sosohForm.operator.trim() && sosohForm.operator.trim().length < 2) {
      setToast({ msg: 'Nama operator sosoh terlalu pendek.', type: 'error' }); return;
    }
    setSosohSubmitting(true);
    try {
      const res = await warehouseApi.sosoh({
        gudangId: detailWarehouse.id,
        batchGabahId: sosohTarget.id,
        kgGabah,
        kgHasilSorgum: kgHasil,
        operator: sosohForm.operator.trim() || undefined,
        keterangan: undefined,
      });
      setToast({ msg: res.message, type: 'success' });
      setSosohTarget(null);
      const refreshed = await warehouseApi.getById(detailWarehouse.id);
      setDetailWarehouse(refreshed.data);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memproses sosoh.', type: 'error' });
    } finally {
      setSosohSubmitting(false);
    }
  };

  const openDetail = async (w: Warehouse) => {
    try {
      setJenisFilter('SEMUA');
      setStatusFilter('SEMUA');
      setTglDari('');
      setTglSampai('');
      const res = await warehouseApi.getById(w.id);
      setDetailWarehouse(res.data);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat detail gudang.', type: 'error' });
    }
  };

  // ── Riwayat gudang: fetch dengan filter bulan, tipe & pencarian ──
  const fetchHistory = async (gudangId: string, opts?: { bulan?: string; search?: string; tipe?: 'MASUK' | 'KELUAR' | 'SOSOH'; page?: number }) => {
    setHistoryLoading(true);
    try {
      const res = await warehouseApi.getHistory(gudangId, {
        bulan: opts?.bulan !== undefined ? opts.bulan : historyBulan || undefined,
        search: opts?.search !== undefined ? opts.search : historySearch.trim() || undefined,
        tipe: opts?.tipe !== undefined ? opts.tipe : historyTipe === 'SEMUA' ? undefined : historyTipe,
        page: opts?.page || historyPage || 1,
        limit: 10,
      });
      setHistoryList(res.data || []);
      setHistoryTotal(res.pagination?.total || 0);
      setHistoryTotalPages(res.pagination?.totalPages || 0);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat riwayat gudang.', type: 'error' });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Buka modal riwayat gudang + muat halaman 1
  const openRiwayat = async (gudangId: string) => {
    setHistorySearch('');
    setHistoryBulan('');
    setHistoryTipe('SEMUA');
    setHistoryPage(1);
    setRiwayatOpen(true);
    await fetchHistory(gudangId, { bulan: '', search: '', tipe: undefined, page: 1 });
  };

  // Handler perubahan filter (bulan / tipe / pencarian) — reset ke halaman 1
  const handleHistoryFilter = async (gudangId: string, patch: { bulan?: string; search?: string; tipe?: 'MASUK' | 'KELUAR' | 'SOSOH' | 'SEMUA' }) => {
    const bulanBaru = patch.bulan !== undefined ? patch.bulan : historyBulan;
    const searchBaru = patch.search !== undefined ? patch.search : historySearch;
    const tipeBaru = patch.tipe !== undefined ? patch.tipe : historyTipe;
    setHistoryBulan(bulanBaru);
    setHistorySearch(searchBaru);
    setHistoryTipe(tipeBaru);
    setHistoryPage(1);
    await fetchHistory(gudangId, {
      bulan: bulanBaru,
      search: searchBaru,
      tipe: tipeBaru === 'SEMUA' ? undefined : tipeBaru,
      page: 1,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await warehouseApi.delete(deleteTarget.id);
      setToast({ msg: 'Data gudang berhasil dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus data gudang.', type: 'error' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#172C05]">Gudang Sorgum</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Penyimpanan hasil panen per lahan — stok dipakai urut masuk (FIFO)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openAdd} icon={<Plus className="w-3.5 h-3.5" />} variant="primary" className="text-xs py-1.5 px-3">
            Tambah Gudang
          </Button>
        </div>
      </div>

      {/* Stat ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">JUMLAH GUDANG</p>
          <h3 className="text-lg font-bold text-[#221A12] mt-1">{warehouses.length} Gudang</h3>
        </div>
        <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL STOK SORGUM</p>
          <h3 className="text-lg font-bold text-[#2C4219] mt-1">{formatBerat(totalStokSemua)}</h3>
        </div>
        <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL STOK GABAH</p>
          <h3 className="text-lg font-bold text-[#8C5A2B] mt-1">{formatBerat(totalStokGabah)}</h3>
        </div>
      </div>

      {/* Grid kartu gudang */}
      {loading ? (
        <div className="py-10 text-center text-[#6B7280] text-sm">Memuat data gudang...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-[#6B7280] text-sm">
          {searchTerm ? 'Tidak ada gudang yang cocok.' : 'Belum ada gudang. Tambahkan lahan atau buat gudang manual.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((w) => (
            <div key={w.id} className="bg-white rounded-2xl border border-[#c4c8bb]/30 shadow-2xs hover:shadow-md transition-all p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#2C4219] flex items-center justify-center shrink-0">
                    <WarehouseIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#172C05] text-sm truncate">{w.namaGudang}</h3>
                    <p className="text-[10px] font-bold text-[#2C4219]">{w.kodeGudang}</p>
                  </div>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${w.totalStokKg > 0 ? 'bg-[#C3E28D] text-[#172C05]' : 'bg-[#fff1e5] text-[#8C5A2B]'}`}>
                  {w.totalStokKg > 0 ? 'Berisi' : 'Kosong'}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                {w.lahan ? (
                  <div className="flex items-center gap-1.5 text-[#44483e]">
                    <Sprout className="w-3.5 h-3.5 text-[#2C4219] shrink-0" />
                    <span className="truncate">{w.lahan.namaLahan}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[#9CA3AF]">
                    <Sprout className="w-3.5 h-3.5 shrink-0" />
                    <span>Gudang umum (tanpa lahan)</span>
                  </div>
                )}
                {(w.lokasi || w.lahan?.lokasiDesa) && (
                  <div className="flex items-center gap-1.5 text-[#44483e]">
                    <MapPin className="w-3.5 h-3.5 text-[#8C5A2B] shrink-0" />
                    <span className="truncate">{w.lokasi || w.lahan?.lokasiDesa}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[#44483e]">
                  <WarehouseIcon className="w-3.5 h-3.5 text-[#8C5A2B] shrink-0" />
                  <span className="text-[11px] font-semibold text-[#8C5A2B]">
                    Gabah {formatBerat(w.stokGabahKg ?? 0)}
                  </span>
                  <span className="text-[#c4c8bb]">•</span>
                  <Sprout className="w-3.5 h-3.5 text-[#2C4219] shrink-0" />
                  <span className="text-[11px] font-semibold text-[#2C4219]">
                    Sorgum {formatBerat(w.stokSorgumKg ?? 0)}
                  </span>
                </div>
              </div>

              {/* Aksi */}
              <div className="mt-3 pt-3 border-t border-[#c4c8bb]/20 flex items-center gap-1.5">
                <button
                  onClick={() => openDetail(w)}
                  className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-[#2C4219] text-white hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Detail & Stok
                </button>
                <button
                  onClick={() => openStock(w, 'MASUK')}
                  title="Stok Masuk"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#C3E28D] text-[#172C05] hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openStock(w, 'KELUAR')}
                  title="Stok Keluar"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#fff1e5] text-[#8C5A2B] hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openEdit(w)}
                  title="Edit Gudang"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-700 hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(w)}
                  title="Hapus Gudang"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-red-600 hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Gudang */}
      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} title={editId ? 'Edit Gudang' : 'Tambah Gudang'}>
        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Nama Gudang <span className="text-red-500">*</span></label>
            <input
              value={formData.namaGudang}
              onChange={(e) => setFormData({ ...formData, namaGudang: e.target.value })}
              placeholder="Contoh: Gudang Lahan A"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Kode Gudang</label>
            <input
              value={formData.kodeGudang}
              onChange={(e) => setFormData({ ...formData, kodeGudang: e.target.value })}
              placeholder="Otomatis (GDG-<nama lahan>-01) jika dikosongkan"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
            <p className="text-[10px] text-[#6B7280] mt-1">Kode dibuat otomatis: GDG-3hurufNamaLahan-urutan (contoh: GDG-LUS-01). Kosongkan untuk auto.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Lokasi</label>
            <input
              value={formData.lokasi}
              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              placeholder="Contoh: Dusun Krajan, Sleman"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setFormModalOpen(false)} className="flex-1 justify-center">Batal</Button>
            <Button type="submit" variant="primary" className="flex-1 justify-center">{editId ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Stok Masuk/Keluar */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={stockType === 'MASUK' ? 'Stok Masuk ke Gudang' : 'Stok Keluar dari Gudang'}
        maxWidth="xl"
      >
        <form onSubmit={handleStockSubmit} className="p-4 sm:p-7 space-y-4">
          <p className="text-xs text-[#6B7280] bg-[#F7F7F5] rounded-lg p-2.5">
            {stockType === 'MASUK'
              ? 'Pilih dari panen mana hasil (gabah) masuk gudang. Panen yang sudah penuh masuk tidak muncul di daftar.'
              : 'Stok keluar dipakai untuk olahan — pilih dari batch SORGUM hasil sosoh, lalu isi jumlahnya.'}
          </p>

          {stockType === 'MASUK' ? (
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Dari Panen <span className="text-red-500">*</span></label>
              <Combobox
                options={harvestOptions.map((h) => ({
                  value: h.id,
                  label: `${h.kodePanen} • ${h.varietas}`,
                  searchText: `${h.kodePanen} ${h.varietas} ${h.namaLahan || ''} sisa ${h.sisaBelumMasukKg} kg`,
                }))}
                value={stockForm.harvestId}
                onChange={(v) => setStockForm({ ...stockForm, harvestId: v })}
                placeholder="-- Pilih Panen --"
                searchPlaceholder="Cari kode panen / varietas / lahan..."
                emptyText="Tidak ada panen yang belum masuk gudang."
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Dari Stok Sorgum (Batch) <span className="text-red-500">*</span></label>
              <Combobox
                options={stockBatchesForOut.map((b) => ({
                  value: b.id,
                  label: `${b.kodeBatchStok} • sisa ${formatBerat(b.sisaKg)}`,
                  searchText: `${b.kodeBatchStok} ${b.kodePanen || ''} ${b.sisaKg}`,
                }))}
                value={stockForm.stockBatchId}
                onChange={(v) => setStockForm({ ...stockForm, stockBatchId: v })}
                placeholder="-- Pilih Batch Sorgum --"
                searchPlaceholder="Cari kode batch..."
                emptyText="Tidak ada stok sorgum dengan sisa di gudang ini."
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Jumlah (kg) <span className="text-red-500">*</span></label>
            <input
              value={stockForm.jumlahKg}
              onChange={(e) => setStockForm({ ...stockForm, jumlahKg: e.target.value })}
              placeholder="Contoh: 250"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Keterangan</label>
            <input
              value={stockForm.keterangan}
              onChange={(e) => setStockForm({ ...stockForm, keterangan: e.target.value })}
              placeholder={stockType === 'MASUK' ? 'Contoh: Hasil panen LUS-10092026-01' : 'Contoh: Dipakai batch PRD-LUS-15092026-01'}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setStockModalOpen(false)} className="flex-1 justify-center">Batal</Button>
            <Button type="submit" variant="primary" className="flex-1 justify-center">
              {stockType === 'MASUK' ? 'Masukkan Stok' : 'Keluarkan Stok'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Gudang (stok FIFO + riwayat) */}
      <Modal
        isOpen={!!detailWarehouse}
        onClose={() => setDetailWarehouse(null)}
        title={detailWarehouse ? `${detailWarehouse.namaGudang} — ${detailWarehouse.kodeGudang}` : 'Detail Gudang'}
        maxWidth="full"
      >
        {detailWarehouse && (
          <div className="p-4 sm:p-7 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#F7F7F5] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase">Total Stok</p>
                <p className="text-base font-bold text-[#2C4219]">{formatBerat(detailWarehouse.totalStokKg)}</p>
              </div>
              <div className="bg-[#F7F7F5] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase">Stok Gabah</p>
                <p className="text-base font-bold text-[#8C5A2B]">{formatBerat((detailWarehouse.stockBatches || []).filter((b) => b.jenis === 'GABAH').reduce((a, b) => a + (b.sisaKg || 0), 0))}</p>
              </div>
              <div className="bg-[#F7F7F5] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase">Stok Sorgum</p>
                <p className="text-base font-bold text-[#2C4219]">{formatBerat((detailWarehouse.stockBatches || []).filter((b) => b.jenis === 'SORGUM').reduce((a, b) => a + (b.sisaKg || 0), 0))}</p>
              </div>
              <div className="bg-[#F7F7F5] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase">Lokasi</p>
                <p className="text-base font-bold text-[#221A12]">{detailWarehouse.lokasi || '-'}</p>
              </div>
            </div>

            {/* ── Tabel Stok ala Odoo/SCM ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 overflow-hidden">
              {/* Header + tab filter */}
              <div className="px-4 py-3 border-b border-[#c4c8bb]/20 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#2C4219]" />
                  <h4 className="text-sm font-bold text-[#172C05]">Stok Batch</h4>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => detailWarehouse && openRiwayat(detailWarehouse.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#fff1e5] text-[#8C5A2B] hover:bg-[#fff1e5]/70 transition-colors text-[11px] font-bold cursor-pointer"
                    title="Lihat riwayat masuk, keluar, dan sosoh di gudang ini"
                  >
                    <History className="w-3.5 h-3.5" /> Riwayat
                  </button>
                  {/* Dropdown filter jenis stok */}
                  <select
                    value={jenisFilter}
                    onChange={(e) => setJenisFilter(e.target.value as 'SEMUA' | 'GABAH' | 'SORGUM')}
                    className="px-2.5 py-1.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-lg text-[11px] font-bold text-[#172C05] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2C4219]/30"
                    title="Filter jenis stok"
                  >
                    <option value="SEMUA">Semua Jenis</option>
                    <option value="GABAH">Gabah</option>
                    <option value="SORGUM">Sorgum Sosoh</option>
                  </select>
                  {/* Dropdown filter status */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'SEMUA' | 'TERSEDIA' | 'SIAP_SOSOH' | 'HABIS')}
                    className="px-2.5 py-1.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-lg text-[11px] font-bold text-[#172C05] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2C4219]/30"
                    title="Filter status stok"
                  >
                    <option value="SEMUA">Semua Status</option>
                    <option value="TERSEDIA">Tersedia</option>
                    <option value="SIAP_SOSOH">Siap Sosoh</option>
                    <option value="HABIS">Habis</option>
                  </select>
                  {/* Filter rentang tanggal masuk */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={tglDari}
                      onChange={(e) => setTglDari(e.target.value)}
                      className="px-2 py-1.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-lg text-[11px] font-medium text-[#172C05] cursor-pointer"
                      title="Dari tanggal masuk"
                    />
                    <span className="text-[10px] text-[#9CA3AF]">s/d</span>
                    <input
                      type="date"
                      value={tglSampai}
                      onChange={(e) => setTglSampai(e.target.value)}
                      className="px-2 py-1.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-lg text-[11px] font-medium text-[#172C05] cursor-pointer"
                      title="Sampai tanggal masuk"
                    />
                    {(tglDari || tglSampai) && (
                      <button
                        onClick={() => { setTglDari(''); setTglSampai(''); }}
                        className="text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer"
                        title="Reset tanggal"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabel */}
              {(() => {
                const batches = (detailWarehouse.stockBatches || [])
                  .filter((b) => (jenisFilter === 'SEMUA' ? true : b.jenis === jenisFilter))
                  .filter((b) => {
                    if (statusFilter === 'SEMUA') return true;
                    if (statusFilter === 'HABIS') return (b.sisaKg || 0) <= 0;
                    if (statusFilter === 'SIAP_SOSOH') return b.jenis === 'GABAH' && (b.sisaKg || 0) > 0;
                    return b.jenis === 'SORGUM' && (b.sisaKg || 0) > 0; // TERSEDIA
                  })
                  .filter((b) => {
                    if (!tglDari && !tglSampai) return true;
                    const t = b.tanggalMasuk ? new Date(b.tanggalMasuk).getTime() : 0;
                    if (!t) return false;
                    if (tglDari && t < new Date(tglDari + 'T00:00:00').getTime()) return false;
                    if (tglSampai && t > new Date(tglSampai + 'T23:59:59').getTime()) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    const ta = a.tanggalMasuk ? new Date(a.tanggalMasuk).getTime() : 0;
                    const tb = b.tanggalMasuk ? new Date(b.tanggalMasuk).getTime() : 0;
                    return tb - ta; // stok terbaru di atas
                  });
                if (batches.length === 0) {
                  return <p className="text-xs text-[#9CA3AF] text-center py-8">Belum ada stok {jenisFilter === 'GABAH' ? 'gabah' : jenisFilter === 'SORGUM' ? 'sorgum' : ''} tersimpan.</p>;
                }
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#F7F7F5] text-[10px] uppercase text-[#6B7280] tracking-wider">
                          <th className="text-left px-3 py-2.5 font-bold">Kode Batch</th>
                          <th className="text-left px-3 py-2.5 font-bold">Jenis</th>
                          <th className="text-left px-3 py-2.5 font-bold">Tgl Masuk</th>
                          <th className="text-right px-3 py-2.5 font-bold">Sisa</th>
                          <th className="text-center px-3 py-2.5 font-bold">Status</th>
                          <th className="text-center px-3 py-2.5 font-bold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batches.map((b) => {
                          const habis = (b.sisaKg || 0) <= 0;
                          return (
                            <tr key={b.id} className={`border-t border-[#c4c8bb]/15 ${habis ? 'opacity-55' : ''}`}>
                              <td className="px-3 py-2.5">
                                <span className={`font-bold ${b.jenis === 'GABAH' ? 'text-[#8C5A2B]' : 'text-[#2C4219]'}`}>{b.kodeBatchStok}</span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold ${b.jenis === 'GABAH' ? 'bg-[#fff1e5] text-[#8C5A2B]' : 'bg-[#C3E28D]/60 text-[#2C4219]'}`}>
                                  {b.jenis === 'GABAH' ? 'Gabah' : 'Sorgum'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-[#44483e]">{b.tanggalMasuk ? formatDateTimeId(b.tanggalMasuk) : '-'}</td>
                              <td className="px-3 py-2.5 text-right font-bold text-[#172C05]">{formatBerat(b.sisaKg)}</td>
                              <td className="px-3 py-2.5 text-center">
                                {habis ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#F7F7F5] text-[#9CA3AF]">Habis</span>
                                ) : b.jenis === 'GABAH' ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#fff1e5] text-[#8C5A2B]">Siap Sosoh</span>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#C3E28D]/50 text-[#2C4219]">Tersedia</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center justify-center gap-1">
                                  {b.jenis === 'GABAH' && !habis && (
                                    <button
                                      onClick={() => openSosoh(b)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#2C4219] text-white hover:opacity-90 transition-opacity font-bold cursor-pointer"
                                      title="Proses sosoh gabah menjadi sorgum"
                                    >
                                      <ArrowLeftRight className="w-3 h-3" /> Sosoh
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openTrace(detailWarehouse.id, b.id)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#2C4219]/10 text-[#2C4219] hover:bg-[#2C4219]/20 transition-colors font-bold cursor-pointer"
                                    title="Lihat riwayat lengkap batch"
                                  >
                                    <History className="w-3 h-3" /> Detail
                                  </button>
                                  <button
                                    onClick={() => setQrTarget(b)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#fff1e5] text-[#8C5A2B] hover:bg-[#fff1e5]/70 transition-colors font-bold cursor-pointer"
                                    title="Lihat & unduh QR batch"
                                  >
                                    <QrCode className="w-3 h-3" /> QR
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#F7F7F5] text-[10px] uppercase text-[#6B7280] tracking-wider font-bold">
                          <td className="px-3 py-2.5" colSpan={3}>Total ({batches.length} batch)</td>
                          <td className="px-3 py-2.5 text-right font-bold text-[#172C05]">{formatBerat(batches.reduce((a, b) => a + (b.sisaKg || 0), 0))}</td>
                          <td className="px-3 py-2.5" colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Riwayat Aktivitas Gudang (masuk / keluar / sosoh) */}
      <Modal
        isOpen={riwayatOpen}
        onClose={() => setRiwayatOpen(false)}
        title="Riwayat Gudang"
        subtitle={detailWarehouse ? `${detailWarehouse.namaGudang} — ${detailWarehouse.kodeGudang}` : ''}
        maxWidth="xl"
      >
        <div className="p-4 sm:p-6">
          {/* Filter: cari + pilih bulan */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && detailWarehouse) {
                    handleHistoryFilter(detailWarehouse.id, { search: (e.target as HTMLInputElement).value });
                  }
                }}
                placeholder="Cari kode batch / keterangan / operator..."
                className="w-full pl-9 pr-8 p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
              {historySearch && (
                <button
                  onClick={() => detailWarehouse && handleHistoryFilter(detailWarehouse.id, { search: '' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer"
                  title="Bersihkan pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={historyBulan}
              onChange={(e) => detailWarehouse && handleHistoryFilter(detailWarehouse.id, { bulan: e.target.value })}
              className="px-3 py-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm text-[#172C05] font-medium cursor-pointer"
            >
              <option value="">Semua Bulan</option>
              {bulanOptions.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* Filter jenis aktivitas */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {([
              { key: 'SEMUA', label: 'Semua' },
              { key: 'MASUK', label: 'Masuk' },
              { key: 'SOSOH', label: 'Sosoh' },
              { key: 'KELUAR', label: 'Keluar' },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => detailWarehouse && handleHistoryFilter(detailWarehouse.id, { tipe: f.key })}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                  historyTipe === f.key
                    ? 'bg-[#2C4219] text-white border-[#2C4219] shadow-xs'
                    : 'bg-white text-[#6B7280] border-[#c4c8bb]/30 hover:border-[#2C4219]/50 hover:text-[#2C4219]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Info total + daftar */}
          {historyLoading ? (
            <div className="py-10 text-center text-sm text-[#6B7280]">
              <span className="inline-block w-5 h-5 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
              Memuat riwayat gudang...
            </div>
          ) : historyList.length > 0 ? (
            <>
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
                {historyTotal} aktivitas {historyBulan ? ` • Bulan ${bulanOptions.find((b) => b.value === historyBulan)?.label || historyBulan}` : ''}
                {historySearch ? ` • Cari "${historySearch}"` : ''}
              </p>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {historyList.map((h) => {
                  const tipe = h.tipe;
                  const isMasuk = tipe === 'MASUK';
                  const isKeluar = tipe === 'KELUAR';
                  const isSosoh = tipe === 'SOSOH';
                  return (
                    <div key={h.id} className="flex items-start gap-3 bg-[#F7F7F5] rounded-xl px-3.5 py-3 border border-[#c4c8bb]/20">
                      {/* Ikon sesuai tipe */}
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isMasuk
                            ? 'bg-[#2C4219] text-[#C3E28D]'
                            : isKeluar
                            ? 'bg-red-100 text-red-700'
                            : 'bg-[#fff1e5] text-[#8C6D1F]'
                        }`}
                      >
                        {isMasuk ? <ArrowDownToLine className="w-4 h-4" /> : isKeluar ? <ArrowUpFromLine className="w-4 h-4" /> : <History className="w-4 h-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {/* Badge tipe */}
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                              isMasuk
                                ? 'bg-[#C3E28D]/50 text-[#2C4219]'
                                : isKeluar
                                ? 'bg-red-100 text-red-700'
                                : 'bg-[#fff1e5] text-[#8C6D1F]'
                            }`}
                          >
                            {isMasuk ? 'Masuk' : isKeluar ? 'Keluar' : 'Sosoh'}
                          </span>
                          {/* Judul */}
                          <p className="text-sm font-bold text-[#172C05]">
                            {isSosoh ? (
                              <>
                                <span className="text-[#8C5A2B]">{h.kodeBatchGabah || '-'}</span>{' '}
                                <span className="text-[#6B7280] font-medium">→</span>{' '}
                                <span className="text-[#2C4219]">{h.kodeBatchSorgum || '-'}</span>
                              </>
                            ) : (
                              <span className={isMasuk ? 'text-[#2C4219]' : 'text-[#B91C1C]'}>
                                {h.kodeBatch || (h.keterangan || 'Stok gudang')}
                              </span>
                            )}
                          </p>
                          {h.kodeSosoh && (
                            <span className="text-[9px] font-bold text-[#6B7280] bg-white border border-[#c4c8bb]/20 px-1.5 py-0.5 rounded-full">{h.kodeSosoh}</span>
                          )}
                        </div>
                        {/* Detail */}
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {isSosoh ? (
                            <>
                              {formatBerat(h.kgGabah ?? 0)} gabah disosoh → {formatBerat(h.kgSorgum ?? 0)} sorgum
                              <span className="text-[#8C9E5B] font-semibold"> • rendemen {h.rendemen ?? 0}%</span>
                            </>
                          ) : (
                            <>
                              <span className={isMasuk ? 'text-[#2C4219] font-semibold' : 'text-[#B91C1C] font-semibold'}>
                                {isMasuk ? '+' : '-'} {formatBerat(h.jumlahKg)}
                              </span>
                              {h.keterangan && <span className="text-[#6B7280]"> • {h.keterangan}</span>}
                            </>
                          )}
                        </p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                          {formatDateTimeId(h.createdAt)}
                          {h.operator ? ` • Operator: ${h.operator}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-[#c4c8bb]/15 mt-3">
                  <p className="text-[11px] text-[#6B7280]">
                    Halaman {historyPage} dari {historyTotalPages}
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage <= 1}
                      onClick={() => {
                        if (!detailWarehouse) return;
                        const next = historyPage - 1;
                        setHistoryPage(next);
                        fetchHistory(detailWarehouse.id, { page: next });
                      }}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={historyPage >= historyTotalPages}
                      onClick={() => {
                        if (!detailWarehouse) return;
                        const next = historyPage + 1;
                        setHistoryPage(next);
                        fetchHistory(detailWarehouse.id, { page: next });
                      }}
                    >
                      Berikutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-[#6B7280]">
                {historySearch || historyBulan
                  ? 'Tidak ada aktivitas yang cocok dengan filter.'
                  : 'Belum ada aktivitas di gudang ini. Stok masuk, stok keluar, dan proses sosoh akan tercatat di sini.'}
              </p>
              {(historySearch || historyBulan) && (
                <button
                  onClick={() => detailWarehouse && handleHistoryFilter(detailWarehouse.id, { search: '', bulan: '' })}
                  className="mt-2 text-xs font-bold text-[#2C4219] hover:underline cursor-pointer"
                >
                  Reset filter
                </button>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Trace Lengkap Batch (tanam → panen → gudang → olahan → logistik) */}
      <Modal
        isOpen={!!traceData || traceLoading}
        onClose={() => setTraceData(null)}
        title={traceData ? `Riwayat Lengkap — ${traceData.batch.kodeBatchStok}` : 'Riwayat Lengkap Batch'}
        maxWidth="5xl"
      >
        {traceLoading ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">
            <span className="inline-block w-5 h-5 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
            Memuat riwayat batch...
          </div>
        ) : traceData ? (
          <div className="p-4 sm:p-7 space-y-5">
            {/* Garis waktu: Tanam → Panen → Masuk Gudang → Olahan → Logistik */}
            {/* 1. TANAM */}
            {traceData.tanam && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 rounded-full bg-[#2C4219] text-[#C3E28D] flex items-center justify-center shrink-0"><Sprout className="w-4 h-4" /></span>
                  <span className="w-px flex-1 bg-[#c4c8bb]/40 my-1" />
                </div>
                <div className="pb-4 min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase">Penanaman</p>
                  <p className="text-sm font-bold text-[#172C05]">{traceData.tanam.kodeTanam} — {traceData.lahan?.namaLahan || '-'}</p>
                  <p className="text-xs text-[#6B7280]">Tanam: {traceData.tanam.tanggalTanam ? formatDateTimeId(traceData.tanam.tanggalTanam) : '-'} • Petugas: {traceData.tanam.petugas || '-'}</p>
                  {traceData.tanam.estimasiPanen && <p className="text-[11px] text-[#6B7280]">Estimasi panen: {formatDateTimeId(traceData.tanam.estimasiPanen)}</p>}
                </div>
              </div>
            )}

            {/* 2. PANEN */}
            {traceData.panen && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 rounded-full bg-[#2C4219]/15 text-[#2C4219] flex items-center justify-center shrink-0"><Package className="w-4 h-4" /></span>
                  {traceData.tanam && <span className="w-px flex-1 bg-[#c4c8bb]/40 my-1" />}
                </div>
                <div className="pb-4 min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase">Panen</p>
                  <p className="text-sm font-bold text-[#172C05]">{traceData.panen.kodePanen} — {traceData.panen.namaLahan || '-'}</p>
                  <p className="text-xs text-[#6B7280]">
                    Panen: {traceData.panen.tanggalPanen ? formatDateTimeId(traceData.panen.tanggalPanen) : '-'} • Varietas {traceData.panen.varietas || '-'}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Hasil {formatBerat(traceData.panen.jumlahHasilKg)} • PJ {traceData.panen.petaniPenanggungJawab || '-'}
                  </p>
                  {traceData.panen.periodeHari != null && <p className="text-[11px] text-[#9CA3AF]">Periode tanam–panen: {traceData.panen.periodeHari} hari</p>}
                </div>
              </div>
            )}

            {/* 2b. DARI GABAH — bila batch ini SORGUM hasil sosoh */}
            {traceData.batch.jenis === 'SORGUM' && traceData.batch.asalBatch && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 rounded-full bg-[#DEB938]/20 text-[#8C6D1F] flex items-center justify-center shrink-0"><ArrowLeftRight className="w-4 h-4" /></span>
                  <span className="w-px flex-1 bg-[#c4c8bb]/40 my-1" />
                </div>
                <div className="pb-4 min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase">Dari Gabah (Sosoh)</p>
                  <p className="text-sm font-bold text-[#172C05]">
                    {traceData.batch.asalBatch.kodeBatchStok} → {traceData.batch.kodeBatchStok}
                  </p>
                  {traceData.batch.sosoh && (
                    <p className="text-xs text-[#6B7280]">
                      {formatBerat(traceData.batch.sosoh.kgGabahDipakai)} gabah disosoh → {formatBerat(traceData.batch.sosoh.kgSorgumHasil)} sorgum
                      <span className="text-[#8C6D1F] font-semibold"> • rendemen {traceData.batch.sosoh.rendemenPersen}%</span>
                    </p>
                  )}
                  <p className="text-[11px] text-[#9CA3AF]">
                    {traceData.batch.tanggalSosoh ? `Sosoh: ${formatDateTimeId(traceData.batch.tanggalSosoh)}` : traceData.batch.asalBatch.tanggalMasuk ? `Masuk gabah: ${formatDateTimeId(traceData.batch.asalBatch.tanggalMasuk)}` : ''}
                    {traceData.batch.sosoh?.operator ? ` • Operator: ${traceData.batch.sosoh.operator}` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* 3. MASUK GUDANG */}
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="w-8 h-8 rounded-full bg-[#8C9E5B] text-white flex items-center justify-center shrink-0"><ArrowDownToLine className="w-4 h-4" /></span>
                <span className="w-px flex-1 bg-[#c4c8bb]/40 my-1" />
              </div>
              <div className="pb-4 min-w-0 flex-1">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase">Masuk Gudang</p>
                <p className="text-sm font-bold text-[#172C05]">{traceData.batch.kodeBatchStok} → {traceData.gudang.namaGudang}</p>
                <p className="text-xs text-[#6B7280]">
                  Masuk {formatDateTimeId(traceData.batch.tanggalMasuk)} • Masuk {formatBerat(traceData.batch.jumlahMasukKg)} • Sisa {formatBerat(traceData.batch.sisaKg)}
                </p>
              </div>
            </div>

            {/* 4. KELUAR → OLAHAN */}
            {traceData.produksi.length > 0 && (
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 rounded-full bg-[#DEB938] text-white flex items-center justify-center shrink-0"><Sprout className="w-4 h-4" /></span>
                  {traceData.produksi.length > 0 && <span className="w-px flex-1 bg-[#c4c8bb]/40 my-1" />}
                </div>
                <div className="pb-4 min-w-0 flex-1 space-y-2">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase">Dipakai untuk Olahan</p>
                  {traceData.produksi.map((p) => (
                    <div key={p.id} className="p-3 bg-[#FFF8F4] rounded-lg border border-[#c4c8bb]/20">
                      <p className="text-sm font-bold text-[#172C05]">{p.kodeBatch} — {p.namaProduk}</p>
                      <p className="text-[11px] text-[#6B7280]">
                        Produksi: {formatDateTimeId(p.tanggalProduksi)}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">
                        Hasil {Number(p.jumlahHasil).toLocaleString('id-ID')} {p.satuan} • Bahan {p.bahanDigunakan != null ? `${p.bahanDigunakan} kg` : '-'} • PJ {p.operatorProduksi || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. LOGISTIK */}
            {traceData.logistik.length > 0 && (
              <div className="flex gap-3">
                <div className="flex items-start">
                  <span className="w-8 h-8 rounded-full bg-[#6B7280]/20 text-[#6B7280] flex items-center justify-center shrink-0"><History className="w-4 h-4" /></span>
                </div>
                <div className="pb-2 min-w-0 flex-1 space-y-1.5">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase">Logistik / Keuangan Terkait</p>
                  {traceData.logistik.slice(0, 4).map((lg) => (
                    <div key={lg.id} className="p-2.5 bg-white rounded-lg border border-[#c4c8bb]/20 text-xs">
                      <p className="font-bold text-[#172C05]">{lg.kodeTransaksi} — {lg.keteranganVendor || '-'}</p>
                      <p className="text-[11px] text-[#6B7280]">{lg.kategori} • {formatDateTimeId(lg.tanggal)} • Rp {Number(lg.totalBiayaRp).toLocaleString('id-ID')} • {lg.statusPembayaran}</p>
                    </div>
                  ))}
                  {traceData.logistik.length > 4 && <p className="text-[11px] text-[#9CA3AF]">…dan {traceData.logistik.length - 4} transaksi lainnya</p>}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Modal QR Batch */}
      <Modal
        isOpen={!!qrTarget}
        onClose={() => setQrTarget(null)}
        title="QR Code Batch Stok"
        subtitle={qrTarget ? qrTarget.kodeBatchStok : ''}
        maxWidth="xl"
      >
        {qrTarget && detailWarehouse && (() => {
          const url = `${window.location.origin}/trace/${qrTarget.kodeBatchStok}`;
          const isSorgum = qrTarget.jenis === 'SORGUM';
          const namaLahan = detailWarehouse.lahan?.namaLahan || 'Lahan terkait';
          const kodeLahan = detailWarehouse.lahan?.kodeLahan || '';
          const lokasiDesa = detailWarehouse.lahan?.lokasiDesa || '';
          const penanggungJawab = detailWarehouse.lahan?.pemilikKelompokTani || '-';
          const varietas = (qrTarget.harvest?.varietas && qrTarget.harvest.varietas.trim()) || '-';
          const lokasiLengkap = [namaLahan, kodeLahan, lokasiDesa].filter(Boolean).join(' • ');
          return (
            <div className="p-4 sm:p-6">
              {/* Kartu label bersih: header + QR + info */}
              <div className="rounded-2xl border border-[#c4c8bb]/25 bg-white shadow-sm overflow-hidden">
                {/* Header kode batch */}
                <div className="px-4 sm:px-5 py-3.5 bg-[#2C4219] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-[#C3E28D] font-bold">Kode Batch</p>
                    <p className="text-white font-black text-base sm:text-lg truncate leading-tight mt-0.5">{qrTarget.kodeBatchStok}</p>
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                      isSorgum ? 'bg-[#C3E28D] text-[#2C4219]' : 'bg-[#fff1e5] text-[#8C5A2B]'
                    }`}
                  >
                    {isSorgum ? 'Sorgum Sosoh' : 'Gabah'}
                  </span>
                </div>

                {/* Badan: QR + info utama */}
                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-[210px_1fr] gap-5 sm:gap-7 items-center">
                  <div className="justify-self-center bg-[#F7F7F5] p-3 rounded-xl border border-[#c4c8bb]/20">
                    <QRCodeCanvas
                      id="qr-canvas-batch"
                      value={url}
                      size={180}
                      level="M"
                      includeMargin
                      fgColor="#172C05"
                      bgColor="#ffffff"
                    />
                  </div>
                  <div className="w-full min-w-0 divide-y divide-[#c4c8bb]/15 text-sm">
                    {[
                      { label: 'Lahan', value: lokasiLengkap, icon: <Sprout className="w-4 h-4 text-[#2C4219]" /> },
                      { label: 'Penanggung Jawab', value: penanggungJawab, icon: <User className="w-4 h-4 text-[#8C5A2B]" /> },
                      { label: 'Varietas', value: varietas, icon: <Package className="w-4 h-4 text-[#8C5A2B]" /> },
                      {
                        label: 'Gudang',
                        value: `${detailWarehouse.namaGudang}${detailWarehouse.kodeGudang ? ` (${detailWarehouse.kodeGudang})` : ''}`,
                        icon: <WarehouseIcon className="w-4 h-4 text-[#6B7280]" />,
                      },
                    ].map((r) => (
                      <div key={r.label} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <span className="mt-0.5 shrink-0">{r.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF]">{r.label}</p>
                          <p className="text-sm font-semibold text-[#172C05] leading-relaxed break-words whitespace-normal">{r.value || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Aksi & hint singkat */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-[#9CA3AF] text-center sm:text-left">
                  Pindai QR untuk riwayat lengkap batch ini.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="justify-center sm:mx-0"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => {
                    const canvas = document.querySelector('#qr-canvas-batch') as HTMLCanvasElement | null;
                    if (!canvas) return;
                    const a = document.createElement('a');
                    a.href = canvas.toDataURL('image/png');
                    a.download = `QR-${qrTarget.kodeBatchStok}.png`;
                    a.click();
                  }}
                >
                  Unduh QR (PNG)
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal Proses Sosoh (GABAH → SORGUM) */}
      <Modal
        isOpen={!!sosohTarget}
        onClose={() => setSosohTarget(null)}
        title="Proses Sosoh Gabah"
        subtitle={sosohTarget ? `${sosohTarget.kodeBatchStok} • sisa ${formatBerat(sosohTarget.sisaKg)}` : ''}
        maxWidth="lg"
      >
        {sosohTarget && (
          <form onSubmit={handleSosohSubmit} className="p-3 sm:p-6 space-y-4">
            <p className="text-xs text-[#6B7280] bg-[#F7F7F5] rounded-lg p-2.5">
              Sosoh adalah proses mengupas kulit gabah hingga menjadi biji sorgum bersih.
              Masukkan berapa kg gabah yang dipakai & berapa kg sorgum yang dihasilkan.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Gabah Disosoh (kg) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={0}
                max={sosohTarget.sisaKg}
                step="0.1"
                value={sosohForm.kgGabah}
                onChange={(e) => setSosohForm({ ...sosohForm, kgGabah: e.target.value })}
                placeholder={`Maksimal ${sosohTarget.sisaKg} kg (sisa batch)`}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Hasil Sorgum (kg) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={sosohForm.kgHasil}
                onChange={(e) => setSosohForm({ ...sosohForm, kgHasil: e.target.value })}
                placeholder="Contoh: 45 (biasanya lebih kecil dari gabah)"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
              {(() => {
                const g = Number(sosohForm.kgGabah);
                const h = Number(sosohForm.kgHasil);
                if (g > 0 && h > 0) {
                  const rendemen = Math.round((h / g) * 1000) / 10;
                  return (
                    <p className="text-[11px] mt-1 font-semibold text-[#2C4219]">
                      Rendemen: {rendemen}% {h > g && <span className="text-red-500">(hasil tidak boleh lebih dari gabah)</span>}
                    </p>
                  );
                }
                return null;
              })()}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Operator / Petugas</label>
              <input
                value={sosohForm.operator}
                onChange={(e) => setSosohForm({ ...sosohForm, operator: e.target.value })}
                placeholder="Contoh: Ibu Sri (Unit Sosoh)"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setSosohTarget(null)} className="flex-1 justify-center">Batal</Button>
              <Button type="submit" variant="primary" loading={sosohSubmitting} className="flex-1 justify-center" icon={<ArrowLeftRight className="w-3.5 h-3.5" />}>
                Proses Sosoh
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Gudang">
        <div className="p-3 sm:p-6">
          <p className="text-sm text-[#221A12]">
            Yakin ingin menghapus gudang <b>{deleteTarget?.namaGudang}</b>?<br />
            <span className="text-xs text-[#6B7280]">Gudang yang masih punya stok tidak bisa dihapus.</span>
          </p>
          <div className="flex gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 justify-center">Batal</Button>
            <Button type="button" variant="danger" onClick={confirmDelete} className="flex-1 justify-center">Ya, Hapus</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
