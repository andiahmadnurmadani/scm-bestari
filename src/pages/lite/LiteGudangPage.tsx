import React, { useEffect, useState, useCallback } from 'react';
import { Warehouse as WarehouseIcon, ArrowDownToLine, ArrowUpFromLine, History, RefreshCw, Droplets, Check, Plus } from 'lucide-react';
import { warehouseApi, WarehouseHistoryItem } from '../../api/endpoints/warehouseApi';
import { landApi } from '../../api/endpoints/landApi';
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
  const [stockStep, setStockStep] = useState(1); // wizard: 1=pilih gudang, 2=pilih sumber/batch, 3=jumlah & simpan
  const [gudangOptions, setGudangOptions] = useState<ComboboxOption[]>([]);
  const [gudangId, setGudangId] = useState('');
  const [jumlahKg, setJumlahKg] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Opsi panen utk stok masuk
  const [harvestOptions, setHarvestOptions] = useState<ComboboxOption[]>([]);
  const [harvestId, setHarvestId] = useState('');
  const [harvestInfoMap, setHarvestInfoMap] = useState<Record<string, { kodePanen: string; varietas: string; jumlahHasilKg: number; sudahMasukKg: number; sisaBelumMasukKg: number }>>({});
  const [selectedHarvestInfo, setSelectedHarvestInfo] = useState<{ kodePanen: string; varietas: string; jumlahHasilKg: number; sudahMasukKg: number; sisaBelumMasukKg: number } | null>(null);

  // Opsi batch utk stok keluar
  const [batchOptions, setBatchOptions] = useState<ComboboxOption[]>([]);
  const [batchMap, setBatchMap] = useState<Record<string, number>>({});
  const [batchId, setBatchId] = useState('');

  // Riwayat
  const [riwayatOpen, setRiwayatOpen] = useState(false);
  const [historyList, setHistoryList] = useState<WarehouseHistoryItem[]>([]);

  // Sosoh (gabah → sorgum) — Mode Mudah, agar petani bisa lanjut ke olahan tanpa pindah mode
  const [sosohOpen, setSosohOpen] = useState(false);
  const [sosohGudangId, setSosohGudangId] = useState('');
  const [sosohBatchOptions, setSosohBatchOptions] = useState<ComboboxOption[]>([]);
  const [sosohBatchMap, setSosohBatchMap] = useState<Record<string, number>>({});
  const [sosohBatchId, setSosohBatchId] = useState('');
  const [sosohKgGabah, setSosohKgGabah] = useState('');
  const [sosohKgHasil, setSosohKgHasil] = useState('');
  const [sosohOperator, setSosohOperator] = useState('');
  const [sosohSubmitting, setSosohSubmitting] = useState(false);

  // Tambah Gudang (opsional, dipilih manual oleh pengguna — tidak lagi otomatis)
  const [addOpen, setAddOpen] = useState(false);
  const [addNama, setAddNama] = useState('');
  const [addLahanId, setAddLahanId] = useState('');
  const [addLokasi, setAddLokasi] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [lahanOptions, setLahanOptions] = useState<{ id: string; namaLahan: string; kodeLahan?: string }[]>([]);

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
    // Daftar lahan untuk penautan gudang (opsional)
    landApi.getAll({ limit: 200 }).then((res) => {
      setLahanOptions((res.data || []).map((l: any) => ({ id: String(l.id), namaLahan: l.namaLahan || '(tanpa nama)', kodeLahan: l.kodeLahan })));
    }).catch(() => setLahanOptions([]));
  }, []);

  const openAddGudang = () => {
    setAddNama('');
    setAddLahanId('');
    setAddLokasi('');
    setAddOpen(true);
  };

  const submitAddGudang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addNama.trim()) {
      setToast({ msg: 'Nama gudang wajib diisi.', type: 'error' });
      return;
    }
    setAddSaving(true);
    try {
      await warehouseApi.create({
        namaGudang: addNama.trim(),
        lahanId: addLahanId || null,
        lokasi: addLokasi.trim(),
      });
      setToast({ msg: 'Gudang berhasil ditambahkan.', type: 'success' });
      setAddOpen(false);
      fetchData();
      warehouseApi.getOptions().then((res) => {
        setGudangOptions((res.data || []).map((g) => ({ value: String(g.id), label: `${g.namaGudang}`, searchText: g.kodeGudang })));
      }).catch(() => {});
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menambahkan gudang.', type: 'error' });
    } finally {
      setAddSaving(false);
    }
  };

  const openStock = async (type: 'MASUK' | 'KELUAR') => {
    setStockType(type);
    setStockStep(1);
    setGudangId('');
    setJumlahKg('');
    setKeterangan('');
    setHarvestId('');
    setBatchId('');
    setSelectedHarvestInfo(null);
    setStockModalOpen(true);
    // Muat opsi panen (masuk) 
    if (type === 'MASUK') {
      try {
        const res = await warehouseApi.getHarvestOptions();
        const list = res.data || [];
        const map: Record<string, { kodePanen: string; varietas: string; jumlahHasilKg: number; sudahMasukKg: number; sisaBelumMasukKg: number }> = {};
        list.forEach((h) => {
          map[String(h.id)] = {
            kodePanen: h.kodePanen,
            varietas: h.varietas,
            jumlahHasilKg: Number(h.jumlahHasilKg) || 0,
            sudahMasukKg: Number(h.sudahMasukKg) || 0,
            sisaBelumMasukKg: Number(h.sisaBelumMasukKg) || 0,
          };
        });
        setHarvestInfoMap(map);
        setSelectedHarvestInfo(null);
        setHarvestOptions(list.map((h) => ({
          value: String(h.id),
          label: `${h.kodePanen} — ${h.varietas} (total ${formatBerat(Number(h.jumlahHasilKg) || 0)})`,
          searchText: `${h.kodePanen} ${h.varietas} ${h.namaLahan || ''} total ${formatBerat(Number(h.jumlahHasilKg) || 0)} sisa ${formatBerat(Number(h.sisaBelumMasukKg) || 0)}`,
        })));
      } catch {
        setHarvestOptions([]);
        setHarvestInfoMap({});
      }
    }
  };

  const handleHarvestChange = (id: string) => {
    setHarvestId(id);
    setSelectedHarvestInfo(id ? harvestInfoMap[id] || null : null);
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
      setSelectedHarvestInfo(null);
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

  // ── Sosoh: buka modal & muat batch GABAH dari gudang terpilih ──────────────
  const openSosoh = () => {
    setSosohGudangId('');
    setSosohBatchId('');
    setSosohBatchOptions([]);
    setSosohBatchMap({});
    setSosohKgGabah('');
    setSosohKgHasil('');
    setSosohOperator('');
    setSosohOpen(true);
  };

  const handleSosohGudangChange = async (gid: string) => {
    setSosohGudangId(gid);
    setSosohBatchId('');
    setSosohBatchOptions([]);
    setSosohBatchMap({});
    if (!gid) return;
    try {
      const res = await warehouseApi.getStockBatches(gid);
      const map: Record<string, number> = {};
      // Sosoh hanya bisa dari batch GABAH yang masih punya sisa
      const opts = (res.data || [])
        .filter((b) => b.jenis === 'GABAH' && Number(b.sisaKg) > 0)
        .map((b) => {
          map[String(b.id)] = Number(b.sisaKg) || 0;
          return {
            value: String(b.id),
            label: `${b.kodeBatchStok} — sisa ${formatBerat(Number(b.sisaKg) || 0)}`,
            searchText: `${b.kodeBatchStok} ${b.kodePanen || ''}`,
          };
        });
      setSosohBatchMap(map);
      setSosohBatchOptions(opts);
    } catch {
      setSosohBatchOptions([]);
      setSosohBatchMap({});
    }
  };

  const handleSosohBatchChange = (id: string) => {
    setSosohBatchId(id);
    // Saran otomatis: hasil sorgum ≈ 65% dari gabah (rendemen umum)
    const sisa = sosohBatchMap[id] || 0;
    if (sisa > 0 && !sosohKgGabah) {
      setSosohKgGabah(String(sisa));
      setSosohKgHasil(String(Math.round(sisa * 0.65)));
    }
  };

  const submitSosoh = async () => {
    const kgGabah = Number(sosohKgGabah) || 0;
    const kgHasil = Number(sosohKgHasil) || 0;
    if (!sosohGudangId || !sosohBatchId) {
      setToast({ msg: 'Pilih gudang dan batch gabah yang akan disosoh.', type: 'error' });
      return;
    }
    if (!kgGabah || kgGabah <= 0) {
      setToast({ msg: 'Jumlah gabah yang disosoh tidak valid.', type: 'error' });
      return;
    }
    const sisa = sosohBatchMap[sosohBatchId] || 0;
    if (kgGabah > sisa) {
      setToast({ msg: `Gabah melebihi sisa batch (${formatBerat(sisa)}).`, type: 'error' });
      return;
    }
    if (!kgHasil || kgHasil <= 0) {
      setToast({ msg: 'Jumlah hasil sorgum wajib diisi.', type: 'error' });
      return;
    }
    if (kgHasil > kgGabah) {
      setToast({ msg: 'Hasil sorgum tidak bisa melebihi gabah yang disosoh.', type: 'error' });
      return;
    }
    setSosohSubmitting(true);
    try {
      const res = await warehouseApi.sosoh({
        gudangId: sosohGudangId,
        batchGabahId: sosohBatchId,
        kgGabah,
        kgHasilSorgum: kgHasil,
        operator: sosohOperator.trim() || undefined,
      });
      setToast({
        msg: `Sosoh berhasil! Sorgum ${formatBerat(kgHasil)} siap dipakai untuk olahan (batch ${res.data?.kodeBatchSorgum || ''}).`,
        type: 'success',
      });
      setSosohOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memproses sosoh.', type: 'error' });
    } finally {
      setSosohSubmitting(false);
    }
  };

  const filtered = warehouses.filter((w) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return w.namaGudang.toLowerCase().includes(q) || w.kodeGudang.toLowerCase().includes(q) || (w.lokasi || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#172C05]">Gudang</h1>
          <p className="text-sm text-[#6B7280]">Pantau stok gabah & sorgum di gudang</p>
        </div>
        {/* Aksi utama dibuat mencolok agar jelas harus klik apa */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => openStock('MASUK')}
          className="w-full py-3.5 text-base shadow-lg"
        >
          <ArrowDownToLine className="w-5 h-5" /> Tambah Stok Masuk
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="md" onClick={() => openStock('KELUAR')} className="flex-1 min-w-[140px]">
            <ArrowUpFromLine className="w-4 h-4" /> Stok Keluar
          </Button>
          <Button variant="secondary" size="md" onClick={openSosoh} className="flex-1 min-w-[140px]">
            <Droplets className="w-4 h-4" /> Sosoh Gabah
          </Button>
          <Button variant="outline" size="md" onClick={openAddGudang} className="flex-1 min-w-[140px]">
            <Plus className="w-4 h-4" /> Tambah Gudang
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-xs text-[#6B7280] py-10">Memuat data...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-[#c4c8bb]/50 px-4">
          <WarehouseIcon className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-sm text-[#6B7280]">Belum ada gudang.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Gudang dibuat manual (opsional). Tambahkan gudang bila sudah siap menyimpan hasil.</p>
          <Button variant="primary" size="md" onClick={openAddGudang} className="mt-3">
            <Plus className="w-4 h-4" /> Tambah Gudang Pertama
          </Button>
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

      {/* Stock Modal — WIZARD bertahap (langkah 1→2→3) */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={stockType === 'MASUK' ? 'Catat Stok Masuk' : 'Catat Stok Keluar'}
        subtitle={stockType === 'MASUK' ? 'Simpan hasil panen ke gudang' : 'Keluarkan bahan dari gudang'}
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Indikator langkah */}
          <div className="flex items-center gap-2">
            {[
              { n: 1, label: 'Gudang' },
              { n: 2, label: stockType === 'MASUK' ? 'Hasil Panen' : 'Batch Stok' },
              { n: 3, label: 'Jumlah' },
            ].map((s, i) => {
              const done = stockStep > s.n;
              const active = stockStep === s.n;
              return (
                <React.Fragment key={s.n}>
                  {i > 0 && <div className={`flex-1 h-1 rounded-full ${stockStep > i ? 'bg-[#2C4219]' : 'bg-[#c4c8bb]/40'}`} />}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold ${
                      done ? 'bg-[#2C4219] text-[#C3E28D]' : active ? 'bg-[#C3E28D] text-[#2C4219] ring-2 ring-[#2C4219]/30' : 'bg-[#F7F7F5] text-[#9CA3AF]'
                    }`}>
                      {done ? <Check className="w-4 h-4" /> : s.n}
                    </div>
                    <span className={`text-[11px] font-bold ${active || done ? 'text-[#2C4219]' : 'text-[#9CA3AF]'}`}>{s.label}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* LANGKAH 1 — Pilih Gudang */}
          {stockStep === 1 && (
            <div>
              <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Langkah 1: Pilih Gudang *</label>
              <Combobox
                options={gudangOptions}
                value={gudangId}
                onChange={handleGudangChange}
                placeholder="Ketuk untuk pilih gudang..."
                emptyText="Belum ada gudang."
              />
              <p className="text-[13px] text-[#6B7280] mt-1.5">Pilih gudang tempat barang akan {stockType === 'MASUK' ? 'disimpan' : 'dikeluarkan'}.</p>
            </div>
          )}

          {/* LANGKAH 2 — Pilih sumber */}
          {stockStep === 2 && stockType === 'MASUK' && (
            <div>
              <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Langkah 2: Pilih Hasil Panen *</label>
              <Combobox
                options={harvestOptions}
                value={harvestId}
                onChange={handleHarvestChange}
                placeholder="Ketuk untuk pilih catatan panen..."
                emptyText="Tidak ada panen yang belum penuh masuk gudang."
              />
              {selectedHarvestInfo && (
                <div className="mt-2 p-3 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 space-y-1.5">
                  <p className="text-[12px] font-bold text-[#6B7280] uppercase">Info Hasil Panen</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#44483e]">Total Panen</span>
                    <span className="font-extrabold text-[#2C4219]">{formatBerat(selectedHarvestInfo.jumlahHasilKg)}</span>
                  </div>
                  {selectedHarvestInfo.sudahMasukKg > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#44483e]">Sudah Masuk Gudang</span>
                      <span className="font-bold text-[#6B7280]">{formatBerat(selectedHarvestInfo.sudahMasukKg)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#44483e]">Sisa Belum Masuk</span>
                    <span className="font-bold text-amber-700">{formatBerat(selectedHarvestInfo.sisaBelumMasukKg)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {stockStep === 2 && stockType === 'KELUAR' && (
            <div>
              <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Langkah 2: Pilih Batch Stok *</label>
              <Combobox
                options={batchOptions}
                value={batchId}
                onChange={setBatchId}
                placeholder="Ketuk untuk pilih batch stok..."
                emptyText="Tidak ada batch dengan sisa stok."
              />
              {batchId && (
                <p className="text-[13px] text-[#6B7280] mt-1.5">Sisa batch ini: <b className="text-[#2C4219]">{formatBerat(batchMap[batchId] || 0)}</b></p>
              )}
            </div>
          )}

          {/* LANGKAH 3 — Jumlah & keterangan */}
          {stockStep === 3 && (
            <>
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Langkah 3: Jumlah (Kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={jumlahKg}
                  onChange={(e) => setJumlahKg(e.target.value)}
                  placeholder="Contoh: 100"
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-base font-semibold"
                />
                {stockType === 'MASUK' && selectedHarvestInfo && (
                  <p className="text-[13px] text-[#6B7280] mt-1.5">Maksimal bisa diisi: <b className="text-[#2C4219]">{formatBerat(selectedHarvestInfo.sisaBelumMasukKg)}</b></p>
                )}
                {stockType === 'KELUAR' && batchId && (
                  <p className="text-[13px] text-[#6B7280] mt-1.5">Maksimal bisa diisi: <b className="text-[#2C4219]">{formatBerat(batchMap[batchId] || 0)}</b></p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Keterangan (opsional)</label>
                <input
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Catatan tambahan"
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-base"
                />
              </div>
            </>
          )}

          {/* Navigasi wizard */}
          <div className="flex justify-between items-center gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            {stockStep > 1 ? (
              <Button type="button" variant="secondary" onClick={() => setStockStep((s) => s - 1)}>← Kembali</Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => setStockModalOpen(false)}>Batal</Button>
            )}

            {stockStep < 3 ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => setStockStep((s) => s + 1)}
                disabled={stockStep === 1 ? !gudangId : stockType === 'MASUK' ? !harvestId : !batchId}
              >
                Lanjut →
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={submitStock}>
                <RefreshCw className="w-4 h-4" /> {stockType === 'MASUK' ? 'Simpan ke Gudang' : 'Proses Keluar'}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal Sosoh — ubah gabah jadi sorgum */}
      <Modal
        isOpen={sosohOpen}
        onClose={() => setSosohOpen(false)}
        title="Sosoh Gabah → Sorgum"
        subtitle="Ubah gabah jadi sorgum agar bisa dibuat olahan"
        maxWidth="md"
      >
        <div className="space-y-3.5">
          <p className="text-[11px] text-[#6B7280] leading-relaxed bg-[#F7F7F5] border border-[#c4c8bb]/20 rounded-xl p-2.5">
            💡 <b>Sosoh</b> adalah proses mengupas gabah menjadi sorgum siap olah. Setelah disosoh, sorgum bisa dipakai di menu <b>Olahan</b>.
          </p>
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Pilih Gudang *</label>
            <Combobox
              options={gudangOptions}
              value={sosohGudangId}
              onChange={handleSosohGudangChange}
              placeholder="Pilih gudang..."
              emptyText="Belum ada gudang."
            />
          </div>
          {sosohGudangId && (
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Batch Gabah *</label>
              <Combobox
                options={sosohBatchOptions}
                value={sosohBatchId}
                onChange={handleSosohBatchChange}
                placeholder="Pilih batch gabah..."
                emptyText="Tidak ada batch gabah dengan sisa stok."
              />
              {sosohBatchOptions.length === 0 && (
                <p className="text-[11px] font-semibold text-amber-600 mt-1">
                  Belum ada gabah di gudang ini. Catat Stok Masuk dulu.
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Gabah Disosoh (Kg) *</label>
              <input
                type="number"
                step="0.01"
                value={sosohKgGabah}
                onChange={(e) => setSosohKgGabah(e.target.value)}
                placeholder="Contoh: 100"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Hasil Sorgum (Kg) *</label>
              <input
                type="number"
                step="0.01"
                value={sosohKgHasil}
                onChange={(e) => setSosohKgHasil(e.target.value)}
                placeholder="Contoh: 65"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
          </div>
          {Number(sosohKgGabah) > 0 && Number(sosohKgHasil) > 0 && (
            <p className="text-[11px] text-[#2C4219] font-semibold">
              Rendemen: {Math.round((Number(sosohKgHasil) / Number(sosohKgGabah)) * 100)}% (umumnya 60–70%)
            </p>
          )}
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Operator (opsional)</label>
            <input
              value={sosohOperator}
              onChange={(e) => setSosohOperator(e.target.value)}
              placeholder="Contoh: Ibu Siti"
              className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setSosohOpen(false)}>Batal</Button>
            <Button type="button" variant="primary" loading={sosohSubmitting} onClick={submitSosoh}>
              <Droplets className="w-3.5 h-3.5" /> Proses Sosoh
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

      {/* Modal Tambah Gudang (opsional, tautkan ke lahan) */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Tambah Gudang"
        subtitle="Buat gudang baru untuk menyimpan hasil panen"
        maxWidth="md"
      >
        <form onSubmit={submitAddGudang} className="space-y-3.5">
          <div>
            <label className="block text-sm font-bold text-[#2C4219] mb-1">Nama Gudang *</label>
            <input
              value={addNama}
              onChange={(e) => setAddNama(e.target.value)}
              placeholder="Contoh: Gudang Utama"
              autoFocus
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[#2C4219] mb-1">Terkait Lahan <span className="font-normal text-[#6B7280]">— opsional</span></label>
            <select
              value={addLahanId}
              onChange={(e) => setAddLahanId(e.target.value)}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-base"
            >
              <option value="">— Gudang umum / dipakai bersama —</option>
              {lahanOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.kodeLahan ? `${l.kodeLahan} — ` : ''}{l.namaLahan}
                </option>
              ))}
            </select>
            <p className="text-[13px] text-[#6B7280] mt-1">Pilih lahan bila gudang khusus untuk lahan itu. Boleh dikosongkan untuk gudang bersama.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#2C4219] mb-1">Lokasi <span className="font-normal text-[#6B7280]">— opsional</span></label>
            <input
              value={addLokasi}
              onChange={(e) => setAddLokasi(e.target.value)}
              placeholder="Contoh: Dusun Krajan"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-base"
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" loading={addSaving}>
              <Plus className="w-4 h-4" /> Simpan Gudang
            </Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
