import React, { useEffect, useState, useCallback } from 'react';
import {
  Sprout,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Camera,
  X,
  Eye,
  Edit3,
  MapPin,
  User,
  Scale,
  Calendar,
} from 'lucide-react';
import { LITE_CSS, PANEN_STATUS_COLOR, formatBerat as liteFormatBerat, formatTanggalId as liteFormatTanggal } from './liteDesign';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { landApi } from '../../api/endpoints/landApi';
import { varietyApi, Variety } from '../../api/endpoints/varietyApi';
import { HarvestRecord, LandPlot } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { nextCode } from '../../utils/kodeGenerator';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatBerat(kg: number): string {
  if (kg >= 1000) {
    const ton = kg / 1000;
    return `${ton % 1 === 0 ? ton : parseFloat(ton.toFixed(2))} Ton`;
  }
  return `${kg.toLocaleString('id-ID')} Kg`;
}

function formatTanggalId(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getUTCDate()} ${namaBulan[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const STATUS_COLORS: Record<string, string> = {
  'Selesai': 'bg-green-100 text-green-700',
  'Tersimpan di Gudang': 'bg-blue-100 text-blue-700',
  'Dalam Proses': 'bg-amber-100 text-amber-700',
  'Siap Panen': 'bg-purple-100 text-purple-700',
};

const GRADE_COLORS: Record<string, string> = {
  'Grade A (Premium)': 'bg-[#C3E28D] text-[#172C05]',
  'Grade B (Standar)': 'bg-amber-100 text-amber-700',
  'Grade C (Pakan)': 'bg-gray-100 text-gray-600',
};

const DEFAULT_FORM = {
  kodePanen: '',
  namaLahan: '',
  lahanId: '',
  varietas: '',
  tanggalPanen: new Date().toISOString().split('T')[0],
  jumlahHasilKg: '',
  kualitasGrade: 'Grade A (Premium)' as HarvestRecord['kualitasGrade'],
  petaniPenanggungJawab: '',
  status: 'Dalam Proses' as HarvestRecord['status'],
  catatan: '',
  fotoUrl: '',
};

export const LitePanenPage: React.FC = () => {
  const [dataList, setDataList] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HarvestRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HarvestRecord | null>(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);

  // Supporting data
  const [lands, setLands] = useState<LandPlot[]>([]);
  const [varieties, setVarieties] = useState<Variety[]>([]);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await harvestApi.getAll({ page, limit, search: searchTerm });
      setDataList(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setDataList([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    landApi.getAll({ limit: 500 }).then((r) => setLands(r.data || [])).catch(() => {});
    varietyApi.getAll().then((r) => setVarieties(r.data || [])).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setFormData({
      ...DEFAULT_FORM,
      kodePanen: nextCode('PN', dataList, 3),
      tanggalPanen: new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const openEdit = (item: HarvestRecord) => {
    setEditTarget(item);
    setFormData({
      kodePanen: item.kodePanen || '',
      namaLahan: item.namaLahan || '',
      lahanId: item.lahanId || '',
      varietas: item.varietas || '',
      tanggalPanen: item.tanggalPanen?.split('T')[0] || '',
      jumlahHasilKg: item.jumlahHasilKg ? String(item.jumlahHasilKg) : '',
      kualitasGrade: item.kualitasGrade,
      petaniPenanggungJawab: item.petaniPenanggungJawab || '',
      status: item.status,
      catatan: item.catatan || '',
      fotoUrl: item.fotoUrl || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.namaLahan || !formData.tanggalPanen || !formData.jumlahHasilKg) {
      setToast({ msg: 'Mohon isi Nama Lahan, Tanggal, dan Jumlah Hasil.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<HarvestRecord> = {
        ...formData,
        jumlahHasilKg: Number(formData.jumlahHasilKg),
        lahanId: formData.lahanId || null,
        fotoUrl: formData.fotoUrl || undefined,
        kodePanen: editTarget
          ? editTarget.kodePanen
          : nextCode('PN', dataList, 3),
      };
      if (editTarget) {
        await harvestApi.update(editTarget.id, payload);
        setToast({ msg: 'Data panen berhasil diperbarui!', type: 'success' });
      } else {
        await harvestApi.create(payload);
        setToast({ msg: 'Data panen berhasil ditambahkan!', type: 'success' });
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
      await harvestApi.delete(deleteTarget.id);
      setToast({ msg: 'Data panen berhasil dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch {
      setToast({ msg: 'Gagal menghapus data.', type: 'error' });
    }
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleLahanChange = (id: string) => {
    const found = lands.find((l) => l.id === id);
    setFormData((f) => ({
      ...f,
      lahanId: id,
      namaLahan: found ? found.namaLahan : f.namaLahan,
    }));
  };

  const [detailTarget, setDetailTarget] = useState<typeof dataList[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const STATUS_FILTER_OPTS = ['', 'Siap Panen', 'Dalam Proses', 'Selesai', 'Tersimpan di Gudang'];
  const STATUS_FILTER_LABELS: Record<string, string> = {
    '': 'Semua',
    'Siap Panen': 'Siap Panen',
    'Dalam Proses': 'Sedang Proses',
    'Selesai': 'Selesai',
    'Tersimpan di Gudang': 'Di Gudang',
  };

  const filteredList = filterStatus ? dataList.filter(h => h.status === filterStatus) : dataList;

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={LITE_CSS.pageTitle}>
            <Sprout className="w-6 h-6 text-[#2C4219]" /> Data Panen
          </h1>
        </div>
        <button onClick={openAdd} className={LITE_CSS.btnPrimary + ' shrink-0'}>
          <Plus className="w-4.5 h-4.5" /> Catat Panen Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Cari nama lahan atau varietas panen..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#c4c8bb]/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 shadow-sm"
        />
      </div>

      {/* Filter Status Pill (Flex Wrap Responsif — Efektif Tanpa Scroll di HP) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {STATUS_FILTER_OPTS.map((s) => {
          const count = s === ''
            ? dataList.length
            : dataList.filter((h) => h.status === s).length;

          return (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === s
                  ? 'bg-[#2C4219] text-white shadow-xs'
                  : 'bg-white text-[#4A5043] border border-[#ECE7DF] hover:bg-[#F4EFEB]'
              }`}
            >
              <span>{STATUS_FILTER_LABELS[s]}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                  filterStatus === s
                    ? 'bg-white/20 text-white'
                    : 'bg-[#F4EFEB] text-[#6E7368]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List Panen */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-white rounded-2xl border border-[#c4c8bb]/20 animate-pulse" />)}
        </div>
      ) : filteredList.length === 0 ? (
        <div className={LITE_CSS.emptyState}>
          <Sprout className="w-14 h-14 text-[#C3E28D] mx-auto mb-3" />
          <p className="text-lg font-bold text-[#6B7280]">
            {filterStatus ? `Tidak ada panen dengan status "${filterStatus}"` : 'Belum ada catatan panen'}
          </p>
          {!filterStatus && (
            <button onClick={openAdd} className={LITE_CSS.btnPrimary + ' mt-4'}>
              <Plus className="w-4 h-4" /> Catat Panen Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredList.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-[#ECE7DF] p-5 sm:p-6 shadow-[0_4px_20px_rgba(44,66,25,0.03)] hover:shadow-[0_8px_30px_rgba(44,66,25,0.06)] hover:border-[#D9D2C5] transition-all">
              <div className="flex items-start gap-4">
                {item.fotoUrl ? (
                  <img src={item.fotoUrl} alt={item.namaLahan} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-[#C3E28D]/40 shrink-0" />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EBF7EE] border border-[#C8E6C9] flex items-center justify-center shrink-0 text-[#1B5E20]">
                    <Sprout className="w-8 h-8" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-1.5 mb-1.5">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-[#172C05] leading-tight">{item.namaLahan || 'Lahan Tanpa Nama'}</h3>
                      <p className="text-xs text-[#8A9084] font-semibold mt-0.5">{item.kodePanen || '-'}</p>
                    </div>
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full shrink-0 ${PANEN_STATUS_COLOR[item.status] || 'bg-gray-100 text-gray-700'}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm text-[#5F6658] mt-2 bg-[#FAF8F4] p-3 rounded-2xl border border-[#ECE7DF]">
                    <div>
                      <span className="text-[10px] text-[#9E988F] uppercase font-bold block">Tanggal Panen</span>
                      <span className="font-bold text-[#172C05]">{liteFormatTanggal(item.tanggalPanen)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9E988F] uppercase font-bold block">Hasil Panen</span>
                      <span className="font-extrabold text-[#2C4219]">{liteFormatBerat(item.jumlahHasilKg)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9E988F] uppercase font-bold block">Varietas</span>
                      <span className="font-bold text-[#172C05]">{item.varietas || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#9E988F] uppercase font-bold block">Mutu / Grade</span>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${GRADE_COLORS[item.kualitasGrade] || 'bg-gray-100 text-gray-700'}`}>
                        {item.kualitasGrade}
                      </span>
                    </div>
                  </div>

                  {item.petaniPenanggungJawab && (
                    <p className="text-xs text-[#70766B] mt-2 flex items-center gap-1 font-medium">
                      <User className="w-3.5 h-3.5 text-[#9E988F]" /> Petani: <span className="font-bold text-[#172C05]">{item.petaniPenanggungJawab}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Aksi Konsisten */}
              <div className="flex items-center gap-2 mt-4 pt-3.5 border-t border-[#ECE7DF]">
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
                  <Edit3 className="w-4 h-4" /> Edit Panen
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

      {/* Modal Detail Panen */}
      <Modal
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.namaLahan || 'Detail Panen'}
        subtitle={detailTarget?.kodePanen || 'Data Panen'}
        maxWidth="lg"
      >
        {detailTarget && (
          <div className="space-y-4">
            {detailTarget.fotoUrl && (
              <div className="w-full h-40 rounded-2xl overflow-hidden border border-[#c4c8bb]/20">
                <img src={detailTarget.fotoUrl} alt="Foto panen" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'NAMA LAHAN', value: detailTarget.namaLahan || '-' },
                { label: 'TANGGAL PANEN', value: liteFormatTanggal(detailTarget.tanggalPanen) },
                { label: 'HASIL PANEN', value: liteFormatBerat(detailTarget.jumlahHasilKg), highlight: true },
                { label: 'MUTU / GRADE', value: detailTarget.kualitasGrade || '-' },
                { label: 'VARIETAS', value: detailTarget.varietas || '-' },
                { label: 'STATUS', value: detailTarget.status },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="bg-[#fff8f4] p-3 rounded-xl border border-[#c4c8bb]/20">
                  <span className="text-[10px] text-[#9CA3AF] uppercase font-bold block">{label}</span>
                  <span className={`text-sm font-bold mt-0.5 block ${highlight ? 'text-[#2C4219]' : 'text-[#172C05]'}`}>{value}</span>
                </div>
              ))}
            </div>
            {detailTarget.petaniPenanggungJawab && (
              <div className="bg-white p-3 rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] text-[#9CA3AF] uppercase font-bold block">PETANI PENANGGUNG JAWAB</span>
                <span className="text-sm font-bold text-[#172C05] mt-0.5 block">{detailTarget.petaniPenanggungJawab}</span>
              </div>
            )}
            {detailTarget.catatan && (
              <div className="bg-white p-3 rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] text-[#9CA3AF] uppercase font-bold block mb-1">CATATAN</span>
                <p className="text-sm text-[#44483e] leading-relaxed">{detailTarget.catatan}</p>
              </div>
            )}
            <div className="flex gap-3 pt-2 border-t border-[#c4c8bb]/20">
              <button onClick={() => setDetailTarget(null)} className={LITE_CSS.btnSecondary + ' flex-1'}>Tutup</button>
              <button onClick={() => { openEdit(detailTarget); setDetailTarget(null); }} className={LITE_CSS.btnPrimary + ' flex-1'}>
                <Edit3 className="w-4 h-4" /> Edit Panen
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-[#6B7280]">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2.5 rounded-xl bg-white border border-[#c4c8bb]/30 text-[#44483e] disabled:opacity-40 hover:bg-[#F7F7F5] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2.5 rounded-xl bg-white border border-[#c4c8bb]/30 text-[#44483e] disabled:opacity-40 hover:bg-[#F7F7F5] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Data Panen' : 'Tambah Data Panen'}
        subtitle="Isi informasi hasil panen dengan lengkap"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Kode Panen */}
          <div>
            <label className="block text-sm font-bold text-[#172C05] mb-1.5">
              Kode Panen
            </label>
            <input
              type="text"
              value={formData.kodePanen}
              readOnly
              disabled
              className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm font-bold text-[#2C4219] cursor-not-allowed"
            />
          </div>

          {/* Pilih Lahan */}
          <div>
            <label className="block text-sm font-bold text-[#172C05] mb-1.5">
              Pilih Lahan
            </label>
            <select
              value={formData.lahanId}
              onChange={(e) => handleLahanChange(e.target.value)}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
            >
              <option value="">-- Pilih lahan (opsional) --</option>
              {lands.map((l) => (
                <option key={l.id} value={l.id}>{l.namaLahan} - {l.lokasiDesa}</option>
              ))}
            </select>
          </div>

          {/* Nama Lahan (manual jika tidak pilih dari list) */}
          <div>
            <label className="block text-sm font-bold text-[#172C05] mb-1.5">
              Nama Lahan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.namaLahan}
              onChange={(e) => setFormData((f) => ({ ...f, namaLahan: e.target.value }))}
              placeholder="Contoh: Blok A - Cisarua"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
            />
          </div>

          {/* Varietas */}
          <div>
            <label className="block text-sm font-bold text-[#172C05] mb-1.5">Varietas</label>
            <select
              value={formData.varietas}
              onChange={(e) => setFormData((f) => ({ ...f, varietas: e.target.value }))}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
            >
              <option value="">-- Pilih varietas --</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Tanggal Panen */}
          <div>
            <label className="block text-sm font-bold text-[#172C05] mb-1.5">
              Tanggal Panen <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggalPanen}
              onChange={(e) => setFormData((f) => ({ ...f, tanggalPanen: e.target.value }))}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
            />
          </div>

          {/* Jumlah Hasil */}
          <div>
            <label className="block text-sm font-bold text-[#172C05] mb-1.5">
              Jumlah Hasil (Kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.jumlahHasilKg}
              onChange={(e) => setFormData((f) => ({ ...f, jumlahHasilKg: e.target.value }))}
              placeholder="Contoh: 5000"
              min="0"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mutu / Grade */}
            <div>
              <label className="block text-sm font-bold text-[#172C05] mb-1.5">Mutu</label>
              <select
                value={formData.kualitasGrade}
                onChange={(e) => setFormData((f) => ({ ...f, kualitasGrade: e.target.value as HarvestRecord['kualitasGrade'] }))}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
              >
                <option value="Grade A (Premium)">Grade A (Premium)</option>
                <option value="Grade B (Standar)">Grade B (Standar)</option>
                <option value="Grade C (Pakan)">Grade C (Pakan)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-bold text-[#172C05] mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value as HarvestRecord['status'] }))}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
              >
                <option value="Siap Panen">Siap Panen</option>
                <option value="Dalam Proses">Dalam Proses</option>
                <option value="Selesai">Selesai</option>
                <option value="Tersimpan di Gudang">Tersimpan di Gudang</option>
              </select>
            </div>
          </div>

          {/* Petani */}
          <div>
            <label className="block text-sm font-bold text-[#172C05] mb-1.5">Petani Penanggung Jawab</label>
            <input
              type="text"
              value={formData.petaniPenanggungJawab}
              onChange={(e) => setFormData((f) => ({ ...f, petaniPenanggungJawab: e.target.value }))}
              placeholder="Contoh: Ibu Sari"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
            />
          </div>

          {/* Upload Foto */}
          <div>
            <label className="block text-sm font-bold text-[#172C05] mb-1.5">Foto Panen (opsional)</label>
            {formData.fotoUrl ? (
              <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-[#c4c8bb]/30 group">
                <img src={formData.fotoUrl} alt="Foto panen" className="w-full h-full object-cover" />
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
                <span className="text-xs font-bold text-[#2C4219]">Ketuk untuk Upload Foto Panen</span>
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

          {/* Catatan */}
          <div>
            <label className="block text-sm font-bold text-[#172C05] mb-1.5">Catatan (opsional)</label>
            <textarea
              value={formData.catatan}
              onChange={(e) => setFormData((f) => ({ ...f, catatan: e.target.value }))}
              rows={3}
              placeholder="Catatan tambahan..."
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 resize-none"
            />
          </div>

          {/* Tombol */}
          <div className="flex gap-3 pt-2 border-t border-[#c4c8bb]/20">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-[#44483e] bg-[#F7F7F5] hover:bg-[#efe0d2] border border-[#c4c8bb]/30 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-2xl text-sm font-bold bg-[#2C4219] hover:bg-[#172C05] text-white shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Simpan Panen'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Hapus */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Data Panen?"
        subtitle="Tindakan ini tidak bisa dibatalkan"
      >
        <div className="space-y-5">
          <p className="text-base text-[#44483e]">
            Yakin ingin menghapus data panen dari <strong>{deleteTarget?.namaLahan}</strong>?
          </p>
          <div className="flex gap-3 pt-2 border-t border-[#c4c8bb]/20">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-[#44483e] bg-[#F7F7F5] hover:bg-[#efe0d2] border border-[#c4c8bb]/30 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 rounded-2xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
