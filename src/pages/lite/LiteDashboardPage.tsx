import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  Tractor,
  Package,
  Soup,
  ChevronRight,
  AlertCircle,
  Plus,
  Calendar,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { landApi } from '../../api/endpoints/landApi';
import { productionApi } from '../../api/endpoints/productionApi';
import { warehouseApi } from '../../api/endpoints/warehouseApi';
import { HarvestRecord, LandPlot, ProductionBatch } from '../../types';
import {
  formatBerat,
  formatTanggalId,
  getGreeting,
  LITE_CSS,
  PANEN_STATUS_COLOR,
  QC_STATUS_COLOR,
} from './liteDesign';

export const LiteDashboardPage: React.FC = () => {
  const [user] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const userName = user?.name || 'Ibu Petani';

  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [lands, setLands] = useState<LandPlot[]>([]);
  const [produksi, setProduksi] = useState<ProductionBatch[]>([]);
  const [totalStokGudang, setTotalStokGudang] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [hRes, lRes, pRes, wRes] = await Promise.allSettled([
          harvestApi.getAll({ limit: 1000 }),
          landApi.getAll({ limit: 1000 }),
          productionApi.getAll({ limit: 1000 }),
          warehouseApi.getAll({ limit: 1000 }),
        ]);

        if (hRes.status === 'fulfilled') setHarvests(hRes.value.data || []);
        if (lRes.status === 'fulfilled') setLands(lRes.value.data || []);
        if (pRes.status === 'fulfilled') setProduksi(pRes.value.data || []);
        if (wRes.status === 'fulfilled') {
          const wList = (wRes.value.data as any[]) || [];
          const stok = wList.reduce((s, w) => s + (Number(w.totalStokKg) || 0), 0);
          setTotalStokGudang(stok);
        }
      } catch {
        // abaikan error
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Metrik
  const totalPanenKg = harvests.reduce((s, h) => s + (Number(h.jumlahHasilKg) || 0), 0);
  const totalLahan = lands.length;
  const panenDalamProses = harvests.filter((h) => h.status === 'Dalam Proses' || h.status === 'Siap Panen').length;
  const olahanPendingQC = produksi.filter((p) => p.statusQC === 'Pending QC').length;

  // 5 Panen Terbaru
  const recentHarvests = [...harvests]
    .sort((a, b) => new Date(b.tanggalPanen).getTime() - new Date(a.tanggalPanen).getTime())
    .slice(0, 4);

  // Perlu Diperhatikan
  const perhatianList = [];
  if (panenDalamProses > 0) {
    perhatianList.push({
      title: `${panenDalamProses} Data Panen Perlu Diperbarui`,
      desc: 'Ada panen yang statusnya masih dalam proses atau siap panen.',
      href: '/lite/panen',
      color: 'bg-[#FFF8E1] border-[#FFE082] text-[#B78103]',
      icon: <Sprout className="w-5 h-5 text-[#B78103]" />,
    });
  }
  if (olahanPendingQC > 0) {
    perhatianList.push({
      title: `${olahanPendingQC} Olahan Menunggu Pemeriksaan Mutu`,
      desc: 'Batch olahan sedang menunggu verifikasi kualitas (QC).',
      href: '/lite/produksi',
      color: 'bg-[#E3F2FD] border-[#BBDEFB] text-[#1565C0]',
      icon: <Soup className="w-5 h-5 text-[#1565C0]" />,
    });
  }

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-6">
      {/* ── 1. Greeting Banner (Clean, Botanical, Balanced) ──────────────── */}
      <div className="bg-gradient-to-br from-[#2C4219] via-[#355120] to-[#253915] rounded-2xl p-5 sm:p-6 text-white shadow-sm relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-[#C3E28D]/10 pointer-events-none blur-xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[#C3E28D] text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3 h-3" /> {greeting}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{userName} 👋</h1>
          <p className="text-xs text-[#E0EBD6] font-medium mt-0.5">{today}</p>
          <p className="text-xs sm:text-sm text-[#F4EFEB] mt-2 max-w-xl leading-relaxed">
            Kelola dan pantau catatan panen, lahan tani, serta olahan sorgum KWT hari ini.
          </p>

          {/* Action Shortcuts */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              to="/lite/panen"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#172C05] text-xs font-bold shadow-xs hover:bg-[#F3EFE9] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#2C4219]" /> Catat Panen
            </Link>
            <Link
              to="/lite/lahan"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Tractor className="w-3.5 h-3.5" /> Kelola Lahan
            </Link>
            <Link
              to="/lite/gudang"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" /> Cek Gudang
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. Perlu Perhatian Segera (jika ada) ─────────────────────────── */}
      {!loading && perhatianList.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-sm sm:text-base font-bold text-[#172C05] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#B78103]" />
            Perlu Perhatian
          </h2>
          <div className="grid grid-cols-1 gap-2.5">
            {perhatianList.map((item, idx) => (
              <Link
                key={idx}
                to={item.href}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all hover:scale-[1.01] ${item.color} shadow-2xs`}
              >
                <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-2xs">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm leading-tight">{item.title}</h3>
                  <p className="text-[11px] sm:text-xs mt-0.5 opacity-90 leading-relaxed">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Ringkasan 4 Kartu Utama (Maksimal 2 Kolom) ────────────────── */}
      <div>
        <h2 className="text-sm sm:text-base font-bold text-[#172C05] flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#2C4219]" />
          Ringkasan Utama
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-[#ECE7DF] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Total Panen */}
            <Link
              to="/lite/panen"
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE7DF] shadow-[0_2px_12px_rgba(44,66,25,0.03)] hover:shadow-[0_6px_20px_rgba(44,66,25,0.06)] hover:border-[#D9D2C5] transition-all group flex items-start justify-between gap-3.5"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#70766B]">Total Hasil Panen</span>
                <p className="text-xl sm:text-2xl font-bold text-[#172C05] tracking-tight">
                  {formatBerat(totalPanenKg)}
                </p>
                <p className="text-xs text-[#8A9084]">{harvests.length} catatan panen terdaftar</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#EBF7EE] text-[#1B5E20] border border-[#C8E6C9] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6" />
              </div>
            </Link>

            {/* Card 2: Lahan */}
            <Link
              to="/lite/lahan"
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE7DF] shadow-[0_2px_12px_rgba(44,66,25,0.03)] hover:shadow-[0_6px_20px_rgba(44,66,25,0.06)] hover:border-[#D9D2C5] transition-all group flex items-start justify-between gap-3.5"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#70766B]">Lahan Pertanian</span>
                <p className="text-xl sm:text-2xl font-bold text-[#172C05] tracking-tight">
                  {totalLahan} <span className="text-sm font-semibold text-[#70766B]">Lahan</span>
                </p>
                <p className="text-xs text-[#8A9084]">Semua blok lahan produktif</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#FFF8E1] text-[#B78103] border border-[#FFE082] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Tractor className="w-6 h-6" />
              </div>
            </Link>

            {/* Card 3: Olahan */}
            <Link
              to="/lite/produksi"
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE7DF] shadow-[0_2px_12px_rgba(44,66,25,0.03)] hover:shadow-[0_6px_20px_rgba(44,66,25,0.06)] hover:border-[#D9D2C5] transition-all group flex items-start justify-between gap-3.5"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#70766B]">Batch Olahan</span>
                <p className="text-xl sm:text-2xl font-bold text-[#172C05] tracking-tight">
                  {produksi.length} <span className="text-sm font-semibold text-[#70766B]">Batch</span>
                </p>
                <p className="text-xs text-[#8A9084]">
                  {olahanPendingQC > 0 ? `${olahanPendingQC} menunggu QC` : 'Semua olahan selesai'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#EDE7F6] text-[#512DA8] border border-[#D1C4E9] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Soup className="w-6 h-6" />
              </div>
            </Link>

            {/* Card 4: Stok Gudang */}
            <Link
              to="/lite/gudang"
              className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE7DF] shadow-[0_2px_12px_rgba(44,66,25,0.03)] hover:shadow-[0_6px_20px_rgba(44,66,25,0.06)] hover:border-[#D9D2C5] transition-all group flex items-start justify-between gap-3.5"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#70766B]">Stok di Gudang</span>
                <p className="text-xl sm:text-2xl font-bold text-[#172C05] tracking-tight">
                  {formatBerat(totalStokGudang)}
                </p>
                <p className="text-xs text-[#8A9084]">Berdasarkan data stok aktif</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#E3F2FD] text-[#1565C0] border border-[#BBDEFB] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" />
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* ── 4. Aktivitas Panen Terbaru (Card Luas, Tidak Padat) ──────────── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base sm:text-lg font-black text-[#172C05] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2C4219]" />
            Aktivitas Panen Terbaru
          </h2>
          <Link
            to="/lite/panen"
            className="text-xs sm:text-sm font-bold text-[#2C4219] hover:underline flex items-center gap-1"
          >
            Lihat Semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-3xl border border-[#ECE7DF] animate-pulse" />
            ))}
          </div>
        ) : recentHarvests.length === 0 ? (
          <div className={LITE_CSS.emptyState}>
            <Sprout className="w-14 h-14 text-[#C3E28D] mx-auto mb-3" />
            <p className="text-lg font-bold text-[#172C05]">Belum ada catatan panen</p>
            <p className="text-sm text-[#70766B] mt-1">Mulai catat hasil panen sorgum pertama Anda.</p>
            <Link
              to="/lite/panen"
              className={LITE_CSS.btnPrimary + ' mt-5'}
            >
              <Plus className="w-5 h-5" /> Catat Panen Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentHarvests.map((h) => {
              const isSelesai = h.status === 'Selesai';
              return (
                <div
                  key={h.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-[#ECE7DF] shadow-[0_2px_12px_rgba(44,66,25,0.02)] flex items-center gap-4 transition-all hover:border-[#D9D2C5]"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isSelesai
                        ? 'bg-[#EBF7EE] text-[#1B5E20] border border-[#C8E6C9]'
                        : 'bg-[#FFF8E1] text-[#B78103] border border-[#FFE082]'
                    }`}
                  >
                    {isSelesai ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-[#172C05] text-base leading-tight truncate">
                      {h.namaLahan || 'Lahan Tanpa Nama'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#70766B] mt-0.5 truncate">
                      Varietas: <span className="font-semibold text-[#2D3328]">{h.varietas || '-'}</span> • {formatTanggalId(h.tanggalPanen)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base sm:text-lg font-black text-[#2C4219]">
                      {formatBerat(h.jumlahHasilKg)}
                    </p>
                    <span
                      className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1 ${
                        PANEN_STATUS_COLOR[h.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
