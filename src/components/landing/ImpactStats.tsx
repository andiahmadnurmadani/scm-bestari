import React, { useEffect, useState } from 'react';
import { Sprout, TrendingUp, Users, Building2 } from 'lucide-react';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { landApi } from '../../api/endpoints/landApi';
import { productionApi } from '../../api/endpoints/productionApi';

interface StatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}

export const ImpactStats: React.FC = () => {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const [harvestRes, landRes, prodRes] = await Promise.all([
          harvestApi.getAll({ page: 1, limit: 1 }),
          landApi.getAll({ page: 1, limit: 1 }),
          productionApi.getAll({ page: 1, limit: 1 }),
        ]);

        if (cancelled) return;

        // Ambil semua data untuk hitung total (pakai limit besar)
        const [allHarvest, allLands, allProd] = await Promise.all([
          harvestApi.getAll({ page: 1, limit: 100 }),
          landApi.getAll({ page: 1, limit: 100 }),
          productionApi.getAll({ page: 1, limit: 100 }),
        ]);

        const totalKg = (allHarvest.data || []).reduce((acc, h) => acc + (h.jumlahHasilKg || 0), 0);
        const totalLahan = (allLands.data || []).length;
        const totalBatch = (allProd.data || []).length;
        const totalTonase = totalKg / 1000;

        setStats([
          {
            label: 'Total Hasil Panen',
            value: totalTonase > 0 ? `${totalTonase.toLocaleString('id-ID', { maximumFractionDigits: 1 })}+ Ton` : '0 Ton',
            icon: <Sprout className="w-5 h-5" />,
            accent: true,
          },
          {
            label: 'Total Lahan Terdaftar',
            value: totalLahan > 0 ? `${totalLahan}+ Lahan` : '0 Lahan',
            icon: <Building2 className="w-5 h-5" />,
          },
          {
            label: 'Batch Produksi',
            value: totalBatch > 0 ? `${totalBatch}+ Batch` : '0 Batch',
            icon: <TrendingUp className="w-5 h-5" />,
            accent: true,
          },
          {
            label: 'Data Tercatat',
            value: harvestRes.pagination?.total > 0 ? `${harvestRes.pagination?.total || 0} Catatan` : '0 Catatan',
            icon: <Users className="w-5 h-5" />,
          },
        ]);
      } catch {
        if (cancelled) return;
        setStats([
          { label: 'Total Hasil Panen', value: '0 Ton', icon: <Sprout className="w-5 h-5" />, accent: true },
          { label: 'Total Lahan Terdaftar', value: '0 Lahan', icon: <Building2 className="w-5 h-5" /> },
          { label: 'Batch Produksi', value: '0 Batch', icon: <TrendingUp className="w-5 h-5" />, accent: true },
          { label: 'Data Tercatat', value: '0 Catatan', icon: <Users className="w-5 h-5" /> },
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-12 bg-[#2C4219] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
              <div className="w-10 h-10 rounded-xl bg-[#C3E28D]/20 text-[#C3E28D] mx-auto flex items-center justify-center mb-2">
                {stat.icon}
              </div>
              <p className={`text-xl sm:text-3xl font-black ${stat.accent ? 'text-[#C3E28D]' : 'text-white'}`}>
                {loading ? '…' : stat.value}
              </p>
              <p className="text-xs text-[#efe0d2] font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
