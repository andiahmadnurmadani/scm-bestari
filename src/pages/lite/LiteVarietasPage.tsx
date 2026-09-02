import React, { useEffect, useState } from 'react';
import { Leaf, Plus, Search, X, Camera, Edit3, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { varietyApi, Variety } from '../../api/endpoints/varietyApi';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { LITE_CSS } from './liteDesign';

const DEFAULT_FORM = {
  name: '',
  description: '',
  lamaPanen: '',
  imageUrl: '',
};

// Badge lama panen
const getLamaPanenBadge = (hari?: number | null) => {
  if (!hari) return { label: '-', color: 'bg-gray-100 text-gray-600' };
  if (hari <= 90) return { label: `${hari} hari`, color: 'bg-green-100 text-green-700' };
  if (hari <= 120) return { label: `${hari} hari`, color: 'bg-amber-100 text-amber-700' };
  return { label: `${hari} hari`, color: 'bg-blue-100 text-blue-700' };
};

export const LiteVarietasPage: React.FC = () => {
  const [dataList, setDataList] = useState<Variety[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Variety | null>(null);
  const [editTarget, setEditTarget] = useState<Variety | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Variety | null>(null);
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);

  // Pagination lokal
  const [page, setPage] = useState(1);
  const limit = 9;

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await varietyApi.getAll();
      setDataList(res.data || []);
    } catch {
      setDataList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setFormData({ ...DEFAULT_FORM });
    setModalOpen(true);
  };

  const openEdit = (item: Variety) => {
    setEditTarget(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      lamaPanen: item.lamaPanen ? String(item.lamaPanen) : '',
      imageUrl: item.imageUrl || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      setToast({ msg: 'Mohon isi Nama Varietas.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        lamaPanen: formData.lamaPanen ? Number(formData.lamaPanen) : undefined,
        imageUrl: formData.imageUrl || null,
      };
      if (editTarget) {
        await varietyApi.update(editTarget.id, payload);
        setToast({ msg: 'Varietas berhasil diperbarui!', type: 'success' });
      } else {
        await varietyApi.create(payload);
        setToast({ msg: 'Varietas baru berhasil ditambahkan!', type: 'success' });
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan varietas.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await varietyApi.delete(deleteTarget.id);
      setToast({ msg: 'Varietas berhasil dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch {
      setToast({ msg: 'Gagal menghapus varietas.', type: 'error' });
    }
  };

  // Filter & paginate lokal
  const filtered = dataList.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={LITE_CSS.pageTitle}>
            <Leaf className="w-7 h-7 text-[#2C4219]" /> Varietas Sorgum
          </h1>
        </div>
        <button
          onClick={openAdd}
          className={LITE_CSS.btnPrimary + ' shrink-0'}
        >
          <Plus className="w-5 h-5" /> Tambah Varietas Baru
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E988F]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          placeholder="Cari nama varietas sorgum..."
          className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#ECE7DF] rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 shadow-2xs"
        />
      </div>

      {/* Grid Katalog Varietas */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-60 bg-white rounded-3xl border border-[#ECE7DF] animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className={LITE_CSS.emptyState}>
          <Leaf className="w-14 h-14 text-[#C3E28D] mx-auto mb-3" />
          <p className="text-lg font-bold text-[#172C05]">Belum ada varietas sorgum</p>
          <p className="text-sm text-[#70766B] mt-1">Tambahkan varietas sorgum yang dibudidayakan kelompok tani</p>
          <button onClick={openAdd} className={LITE_CSS.btnPrimary + ' shrink-0 mt-4'}>
            <Plus className="w-4 h-4" /> Tambah Varietas Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((item) => {
            const lamaBadge = getLamaPanenBadge(item.lamaPanen);
            return (
              <div key={item.id} className="bg-white rounded-3xl border border-[#ECE7DF] shadow-[0_4px_20px_rgba(44,66,25,0.03)] hover:shadow-[0_8px_30px_rgba(44,66,25,0.06)] hover:border-[#D9D2C5] transition-all flex flex-col overflow-hidden">
                {/* Foto atau placeholder */}
                {item.imageUrl ? (
                  <div className="h-40 overflow-hidden">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-[#EBF7EE] to-[#C3E28D]/20 flex items-center justify-center">
                    <Leaf className="w-14 h-14 text-[#2C4219]/40" />
                  </div>
                )}

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-black text-[#172C05] leading-tight">{item.name}</h3>
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${lamaBadge.color}`}>
                        {lamaBadge.label}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs sm:text-sm text-[#70766B] leading-relaxed line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

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
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className={LITE_CSS.actionDelete}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-[#6B7280]">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2.5 rounded-xl bg-white border border-[#c4c8bb]/30 disabled:opacity-40 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-2.5 rounded-xl bg-white border border-[#c4c8bb]/30 disabled:opacity-40 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Detail Varietas */}
      <Modal isOpen={!!detailTarget} onClose={() => setDetailTarget(null)} title={detailTarget?.name || 'Detail Varietas'} subtitle="Informasi Varietas Sorgum">
        {detailTarget && (
          <div className="space-y-4">
            {detailTarget.imageUrl && (
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-[#c4c8bb]/20">
                <img src={detailTarget.imageUrl} alt={detailTarget.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 bg-[#fff8f4] p-4 rounded-2xl border border-[#c4c8bb]/20">
              <div>
                <span className="text-[11px] text-[#9CA3AF] uppercase font-bold block">NAMA VARIETAS</span>
                <span className="text-sm font-bold text-[#172C05]">{detailTarget.name}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#9CA3AF] uppercase font-bold block">LAMA PANEN</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${getLamaPanenBadge(detailTarget.lamaPanen).color}`}>
                  {getLamaPanenBadge(detailTarget.lamaPanen).label}
                </span>
              </div>
            </div>
            {detailTarget.description && (
              <div className="bg-white p-4 rounded-2xl border border-[#c4c8bb]/20">
                <span className="text-[11px] text-[#9CA3AF] uppercase font-bold block mb-1">DESKRIPSI & KARAKTERISTIK</span>
                <p className="text-sm text-[#44483e] leading-relaxed">{detailTarget.description}</p>
              </div>
            )}
            <button onClick={() => setDetailTarget(null)} className={LITE_CSS.btnSecondary + ' w-full'}>Tutup</button>
          </div>
        )}
      </Modal>

      {/* Modal Tambah / Edit */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Varietas' : 'Tambah Varietas Baru'} subtitle="Isi informasi varietas sorgum">
        <div className="space-y-4">
          <div>
            <label className={LITE_CSS.label}>Nama Varietas <span className="text-red-500">*</span></label>
            <input type="text" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} placeholder="Contoh: Numbu" className={LITE_CSS.input} />
          </div>
          <div>
            <label className={LITE_CSS.label}>Lama Masa Panen (Hari)</label>
            <input type="number" value={formData.lamaPanen} onChange={(e) => setFormData((f) => ({ ...f, lamaPanen: e.target.value }))} placeholder="Contoh: 90" min="0" className={LITE_CSS.input} />
          </div>
          <div>
            <label className={LITE_CSS.label}>Deskripsi & Karakteristik (opsional)</label>
            <textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Contoh: Cocok untuk lahan kering, produktivitas tinggi..." className={LITE_CSS.textarea} />
          </div>

          {/* Upload Foto */}
          <div>
            <label className={LITE_CSS.label}>Foto Varietas (opsional)</label>
            {formData.imageUrl ? (
              <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-[#c4c8bb]/30 group">
                <img src={formData.imageUrl} alt="Foto varietas" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setFormData((f) => ({ ...f, imageUrl: '' }))} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#c4c8bb]/60 rounded-2xl bg-[#fff1e5] hover:bg-[#C3E28D]/20 cursor-pointer transition-colors">
                <Camera className="w-6 h-6 text-[#2C4219] mb-1" />
                <span className="text-xs font-bold text-[#2C4219]">Ketuk untuk Upload Foto</span>
                <span className="text-[10px] text-[#6B7280]">JPG, PNG, WebP — Maks 2MB</span>
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) { setToast({ msg: 'Ukuran foto maksimal 2MB', type: 'error' }); return; }
                  const reader = new FileReader();
                  reader.onload = (ev) => setFormData((f) => ({ ...f, imageUrl: ev.target?.result as string }));
                  reader.readAsDataURL(file);
                }} />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2 border-t border-[#c4c8bb]/20">
            <button type="button" onClick={() => setModalOpen(false)} className={LITE_CSS.btnSecondary + ' flex-1'}>Batal</button>
            <button type="button" onClick={handleSave} disabled={saving} className={LITE_CSS.btnPrimary + ' flex-1'}>
              {saving ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Simpan Varietas'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Hapus */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Varietas?" subtitle="Tindakan ini tidak bisa dibatalkan">
        <div className="space-y-5">
          <p className="text-base text-[#44483e]">Yakin ingin menghapus varietas <strong>{deleteTarget?.name}</strong>?</p>
          <div className="flex gap-3 pt-2 border-t border-[#c4c8bb]/20">
            <button onClick={() => setDeleteTarget(null)} className={LITE_CSS.btnSecondary + ' flex-1'}>Batal</button>
            <button onClick={handleDelete} className={LITE_CSS.btnDanger + ' flex-1'}>Ya, Hapus</button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
