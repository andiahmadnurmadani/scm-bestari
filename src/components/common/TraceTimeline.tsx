import React from 'react';
import { Sprout, MapPin, Calendar, Leaf, Package, Award } from 'lucide-react';

interface TraceProps {
  lahan?: { kodeLahan?: string; namaLahan: string; lokasiDesa?: string; luasHektar?: number } | null;
  planting?: { kodeTanam: string; tanggalTanam: string; estimasiPanen?: string | null; varietas?: string; jumlahLubang?: number; petugas?: string; statusTanam?: string } | null;
  harvest?: { kodePanen: string; tanggalPanen: string; varietas?: string; jumlahHasilKg?: number; petaniPenanggungJawab?: string; periodeHari?: number | null } | null;
  production?: { kodeBatch: string; namaProduk: string; jumlahHasil?: number; satuan?: string; statusQC?: string } | null;
}

export const TraceTimeline: React.FC<TraceProps> = ({ lahan, planting, harvest, production }) => {
  const steps = [];
  if (lahan) steps.push({ key: 'lahan', title: 'Lahan', desc: lahan.namaLahan, sub: `${lahan.kodeLahan || ''} ${lahan.lokasiDesa ? `• ${lahan.lokasiDesa}` : ''} ${lahan.luasHektar ? `• ${lahan.luasHektar} Ha` : ''}`, icon: MapPin, color: 'bg-[#2C4219] text-white' });
  if (planting) steps.push({ key: 'planting', title: 'Tanam', desc: `${planting.kodeTanam} • ${planting.varietas || ''}`, sub: `${planting.tanggalTanam}${planting.estimasiPanen ? ` → Est. ${planting.estimasiPanen}` : ''} • ${planting.jumlahLubang?.toLocaleString('id-ID') || 0} lubang • ${planting.petugas || '-'}`, icon: Sprout, color: 'bg-[#C3E28D] text-[#172C05]' });
  if (harvest) steps.push({ key: 'harvest', title: 'Panen', desc: `${harvest.kodePanen}${harvest.periodeHari != null ? ` • ${harvest.periodeHari} hari` : ''}`, sub: `${harvest.tanggalPanen} • ${harvest.varietas || ''} • ${harvest.jumlahHasilKg ? `${(harvest.jumlahHasilKg/1000).toFixed(1)} Ton` : ''}`, icon: Leaf, color: 'bg-[#2C4219] text-white' });
  if (production) steps.push({ key: 'production', title: 'Olahan', desc: `${production.kodeBatch} • ${production.namaProduk}`, sub: `${production.jumlahHasil?.toLocaleString('id-ID') || 0} ${production.satuan || ''} • ${production.statusQC || ''}`, icon: Package, color: 'bg-amber-100 text-amber-800' });

  if (steps.length === 0) return null;
  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[#c4c8bb]/30" />
      <div className="space-y-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="relative flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 p-3 bg-white rounded-xl border border-[#c4c8bb]/20 min-w-0">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">{s.title}</p>
                <p className="text-xs font-bold text-[#221A12] mt-0.5 truncate">{s.desc}</p>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed break-words">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
