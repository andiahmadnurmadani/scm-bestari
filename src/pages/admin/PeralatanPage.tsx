import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Eye, Edit3, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Upload, X, ChevronLeft, ChevronRight, Sprout, MapPin } from 'lucide-react';
import { equipmentApi } from '../../api/endpoints/equipmentApi';
import { Equipment } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { nextCode } from '../../utils/kodeGenerator';

export const PeralatanPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<Equipment | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null); // Data yang akan dihapus

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // 10 baris per halaman
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Image Upload States
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Equipment>>({
    kodeAlat: '',
    namaPeralatan: '',
    kategori: 'Mesin Olah Tanah',
    jumlahStok: 1,
    kondisi: 'Sangat Baik',
    status: 'Tersedia',
    lokasiPenyimpanan: '',
    tanggalPengadaan: new Date().toLocaleDateString('id-ID'),
    spesifikasi: '',
    fotoUrl: '',
    terakhirServis: new Date().toLocaleDateString('id-ID'),
  });

  const fetchEquipment = async (targetPage = page, search = searchTerm) => {
    setLoading(true);
    try {
      const res = await equipmentApi.getAll({
        page: targetPage,
        limit,
        search: search || undefined,
      });
      setEquipmentList(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setEquipmentList([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset ke halaman 1 saat search berubah
  }, [searchTerm]);

  useEffect(() => {
    fetchEquipment(page, searchTerm);
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
      jumlahStok: 1,
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
    const payload = { ...formData, fotoUrl: finalFotoUrl };

    if (editId) {
      await equipmentApi.update(editId, payload);
    } else {
      await equipmentApi.create(payload);
    }
    setFormModalOpen(false);
    handleRemoveImage();
    fetchEquipment();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await equipmentApi.delete(deleteTarget.id);
    setDeleteTarget(null);
    fetchEquipment();
  };

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    setPage(targetPage);
  };

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

        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">KONDISI BAIK & SIAP OPERASI</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {equipmentList.filter((e) => e.kondisi === 'Sangat Baik' || e.kondisi === 'Baik').length} Unit Ready
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Berfungsi optimal di lapangan</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">PERLU PERBAIKAN / SERVIS</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {equipmentList.filter((e) => e.kondisi === 'Perlu Perbaikan' || e.status === 'Dalam Perawatan').length} Unit Perawatan
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Jadwal perawatan rutin bengkel</p>
        </div>
      </div>

      {/* CRUD Equipment Table */}
      <div className="bg-white rounded-xl shadow-2xs border border-[#c4c8bb]/30 overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-[#c4c8bb]/20 flex items-center justify-between">
          <h3 className="font-semibold text-[#2C4219] text-sm">
            Daftar Inventaris Sarana Peralatan
          </h3>
          <span className="text-xs text-[#6B7280] font-medium">
            Menampilkan {loading ? '...' : equipmentList.length} dari {total} unit peralatan
          </span>
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
                <th className="py-2 px-3 pr-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 text-[#221A12] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B7280]">
                    <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                    Memuat data peralatan...
                  </td>
                </tr>
              ) : equipmentList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B7280]">
                    Tidak ada data peralatan yang ditemukan.
                  </td>
                </tr>
              ) : (
              equipmentList.map((item) => (
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
                      {item.kondisi}
                    </Badge>
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Tersedia'
                          ? 'bg-[#C3E28D]/50 text-[#172C05]'
                          : item.status === 'Sedang Digunakan'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 pr-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* 3 Action Icons: Eye (Detail), Pencil (Edit), Trash (Delete) */}
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="p-1 text-[#2C4219] hover:bg-[#efe0d2] rounded transition-colors cursor-pointer"
                        title="Detail Data Alat"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Data Alat"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Peralatan"
                      >
                        <Trash2 className="w-4 h-4" />
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
              Menampilkan {equipmentList.length === 0 ? 0 : (page - 1) * limit + 1}-
              {Math.min(page * limit, total)} dari {total} unit
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
                      ? 'bg-[#2C4219] text-white'
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
              <p className="text-xs text-[#74796d] font-bold uppercase">Spesifikasi Teknik</p>
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
        subtitle="Input data spesifikasi teknis dan stok alat"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kode Alat
              </label>
              <input
                type="text"
                value={formData.kodeAlat}
                readOnly
                disabled
                title="Kode dibuat otomatis oleh sistem (auto-increment)"
                className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm text-[#2C4219] font-bold cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kategori
              </label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="Mesin Olah Tanah">Mesin Olah Tanah</option>
                <option value="Pascapanen">Pascapanen</option>
                <option value="Pengolahan Produk">Pengolahan Produk</option>
                <option value="Pengeringan">Pengeringan</option>
                <option value="Pengemasan">Pengemasan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Nama Peralatan
            </label>
            <input
              type="text"
              value={formData.namaPeralatan}
              onChange={(e) => setFormData({ ...formData, namaPeralatan: e.target.value })}
              placeholder="Contoh: Hand Tractor Quick G1000 Kubota"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Stok (Unit)
              </label>
              <input
                type="number"
                value={formData.jumlahStok}
                onChange={(e) => setFormData({ ...formData, jumlahStok: Number(e.target.value) })}
                placeholder="Contoh: 3"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kondisi
              </label>
              <select
                value={formData.kondisi}
                onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="Sangat Baik">Sangat Baik</option>
                <option value="Baik">Baik</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                <option value="Rusak">Rusak</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="Tersedia">Tersedia</option>
                <option value="Sedang Digunakan">Sedang Digunakan</option>
                <option value="Dalam Perawatan">Dalam Perawatan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Spesifikasi Teknis
            </label>
            <textarea
              value={formData.spesifikasi}
              onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
              placeholder="Contoh: Diesel 7.5 HP, kapasitas olah 2 Ha/jam"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm h-20"
            />
          </div>

          {/* Upload Foto Peralatan (JPG/PNG Only) */}
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Foto Peralatan (Khusus JPG / PNG)
            </label>

            {imagePreview ? (
              <div className="relative p-3 bg-[#FFF8F4] border border-[#c4c8bb]/40 rounded-xl flex items-center justify-between gap-3">
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
                  Klik untuk unggah foto peralatan atau seret ke sini
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
            <Button type="button" variant="outline" onClick={() => setFormModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              {editId ? 'Perbarui Alat' : 'Simpan Peralatan'}
            </Button>
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
    </div>
  );
};
