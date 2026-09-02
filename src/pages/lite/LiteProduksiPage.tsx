import React, { useEffect, useState, useCallback } from 'react';
import {
  Factory,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
  Sprout,
  MapPin,
  User,
  Eye,
  Edit3,
  Calendar,
  Package,
  Soup,
} from 'lucide-react';
import { LITE_CSS, QC_STATUS_COLOR, formatTanggalId as liteFormatTanggal } from './liteDesign';
import { productionApi } from '../../api/endpoints/productionApi';
import { landApi } from '../../api/endpoints/landApi';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { warehouseApi } from '../../api/endpoints/warehouseApi';
import { ProductionBatch, LandPlot, HarvestRecord, Warehouse } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { nextCode } from '../../utils/kodeGenerator';

// ── Helpers ─────────────────────────────────────────────────────────────────
const QC_COLORS: Record<string, string> = {
  'Lolos QC': 'bg-green-100 text-green-700',
  'Pending QC': 'bg-amber-100 text-amber-700',
  'Revisi Batch': 'bg-red-100 text-red-600',
};

function formatTanggalId(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getUTCDate()} ${namaBulan[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const DEFAULT_FORM = {
  kodeBatch: '',
  namaProduk: '',
  kategori: 'Ready to Eat (Siap Konsumsi)' as ProductionBatch['kategori'],
  tanggalProduksi: new Date().toISOString().slice(0, 10),
  tanggalKadaluarsa: '',
  jumlahHasil: '',
  satuan: 'Pouch',
  bahanDigunakan: '',
  satuanBahan: 'Kg',
  nomorBatchBahanBaku: '',
  gudangId: '',
  lahanId: '',
  harvestId: '',
  operatorProduksi: '',
  statusQC: 'Pending QC' as ProductionBatch['statusQC'],
  lokasiGudang: '',
  fotoUrl: '',
};

export const LiteProduksiPage: React.FC = () => {
  const [dataList, setDataList] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('Semua');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<ProductionBatch | null>(null);
  const [editTarget, setEditTarget] = useState<ProductionBatch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductionBatch | null>(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);

  // Supporting dropdown data
  const [lands, setLands] = useState<LandPlot[]>([]);
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productionApi.getAll({
        page,
        limit,
        search: searchTerm,
        kategori: activeCategoryTab === 'Semua' ? undefined : activeCategoryTab,
      });
      setDataList(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setDataList([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, activeCategoryTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load supporting options
  useEffect(() => {
    landApi.getAll({ limit: 500 }).then((r) => setLands(r.data || [])).catch(() => {});
    harvestApi.getAll({ limit: 500 }).then((r) => setHarvests(r.data || [])).catch(() => {});
    warehouseApi.getAll({ limit: 500 }).then((r) => setWarehouses((r.data as Warehouse[]) || [])).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setFormData({
      ...DEFAULT_FORM,
      kodeBatch: nextCode('PROD', dataList, 4),
    });
    setModalOpen(true);
  };

  const openEdit = (item: ProductionBatch) => {
    setEditTarget(item);
    setFormData({
      kodeBatch: item.kodeBatch || '',
      namaProduk: item.namaProduk || '',
      kategori: item.kategori,
      tanggalProduksi: item.tanggalProduksi?.split('T')[0] || '',
      tanggalKadaluarsa: item.tanggalKadaluarsa?.split('T')[0] || '',
      jumlahHasil: item.jumlahHasil ? String(item.jumlahHasil) : '',
      satuan: item.satuan || 'Pouch',
      bahanDigunakan: item.bahanDigunakan != null ? String(item.bahanDigunakan) : '',
      satuanBahan: item.satuanBahan || 'Kg',
      nomorBatchBahanBaku: item.nomorBatchBahanBaku || '',
      gudangId: (item as any).gudangId || '',
      lahanId: (item as any).lahanId || '',
      harvestId: (item as any).harvestId || '',
      operatorProduksi: item.operatorProduksi || '',
      statusQC: item.statusQC,
      lokasiGudang: item.lokasiGudang || '',
      fotoUrl: item.fotoUrl || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.namaProduk || !formData.tanggalProduksi) {
      setToast({ msg: 'Mohon isi Nama Produk dan Tanggal Produksi.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<ProductionBatch> = {
        ...formData,
        jumlahHasil: Number(formData.jumlahHasil) || 0,
        bahanDigunakan: formData.bahanDigunakan ? Number(formData.bahanDigunakan) : null,
        gudangId: formData.gudangId || null,
        harvestId: formData.harvestId || null,
        fotoUrl: formData.fotoUrl || undefined,
        kodeBatch: editTarget ? editTarget.kodeBatch : formData.kodeBatch || nextCode('PROD', dataList, 4),
      };
      if (editTarget) {
        await productionApi.update(editTarget.id, payload);
        setToast({ msg: 'Data olahan berhasil diperbarui!', type: 'success' });
      } else {
        await productionApi.create(payload);
        setToast({ msg: 'Batch produksi berhasil ditambahkan!', type: 'success' });
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan data.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await productionApi.delete(deleteTarget.id);
      setToast({ msg: 'Data olahan berhasil dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch {
      setToast({ msg: 'Gagal menghapus data.', type: 'error' });
    }
  };

  // Filter panen berdasarkan lahanId yang dipilih
  const panenTerkait = harvests.filter(
    (h) => !formData.lahanId || String(h.lahanId) === String(formData.lahanId)
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={LITE_CSS.pageTitle}>
            <Soup className="w-7 h-7 text-[#2C4219]" /> Kelola Olahan
          </h1>
        </div>
        <button
          onClick={openAdd}
          className={LITE_CSS.btnPrimary + ' shrink-0'}
        >
          <Plus className="w-5 h-5" /> Tambah Batch Olahan
        </button>
      </div>

      {/* Filter Kategori Tab Switcher (Flex Wrap Responsif — Efektif Tanpa Scroll di HP) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {['Semua', 'Ready to Eat (Siap Konsumsi)', 'Raw (Bahan Mentah)', 'Lainnya'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveCategoryTab(tab);
              setPage(1);
            }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategoryTab === tab
                ? 'bg-[#2C4219] text-white shadow-xs'
                : 'bg-white text-[#4A5043] border border-[#ECE7DF] hover:bg-[#F4EFEB]'
            }`}
          >
            {tab === 'Ready to Eat (Siap Konsumsi)'
              ? 'Siap Konsumsi'
              : tab === 'Raw (Bahan Mentah)'
              ? 'Bahan Mentah'
              : tab}
          </button>
        ))}
      </div>

      {/* Input Cari */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E988F]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder="Cari kode batch, nama produk olahan..."
          className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#ECE7DF] rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 shadow-2xs"
        />
      </div>

      {/* List Olahan */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-[#ECE7DF] animate-pulse" />
          ))}
        </div>
      ) : dataList.length === 0 ? (
        <div className={LITE_CSS.emptyState}>
          <Soup className="w-14 h-14 text-[#C3E28D] mx-auto mb-3" />
          <p className="text-lg font-bold text-[#172C05]">Belum ada data olahan</p>
          <p className="text-sm text-[#70766B] mt-1">Mulai catat batch produksi produk olahan sorgum baru</p>
          <button
            onClick={openAdd}
            className={LITE_CSS.btnPrimary + ' mt-4'}
          >
            <Plus className="w-4 h-4" /> Tambah Batch Olahan
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {dataList.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-[#ECE7DF] p-5 sm:p-6 shadow-[0_4px_20px_rgba(44,66,25,0.03)] hover:shadow-[0_8px_30px_rgba(44,66,25,0.06)] hover:border-[#D9D2C5] transition-all space-y-3.5">
              <div className="flex items-start gap-4">
                {item.fotoUrl ? (
                  <img
                    src={item.fotoUrl}
                    alt={item.namaProduk}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-[#C3E28D]/40 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EDE7F6] border border-[#D1C4E9] flex items-center justify-center shrink-0 text-[#512DA8]">
                    <Soup className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-1.5 mb-1">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-[#172C05] leading-tight">{item.namaProduk}</h3>
                      <p className="text-xs text-[#8A9084] font-semibold mt-0.5">{item.kodeBatch || 'PROD'} • {item.kategori}</p>
                    </div>
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full shrink-0 ${QC_STATUS_COLOR[item.statusQC] || 'bg-gray-100 text-gray-700'}`}>
                      {item.statusQC}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-[#5F6658] mt-2.5 bg-[#FAF8F4] p-3 rounded-2xl border border-[#ECE7DF]">
                    <div>
                      <span className="text-[10px] text-[#9E988F] uppercase font-bold block">Hasil Olahan</span>
                      <span className="font-extrabold text-[#2C4219]">{item.jumlahHasil?.toLocaleString('id-ID')} {item.satuan}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9E988F] uppercase font-bold block">Bahan Digunakan</span>
                      <span className="font-bold text-[#172C05]">{item.bahanDigunakan ? `${item.bahanDigunakan} ${item.satuanBahan || 'Kg'}` : '-'}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-[#9E988F] uppercase font-bold block">Tanggal Produksi</span>
                      <span className="font-bold text-[#172C05]">{liteFormatTanggal(item.tanggalProduksi)}</span>
                    </div>
                  </div>

                  {(item as any).harvest && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#2C4219] font-medium bg-[#EBF7EE] p-2.5 rounded-xl border border-[#C8E6C9]/60">
                      <Sprout className="w-4 h-4 text-[#1B5E20] shrink-0" />
                      <span className="truncate">Asal Panen: <strong>{(item as any).harvest.kodePanen}</strong> ({(item as any).lahan?.namaLahan || (item as any).harvest.namaLahan || '-'})</span>
                    </div>
                  )}

                  {item.operatorProduksi && (
                    <p className="text-xs text-[#70766B] mt-2 flex items-center gap-1 font-medium">
                      <User className="w-3.5 h-3.5 text-[#9E988F]" /> Operator: <span className="font-bold text-[#172C05]">{item.operatorProduksi}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Aksi */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#ECE7DF]">
                <button
                  onClick={() => setDetailTarget(item)}
                  className={LITE_CSS.actionDetail}
                >
                  <Eye className="w-4 h-4" /> Detail
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className={LITE_CSS.actionEdit}
                >
                  <Edit3 className="w-4 h-4" /> Edit Olahan
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className={LITE_CSS.actionDelete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[#6B7280]">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2.5 rounded-xl bg-white border border-[#c4c8bb]/30 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2.5 rounded-xl bg-white border border-[#c4c8bb]/30 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Form Tambah / Edit Batch Olahan */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Batch Olahan' : 'Tambah Batch Olahan Baru'}
        subtitle="Isi rincian produk olahan dan asal bahan baku"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Kode Batch Olahan</label>
              <input
                type="text"
                value={formData.kodeBatch}
                readOnly
                disabled
                className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm font-bold text-[#2C4219] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Kategori Produk</label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData((f) => ({ ...f, kategori: e.target.value as ProductionBatch['kategori'] }))}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
              >
                <option value="Ready to Eat (Siap Konsumsi)">Siap Konsumsi (Ready to Eat)</option>
                <option value="Raw (Bahan Mentah)">Bahan Mentah (Raw)</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Nama Produk Olahan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.namaProduk}
              onChange={(e) => setFormData((f) => ({ ...f, namaProduk: e.target.value }))}
              placeholder="Contoh: Tepung Sorgum Bioguma 500g"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Jumlah Hasil</label>
              <input
                type="number"
                value={formData.jumlahHasil}
                onChange={(e) => setFormData((f) => ({ ...f, jumlahHasil: e.target.value }))}
                placeholder="Contoh: 100"
                min="0"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Satuan Hasil</label>
              <select
                value={formData.satuan}
                onChange={(e) => setFormData((f) => ({ ...f, satuan: e.target.value }))}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
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

          {/* Section Bahan Baku */}
          <div className="p-3.5 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-2xl space-y-3">
            <label className="block text-xs font-bold text-[#2C4219] uppercase">Bahan yang Digunakan</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Jumlah Bahan</label>
                <input
                  type="number"
                  value={formData.bahanDigunakan}
                  onChange={(e) => setFormData((f) => ({ ...f, bahanDigunakan: e.target.value }))}
                  placeholder="Contoh: 50"
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Satuan Bahan</label>
                <select
                  value={formData.satuanBahan}
                  onChange={(e) => setFormData((f) => ({ ...f, satuanBahan: e.target.value }))}
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
                >
                  <option value="Kg">Kg</option>
                  <option value="Gram">Gram</option>
                  <option value="Liter">Liter</option>
                  <option value="Botol">Botol</option>
                  <option value="Karung">Karung</option>
                  <option value="Sak">Sak</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Gudang Asal Bahan</label>
              <select
                value={formData.gudangId}
                onChange={(e) => {
                  const val = e.target.value;
                  const selectedW = warehouses.find((w) => String(w.id) === val);
                  setFormData((f) => ({
                    ...f,
                    gudangId: val,
                    lokasiGudang: selectedW ? selectedW.namaGudang : f.lokasiGudang,
                  }));
                }}
                className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
              >
                <option value="">-- Pilih Gudang (Opsional) --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.namaGudang} ({w.totalStokKg || 0} Kg Tersedia)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section Asal Panen */}
          <div className="p-3.5 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-2xl space-y-3">
            <label className="block text-xs font-bold text-[#2C4219] uppercase">Asal Panen (Traceability)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Lokasi Lahan</label>
                <select
                  value={formData.lahanId}
                  onChange={(e) => setFormData((f) => ({ ...f, lahanId: e.target.value, harvestId: '' }))}
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
                >
                  <option value="">-- Pilih Lahan --</option>
                  {lands.map((l) => (
                    <option key={l.id} value={l.id}>{l.namaLahan} ({l.lokasiDesa})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Catatan Panen Terkait</label>
                <select
                  value={formData.harvestId}
                  onChange={(e) => setFormData((f) => ({ ...f, harvestId: e.target.value }))}
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
                >
                  <option value="">-- Pilih Hasil Panen --</option>
                  {panenTerkait.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.kodePanen} • {formatTanggalId(h.tanggalPanen)} • {h.varietas}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Tanggal Produksi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.tanggalProduksi}
                onChange={(e) => setFormData((f) => ({ ...f, tanggalProduksi: e.target.value }))}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Tanggal Kedaluwarsa</label>
              <input
                type="date"
                value={formData.tanggalKadaluarsa}
                onChange={(e) => setFormData((f) => ({ ...f, tanggalKadaluarsa: e.target.value }))}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Penanggung Jawab Produksi</label>
              <input
                type="text"
                value={formData.operatorProduksi}
                onChange={(e) => setFormData((f) => ({ ...f, operatorProduksi: e.target.value }))}
                placeholder="Nama operator / KWT"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Status QC</label>
              <select
                value={formData.statusQC}
                onChange={(e) => setFormData((f) => ({ ...f, statusQC: e.target.value as ProductionBatch['statusQC'] }))}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
              >
                <option value="Pending QC">Pending QC</option>
                <option value="Lolos QC">Lolos QC</option>
                <option value="Revisi Batch">Revisi Batch</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Nomor Batch Bahan Baku (opsional)</label>
            <input
              type="text"
              value={formData.nomorBatchBahanBaku}
              onChange={(e) => setFormData((f) => ({ ...f, nomorBatchBahanBaku: e.target.value }))}
              placeholder="Contoh: BB-PANEN-001"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Lokasi Gudang Penyimpanan</label>
            <input
              type="text"
              value={formData.lokasiGudang}
              onChange={(e) => setFormData((f) => ({ ...f, lokasiGudang: e.target.value }))}
              placeholder="Contoh: Gudang Olahan - Rak A"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
            />
          </div>

          {/* Upload Foto */}
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Foto Olahan / Produk (opsional)</label>
            {formData.fotoUrl ? (
              <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-[#c4c8bb]/30 group">
                <img src={formData.fotoUrl} alt="Foto produk olahan" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, fotoUrl: '' }))}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#c4c8bb]/60 rounded-2xl bg-[#fff1e5] hover:bg-[#C3E28D]/20 cursor-pointer transition-colors">
                <Camera className="w-6 h-6 text-[#2C4219] mb-1" />
                <span className="text-xs font-bold text-[#2C4219]">Ketuk untuk Upload Foto Produk</span>
                <span className="text-[10px] text-[#6B7280]">Format JPG, PNG, WebP (Maks 2MB)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      setToast({ msg: 'Ukuran foto maksimal 2MB', type: 'error' });
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => setFormData((f) => ({ ...f, fotoUrl: ev.target?.result as string }));
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2 border-t border-[#c4c8bb]/20">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-2xl text-xs font-bold text-[#44483e] bg-[#F7F7F5] border border-[#c4c8bb]/30 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-2xl text-xs font-bold bg-[#2C4219] text-white cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Simpan Batch Olahan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Detail Olahan */}
      <Modal
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.namaProduk || 'Detail Olahan'}
        subtitle={detailTarget?.kodeBatch || 'Batch Produksi'}
        maxWidth="lg"
      >
        {detailTarget && (
          <div className="space-y-4">
            {detailTarget.fotoUrl && (
              <div className="w-full h-40 rounded-2xl overflow-hidden border border-[#c4c8bb]/20">
                <img src={detailTarget.fotoUrl} alt="Foto produk" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'KODE BATCH', value: detailTarget.kodeBatch || '-' },
                { label: 'NAMA PRODUK', value: detailTarget.namaProduk },
                { label: 'KATEGORI', value: detailTarget.kategori || '-' },
                { label: 'TGL PRODUKSI', value: liteFormatTanggal(detailTarget.tanggalProduksi) },
                { label: 'JUMLAH HASIL', value: `${detailTarget.jumlahHasil?.toLocaleString('id-ID')} ${detailTarget.satuan}`, highlight: true },
                { label: 'STATUS QC', value: detailTarget.statusQC },
                { label: 'BAHAN DIGUNAKAN', value: detailTarget.bahanDigunakan ? `${detailTarget.bahanDigunakan} ${detailTarget.satuanBahan || 'Kg'}` : '-' },
                { label: 'OPERATOR', value: detailTarget.operatorProduksi || '-' },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="bg-[#fff8f4] p-3 rounded-xl border border-[#c4c8bb]/20">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-bold block">{label}</span>
                  <span className={`text-sm font-bold mt-0.5 block ${highlight ? 'text-[#2C4219]' : 'text-[#172C05]'}`}>{value}</span>
                </div>
              ))}
            </div>

            {(detailTarget as any).harvest && (
              <div className="bg-white p-3.5 rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] text-[#9CA3AF] uppercase font-bold block mb-1">ASAL BAHAN BAKU (PANEN)</span>
                <p className="text-sm font-bold text-[#2C4219]">
                  {(detailTarget as any).harvest.kodePanen} — {(detailTarget as any).lahan?.namaLahan || (detailTarget as any).harvest.namaLahan || '-'}
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Varietas: {(detailTarget as any).harvest.varietas || '-'} • Panen: {liteFormatTanggal((detailTarget as any).harvest.tanggalPanen)}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-[#c4c8bb]/20">
              <button onClick={() => setDetailTarget(null)} className={LITE_CSS.btnSecondary + ' flex-1'}>Tutup</button>
              <button onClick={() => { openEdit(detailTarget); setDetailTarget(null); }} className={LITE_CSS.btnPrimary + ' flex-1'}>
                <Edit3 className="w-4 h-4" /> Edit Olahan
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Hapus */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Data Olahan?" subtitle="Tindakan ini tidak bisa dibatalkan">
        <div className="space-y-5">
          <p className="text-base text-[#44483e]">Yakin ingin menghapus batch <strong>{deleteTarget?.namaProduk}</strong>?</p>
          <div className="flex gap-3 pt-2 border-t border-[#c4c8bb]/20">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl text-xs font-bold text-[#44483e] bg-[#F7F7F5] border border-[#c4c8bb]/30 cursor-pointer">Batal</button>
            <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl text-xs font-bold bg-red-600 text-white cursor-pointer">Ya, Hapus</button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
