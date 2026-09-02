import React, { useEffect, useState, useCallback } from 'react';
import {
  Tractor,
  Plus,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Camera,
  Eye,
  Edit3,
  Sprout,
  User,
  Ruler,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Map,
  History,
  Layers,
  Filter,
  Sun,
} from 'lucide-react';
import { landApi } from '../../api/endpoints/landApi';
import { varietyApi, Variety } from '../../api/endpoints/varietyApi';
import { plantingApi } from '../../api/endpoints/plantingApi';
import { LandPlot, Planting } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import MapPicker, { MapLocation } from '../../components/MapPicker';
import MapView from '../../components/MapView';
import { nextCode } from '../../utils/kodeGenerator';
import { formatTanggalId, LITE_CSS } from './liteDesign';

const DEFAULT_FORM = {
  kodeLahan: '',
  namaLahan: '',
  lokasiDesa: '',
  kecamatan: '',
  luasHektar: '',
  varietasSorgum: '',
  statusIrigasi: 'Tadah Hujan' as LandPlot['statusIrigasi'],
  pemilikKelompokTani: '',
  statusKesiapan: 'Siap Tanam' as LandPlot['statusKesiapan'],
  jumlahLubang: '',
  panenLaluTon: '',
  fotoUrl: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
};

const DEFAULT_PLANTING_FORM = {
  tanggalTanam: new Date().toISOString().slice(0, 10),
  estimasiPanen: '',
  varietas: '',
  jumlahLubang: '',
  petugas: '',
  statusTanam: 'Ditanam',
  catatan: '',
};

