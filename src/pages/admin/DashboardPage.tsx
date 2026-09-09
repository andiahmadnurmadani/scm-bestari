import React, { useEffect, useMemo, useState } from 'react';
import {
  Tractor,
  Sprout,
  Warehouse,
  Factory,
  Award,
  Coins,
  Package,
  Wrench,
  ArrowRight,
  ChevronRight,
  Plus,
  Layers,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { landApi } from '../../api/endpoints/landApi';
import { plantingApi } from '../../api/endpoints/plantingApi';
import { warehouseApi } from '../../api/endpoints/warehouseApi';
import { productionApi } from '../../api/endpoints/productionApi';
import { packagingApi } from '../../api/endpoints/packagingApi';
import { logisticsApi } from '../../api/endpoints/logisticsApi';
import { certificatesApi } from '../../api/endpoints/certificatesApi';
import { equipmentApi } from '../../api/endpoints/equipmentApi';
import { useUnitSettings } from '../../context/UnitSettingsContext';

type TimeFilterType = 'Bulanan' | 'Triwulan' | 'Tahunan';

// ── Helper tanggal ─────────────────────────────────────────────────────────────
function parseDate(tanggal: string): Date {
  const d = new Date(tanggal);
  return isNaN(d.getTime()) ? new Date() : d;
}
function monthLabel(m: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][m - 1] || `M${m}`;
}
function fmtTanggalId(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${hari[d.getUTCDay()]}, ${d.getUTCDate()} ${bulan[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Kompak-kan donut: 4 teratas + Lainnya
function compactDonut(items: { label: string; total: number }[]) {
  const sorted = [...items].sort((a, b) => b.total - a.total);
  const top = sorted.slice(0, 4);
  const rest = sorted.slice(4).reduce((s, i) => s + i.total, 0);
  return rest > 0 ? [...top, { label: 'Lainnya', total: rest }] : top;
}

// ── Kartu Statistik ────────────────────────────────────────────────────────────
interface Stat {
  label: string;
  value: string;
  unit?: string;
  icon: React.ElementType;
  iconBg: string; // kelas warna ikon
  path: string;
  hint?: string;
}

export const DashboardPage: React.FC = () => {
  const { formatBerat } = useUnitSettings();
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('Bulanan');
  const [activeDonut, setActiveDonut] = useState<number | null>(null);

  // ── State data ───────────────────────────────────────────────────────────────
  const [harvests, setHarvests] = useState<any[]>([]);
  const [lands, setLands] = useState<any[]>([]);
  const [plantings, setPlantings] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [packagings, setPackagings] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [h, l, pl, w, p, pk, lg, c, e] = await Promise.allSettled([
          harvestApi.getAll({ page: 1, limit: 1000 }),
          landApi.getAll({ page: 1, limit: 1000 }),
          plantingApi.getAll({ page: 1, limit: 1000 }),
          warehouseApi.getAll({ page: 1, limit: 1000 }),
          productionApi.getAll({ page: 1, limit: 1000 }),
          packagingApi.getAll({ page: 1, limit: 1000 }),
          logisticsApi.getFinancialLogs({ page: 1, limit: 1000 }),
          certificatesApi.getAll({ page: 1, limit: 1000 }),
          equipmentApi.getAll({ page: 1, limit: 1000 }),
        ]);
        if (cancelled) return;
        const val = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' ? r.value.data || [] : []);
        setHarvests(val(h));
        setLands(val(l));
        setPlantings(val(pl));
        setWarehouses(val(w));
        setBatches(val(p));
        setPackagings(val(pk));
        setExpenses(val(lg));
        setCertificates(val(c));
        setEquipments(val(e));
        setLoadError('');
      } catch {
        if (!cancelled) setLoadError('Gagal memuat sebagian data. Periksa koneksi backend.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Hitung statistik ringkas ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalPanenKg = harvests.reduce((s, x) => s + (Number(x.jumlahHasilKg) || 0), 0);
    const totalStokKg = warehouses.reduce((s, x) => s + (Number(x.totalStokKg) || 0), 0);
    const lahanAktif = lands.filter((l) => ['Siap Tanam', 'Masa Pertumbuhan', 'Masa Panen', 'AKTIF', 'PEMBESARAN'].includes(l.statusKesiapan)).length;
    const penanamanAktif = plantings.filter((p) => ['Ditanam', 'Tumbuh', 'Siap Panen'].includes(p.statusTanam)).length;
    const sertifikatAktif = certificates.filter((c) => c.status === 'AKTIF').length;
    const kemasanHabis = packagings.filter((p) => p.statusStok === 'Habis' || p.statusStok === 'Stok Menipis').length;
    const alatPerhatian = equipments.filter((e) => e.status === 'Sedang Digunakan' || e.status === 'Dalam Perawatan' || e.kondisi === 'Perlu Perbaikan' || e.kondisi === 'Rusak').length;
    // Pengeluaran bulan berjalan
    const now = new Date();
    const pengeluaranBulanIni = expenses
      .filter((x) => {
        const d = parseDate(x.tanggal);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && x.statusPembayaran !== 'DIBATALKAN';
      })
      .reduce((s, x) => s + (Number(x.totalBiayaRp) || 0), 0);
    const totalProduk = batches.length;
    return { totalPanenKg, totalStokKg, lahanAktif, penanamanAktif, sertifikatAktif, kemasanHabis, alatPerhatian, pengeluaranBulanIni, totalProduk };
  }, [harvests, lands, plantings, warehouses, batches, packagings, expenses, certificates, equipments]);

  const fmtRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const statCards: Stat[] = [
    { label: 'Lahan Terdaftar', value: String(lands.length), unit: 'lahan', icon: Tractor, iconBg: 'text-[#2C4219] bg-[#C3E28D]/40', path: '/dashboard/lahan', hint: `${stats.lahanAktif} aktif` },
    { label: 'Penanaman Aktif', value: String(stats.penanamanAktif), unit: 'penanaman', icon: Sprout, iconBg: 'text-emerald-700 bg-emerald-100', path: '/dashboard/lahan', hint: `${plantings.length} total` },
    { label: 'Total Hasil Panen', value: formatBerat(stats.totalPanenKg), unit: '', icon: Layers, iconBg: 'text-amber-700 bg-amber-100', path: '/dashboard/panen', hint: `${harvests.length} catatan` },
    { label: 'Stok di Gudang', value: formatBerat(stats.totalStokKg), unit: '', icon: Warehouse, iconBg: 'text-sky-700 bg-sky-100', path: '/dashboard/gudang', hint: `${warehouses.length} gudang` },
    { label: 'Batch Olahan', value: String(stats.totalProduk), unit: 'batch', icon: Factory, iconBg: 'text-purple-700 bg-purple-100', path: '/dashboard/produksi', hint: 'produk olahan' },
    { label: 'Sertifikat Aktif', value: String(stats.sertifikatAktif), unit: 'aktif', icon: Award, iconBg: 'text-rose-600 bg-rose-100', path: '/dashboard/sertifikat', hint: `${certificates.length} total` },
    { label: 'Pengeluaran Bulan Ini', value: fmtRp(stats.pengeluaranBulanIni), unit: '', icon: Coins, iconBg: 'text-orange-600 bg-orange-100', path: '/dashboard/logistik', hint: 'logistik & keuangan' },
    { label: 'Kemasan Menipis', value: String(stats.kemasanHabis), unit: 'jenis', icon: Package, iconBg: 'text-red-600 bg-red-100', path: '/dashboard/kemasan', hint: 'stok menipis / habis' },
  ];

  // ── Grafik panen ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (harvests.length === 0) return { items: [] as { label: string; totalKg: number }[], maxKg: 1, totalKg: 0 };
    const buckets = new Map<string, { label: string; totalKg: number; sortKey: number }>();
    for (const h of harvests) {
      const d = parseDate(h.tanggalPanen);
      const kg = Number(h.jumlahHasilKg) || 0;
      let key = '', label = '', sortKey = 0;
      if (timeFilter === 'Bulanan') {
        key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        label = monthLabel(d.getMonth() + 1);
        sortKey = d.getFullYear() * 100 + d.getMonth() + 1;
      } else if (timeFilter === 'Triwulan') {
        const q = Math.floor(d.getMonth() / 3) + 1;
        key = `${d.getFullYear()}-Q${q}`;
        label = `Q${q}`;
        sortKey = d.getFullYear() * 10 + q;
      } else {
        key = String(d.getFullYear());
        label = String(d.getFullYear());
        sortKey = d.getFullYear();
      }
      const b = buckets.get(key) || { label, totalKg: 0, sortKey };
      b.totalKg += kg;
      buckets.set(key, b);
    }
    const items = [...buckets.values()].sort((a, b) => a.sortKey - b.sortKey).map((b) => ({ label: b.label, totalKg: b.totalKg }));
    const maxKg = Math.max(...items.map((i) => i.totalKg), 1);
    const totalKg = items.reduce((s, i) => s + i.totalKg, 0);
    return { items, maxKg, totalKg };
  }, [harvests, timeFilter]);

  // ── Donut produksi ──────────────────────────────────────────────────────────
  const donutData = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of batches) {
      const label = (b.namaProduk || 'Tanpa Nama').trim();
      map.set(label, (map.get(label) || 0) + (Number(b.jumlahHasil) || 0));
    }
    const raw = [...map.entries()].map(([label, total]) => ({ label, total }));
    return { items: compactDonut(raw), grandTotal: raw.reduce((s, i) => s + i.total, 0) };
  }, [batches]);
  const donutColors = ['#2C4219', '#788B4B', '#A8B774', '#DEB938', '#9CA3AF'];

  // ── Aktivitas terbaru (gabungan panen & produksi) ───────────────────────────
  const recentActivity = useMemo(() => {
    const items: { id: string; type: 'panen' | 'produksi'; title: string; sub: string; tanggal: string; kg: number; kode: string }[] = [];
    harvests.slice(0, 100).forEach((h) =>
      items.push({ id: h.id, type: 'panen', title: h.namaLahan, sub: h.varietas, tanggal: h.tanggalPanen, kg: Number(h.jumlahHasilKg) || 0, kode: h.kodePanen })
    );
    batches.slice(0, 100).forEach((b) =>
      items.push({ id: b.id, type: 'produksi', title: b.namaProduk, sub: b.operatorProduksi || 'Produksi', tanggal: b.tanggalProduksi, kg: Number(b.jumlahHasil) || 0, kode: b.kodeBatch })
    );
    return items
      .sort((a, b) => parseDate(b.tanggal).getTime() - parseDate(a.tanggal).getTime())
      .slice(0, 7);
  }, [harvests, batches]);

  const loadingBlock = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="h-[104px] bg-[#F7F7F5] animate-pulse rounded-2xl" />
      ))}
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* ── Header Hero ── */}
      <div className="bg-gradient-to-r from-[#2C4219] via-[#3a5a24] to-[#4a6b2f] rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#C3E28D]/10 rounded-full" />
        <div className="absolute right-24 -bottom-8 w-32 h-32 bg-[#C3E28D]/10 rounded-full" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-[#C3E28D] uppercase tracking-wider">
              Ringkasan Keseluruhan
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Dashboard Sorgum SCM</h1>
            <p className="text-xs text-white/80 mt-1 max-w-xl leading-relaxed">
              Pantau lahan, panen, gudang, produksi, sertifikat, hingga keuangan KWT dalam satu tampilan.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              to="/dashboard/panen"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C3E28D] text-[#172C05] text-xs font-extrabold hover:bg-[#d3ef9f] transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Catat Panen
            </Link>
            <Link
              to="/dashboard/gudang"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 text-white text-xs font-bold hover:bg-white/25 transition-colors border border-white/20"
            >
              Stok Gudang <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
          {loadError}
        </div>
      )}

      {/* ── Kartu Statistik ── */}
      {loading ? (
        loadingBlock
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                to={s.path}
                className="group bg-white rounded-2xl border border-[#c4c8bb]/30 p-3.5 sm:p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                    <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#c4c8bb] group-hover:text-[#2C4219] group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mt-3">
                  {s.label}
                </p>
                <p className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight truncate mt-0.5">
                  {s.value}
                </p>
                {(s.unit || s.hint) && (
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5 truncate">
                    {s.unit ? s.unit : s.hint}
                    {s.unit && s.hint ? ` • ${s.hint}` : ''}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Baris Grafik Utama ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Grafik Panen */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#c4c8bb]/15">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#172C05]">Grafik Hasil Panen</h2>
                <p className="text-[11px] text-[#6B7280]">Total panen per periode</p>
              </div>
            </div>
            <div className="flex bg-[#F7F7F5] rounded-lg p-0.5 border border-[#c4c8bb]/20">
              {(['Bulanan', 'Triwulan', 'Tahunan'] as TimeFilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    timeFilter === t ? 'bg-[#2C4219] text-[#C3E28D] shadow-sm' : 'text-[#6B7280] hover:text-[#2C4219]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            {loading ? (
              <div className="h-52 flex items-center justify-center text-xs text-[#6B7280] font-semibold">
                <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin mr-2" />
                Memuat grafik...
              </div>
            ) : chartData.items.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-xs text-[#9CA3AF] font-semibold">
                Belum ada data panen.
              </div>
            ) : (
              <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 px-1 border-b border-[#c4c8bb]/25">
                {chartData.items.map((item, idx) => {
                  const isTop = item.totalKg === chartData.maxKg && chartData.items.length > 1;
                  const hPct = Math.max(4, (item.totalKg / chartData.maxKg) * 100);
                  return (
                    <div key={item.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="relative w-full flex items-end justify-center h-full">
                        <div
                          className={`w-full max-w-[30px] sm:max-w-[42px] rounded-t-lg transition-all duration-500 ${
                            isTop
                              ? 'bg-gradient-to-t from-[#172C05] to-[#2C4219] ring-2 ring-[#C3E28D]/60 shadow'
                              : 'bg-gradient-to-t from-[#9ab56a] to-[#c3d99a] group-hover:from-[#2C4219] group-hover:to-[#788B4B]'
                          }`}
                          style={{ height: `${hPct}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-[#221A12] text-white text-[10px] font-bold py-1 px-2 rounded-md whitespace-nowrap z-10 transition-opacity shadow">
                            {formatBerat(item.totalKg)}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[11px] font-bold ${isTop ? 'text-[#2C4219]' : 'text-[#6B7280]'}`}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] text-[#74796d] font-semibold mt-2.5 px-1">
              <span>Total {formatBerat(chartData.totalKg)}</span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#2C4219]" /> Puncak
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#9ab56a]" /> Reguler
              </span>
            </div>
          </div>
        </div>

        {/* Donut Produksi */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#c4c8bb]/15">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#172C05]">Produk Olahan</h2>
              <p className="text-[11px] text-[#6B7280]">Distribusi batch produksi</p>
            </div>
          </div>
          <div className="pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-xs text-[#6B7280]">
                <span className="inline-block w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
                Memuat...
              </div>
            ) : donutData.items.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-10">Belum ada batch produksi.</p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 36 36">
                    <path className="text-[#efe0d2]" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    {donutData.items.map((item, idx) => {
                      const offset = donutData.items.slice(0, idx).reduce((a, i) => a + (i.total / donutData.grandTotal) * 100, 0);
                      const active = activeDonut === idx;
                      const dim = activeDonut !== null && !active;
                      const seg = Math.max(0.5, (item.total / donutData.grandTotal) * 100);
                      return (
                        <g
                          key={item.label}
                          className="cursor-pointer transition-opacity"
                          opacity={dim ? 0.35 : 1}
                          onMouseEnter={() => setActiveDonut(idx)}
                          onMouseLeave={() => setActiveDonut(null)}
                        >
                          <path
                            stroke={donutColors[idx % donutColors.length]}
                            strokeWidth={active ? 5 : 4}
                            strokeDasharray={`${seg}, 100`}
                            strokeDashoffset={idx === 0 ? 0 : -offset}
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            style={{ transition: 'stroke-width 0.2s ease', transform: active ? 'translate(1.2, 1.2)' : undefined, transformOrigin: 'center' }}
                          />
                        </g>
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    {activeDonut !== null && donutData.items[activeDonut] ? (
                      <>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#6B7280] max-w-[70px] truncate">{donutData.items[activeDonut].label}</span>
                        <span className="text-sm font-extrabold text-[#172C05]">{donutData.items[activeDonut].total.toLocaleString('id-ID')}</span>
                        <span className="text-[9px] font-bold text-[#2C4219]">{Math.round((donutData.items[activeDonut].total / donutData.grandTotal) * 100)}%</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-extrabold text-[#2C4219]">{donutData.grandTotal.toLocaleString('id-ID')}</span>
                        <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider">Total Unit</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full space-y-1.5 min-w-0">
                  {donutData.items.map((item, idx) => {
                    const pct = donutData.grandTotal > 0 ? Math.round((item.total / donutData.grandTotal) * 100) : 0;
                    const active = activeDonut === idx;
                    return (
                      <div
                        key={item.label}
                        onMouseEnter={() => setActiveDonut(idx)}
                        onMouseLeave={() => setActiveDonut(null)}
                        className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs transition-all cursor-default ${active ? 'bg-[#C3E28D]/30' : 'hover:bg-[#F7F7F5]'}`}
                      >
                        <span className="flex items-center gap-1.5 text-[#221A12] font-semibold truncate min-w-0">
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: donutColors[idx % donutColors.length] }} />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span className="font-bold text-[#2C4219] shrink-0">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Aktivitas Terbaru ── */}
      <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#c4c8bb]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#172C05]">Aktivitas Terbaru</h2>
              <p className="text-[11px] text-[#6B7280]">Catatan panen & produksi terakhir</p>
            </div>
          </div>
          <Link to="/dashboard/panen" className="inline-flex items-center gap-1 text-xs font-bold text-[#2C4219] hover:underline shrink-0">
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs text-[#6B7280]">
            <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin mr-2" />
            Memuat aktivitas...
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="p-8 text-center">
            <Layers className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-sm text-[#6B7280]">Belum ada aktivitas panen atau produksi.</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Mulai catat panen dari menu Panen.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#c4c8bb]/10">
            {recentActivity.map((a) => (
              <Link
                key={`${a.type}-${a.id}`}
                to={a.type === 'panen' ? '/dashboard/panen' : '/dashboard/produksi'}
                className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-[#F7F7F5] transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  a.type === 'panen' ? 'bg-[#C3E28D]/40 text-[#2C4219]' : 'bg-purple-100 text-purple-700'
                }`}>
                  {a.type === 'panen' ? <Sprout className="w-4 h-4" /> : <Factory className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#172C05] truncate">{a.title}</p>
                  <p className="text-[11px] text-[#6B7280] truncate">
                    {a.kode} • {a.sub}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-extrabold text-[#2C4219]">
                    {a.type === 'panen' ? formatBerat(a.kg) : `${a.kg.toLocaleString('id-ID')} unit`}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">{fmtTanggalId(a.tanggal)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
