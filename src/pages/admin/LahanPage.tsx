import React, { useEffect, useState } from 'react';
import { Plus, MapPin, Layers, Sprout, FileText, Edit3, Eye, Trash2, Upload, X, ChevronLeft, ChevronRight, AlertTriangle, Image as ImageIcon, Calendar, Clock, Pencil, Leaf, User } from 'lucide-react';
import MapPicker, { type MapLocation } from '../../components/MapPicker';
import MapView from '../../components/MapView';
import { landApi } from '../../api/endpoints/landApi';
import { useUnitSettings } from '../../context/UnitSettingsContext';
import { varietyApi, Variety } from '../../api/endpoints/varietyApi';
import { plantingApi } from '../../api/endpoints/plantingApi';
import { LandPlot, Planting } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { ActionButtons } from '../../components/common/ActionButtons';
import { Toast } from '../../components/common/Toast';

// ── Baris info sederhana untuk modal Detail (ramah pengguna) ────────────────
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 px-4">
    <span className="w-9 h-9 rounded-xl bg-[#fff1e5] text-[#2C4219] flex items-center justify-center shrink-0 mt-0.5">
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-[#221A12] mt-0.5 break-words">{value}</p>
    </div>
  </div>
);

export const LahanPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const { units, formatLuas, luasKeHektar, hektarKeUnit, luasSuffix } = useUnitSettings();
  const [landList, setLandList] = useState<LandPlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<LandPlot | null>(null);
  const [detailPlot, setDetailPlot] = useState<LandPlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LandPlot | null>(null); // Data yang akan dihapus

  // Planting (penanaman) — input & riwayat via tombol Tanam di card (terpisah dari detailPlot agar tidak buka detail)
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [allPlantings, setAllPlantings] = useState<Planting[]>([]);
  const [plantingLoading, setPlantingLoading] = useState(false);
  const [plantingModalOpen, setPlantingModalOpen] = useState(false);
  const [plantingLahan, setPlantingLahan] = useState<LandPlot | null>(null);
  const [editingPlanting, setEditingPlanting] = useState<Planting | null>(null);
  const [showPlantingForm, setShowPlantingForm] = useState(false);
  const [plantingForm, setPlantingForm] = useState<Partial<Planting> & { tanggalTanam?: string; estimasiPanen?: string; jumlahLubang?: string }>({
    tanggalTanam: new Date().toISOString().slice(0,10),
    estimasiPanen: '',
    varietas: '',
    jumlahLubang: '',
    petugas: '',
    statusTanam: 'Ditanam',
    catatan: '',
  });

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // 10 baris per halaman
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Image Upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');

  // Varietas dari API (Master Varietas)
  const [varieties, setVarieties] = useState<Variety[]>([]);

  const [formData, setFormData] = useState<
    Partial<LandPlot> & { luasHektar?: string; panenLaluTon?: string; jumlahLubang?: string }
  >({
    namaLahan: '',
    lokasiDesa: '',
    kecamatan: '',
    luasHektar: '',
    statusIrigasi: 'Irigasi Teknis',
    jumlahLubang: '',
    pemilikKelompokTani: '',
    statusKesiapan: 'Siap Tanam',
    statusBadge: 'AKTIF',
    panenLaluTon: '',
    fotoUrl: '',
    latitude: undefined,
    longitude: undefined,
  });

  const fetchLand = async (targetPage = page, search = searchTerm) => {
    setLoading(true);
    try {
      const res = await landApi.getAll({
        page: targetPage,
        limit,
        search: search || undefined,
      });
      setLandList(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setLandList([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset ke halaman 1 saat search berubah
  }, [searchTerm]);

  // Muat daftar varietas dari API
  useEffect(() => {
    const fetchVarieties = async () => {
      try {
        const res = await varietyApi.getAll();
        setVarieties(res.data || []);
      } catch {
        setVarieties([]);
      }
    };
    fetchVarieties();
  }, []);

  useEffect(() => {
    fetchLand(page, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  const fetchPlantings = async (lahanId: string) => {
    setPlantingLoading(true);
    try {
      const res = await plantingApi.getAll({ lahanId, limit: 50 });
      setPlantings(res.data || []);
    } catch {
      setPlantings([]);
    } finally {
      setPlantingLoading(false);
    }
  };
  useEffect(() => {
    if (plantingModalOpen && plantingLahan?.id) fetchPlantings(plantingLahan.id);
  }, [plantingModalOpen, plantingLahan?.id]);

  const fetchAllPlantings = async () => {
    try {
      const res = await plantingApi.getAll({ limit: 200 });
      setAllPlantings(res.data || []);
    } catch { setAllPlantings([]); }
  };
  useEffect(() => { fetchAllPlantings(); }, []);

  const handleOpenPlantingAdd = () => {
    if (!plantingLahan) return;
    setEditingPlanting(null);
    setShowPlantingForm(true);
    const varietasDefault = plantingLahan.varietasSorgum || '';
    const v = varieties.find((x) => x.name === varietasDefault);
    const lamaPanen = v?.lamaPanen ?? 100;
    const est = new Date(); est.setDate(est.getDate() + lamaPanen);
    setPlantingForm({
      tanggalTanam: new Date().toISOString().slice(0,10),
      estimasiPanen: est.toISOString().slice(0,10),
      varietas: varietasDefault,
      jumlahLubang: String(plantingLahan.jumlahLubang || ''),
      petugas: '',
      statusTanam: 'Ditanam',
      catatan: '',
    });
  };
  const handleOpenPlantingEdit = (p: Planting) => {
    setEditingPlanting(p);
    setShowPlantingForm(true);
    // jumlahLubang di DB sudah ×3 → tampilkan nilai asli (÷3)
    const asli = (p.jumlahLubang ?? 0) / 3;
    setPlantingForm({
      tanggalTanam: p.tanggalTanam,
      estimasiPanen: p.estimasiPanen || '',
      varietas: p.varietas,
      jumlahLubang: String(Number.isInteger(asli) ? asli : asli.toFixed(1)),
      petugas: p.petugas || '',
      statusTanam: p.statusTanam,
      catatan: p.catatan || '',
    });
  };
  const handleDeletePlanting = async (id: string) => {
    if (!plantingLahan) return;
    try {
      await plantingApi.delete(id);
      fetchPlantings(plantingLahan.id);
      fetchAllPlantings();
      setToast({ msg: 'Penanaman dihapus.', type: 'success' });
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus. Mungkin sudah dipakai panen.', type: 'error' });
    }
  };
  const handleSavePlanting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantingLahan) return;
    if (!plantingForm.petugas.trim()) {
      setToast({ msg: 'Petugas penanaman wajib diisi.', type: 'error' });
      return;
    }
    try {
      // Estimasi panen otomatis: tanggal tanam + lamaPanen varietas (dari Master Varietas)
      const v = varieties.find((x) => x.name === plantingForm.varietas);
      const lamaPanen = v?.lamaPanen ?? 100;
      const est = new Date(plantingForm.tanggalTanam + 'T00:00:00');
      if (!isNaN(est.getTime())) est.setDate(est.getDate() + lamaPanen);
      const payload = {
        lahanId: plantingLahan.id,
        tanggalTanam: plantingForm.tanggalTanam,
        estimasiPanen: isNaN(est.getTime()) ? null : est.toISOString().slice(0,10),
        varietas: plantingForm.varietas,
        // Jumlah lubang di kali 3 saat disimpan (1 lubang = 3 titik tanam)
        jumlahLubang: Number(plantingForm.jumlahLubang) * 3 || 0,
        petugas: plantingForm.petugas,
        statusTanam: plantingForm.statusTanam as any,
        catatan: plantingForm.catatan,
      };
      if (editingPlanting) await plantingApi.update(editingPlanting.id, payload);
      else await plantingApi.create(payload);
      setShowPlantingForm(false);
      setEditingPlanting(null);
      fetchPlantings(plantingLahan.id);
      fetchAllPlantings();
      setToast({ msg: editingPlanting ? 'Penanaman diperbarui.' : 'Penanaman berhasil ditambahkan.', type: 'success' });
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan penanaman.', type: 'error' });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setImageError('Format file tidak didukung! Harap pilih file JPG, JPEG, atau PNG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Ukuran file terlalu besar! Maksimal 5 MB.');
      return;
    }

    setImageError('');
    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setFormData((prev) => ({ ...prev, fotoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setImageError('');
    setFormData((prev) => ({ ...prev, fotoUrl: '' }));
  };

  const handleOpenAdd = () => {
    setEditingPlot(null);
    handleRemoveImage();
    setFormData({
      kodeLahan: '',
      namaLahan: '',
      lokasiDesa: '',
      kecamatan: '',
      luasHektar: '',
      statusIrigasi: '',
      jumlahLubang: '',
      pemilikKelompokTani: '',
      statusKesiapan: '',
      statusBadge: 'AKTIF',
      panenLaluTon: '',
      fotoUrl: '',
      latitude: undefined,
      longitude: undefined,
    });
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plot: LandPlot) => {
    setEditingPlot(plot);
    setFormData({
      ...plot,
      luasHektar: String(hektarKeUnit(plot.luasHektar ?? 0)),
      panenLaluTon: String(plot.panenLaluTon ?? ''),
      jumlahLubang: String(plot.jumlahLubang ?? ''),
    });
    setSelectedImage(null);
    setImageError('');
    setImagePreview(plot.fotoUrl || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalFotoUrl = formData.fotoUrl || imagePreview || '';

    // Foto lahan WAJIB diisi (tambah & edit)
    if (!finalFotoUrl) {
      setToast({ msg: 'Foto lahan wajib diisi. Silakan unggah gambar lahan terlebih dahulu.', type: 'error' });
      return;
    }

    const payload = {
      ...formData,
      luasHektar: luasKeHektar(formData.luasHektar),
      panenLaluTon: Number(formData.panenLaluTon) || 0,
      jumlahLubang: Number(formData.jumlahLubang) || 0,
    };

    try {
      if (editingPlot) {
        await landApi.update(editingPlot.id, { ...payload, fotoUrl: finalFotoUrl });
        setToast({ msg: 'Data lahan berhasil diperbarui.', type: 'success' });
      } else {
        // Kode lahan dibuat otomatis backend: 3 huruf awal nama lahan + tanggal daftar (contoh LUS-03092026)
        const { kodeLahan: _kl, ...payloadCreate } = payload;
        await landApi.create({
          ...payloadCreate,
          fotoUrl: finalFotoUrl,
        });
        setToast({ msg: 'Data lahan baru berhasil ditambahkan.', type: 'success' });
      }
      setIsModalOpen(false);
      handleRemoveImage();
      fetchLand();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan data lahan. Coba lagi.', type: 'error' });
    }
  };

  // Handler perubahan lokasi dari MapPicker
  const handleMapLocationChange = (loc: MapLocation) => {
    setFormData((prev) => ({
      ...prev,
      lokasiDesa: loc.desa || loc.alamatLengkap,
      kecamatan: loc.kecamatan || '',
      latitude: loc.latitude,
      longitude: loc.longitude,
    }));
  };

  const handleMapReset = () => {
    setFormData((prev) => ({
      ...prev,
      lokasiDesa: '',
      kecamatan: '',
      latitude: undefined,
      longitude: undefined,
    }));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await landApi.delete(deleteTarget.id);
      setToast({ msg: 'Data lahan berhasil dihapus.', type: 'success' });
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus data lahan.', type: 'error' });
    }
    setDeleteTarget(null);
    fetchLand();
  };

  const handleQuickTanam = (plot: LandPlot) => {
    setPlantingLahan(plot);
    setEditingPlanting(null);
    setShowPlantingForm(false);
    setPlantingModalOpen(true);
  };

  const totalHektar = landList.reduce((acc, curr) => acc + (curr.luasHektar || 0), 0);
  const desaCount = new Set(landList.map((l) => l.lokasiDesa).filter(Boolean)).size;

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    setPage(targetPage);
  };

  const getBadgeStyle = (badge?: string, statusKesiapan?: string) => {
    const val = (badge || statusKesiapan || '').toUpperCase();
    if (val.includes('AKTIF') || val.includes('SIAP')) {
      return 'bg-[#D1E6A5] text-[#2C4219] border-transparent';
    }
    if (val.includes('PERSIAPAN') || val.includes('TUMBUH')) {
      return 'bg-[#FEF3C7] text-[#92400E] border-transparent';
    }
    if (val.includes('PEMBESARAN') || val.includes('PANEN')) {
      return 'bg-[#FEE2E2] text-[#991B1B] border-transparent';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };
  const formatHariTanggal = (iso?: string | null) => {
    if (!iso) return '-';
    const s = String(iso).slice(0,10);
    const parts = s.split('-');
    let d: Date;
    if (parts.length===3) d = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
    else d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  const formatTanggal = (iso?: string | null) => {
    if (!iso) return '-';
    const s = String(iso).slice(0,10);
    const parts = s.split('-');
    let d: Date;
    if (parts.length===3) d = new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
    else d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  // Status lahan otomatis — hanya 2: Sedang Ditanami / Kosong (tidak by input manual)
  const getLahanDerivedStatus = (lahanId: string) => {
    const list = allPlantings.filter(p => String(p.lahanId) === String(lahanId) && ['Ditanam','Tumbuh','Siap Panen'].includes(p.statusTanam));
    if (list.length === 0) return { label: 'Kosong', sub: 'Lahan kosong • Siap tanam', style: 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]', dot: 'bg-[#9CA3AF]', anim: '', Icon: Sprout };
    const latest = [...list].sort((a,b) => new Date(b.tanggalTanam).getTime() - new Date(a.tanggalTanam).getTime())[0];
    return { label: 'Sedang Ditanami', sub: `${latest.kodeTanam} • ${formatTanggal(latest.tanggalTanam)}`, style: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', anim: 'animate-pulse', Icon: Sprout };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#221A12] tracking-tight">
            Kelola Lahan & Tanaman
          </h1>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-[#1C3615] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#12240E] transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-[#D1E6A5]" />
          <span>Tambah Lahan Baru</span>
        </button>
      </div>

      {/* Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Total Luas Lahan */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            TOTAL LUAS LAHAN
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {formatLuas(totalHektar)}
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            {totalHektar > 0 ? `Tersebar di ${desaCount} desa wilayah binaan` : 'Belum ada data lahan'}
          </p>
        </div>

        {/* Card 2: Jumlah Blok Lahan */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            JUMLAH BLOK LAHAN
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {landList.length} Blok Lahan
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            Kelompok Tani & KWT Mitra
          </p>
        </div>

        {/* Card 3: Rata-rata Luas per Blok */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            RATA-RATA LUAS / BLOK
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {landList.length > 0 ? formatLuas(totalHektar / landList.length) : formatLuas(0)}
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            {landList.length > 0 ? `Dari ${landList.length} blok lahan` : 'Belum ada data lahan'}
          </p>
        </div>
      </div>

      {/* Grid of Land Block Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {loading ? (
          <div className="lg:col-span-2 py-16 text-center text-[#6B7280]">
            <span className="inline-block w-5 h-5 border-2 border-[#1C3615] border-t-transparent rounded-full animate-spin align-middle mr-2" />
            Memuat data lahan...
          </div>
        ) : landList.length === 0 ? (
          <div className="lg:col-span-2 py-16 text-center text-[#6B7280]">
            Tidak ada data lahan yang ditemukan.
          </div>
        ) : (
          landList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-xs border border-[#c4c8bb]/25 p-4 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all duration-200 group"
            >
              {/* Foto Lahan */}
              <div className="w-full sm:w-36 sm:h-36 h-44 shrink-0 rounded-xl overflow-hidden relative bg-[#F7F7F5] border border-[#c4c8bb]/20">
                {item.fotoUrl ? (
                  <img
                    src={item.fotoUrl}
                    alt={item.namaLahan}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#9CA3AF]">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[10px] font-semibold">Belum ada foto</span>
                  </div>
                )}
              </div>

              {/* Detail */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Judul & status */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <h3 className="font-bold text-[#172C05] text-sm leading-snug break-words">
                    {item.namaLahan}
                  </h3>
                  {(() => {
                    const st = getLahanDerivedStatus(item.id);
                    const Icon = st.Icon;
                    const isActive = st.label !== 'Kosong';
                    return (
                      <span title={st.sub} className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0 inline-flex items-center gap-1.5 border ${st.style} ${isActive ? 'shadow-sm' : ''} ${st.anim}`}>
                        <span className="relative flex h-2 w-2">
                          {isActive && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${st.dot}`}></span>}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${st.dot}`}></span>
                        </span>
                        <Icon className="w-3 h-3" />
                        {st.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Info ringkas */}
                <div className="space-y-2 text-xs text-[#44483e] font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#fff1e5] text-[#2C4219] flex items-center justify-center shrink-0">
                      <FileText className="w-3 h-3" />
                    </span>
                    <span>
                      Luas: <strong className="text-[#221A12]">{formatLuas(item.luasHektar || 0)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#fff1e5] text-[#2C4219] flex items-center justify-center shrink-0">
                      <User className="w-3 h-3" />
                    </span>
                    <span className="min-w-0 truncate">
                      Pengelola: <strong className="text-[#221A12]">{item.pemilikKelompokTani || '-'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#fff1e5] text-[#2C4219] flex items-center justify-center shrink-0">
                      <MapPin className="w-3 h-3" />
                    </span>
                    <span className="min-w-0 truncate">
                      Lokasi: <strong className="text-[#221A12]">{item.lokasiDesa || '-'}{item.kecamatan ? `, ${item.kecamatan}` : ''}</strong>
                    </span>
                  </div>
                </div>

                {/* Aksi — konsisten, tidak melompat */}
                <div className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-[#c4c8bb]/15">
                  <button
                    type="button"
                    onClick={() => setDetailPlot(item)}
                    className="min-h-8 px-2.5 py-1.5 rounded-lg border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#efe0d2] hover:border-[#c4c8bb]/50 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                    title="Lihat Detail Lahan"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="min-h-8 px-2.5 py-1.5 rounded-lg border border-[#c4c8bb]/30 text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                    title="Edit Data Lahan"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTanam(item)}
                    className="min-h-8 px-2.5 py-1.5 rounded-lg bg-[#2C4219] text-white hover:bg-[#172C05] transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                    title="Catat Penanaman — tambah riwayat tanam untuk lahan ini"
                  >
                    <Sprout className="w-3.5 h-3.5 text-[#C3E28D]" />
                    Tanam
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="ml-auto min-h-8 w-8 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-center"
                    title="Hapus Lahan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280] mt-2">
          <span className="font-medium">
            Menampilkan {landList.length === 0 ? 0 : (page - 1) * limit + 1}-
            {Math.min(page * limit, total)} dari {total} data
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
                  num === page
                    ? 'bg-[#1C3615] text-white'
                    : 'hover:bg-[#F7F7F5] text-[#44483e]'
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

      {/* Modal Detail Lahan */}
      <Modal
        isOpen={Boolean(detailPlot)}
        onClose={() => setDetailPlot(null)}
        title="Detail Lahan"
        subtitle={detailPlot ? `${detailPlot.namaLahan} • ${detailPlot.kodeLahan}` : ''}
        maxWidth="xl"
      >
        {detailPlot && (
          <div className="space-y-4">
            {/* Foto Lahan */}
            <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-[#c4c8bb]/30 shadow-xs bg-[#F7F7F5]">
              {detailPlot.fotoUrl ? (
                <img
                  src={detailPlot.fotoUrl}
                  alt={detailPlot.namaLahan}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                  <ImageIcon className="w-10 h-10" />
                  <span className="text-xs font-semibold">Belum ada foto lahan</span>
                </div>
              )}
            </div>

            {/* Status lahan otomatis */}
            {(() => {
              const st = getLahanDerivedStatus(detailPlot.id);
              const Icon = st.Icon;
              const isActive = st.label !== 'Kosong';
              return (
                <div className="flex items-center justify-between gap-3 p-3.5 bg-[#fff8f4] rounded-2xl border border-[#c4c8bb]/20">
                  <div>
                    <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Status Lahan</p>
                    <span className={`mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${st.style}`}>
                      <span className="relative flex h-2 w-2">
                        {isActive && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${st.dot}`}></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${st.dot}`}></span>
                      </span>
                      <Icon className="w-3 h-3" />
                      {st.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] font-medium text-right">
                    {isActive ? 'Lahan sedang ditanami' : 'Kosong • siap tanam'}
                  </p>
                </div>
              );
            })()}

            {/* Info penting — sama dengan data di form Edit */}
            <div className="rounded-2xl border border-[#c4c8bb]/20 divide-y divide-[#c4c8bb]/10 bg-white overflow-hidden">
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Nama Lahan" value={detailPlot.namaLahan || '-'} />
              <InfoRow icon={<User className="w-4 h-4" />} label="Kelompok Tani / Pengelola" value={detailPlot.pemilikKelompokTani || '-'} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Lokasi Desa" value={detailPlot.lokasiDesa || '-'} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Kecamatan" value={detailPlot.kecamatan || '-'} />
              <InfoRow icon={<Layers className="w-4 h-4" />} label="Luas Lahan" value={formatLuas(detailPlot.luasHektar || 0)} />
            </div>

            {/* Peta Lokasi */}
            <div>
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Titik Lokasi di Peta</p>
              <div className="h-44 rounded-xl overflow-hidden border border-[#c4c8bb]/40 shadow-inner z-0 relative">
                {detailPlot.latitude && detailPlot.longitude ? (
                  <MapView
                    latitude={detailPlot.latitude}
                    longitude={detailPlot.longitude}
                    height="176px"
                  />
                ) : (
                  <div className="w-full h-full bg-[#F7F7F5] flex items-center justify-center text-xs font-semibold text-[#9CA3AF]">
                    Koordinat peta belum diatur
                  </div>
                )}
              </div>
              {detailPlot.latitude && detailPlot.longitude && (
                <p className="text-[11px] font-semibold text-[#6B7280] mt-1.5">
                  <MapPin className="w-3.5 h-3.5 inline-block mr-1 text-[#2C4219]" /> {detailPlot.latitude.toFixed(6)}, {detailPlot.longitude.toFixed(6)}
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-[#c4c8bb]/20">
              <Button variant="primary" onClick={() => setDetailPlot(null)}>Tutup</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tanam — input & riwayat penanaman (tombol Tanam di card) */}
      <Modal
        isOpen={plantingModalOpen}
        onClose={() => { setPlantingModalOpen(false); setShowPlantingForm(false); setEditingPlanting(null); }}
        title={showPlantingForm ? (editingPlanting ? 'Edit Penanaman' : 'Catat Penanaman Baru') : 'Riwayat Tanam'}
        subtitle={showPlantingForm ? (plantingLahan ? `${plantingLahan.namaLahan}` : '') : (plantingLahan ? plantingLahan.namaLahan : '')}
      >
        {showPlantingForm ? (
          <form onSubmit={handleSavePlanting} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Tanggal Tanam *</label>
                <input type="date" value={plantingForm.tanggalTanam} onChange={(e) => setPlantingForm({ ...plantingForm, tanggalTanam: e.target.value })} className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Varietas *</label>
                <select
                  value={plantingForm.varietas}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Estimasi panen otomatis mengikuti umur panen varietas (Master Varietas)
                    const v = varieties.find((x) => x.name === val);
                    const lama = v?.lamaPanen ?? 100;
                    const est = new Date((plantingForm.tanggalTanam || new Date().toISOString().slice(0,10)) + 'T00:00:00');
                    if (!isNaN(est.getTime())) est.setDate(est.getDate() + lama);
                    setPlantingForm({
                      ...plantingForm,
                      varietas: val,
                      estimasiPanen: isNaN(est.getTime()) ? '' : est.toISOString().slice(0,10),
                    });
                  }}
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                  required
                >
                  <option value="" disabled>Pilih varietas...</option>
                  {varieties.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Estimasi panen otomatis mengikuti umur panen varietas (Master Varietas).
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Jumlah Lubang *</label>
              <input type="number" min="0" value={plantingForm.jumlahLubang} onChange={(e) => setPlantingForm({ ...plantingForm, jumlahLubang: e.target.value })} placeholder="Contoh: 1200" className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm" required />
              <p className="text-[11px] text-[#6B7280] mt-1">Jumlah lubang (di kali 3) — isi sesuai lubang yang dibuat, sistem mengalikan otomatis.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Petugas Penanaman <span className="text-red-500">*</span></label>
              <input type="text" value={plantingForm.petugas} onChange={(e) => setPlantingForm({ ...plantingForm, petugas: e.target.value })} placeholder="Contoh: Ibu Siti - KWT" required className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">Catatan</label>
              <textarea value={plantingForm.catatan} onChange={(e) => setPlantingForm({ ...plantingForm, catatan: e.target.value })} placeholder="Kondisi bibit, cuaca, dll" className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm h-16" />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#c4c8bb]/20">
              <Button type="button" variant="outline" onClick={() => { setShowPlantingForm(false); setEditingPlanting(null); }}>Kembali</Button>
              <Button type="submit" variant="primary">{editingPlanting ? 'Perbarui' : 'Simpan Penanaman'}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Info lahan ringkas */}
            <div className="flex items-center gap-3 p-3.5 bg-[#fff8f4] rounded-2xl border border-[#c4c8bb]/20">
              <div className="w-11 h-11 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#172C05] truncate">{plantingLahan?.namaLahan}</p>
                <p className="text-[11px] text-[#6B7280] font-medium truncate">{plantingLahan?.kodeLahan}{plantingLahan?.lokasiDesa ? ` • ${plantingLahan.lokasiDesa}` : ''}</p>
              </div>
              <span className="text-[11px] font-bold text-[#2C4219] bg-[#C3E28D]/40 px-2.5 py-1 rounded-full shrink-0">
                {plantings.length} Tanam
              </span>
            </div>

            {/* Tombol tambah — lebar penuh, mudah ditemukan */}
            <Button onClick={handleOpenPlantingAdd} variant="primary" className="w-full text-xs py-3 justify-center">
              <Plus className="w-4 h-4" /> Tambah Tanam Baru
            </Button>

            {/* Daftar riwayat penanaman — kartu besar */}
            {plantingLoading ? (
              <div className="p-8 text-center text-xs text-[#6B7280]"><span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin mr-2" />Memuat...</div>
            ) : plantings.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#c4c8bb]/40 rounded-2xl">
                <Leaf className="w-9 h-9 text-[#9CA3AF] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#6B7280]">Belum ada penanaman.</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Klik tombol di atas untuk mencatat tanam pertama.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {plantings.map((p) => {
                  const periode = p.tanggalTanam ? Math.round((Date.now() - new Date(p.tanggalTanam).getTime())/(1000*60*60*24)) : 0;
                  const statusCls =
                    p.statusTanam === 'Dipanen' ? 'bg-[#C3E28D] text-[#172C05]'
                    : p.statusTanam === 'Siap Panen' ? 'bg-amber-100 text-amber-800'
                    : p.statusTanam === 'Gagal' ? 'bg-red-100 text-red-700'
                    : p.statusTanam === 'Tumbuh' ? 'bg-emerald-50 text-emerald-700'
                    : p.statusTanam === 'Ditanam' ? 'bg-sky-50 text-sky-700'
                    : 'bg-[#F7F7F5] text-[#6B7280]';
                  return (
                    <div key={p.id} className="p-4 bg-white rounded-2xl border border-[#c4c8bb]/25 hover:border-[#c4c8bb]/60 transition-colors">
                      {/* Baris atas: kode + status, dan tombol aksi besar */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#2C4219]">{p.kodeTanam}</span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusCls}`}>{p.statusTanam}</span>
                            {(p as any).jumlahPanen != null && Number((p as any).jumlahPanen) > 0 && (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                Number((p as any).panenKeTerakhir) >= 3
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-[#C3E28D] text-[#172C05]'
                              }`}>
                                🌾 Sudah panen {Number((p as any).panenKeTerakhir)}/3
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-[#221A12] mt-1">{p.varietas}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleOpenPlantingEdit(p)}
                            className="w-9 h-9 rounded-xl bg-[#fff1e5] text-[#2C4219] hover:bg-[#efe0d2] flex items-center justify-center cursor-pointer transition-colors"
                            title="Ubah data tanam"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlanting(p.id)}
                            className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center cursor-pointer transition-colors"
                            title="Hapus data tanam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Detail info — bahasa sederhana, ikon jelas */}
                      <div className="mt-3 space-y-1.5">
                        <p className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#2C4219] shrink-0" />
                          Tanam: {formatTanggal(p.tanggalTanam)}{periode > 0 ? ` (${periode} hari lalu)` : ''}
                        </p>
                        {p.estimasiPanen && (
                          <p className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#2C4219] shrink-0" />
                            Perkiraan Panen: {formatTanggal(p.estimasiPanen)}
                          </p>
                        )}
                        <p className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#2C4219] shrink-0" />
                          {Math.round((Number(p.jumlahLubang) || 0) / 3).toLocaleString('id-ID')} lubang tanam
                        </p>
                        <p className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#2C4219] shrink-0" />
                          Petugas: {p.petugas || '-'}
                        </p>
                        {p.catatan && (
                          <p className="text-[11px] text-[#6B7280] italic mt-1">Catatan: {p.catatan}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tutup */}
            <div className="flex justify-end pt-3 border-t border-[#c4c8bb]/20">
              <Button variant="outline" onClick={() => setPlantingModalOpen(false)}>Tutup</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tambah / Edit Lahan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlot ? 'Edit Data Lahan' : 'Tambah Lahan Baru'}
        subtitle={editingPlot ? 'Perbarui data lahan' : 'Lengkapi data lahan baru'}
        maxWidth="6xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm">Batal</Button>
            <Button type="submit" form="lahan-form" variant="primary" className="px-8 py-3 text-sm">
              Simpan Data Lahan
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-6" id="lahan-form">
          {/* ── Bagian 1: Informasi Lahan ──────────────────────────────── */}
          <div className="p-5 sm:p-6 bg-[#FFF8F4] border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">1</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Informasi Lahan</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                Kelompok Tani / Pengelola <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pemilikKelompokTani}
                onChange={(e) => setFormData({ ...formData, pemilikKelompokTani: e.target.value })}
                placeholder="Contoh: KWT Sukamaju Tani"
                className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Nama Lahan / Blok <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.namaLahan}
                  onChange={(e) => setFormData({ ...formData, namaLahan: e.target.value })}
                  placeholder="Contoh: Blok A - Sukamaju"
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Lokasi Desa</label>
                <input
                  type="text"
                  value={formData.lokasiDesa}
                  onChange={(e) => setFormData({ ...formData, lokasiDesa: e.target.value })}
                  placeholder="Terisi otomatis dari peta"
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Kecamatan</label>
                <input
                  type="text"
                  value={formData.kecamatan}
                  onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                  placeholder="Terisi otomatis dari peta"
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Luas Lahan ({luasSuffix}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step={units.luas === 'm2' ? '1' : '0.01'}
                  min="0"
                  value={formData.luasHektar}
                  onChange={(e) => setFormData({ ...formData, luasHektar: e.target.value })}
                  placeholder={units.luas === 'm2' ? 'Contoh: 500 m2' : units.luas === 'are' ? 'Contoh: 5 are' : units.luas === 'km2' ? 'Contoh: 0.05 km2' : 'Contoh: 0.5 hektar'}
                  className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Bagian 2: Peta Lokasi ──────────────────────────────────── */}
          <div className="p-5 sm:p-6 bg-white border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">2</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Peta Lokasi</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Geser penanda peta ke lokasi lahan, desa & kecamatan terisi otomatis</p>
              </div>
            </div>

            <MapPicker
              initialLat={formData.latitude}
              initialLng={formData.longitude}
              onLocationChange={handleMapLocationChange}
              onReset={handleMapReset}
            />
          </div>

          {/* ── Bagian 3: Foto Lahan ───────────────────────────────────── */}
          <div className="p-5 sm:p-6 bg-white border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">3</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Foto Lahan</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                Foto Lahan (Khusus JPG / PNG) <span className="text-red-500">*</span>
              </label>

              {imagePreview ? (
                <div className="relative p-3 bg-[#FFF8F4] border border-[#c4c8bb]/40 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Foto Lahan"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-cover rounded-lg border border-[#c4c8bb]/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#221A12] truncate">
                        {selectedImage?.name || 'Foto Lahan Terpilih'}
                      </p>
                      <p className="text-[10px] text-[#74796d] font-semibold">
                        {selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB - ` : ''}Format JPG/PNG
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById('lahan-foto-input')?.click()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2C4219] text-white text-[11px] font-bold hover:bg-[#213213] transition-colors shrink-0 cursor-pointer"
                    title="Ganti foto lahan"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="lahan-foto-input"
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#c4c8bb]/50 hover:border-[#2C4219] bg-[#fff1e5]/60 hover:bg-[#FFF8F4] rounded-2xl cursor-pointer transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#2C4219]">
                    Klik untuk unggah foto lahan atau seret ke sini
                  </span>
                  <span className="text-[11px] text-[#74796d] font-semibold mt-0.5">
                    Format yang didukung: <strong className="text-[#2C4219]">.JPG, .JPEG, .PNG</strong> (Maks. 5 MB)
                  </span>
                </label>
              )}

              {/* Input file selalu ada di DOM agar tombol Edit bisa memicunya */}
              <input
                id="lahan-foto-input"
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageChange}
                className="hidden"
              />

              {imageError && (
                <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {imageError}
                </p>
              )}
            </div>
          </div>

        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Hapus Data Lahan"
          maxWidth="sm"
        >
          <div className="space-y-4 text-sm text-[#221A12]">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">
                  Apakah Anda yakin ingin menghapus data lahan ini?
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                  <strong>{deleteTarget.kodeLahan}</strong> — {deleteTarget.namaLahan} ({deleteTarget.lokasiDesa}).
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

      {/* Toast Floating Notifikasi */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
