import React, { useEffect, useState } from 'react';
import { Sprout, TrendingUp, Users, Building2 } from 'lucide-react';

export const ImpactStats: React.FC = () => {
  const [kgCount, setKgCount] = useState(0);
  const [miliarCount, setMiliarCount] = useState(0);
  const [efisiensiCount, setEfisiensiCount] = useState(0);
  const [kwtCount, setKwtCount] = useState(0);

  useEffect(() => {
    // Smooth counting effect on mount
    const duration = 1200; // ms
    const steps = 30;
    const intervalTime = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);

      setKgCount(Math.round(progress * 50000));
      setMiliarCount(parseFloat((progress * 1.2).toFixed(1)));
      setEfisiensiCount(Math.round(progress * 30));
      setKwtCount(Math.round(progress * 15));

      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 bg-[#2C4219] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {/* Stat 1 */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#C3E28D]/20 text-[#C3E28D] mx-auto flex items-center justify-center mb-2">
              <Sprout className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-4xl font-black text-[#C3E28D]">
              {kgCount.toLocaleString('id-ID')}+ Kg
            </p>
            <p className="text-xs text-[#efe0d2] font-semibold">Total Hasil Panen</p>
          </div>

          {/* Stat 2 */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#C3E28D]/20 text-[#C3E28D] mx-auto flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-4xl font-black text-white">
              Rp {miliarCount} Miliar
            </p>
            <p className="text-xs text-[#efe0d2] font-semibold">Nilai Transaksi KWT</p>
          </div>

          {/* Stat 3 */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#C3E28D]/20 text-[#C3E28D] mx-auto flex items-center justify-center mb-2">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-4xl font-black text-[#C3E28D]">
              {efisiensiCount}%
            </p>
            <p className="text-xs text-[#efe0d2] font-semibold">Efisiensi Distribusi</p>
          </div>

          {/* Stat 4 */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
            <div className="w-10 h-10 rounded-xl bg-[#C3E28D]/20 text-[#C3E28D] mx-auto flex items-center justify-center mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-2xl sm:text-4xl font-black text-white">
              {kwtCount}+
            </p>
            <p className="text-xs text-[#efe0d2] font-semibold">Mitra Kelompok Tani</p>
          </div>
        </div>
      </div>
    </section>
  );
};
