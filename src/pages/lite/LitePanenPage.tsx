import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Sprout, Pencil, Trash2, Eye, MapPin, Warehouse as WarehouseIcon, Clock } from 'lucide-react';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { landApi } from '../../api/endpoints/landApi';
import { plantingApi } from '../../api/endpoints/plantingApi';
import { warehouseApi } from '../../api/endpoints/warehouseApi';
import { HarvestRecord, LandPlot, Planting, Warehouse } from '../../types';
import { useUnitSettings } from '../../context/UnitSettingsContext';
import { formatTanggalId } from '../../utils/dateUtils';
import { useLiteSearch } from '../../components/layout/lite/LiteLayout';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import { LiteImageUpload } from '../../components/common/LiteImageUpload';

export const LitePanenPage: React.FC = () => {
  const { searchTerm } = useLiteSearch();
  const { formatBerat, beratKeKg, beratSuffix } = useUnitSettings();
  const [dataList, setDataList] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [landOptions, setLandOptions] = useState<LandPlot[]>([]);
  const [gudangOptions, setGudangOptions] = useState<Warehouse[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HarvestRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<HarvestRecord | null>(null);

  const [formData, setFormData] = useState({
    lahanId: '',
    plantingId: '',
    namaLahan: '',
    varietas: '',
    tanggalPanen: new Date().toISOString().split('T')[0],
    tonase: '',
    petaniPenanggungJawab: '',
    catatan: '',
    panenKe: 1,
  });
  const [usedPanenKe, setUsedPanenKe] = useState<number[]>([]);
  const [gudangId, setGudangId] = useState('');
  const [plantingsForForm, setPlantingsForForm] = useState<Planting[]>([]);
  const [selectedPlanting, setSelectedPlanting] = useState<Planting | null>(null);
  const [activePlantings, setActivePlantings] = useState<Planting[]>([]);

  // Panen terpilih per grup (dropdown Panen Ke-?)
  const [selectedHarvestId, setSelectedHarvestId] = useState<string | null>(null);

  // Foto hasil panen (opsional)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await harvestApi.getAll({ page: 1, limit: 100, search: searchTerm || undefined });
      setDataList(res.data || []);
      setSelectedHarvestId(null); // reset pilihan grup saat daftar berubah
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat data panen.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Kelompokkan panen berdasarkan penanaman (ratoon 1/3, 2/3, 3/3 dalam satu grup)
  const groups = React.useMemo(() => {
    const byKey = new Map<string, HarvestRecord[]>();
    for (const item of dataList) {
      const key = item.plantingId ? `planting:${item.plantingId}` : `lahan:${item.namaLahan || 'tanpa-lahan'}`;
      const arr = byKey.get(key) || [];
      arr.push(item);
      byKey.set(key, arr);
    }
    return Array.from(byKey.entries())
      .map(([key, items]) => {
        // urutkan panen ke-1, ke-2, ke-3 (yang tanpa panenKe dianggap 1)
        const sorted = [...items].sort((a, b) => (Number((a as any).panenKe) || 1) - (Number((b as any).panenKe) || 1));
        const head = sorted[0];
        return { key, items: sorted, head, totalKg: sorted.reduce((s, x) => s + (Number(x.jumlahHasilKg) || 0), 0) };
      })
      .sort((a, b) => {
        // grup terbaru berdasarkan tanggal panen terakhir
        const ta = Math.max(...a.items.map((x) => new Date(x.tanggalPanen).getTime() || 0));
        const tb = Math.max(...b.items.map((x) => new Date(x.tanggalPanen).getTime() || 0));
        return tb - ta;
      });
  }, [dataList]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    landApi.getAll({ limit: 500 }).then((r) => setLandOptions(r.data || [])).catch(() => setLandOptions([]));
    warehouseApi.getAll({ limit: 100 }).then((r) => setGudangOptions(r.data || [])).catch(() => setGudangOptions([]));
    // Muat semua penanaman aktif sekali agar daftar lahan bertanam tersedia sejak awal
    plantingApi.getAll({ limit: 500 }).then((r) => {
      const aktif = (r.data || []).filter((p) => ['Ditanam', 'Tumbuh', 'Siap Panen'].includes(p.statusTanam));
      setActivePlantings(aktif);
    }).catch(() => setActivePlantings([]));
  }, []);

  // Hanya lahan yang punya penanaman aktif (Ditanam / Tumbuh / Siap Panen) yang bisa dipanen
  // Selalu dihitung dari activePlantings agar dropdown lahan tidak menyempit setelah pilih lahan (konsisten dgn Pro)
  const landOptionsWithPlanting = landOptions.filter((l) =>
    activePlantings.some((p) => String(p.lahanId) === String(l.id) && ['Ditanam', 'Tumbuh', 'Siap Panen'].includes(p.statusTanam))
  );

  // Saat pilih lahan → muat penanaman aktif
  const handleLandChange = async (lahanId: string) => {
    const lahan = landOptions.find((l) => String(l.id) === lahanId);
    setFormData((prev) => ({ ...prev, lahanId, plantingId: '', namaLahan: lahan ? lahan.namaLahan : '', varietas: lahan ? lahan.varietasSorgum || prev.varietas : prev.varietas, panenKe: 1 }));
    setSelectedPlanting(null);
    setUsedPanenKe([]);
    setPlantingsForForm([]);
    if (lahanId) {
      try {
        const res = await plantingApi.getAll({ lahanId, limit: 100 });
        const aktif = (res.data || []).filter((p) => ['Ditanam', 'Tumbuh', 'Siap Panen'].includes(p.statusTanam));
        setPlantingsForForm(aktif);
      } catch {
        setPlantingsForForm([]);
      }
    }
  };

  // Saat pilih penanaman → isi otomatis varietas, panen ke berikutnya, dll
  const handlePlantingChange = async (plantingId: string) => {
    const planting = plantingsForForm.find((p) => String(p.id) === plantingId) || null;
    setSelectedPlanting(planting);
    setFormData((prev) => ({
      ...prev,
      plantingId,
      varietas: planting ? planting.varietas : prev.varietas,
      panenKe: 1,
    }));
    setUsedPanenKe([]);
    if (planting) {
      try {
        const res = await harvestApi.getAll({ plantingId, limit: 100 });
        const used = (res.data || []).map((h) => Number(h.panenKe) || 1).filter((n) => n >= 1 && n <= 3);
        setUsedPanenKe(used);
        let next = 1;
        while (used.includes(next) && next < 3) next += 1;
        setFormData((prev) => ({ ...prev, panenKe: next }));
      } catch { setUsedPanenKe([]); }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ lahanId: '', plantingId: '', namaLahan: '', varietas: '', tanggalPanen: new Date().toISOString().split('T')[0], tonase: '', petaniPenanggungJawab: '', catatan: '', panenKe: 1 });
    setUsedPanenKe([]);
    setGudangId('');
    setPlantingsForForm([]);
    setSelectedPlanting(null);
    setImagePreview(null);
    setImageError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Muat detail lengkap (termasuk batch stok gudang) sebelum menampilkan status masuk gudang
  const openDetail = async (item: HarvestRecord) => {
    setDetailTarget(item); // tampilkan segera dari data list
    try {
      const res = await harvestApi.getById(item.id);
      if (res.data) setDetailTarget(res.data);
    } catch { /* biarkan pakai data list */ }
  };

  const handleOpenEdit = async (item: HarvestRecord) => {
    setEditingId(item.id);
    setFormData({
      lahanId: item.lahanId ? String(item.lahanId) : '',
      plantingId: item.plantingId ? String(item.plantingId) : '',
      namaLahan: item.namaLahan || '',
      varietas: item.varietas || '',
      tanggalPanen: item.tanggalPanen ? String(item.tanggalPanen).slice(0, 10) : '',
      tonase: item.jumlahHasilKg != null ? String(item.jumlahHasilKg) : '',
      petaniPenanggungJawab: item.petaniPenanggungJawab || '',
      catatan: item.catatan || '',
      panenKe: Number((item as any).panenKe) || 1,
    });
    setUsedPanenKe((item as any).panenKe ? [Number((item as any).panenKe)] : []);
    setGudangId('');
    setImagePreview(item.fotoUrl || null);
    setImageError(null);
    // Muat daftar penanaman lahan agar dropdown konsisten saat edit
    const lahanId = item.lahanId ? String(item.lahanId) : '';
    setPlantingsForForm([]);
    setSelectedPlanting(null);
    if (lahanId) {
      try {
        const res = await plantingApi.getAll({ lahanId, limit: 100 });
        setPlantingsForForm((res.data || []).filter((p) => ['Ditanam', 'Tumbuh', 'Siap Panen', 'Dipanen'].includes(p.statusTanam)));
        const sel = (res.data || []).find((p) => String(p.id) === String(item.plantingId));
        if (sel) setSelectedPlanting(sel);
      } catch { /* biarkan */ }
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lahanId || !formData.plantingId) {
      setToast({ msg: 'Pilih lahan dan penanaman asal (hasil panen harus berasal dari tanaman yang dicatat).', type: 'error' });
      return;
    }
    if (!formData.tanggalPanen || !formData.tonase) {
      setToast({ msg: 'Tanggal panen dan jumlah hasil wajib diisi.', type: 'error' });
      return;
    }
    const totalKg = beratKeKg(formData.tonase);
    if (!totalKg || totalKg <= 0) {
      setToast({ msg: 'Jumlah hasil panen harus lebih dari 0.', type: 'error' });
      return;
    }
    const payload: any = {
      namaLahan: formData.namaLahan,
      lahanId: formData.lahanId || null,
      plantingId: formData.plantingId || null,
      varietas: formData.varietas,
      tanggalPanen: formData.tanggalPanen,
      jumlahHasilKg: totalKg,
      kualitasGrade: 'Grade A (Premium)',
      petaniPenanggungJawab: formData.petaniPenanggungJawab,
      status: 'Selesai',
      catatan: formData.catatan,
      panenKe: Number(formData.panenKe) || 1,
      fotoUrl: imagePreview, // base64 atau null
      // Bila user memilih gudang → langsung buat batch GAB-... (ringkas: 1 baris total hasil)
      ...(gudangId ? { gudangId, stokBatch: [{ jumlahKg: totalKg, keterangan: 'Hasil panen masuk gudang (Mode Mudah)' }] } : {}),
    };
    try {
      if (editingId) {
        await harvestApi.update(editingId, payload);
        setToast({ msg: 'Catatan panen diperbarui.', type: 'success' });
      } else {
        await harvestApi.create(payload);
        setToast({ msg: 'Catatan panen berhasil ditambahkan.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan panen.', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await harvestApi.delete(deleteTarget.id);
      setToast({ msg: 'Catatan panen dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus panen.', type: 'error' });
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#172C05]">Panen</h1>
          <p className="text-xs text-[#6B7280]">Catat hasil panen sorgum dari lahan</p>
        </div>
        <Button onClick={handleOpenAdd} variant="primary">
          <Plus className="w-4 h-4" /> Catat Panen
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-xs text-[#6B7280] py-10">Memuat data...</p>
      ) : dataList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#c4c8bb]/50">
          <Sprout className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-sm text-[#6B7280]">Belum ada catatan panen.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Klik "Catat Panen" untuk mencatat hasil panen pertama.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {groups.map((group) => {
            // Panen aktif pada dropdown: default panen pertama (1/3) bila belum ada pilihan
            const active =
              group.items.find((x) => x.id === selectedHarvestId) ||
              group.head;
            return (
              <div key={group.key} className="bg-white rounded-2xl border border-[#c4c8bb]/30 overflow-hidden">
                {/* Header kartu = satu penanaman/lahan, bukan satu panen */}
                <div className="p-4 flex items-center gap-3 flex-wrap">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#c4c8bb]/30 bg-[#C3E28D]/30 text-[#2C4219] flex items-center justify-center shrink-0">
                    {group.head.fotoUrl ? (
                      <img src={group.head.fotoUrl} alt={group.head.namaLahan} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Sprout className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#172C05] truncate flex items-center gap-1.5">
                      {group.head.namaLahan}
                      {group.items.length > 1 && (
                        <span className="inline-block px-1.5 py-0.5 rounded-full bg-[#C3E28D] text-[#2C4219] text-[9px] font-extrabold leading-none shrink-0">
                          {group.items.length}× panen
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#6B7280] flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {(group.head as any).planting?.kodeTanam ? `${(group.head as any).planting.kodeTanam} • ` : ""}{group.head.varietas} • Total {formatBerat(group.totalKg)}
                    </p>
                  </div>
                  {/* Dropdown Panen Ke-? — ratoon disimpan di sini, bukan kartu baru */}
                  <select
                    value={active.id}
                    onChange={(e) => setSelectedHarvestId(e.target.value)}
                    className="shrink-0 px-2.5 py-1.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-lg text-xs font-bold text-[#2C4219] cursor-pointer"
                    title="Pilih panen ke berapa"
                  >
                    {group.items.map((g) => (
                      <option key={g.id} value={g.id}>
                        Panen {Number((g as any).panenKe) || 1}/3 — {formatTanggalId(g.tanggalPanen)}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Body kartu = info panen yang sedang dipilih pada dropdown */}
                <div className="px-4 pb-4 -mt-1 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="text-left shrink-0">
                    <p className="text-sm font-extrabold text-[#2C4219]">{formatBerat(Number(active.jumlahHasilKg) || 0)}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{active.kodePanen}</p>
                  </div>
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1 truncate min-w-0 flex-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {formatTanggalId(active.tanggalPanen)}
                    {Number((active as any).panenKe) > 1 ? ` • Panen ${Number((active as any).panenKe)}/3` : ''}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openDetail(active)} title="Lihat" className="p-2 rounded-lg text-[#2C4219] hover:bg-[#C3E28D]/30 cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleOpenEdit(active)} title="Edit" className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 cursor-pointer">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(active)} title="Hapus" className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Catatan Panen' : 'Catat Panen Baru'}
        subtitle="Masukkan hasil panen dari lahan"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Lahan Asal *</label>
              <select
                value={formData.lahanId}
                onChange={(e) => handleLandChange(e.target.value)}
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              >
                <option value="">-- Pilih Lahan Bertanam --</option>
                {landOptionsWithPlanting.length === 0
                  ? (landOptions.length === 0
                      ? <option value="" disabled>Belum ada lahan. Tambah di menu Lahan & Tanaman.</option>
                      : <option value="" disabled>Belum ada lahan yang sedang ditanam. Catat tanam dulu di Lahan & Tanaman.</option>)
                  : landOptionsWithPlanting.map((l) => (
                      <option key={l.id} value={String(l.id)}>{l.namaLahan} ({l.lokasiDesa})</option>
                    ))}
              </select>
              {landOptions.length > 0 && landOptionsWithPlanting.length === 0 && (
                <p className="text-[11px] font-semibold text-amber-600 mt-1">
                  Belum ada penanaman aktif. Buka <b>Lahan & Tanaman → Tanam</b> untuk mencatat penanaman dulu.
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Penanaman Asal {formData.lahanId ? '' : '(pilih lahan dulu)'} *</label>
              <select
                value={formData.plantingId}
                onChange={(e) => handlePlantingChange(e.target.value)}
                disabled={!formData.lahanId}
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm disabled:opacity-60"
                required
              >
                <option value="">{!formData.lahanId ? '-- Pilih lahan terlebih dahulu --' : plantingsForForm.length === 0 ? '-- Tidak ada penanaman aktif --' : '-- Pilih Penanaman --'}</option>
                {plantingsForForm.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.kodeTanam} • {formatTanggalId(p.tanggalTanam)} • {p.varietas}</option>
                ))}
              </select>
              {selectedPlanting && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 bg-[#C3E28D]/15 border border-[#C3E28D]/40 rounded-xl text-xs text-[#2C4219]">
                  <span className="inline-flex items-center gap-1 font-extrabold"><Sprout className="w-3.5 h-3.5" /> {selectedPlanting.kodeTanam}</span>
                  <span>Tanam {formatTanggalId(selectedPlanting.tanggalTanam)}</span>
                  <span>{selectedPlanting.varietas}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedPlanting.statusTanam === 'Siap Panen' ? 'bg-amber-100 text-amber-800'
                    : selectedPlanting.statusTanam === 'Dipanen' ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-white text-[#6B7280] border border-[#c4c8bb]/30'}`}>
                    {selectedPlanting.statusTanam}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Varietas</label>
              <input
                value={formData.varietas}
                readOnly
                className="w-full p-2.5 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm text-[#6B7280] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Panen Ke-? *</label>
              <select
                value={formData.panenKe}
                onChange={(e) => setFormData({ ...formData, panenKe: Number(e.target.value) })}
                disabled={!formData.plantingId}
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm disabled:opacity-60"
              >
                <option value={1}>Panen 1 (awal)</option>
                <option value={2}>Panen 2 (ratoon)</option>
                <option value={3}>Panen 3 (ratoon terakhir)</option>
              </select>
              {formData.plantingId && usedPanenKe.includes(Number(formData.panenKe)) && (
                <p className="text-[11px] font-semibold text-red-600 mt-1">Panen ke-{formData.panenKe} sudah tercatat untuk tanam ini.</p>
              )}
              {!formData.plantingId && (
                <p className="text-[11px] text-[#6B7280] mt-1">Pilih penanaman untuk saran panen otomatis.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Tanggal Panen *</label>
              <input
                type="date"
                value={formData.tanggalPanen}
                onChange={(e) => setFormData({ ...formData, tanggalPanen: e.target.value })}
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Jumlah Hasil ({beratSuffix}) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.tonase}
                onChange={(e) => setFormData({ ...formData, tonase: e.target.value })}
                placeholder={`Contoh: 35.5 ${beratSuffix}`}
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Penanggung Jawab</label>
              <input
                value={formData.petaniPenanggungJawab}
                onChange={(e) => setFormData({ ...formData, petaniPenanggungJawab: e.target.value })}
                placeholder="Contoh: Ibu Sumiati"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Simpan ke Gudang (opsional)</label>
              <select
                value={gudangId}
                onChange={(e) => setGudangId(e.target.value)}
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="">-- Belum disimpan ke gudang --</option>
                {gudangOptions.map((g) => (
                  <option key={g.id} value={String(g.id)}>{g.namaGudang} ({g.lokasi})</option>
                ))}
              </select>
              {gudangId && (
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Hasil panen akan otomatis masuk gudang sebagai batch baru (GABAH).
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Catatan</label>
              <textarea
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Catatan tambahan (opsional)"
                rows={2}
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <LiteImageUpload
                id="lite-panen-foto-input"
                label="Foto Hasil Panen (opsional)"
                value={imagePreview}
                onChange={setImagePreview}
                error={imageError}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary">{editingId ? 'Simpan Perubahan' : 'Simpan Panen'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.namaLahan || 'Detail Panen'}
        subtitle={detailTarget?.kodePanen || ''}
      >
        {detailTarget && (
              <div className="space-y-3">
                {(() => {
                  const batches = detailTarget.stockBatches || [];
                  const sudahMasuk = batches.length > 0 || Number(detailTarget.sudahMasukKg || 0) > 0;
                  const gudangNames = Array.from(
                    new Set(batches.map((b) => b.gudang?.namaGudang).filter(Boolean))
                  ) as string[];
                  return (
                    <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                      sudahMasuk
                        ? 'bg-[#C3E28D]/15 border-[#C3E28D]/40'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        sudahMasuk ? 'bg-[#2C4219] text-[#C3E28D]' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {sudahMasuk ? <WarehouseIcon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-extrabold ${sudahMasuk ? 'text-[#2C4219]' : 'text-amber-800'}`}>
                          {sudahMasuk ? 'Sudah Masuk Gudang' : 'Belum Masuk Gudang'}
                        </p>
                        <p className="text-[11px] text-[#6B7280]">
                          {sudahMasuk
                            ? (gudangNames.length > 0
                              ? `Masuk ke gudang ${gudangNames.join(', ')}.`
                              : 'Hasil panen ini sudah disimpan ke gudang.')
                            : 'Hasil panen ini belum disimpan ke gudang.'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Lahan', detailTarget.namaLahan],
                    ['Varietas', detailTarget.varietas],
                    ['Tanggal Panen', formatTanggalId(detailTarget.tanggalPanen, { weekday: true })],
                    ['Jumlah Hasil', formatBerat(Number(detailTarget.jumlahHasilKg) || 0)],
                    ['Penanggung Jawab', detailTarget.petaniPenanggungJawab],
                    ['Status', detailTarget.status],
                    ['Kode Panen', detailTarget.kodePanen],
                    ['Penanaman Asal', detailTarget.planting?.kodeTanam || '-'],
                    ['Panen Ke', detailTarget.panenKe && Number(detailTarget.panenKe) > 1 ? `Panen ${detailTarget.panenKe}/3` : 'Panen 1 (awal)'],
                  ].map(([k, v]) => (
                    <div key={k as string} className="p-3 bg-[#F7F7F5] rounded-xl">
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase">{k}</p>
                      <p className="text-[13px] font-semibold text-[#172C05] mt-0.5">{v || '-'}</p>
                    </div>
                  ))}
                </div>
                {detailTarget.fotoUrl && (
                  <div className="rounded-xl overflow-hidden border border-[#c4c8bb]/30">
                    <img src={detailTarget.fotoUrl} alt={`Foto panen ${detailTarget.namaLahan}`} className="w-full max-h-60 object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}

                {detailTarget.catatan && (
                  <p className="text-xs text-[#6B7280] italic">"{detailTarget.catatan}"</p>
                )}
              </div>
            )}
      </Modal>

      {/* Delete */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Catatan Panen?" subtitle="Konfirmasi Penghapusan" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-[#44483e] leading-relaxed">
            Apakah Anda yakin ingin menghapus panen <b>{deleteTarget?.namaLahan}</b> ({deleteTarget?.kodePanen})?
          </p>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button type="button" variant="danger" onClick={confirmDelete}>Ya, Hapus</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
