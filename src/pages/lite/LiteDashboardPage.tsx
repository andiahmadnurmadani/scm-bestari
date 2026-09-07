import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tractor,
  Sprout,
  Warehouse,
  Factory,
  ChevronRight,
  PackageCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
} from 'lucide-react';
import { landApi } from '../../api/endpoints/landApi';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { warehouseApi } from '../../api/endpoints/warehouseApi';
import { productionApi } from '../../api/endpoints/productionApi';
import { useUnitSettings } from '../../context/UnitSettingsContext';
import { formatTanggalId } from '../../utils/dateUtils';

export const LiteDashboardPage: React.FC = () => {
  const { formatBerat } = useUnitSettings();
  const [stats, setStats] = useState({ lahan: 0, panen: 0, totalPanenKg: 0, gudangStokKg: 0, olahan: 0 });
  const [recentHarvests, setRecentHarvests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [l, h, w, p] = await Promise.allSettled([
          landApi.getAll({ limit: 1000 }),
          harvestApi.getAll({ limit: 1000 }),
          warehouseApi.getAll({ limit: 1000 }),
          productionApi.getAll({ limit: 1000 }),
        ]);
        if (!mounted) return;
        const lands = l.status === 'fulfilled' ? l.value.data || [] : [];
        const harvests = h.status === 'fulfilled' ? h.value.data || [] : [];
        const warehouses = w.status === 'fulfilled' ? w.value.data || [] : [];
        const productions = p.status === 'fulfilled' ? p.value.data || [] : [];
        setStats({
          lahan: lands.length,
          panen: harvests.length,
          totalPanenKg: harvests.reduce((s, x) => s + (Number(x.jumlahHasilKg) || 0), 0),
          gudangStokKg: warehouses.reduce((s, x) => s + (Number(x.totalStokKg) || 0), 0),
          olahan: productions.length,
        });
        setRecentHarvests(
          [...harvests]
            .sort((a, b) => String(b.tanggalPanen || '').localeCompare(String(a.tanggalPanen || '')))
            .slice(0, 5)
        );
      } catch {
        // abaikan — statistik kosong
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    { label: 'Lahan Terdaftar', value: stats.lahan, unit: 'lahan', icon: Tractor, path: '/lite/lahan', color: 'text-[#2C4219] bg-[#C3E28D]/30' },
    { label: 'Catatan Panen', value: stats.panen, unit: 'kali panen', icon: Sprout, path: '/lite/panen', color: 'text-[#b45309] bg-amber-100' },
    { label: 'Total Hasil Panen', value: formatBerat(stats.totalPanenKg), unit: '', icon: PackageCheck, path: '/lite/panen', color: 'text-emerald-700 bg-emerald-100' },
    { label: 'Stok di Gudang', value: formatBerat(stats.gudangStokKg), unit: '', icon: Warehouse, path: '/lite/gudang', color: 'text-sky-700 bg-sky-100' },
    { label: 'Batch Olahan', value: stats.olahan, unit: 'batch', icon: Factory, path: '/lite/produksi', color: 'text-purple-700 bg-purple-100' },
  ];

  const quickActions = [
    { label: 'Catat Tanam', desc: 'Catat penanaman di lahan dulu', path: '/lite/lahan', icon: Tractor },
    { label: 'Catat Panen Baru', desc: 'Input hasil panen dari lahan', path: '/lite/panen', icon: Sprout },
    { label: 'Catat Stok Masuk', desc: 'Simpan hasil panen ke gudang', path: '/lite/gudang', icon: ArrowDownToLine },
    { label: 'Catat Olahan', desc: 'Produksi dari bahan gudang', path: '/lite/produksi', icon: Factory },
  ];

  return (
    <div className="space-y-5 pb-6">
      {/* Header sambutan */}
      <div className="bg-gradient-to-r from-[#2C4219] to-[#4a6b2f] rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-40 h-40 bg-[#C3E28D]/10 rounded-full" />
        <div className="absolute right-16 bottom-0 w-24 h-24 bg-[#C3E28D]/10 rounded-full" />
        <p className="text-xs font-semibold text-[#C3E28D]">Selamat datang 👋</p>
        <h1 className="text-xl sm:text-2xl font-extrabold mt-1">Ringkasan Sorgum KWT</h1>
        <p className="text-xs text-white/80 mt-1 max-w-md leading-relaxed">
          Pantau lahan, panen, gudang, dan olahan Anda dari satu tempat.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              to={c.path}
              className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-3.5 hover:shadow-md transition-all group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.color}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-[11px] font-semibold text-[#6B7280] mt-2.5">{c.label}</p>
              <p className="text-lg font-extrabold text-[#172C05] leading-tight truncate">
                {c.value}
              </p>
              {c.unit && <p className="text-[10px] text-[#9CA3AF]">{c.unit}</p>}
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-bold text-[#172C05] mb-2.5">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                to={a.path}
                className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 flex items-center gap-3 hover:border-[#2C4219]/40 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#172C05]">{a.label}</p>
                  <p className="text-[11px] text-[#6B7280] truncate">{a.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#2C4219] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent harvests */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-[#172C05]">Panen Terbaru</h2>
          <Link to="/lite/panen" className="text-[11px] font-bold text-[#2C4219] hover:underline flex items-center gap-0.5">
            Lihat Semua <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 overflow-hidden">
          {loading ? (
            <p className="p-6 text-center text-xs text-[#6B7280]">Memuat data...</p>
          ) : recentHarvests.length === 0 ? (
            <p className="p-6 text-center text-xs text-[#6B7280]">
              Belum ada catatan panen. <Link to="/lite/panen" className="text-[#2C4219] font-bold">Catat sekarang</Link>
            </p>
          ) : (
            recentHarvests.map((h, i) => (
              <div key={h.id} className={`flex items-center gap-3 px-4 py-3 ${i !== recentHarvests.length - 1 ? 'border-b border-[#c4c8bb]/15' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-[#C3E28D]/30 text-[#2C4219] flex items-center justify-center shrink-0">
                  <Sprout className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#172C05] truncate">{h.namaLahan}</p>
                  <p className="text-[11px] text-[#6B7280]">
                    {h.kodePanen} • {formatTanggalId(h.tanggalPanen)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] font-extrabold text-[#2C4219]">{formatBerat(Number(h.jumlahHasilKg) || 0)}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{h.varietas}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info mode */}
      <div className="flex items-start gap-3 p-4 bg-[#fff1e5] rounded-2xl border border-[#c4c8bb]/25">
        <div className="w-8 h-8 rounded-lg bg-[#2C4219] text-[#C3E28D] flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4" />
        </div>
        <div className="text-xs text-[#44483e] leading-relaxed">
          <p className="font-bold text-[#172C05]">Butuh fitur lengkap?</p>
          <p>
            Gunakan <b>Mode Lengkap (Pro)</b> di menu samping untuk mengelola sertifikat, kemasan, logistik, hingga konten website.
          </p>
        </div>
      </div>
    </div>
  );
};
