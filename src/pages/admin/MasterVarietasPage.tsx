import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Sprout, CheckCircle2, XCircle, Pencil, Upload, Image as ImageIcon, X, AlertTriangle } from 'lucide-react';
import { varietyApi, Variety } from '../../api/endpoints/varietyApi';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { useAdminSearch } from '../../components/layout/AdminLayout';

export const MasterVarietasPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [varieties, setVarieties] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state (tambah/edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Variety | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVarieties = useCallback(async () => {
    setLoading(true);
    try {
      const res = await varietyApi.getAll();
      setVarieties(res.data || []);
    } catch {
      setVarieties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVarieties();
  }, [fetchVarieties]);

  // Filter pencarian (data master kecil, cukup di frontend) —
  // sinkron dengan search bar global di header.
  const filtered = varieties.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setFormError(null);
    setImagePreview(null);
    setSelectedImage(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (v: Variety) => {
    setEditingId(v.id);
    setFormData({ name: v.name, description: v.description });
    setFormError(null);
    setImagePreview(v.imageUrl || null);
    setSelectedImage(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setImageError('Format file tidak didukung! Gunakan JPG/PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Ukuran file terlalu besar! Maksimal 5 MB.');
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
      setFormError('Nama varietas wajib diisi.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        imageUrl: imagePreview, // base64 atau null (jika dihapus)
      };
      if (editingId) {
        await varietyApi.update(editingId, payload);
      } else {
        await varietyApi.create(payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setImagePreview(null);
      setSelectedImage(null);
      fetchVarieties();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Gagal menyimpan varietas.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await varietyApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchVarieties();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || err?.message || 'Gagal menghapus varietas.', type: 'error' });
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
            Master Data Varietas Sorgum
          </h1>
          <p className="text-xs text-[#6B7280] font-medium mt-0.5">
            Kelola daftar varietas sorgum yang digunakan di seluruh modul (Panen, Lahan, Produksi)
          </p>
        </div>

        <Button onClick={openCreateModal} icon={<Plus className="w-3.5 h-3.5 text-[#C3E28D]" />}>
          Tambah Varietas
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL VARIETAS</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5">{varieties.length}</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5">Terdaftar di master data</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">DIGUNAKAN DI PANEN</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5">6+</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5">Varietas aktif di data panen</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">STATUS</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5">
            {varieties.filter((v) => v.isActive).length} Aktif
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5">Semua varietas aktif</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-2xs border border-[#c4c8bb]/30 overflow-hidden">
        {/* Card Header */}
        <div className="p-3 sm:p-4 border-b border-[#c4c8bb]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C3E28D] flex items-center justify-center">
              <Sprout className="w-3.5 h-3.5 text-[#2C4219]" />
            </div>
            <h2 className="text-sm font-bold text-[#221A12]">Daftar Varietas</h2>
          </div>

          <p className="text-[10px] text-[#74796d] font-medium">
            Gunakan kolom pencarian di bagian atas untuk mencari varietas
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar px-1">
          <table className="w-full text-left text-xs min-w-[560px]">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-y border-[#c4c8bb]/20">
                <th className="py-2 px-3">GAMBAR</th>
                <th className="py-2 px-3">NAMA VARIETAS</th>
                <th className="py-2 px-3">DESKRIPSI</th>
                <th className="py-2 px-3 text-center">STATUS</th>
                <th className="py-2 px-3 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 font-medium text-[#221A12]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                    <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                    Memuat data varietas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                    Tidak ada varietas yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#c4c8bb]/30 bg-[#F7F7F5] shrink-0">
                        {v.imageUrl ? (
                          <img
                            src={v.imageUrl}
                            alt={v.name}
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
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172C05]">{v.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#44483e] max-w-xs">
                      {v.description || <span className="text-[#9CA3AF]">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {v.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D1E6A5] text-[#2C4219] text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold">
                          <XCircle className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(v)}
                          title="Edit Varietas"
                          className="min-h-8 px-2.5 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#C3E28D]/40 hover:border-[#2C4219] transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(v)}
                          title="Hapus Varietas"
                          className="min-h-8 px-2.5 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
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
        title={editingId ? 'Edit Varietas Sorgum' : 'Tambah Varietas Sorgum'}
        subtitle="Nama varietas akan muncul di dropdown modul Panen, Lahan, dan Produksi"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Nama Varietas
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Sorgum Bioguma 1"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Deskripsi (opsional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat karakteristik varietas"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold h-20"
            />
          </div>

          {/* Upload Gambar Varietas */}
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Gambar Varietas (opsional, JPG/PNG maks. 5MB)
            </label>

            {imagePreview ? (
              <div className="relative p-3 bg-[#FFF8F4] border border-[#c4c8bb]/40 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Gambar Varietas"
                    className="w-14 h-14 object-cover rounded-lg border border-[#c4c8bb]/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#221A12] truncate">
                      {selectedImage?.name || 'Gambar Varietas'}
                    </p>
                    <p className="text-[10px] text-[#74796d] font-semibold">
                      {selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : 'Foto lama'} • JPG/PNG
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('varietas-gambar-input')?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2C4219] text-white text-[11px] font-bold hover:bg-[#213213] transition-colors shrink-0 cursor-pointer"
                  title="Ganti gambar varietas"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            ) : (
              <label
                htmlFor="varietas-gambar-input"
                className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#c4c8bb]/50 hover:border-[#2C4219] bg-[#fff1e5]/60 hover:bg-[#FFF8F4] rounded-2xl cursor-pointer transition-all text-center"
              >
                <div className="w-10 h-10 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#2C4219]">
                  Klik untuk unggah gambar atau seret ke sini
                </span>
                <span className="text-[11px] text-[#74796d] font-semibold mt-0.5">
                  Format yang didukung: <strong className="text-[#2C4219]">.JPG, .JPEG, .PNG</strong> (Maks. 5 MB)
                </span>
              </label>
            )}

            {/* Input file selalu ada di DOM agar tombol Edit bisa memicunya */}
            <input
              id="varietas-gambar-input"
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
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Varietas'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Hapus Varietas"
          maxWidth="sm"
        >
          <div className="space-y-4 text-sm text-[#221A12]">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">
                  Apakah Anda yakin ingin menghapus varietas <strong>{deleteTarget.name}</strong>?
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                  Tindakan ini tidak dapat dibatalkan. Varietas yang sedang digunakan oleh data panen tidak
                  dapat dihapus.
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
