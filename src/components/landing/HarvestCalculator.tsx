import React, { useState } from 'react';
import { Calculator, ArrowRight, Sprout, Coins, PackageCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HarvestCalculator: React.FC = () => {
  const [luasLahan, setLuasLahan] = useState<number>(2.0); // Default 2 Ha
  const [targetOlahan, setTargetOlahan] = useState<'Tepung' | 'Beras' | 'Rengginang'>('Tepung');

  // Calculations
  // Average raw harvest: 4.5 Ton per Hectare
  const estimasiPanenTon = luasLahan * 4.5;
  const estimasiPanenKg = estimasiPanenTon * 1000;

  let hasilOlahanKg = 0;
  let potensiNilaiJual = 0;
  let jumlahKemasan = 0;
  let jenisKemasanLabel = '';

  if (targetOlahan === 'Tepung') {
    // Rendemen Tepung: 85%
    hasilOlahanKg = estimasiPanenKg * 0.85;
    potensiNilaiJual = hasilOlahanKg * 18000; // Rp 18.000 / Kg
    jumlahKemasan = Math.round(hasilOlahanKg * 2); // Pouch 500g
    jenisKemasanLabel = 'Pouch 500 Gram';
  } else if (targetOlahan === 'Beras') {
    // Rendemen Beras Sosoh: 75%
    hasilOlahanKg = estimasiPanenKg * 0.75;
    potensiNilaiJual = hasilOlahanKg * 22000; // Rp 22.000 / Kg
    jumlahKemasan = Math.round(hasilOlahanKg); // Kemasan 1 Kg
    jenisKemasanLabel = 'Kemasan 1 Kg Vacuum';
  } else {
    // Snack Rengginang: Rendemen 60%, 1 Box = 250g (4 Box per Kg)
    hasilOlahanKg = estimasiPanenKg * 0.6;
    jumlahKemasan = Math.round(hasilOlahanKg * 4); // Box 250g
    potensiNilaiJual = jumlahKemasan * 15000; // Rp 15.000 / Box
    jenisKemasanLabel = 'Box Custom 250 Gram';
  }

  const formatRupiah = (val: number) => {
    if (val >= 1000000000) {
      return `Rp ${(val / 1000000000).toFixed(2)} Miliar`;
    }
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(1)} Juta`;
    }
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  return (
    <section id="kalkulator" className="py-16 bg-[#FFF8F4] border-y border-[#c4c8bb]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#c4c8bb]/30 shadow-md">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C3E28D]/40 text-[#172C05] text-xs font-black uppercase tracking-wider mb-2">
              <Calculator className="w-4 h-4 text-[#2C4219]" />
              <span>Simulasi Usaha Tani KWT</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#2C4219]">
              Kalkulator Potensi Panen Sorgum
            </h2>
            <p className="text-xs sm:text-sm text-[#44483e] font-medium mt-2">
              Berapa estimasi hasil panen dan pendapatan dari lahan sorgum Anda? Coba hitung di bawah ini!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Controls */}
            <div className="lg:col-span-5 bg-[#FFF8F4] p-6 rounded-2xl border border-[#c4c8bb]/30 space-y-6">
              {/* Slider 1: Luas Lahan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#2C4219]">
                  <span>Luas Lahan Pertanian</span>
                  <span className="px-3 py-1 rounded-full bg-[#2C4219] text-[#C3E28D] text-sm font-black">
                    {luasLahan} Hektar
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={luasLahan}
                  onChange={(e) => setLuasLahan(parseFloat(e.target.value))}
                  className="w-full accent-[#2C4219] cursor-pointer h-2 bg-[#efe0d2] rounded-lg"
                />
                <div className="flex justify-between text-[11px] text-[#74796d] font-semibold">
                  <span>0,5 Ha (Lahan KWT)</span>
                  <span>5 Ha</span>
                  <span>10 Ha</span>
                </div>
              </div>

              {/* Control 2: Target Olahan */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-extrabold text-[#2C4219]">
                  Target Produk Olahan Utama
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetOlahan('Tepung')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      targetOlahan === 'Tepung'
                        ? 'bg-[#2C4219] text-[#C3E28D] border-[#172C05] shadow-xs'
                        : 'bg-white text-[#44483e] border-[#c4c8bb]/40 hover:bg-[#efe0d2]/30'
                    }`}
                  >
                    Tepung Sorgum
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetOlahan('Beras')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      targetOlahan === 'Beras'
                        ? 'bg-[#2C4219] text-[#C3E28D] border-[#172C05] shadow-xs'
                        : 'bg-white text-[#44483e] border-[#c4c8bb]/40 hover:bg-[#efe0d2]/30'
                    }`}
                  >
                    Beras Sorgum
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetOlahan('Rengginang')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      targetOlahan === 'Rengginang'
                        ? 'bg-[#2C4219] text-[#C3E28D] border-[#172C05] shadow-xs'
                        : 'bg-white text-[#44483e] border-[#c4c8bb]/40 hover:bg-[#efe0d2]/30'
                    }`}
                  >
                    Rengginang
                  </button>
                </div>
              </div>
            </div>

            {/* Right Output Cards */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Output Card 1: Estimasi Hasil Panen */}
                <div className="bg-[#2C4219] text-white p-5 rounded-2xl border border-[#172C05] shadow-xs flex flex-col justify-between space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 text-[#C3E28D] flex items-center justify-center">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#efe0d2] font-bold block uppercase tracking-wider">
                      Estimasi Hasil Panen
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-[#C3E28D] mt-1">
                      {estimasiPanenTon.toFixed(1)} Ton
                    </p>
                    <p className="text-[11px] text-[#efe0d2] font-semibold mt-0.5">
                      ({estimasiPanenKg.toLocaleString('id-ID')} Kg Basah)
                    </p>
                  </div>
                </div>

                {/* Output Card 2: Potensi Nilai Jual */}
                <div className="bg-[#2C4219] text-white p-5 rounded-2xl border border-[#172C05] shadow-xs flex flex-col justify-between space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 text-[#C3E28D] flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#efe0d2] font-bold block uppercase tracking-wider">
                      Potensi Nilai Jual
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-white mt-1">
                      {formatRupiah(potensiNilaiJual)}
                    </p>
                    <p className="text-[11px] text-[#C3E28D] font-semibold mt-0.5">
                      Omzet Hasil Olahan
                    </p>
                  </div>
                </div>

                {/* Output Card 3: Jumlah Produk Olahan */}
                <div className="bg-[#2C4219] text-white p-5 rounded-2xl border border-[#172C05] shadow-xs flex flex-col justify-between space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 text-[#C3E28D] flex items-center justify-center">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#efe0d2] font-bold block uppercase tracking-wider">
                      Estimasi Olahan
                    </span>
                    <p className="text-xl sm:text-2xl font-black text-[#C3E28D] mt-1">
                      {jumlahKemasan.toLocaleString('id-ID')} Unit
                    </p>
                    <p className="text-[11px] text-[#efe0d2] font-semibold mt-0.5">
                      {jenisKemasanLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Friendly CTA */}
              <div className="pt-2">
                <Link
                  to="/register"
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#C3E28D] hover:bg-[#b5d87b] text-[#172C05] font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <span>Mulai Catat Hasil Panen Anda Sekarang</span>
                  <ArrowRight className="w-4 h-4 text-[#172C05]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