export const LiteLahanPage: React.FC = () => {
  const [dataList, setDataList] = useState<LandPlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'semua' | 'ditanami' | 'kosong'>('semua');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LandPlot | null>(null);
  const [detailTarget, setDetailTarget] = useState<LandPlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LandPlot | null>(null);

  // Map Picker State inside form
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Planting modal state
  const [tanamModalOpen, setTanamModalOpen] = useState(false);
  const [tanamTarget, setTanamTarget] = useState<LandPlot | null>(null);
  const [plantingForm, setPlantingForm] = useState({ ...DEFAULT_PLANTING_FORM });
  const [plantingSaving, setPlantingSaving] = useState(false);
  const [landPlantingsHistory, setLandPlantingsHistory] = useState<Planting[]>([]);

  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);

  // Supporting master data
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [allPlantings, setAllPlantings] = useState<Planting[]>([]);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await landApi.getAll({ page, limit, search: searchTerm });
      setDataList(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setDataList([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load supporting varieties & plantings
  useEffect(() => {
    varietyApi.getAll().then((r) => setVarieties(r.data || [])).catch(() => {});
    plantingApi.getAll({ limit: 1000 }).then((r) => setAllPlantings(r.data || [])).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setShowMapPicker(false);
    setFormData({
      ...DEFAULT_FORM,
      kodeLahan: nextCode('BLK-', dataList, 3),
    });
    setModalOpen(true);
  };

  const openEdit = (item: LandPlot) => {
    setEditTarget(item);
    setShowMapPicker(false);
    setFormData({
      kodeLahan: item.kodeLahan || '',
      namaLahan: item.namaLahan || '',
      lokasiDesa: item.lokasiDesa || '',
      kecamatan: item.kecamatan || '',
      luasHektar: item.luasHektar ? String(item.luasHektar) : '',
      varietasSorgum: item.varietasSorgum || '',
      statusIrigasi: item.statusIrigasi,
      pemilikKelompokTani: item.pemilikKelompokTani || '',
      statusKesiapan: item.statusKesiapan,
      jumlahLubang: item.jumlahLubang ? String(item.jumlahLubang) : '',
      panenLaluTon: item.panenLaluTon ? String(item.panenLaluTon) : '',
      fotoUrl: item.fotoUrl || '',
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setModalOpen(true);
  };

  const openTanam = (item: LandPlot) => {
    setTanamTarget(item);
    setPlantingForm({
      ...DEFAULT_PLANTING_FORM,
      varietas: item.varietasSorgum || (varieties[0]?.name || 'Numbu'),
      jumlahLubang: item.jumlahLubang ? String(item.jumlahLubang) : '',
    });
    // Fetch history for this land
    plantingApi.getAll({ lahanId: item.id, limit: 50 }).then((r) => setLandPlantingsHistory(r.data || [])).catch(() => setLandPlantingsHistory([]));
    setTanamModalOpen(true);
  };

  const openDetail = (item: LandPlot) => {
    setDetailTarget(item);
    plantingApi.getAll({ lahanId: item.id, limit: 50 }).then((r) => setLandPlantingsHistory(r.data || [])).catch(() => setLandPlantingsHistory([]));
  };

  const handleSave = async () => {
    if (!formData.namaLahan || !formData.lokasiDesa) {
      setToast({ msg: 'Mohon isi Nama Lahan dan Lokasi Desa.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<LandPlot> = {
        ...formData,
        luasHektar: Number(formData.luasHektar) || 0,
        panenLaluTon: formData.panenLaluTon ? Number(formData.panenLaluTon) : undefined,
        jumlahLubang: formData.jumlahLubang ? Number(formData.jumlahLubang) : undefined,
        fotoUrl: formData.fotoUrl || undefined,
        kodeLahan: editTarget ? editTarget.kodeLahan : formData.kodeLahan || nextCode('BLK-', dataList, 3),
        latitude: formData.latitude,
        longitude: formData.longitude,
      };
      if (editTarget) {
        await landApi.update(editTarget.id, payload);
        setToast({ msg: 'Data lahan berhasil diperbarui!', type: 'success' });
      } else {
        await landApi.create(payload);
        setToast({ msg: 'Lahan baru berhasil ditambahkan!', type: 'success' });
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan data.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlanting = async () => {
    if (!tanamTarget || !plantingForm.tanggalTanam || !plantingForm.varietas) {
      setToast({ msg: 'Mohon isi Tanggal Tanam dan Varietas.', type: 'error' });
      return;
    }
    setPlantingSaving(true);
    try {
      await plantingApi.create({
        lahanId: tanamTarget.id,
        tanggalTanam: plantingForm.tanggalTanam,
        estimasiPanen: plantingForm.estimasiPanen || undefined,
        varietas: plantingForm.varietas,
        jumlahLubang: Number(plantingForm.jumlahLubang) || 0,
        petugas: plantingForm.petugas || undefined,
        statusTanam: 'Ditanam',
        catatan: plantingForm.catatan || undefined,
      });
      setToast({ msg: `Berhasil mencatat penanaman baru di ${tanamTarget.namaLahan}!`, type: 'success' });
      setTanamModalOpen(false);
      plantingApi.getAll({ limit: 1000 }).then((r) => setAllPlantings(r.data || [])).catch(() => {});
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal mencatat penanaman.', type: 'error' });
    } finally {
      setPlantingSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await landApi.delete(deleteTarget.id);
      setToast({ msg: 'Data lahan berhasil dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch {
      setToast({ msg: 'Gagal menghapus data lahan.', type: 'error' });
    }
  };

  // Metrics
  const totalHektar = dataList.reduce((acc, curr) => acc + (curr.luasHektar || 0), 0);
  const totalBlok = total;

  // Planting status counts
  const ditanamiList = dataList.filter((item) => {
    return allPlantings.some(
      (p) => String(p.lahanId) === String(item.id) && ['Ditanam', 'Tumbuh', 'Siap Panen'].includes(p.statusTanam)
    );
  });
  const ditanamiCount = ditanamiList.length;
  const kosongCount = Math.max(0, totalBlok - ditanamiCount);

  // Filter list by tab
  const filteredDataList = dataList.filter((item) => {
    const isPlanted = allPlantings.some(
      (p) => String(p.lahanId) === String(item.id) && ['Ditanam', 'Tumbuh', 'Siap Panen'].includes(p.statusTanam)
    );
    if (filterTab === 'ditanami') return isPlanted;
    if (filterTab === 'kosong') return !isPlanted;
    return true;
  });

  // Derived planting status for land
  const getLandPlantingInfo = (lahanId: string) => {
    const activePlanting = allPlantings.find(
      (p) => String(p.lahanId) === String(lahanId) && ['Ditanam', 'Tumbuh', 'Siap Panen'].includes(p.statusTanam)
    );
    if (activePlanting) {
      return {
        isPlanted: true,
        label: '🌱 Sedang Ditanami Sorgum',
        badgeClass: 'bg-[#EBF7EE] text-[#1B5E20] border border-[#C8E6C9]',
        activePlanting,
      };
    }
    return {
      isPlanted: false,
      label: '☀️ Lahan Kosong (Siap Tanam)',
      badgeClass: 'bg-[#FFF8E1] text-[#B78103] border border-[#FFE082]',
      activePlanting: null,
    };
  };

  return (
    <div className="space-y-6 pb-10">
      {/* ── 1. Header Standar Lite Mode Sub-page ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={LITE_CSS.pageTitle}>
            <Tractor className="w-6.5 h-6.5 text-[#2C4219]" /> Kelola Lahan Pertanian
          </h1>
        </div>
        <button
          onClick={openAdd}
          className={LITE_CSS.btnPrimary + ' shrink-0'}
        >
          <Plus className="w-5 h-5" /> Tambah Lahan Baru
        </button>
      </div>

      {/* ── 2. Top 3 Summary Metric Cards (Sleek Botanical Cards) ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Total Lahan Tani */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-4.5 sm:p-5 border border-[#ECE7DF] shadow-[0_4px_20px_rgba(44,66,25,0.04)] hover:shadow-[0_8px_30px_rgba(44,66,25,0.08)] hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2C4219] to-[#65A60B]" />
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF7EE] text-[#1B5E20] border border-[#C8E6C9] ring-4 ring-[#EBF7EE]/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Tractor className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[#70766B] uppercase tracking-wider">Total Lahan Tani</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-[#172C05] leading-none tracking-tight">{totalBlok}</span>
                <span className="text-xs font-extrabold text-[#1B5E20] bg-[#EBF7EE] px-2.5 py-1 rounded-xl border border-[#C8E6C9]">
                  Blok Lahan
                </span>
              </div>
              <p className="text-[11px] text-[#8A9084] font-medium mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" /> Kelompok Tani & KWT Mitra
              </p>
            </div>
          </div>
        </div>

        {/* Stat 2: Total Luas Area */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-4.5 sm:p-5 border border-[#ECE7DF] shadow-[0_4px_20px_rgba(44,66,25,0.04)] hover:shadow-[0_8px_30px_rgba(44,66,25,0.08)] hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1565C0] to-[#64B5F6]" />
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E3F2FD] text-[#1565C0] border border-[#BBDEFB] ring-4 ring-[#E3F2FD]/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Ruler className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[#70766B] uppercase tracking-wider">Total Luas Area</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-[#172C05] leading-none tracking-tight">{totalHektar.toLocaleString('id-ID')}</span>
                <span className="text-xs font-extrabold text-[#1565C0] bg-[#E3F2FD] px-2.5 py-1 rounded-xl border border-[#BBDEFB]">
                  Hektar
                </span>
              </div>
              <p className="text-[11px] text-[#8A9084] font-medium mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1565C0] animate-pulse" /> Tersebar di wilayah binaan
              </p>
            </div>
          </div>
        </div>

        {/* Stat 3: Lahan Sedang Ditanami */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-4.5 sm:p-5 border border-[#ECE7DF] shadow-[0_4px_20px_rgba(44,66,25,0.04)] hover:shadow-[0_8px_30px_rgba(44,66,25,0.08)] hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B78103] to-[#F57C00]" />
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF8E1] text-[#B78103] border border-[#FFE082] ring-4 ring-[#FFF8E1]/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-[#70766B] uppercase tracking-wider">Lahan Sedang Ditanami</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-[#172C05] leading-none tracking-tight">{ditanamiCount}</span>
                <span className="text-xs font-extrabold text-[#B78103] bg-[#FFF8E1] px-2.5 py-1 rounded-xl border border-[#FFE082]">
                  Lahan Ditanami
                </span>
              </div>
              <p className="text-[11px] text-[#8A9084] font-medium mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B78103] animate-pulse" /> {kosongCount > 0 ? `${kosongCount} lahan sedang kosong` : 'Semua lahan aktif ditanami'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Filter Status Tabs & Search Bar ──────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F4EFEB] p-1.5 rounded-2xl border border-[#ECE7DF]">
            <button
              onClick={() => setFilterTab('semua')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'semua'
                  ? 'bg-white text-[#172C05] shadow-xs'
                  : 'text-[#70766B] hover:text-[#2D3328]'
              }`}
            >
              Semua Lahan ({totalBlok})
            </button>
            <button
              onClick={() => setFilterTab('ditanami')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'ditanami'
                  ? 'bg-[#EBF7EE] text-[#1B5E20] border border-[#C8E6C9] shadow-xs'
                  : 'text-[#70766B] hover:text-[#2D3328]'
              }`}
            >
              🌱 Sedang Ditanami ({ditanamiCount})
            </button>
            <button
              onClick={() => setFilterTab('kosong')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'kosong'
                  ? 'bg-[#FFF8E1] text-[#B78103] border border-[#FFE082] shadow-xs'
                  : 'text-[#70766B] hover:text-[#2D3328]'
              }`}
            >
              ☀️ Siap Tanam ({kosongCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E988F]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearchTerm(searchInput);
                  setPage(1);
                }
              }}
              placeholder="Cari lahan atau desa..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#ECE7DF] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2C4219]/20 shadow-2xs transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Visual Story Cards (Lahan Pertanian) ─────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-[#ECE7DF] animate-pulse" />
          ))}
        </div>
      ) : filteredDataList.length === 0 ? (
        <div className={LITE_CSS.emptyState}>
          <Tractor className="w-14 h-14 text-[#C3E28D] mx-auto mb-2" />
          <p className="text-base font-bold text-[#172C05]">Belum ada data lahan yang sesuai</p>
          <p className="text-xs text-[#70766B] mt-0.5">Coba ubah filter atau kata kunci pencarian Anda</p>
          <button onClick={openAdd} className={LITE_CSS.btnPrimary + ' mt-4'}>
            <Plus className="w-4 h-4" /> Tambah Lahan Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDataList.map((item) => {
            const info = getLandPlantingInfo(item.id);
            const plant = info.activePlanting;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#ECE7DF] shadow-[0_4px_24px_rgba(44,66,25,0.04)] hover:shadow-[0_8px_32px_rgba(44,66,25,0.08)] hover:border-[#D9D2C5] transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Visual Banner Photo + Status Floating Badges */}
                <div className="relative h-40 sm:h-44 bg-[#F4EFEB] overflow-hidden">
                  {item.fotoUrl ? (
                    <img
                      src={item.fotoUrl}
                      alt={item.namaLahan}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#EBF7EE] to-[#FFF8E1] flex flex-col items-center justify-center text-[#2C4219]/60 p-4">
                      <Tractor className="w-12 h-12 mb-1" />
                      <span className="text-xs font-bold text-[#2C4219]">{item.namaLahan}</span>
                    </div>
                  )}

                  {/* Gradient Overlay for Readable Text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                  {/* Top Floating Badge 1: Status */}
                  <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md shadow-sm ${info.badgeClass}`}>
                    {info.label}
                  </span>

                  {/* Top Floating Badge 2: Luas Hektar */}
                  <span className="absolute top-3 right-3 text-xs font-black px-3 py-1 rounded-full bg-black/60 text-white backdrop-blur-md">
                    📐 {item.luasHektar} Hektar
                  </span>

                  {/* Overlay Bottom Title inside Image */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-lg font-black tracking-tight leading-snug drop-shadow-sm">{item.namaLahan}</h3>
                    <p className="text-xs text-white/90 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C3E28D]" />
                      <span>{item.lokasiDesa}{item.kecamatan ? `, ${item.kecamatan}` : ''}</span>
                    </p>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Manager & Irrigation Info */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-[#5F6658] gap-2 pt-1">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#8A9084]" />
                      <span>Pengelola: <strong className="text-[#172C05]">{item.pemilikKelompokTani || 'KWT Mitra'}</strong></span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#F5F5F3] border border-[#E0E0E0] text-[11px] font-semibold text-[#616161]">
                      {item.statusIrigasi}
                    </span>
                  </div>

                  {/* Active Planting Spotlight Box (Jika Ditanami) */}
                  {plant ? (
                    <div className="p-3 rounded-2xl bg-[#EBF7EE] border border-[#C8E6C9] space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1B5E20] flex items-center gap-1.5">
                          <Sprout className="w-4 h-4 text-[#2E7D32]" /> Tanaman Saat Ini:
                        </span>
                        <span className="font-black text-[#172C05] bg-white px-2 py-0.5 rounded-md border border-[#C8E6C9]">
                          {plant.varietas || 'Sorgum'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#2E7D32] pt-1">
                        <span>📅 Tanam: <b>{formatTanggalId(plant.tanggalTanam)}</b></span>
                        {plant.estimasiPanen && (
                          <span>⌛ Panen: <b>{formatTanggalId(plant.estimasiPanen)}</b></span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[#FFF8E1] border border-[#FFE082] text-xs text-[#B78103] flex items-center justify-between">
                      <span className="font-medium flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#B78103]" /> Lahan sedang kosong dan siap ditanami benih baru.
                      </span>
                    </div>
                  )}

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-[#ECE7DF] flex items-center gap-2">
                    {/* Primary Button: Catat Tanam */}
                    <button
                      onClick={() => openTanam(item)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#2C4219] hover:bg-[#1C2E10] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-98"
                    >
                      <Sprout className="w-4 h-4 text-[#C3E28D]" />
                      <span>{plant ? 'Kelola Tanam' : '+ Catat Tanam'}</span>
                    </button>

                    {/* Button 2: Detail & Peta */}
                    <button
                      onClick={() => openDetail(item)}
                      className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Lihat Detail & Peta Lahan"
                    >
                      <Map className="w-4 h-4" />
                      <span className="hidden sm:inline">Detail & Peta</span>
                    </button>

                    {/* Button 3: Edit */}
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                      title="Ubah Data Lahan"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Button 4: Delete */}
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
                      title="Hapus Lahan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. Pagination ──────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[#70766B]">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-xl bg-white border border-[#ECE7DF] text-[#44483e] disabled:opacity-40 hover:bg-[#F4EFEB] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-xl bg-white border border-[#ECE7DF] text-[#44483e] disabled:opacity-40 hover:bg-[#F4EFEB] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL 1: Detail Lahan & Interactive Map View ────────────────── */}
      <Modal
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={`Detail Lahan: ${detailTarget?.namaLahan}`}
        subtitle={`Informasi Lengkap, Peta Lokasi, & Riwayat Penanaman`}
        maxWidth="lg"
      >
        {detailTarget && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Photo Cover Header */}
            {detailTarget.fotoUrl ? (
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-[#ECE7DF] relative">
                <img src={detailTarget.fotoUrl} alt={detailTarget.namaLahan} className="w-full h-full object-cover" />
              </div>
            ) : null}

            {/* Spec Box */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#FFF8F2] p-4 rounded-2xl border border-[#E4DDD2]">
              <div>
                <span className="text-[#8A9084] block text-[10px] font-bold uppercase">KODE BLOK</span>
                <strong className="text-sm font-bold text-[#172C05]">{detailTarget.kodeLahan || '-'}</strong>
              </div>
              <div>
                <span className="text-[#8A9084] block text-[10px] font-bold uppercase">LUAS LAHAN</span>
                <strong className="text-sm font-bold text-[#2C4219]">{detailTarget.luasHektar} Hektar</strong>
              </div>
              <div>
                <span className="text-[#8A9084] block text-[10px] font-bold uppercase">DESA & KECAMATAN</span>
                <strong className="text-sm font-bold text-[#172C05]">{detailTarget.lokasiDesa}{detailTarget.kecamatan ? `, ${detailTarget.kecamatan}` : ''}</strong>
              </div>
              <div>
                <span className="text-[#8A9084] block text-[10px] font-bold uppercase">VARIETAS UTAMA</span>
                <strong className="text-sm font-bold text-[#172C05]">{detailTarget.varietasSorgum || '-'}</strong>
              </div>
              <div>
                <span className="text-[#8A9084] block text-[10px] font-bold uppercase">IRIGASI</span>
                <strong className="text-sm font-bold text-[#172C05]">{detailTarget.statusIrigasi}</strong>
              </div>
              <div>
                <span className="text-[#8A9084] block text-[10px] font-bold uppercase">PENGELOLA KWT</span>
                <strong className="text-sm font-bold text-[#172C05]">{detailTarget.pemilikKelompokTani || '-'}</strong>
              </div>
            </div>

            {/* Peta Lokasi Lahan (Google Maps / MapView) */}
            {detailTarget.latitude && detailTarget.longitude ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#172C05] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-red-600" /> Peta Lokasi Sawah:
                </label>
                <div className="rounded-2xl overflow-hidden border border-[#ECE7DF] shadow-xs">
                  <MapView
                    latitude={Number(detailTarget.latitude)}
                    longitude={Number(detailTarget.longitude)}
                    height="200px"
                    label={detailTarget.namaLahan}
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-[#F5F5F3] text-xs text-[#616161] flex items-center justify-between border border-[#E0E0E0]">
                <span>📍 Koordinat peta belum diset untuk lahan ini.</span>
                <button
                  onClick={() => {
                    setDetailTarget(null);
                    openEdit(detailTarget);
                  }}
                  className="text-xs font-bold text-[#2C4219] underline"
                >
                  + Tambah Lokasi Peta
                </button>
              </div>
            )}

            {/* Riwayat Penanaman */}
            <div className="space-y-2 pt-2 border-t border-[#ECE7DF]">
              <h4 className="text-xs font-bold text-[#172C05] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#2C4219]" /> Riwayat Penanaman ({landPlantingsHistory.length}):
              </h4>
              {landPlantingsHistory.length === 0 ? (
                <p className="text-xs text-[#8A9084] italic">Belum ada riwayat penanaman tercatat.</p>
              ) : (
                <div className="space-y-2">
                  {landPlantingsHistory.map((p) => (
                    <div key={p.id} className="p-3 bg-white rounded-xl border border-[#ECE7DF] text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#172C05]">{p.varietas} — {p.statusTanam}</p>
                        <p className="text-[11px] text-[#70766B]">
                          Tanam: {formatTanggalId(p.tanggalTanam)} {p.estimasiPanen ? `· Est. Panen: ${formatTanggalId(p.estimasiPanen)}` : ''}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#EBF7EE] text-[#1B5E20] text-[10px] font-bold">
                        {p.statusTanam}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-[#ECE7DF]">
              <button
                onClick={() => setDetailTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#2D3328] bg-[#F5EFE9] border border-[#E0D7CB] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── MODAL 2: Form Catat Penanaman Baru ─────────────────────────── */}
      <Modal
        isOpen={tanamModalOpen}
        onClose={() => setTanamModalOpen(false)}
        title={`Catat Penanaman Sorgum`}
        subtitle={`Lahan: ${tanamTarget?.namaLahan || '-'}`}
        maxWidth="lg"
      >
        <div className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Tanggal Tanam <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={plantingForm.tanggalTanam}
                onChange={(e) => setPlantingForm((f) => ({ ...f, tanggalTanam: e.target.value }))}
                className={LITE_CSS.input}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Estimasi Panen</label>
              <input
                type="date"
                value={plantingForm.estimasiPanen}
                onChange={(e) => setPlantingForm((f) => ({ ...f, estimasiPanen: e.target.value }))}
                className={LITE_CSS.input}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Varietas Benih <span className="text-red-500">*</span></label>
              <select
                value={plantingForm.varietas}
                onChange={(e) => setPlantingForm((f) => ({ ...f, varietas: e.target.value }))}
                className={LITE_CSS.select}
              >
                {varieties.map((v) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Jumlah Lubang Tanam</label>
              <input
                type="number"
                value={plantingForm.jumlahLubang}
                onChange={(e) => setPlantingForm((f) => ({ ...f, jumlahLubang: e.target.value }))}
                placeholder="Contoh: 1000"
                className={LITE_CSS.input}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Petugas / Pengelola Tanam</label>
            <input
              type="text"
              value={plantingForm.petugas}
              onChange={(e) => setPlantingForm((f) => ({ ...f, petugas: e.target.value }))}
              placeholder="Contoh: Ibu Sari Dewi"
              className={LITE_CSS.input}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Catatan Penanaman (opsional)</label>
            <textarea
              value={plantingForm.catatan}
              onChange={(e) => setPlantingForm((f) => ({ ...f, catatan: e.target.value }))}
              rows={2}
              placeholder="Catatan benih atau kondisi tanah..."
              className={LITE_CSS.textarea}
            />
          </div>

          {/* Riwayat Sebelumnya di Modal Tanam */}
          {landPlantingsHistory.length > 0 && (
            <div className="pt-2 border-t border-[#ECE7DF] space-y-1.5">
              <label className="block text-xs font-bold text-[#172C05]">Riwayat Penanaman Lahan Ini:</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {landPlantingsHistory.map((h) => (
                  <div key={h.id} className="p-2 bg-[#FFF8F2] rounded-xl border border-[#E4DDD2] text-[11px] flex justify-between">
                    <span><b>{h.varietas}</b> ({formatTanggalId(h.tanggalTanam)})</span>
                    <span className="font-bold text-[#2C4219]">{h.statusTanam}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-2 border-t border-[#ECE7DF]">
            <button
              onClick={() => setTanamModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#2D3328] bg-[#F5EFE9] border border-[#E0D7CB] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSavePlanting}
              disabled={plantingSaving}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#2C4219] text-white hover:bg-[#1C2E10] cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {plantingSaving ? 'Menyimpan...' : 'Simpan Penanaman'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL 3: Form Tambah / Edit Lahan (Lengkap Dengan MapPicker) ─ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Data Lahan' : 'Tambah Lahan Baru'}
        subtitle="Isi informasi lahan pertanian sorgum"
        maxWidth="lg"
      >
        <div className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Nama Lahan / Blok <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.namaLahan}
              onChange={(e) => setFormData((f) => ({ ...f, namaLahan: e.target.value }))}
              placeholder="Contoh: Lahan Ibu Sari - Blok A"
              className={LITE_CSS.input}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Lokasi Desa <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.lokasiDesa}
                onChange={(e) => setFormData((f) => ({ ...f, lokasiDesa: e.target.value }))}
                placeholder="Contoh: Desa Jatibarang"
                className={LITE_CSS.input}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Kecamatan</label>
              <input
                type="text"
                value={formData.kecamatan}
                onChange={(e) => setFormData((f) => ({ ...f, kecamatan: e.target.value }))}
                placeholder="Contoh: Indramayu"
                className={LITE_CSS.input}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Luas Lahan (Hektar)</label>
              <input
                type="number"
                step="0.1"
                value={formData.luasHektar}
                onChange={(e) => setFormData((f) => ({ ...f, luasHektar: e.target.value }))}
                placeholder="Contoh: 2.5"
                className={LITE_CSS.input}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Pengelola / Ketua KWT</label>
              <input
                type="text"
                value={formData.pemilikKelompokTani}
                onChange={(e) => setFormData((f) => ({ ...f, pemilikKelompokTani: e.target.value }))}
                placeholder="Contoh: KWT Indramayu Sorgum"
                className={LITE_CSS.input}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Varietas Sorgum Utama</label>
              <select
                value={formData.varietasSorgum}
                onChange={(e) => setFormData((f) => ({ ...f, varietasSorgum: e.target.value }))}
                className={LITE_CSS.select}
              >
                <option value="">Pilih Varietas (opsional)</option>
                {varieties.map((v) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172C05] mb-1">Status Irigasi</label>
              <select
                value={formData.statusIrigasi}
                onChange={(e) => setFormData((f) => ({ ...f, statusIrigasi: e.target.value as any }))}
                className={LITE_CSS.select}
              >
                <option value="Tadah Hujan">Tadah Hujan</option>
                <option value="Irigasi Teknis">Irigasi Teknis</option>
                <option value="Irigasi Sederhana">Irigasi Sederhana</option>
              </select>
            </div>
          </div>

          {/* Map Picker Toggle */}
          <div className="space-y-2 p-3 bg-[#EBF7EE] rounded-2xl border border-[#C8E6C9]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#172C05] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#2C4219]" /> Pin Lokasi Sawah di Peta
                </p>
                <p className="text-[11px] text-[#2E7D32]">
                  {formData.latitude && formData.longitude
                    ? `Koordinat terpasang: ${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)}`
                    : 'Tentukan titik peta agar mudah dicari.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="px-3 py-1.5 bg-[#2C4219] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {showMapPicker ? 'Tutup Peta' : 'Buka Peta'}
              </button>
            </div>

            {showMapPicker && (
              <div className="pt-2">
                <MapPicker
                  initialLat={formData.latitude}
                  initialLng={formData.longitude}
                  onLocationChange={(loc: MapLocation) => {
                    setFormData((f) => ({
                      ...f,
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                      lokasiDesa: loc.desa || f.lokasiDesa,
                      kecamatan: loc.kecamatan || f.kecamatan,
                    }));
                  }}
                />
              </div>
            )}
          </div>

          {/* Upload Foto Lahan Base64 */}
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Foto Lahan (opsional)</label>
            <div className="flex items-center gap-3">
              {formData.fotoUrl ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#ECE7DF]">
                  <img src={formData.fotoUrl} alt="Foto Lahan" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFormData((f) => ({ ...f, fotoUrl: '' }))}
                    className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData((f) => ({ ...f, fotoUrl: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="text-xs text-[#70766B] file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#EBF7EE] file:text-[#1B5E20] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2 border-t border-[#ECE7DF]">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#2D3328] bg-[#F5EFE9] border border-[#E0D7CB] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#2C4219] text-white hover:bg-[#1C2E10] cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {saving ? 'Menyimpan...' : 'Simpan Lahan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL 4: Konfirmasi Hapus Lahan ────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Data Lahan?"
        subtitle="Konfirmasi Penghapusan"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#44483e] leading-relaxed">
            Apakah Anda yakin ingin menghapus <strong>{deleteTarget?.namaLahan}</strong>? Data yang dihapus tidak dapat dikembalikan.
          </p>
          <div className="flex gap-3 pt-2 border-t border-[#ECE7DF]">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#44483e] bg-[#F5EFE9] border border-[#E0D7CB] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast notification */}
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
