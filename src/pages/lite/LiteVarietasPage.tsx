import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Database, Trash2, Pencil, Eye } from 'lucide-react';
import { varietyApi, Variety } from '../../api/endpoints/varietyApi';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import { LiteImageUpload } from '../../components/common/LiteImageUpload';

export const LiteVarietasPage: React.FC = () => {
  const [dataList, setDataList] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Variety | null>(null);
  const [detailTarget, setDetailTarget] = useState<Variety | null>(null);

  const [formData, setFormData] = useState({ name: '', lamaPanen: '', description: '' });

  // Foto varietas (opsional)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await varietyApi.getAll();
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

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', lamaPanen: '', description: '' });
    setImagePreview(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Variety) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      lamaPanen: item.lamaPanen != null ? String(item.lamaPanen) : '',
      description: item.description || '',
    });
    setImagePreview(item.imageUrl || null);
    setImageError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setToast({ msg: 'Nama varietas wajib diisi.', type: 'error' });
      return;
    }
    const payload: any = {
      name: formData.name.trim(),
      lamaPanen: formData.lamaPanen ? Number(formData.lamaPanen) : undefined,
      description: formData.description,
      imageUrl: imagePreview, // base64 atau null
    };
    try {
      if (editingId) {
        await varietyApi.update(editingId, payload);
        setToast({ msg: 'Varietas diperbarui.', type: 'success' });
      } else {
        await varietyApi.create(payload);
        setToast({ msg: 'Varietas berhasil ditambahkan.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan varietas.', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await varietyApi.delete(deleteTarget.id);
      setToast({ msg: 'Varietas dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus varietas.', type: 'error' });
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#172C05]">Varietas Sorgum</h1>
          <p className="text-xs text-[#6B7280]">Master data varietas yang digunakan</p>
        </div>
        <Button onClick={handleOpenAdd} variant="primary">
          <Plus className="w-4 h-4" /> Tambah Varietas
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-xs text-[#6B7280] py-10">Memuat data...</p>
      ) : dataList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#c4c8bb]/50">
          <Database className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-sm text-[#6B7280]">Belum ada varietas terdaftar.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Klik "Tambah Varietas" untuk menambah.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dataList.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#c4c8bb]/30 bg-[#C3E28D]/30 text-[#2C4219] flex items-center justify-center shrink-0">
                {v.imageUrl ? (
                  <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Database className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#172C05] truncate">{v.name}</p>
                <p className="text-[11px] text-[#6B7280]">
                  {v.lamaPanen ? `Panen ± ${v.lamaPanen} hari` : 'Lama panen belum diatur'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setDetailTarget(v)} title="Lihat" className="p-2 rounded-lg text-[#2C4219] hover:bg-[#C3E28D]/30 cursor-pointer">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleOpenEdit(v)} title="Edit" className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 cursor-pointer">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteTarget(v)} title="Hapus" className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer">
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
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Varietas' : 'Tambah Varietas'}
        subtitle="Data varietas sorgum"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Nama Varietas *</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Super 1"
              className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Lama Panen (hari)</label>
            <input
              type="number"
              value={formData.lamaPanen}
              onChange={(e) => setFormData({ ...formData, lamaPanen: e.target.value })}
              placeholder="Contoh: 90"
              className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Keterangan</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat varietas"
              rows={2}
              className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <LiteImageUpload
            id="lite-varietas-foto-input"
            label="Foto Varietas (opsional)"
            value={imagePreview}
            onChange={setImagePreview}
            error={imageError}
          />
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary">{editingId ? 'Simpan Perubahan' : 'Tambah Varietas'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detailTarget} onClose={() => setDetailTarget(null)} title={detailTarget?.name || 'Detail Varietas'} maxWidth="sm">
        {detailTarget && (
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-[#F7F7F5] rounded-xl">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase">Lama Panen</p>
              <p className="text-[13px] font-semibold text-[#172C05] mt-0.5">{detailTarget.lamaPanen ? `${detailTarget.lamaPanen} hari` : '-'}</p>
            </div>
            <div className="p-3 bg-[#F7F7F5] rounded-xl">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase">Keterangan</p>
              <p className="text-[13px] text-[#44483e] mt-0.5">{detailTarget.description || '-'}</p>
            </div>
            {detailTarget.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-[#c4c8bb]/30">
                <img src={detailTarget.imageUrl} alt={`Foto varietas ${detailTarget.name}`} className="w-full max-h-60 object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Varietas?" subtitle="Konfirmasi Penghapusan" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-[#44483e] leading-relaxed">
            Apakah Anda yakin ingin menghapus varietas <b>{deleteTarget?.name}</b>?
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
