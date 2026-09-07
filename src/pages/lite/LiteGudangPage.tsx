import React, { useEffect, useState, useCallback } from 'react';
import { Warehouse as WarehouseIcon, ArrowDownToLine, ArrowUpFromLine, History, RefreshCw } from 'lucide-react';
import { warehouseApi, WarehouseHistoryItem } from '../../api/endpoints/warehouseApi';
import { Warehouse } from '../../types';
import { useUnitSettings } from '../../context/UnitSettingsContext';
import { formatDateTimeId, formatTanggalId } from '../../utils/dateUtils';
import { useLiteSearch } from '../../components/layout/lite/LiteLayout';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import { Combobox, ComboboxOption } from '../../components/common/Combobox';

export const LiteGudangPage: React.FC = () => {
  const { searchTerm } = useLiteSearch();
  const { formatBerat } = useUnitSettings();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Modal stock
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockType, setStockType] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [gudangOptions, setGudangOptions] = useState<ComboboxOption[]>([]);
  const [gudangId, setGudangId] = useState('');
  const [jumlahKg, setJumlahKg] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Opsi panen utk stok masuk
  const [harvestOptions, setHarvestOptions] = useState<ComboboxOption[]>([]);
  const [harvestId, setHarvestId] = useState('');

  // Opsi batch utk stok keluar
  const [batchOptions, setBatchOptions] = useState<ComboboxOption[]>([]);
  const [batchMap, setBatchMap] = useState<Record<string, number>>({});
  const [batchId, setBatchId] = useState('');

  // Riwayat
  const [riwayatOpen, setRiwayatOpen] = useState(false);
  const [historyList, setHistoryList] = useState<WarehouseHistoryItem[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await warehouseApi.getAll({ page: 1, limit: 100 });
      setWarehouses(res.data || []);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat data gudang.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Muat gudang options
  useEffect(() => {
    warehouseApi.getOptions().then((res) => {
      setGudangOptions((res.data || []).map((g) => ({ value: String(g.id), label: `${g.namaGudang}`, searchText: g.kodeGudang })));
    }).catch(() => setGudangOptions([]));
  }, []);

  const openStock = async (type: 'MASUK' | 'KELUAR') => {
    setStockType(type);
    setGudangId('');
    setJumlahKg('');
    setKeterangan('');
    setHarvestId('');
    setBatchId('');
    setStockModalOpen(true);
    // Muat opsi panen (masuk) 
    if (type === 'MASUK') {
      try {
        const res = await warehouseApi.getHarvestOptions();
        setHarvestOptions((res.data || []).map((h) => ({
          value: String(h.id),
          label: `${h.kodePanen} — ${h.varietas}`,
          searchText: `${h.kodePanen} ${h.varietas} ${h.namaLahan || ''} sisa ${formatBerat(Number(h.sisaBelumMasukKg) || 0)}`,
        })));
      } catch {
        setHarvestOptions([]);
      }
    }
  };

  const handleGudangChange = async (gid: string) => {
    setGudangId(gid);
    setBatchId('');
    if (!gid || stockType !== 'KELUAR') return;
    try {
      const res = await warehouseApi.getStockBatches(gid);
      const map: Record<string, number> = {};
      const opts = (res.data || [])
        .filter((b: any) => Number(b.sisaKg) > 0)
        .map((b: any) => {
          map[String(b.id)] = Number(b.sisaKg) || 0;
          return { value: String(b.id), label: `${b.kodeBatchStok} — sisa ${formatBerat(Number(b.sisaKg) || 0)}`, searchText: `${b.kodeBatchStok} ${b.jenis || ''} ${b.kodePanen || ''}` };
        });
      setBatchMap(map);
      setBatchOptions(opts);
    } catch {
      setBatchOptions([]);
      setBatchMap({});
    }
  };

  const submitStock = async () => {
    const kg = Number(jumlahKg) || 0;
    if (!gudangId || !kg || kg <= 0) {
      setToast({ msg: 'Pilih gudang dan masukkan jumlah yang valid.', type: 'error' });
      return;
    }
    try {
      if (stockType === 'MASUK') {
        if (!harvestId) {
          setToast({ msg: 'Pilih hasil panen yang akan disimpan.', type: 'error' });
          return;
        }
        await warehouseApi.stockIn({ harvestId, jumlahKg: kg, keterangan: keterangan || undefined });
        setToast({ msg: 'Stok berhasil masuk ke gudang.', type: 'success' });
      } else {
        if (!batchId) {
          setToast({ msg: 'Pilih batch stok yang akan dikeluarkan.', type: 'error' });
          return;
        }
        const sisa = batchMap[batchId] || 0;
        if (kg > sisa) {
          setToast({ msg: `Jumlah melebihi sisa stok batch (${formatBerat(sisa)}).`, type: 'error' });
          return;
        }
        await warehouseApi.stockOut({ gudangId, stockBatchId: batchId, jumlahKg: kg, keterangan: keterangan || undefined });
        setToast({ msg: 'Stok berhasil keluar dari gudang.', type: 'success' });
      }
      setStockModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memproses stok.', type: 'error' });
    }
  };

  const openRiwayat = async (gudang: Warehouse) => {
    setRiwayatOpen(true);
    setHistoryList([]);
    try {
      const res = await warehouseApi.getHistory(gudang.id, { page: 1, limit: 50 });
      setHistoryList(res.data || []);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat riwayat.', type: 'error' });
    }
  };

  const filtered = warehouses.filter((w) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return w.namaGudang.toLowerCase().includes(q) || w.kodeGudang.toLowerCase().includes(q) || (w.lokasi || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#172C05]">Gudang</h1>
          <p className="text-xs text-[#6B7280]">Pantau stok gabah & sorgum di gudang</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openStock('MASUK')}>
            <ArrowDownToLine className="w-4 h-4" /> Stok Masuk
          </Button>
          <Button variant="outline" onClick={() => openStock('KELUAR')}>
            <ArrowUpFromLine className="w-4 h-4" /> Stok Keluar
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-xs text-[#6B7280] py-10">Memuat data...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#c4c8bb]/50">
          <WarehouseIcon className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-sm text-[#6B7280]">Belum ada gudang.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Gunakan Mode Lengkap (Pro) untuk menambah gudang baru.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((g) => {
            const batches = g.stockBatches || [];
            const gabahKg = batches.filter((b) => b.jenis === 'GABAH').reduce((s, b) => s + (Number(b.sisaKg) || 0), 0);
            const sorgumKg = batches.filter((b) => b.jenis === 'SORGUM').reduce((s, b) => s + (Number(b.sisaKg) || 0), 0);
            return (
              <div key={g.id} className="bg-white rounded-2xl border border-[#c4c8bb]/30 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <WarehouseIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#172C05] truncate">{g.namaGudang}</p>
                    <p className="text-[11px] text-[#6B7280] truncate">{g.kodeGudang} • {g.lokasi}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-[#2C4219]">{formatBerat(Number(g.totalStokKg) || 0)}</p>
                    <p className="text-[10px] text-[#9CA3AF]">total stok</p>
                  </div>
                  <button onClick={() => openRiwayat(g)} title="Riwayat" className="p-2 rounded-lg text-[#44483e] hover:bg-[#F7F7F5] cursor-pointer shrink-0">
                    <History className="w-4 h-4" />
                  </button>
                </div>
                {(gabahKg > 0 || sorgumKg > 0) && (
                  <div className="px-4 pb-4 flex gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                      Gabah: {formatBerat(gabahKg)}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Sorgum (sosoh): {formatBerat(sorgumKg)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stock Modal */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={stockType === 'MASUK' ? 'Catat Stok Masuk' : 'Catat Stok Keluar'}
        subtitle={stockType === 'MASUK' ? 'Simpan hasil panen ke gudang' : 'Keluarkan bahan dari gudang'}
        maxWidth="md"
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Pilih Gudang *</label>
            <Combobox
              options={gudangOptions}
              value={gudangId}
              onChange={handleGudangChange}
              placeholder="Pilih gudang..."
              emptyText="Belum ada gudang."
            />
          </div>
          {stockType === 'MASUK' ? (
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Hasil Panen *</label>
              <Combobox
                options={harvestOptions}
                value={harvestId}
                onChange={setHarvestId}
                placeholder="Pilih catatan panen..."
                emptyText="Tidak ada panen yang belum penuh masuk gudang."
              />
            </div>
          ) : (
            gudangId && (
              <div>
                <label className="block text-xs font-bold text-[#2C4219] mb-1">Batch Stok *</label>
                <Combobox
                  options={batchOptions}
                  value={batchId}
                  onChange={setBatchId}
                  placeholder="Pilih batch stok..."
                  emptyText="Tidak ada batch dengan sisa stok."
                />
              </div>
            )
          )}
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Jumlah (Kg) *</label>
            <input
              type="number"
              step="0.01"
              value={jumlahKg}
              onChange={(e) => setJumlahKg(e.target.value)}
              placeholder="Contoh: 100"
              className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Keterangan</label>
            <input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan opsional"
              className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setStockModalOpen(false)}>Batal</Button>
            <Button type="button" variant="primary" onClick={submitStock}>
              <RefreshCw className="w-3.5 h-3.5" /> Proses Stok
            </Button>
          </div>
        </div>
      </Modal>

      {/* Riwayat Modal */}
      <Modal
        isOpen={riwayatOpen}
        onClose={() => setRiwayatOpen(false)}
        title="Riwayat Aktivitas Gudang"
        subtitle="Masuk, keluar, dan proses sosoh"
        maxWidth="lg"
      >
        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {historyList.length === 0 ? (
            <p className="text-center text-xs text-[#6B7280] py-8">Belum ada aktivitas.</p>
          ) : (
            historyList.map((h) => (
              <div key={h.id} className="flex items-center gap-3 p-3 bg-[#F7F7F5] rounded-xl">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
                  h.tipe === 'MASUK' ? 'bg-emerald-100 text-emerald-700' :
                  h.tipe === 'KELUAR' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                }`}>
                  {h.tipe}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#172C05] truncate">
                    {h.keterangan || (h.tipe === 'SOSOH' ? `Sosoh ${h.kodeBatchGabah} → ${h.kodeBatchSorgum}` : h.kodeBatch || '-')}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">{formatDateTimeId(h.createdAt)}</p>
                </div>
                <p className="text-xs font-extrabold text-[#2C4219] shrink-0">{formatBerat(Number(h.jumlahKg) || 0)}</p>
              </div>
            ))
          )}
        </div>
      </Modal>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
