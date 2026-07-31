import React, { useState } from 'react';
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

type TimeFilterType = 'Bulanan' | 'Triwulan' | 'Tahunan';

export const DashboardPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('Bulanan');

  // Chart data configuration per filter
  const chartDataByFilter: Record<
    TimeFilterType,
    {
      subtitle: string;
      footerLabel: string;
      peakLabel: string;
      maxTonase: number;
      items: { label: string; tonase: number; isHighest?: boolean; note?: string }[];
    }
  > = {
    Bulanan: {
      subtitle: 'Jumlah panen per bulan (dalam Ton)',
      footerLabel: 'Bulan Mei - Oktober 2023',
      peakLabel: 'Peak Month (Agu)',
      maxTonase: 550,
      items: [
        { label: 'Mei', tonase: 210 },
        { label: 'Jun', tonase: 340 },
        { label: 'Jul', tonase: 420 },
        { label: 'Agu', tonase: 520, isHighest: true, note: 'Puncak (520 Ton)' },
        { label: 'Sep', tonase: 380 },
        { label: 'Okt', tonase: 290 },
      ],
    },
    Triwulan: {
      subtitle: 'Jumlah panen per triwulan (dalam Ton)',
      footerLabel: 'Triwulan I - IV (Tahun 2023)',
      peakLabel: 'Peak Quarter (Q3)',
      maxTonase: 1400,
      items: [
        { label: 'Q1 (Jan-Mar)', tonase: 680 },
        { label: 'Q2 (Apr-Jun)', tonase: 950 },
        { label: 'Q3 (Jul-Sep)', tonase: 1320, isHighest: true, note: 'Puncak (1.320 Ton)' },
        { label: 'Q4 (Okt-Des)', tonase: 840 },
      ],
    },
    Tahunan: {
      subtitle: 'Jumlah panen per tahun (dalam Ton)',
      footerLabel: 'Periode Tahun 2020 - 2024',
      peakLabel: 'Peak Year (2023)',
      maxTonase: 4200,
      items: [
        { label: '2020', tonase: 1850 },
        { label: '2021', tonase: 2400 },
        { label: '2022', tonase: 3100 },
        { label: '2023', tonase: 3790, isHighest: true, note: 'Puncak (3.790 Ton)' },
        { label: '2024', tonase: 2950 },
      ],
    },
  };

  const currentChart = chartDataByFilter[timeFilter];

  // Recent table logs
  const recentLogs = [
    {
      id: 'LOG-001',
      tanggal: '28 Okt 2023',
      lokasi: 'Sektor Utara - Blok 02',
      varietas: 'Merah',
      tonase: '45.2 Ton',
      hasilOlahan: 'Beras Sorgum (380 Unit)',
    },
    {
      id: 'LOG-002',
      tanggal: '25 Okt 2023',
      lokasi: 'Sektor Tengah - Blok 01',
      varietas: 'Putih',
      tonase: '38.7 Ton',
      hasilOlahan: 'Tepung Sorgum (245 Unit)',
    },
    {
      id: 'LOG-003',
      tanggal: '22 Okt 2023',
      lokasi: 'Sektor Utara - Blok 04',
      varietas: 'Merah',
      tonase: '22.1 Ton',
      hasilOlahan: 'Snack Sorgum (180 Unit)',
    },
    {
      id: 'LOG-004',
      tanggal: '18 Okt 2023',
      lokasi: 'Sektor Timur - Blok 01',
      varietas: 'Putih',
      tonase: '12.5 Ton',
      hasilOlahan: 'Produk Lainnya (40 Unit)',
    },
  ];

  const filteredLogs = recentLogs.filter(
    (item) =>
      item.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.varietas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hasilOlahan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tanggal.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">LAHAN PANEN TERTINGGI</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">Blok Utara / 450 Ton</h3>
          <p className="text-xs font-semibold text-[#2C4219] mt-0.5 sm:mt-1">Performa Terbaik Musim Ini</p>
        </div>

        {/* Card 2: Lahan Panen Terendah */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-red-600">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">LAHAN PANEN TERENDAH</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">Blok Timur / 120 Ton</h3>
          <p className="text-xs font-semibold text-red-600 mt-0.5 sm:mt-1">Perlu Evaluasi Pupuk & Air</p>
        </div>

        {/* Card 3: Rata-Rata Panen Lahan */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">RATA-RATA PANEN LAHAN</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">285 Ton / Lahan</h3>
          <p className="text-xs font-semibold text-[#2C4219] mt-0.5 sm:mt-1">Meningkat 8% SMT Lalu</p>
        </div>

        {/* Card 4: Total Volume Hasil SCM */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL VOLUME HASIL SCM</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">1.140 Ton Sorgum</h3>
          <p className="text-xs font-semibold text-[#2C4219] mt-0.5 sm:mt-1">Tercatat di Sistem Rantai Pasok</p>
        </div>
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
              <p className="text-[11px] text-[#6B7280] font-medium">{currentChart.subtitle}</p>
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
            <div className="h-60 sm:h-64 flex items-end justify-between gap-3 sm:gap-6 px-2 border-b border-[#c4c8bb]/30 pb-2">
              {currentChart.items.map((item) => {
                const heightPercent = (item.tonase / currentChart.maxTonase) * 100;
                return (
                  <div key={item.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center h-full relative">
                      {item.isHighest && (
                        <div className="absolute -top-8 bg-[#2C4219] text-[#C3E28D] text-[10px] font-black px-2 py-0.5 rounded-md whitespace-nowrap shadow-xs animate-bounce z-10">
                          {item.note || `Puncak (${item.tonase.toLocaleString('id-ID')} Ton)`}
                        </div>
                      )}
                      <div
                        className={`w-full max-w-[28px] sm:max-w-[42px] rounded-t-xl transition-all duration-500 relative ${
                          item.isHighest
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
                        item.isHighest ? 'text-[#2C4219] underline decoration-[#C3E28D] decoration-2' : 'text-[#44483e]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#74796d] font-semibold mt-3 px-2 gap-1">
              <span>{currentChart.footerLabel}</span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 bg-[#2C4219] rounded-xs" /> {currentChart.peakLabel}
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
              {/* Blok Utara */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#221A12]">Blok Utara</span>
                  <span className="text-[#2C4219] font-bold">450 Ton</span>
                </div>
                <div className="w-full h-2 bg-[#efe0d2]/60 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2C4219] rounded-full transition-all duration-500" style={{ width: '82%' }} />
                </div>
                <p className="text-[10px] text-[#6B7280] font-medium">Produktivitas 100% dari Kapasitas</p>
              </div>

              {/* Blok Selatan */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#221A12]">Blok Selatan</span>
                  <span className="text-[#2C4219] font-bold">310 Ton</span>
                </div>
                <div className="w-full h-2 bg-[#efe0d2]/60 rounded-full overflow-hidden">
                  <div className="h-full bg-[#788B4B] rounded-full transition-all duration-500" style={{ width: '56%' }} />
                </div>
                <p className="text-[10px] text-[#6B7280] font-medium">Kondisi Tanah Optimal</p>
              </div>

              {/* Blok Timur */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#221A12]">Blok Timur</span>
                  <span className="text-red-600 font-bold">120 Ton</span>
                </div>
                <div className="w-full h-2 bg-[#efe0d2]/60 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: '22%' }} />
                </div>
                <p className="text-[10px] text-red-500 font-medium">Perlu Penambahan Irigasi</p>
              </div>
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
            <p className="text-[11px] text-[#6B7280] font-medium">Pembagian jenis produk olahan yang dihasilkan</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            {/* Donut graphic with center stat */}
            <div className="sm:col-span-5 flex justify-center relative py-1">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#efe0d2]/40"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#2C4219"
                  strokeWidth="4.5"
                  strokeDasharray="45, 100"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#788B4B"
                  strokeWidth="4.5"
                  strokeDasharray="25, 100"
                  strokeDashoffset="-45"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#A8B774"
                  strokeWidth="4.5"
                  strokeDasharray="20, 100"
                  strokeDashoffset="-70"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#D0DC9B"
                  strokeWidth="4.5"
                  strokeDasharray="10, 100"
                  strokeDashoffset="-90"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-extrabold text-[#2C4219]">2,4K</span>
                <span className="text-[9px] text-[#6B7280] font-bold uppercase tracking-wider">
                  Total Unit
                </span>
              </div>
            </div>

            {/* Legend Grid */}
            <div className="sm:col-span-7 space-y-2 text-xs font-medium">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F5]">
                <span className="flex items-center gap-1.5 text-[#221A12]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#2C4219] shrink-0" />
                  Beras Sorgum
                </span>
                <span className="font-bold text-[#2C4219]">1.080 Unit (45%)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F5]">
                <span className="flex items-center gap-1.5 text-[#221A12]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#788B4B] shrink-0" />
                  Tepung Sorgum
                </span>
                <span className="font-bold text-[#2C4219]">600 Unit (25%)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F5]">
                <span className="flex items-center gap-1.5 text-[#221A12]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#A8B774] shrink-0" />
                  Snack / Makanan Ringan
                </span>
                <span className="font-bold text-[#2C4219]">480 Unit (20%)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F7F7F5]">
                <span className="flex items-center gap-1.5 text-[#221A12]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#D0DC9B] shrink-0" />
                  Lainnya
                </span>
                <span className="font-bold text-[#2C4219]">240 Unit (10%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Status Progress "Output Produksi Pengolahan" */}
        <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-[#c4c8bb]/30 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#c4c8bb]/20 pb-3">
              <h2 className="text-sm font-semibold text-[#2C4219]">
                Status Hasil Olahan Sorgum
              </h2>
              <p className="text-[11px] text-[#6B7280] font-medium">Status kelancaran pembuatan produk olahan</p>
            </div>

            <div className="mt-4 space-y-3">
              {/* Row 1: Beras Sorgum */}
              <div className="p-2.5 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#221A12]">Beras Sorgum</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2C4219] text-white text-[9px] font-bold">
                    Hasil Tinggi
                  </span>
                </div>
                <div className="w-full h-2 bg-[#efe0d2] rounded-full overflow-hidden">
                  <div className="h-full bg-[#2C4219] rounded-full" style={{ width: '90%' }} />
                </div>
              </div>

              {/* Row 2: Tepung Sorgum */}
              <div className="p-2.5 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#221A12]">Tepung Sorgum</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#788B4B] text-white text-[9px] font-bold">
                    Stabil
                  </span>
                </div>
                <div className="w-full h-2 bg-[#efe0d2] rounded-full overflow-hidden">
                  <div className="h-full bg-[#788B4B] rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              {/* Row 3: Snack */}
              <div className="p-2.5 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#221A12]">Snack</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#A8B774] text-[#172C05] text-[9px] font-bold">
                    Meningkat
                  </span>
                </div>
                <div className="w-full h-2 bg-[#efe0d2] rounded-full overflow-hidden">
                  <div className="h-full bg-[#A8B774] rounded-full" style={{ width: '50%' }} />
                </div>
              </div>

              {/* Row 4: Lainnya */}
              <div className="p-2.5 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#221A12]">Lainnya</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#c4c8bb]/40 text-[#44483e] text-[9px] font-bold">
                    Stabil
                  </span>
                </div>
                <div className="w-full h-2 bg-[#efe0d2] rounded-full overflow-hidden">
                  <div className="h-full bg-[#c4c8bb] rounded-full" style={{ width: '30%' }} />
                </div>
              </div>
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
            <p className="text-[11px] text-[#6B7280] font-medium">
              Daftar hasil panen dan produk olahan sorgum yang baru dicatat
            </p>
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
                <th className="py-2 px-3">Hasil Produk Olahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 font-medium">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-2 px-3 text-[#44483e]">{row.tanggal}</td>
                    <td className="py-2 px-3 font-semibold text-[#172C05]">{row.lokasi}</td>
                    <td className="py-2 px-3">
                      {row.varietas === 'Merah' ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                          Merah
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-300 text-[10px] font-bold">
                          Putih
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-bold text-[#2C4219]">{row.tonase}</td>
                    <td className="py-2 px-3 text-[#221A12]">{row.hasilOlahan}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#6B7280]">
                    Tidak ada catatan panen & olahan yang sesuai pencarian.
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
