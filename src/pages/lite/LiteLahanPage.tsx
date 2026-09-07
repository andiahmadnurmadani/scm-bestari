import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Tractor, Pencil, Trash2, Eye, MapPin, ChevronDown, ChevronUp, Sprout } from 'lucide-react';
import { landApi } from '../../api/endpoints/landApi';
import { plantingApi } from '../../api/endpoints/plantingApi';
import { varietyApi } from '../../api/endpoints/varietyApi';
import { LandPlot, Planting } from '../../types';
import { useUnitSettings } from '../../context/UnitSettingsContext';
import { formatTanggalId } from '../../utils/dateUtils';
import { useLiteSearch } from '../../components/layout/lite/LiteLayout';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';


export const LiteLahanPage: React.FC = () => {
  const { searchTerm } = useLiteSearch();
  const { formatLuas } = useUnitSettings();
  const [dataList, setDataList] = useState<LandPlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LandPlot | null>(null);
  const [detailTarget, setDetailTarget] = useState<LandPlot | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [plantingsMap, setPlantingsMap] = useState<Record<string, Planting[]>>({});

  const [formData, setFormData] = useState({
    namaLahan: '',
    lokasiDesa: '',
    kecamatan: '',
    luasHektar: '',
    varietasSorgum: '',
    pemilikKelompokTani: '',
  });

  // State Catat Tanam (alur sederhana, selaras dgn Mode Pro)
  const [plantingLahan, setPlantingLahan] = useState<LandPlot | null>(null);
  const [plantingModalOpen, setPlantingModalOpen] = useState(false);
  const [editingPlantingId, setEditingPlantingId] = useState<string | null>(null);
  const [plantingForm, setPlantingForm] = useState({ tanggalTanam: '', varietas: '', jumlahLubang: '', petugas: '' });
  const [plantingSaving, setPlantingSaving] = useState(false);
  const [varietyOptions, setVarietyOptions] = useState<{ name: string; lamaPanen: number }[]>([]);
  const [allPlantings, setAllPlantings] = useState<Planting[]>([]);
  const [deletePlantingTarget, setDeletePlantingTarget] = useState<{ planting: Planting; lahan: LandPlot } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await landApi.getAll({ page: 1, limit: 500, search: searchTerm || undefined });
      setDataList(res.data || []);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat data lahan.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadPlantings = async (lahanId: string) => {
    try {
      const res = await plantingApi.getAll({ lahanId, limit: 100 });
      setPlantingsMap((prev) => ({ ...prev, [lahanId]: res.data || [] }));
    } catch {
      setPlantingsMap((prev) => ({ ...prev, [lahanId]: [] }));
    }
  };

  // Muat master varietas (untuk estimasi panen otomatis) + semua penanaman (badge status lahan)
  useEffect(() => {
    varietyApi.getAll().then((res) => {
      setVarietyOptions((res.data || []).map((v: any) => ({ name: v.name, lamaPanen: Number(v.lamaPanen) || 0 })));
    }).catch(() => setVarietyOptions([]));
    plantingApi.getAll({ limit: 500 }).then((res) => setAllPlantings(res.data || [])).catch(() => setAllPlantings([]));
  }, []);

  const fetchAllPlantings = async () => {
    try {
      const res = await plantingApi.getAll({ limit: 500 });
      setAllPlantings(res.data || []);
    } catch { /* biarkan */ }
  };

  // Status sederhana lahan: ada penanaman aktif → "Sedang Ditanami"; selain itu "Kosong"
  const getLahanStatus = (lahanId: string) => {
    const list = allPlantings.filter((p) => String(p.lahanId) === String(lahanId) && ['Ditanam', 'Tumbuh', 'Siap Panen'].includes(p.statusTanam));
    if (list.length === 0) return null;
    const latest = [...list].sort((a, b) => new Date(b.tanggalTanam).getTime() - new Date(a.tanggalTanam).getTime())[0];
    return latest;
  };

  // ── Catat Tanam ────────────────────────────────────────────────
  const openPlantingAdd = (plot: LandPlot) => {
    setPlantingLahan(plot);
    setEditingPlantingId(null);
    const varietasDefault = plot.varietasSorgum || varietyOptions[0]?.name || '';
    setPlantingForm({ tanggalTanam: new Date().toISOString().slice(0, 10), varietas: varietasDefault, jumlahLubang: plot.jumlahLubang ? String(plot.jumlahLubang) : '', petugas: '' });
    setPlantingModalOpen(true);
  };

  const openPlantingEdit = (p: Planting, lahan: LandPlot) => {
    setPlantingLahan(lahan);
    setEditingPlantingId(p.id);
    const asli = (p.jumlahLubang ?? 0) / 3; // DB tersimpan ×3
    setPlantingForm({ tanggalTanam: p.tanggalTanam, varietas: p.varietas, jumlahLubang: String(Number.isInteger(asli) ? asli : asli.toFixed(1)), petugas: p.petugas || '' });
    setPlantingModalOpen(true);
  };

  const confirmDeletePlanting = async () => {
    if (!deletePlantingTarget) return;
    const { planting: p, lahan } = deletePlantingTarget;
    try {
      await plantingApi.delete(p.id);
      setToast({ msg: 'Penanaman dihapus.', type: 'success' });
      setDeletePlantingTarget(null);
      loadPlantings(lahan.id);
      fetchAllPlantings();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus penanaman. Mungkin sudah dipakai panen.', type: 'error' });
      setDeletePlantingTarget(null);
    }
  };

  const handleSavePlanting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantingLahan) return;
    if (!plantingForm.tanggalTanam || !plantingForm.varietas.trim()) {
      setToast({ msg: 'Tanggal tanam dan varietas wajib diisi.', type: 'error' });
      return;
    }
    if (!plantingForm.jumlahLubang || Number(plantingForm.jumlahLubang) <= 0) {
      setToast({ msg: 'Jumlah lubang harus lebih dari 0.', type: 'error' });
      return;
    }
    setPlantingSaving(true);
    try {
      // Estimasi panen otomatis dari lamaPanen varietas (default 100 hari)
      const v = varietyOptions.find((x) => x.name === plantingForm.varietas);
      const lamaPanen = v?.lamaPanen || 100;
      const est = new Date(plantingForm.tanggalTanam + 'T00:00:00');
      if (!isNaN(est.getTime())) est.setDate(est.getDate() + lamaPanen);
      const payload: any = {
        lahanId: plantingLahan.id,
        tanggalTanam: plantingForm.tanggalTanam,
        estimasiPanen: isNaN(est.getTime()) ? null : est.toISOString().slice(0, 10),
        varietas: plantingForm.varietas.trim(),
        jumlahLubang: Number(plantingForm.jumlahLubang) * 3 || 0, // 1 lubang = 3 titik
        petugas: plantingForm.petugas.trim(),
      };
      if (editingPlantingId) {
        await plantingApi.update(editingPlantingId, payload);
        setToast({ msg: 'Penanaman diperbarui.', type: 'success' });
      } else {
        await plantingApi.create(payload);
        setToast({ msg: 'Penanaman berhasil dicatat. Kode tanam dibuat otomatis.', type: 'success' });
      }
      setPlantingModalOpen(false);
      setEditingPlantingId(null);
      loadPlantings(plantingLahan.id);
      fetchAllPlantings();
      // auto-expand agar riwayat tanam baru langsung terlihat
      setExpandedId(plantingLahan.id);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan penanaman.', type: 'error' });
    } finally {
      setPlantingSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next) loadPlantings(id);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({ namaLahan: '', lokasiDesa: '', kecamatan: '', luasHektar: '', varietasSorgum: '', pemilikKelompokTani: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: LandPlot) => {
    setEditId(item.id);
    setFormData({
      namaLahan: item.namaLahan || '',
      lokasiDesa: item.lokasiDesa || '',
      kecamatan: item.kecamatan || '',
      luasHektar: item.luasHektar != null ? String(item.luasHektar) : '',
      varietasSorgum: item.varietasSorgum || '',
      pemilikKelompokTani: item.pemilikKelompokTani || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLahan || !formData.lokasiDesa) {
      setToast({ msg: 'Nama lahan dan desa wajib diisi.', type: 'error' });
      return;
    }
    const payload: any = {
      namaLahan: formData.namaLahan,
      lokasiDesa: formData.lokasiDesa,
      kecamatan: formData.kecamatan,
      luasHektar: formData.luasHektar ? Number(formData.luasHektar) : null,
      varietasSorgum: formData.varietasSorgum,
      pemilikKelompokTani: formData.pemilikKelompokTani,
    };
    try {
      if (editId) {
        await landApi.update(editId, payload);
        setToast({ msg: 'Data lahan berhasil diperbarui.', type: 'success' });
      } else {
        await landApi.create(payload);
        setToast({ msg: 'Lahan baru berhasil ditambahkan.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan lahan.', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await landApi.delete(deleteTarget.id);
      setToast({ msg: 'Lahan berhasil dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus lahan.', type: 'error' });
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#172C05]">Lahan & Tanaman</h1>
          <p className="text-xs text-[#6B7280]">Kelola lahan sorgum dan riwayat penanamannya</p>
        </div>
        <Button onClick={handleOpenAdd} variant="primary">
          <Plus className="w-4 h-4" /> Tambah Lahan
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center text-xs text-[#6B7280] py-10">Memuat data...</p>
      ) : dataList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#c4c8bb]/50">
          <Tractor className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-sm text-[#6B7280]">Belum ada lahan terdaftar.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Klik "Tambah Lahan" untuk mendaftarkan blok lahan.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {dataList.map((item) => {
            const isExpanded = expandedId === item.id;
            const plantings = plantingsMap[item.id] || [];
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-[#c4c8bb]/30 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C3E28D]/30 text-[#2C4219] flex items-center justify-center shrink-0">
                    <Tractor className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#172C05] truncate flex items-center gap-1.5">{item.namaLahan}
                      {getLahanStatus(item.id) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#C3E28D] text-[#2C4219] shrink-0">
                          <Sprout className="w-2.5 h-2.5" /> Sedang Ditanami
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#F7F7F5] text-[#6B7280] border border-[#c4c8bb]/30 shrink-0">Kosong</span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#6B7280] flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {item.lokasiDesa}{item.kecamatan ? `, ${item.kecamatan}` : ''} • {formatLuas(Number(item.luasHektar) || 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openPlantingAdd(item)} title="Catat Tanam" className="p-2 rounded-lg text-[#2C4219] bg-[#C3E28D]/30 hover:bg-[#C3E28D]/60 cursor-pointer">
                      <Sprout className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDetailTarget(item)} title="Lihat" className="p-2 rounded-lg text-[#2C4219] hover:bg-[#C3E28D]/30 cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleOpenEdit(item)} title="Edit" className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 cursor-pointer">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteTarget(item)} title="Hapus" className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleExpand(item.id)} title="Tanaman" className="p-2 rounded-lg text-[#44483e] hover:bg-[#F7F7F5] cursor-pointer">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#c4c8bb]/15 pt-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-bold text-[#2C4219]">🌱 Riwayat Tanam</p>
                      <button
                        type="button"
                        onClick={() => openPlantingAdd(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2C4219] text-[#C3E28D] text-[11px] font-bold hover:bg-[#213213] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Tanam
                      </button>
                    </div>
                    {plantings.length === 0 ? (
                      <p className="text-xs text-[#6B7280] italic">Belum ada catatan penanaman.</p>
                    ) : (
                      <div className="space-y-2">
                        {plantings.map((p) => (
                          <div key={p.id} className="p-3 bg-[#F7F7F5] rounded-xl flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div>
                              <p className="text-xs font-bold text-[#172C05]">{p.kodeTanam}</p>
                              <p className="text-[10px] text-[#6B7280]">Tanam: {formatTanggalId(p.tanggalTanam)}</p>
                            </div>
                            <div className="text-xs text-[#44483e]">
                              Varietas: <b>{p.varietas}</b>
                            </div>
                            <div className="text-xs text-[#44483e]">
                              Lubang: <b>{Math.round(Number(p.jumlahLubang) / 3)}</b>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.statusTanam === 'Dipanen' ? 'bg-emerald-100 text-emerald-700' : p.statusTanam === 'Siap Panen' ? 'bg-amber-100 text-amber-700' : p.statusTanam === 'Gagal' ? 'bg-red-100 text-red-600' : 'bg-[#C3E28D]/40 text-[#2C4219]'}`}>
                              {p.statusTanam}
                            </span>
                            {(p as any).jumlahPanen != null && Number((p as any).jumlahPanen) > 0 && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                Number((p as any).panenKeTerakhir) >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-[#C3E28D] text-[#2C4219]'
                              }`}>
                                🌾 Sudah panen {Number((p as any).panenKeTerakhir)}/3
                              </span>
                            )}
                            <div className="flex items-center gap-1 ml-auto shrink-0">
                              <button onClick={() => openPlantingEdit(p, item)} title="Edit tanam" className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 cursor-pointer">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeletePlantingTarget({ planting: p, lahan: item })} title="Hapus tanam" className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Catat / Edit Penanaman ───────────────────────────── */}
      <Modal
        isOpen={plantingModalOpen}
        onClose={() => { setPlantingModalOpen(false); setEditingPlantingId(null); }}
        title={editingPlantingId ? 'Edit Penanaman' : 'Catat Penanaman Baru'}
        subtitle={plantingLahan ? `${plantingLahan.namaLahan}${plantingLahan.lokasiDesa ? ` • ${plantingLahan.lokasiDesa}` : ''}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleSavePlanting} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Tanggal Tanam *</label>
              <input
                type="date"
                value={plantingForm.tanggalTanam}
                onChange={(e) => setPlantingForm({ ...plantingForm, tanggalTanam: e.target.value })}
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Varietas *</label>
              {varietyOptions.length > 0 ? (
                <select
                  value={plantingForm.varietas}
                  onChange={(e) => setPlantingForm({ ...plantingForm, varietas: e.target.value })}
                  className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                >
                  <option value="">-- Pilih Varietas --</option>
                  {varietyOptions.map((v) => (
                    <option key={v.name} value={v.name}>{v.name} {v.lamaPanen ? `(panen ± ${v.lamaPanen} hari)` : ''}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={plantingForm.varietas}
                  onChange={(e) => setPlantingForm({ ...plantingForm, varietas: e.target.value })}
                  placeholder="Contoh: Super 1"
                  className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Jumlah Lubang *</label>
              <input
                type="number"
                min="0"
                value={plantingForm.jumlahLubang}
                onChange={(e) => setPlantingForm({ ...plantingForm, jumlahLubang: e.target.value })}
                placeholder="Contoh: 1200"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Petugas (opsional)</label>
              <input
                value={plantingForm.petugas}
                onChange={(e) => setPlantingForm({ ...plantingForm, petugas: e.target.value })}
                placeholder="Contoh: Ibu Siti - KWT"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280] leading-relaxed bg-[#F7F7F5] border border-[#c4c8bb]/20 rounded-xl p-2.5">
            💡 Kode tanam, estimasi panen, dan luas tanam dibuat <b>otomatis</b> oleh sistem mengikuti varietas yang dipilih.
          </p>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => { setPlantingModalOpen(false); setEditingPlantingId(null); }}>Batal</Button>
            <Button type="submit" variant="primary" loading={plantingSaving}>
              {editingPlantingId ? 'Simpan Perubahan' : 'Simpan Penanaman'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Konfirmasi Hapus Penanaman ───────────────────────── */}
      <Modal
        isOpen={!!deletePlantingTarget}
        onClose={() => setDeletePlantingTarget(null)}
        title="Hapus Penanaman?"
        subtitle="Konfirmasi Penghapusan"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#44483e] leading-relaxed">
            Apakah Anda yakin ingin menghapus penanaman <b>{deletePlantingTarget?.planting.kodeTanam}</b> pada lahan <b>{deletePlantingTarget?.lahan.namaLahan}</b>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setDeletePlantingTarget(null)}>Batal</Button>
            <Button type="button" variant="danger" onClick={confirmDeletePlanting}>Ya, Hapus</Button>
          </div>
        </div>
      </Modal>
      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? 'Edit Lahan' : 'Tambah Lahan Baru'}
        subtitle="Lengkapi data lahan sorgum"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Nama Lahan *</label>
              <input
                value={formData.namaLahan}
                onChange={(e) => setFormData({ ...formData, namaLahan: e.target.value })}
                placeholder="Contoh: Blok A Sawah Rejo"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Desa *</label>
              <input
                value={formData.lokasiDesa}
                onChange={(e) => setFormData({ ...formData, lokasiDesa: e.target.value })}
                placeholder="Contoh: Rejoso"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Kecamatan</label>
              <input
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                placeholder="Contoh: Ngoro"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Luas (Hektar)</label>
              <input
                type="number"
                step="0.01"
                value={formData.luasHektar}
                onChange={(e) => setFormData({ ...formData, luasHektar: e.target.value })}
                placeholder="Contoh: 0.5"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Varietas Sorgum</label>
              <input
                value={formData.varietasSorgum}
                onChange={(e) => setFormData({ ...formData, varietasSorgum: e.target.value })}
                placeholder="Contoh: Super 1"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Kelompok Tani</label>
              <input
                value={formData.pemilikKelompokTani}
                onChange={(e) => setFormData({ ...formData, pemilikKelompokTani: e.target.value })}
                placeholder="Contoh: KWT Melati"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary">{editId ? 'Simpan Perubahan' : 'Tambah Lahan'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title={detailTarget?.namaLahan || 'Detail Lahan'}
        subtitle={detailTarget?.kodeLahan || ''}
      >
        {detailTarget && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Desa', detailTarget.lokasiDesa],
                ['Kecamatan', detailTarget.kecamatan],
                ['Luas', `${formatLuas(Number(detailTarget.luasHektar) || 0)}`],
                ['Varietas', detailTarget.varietasSorgum],
                ['Kelompok Tani', detailTarget.pemilikKelompokTani],
              ].map(([k, v]) => (
                <div key={k as string} className="p-3 bg-[#F7F7F5] rounded-xl">
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase">{k}</p>
                  <p className="text-[13px] font-semibold text-[#172C05] mt-0.5">{v || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Lahan?" subtitle="Konfirmasi Penghapusan" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-[#44483e] leading-relaxed">
            Apakah Anda yakin ingin menghapus lahan <b>{deleteTarget?.namaLahan}</b>? Tindakan ini tidak dapat dibatalkan.
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
