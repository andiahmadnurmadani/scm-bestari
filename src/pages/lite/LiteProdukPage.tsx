import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Boxes, Trash2, Pencil, Eye, Upload, X } from 'lucide-react';
import { productApi, Product } from '../../api/endpoints/productApi';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';

// Opsi satuan hasil — SAMA dengan opsi dropdown Satuan Hasil di form Olahan (Pro)
const SATUAN_HASIL_OPTIONS = ['Pouch', 'Kg', 'Botol', 'Box', 'Toples', 'Kemasan'];

export const LiteProdukPage: React.FC = () => {
  const [dataList, setDataList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [detailTarget, setDetailTarget] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    satuanHasil: 'Pouch',
    deskripsi: '',
  });

  // Foto produk (opsional)
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productApi.getAll();
      setDataList(res.data || []);
    } catch {
      setDataList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', satuanHasil: 'Pouch', deskripsi: '' });
    setImagePreview(null);
    setSelectedImage(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Product) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      satuanHasil: item.satuanHasil || 'Pouch',
      deskripsi: item.deskripsi || '',
    });
    setImagePreview(item.fotoUrl || null);
    setSelectedImage(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setToast({ msg: 'Nama produk wajib diisi.', type: 'error' });
      return;
    }
    setSaving(true);
    const payload: any = {
      name: formData.name.trim(),
      satuanHasil: formData.satuanHasil || 'Pouch',
      deskripsi: formData.deskripsi,
      fotoUrl: imagePreview, // base64 atau null
      isActive: true,
    };
    try {
      if (editingId) {
        await productApi.update(editingId, payload);
        setToast({ msg: 'Produk diperbarui.', type: 'success' });
      } else {
        await productApi.create(payload);
        setToast({ msg: 'Produk berhasil ditambahkan.', type: 'success' });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setImagePreview(null);
      setSelectedImage(null);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan produk.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await productApi.delete(deleteTarget.id);
      setToast({ msg: 'Produk dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus produk. Mungkin sudah dipakai olahan.', type: 'error' });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#172C05]">Produk Olahan</h1>
          <p className="text-xs text-[#6B7280]">Master data produk untuk dipakai saat mencatat olahan</p>
        </div>
        <Button onClick={handleOpenAdd} variant="primary">
          <Plus className="w-4 h-4" /> Tambah Produk
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-xs text-[#6B7280] py-10">Memuat data...</p>
      ) : dataList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#c4c8bb]/50">
          <Boxes className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-sm text-[#6B7280]">Belum ada produk olahan.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Klik "Tambah Produk" untuk membuat pilihan olahan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dataList.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#c4c8bb]/30 bg-[#C3E28D]/30 shrink-0 flex items-center justify-center text-[#2C4219]">
                {p.fotoUrl ? (
                  <img src={p.fotoUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Boxes className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#172C05] truncate">{p.name}</p>
                <p className="text-[11px] text-[#6B7280] truncate">
                  {p.satuanHasil ? `Satuan: ${p.satuanHasil}` : 'Satuan belum diatur'}
                  {p.isActive ? ' • Aktif' : ' • Nonaktif'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setDetailTarget(p)} title="Lihat" className="p-2 rounded-lg text-[#2C4219] hover:bg-[#C3E28D]/30 cursor-pointer">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleOpenEdit(p)} title="Edit" className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 cursor-pointer">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(p)} title="Hapus" className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? 'Edit Produk Olahan' : 'Tambah Produk Olahan'}
        subtitle="Produk ini akan muncul sebagai pilihan saat mencatat olahan"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Nama Produk *</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Tepung Sorgum 500g"
              className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Satuan Hasil (default)</label>
            <select
              value={formData.satuanHasil}
              onChange={(e) => setFormData({ ...formData, satuanHasil: e.target.value })}
              className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            >
              {SATUAN_HASIL_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="text-[11px] text-[#6B7280] mt-1">Satuan ini otomatis terisi di form olahan (contoh: Pouch, Botol, Kg).</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Deskripsi (opsional)</label>
            <textarea
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Deskripsi singkat produk olahan"
              rows={2}
              className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Foto Produk (opsional, JPG/PNG/WebP maks. 2MB)</label>
            {imagePreview ? (
              <div className="relative p-3 bg-[#FFF8F4] border border-[#c4c8bb]/40 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img src={imagePreview} alt="Foto Produk" className="w-12 h-12 object-cover rounded-lg border border-[#c4c8bb]/40 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#221A12] truncate">{selectedImage?.name || 'Foto Produk'}</p>
                    <p className="text-[10px] text-[#74796d] font-semibold">{selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : 'Foto lama'} • JPG/PNG/WebP</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => document.getElementById('lite-produk-foto-input')?.click()} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2C4219] text-white text-[11px] font-bold hover:bg-[#213213] transition-colors cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button type="button" onClick={handleRemoveImage} className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-100 transition-colors cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <label htmlFor="lite-produk-foto-input" className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#c4c8bb]/50 hover:border-[#2C4219] bg-[#fff1e5]/60 hover:bg-[#FFF8F4] rounded-2xl cursor-pointer transition-all text-center">
                <div className="w-9 h-9 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center mb-2">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#2C4219]">Klik untuk unggah foto</span>
                <span className="text-[10px] text-[#74796d] font-semibold mt-0.5">.JPG, .PNG, .WebP (Maks. 2 MB)</span>
              </label>
            )}
            <input id="lite-produk-foto-input" type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleImageChange} className="hidden" />
            {imageError && <p className="text-xs font-bold text-red-600 mt-1.5">{imageError}</p>}
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setEditingId(null); }}>Batal</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Produk'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detailTarget} onClose={() => setDetailTarget(null)} title={detailTarget?.name || 'Detail Produk'} maxWidth="sm">
        {detailTarget && (
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-[#F7F7F5] rounded-xl">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase">Satuan Hasil</p>
              <p className="text-[13px] font-semibold text-[#172C05] mt-0.5">{detailTarget.satuanHasil || '-'}</p>
            </div>
            <div className="p-3 bg-[#F7F7F5] rounded-xl">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase">Keterangan</p>
              <p className="text-[13px] text-[#44483e] mt-0.5">{detailTarget.deskripsi || '-'}</p>
            </div>
            <div className="p-3 bg-[#F7F7F5] rounded-xl">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase">Status</p>
              <p className={`text-[13px] font-semibold mt-0.5 ${detailTarget.isActive ? 'text-[#2C4219]' : 'text-[#9CA3AF]'}`}>
                {detailTarget.isActive ? 'Aktif (muncul di form olahan)' : 'Nonaktif'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Produk?" subtitle="Konfirmasi Penghapusan" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-[#44483e] leading-relaxed">
            Apakah Anda yakin ingin menghapus produk <b>{deleteTarget?.name}</b>? Produk yang sudah dipakai pada olahan tidak dapat dihapus — nonaktifkan saja.
          </p>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button type="button" variant="danger" onClick={confirmDelete}>Ya, Hapus</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
