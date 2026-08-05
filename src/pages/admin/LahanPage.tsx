import React, { useEffect, useState } from 'react';
import { Plus, MapPin, Layers, LayoutGrid, Sprout, FileText, TrendingUp, Compass, Edit3, Eye, Trash2, Upload, X, ChevronLeft, ChevronRight, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import MapPicker, { type MapLocation } from '../../components/MapPicker';
import MapView from '../../components/MapView';
import { landApi } from '../../api/endpoints/landApi';
import { varietyApi, Variety } from '../../api/endpoints/varietyApi';
import { LandPlot } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { ActionButtons } from '../../components/common/ActionButtons';
import { nextCode } from '../../utils/kodeGenerator';

export const LahanPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [landList, setLandList] = useState<LandPlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<LandPlot | null>(null);
  const [detailPlot, setDetailPlot] = useState<LandPlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LandPlot | null>(null); // Data yang akan dihapus

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

  const [formData, setFormData] = useState<Partial<LandPlot>>({
    namaLahan: '',
    lokasiDesa: '',
    kecamatan: '',
    luasHektar: 0,
    varietasSorgum: 'Bioguma',
    statusIrigasi: 'Irigasi Teknis',
    jenisTanah: '',
    pemilikKelompokTani: '',
    statusKesiapan: 'Siap Tanam',
    statusBadge: 'AKTIF',
    panenLaluTon: 0,
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
      kodeLahan: nextCode('BLK-', landList, 3),
      namaLahan: '',
      lokasiDesa: '',
      kecamatan: '',
      luasHektar: 0,
      varietasSorgum: '',
      statusIrigasi: '',
      jenisTanah: '',
      pemilikKelompokTani: '',
      statusKesiapan: '',
      statusBadge: 'AKTIF',
      panenLaluTon: 0,
      fotoUrl: '',
      latitude: undefined,
      longitude: undefined,
    });
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plot: LandPlot) => {
    setEditingPlot(plot);
    setFormData(plot);
    setSelectedImage(null);
    setImageError('');
    setImagePreview(plot.fotoUrl || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalFotoUrl = formData.fotoUrl || imagePreview || '';
    
    if (editingPlot) {
      await landApi.update(editingPlot.id, { ...formData, fotoUrl: finalFotoUrl });
    } else {
      await landApi.create({
        ...formData,
        fotoUrl: finalFotoUrl,
      });
    }
    setIsModalOpen(false);
    handleRemoveImage();
    fetchLand();
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
    await landApi.delete(deleteTarget.id);
    setDeleteTarget(null);
    fetchLand();
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#221A12] tracking-tight">
            Kelola Lahan
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
            {totalHektar.toFixed(1)} Ha
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
            {landList.length > 0 ? `${(totalHektar / landList.length).toFixed(1)} Ha` : '0.0 Ha'}
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
              className="bg-white rounded-xl shadow-xs border border-[#c4c8bb]/25 p-3.5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all duration-200 group"
            >
              {/* Left Image */}
              <div className="w-full sm:w-40 h-40 sm:h-full shrink-0 rounded-lg overflow-hidden relative bg-[#F7F7F5] border border-[#c4c8bb]/20">
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

              {/* Right Details */}
              <div className="flex-1 flex flex-col justify-between py-0.5">
                <div>
                  {/* Title & Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-[#221A12] text-sm leading-snug">
                      {item.namaLahan}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${getBadgeStyle(
                        item.statusBadge,
                        item.statusKesiapan
                      )}`}
                    >
                      {item.statusBadge || (item.statusKesiapan === 'Siap Tanam' ? 'AKTIF' : 'PERSIAPAN')}
                    </span>
                  </div>

                  {/* Info List */}
                  <div className="space-y-1.5 text-xs text-[#44483e] font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-[#74796d] shrink-0" />
                      <span>
                        Luas: <strong className="text-[#221A12]">{item.luasHektar} Ha</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-[#74796d] shrink-0" />
                      <span>
                        Panen Lalu:{' '}
                        <strong className="text-[#221A12]">
                          {item.panenLaluTon || (item.luasHektar * 4.8).toFixed(1)} Ton
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5 text-[#74796d] shrink-0" />
                      <span>
                        Sorgum {item.varietasSorgum} / {item.jenisTanah}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-[#c4c8bb]/15">
                  <button
                    type="button"
                    onClick={() => setDetailPlot(item)}
                    className="min-h-8 px-2.5 py-1.5 text-[#2C4219] hover:bg-[#efe0d2] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                    title="Lihat Detail Lahan"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Detail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="min-h-8 px-2.5 py-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                    title="Edit Data Lahan"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="ml-auto min-h-8 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                    title="Hapus Plot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
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

      {/* Modal Detail Plot Lahan */}
      <Modal
        isOpen={Boolean(detailPlot)}
        onClose={() => setDetailPlot(null)}
        title="Detail Data Lahan"
        subtitle={detailPlot ? `${detailPlot.namaLahan} • ${detailPlot.kodeLahan}` : ''}
        maxWidth="xl"
      >
        {detailPlot && (
          <div className="space-y-5">
            {/* Foto Lahan full-width */}
              <div className="w-full h-48 sm:h-60 rounded-2xl overflow-hidden border border-[#c4c8bb]/30 shadow-xs bg-[#F7F7F5]">
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

            {/* Grid Info Utama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Lokasi Desa
                </span>
                <span className="text-sm font-extrabold text-[#221A12] mt-0.5 block">
                  {detailPlot.lokasiDesa}
                </span>
              </div>

              <div className="p-3.5 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Luas Lahan
                </span>
                <span className="text-sm font-black text-[#221A12] mt-0.5 block">
                  {detailPlot.luasHektar} <span className="text-xs font-bold text-[#44483e]">Hektar</span>
                </span>
              </div>

              <div className="p-3.5 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Status Lahan
                </span>
                <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-black mt-1 ${
                  detailPlot.statusBadge === 'PERSIAPAN'
                    ? 'bg-[#ffe083] text-[#564500]'
                    : detailPlot.statusBadge === 'PEMBESARAN'
                    ? 'bg-[#cfecb3] text-[#172C05]'
                    : 'bg-[#C3E28D]/50 text-[#172C05]'
                }`}>
                  {detailPlot.statusBadge || 'AKTIF'}
                </span>
              </div>

              <div className="p-3.5 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Panen Lalu
                </span>
                <span className="text-sm font-black text-[#221A12] mt-0.5 block">
                  {detailPlot.panenLaluTon || (detailPlot.luasHektar * 4.8).toFixed(1)} Ton
                </span>
              </div>

              <div className="p-3.5 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Varietas Sorgum
                </span>
                <span className="inline-block px-3 py-0.5 rounded-full bg-[#D1E6A5] text-[#2C4219] text-xs font-bold mt-1">
                  {detailPlot.varietasSorgum}
                </span>
              </div>

              <div className="p-3.5 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Jenis Tanah
                </span>
                <span className="text-sm font-extrabold text-[#221A12] mt-0.5 block">
                  {detailPlot.jenisTanah}
                </span>
              </div>

              <div className="p-3.5 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20 sm:col-span-2">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Kelompok Tani / Pengelola
                </span>
                <span className="text-sm font-extrabold text-[#221A12] mt-0.5 block">
                  {detailPlot.pemilikKelompokTani}{' '}
                  <span className="text-xs font-semibold text-[#6B7280]">
                    ({detailPlot.lokasiDesa}, {detailPlot.kecamatan})
                  </span>
                </span>
              </div>
            </div>

            {/* Peta Lokasi */}
            <div>
              <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block mb-1.5">
                TITIK KOORDINAT PETA
              </span>
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
              <button
                type="button"
                onClick={() => setDetailPlot(null)}
                className="px-6 py-2 rounded-lg bg-[#1C3615] text-white text-xs font-bold hover:bg-[#12240E] transition-all shadow-2xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tambah / Edit Lahan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlot ? 'Edit Data Plot Lahan' : 'Tambah Lahan Baru'}
        subtitle="Daftarkan sektor tanah baru mitra KWT"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kode Lahan / Blok
              </label>
              <input
                type="text"
                value={formData.kodeLahan || ''}
                readOnly
                disabled
                title="Kode dibuat otomatis oleh sistem (auto-increment)"
                className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm text-[#2C4219] font-bold cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Nama Lahan / Blok
              </label>
              <input
                type="text"
                value={formData.namaLahan}
                onChange={(e) => setFormData({ ...formData, namaLahan: e.target.value })}
                placeholder="Contoh: Blok A - Sukamaju"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kecamatan
              </label>
              <input
                type="text"
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                placeholder="Terisi otomatis dari peta"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Luas (Hektar)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.luasHektar}
                onChange={(e) => setFormData({ ...formData, luasHektar: Number(e.target.value) })}
                placeholder="Contoh: 2.5"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          {/* Peta Lokasi (Google Maps) */}
          <MapPicker
            initialLat={formData.latitude}
            initialLng={formData.longitude}
            onLocationChange={handleMapLocationChange}
            onReset={handleMapReset}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Lokasi Desa
              </label>
              <input
                type="text"
                value={formData.lokasiDesa}
                onChange={(e) => setFormData({ ...formData, lokasiDesa: e.target.value })}
                placeholder="Terisi otomatis dari peta"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Varietas Sorgum
              </label>
              <select
                value={formData.varietasSorgum}
                onChange={(e) => setFormData({ ...formData, varietasSorgum: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              >
                <option value="" disabled>
                  {varieties.length === 0 ? 'Belum ada varietas terdaftar' : 'Pilih varietas...'}
                </option>
                {varieties.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Status Badge
              </label>
              <select
                value={formData.statusBadge || 'AKTIF'}
                onChange={(e) => setFormData({ ...formData, statusBadge: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="AKTIF">AKTIF</option>
                <option value="PERSIAPAN">PERSIAPAN</option>
                <option value="PEMBESARAN">PEMBESARAN</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Jenis Tanah
              </label>
              <input
                type="text"
                value={formData.jenisTanah}
                onChange={(e) => setFormData({ ...formData, jenisTanah: e.target.value })}
                placeholder="Aluvial / Latosol / Grumosol"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Panen Lalu (Ton)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.panenLaluTon || 10.0}
                onChange={(e) => setFormData({ ...formData, panenLaluTon: Number(e.target.value) })}
                placeholder="Contoh: 12"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Upload Foto Lahan (JPG/PNG Only) */}
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Foto Lahan (Khusus JPG / PNG)
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
                      {selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB • ` : ''}Format JPG/PNG
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors shrink-0 cursor-pointer"
                  title="Hapus foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#c4c8bb]/50 hover:border-[#2C4219] bg-[#fff1e5]/60 hover:bg-[#FFF8F4] rounded-2xl cursor-pointer transition-all text-center">
                <div className="w-10 h-10 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#2C4219]">
                  Klik untuk unggah foto lahan atau seret ke sini
                </span>
                <span className="text-[11px] text-[#74796d] font-semibold mt-0.5">
                  Format yang didukung: <strong className="text-[#2C4219]">.JPG, .JPEG, .PNG</strong> (Maks. 5 MB)
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}

            {imageError && (
              <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {imageError}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Data Lahan
            </Button>
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
    </div>
  );
};

