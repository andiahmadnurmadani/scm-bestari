import React, { useEffect, useMemo, useState } from 'react';
import { Wrench, Plus, Eye, Edit3, Trash2, AlertTriangle, Upload, X, MapPin, AlertCircle, PackageX, Hammer, CheckCircle2, Wrench as WrenchIcon } from 'lucide-react';
import { equipmentApi } from '../../api/endpoints/equipmentApi';
import { Equipment } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { nextCode } from '../../utils/kodeGenerator';

// ── Filter pill sederhana: 1 pilihan aktif, langsung memfilter tabel ──────────
type FilterKey = 'dipakai' | 'tersedia' | 'perbaikan' | 'perawatan' | 'semua';

const FILTERS: { key: FilterKey; label: string; icon?: React.ReactNode }[] = [
  { key: 'dipakai', label: 'Sedang Dipakai', icon: <PackageX className="w-3.5 h-3.5" /> },
  { key: 'tersedia', label: 'Tersedia', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { key: 'perbaikan', label: 'Butuh Perbaikan', icon: <Hammer className="w-3.5 h-3.5" /> },
  { key: 'perawatan', label: 'Dalam Perawatan', icon: <WrenchIcon className="w-3.5 h-3.5" /> },
  { key: 'semua', label: 'Semua Alat' },
];

function isDipakai(item: Equipment) {
  return item.status === 'Sedang Digunakan';
}

function isTersedia(item: Equipment) {
  return item.status === 'Tersedia';
}

function isPerbaikan(item: Equipment) {
  return item.kondisi === 'Perlu Perbaikan' || item.kondisi === 'Rusak';
}

function isPerawatan(item: Equipment) {
  return item.status === 'Dalam Perawatan';
}

const filterFn: Record<FilterKey, (item: Equipment) => boolean> = {
  dipakai: isDipakai,
  tersedia: isTersedia,
  perbaikan: isPerbaikan,
  perawatan: isPerawatan,
  semua: () => true,
};

export const PeralatanPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Filter pill: 1 pilihan aktif, langsung memfilter tabel (client-side)
  // Default: tampilkan peralatan yang SEDANG DIPAKAI di lapangan.
  const [filterKey, setFilterKey] = useState<FilterKey>('dipakai');

  // Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<Equipment | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null); // Data yang akan dihapus

  // Image Upload States
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Equipment>>({
    kodeAlat: '',
    namaPeralatan: '',
    kategori: 'Mesin Olah Tanah',
    jumlahStok: '',
    kondisi: 'Sangat Baik',
    status: 'Tersedia',
    lokasiPenyimpanan: '',
    tanggalPengadaan: new Date().toLocaleDateString('id-ID'),
    spesifikasi: '',
    fotoUrl: '',
    terakhirServis: new Date().toLocaleDateString('id-ID'),
  });

  // Muat SEMUA data sekali (batas 1000) lalu filter & cari di sisi klien,
  // supaya perpindahan pill instan tanpa loading server.
  const fetchEquipment = async (search = searchTerm) => {
    setLoading(true);
    try {
      const res = await equipmentApi.getAll({
        page: 1,
        limit: 1000,
        search: search || undefined,
      });
      setEquipmentList(res.data || []);
    } catch (err: any) {
      setEquipmentList([]);
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat data peralatan.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment(searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Daftar yang TAMPIL = hasil filter pill + search (client-side)
  const filteredList = useMemo(() => {
    const fn = filterFn[filterKey];
    const q = searchTerm.trim().toLowerCase();
    return equipmentList.filter((item) => {
      if (!fn(item)) return false;
      if (!q) return true;
      return [item.kodeAlat, item.namaPeralatan, item.kategori, item.lokasiPenyimpanan]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [equipmentList, filterKey, searchTerm]);

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

  const handleOpenDetail = (item: Equipment) => {
    setActiveItem(item);
    setDetailModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    handleRemoveImage();
    setFormData({
      kodeAlat: nextCode('ALAT-', equipmentList, 3),
      namaPeralatan: '',
      kategori: 'Pascapanen',
      jumlahStok: '',
      kondisi: 'Baik',
      status: 'Tersedia',
      lokasiPenyimpanan: '',
      tanggalPengadaan: new Date().toLocaleDateString('id-ID'),
      spesifikasi: '',
      fotoUrl: '',
      terakhirServis: new Date().toLocaleDateString('id-ID'),
    });
    setImagePreview('');
    setFormModalOpen(true);
  };

  const handleOpenEdit = (item: Equipment) => {
    setEditId(item.id);
    setFormData({ ...item });
    setSelectedImage(null);
    setImageError('');
    setImagePreview(item.fotoUrl || '');
    setFormModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalFotoUrl = formData.fotoUrl || imagePreview || '';
    const payload = { ...formData, fotoUrl: finalFotoUrl, jumlahStok: Number(formData.jumlahStok) || 0 };

    try {
      if (editId) {
        await equipmentApi.update(editId, payload);
        setToast({ msg: 'Data peralatan berhasil diperbarui.', type: 'success' });
      } else {
        await equipmentApi.create(payload);
        setToast({ msg: 'Data peralatan berhasil ditambahkan.', type: 'success' });
      }
      setFormModalOpen(false);
      handleRemoveImage();
      fetchEquipment();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan data peralatan.', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await equipmentApi.delete(deleteTarget.id);
      setToast({ msg: 'Data peralatan berhasil dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchEquipment();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus data peralatan.', type: 'error' });
    }
  };

  const resetFilters = () => {
    setFilterKey('dipakai');
  };

  const activeLabel = FILTERS.find((f) => f.key === filterKey)?.label || 'Sedang Dipakai';

  return (
    <div className="space-y-5 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">
            Sarana & Peralatan Mesin Sorgum
          </h1>
        </div>

        <div className="w-full sm:w-auto">
          <Button onClick={handleOpenAdd} icon={<Plus className="w-3.5 h-3.5" />} variant="primary" className="w-full sm:w-auto text-xs py-1.5 px-3 justify-center">
            Tambah Peralatan Baru
          </Button>
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL PERALATAN MESIN</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">{equipmentList.length} Unit Peralatan</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Mesin Olah & Pascapanen</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DB7C26]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">SEDANG DIPAKAI</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {equipmentList.filter((e) => e.status === 'Sedang Digunakan').length} Unit Dipakai
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Beroperasi aktif di lapangan</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#B42318]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">BUTUH PERBAIKAN / SERVIS</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {equipmentList.filter((e) => e.kondisi === 'Perlu Perbaikan' || e.kondisi === 'Rusak' || e.status === 'Dalam Perawatan').length} Unit Perawatan
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Jadwal perawatan rutin bengkel</p>
        </div>
      </div>

      {/* CRUD Equipment Table */}
      <div className="bg-white rounded-xl shadow-2xs border border-[#c4c8bb]/30 overflow-hidden">
        {/* Filter pill: 1 pilihan aktif, klik langsung memfilter */}
        <div className="p-3.5 sm:p-4 border-b border-[#c4c8bb]/20 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[#2C4219] text-sm mr-1">
              Daftar Inventaris Sarana Peralatan
            </h3>
            <span className="text-xs text-[#6B7280] font-medium">
              ({loading ? '...' : filteredList.length} unit tampil)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {FILTERS.map((f) => {
              const active = f.key === filterKey;
              const count = equipmentList.filter(filterFn[f.key]).length;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterKey(f.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                    active
                      ? 'bg-[#2C4219] text-white border-[#2C4219] shadow-sm'
                      : 'bg-[#F7F7F5] text-[#44483e] border-[#c4c8bb]/40 hover:bg-[#efe0d2]/60 hover:border-[#2C4219]/40'
                  }`}
                >
                  {f.icon}
                  {f.label}
                  <span
                    className={`px-1.5 rounded-full text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-[#efe0d2] text-[#2C4219]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[680px]">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-b border-[#c4c8bb]/20">
                <th className="py-2 px-3 pl-4">KODE ALAT</th>
                <th className="py-2 px-3">NAMA PERALATAN</th>
                <th className="py-2 px-3">KATEGORI</th>
                <th className="py-2 px-3">JUMLAH STOK</th>
                <th className="py-2 px-3">KONDISI</th>
                <th className="py-2 px-3">STATUS</th>
                <th className="py-2 px-3">TEMPAT PENYIMPANAN</th>
                <th className="py-2 px-3 pr-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 text-[#221A12] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                    <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                    Memuat data peralatan...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                    {equipmentList.length === 0
                      ? 'Tidak ada data peralatan yang ditemukan.'
                      : `Tidak ada peralatan pada filter "${activeLabel}".`}
                  </td>
                </tr>
              ) : (
              filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-[#F7F7F5] transition-colors">
                  <td className="py-2 px-3 pl-4 font-bold text-[#2C4219]">{item.kodeAlat}</td>
                  <td className="py-2 px-3 font-semibold">{item.namaPeralatan}</td>
                  <td className="py-2 px-3 text-[#6B7280]">{item.kategori}</td>
                  <td className="py-2 px-3 font-bold">{item.jumlahStok} Unit</td>
                  <td className="py-2 px-3">
                    <Badge
                      variant={
                        item.kondisi === 'Sangat Baik' || item.kondisi === 'Baik'
                          ? 'success'
                          : item.kondisi === 'Perlu Perbaikan'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {item.kondisi === 'Perlu Perbaikan' ? 'Butuh Perbaikan' : item.kondisi}
                    </Badge>
                  </td>
                  <td className="py-2 px-3">
                    <Badge
                      variant={
                        item.status === 'Sedang Digunakan'
                          ? 'info'
                          : item.status === 'Dalam Perawatan'
                          ? 'warning'
                          : 'sage'
                      }
                    >
                      {item.status === 'Sedang Digunakan' ? 'Sedang Dipakai' : item.status}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-[#44483e]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                      {item.lokasiPenyimpanan || <span className="text-[#9CA3AF]">-</span>}
                    </span>
                  </td>
                  <td className="py-2 px-3 pr-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Tombol aksi dengan teks agar mudah dipahami pengguna */}
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="min-h-8 px-2.5 py-1.5 text-[#2C4219] hover:bg-[#efe0d2] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                        title="Detail Data Alat"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Detail</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="min-h-8 px-2.5 py-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                        title="Edit Data Alat"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="min-h-8 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                        title="Hapus Peralatan"
                      >
                        <Trash2 className="w-4 h-4" />
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

        {/* Ringkasan hasil filter */}
        {!loading && filteredList.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-[#c4c8bb]/20 flex items-center justify-between gap-2 text-xs text-[#6B7280]">
            <span className="font-medium">
              Menampilkan {filteredList.length} unit ({activeLabel})
            </span>
            {filterKey !== 'dipakai' && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-[#2C4219] hover:bg-[#efe0d2]/60 border border-[#c4c8bb]/30 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" /> Kembali ke Sedang Dipakai
              </button>
            )}
          </div>
        )}
      </div>

      {/* ACTIVE DETAIL MODAL: "Detail Data Alat" */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail Data Alat & Mesin"
        subtitle={activeItem ? `${activeItem.kodeAlat} - ${activeItem.namaPeralatan}` : ''}
        maxWidth="xl"
      >
        {activeItem && (
          <div className="space-y-6 text-sm text-[#221A12]">
            {/* Real farm machinery / Hand tractor photo */}
            <div className="relative rounded-2xl overflow-hidden border border-[#c4c8bb]/30 shadow-md h-56 bg-[#fff8f4]">
              {activeItem.fotoUrl ? (
                <img
                  src={activeItem.fotoUrl}
                  alt={activeItem.namaPeralatan}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                  <Wrench className="w-12 h-12" />
                  <span className="text-xs font-semibold">Belum ada foto alat</span>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Badge variant="success">{activeItem.kondisi}</Badge>
              </div>
            </div>

            {/* Technical Details Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#fff8f4] rounded-2xl border border-[#c4c8bb]/20">
              <div>
                <p className="text-xs text-[#74796d] font-bold uppercase">Kode Peralatan</p>
                <p className="font-extrabold text-[#2C4219]">{activeItem.kodeAlat}</p>
              </div>
              <div>
                <p className="text-xs text-[#74796d] font-bold uppercase">Kategori</p>
                <p className="font-semibold">{activeItem.kategori}</p>
              </div>
              <div>
                <p className="text-xs text-[#74796d] font-bold uppercase">Jumlah Stok</p>
                <p className="font-extrabold">{activeItem.jumlahStok} Unit</p>
              </div>
              <div>
                <p className="text-xs text-[#74796d] font-bold uppercase">Status Operasional</p>
                <p className="font-bold text-[#172C05]">{activeItem.status}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[#74796d] font-bold uppercase">Lokasi Penyimpanan</p>
              <p className="font-medium">{activeItem.lokasiPenyimpanan}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[#74796d] font-bold uppercase">Deskripsi</p>
              <p className="p-3 bg-[#fff1e5] rounded-xl text-xs text-[#44483e] leading-relaxed border border-[#c4c8bb]/20">
                {activeItem.spesifikasi}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#c4c8bb]/20 text-xs text-[#74796d]">
              <span>Tanggal Pengadaan: {activeItem.tanggalPengadaan}</span>
              <span>Terakhir Servis: {activeItem.terakhirServis}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Add / Edit Form */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editId ? 'Edit Data Peralatan' : 'Tambah Peralatan Mesin Baru'}
        subtitle={editId ? 'Perbarui data alat & mesin' : 'Lengkapi data alat & mesin'}
        maxWidth="4xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setFormModalOpen(false)} className="px-6 py-3 text-sm">Batal</Button>
            <Button type="submit" form="peralatan-form" variant="primary" className="px-8 py-3 text-sm">
              {editId ? 'Simpan Perubahan' : 'Simpan Peralatan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-6" id="peralatan-form">
          {/* ── Bagian 1: Informasi Alat ───────────────────────────────── */}
          <div className="p-5 sm:p-6 bg-[#FFF8F4] border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">1</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Informasi Alat</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Kode Alat</label>
                <input
                  type="text"
                  value={formData.kodeAlat}
                  readOnly
                  disabled
                  placeholder={formData.kodeAlat ? '' : 'Otomatis — contoh: ALAT-001'}
                  title="Kode dibuat otomatis oleh sistem (auto-increment)"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold text-[#6B7280] cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Kategori</label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  <option value="Mesin Olah Tanah">Mesin Olah Tanah</option>
                  <option value="Pascapanen">Pascapanen</option>
                  <option value="Pengolahan Produk">Pengolahan Produk</option>
                  <option value="Pengeringan">Pengeringan</option>
                  <option value="Pengemasan">Pengemasan</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Nama Peralatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.namaPeralatan}
                  onChange={(e) => setFormData({ ...formData, namaPeralatan: e.target.value })}
                  placeholder="Contoh: Hand Tractor Quick G1000 Kubota"
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Bagian 2: Kondisi & Stok ───────────────────────────────── */}
          <div className="p-5 sm:p-6 bg-white border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">2</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Kondisi & Stok</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Jumlah Stok (Unit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.jumlahStok}
                  onChange={(e) => setFormData({ ...formData, jumlahStok: e.target.value })}
                  placeholder="Contoh: 3"
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Kondisi</label>
                <select
                  value={formData.kondisi}
                  onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  <option value="Sangat Baik">Sangat Baik</option>
                  <option value="Baik">Baik</option>
                  <option value="Perlu Perbaikan">Butuh Perbaikan</option>
                  <option value="Rusak">Rusak</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  <option value="Sedang Digunakan">Sedang Dipakai</option>
                  <option value="Tersedia">Tersedia</option>
                  <option value="Dalam Perawatan">Dalam Perawatan</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Tempat Penyimpanan</label>
                <input
                  type="text"
                  value={formData.lokasiPenyimpanan || ''}
                  onChange={(e) => setFormData({ ...formData, lokasiPenyimpanan: e.target.value })}
                  placeholder="Contoh: Gudang Alat Lahan A (Gubug Tani)"
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Upload Foto Peralatan (JPG/PNG Only) */}
          {/* ── Bagian 3: Detail & Foto ────────────────────────────────── */}
          <div className="p-5 sm:p-6 bg-white border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">3</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Detail & Foto</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Deskripsi Alat</label>
                <textarea
                  value={formData.spesifikasi}
                  onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
                  placeholder="Contoh: Traktor tangan untuk pengolahan lahan, cocok untuk membajak sawah kering"
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Foto Peralatan <span className="text-[11px] font-medium text-[#9CA3AF]">(JPG / PNG)</span>
                </label>

                {imagePreview ? (
                  <div className="relative p-3 bg-[#FFF8F4] border border-[#c4c8bb]/40 rounded-xl flex items-center justify-between gap-3 h-24">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Foto Peralatan"
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 object-cover rounded-lg border border-[#c4c8bb]/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#221A12] truncate">
                          {selectedImage?.name || 'Foto Peralatan Terpilih'}
                        </p>
                        <p className="text-[10px] text-[#74796d] font-semibold">
                          {selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : ''} • Format JPG/PNG
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('peralatan-foto-input')?.click()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2C4219] text-white text-[11px] font-bold hover:bg-[#213213] transition-colors shrink-0 cursor-pointer"
                      title="Ganti foto peralatan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="peralatan-foto-input"
                    className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-[#c4c8bb]/50 hover:border-[#2C4219] bg-[#fff1e5]/60 hover:bg-[#FFF8F4] rounded-2xl cursor-pointer transition-all text-center h-24"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-[#2C4219] block">
                        Klik untuk unggah foto
                      </span>
                      <span className="text-[11px] text-[#74796d] font-semibold">
                        .JPG, .JPEG, .PNG (Maks. 5 MB)
                      </span>
                    </div>
                  </label>
                )}

                {/* Input file selalu ada di DOM agar tombol Edit bisa memicunya */}
                <input
                  id="peralatan-foto-input"
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
          </div>

        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Hapus Data Peralatan"
          maxWidth="sm"
        >
          <div className="space-y-4 text-sm text-[#221A12]">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">
                  Apakah Anda yakin ingin menghapus data peralatan ini?
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                  <strong>{deleteTarget.kodeAlat}</strong> — {deleteTarget.namaPeralatan}.
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

      {/* Toast notifikasi */}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
