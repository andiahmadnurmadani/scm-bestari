import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Coins,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Layers,
  Award,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { landApi } from '../../api/endpoints/landApi';
import { productionApi } from '../../api/endpoints/productionApi';
import { packagingApi } from '../../api/endpoints/packagingApi';
import { logisticsApi } from '../../api/endpoints/logisticsApi';
import { certificatesApi } from '../../api/endpoints/certificatesApi';
import { HarvestRecord, LandPlot, ProductionBatch } from '../../types';

type TimeFilterType = 'Bulanan' | 'Triwulan' | 'Tahunan';

// ── Helper: tampilkan produk terbesar, sisanya digabung ke Lainnya ───────────────
function compactDonutItems(items: { label: string; total: number }[]) {
  const sorted = [...items].sort((a, b) => b.total - a.total);
  const top = sorted.slice(0, 4);
  const othersTotal = sorted.slice(4).reduce((acc, item) => acc + item.total, 0);
  return othersTotal > 0 ? [...top, { label: 'Lainnya', total: othersTotal }] : top;
}

// ── Helper: format tanggal & ekstrak periode ───────────────────────────────────
function parseHarvestDate(tanggal: string): Date {
  const d = new Date(tanggal);
  return isNaN(d.getTime()) ? new Date() : d;
}

function monthLabel(m: number): string {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return labels[m - 1] || `M${m}`;
}

/** Format tanggal ISO → "Senin, 3 Agustus 2026" (ramah dibaca user). */
function formatTanggalId(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  // Ambil bagian tanggal sebagai UTC — hindari pergeseran +1 hari karena zona waktu.
  const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const day = d.getUTCDate();
  const month = d.getUTCMonth();
  const year = d.getUTCFullYear();
  const weekday = namaHari[d.getUTCDay()];
  return `${weekday}, ${day} ${namaBulan[month]} ${year}`;
}

