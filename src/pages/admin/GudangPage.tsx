import React, { useEffect, useState } from 'react';
import { Warehouse as WarehouseIcon, Plus, MapPin, Sprout, Package, ArrowDownToLine, ArrowUpFromLine, History, Trash2, Pencil, X } from 'lucide-react';
import { warehouseApi } from '../../api/endpoints/warehouseApi';
import { Warehouse, WarehouseStockBatch, WarehouseMovement } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { useUnitSettings } from '../../context/UnitSettingsContext';

export const GudangPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const { formatBerat } = useUnitSettings();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailWarehouse, setDetailWarehouse] = useState<Warehouse | null>(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockType, setStockType] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const [formData, setFormData] = useState({
    kodeGudang: '',
    namaGudang: '',
    lahanId: '',
    lokasi: '',
    kapasitasKg: '',
  });
  const [stockForm, setStockForm] = useState({
    gudangId: '',
    jumlahKg: '',
    keterangan: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await warehouseApi.getAll({ page: 1, limit: 100 });
      setWarehouses(res.data || []);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat data gudang.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = warehouses.filter((w) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      w.namaGudang.toLowerCase().includes(q) ||
      w.kodeGudang.toLowerCase().includes(q) ||
      (w.lokasi || '').toLowerCase().includes(q)
    );
  });

  const totalStokSemua = warehouses.reduce((acc, w) => acc + (w.totalStokKg || 0), 0);

  const openAdd = () => {
    setEditId(null);
    setFormData({ kodeGudang: '', namaGudang: '', lahanId: '', lokasi: '', kapasitasKg: '' });
    setFormModalOpen(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditId(w.id);
    setFormData({
      kodeGudang: w.kodeGudang,
      namaGudang: w.namaGudang,
      lahanId: w.lahanId || '',
      lokasi: w.lokasi || '',
      kapasitasKg: w.kapasitasKg != null ? String(w.kapasitasKg) : '',
    });
    setFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaGudang.trim()) {
      setToast({ msg: 'Nama gudang wajib diisi.', type: 'error' });
      return;
    }
    try {
      const payload = {
        kodeGudang: formData.kodeGudang || undefined,
        namaGudang: formData.namaGudang.trim(),
        lahanId: formData.lahanId ? formData.lahanId : null,
        lokasi: formData.lokasi.trim(),
        kapasitasKg: formData.kapasitasKg ? Number(formData.kapasitasKg) : null,
      };
      if (editId) {
        await warehouseApi.update(editId, payload);
        setToast({ msg: 'Data gudang berhasil diperbarui.', type: 'success' });
      } else {
        await warehouseApi.create(payload);
        setToast({ msg: 'Data gudang berhasil ditambahkan.', type: 'success' });
      }
      setFormModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan data gudang.', type: 'error' });
    }
  };

  const openStock = (w: Warehouse, type: 'MASUK' | 'KELUAR') => {
    setStockType(type);
    setStockForm({ gudangId: w.id, jumlahKg: '', keterangan: '' });
    setStockModalOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(stockForm.jumlahKg);
    if (!qty || qty <= 0) {
      setToast({ msg: 'Jumlah stok tidak valid.', type: 'error' });
      return;
    }
    try {
      if (stockType === 'MASUK') {
        await warehouseApi.stockIn({ gudangId: stockForm.gudangId, jumlahKg: qty, keterangan: stockForm.keterangan });
        setToast({ msg: 'Stok berhasil masuk ke gudang.', type: 'success' });
      } else {
        await warehouseApi.stockOut({ gudangId: stockForm.gudangId, jumlahKg: qty, keterangan: stockForm.keterangan });
        setToast({ msg: 'Stok berhasil dikeluarkan (FIFO).', type: 'success' });
      }
      setStockModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memproses stok.', type: 'error' });
    }
  };

  const openDetail = async (w: Warehouse) => {
    try {
      const res = await warehouseApi.getById(w.id);
      setDetailWarehouse(res.data);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat detail gudang.', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await warehouseApi.delete(deleteTarget.id);
      setToast({ msg: 'Data gudang berhasil dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus data gudang.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">Gudang Sorgum</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openAdd} icon={<Plus className="w-3.5 h-3.5" />} variant="primary" className="text-xs py-1.5 px-3">
            Tambah Gudang
          </Button>
        </div>
      </div>

      {/* Stat ringkas (Model Card disamakan dengan Panen & Produksi) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">JUMLAH GUDANG</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">{warehouses.length} Gudang</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Gudang penyimpanan aktif</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL STOK SORGUM</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">{formatBerat(totalStokSemua)}</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Stok hasil panen tersimpan</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">SISTEM PENYIMPANAN</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">FIFO (First In, First Out)</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Rotasi otomatis stok awal</p>
        </div>
      </div>

      {/* Grid kartu gudang */}
      {loading ? (
        <div className="py-10 text-center text-[#6B7280] text-sm">Memuat data gudang...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-[#6B7280] text-sm">
          {searchTerm ? 'Tidak ada gudang yang cocok.' : 'Belum ada gudang. Tambahkan lahan atau buat gudang manual.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((w) => (
            <div key={w.id} className="bg-white rounded-2xl border border-[#c4c8bb]/30 shadow-2xs hover:shadow-md transition-all p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#2C4219] flex items-center justify-center shrink-0">
                    <WarehouseIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#172C05] text-sm truncate">{w.namaGudang}</h3>
                    <p className="text-[10px] font-bold text-[#2C4219]">{w.kodeGudang}</p>
                  </div>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${w.totalStokKg > 0 ? 'bg-[#C3E28D] text-[#172C05]' : 'bg-[#fff1e5] text-[#8C5A2B]'}`}>
                  {w.totalStokKg > 0 ? 'Berisi' : 'Kosong'}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                {w.lahan ? (
                  <div className="flex items-center gap-1.5 text-[#44483e]">
                    <Sprout className="w-3.5 h-3.5 text-[#2C4219] shrink-0" />
                    <span className="truncate">{w.lahan.namaLahan}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[#9CA3AF]">
                    <Sprout className="w-3.5 h-3.5 shrink-0" />
                    <span>Gudang umum (tanpa lahan)</span>
                  </div>
                )}
                {(w.lokasi || w.lahan?.lokasiDesa) && (
                  <div className="flex items-center gap-1.5 text-[#44483e]">
                    <MapPin className="w-3.5 h-3.5 text-[#8C5A2B] shrink-0" />
                    <span className="truncate">{w.lokasi || w.lahan?.lokasiDesa}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[#44483e]">
                  <Package className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                  <span className="font-semibold text-[#2C4219]">{formatBerat(w.totalStokKg)}</span>
                </div>
              </div>

              {/* Aksi */}
              <div className="mt-3 pt-3 border-t border-[#c4c8bb]/20 flex items-center gap-1.5">
                <button
                  onClick={() => openDetail(w)}
                  className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-[#2C4219] text-white hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Detail & Stok
                </button>
                <button
                  onClick={() => openStock(w, 'MASUK')}
                  title="Stok Masuk"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#C3E28D] text-[#172C05] hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openStock(w, 'KELUAR')}
                  title="Stok Keluar"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#fff1e5] text-[#8C5A2B] hover:opacity-85 transition-opacity cursor-pointer"
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => openEdit(w)}
                  title="Edit Gudang"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-700 hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(w)}
                  title="Hapus Gudang"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-red-600 hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Gudang */}
      <Modal isOpen={formModalOpen} onClose={() => setFormModalOpen(false)} title={editId ? 'Edit Gudang' : 'Tambah Gudang'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Nama Gudang <span className="text-red-500">*</span></label>
            <input
              value={formData.namaGudang}
              onChange={(e) => setFormData({ ...formData, namaGudang: e.target.value })}
              placeholder="Contoh: Gudang Lahan A"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Kode Gudang</label>
            <input
              value={formData.kodeGudang}
              onChange={(e) => setFormData({ ...formData, kodeGudang: e.target.value })}
              placeholder="Otomatis (GDG-001) jika dikosongkan"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Lokasi</label>
            <input
              value={formData.lokasi}
              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              placeholder="Contoh: Dusun Krajan, Sleman"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Kapasitas (kg)</label>
            <input
              value={formData.kapasitasKg}
              onChange={(e) => setFormData({ ...formData, kapasitasKg: e.target.value })}
              placeholder="Contoh: 5000"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setFormModalOpen(false)} className="flex-1 justify-center">Batal</Button>
            <Button type="submit" variant="primary" className="flex-1 justify-center">{editId ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Stok Masuk/Keluar */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={stockType === 'MASUK' ? 'Stok Masuk ke Gudang' : 'Stok Keluar dari Gudang'}
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <p className="text-xs text-[#6B7280] bg-[#F7F7F5] rounded-lg p-2.5">
            {stockType === 'MASUK'
              ? 'Catat stok sorgum masuk (misal hasil panen atau beli dari luar).'
              : 'Stok keluar otomatis memakai FIFO — batch paling lama masuk dipakai duluan.'}
          </p>
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Jumlah (kg) <span className="text-red-500">*</span></label>
            <input
              value={stockForm.jumlahKg}
              onChange={(e) => setStockForm({ ...stockForm, jumlahKg: e.target.value })}
              placeholder="Contoh: 250"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1">Keterangan</label>
            <input
              value={stockForm.keterangan}
              onChange={(e) => setStockForm({ ...stockForm, keterangan: e.target.value })}
              placeholder="Contoh: Hasil panen PN-001 / Dipakai batch PRD-001"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setStockModalOpen(false)} className="flex-1 justify-center">Batal</Button>
            <Button type="submit" variant="primary" className="flex-1 justify-center">
              {stockType === 'MASUK' ? 'Masukkan Stok' : 'Keluarkan Stok'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Gudang (stok FIFO + riwayat) */}
      <Modal
        isOpen={!!detailWarehouse}
        onClose={() => setDetailWarehouse(null)}
        title={detailWarehouse ? `${detailWarehouse.namaGudang} — ${detailWarehouse.kodeGudang}` : 'Detail Gudang'}
      >
        {detailWarehouse && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#F7F7F5] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase">Total Stok</p>
                <p className="text-base font-bold text-[#2C4219]">{formatBerat(detailWarehouse.totalStokKg)}</p>
              </div>
              <div className="bg-[#F7F7F5] rounded-xl p-3">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase">Kapasitas</p>
                <p className="text-base font-bold text-[#221A12]">{detailWarehouse.kapasitasKg != null ? formatBerat(detailWarehouse.kapasitasKg) : '-'}</p>
              </div>
            </div>

            {/* Stok FIFO */}
            <div>
              <h4 className="text-xs font-bold text-[#172C05] mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#2C4219]" /> Stok Batch (FIFO)
              </h4>
              {detailWarehouse.stockBatches && detailWarehouse.stockBatches.length > 0 ? (
                <div className="space-y-1.5">
                  {detailWarehouse.stockBatches.map((s: WarehouseStockBatch) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 bg-[#F7F7F5] rounded-lg px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-[#172C05]">{s.kodeBatchStok}</p>
                        <p className="text-[10px] text-[#6B7280] truncate">
                          {s.harvest?.kodePanen ? `Dari ${s.harvest.kodePanen}` : 'Masuk manual'} • {s.tanggalMasuk || '-'}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold text-[#2C4219]">{formatBerat(s.sisaKg)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#9CA3AF]">Belum ada stok tersimpan.</p>
              )}
            </div>

            {/* Riwayat */}
            <div>
              <h4 className="text-xs font-bold text-[#172C05] mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#2C4219]" /> Riwayat Pergerakan
              </h4>
              {detailWarehouse.movements && detailWarehouse.movements.length > 0 ? (
                <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {detailWarehouse.movements.map((m: WarehouseMovement) => (
                    <div key={m.id} className="flex items-start gap-2 bg-[#F7F7F5] rounded-lg px-3 py-2 text-xs">
                      <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${m.tipe === 'MASUK' ? 'bg-[#2C4219]' : 'bg-[#DEB938]'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#172C05]">{m.keterangan}</p>
                        <p className="text-[10px] text-[#6B7280]">
                          {m.tipe === 'MASUK' ? 'Masuk' : 'Keluar'} • {formatBerat(m.jumlahKg)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#9CA3AF]">Belum ada riwayat.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Gudang">
        <div className="space-y-4">
          <p className="text-sm text-[#221A12]">
            Yakin ingin menghapus gudang <b>{deleteTarget?.namaGudang}</b>?<br />
            <span className="text-xs text-[#6B7280]">Gudang yang masih punya stok tidak bisa dihapus.</span>
          </p>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 justify-center">Batal</Button>
            <Button type="button" variant="danger" onClick={confirmDelete} className="flex-1 justify-center">Ya, Hapus</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
