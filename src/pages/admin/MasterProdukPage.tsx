import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Boxes,
  Pencil,
  Upload,
  Image as ImageIcon,
  X,
  AlertTriangle,
  Ruler,
} from 'lucide-react';
import { productApi, Product } from '../../api/endpoints/productApi';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { useAdminSearch } from '../../components/layout/AdminLayout';

// Opsi satuan hasil — SAMA dengan opsi dropdown Satuan Hasil di form Olahan
export const SATUAN_HASIL_OPTIONS = ['Pouch', 'Kg', 'Botol', 'Box', 'Toples', 'Kemasan'];

export const MasterProdukPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state (tambah/edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string; satuanHasil: string; deskripsi: string; isActive: boolean }>({
    name: '',
    satuanHasil: 'Pouch',
    deskripsi: '',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll();
      setProducts(res.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter pencarian (data master kecil, cukup di frontend)
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', satuanHasil: 'Pouch', deskripsi: '', isActive: true });
    setFormError(null);
    setImagePreview(null);
    setSelectedImage(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      satuanHasil: p.satuanHasil || 'Pouch',
      deskripsi: p.deskripsi,
      isActive: p.isActive,
    });
    setFormError(null);
    setImagePreview(p.fotoUrl || null);
    setSelectedImage(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Format file tidak didukung! Gunakan JPG/PNG/WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError('Ukuran file terlalu besar! Maksimal 2 MB.');
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama produk wajib diisi.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        satuanHasil: formData.satuanHasil || 'Pouch',
        deskripsi: formData.deskripsi,
        fotoUrl: imagePreview, // base64 atau null (jika dihapus)
        isActive: formData.isActive,
      };
      if (editingId) {
        await productApi.update(editingId, payload);
      } else {
        await productApi.create(payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setImagePreview(null);
      setSelectedImage(null);
      fetchProducts();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Gagal menyimpan produk.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || err?.message || 'Gagal menghapus produk.', type: 'error' });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Page Heading & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">
            Master Data Produk Olahan
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Daftar produk yang bisa dipakai saat mencatat batch olahan baru.
          </p>
        </div>

        <Button onClick={openCreateModal} icon={<Plus className="w-3.5 h-3.5 text-[#C3E28D]" />}>
          Tambah Produk
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-3xl">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL PRODUK</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5">{products.length}</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5">Terdaftar di master data</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">AKTIF</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5">
            {products.filter((p) => p.isActive).length}
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5">Produk tersedia untuk dipilih di form olahan</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-2xs border border-[#c4c8bb]/30 overflow-hidden">
        {/* Card Header */}
        <div className="p-3 sm:p-4 border-b border-[#c4c8bb]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C3E28D] flex items-center justify-center">
              <Boxes className="w-3.5 h-3.5 text-[#2C4219]" />
            </div>
            <h2 className="text-sm font-bold text-[#221A12]">Daftar Produk Olahan</h2>
          </div>

          <p className="text-[10px] text-[#74796d] font-medium">
            Gunakan kolom pencarian di bagian atas untuk mencari produk
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar px-1">
          <table className="w-full text-left text-xs min-w-[640px] border-collapse">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-y border-[#c4c8bb]/20">
                <th className="py-2.5 px-3 text-center align-middle w-[72px] whitespace-nowrap">GAMBAR</th>
                <th className="py-2.5 px-3 align-middle whitespace-nowrap">NAMA PRODUK</th>
                <th className="py-2.5 px-3 align-middle min-w-[240px]">DESKRIPSI</th>
                <th className="py-2.5 px-3 text-center align-middle w-[140px] whitespace-nowrap">SATUAN HASIL</th>
                <th className="py-2.5 px-3 text-center align-middle w-[90px] whitespace-nowrap">STATUS</th>
                <th className="py-2.5 px-3 text-center align-middle w-[168px] whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 font-medium text-[#221A12]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                    <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                    Memuat data produk...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                    Tidak ada produk yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-3 px-3 align-middle text-center">
                      <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#c4c8bb]/30 bg-[#F7F7F5] shrink-0 mx-auto flex items-center justify-center">
                        {p.fotoUrl ? (
                          <img
                            src={p.fotoUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#6B7280]">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-middle">
                      <span className="font-bold text-[#172C05] leading-snug">{p.name}</span>
                    </td>
                    <td className="py-3 px-3 align-middle text-[#44483e] min-w-[240px] max-w-[380px] whitespace-normal break-words leading-relaxed">
                      {p.deskripsi ? <span className="inline-block">{p.deskripsi}</span> : <span className="text-[#9CA3AF]">—</span>}
                    </td>
                    <td className="py-3 px-3 align-middle text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fff1e5] text-[#2C4219] text-[11px] font-bold leading-none">
                        <Ruler className="w-3 h-3" />
                        {p.satuanHasil || 'Pouch'}
                      </span>
                    </td>
                    <td className="py-3 px-3 align-middle text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                          p.isActive ? 'bg-[#C3E28D] text-[#172C05]' : 'bg-[#F7F7F5] text-[#9CA3AF]'
                        }`}
                      >
                        {p.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-3 align-middle text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit Produk"
                          className="min-h-8 px-2.5 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#C3E28D]/40 hover:border-[#2C4219] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-[11px] font-bold leading-none"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          title="Hapus Produk"
                          className="min-h-8 px-2.5 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 text-[11px] font-bold leading-none"
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
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? 'Edit Produk Olahan' : 'Tambah Produk Olahan'}
        subtitle="Produk ini akan muncul sebagai pilihan saat mencatat batch olahan baru"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Nama Produk
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Tepung Sorgum Bioguma 500g"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
              required
            />
            <p className="text-[11px] text-[#6B7280] mt-1">
              Nama ini akan otomatis terisi di form olahan saat produk dipilih.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Satuan Hasil (default)
            </label>
            <select
              value={formData.satuanHasil}
              onChange={(e) => setFormData({ ...formData, satuanHasil: e.target.value })}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
            >
              {SATUAN_HASIL_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#6B7280] mt-1">
              Satuan ini otomatis terisi di form olahan saat produk dipilih (contoh: Pouch, Botol, Kg).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Deskripsi (opsional)
            </label>
            <textarea
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Deskripsi singkat produk olahan"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold h-20"
            />
          </div>

          {/* Upload Gambar Produk */}
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Foto Produk (opsional, JPG/PNG/WebP maks. 2MB)
            </label>

            {imagePreview ? (
              <div className="relative p-3 bg-[#FFF8F4] border border-[#c4c8bb]/40 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Foto Produk"
                    className="w-14 h-14 object-cover rounded-lg border border-[#c4c8bb]/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#221A12] truncate">
                      {selectedImage?.name || 'Foto Produk'}
                    </p>
                    <p className="text-[10px] text-[#74796d] font-semibold">
                      {selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : 'Foto lama'} • JPG/PNG/WebP
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => document.getElementById('produk-foto-input')?.click()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2C4219] text-white text-[11px] font-bold hover:bg-[#213213] transition-colors cursor-pointer"
                    title="Ganti foto produk"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-100 transition-colors cursor-pointer"
                    title="Hapus foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="produk-foto-input"
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#c4c8bb]/50 hover:border-[#2C4219] bg-[#fff1e5]/60 hover:bg-[#FFF8F4] rounded-2xl cursor-pointer transition-all text-center"
              >
                <div className="w-10 h-10 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#2C4219]">
                  Klik untuk unggah foto atau seret ke sini
                </span>
                <span className="text-[11px] text-[#74796d] font-semibold mt-0.5">
                  Format yang didukung: <strong className="text-[#2C4219]">.JPG, .PNG, .WebP</strong> (Maks. 2 MB)
                </span>
              </label>
            )}

            {/* Input file selalu ada di DOM agar tombol Edit bisa memicunya */}
            <input
              id="produk-foto-input"
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            {imageError && (
              <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {imageError}
              </p>
            )}
          </div>

          {formError && (
            <p className="text-xs font-bold text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c4c8bb]/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingId(null);
                handleRemoveImage();
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Hapus Produk"
          maxWidth="sm"
        >
          <div className="space-y-4 text-sm text-[#221A12]">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">
                  Apakah Anda yakin ingin menghapus produk <strong>{deleteTarget.name}</strong>?
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                  Tindakan ini tidak dapat dibatalkan. Produk yang sudah dipakai pada batch olahan tidak dapat
                  dihapus — nonaktifkan saja.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#c4c8bb]/20">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Batal
              </Button>
              <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
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