// ── Metric Card dengan tooltip full-text saat hover ───────────────────────────
interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  borderColor: string;
  subtitleCls?: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  borderColor,
  subtitleCls = 'text-[#2C4219]',
  loading,
}) => {
  return (
    <div
      className={`relative group bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] ${borderColor} transition-shadow hover:shadow-md`}
    >
      <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">{title}</p>
      {loading ? (
        <div className="h-6 bg-[#F7F7F5] animate-pulse rounded mt-1" />
      ) : (
        <>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1 truncate">
            {value}
          </h3>
          <p className={`text-xs font-semibold mt-0.5 sm:mt-1 truncate ${subtitleCls}`}>{subtitle}</p>
        </>
      )}

      {/* Tooltip full text saat hover — muncul di atas kartu */}
      {!loading && (
        <div className="absolute z-30 left-1/2 -translate-x-1/2 bottom-full mb-2.5 hidden group-hover:block w-max max-w-[260px] bg-[#221A12] text-white text-[11px] rounded-lg px-3 py-2 shadow-xl pointer-events-none">
          <p className="font-bold leading-snug">{value}</p>
          <p className="opacity-80 mt-0.5 leading-snug">{subtitle}</p>
          <span className="absolute left-1/2 -translate-x-1/2 top-full border-[5px] border-transparent border-t-[#221A12]" />
        </div>
      )}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('Bulanan');
  const [activeDonutIdx, setActiveDonutIdx] = useState<number | null>(null);

  // ── Data dari API ────────────────────────────────────────────────────────────
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [lands, setLands] = useState<LandPlot[]>([]);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [hRes, lRes, pRes] = await Promise.all([
          harvestApi.getAll({ page: 1, limit: 100 }),
          landApi.getAll({ page: 1, limit: 100 }),
          productionApi.getAll({ page: 1, limit: 100 }),
        ]);
        if (!cancelled) {
          setHarvests(hRes.data || []);
          setLands(lRes.data || []);
          setBatches(pRes.data || []);
          setLoadError('');
        }
      } catch {
        if (!cancelled) {
          setHarvests([]);
          setLands([]);
          setBatches([]);
          setLoadError('Gagal memuat data dari API. Periksa koneksi backend dan database.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Stat Cards dari data harvest ─────────────────────────────────────────────
  const landStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of harvests) {
      const key = h.namaLahan || 'Lahan Tanpa Nama';
      map.set(key, (map.get(key) || 0) + Number(h.jumlahHasilKg || 0));
    }
    const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const totalKg = harvests.reduce((acc, h) => acc + Number(h.jumlahHasilKg || 0), 0);
    const highest = entries[0];
    const lowest = entries[entries.length - 1];
    const avg = entries.length > 0 ? Math.round(totalKg / entries.length) : 0;
    return { entries, totalKg, highest, lowest, avg };
  }, [harvests]);

  // ── Grafik hasil panen per periode ───────────────────────────────────────────
  const chartData = useMemo(() => {
    if (harvests.length === 0) return { items: [], maxTonase: 1, totalLabel: '0 Ton' };

    const buckets = new Map<string, { label: string; tonase: number; sortKey: number }>();

    for (const h of harvests) {
      const d = parseHarvestDate(h.tanggalPanen);
      const kg = Number(h.jumlahHasilKg || 0);
      const ton = kg / 1000;
      let key = '';
      let label = '';
      let sortKey = 0;

      if (timeFilter === 'Bulanan') {
        key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        label = monthLabel(d.getMonth() + 1);
        sortKey = d.getFullYear() * 100 + (d.getMonth() + 1);
      } else if (timeFilter === 'Triwulan') {
        const q = Math.floor(d.getMonth() / 3) + 1;
        key = `${d.getFullYear()}-Q${q}`;
        label = `Q${q} (${['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Okt-Des'][q - 1]})`;
        sortKey = d.getFullYear() * 10 + q;
      } else {
        key = String(d.getFullYear());
        label = String(d.getFullYear());
        sortKey = d.getFullYear();
      }

      if (!buckets.has(key)) buckets.set(key, { label, tonase: 0, sortKey });
      buckets.get(key)!.tonase += ton;
    }

    const items = [...buckets.values()]
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((b) => ({ label: b.label, tonase: Math.round(b.tonase * 10) / 10 }));

    const maxTonase = Math.max(...items.map((i) => i.tonase), 1);
    const totalTon = items.reduce((acc, i) => acc + i.tonase, 0);
    return { items, maxTonase, totalLabel: `${Math.round(totalTon)} Ton` };
  }, [harvests, timeFilter]);

  const currentChart = chartData;

  // ── Hasil Panen Per Blok Lahan (progress bars) ───────────────────────────────
  const landProgress = useMemo(() => {
    if (landStats.entries.length === 0) return [];
    const maxVal = Math.max(...landStats.entries.map(([, v]) => v), 1);
    return landStats.entries.slice(0, 5).map(([nama, kg]) => ({
      nama,
      ton: Math.round((kg / 1000) * 10) / 10,
      percent: Math.max(8, Math.round((kg / maxVal) * 100)),
    }));
  }, [landStats]);

  // ── Donut: Produk Olahan (dari batch produksi) ───────────────────────────────
  const donutData = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of batches) {
      const label = b.namaProduk?.trim() || 'Produk Tanpa Nama';
      map.set(label, (map.get(label) || 0) + Number(b.jumlahHasil || 0));
    }
    const rawItems = [...map.entries()].map(([label, total]) => ({ label, total }));
    const items = compactDonutItems(rawItems);
    const grandTotal = rawItems.reduce((acc, i) => acc + i.total, 0);
    return { items, grandTotal };
  }, [batches]);

  const donutColors = ['#2C4219', '#788B4B', '#A8B774', '#D0DC9B', '#DEB938'];

  // ── Status QC produksi (progress bars) ───────────────────────────────────────
  const qcStats = useMemo(() => {
    const total = batches.length;
    const makeRow = (
      label: ProductionBatch['statusQC'],
      color: string,
      badgeCls: string
    ) => {
      const count = batches.filter((b) => b.statusQC === label).length;
      const percent = total > 0 ? Math.round((count / total) * 100) : 0;
      return { label, count, percent, color, badge: `${percent}%`, badgeCls };
    };

    return {
      total,
      rows: [
        makeRow('Lolos QC', '#2C4219', 'bg-[#2C4219] text-white'),
        makeRow('Pending QC', '#DEB938', 'bg-[#DEB938] text-[#172C05]'),
        makeRow('Revisi Batch', '#D9534F', 'bg-red-600 text-white'),
      ],
    };
  }, [batches]);

  // ── Recent harvest logs (terbaru) ────────────────────────────────────────────
  const recentHarvests = useMemo(() => {
    return [...harvests]
      .sort((a, b) => parseHarvestDate(b.tanggalPanen).getTime() - parseHarvestDate(a.tanggalPanen).getTime())
      .slice(0, 6);
  }, [harvests]);

  const filteredLogs = recentHarvests.filter(
    (item) =>
      item.namaLahan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.varietas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.petaniPenanggungJawab.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tanggalPanen.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fmtTon = (kg: number) => `${Math.round((kg / 1000) * 10) / 10} Ton`;

  return (
    <div className="space-y-5 pb-8">
      {/* Page Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">
            Dashboard
          </h1>
        </div>
      </div>

      {/* Row 1: Top Metric Summary Cards (4 Equal Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Lahan Panen Tertinggi */}
        <MetricCard
          title="LAHAN PANEN TERTINGGI"
          value={landStats.highest ? landStats.highest[0] : 'Belum ada data'}
          subtitle={landStats.highest ? fmtTon(landStats.highest[1]) : '0 Ton'}
          borderColor="border-l-[#1C3615]"
          loading={loading}
        />

        {/* Card 2: Lahan Panen Terendah */}
        <MetricCard
          title="LAHAN PANEN TERENDAH"
          value={landStats.lowest ? landStats.lowest[0] : 'Belum ada data'}
          subtitle={landStats.lowest ? fmtTon(landStats.lowest[1]) : '0 Ton'}
          borderColor="border-l-red-600"
          subtitleCls="text-red-600"
          loading={loading}
        />

        {/* Card 3: Rata-Rata Panen Lahan */}
        <MetricCard
          title="RATA-RATA PANEN LAHAN"
          value={landStats.avg > 0 ? fmtTon(landStats.avg) : '0 Ton'}
          subtitle={`Rata-rata dari ${landStats.entries.length} lahan tercatat`}
          borderColor="border-l-[#8C9E5B]"
          loading={loading}
        />

        {/* Card 4: Total Volume Hasil SCM */}
        <MetricCard
          title="TOTAL VOLUME HASIL SCM"
          value={landStats.totalKg > 0 ? fmtTon(landStats.totalKg) : '0 Ton'}
          subtitle={`${harvests.length} catatan panen tercatat`}
          borderColor="border-l-[#DEB938]"
          loading={loading}
        />
      </div>

      {/* Row 2: Harvest Yield Charts & Breakdown Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Main Bar Chart "Grafik Produksi Panen Lahan" */}
        <div className="lg:col-span-8 bg-white p-4 rounded-xl border border-[#c4c8bb]/30 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c4c8bb]/20 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#2C4219]">
                Grafik Hasil Panen Lahan
              </h2>
              <p className="text-[11px] text-[#6B7280] font-medium">
                {timeFilter === 'Bulanan' ? 'Jumlah panen per bulan (dalam Ton)' : timeFilter === 'Triwulan' ? 'Jumlah panen per triwulan (dalam Ton)' : 'Jumlah panen per tahun (dalam Ton)'}
              </p>
            </div>

            {/* Dropdown filter */}
            <div className="relative inline-block">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilterType)}
                className="px-2.5 py-1 rounded-lg bg-[#FFF8F4] border border-[#c4c8bb]/40 text-xs font-semibold text-[#2C4219] hover:bg-[#efe0d2] transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-[#2C4219]/30 appearance-none pr-7 shadow-2xs"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232C4219' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '0.9rem',
                }}
              >
                <option value="Bulanan">Bulanan</option>
                <option value="Triwulan">Triwulan</option>
                <option value="Tahunan">Tahunan</option>
              </select>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4">
            {loading ? (
              <div className="h-60 sm:h-64 flex items-center justify-center text-[#6B7280] text-xs font-semibold">
                <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                Memuat grafik panen...
              </div>
            ) : currentChart.items.length === 0 ? (
              <div className="h-60 sm:h-64 flex items-center justify-center text-[#9CA3AF] text-xs font-semibold">
                Belum ada data panen untuk ditampilkan.
              </div>
            ) : (
            <div className="h-60 sm:h-64 flex items-end justify-between gap-3 sm:gap-6 px-2 border-b border-[#c4c8bb]/30 pb-2">
              {currentChart.items.map((item, idx) => {
                const isHighest = item.tonase === currentChart.maxTonase && currentChart.items.length > 1;
                const heightPercent = Math.max(4, (item.tonase / currentChart.maxTonase) * 100);
                return (
                  <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center h-full relative">
                      {isHighest && (
                        <div className="absolute -top-8 bg-[#2C4219] text-[#C3E28D] text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-xs animate-bounce z-10">
                          Puncak ({item.tonase.toLocaleString('id-ID')} Ton)
                        </div>
                      )}
                      <div
                        className={`w-full max-w-[28px] sm:max-w-[42px] rounded-t-xl transition-all duration-500 relative ${
                          isHighest
                            ? 'bg-gradient-to-t from-[#172C05] to-[#2C4219] ring-2 ring-[#C3E28D]/50 shadow-md'
                            : 'bg-gradient-to-t from-[#788B4B] to-[#A8B774] hover:from-[#2C4219] hover:to-[#A8B774]'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      >
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 bg-[#221A12] text-white text-[11px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap z-20 transition-opacity shadow-lg">
                          {item.tonase.toLocaleString('id-ID')} Ton
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold text-center ${
                        isHighest ? 'text-[#2C4219] underline decoration-[#C3E28D] decoration-2' : 'text-[#44483e]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#74796d] font-semibold mt-3 px-2 gap-1">
              <span>Total {currentChart.totalLabel} tercatat di sistem</span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-[#2C4219] rounded-xs" /> Puncak
                <span className="inline-block w-3 h-3 bg-[#A8B774] rounded-xs" /> Reguler
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Side Progress Bar Widget "Hasil Panen Per Blok Lahan" */}
        <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-[#c4c8bb]/30 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#c4c8bb]/20 pb-3">
              <h2 className="text-sm font-semibold text-[#2C4219]">
                Hasil Panen Per Blok Lahan
              </h2>
              <p className="text-[11px] text-[#6B7280] font-medium">Hasil panen dari setiap lokasi lahan</p>
            </div>

            <div className="mt-4 space-y-3.5">
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-10 bg-[#F7F7F5] animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : landProgress.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] text-center py-6">Belum ada data panen per lahan.</p>
              ) : (
                landProgress.map((item, idx) => {
                  const barColor =
                    idx === 0
                      ? '#2C4219'
                      : idx === 1
                      ? '#788B4B'
                      : idx === 2
                      ? '#A8B774'
                      : idx === 3
                      ? '#DEB938'
                      : '#D9534F';
                  return (
                    <div key={item.nama} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#221A12] truncate pr-2">{item.nama}</span>
                        <span className="text-[#2C4219] font-bold whitespace-nowrap">{item.ton} Ton</span>
                      </div>
                      <div className="w-full h-2 bg-[#efe0d2]/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percent}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <p className="text-[10px] text-[#6B7280] font-medium">
                        {Math.round((item.percent / 100) * 100)}% dari lahan tertinggi
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#c4c8bb]/20">
            <Link
              to="/dashboard/lahan"
              className="w-full py-2 px-3 rounded-lg bg-[#F7F7F5] hover:bg-[#efe0d2] text-[#2C4219] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-[#c4c8bb]/30"
            >
              <span>Kelola Detail Lahan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: Processing Production Charts & Breakdown Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Donut Chart "Grafik Produksi Pengolahan" */}
        <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-[#c4c8bb]/30 shadow-2xs space-y-4">
          <div className="border-b border-[#c4c8bb]/20 pb-3">
            <h2 className="text-sm font-semibold text-[#2C4219]">
              Grafik Produksi Olahan Sorgum
            </h2>
            <p className="text-[11px] text-[#6B7280] font-medium">Pembagian jenis produk olahan dari batch produksi</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-[#6B7280] text-xs font-semibold">
              <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
              Memuat...
            </div>
          ) : loadError ? (
            <p className="text-xs text-red-600 text-center py-8 font-semibold">{loadError}</p>
          ) : donutData.items.length === 0 ? (
            <p className="text-xs text-[#9CA3AF] text-center py-8">Belum ada batch produksi tercatat.</p>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Donut graphic with center stat — interaktif hover */}
            <div className="sm:col-span-5 flex justify-center relative py-1">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#efe0d2]/40"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {donutData.items.map((item, idx) => {
                  const offset = donutData.items
                    .slice(0, idx)
                    .reduce((acc, i) => acc + (i.total / donutData.grandTotal) * 100, 0);
                  const isActive = activeDonutIdx === idx;
                  const isDimmed = activeDonutIdx !== null && !isActive;
                  const segLen = Math.max(0.5, (item.total / donutData.grandTotal) * 100);
                  // Segmen aktif digeser sedikit ke luar agar menonjol
                  const shift = isActive ? 1.4 : 0;
                  const dashOffset = idx === 0 ? 0 : -offset;
                  return (
                    <g
                      key={item.label}
                      className="cursor-pointer transition-opacity"
                      opacity={isDimmed ? 0.35 : 1}
                      onMouseEnter={() => setActiveDonutIdx(idx)}
                      onMouseLeave={() => setActiveDonutIdx(null)}
                    >
                      <path
                        stroke={donutColors[idx % donutColors.length]}
                        strokeWidth={isActive ? 5.5 : 4.5}
                        strokeDasharray={`${segLen}, 100`}
                        strokeDashoffset={dashOffset}
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        style={{
                          transition: 'stroke-width 0.2s ease',
                          transform: shift > 0 ? `translate(${shift}, ${shift})` : undefined,
                          transformOrigin: 'center',
                        }}
                      />
                      {/* Area klik lebih luas (invisible) untuk kemudahan hover */}
                      <path
                        stroke="transparent"
                        strokeWidth="9"
                        strokeDasharray={`${segLen}, 100`}
                        strokeDashoffset={dashOffset}
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Center stat — berubah sesuai segmen yang di-hover */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                {activeDonutIdx !== null && donutData.items[activeDonutIdx] ? (
                  <>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280] max-w-[80px] truncate">
                      {donutData.items[activeDonutIdx].label}
                    </span>
                    <span className="text-base font-extrabold text-[#221A12]">
                      {donutData.items[activeDonutIdx].total.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[9px] font-bold text-[#2C4219]">
                      {Math.round((donutData.items[activeDonutIdx].total / donutData.grandTotal) * 100)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-lg font-extrabold text-[#2C4219]">
                      {donutData.grandTotal.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider">
                      Total Unit
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Legend Grid — highlight saat segmen di-hover */}
            <div className="sm:col-span-7 space-y-2 text-xs font-medium">
              {donutData.items.map((item, idx) => {
                const pct = donutData.grandTotal > 0 ? Math.round((item.total / donutData.grandTotal) * 100) : 0;
                const isActive = activeDonutIdx === idx;
                const isDimmed = activeDonutIdx !== null && !isActive;
                return (
                  <div
                    key={item.label}
                    onMouseEnter={() => setActiveDonutIdx(idx)}
                    onMouseLeave={() => setActiveDonutIdx(null)}
                    className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-default ${
                      isActive
                        ? 'bg-[#C3E28D]/40 ring-1 ring-[#2C4219]/20 scale-[1.02]'
                        : isDimmed
                        ? 'bg-[#F7F7F5] opacity-50'
                        : 'bg-[#F7F7F5]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[#221A12]">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0 transition-transform"
                        style={{ backgroundColor: donutColors[idx % donutColors.length], transform: isActive ? 'scale(1.25)' : undefined }}
                      />
                      {item.label}
                    </span>
                    <span className="font-bold text-[#2C4219]">
                      {item.total.toLocaleString('id-ID')} Unit ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>

        {/* Right Card: Status Progress "Output Produksi Pengolahan" */}
        <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-[#c4c8bb]/30 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#c4c8bb]/20 pb-3">
              <h2 className="text-sm font-semibold text-[#2C4219]">
                Status Hasil Olahan Sorgum
              </h2>
              <p className="text-[11px] text-[#6B7280] font-medium">Status QC batch produksi saat ini</p>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-12 bg-[#F7F7F5] animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : loadError ? (
                <p className="text-xs text-red-600 text-center py-6 font-semibold">{loadError}</p>
              ) : batches.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] text-center py-6">Belum ada batch produksi tercatat.</p>
              ) : (
                qcStats.rows.map((row) => (
                  <div key={row.label} className="p-2.5 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#221A12]">
                        {row.label}
                        <span className="text-[#6B7280] font-medium ml-1">({row.count} batch)</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full ${row.badgeCls} text-[9px] font-bold`}>
                        {row.badge}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#efe0d2] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${row.percent}%`, backgroundColor: row.color }}
                      />
                    </div>
                    <p className="text-[10px] text-[#6B7280] font-medium">
                      {row.count} dari {qcStats.total} batch produksi
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Integrated Table ("Catatan Panen & Produksi Olahan Terbaru") */}
      <div className="bg-white p-4 rounded-xl border border-[#c4c8bb]/30 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#c4c8bb]/20 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#2C4219]">
              Catatan Panen & Hasil Olahan Terbaru
            </h2>
          </div>
          <Link
            to="/dashboard/panen"
            className="text-xs font-semibold text-[#2C4219] hover:text-[#172C05] flex items-center gap-1 transition-colors hover:underline"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-[#221A12] min-w-[640px]">
            <thead>
              <tr className="border-b border-[#c4c8bb]/20 text-[#6B7280] font-bold uppercase text-[11px] tracking-wider">
                <th className="py-2 px-3">Tanggal</th>
                <th className="py-2 px-3">Lokasi Lahan</th>
                <th className="py-2 px-3">Varietas</th>
                <th className="py-2 px-3">Tonase Panen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#6B7280]">
                    <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                    Memuat catatan panen...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-2 px-3 text-[#44483e] whitespace-nowrap">
                      {formatTanggalId(row.tanggalPanen)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-[#172C05]">{row.namaLahan}</td>
                    <td className="py-2 px-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#C3E28D]/30 text-[#172C05] border border-[#b4cf98] text-[10px] font-bold">
                        {row.varietas}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-[#2C4219]">{fmtTon(row.jumlahHasilKg)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-[#6B7280]">
                    Tidak ada catatan panen yang sesuai pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
