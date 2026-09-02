import React, { useState } from 'react';
import {
  Warehouse,
  QrCode,
  Printer,
  Search,
  ChevronRight,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ShoppingBag,
  Camera,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { LITE_CSS } from './liteDesign';

// ── Interfaces ───────────────────────────────────────────────────────────────
export interface SackItem {
  id: string; // e.g. BTH-2026-08-001-K01
  batchId: string;
  lahanNama: string;
  penanamanKe: number;
  varietas: string;
  tanggalPanen: string;
  tanggalMasuk: string;
  beratKg: number;
  status: 'Tersimpan' | 'Sebagian Diambil' | 'Habis';
  lokasiGudang: string;
}

export interface BatchItem {
  id: string;
  lahanNama: string;
  penanamanKe: number;
  varietas: string;
  tanggalTanam: string;
  tanggalPanen: string;
  tanggalMasuk: string;
  beratAwalKg: number;
  sisaStokKg: number;
  ukuranKarungKg: number;
  jumlahKarung: number;
  status: 'Tersimpan' | 'Sebagian Diambil' | 'Habis';
  gudangLokasi: string;
  karungList: SackItem[];
}

// ── SVG Vector QR Generator (0-Dependency) ──────────────────────────────────
const generateQrMatrix = (text: string) => {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const addFinderPattern = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startR + r][startC + c] = true;
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (
        (r < 7 && c < 7) ||
        (r < 7 && c >= size - 7) ||
        (r >= size - 7 && c < 7)
      ) {
        continue;
      }
      if (r === 6 || c === 6) {
        matrix[r][c] = (r + c) % 2 === 0;
        continue;
      }
      const val = Math.abs(Math.sin(hash + r * 21 + c)) * 10000;
      matrix[r][c] = Math.floor(val) % 2 === 0;
    }
  }

  return matrix;
};

const QrCodeSvg: React.FC<{ value: string; size?: number; className?: string }> = ({
  value,
  size = 130,
  className = '',
}) => {
  const matrix = generateQrMatrix(value);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 21 21"
      className={`bg-white p-1.5 rounded-xl border border-gray-200 shadow-2xs ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="21" height="21" fill="white" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#172C05" /> : null
        )
      )}
    </svg>
  );
};

// ── Helpers Format ───────────────────────────────────────────────────────────
function formatTanggalId(iso?: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${d.getDate()} ${namaBulan[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Realistic Mock Data ───────────────────────────────────────────────────────
const INITIAL_BATCHES: BatchItem[] = [
  {
    id: 'BTH-2026-08-001',
    lahanNama: 'Blok D - Parung',
    penanamanKe: 1,
    varietas: 'Numbu',
    tanggalTanam: '2026-02-10',
    tanggalPanen: '2026-05-10',
    tanggalMasuk: '2026-05-12',
    beratAwalKg: 250,
    sisaStokKg: 250,
    ukuranKarungKg: 50,
    jumlahKarung: 5,
    status: 'Tersimpan',
    gudangLokasi: 'Gudang Utama - Rak A1-A5',
    karungList: [
      { id: 'BTH-2026-08-001-K01', batchId: 'BTH-2026-08-001', lahanNama: 'Blok D - Parung', penanamanKe: 1, varietas: 'Numbu', tanggalPanen: '2026-05-10', tanggalMasuk: '2026-05-12', beratKg: 50, status: 'Tersimpan', lokasiGudang: 'Gudang Utama - Rak A1' },
      { id: 'BTH-2026-08-001-K02', batchId: 'BTH-2026-08-001', lahanNama: 'Blok D - Parung', penanamanKe: 1, varietas: 'Numbu', tanggalPanen: '2026-05-10', tanggalMasuk: '2026-05-12', beratKg: 50, status: 'Tersimpan', lokasiGudang: 'Gudang Utama - Rak A2' },
      { id: 'BTH-2026-08-001-K03', batchId: 'BTH-2026-08-001', lahanNama: 'Blok D - Parung', penanamanKe: 1, varietas: 'Numbu', tanggalPanen: '2026-05-10', tanggalMasuk: '2026-05-12', beratKg: 50, status: 'Tersimpan', lokasiGudang: 'Gudang Utama - Rak A3' },
      { id: 'BTH-2026-08-001-K04', batchId: 'BTH-2026-08-001', lahanNama: 'Blok D - Parung', penanamanKe: 1, varietas: 'Numbu', tanggalPanen: '2026-05-10', tanggalMasuk: '2026-05-12', beratKg: 50, status: 'Tersimpan', lokasiGudang: 'Gudang Utama - Rak A4' },
      { id: 'BTH-2026-08-001-K05', batchId: 'BTH-2026-08-001', lahanNama: 'Blok D - Parung', penanamanKe: 1, varietas: 'Numbu', tanggalPanen: '2026-05-10', tanggalMasuk: '2026-05-12', beratKg: 50, status: 'Tersimpan', lokasiGudang: 'Gudang Utama - Rak A5' },
    ],
  },
  {
    id: 'BTH-2026-08-002',
    lahanNama: 'Blok B - Cisarua',
    penanamanKe: 1,
    varietas: 'Numbu',
    tanggalTanam: '2026-02-15',
    tanggalPanen: '2026-05-18',
    tanggalMasuk: '2026-05-20',
    beratAwalKg: 100,
    sisaStokKg: 100,
    ukuranKarungKg: 50,
    jumlahKarung: 2,
    status: 'Tersimpan',
    gudangLokasi: 'Gudang Utama - Rak B1-B2',
    karungList: [
      { id: 'BTH-2026-08-002-K01', batchId: 'BTH-2026-08-002', lahanNama: 'Blok B - Cisarua', penanamanKe: 1, varietas: 'Numbu', tanggalPanen: '2026-05-18', tanggalMasuk: '2026-05-20', beratKg: 50, status: 'Tersimpan', lokasiGudang: 'Gudang Utama - Rak B1' },
      { id: 'BTH-2026-08-002-K02', batchId: 'BTH-2026-08-002', lahanNama: 'Blok B - Cisarua', penanamanKe: 1, varietas: 'Numbu', tanggalPanen: '2026-05-18', tanggalMasuk: '2026-05-20', beratKg: 50, status: 'Tersimpan', lokasiGudang: 'Gudang Utama - Rak B2' },
    ],
  },
  {
    id: 'BTH-2026-08-003',
    lahanNama: 'Blok A - Sukamaju',
    penanamanKe: 2,
    varietas: 'Kawali',
    tanggalTanam: '2026-03-01',
    tanggalPanen: '2026-06-02',
    tanggalMasuk: '2026-06-05',
    beratAwalKg: 75,
    sisaStokKg: 75,
    ukuranKarungKg: 25,
    jumlahKarung: 3,
    status: 'Tersimpan',
    gudangLokasi: 'Gudang Olahan - Rak C1-C3',
    karungList: [
      { id: 'BTH-2026-08-003-K01', batchId: 'BTH-2026-08-003', lahanNama: 'Blok A - Sukamaju', penanamanKe: 2, varietas: 'Kawali', tanggalPanen: '2026-06-02', tanggalMasuk: '2026-06-05', beratKg: 25, status: 'Tersimpan', lokasiGudang: 'Gudang Olahan - Rak C1' },
      { id: 'BTH-2026-08-003-K02', batchId: 'BTH-2026-08-003', lahanNama: 'Blok A - Sukamaju', penanamanKe: 2, varietas: 'Kawali', tanggalPanen: '2026-06-02', tanggalMasuk: '2026-06-05', beratKg: 25, status: 'Tersimpan', lokasiGudang: 'Gudang Olahan - Rak C2' },
      { id: 'BTH-2026-08-003-K03', batchId: 'BTH-2026-08-003', lahanNama: 'Blok A - Sukamaju', penanamanKe: 2, varietas: 'Kawali', tanggalPanen: '2026-06-02', tanggalMasuk: '2026-06-05', beratKg: 25, status: 'Tersimpan', lokasiGudang: 'Gudang Olahan - Rak C3' },
    ],
  },
];

// ── Main Page Gudang Lite ─────────────────────────────────────────────────────
export const LiteGudangPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchItem[]>(INITIAL_BATCHES);
  const [activeTab, setActiveTab] = useState<'batch' | 'sack'>('batch');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [detailBatch, setDetailBatch] = useState<BatchItem | null>(null);
  const [detailSack, setDetailSack] = useState<SackItem | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [printSacks, setPrintSacks] = useState<SackItem[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Calculate totals
  const allSacks: SackItem[] = batches.flatMap((b) => b.karungList);
  const totalStokKg = batches.reduce((sum, b) => sum + b.sisaStokKg, 0);
  const totalBatchCount = batches.length;
  const totalKarungCount = allSacks.length;

  // FIFO Sorting: Batch with oldest harvest date first (penanganan panen terdahulu)
  const fifoBatches = [...batches].sort(
    (a, b) => new Date(a.tanggalPanen).getTime() - new Date(b.tanggalPanen).getTime()
  );
  const fifoPriorityBatch = fifoBatches[0] || null;

  // Filters
  const filteredBatches = batches.filter(
    (b) =>
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.lahanNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.varietas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSacks = allSacks.filter(
    (s) =>
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lahanNama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Print Action
  const handleTriggerPrint = (sacksToPrint: SackItem[]) => {
    setPrintSacks(sacksToPrint);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Status Badge Styling Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Tersimpan':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Tersimpan</span>;
      case 'Sebagian Diambil':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Sebagian Diambil</span>;
      case 'Habis':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">Habis</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Printable Area Target (#print-label-qr) */}
      <div id="print-label-qr" className="hidden">
        <div className="p-6 bg-white max-w-lg mx-auto border-2 border-black rounded-2xl space-y-4">
          <div className="text-center border-b-2 border-black pb-3">
            <h2 className="text-xl font-black text-[#172C05] tracking-tight">SORGUM SCM</h2>
            <p className="text-xs font-bold text-gray-600">LABEL INTEGRITAS & TRACEABILITY KARUNG</p>
          </div>
          {printSacks.map((sack) => (
            <div key={sack.id} className="flex items-center gap-4 p-4 border border-gray-400 rounded-xl mb-4 page-break-inside-avoid">
              <QrCodeSvg value={sack.id} size={110} />
              <div className="text-xs space-y-1 text-black font-semibold">
                <p className="text-base font-extrabold text-[#2C4219]">{sack.id}</p>
                <p>Batch ID: <strong>{sack.batchId}</strong></p>
                <p>Lahan: <strong>{sack.lahanNama} (Penanaman #{sack.penanamanKe})</strong></p>
                <p>Varietas: <strong>{sack.varietas}</strong></p>
                <p>Berat: <strong className="text-sm font-bold">{sack.beratKg} Kg</strong></p>
                <p>Tanggal Panen: <strong>{formatTanggalId(sack.tanggalPanen)}</strong></p>
                <p>Lokasi: <strong>{sack.lokasiGudang}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className={LITE_CSS.pageTitle}>
            <Warehouse className="w-7 h-7 text-[#2C4219]" /> Gudang Sorgum
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setScannerOpen(true)}
            className={LITE_CSS.btnPrimary + ' text-xs sm:text-sm py-2.5 px-4'}
          >
            <Camera className="w-4 h-4" /> Scan QR Karung
          </button>
          <button
            onClick={() => handleTriggerPrint(allSacks)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FFF8E1] text-[#B78103] border border-[#FFE082] text-xs sm:text-sm font-bold hover:bg-[#FFE082]/40 transition-all cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4" /> Cetak QR Karung
          </button>
        </div>
      </div>

      {/* 1. Ringkasan Gudang (3 Stat Cards Sederhana & Lapang) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#ECE7DF] shadow-[0_4px_20px_rgba(44,66,25,0.03)] border-l-[6px] border-l-[#2C4219]">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#70766B]">Total Stok Simpanan</p>
          <p className="text-2xl sm:text-3xl font-black text-[#172C05] leading-tight mt-1">
            {totalStokKg.toLocaleString('id-ID')} <span className="text-base font-bold text-[#70766B]">Kg</span>
          </p>
          <p className="text-xs text-[#8A9084] mt-1 font-medium">Tersimpan aman di gudang</p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#ECE7DF] shadow-[0_4px_20px_rgba(44,66,25,0.03)] border-l-[6px] border-l-[#1565C0]">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#70766B]">Jumlah Karung</p>
          <p className="text-2xl sm:text-3xl font-black text-[#1565C0] leading-tight mt-1">
            {totalKarungCount} <span className="text-base font-bold text-[#70766B]">Karung</span>
          </p>
          <p className="text-xs text-[#8A9084] mt-1 font-medium">Ukuran 25kg & 50kg</p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#ECE7DF] shadow-[0_4px_20px_rgba(44,66,25,0.03)] border-l-[6px] border-l-[#B78103]">
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#70766B]">Jumlah Batch Panen</p>
          <p className="text-2xl sm:text-3xl font-black text-[#B78103] leading-tight mt-1">
            {totalBatchCount} <span className="text-base font-bold text-[#70766B]">Batch</span>
          </p>
          <p className="text-xs text-[#8A9084] mt-1 font-medium">Dari Kelompok Tani binaan</p>
        </div>
      </div>

      {/* 2. FIFO Banner (Prioritas Pengambilan - Panen Paling Lama) */}
      {fifoPriorityBatch && (
        <div className="bg-gradient-to-r from-[#2C4219] via-[#37531f] to-[#253915] rounded-3xl p-6 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#C3E28D] text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Prioritas Ambil Panen Tertua (FIFO)
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white pt-1">
                {fifoPriorityBatch.lahanNama} <span className="text-sm font-bold text-[#C3E28D]">({fifoPriorityBatch.id})</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#E0EBD6] leading-relaxed">
                Dipanen <strong>{formatTanggalId(fifoPriorityBatch.tanggalPanen)}</strong> • Varietas {fifoPriorityBatch.varietas} • Sisa Stok: <strong>{fifoPriorityBatch.sisaStokKg} Kg</strong> ({fifoPriorityBatch.jumlahKarung} Karung)
              </p>
            </div>

            <button
              onClick={() => setDetailBatch(fifoPriorityBatch)}
              className="px-5 py-3 rounded-2xl bg-white text-[#172C05] text-sm font-black hover:bg-[#F3EFE9] transition-all cursor-pointer shrink-0 shadow-sm"
            >
              Lihat Detail Batch Ini
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-b border-[#ECE7DF] pb-3.5">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'batch'
                ? 'bg-[#2C4219] text-white shadow-xs'
                : 'bg-white text-[#4A5043] border border-[#ECE7DF] hover:bg-[#F4EFEB]'
            }`}
          >
            <Layers className="w-4 h-4" /> Per Batch Panen ({batches.length})
          </button>
          <button
            onClick={() => setActiveTab('sack')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'sack'
                ? 'bg-[#2C4219] text-white shadow-xs'
                : 'bg-white text-[#4A5043] border border-[#ECE7DF] hover:bg-[#F4EFEB]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Semua Karung ({allSacks.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9E988F]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari lahan atau kode karung..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#ECE7DF] rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30"
          />
        </div>
      </div>

      {/* Tab Content 1: Daftar Batch */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          {filteredBatches.length === 0 ? (
            <div className={LITE_CSS.emptyState}>
              <Warehouse className="w-14 h-14 text-[#C3E28D] mx-auto mb-3" />
              <p className="text-lg font-bold text-[#172C05]">Batch panen tidak ditemukan</p>
              <p className="text-sm text-[#70766B] mt-1">Coba gunakan kata kunci pencarian lain.</p>
            </div>
          ) : (
            filteredBatches.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-[#ECE7DF] p-5 sm:p-6 shadow-[0_4px_20px_rgba(44,66,25,0.03)] hover:shadow-[0_8px_30px_rgba(44,66,25,0.06)] hover:border-[#D9D2C5] transition-all space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-black text-[#172C05]">{b.lahanNama}</h3>
                      {getStatusBadge(b.status)}
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FFF8E1] text-[#B78103] border border-[#FFE082]">
                        Penanaman #{b.penanamanKe}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#70766B]">
                      Kode Batch: <strong className="text-[#172C05]">{b.id}</strong> • Varietas: <strong className="text-[#2C4219]">{b.varietas}</strong>
                    </p>
                    <p className="text-xs text-[#8A9084]">Dipanen: {formatTanggalId(b.tanggalPanen)} • Gudang: {b.gudangLokasi}</p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 bg-[#FAF8F4] p-3 rounded-2xl border border-[#ECE7DF]">
                    <span className="text-[10px] text-[#9E988F] uppercase font-bold block">Sisa Stok</span>
                    <p className="text-xl font-black text-[#2C4219]">{b.sisaStokKg.toLocaleString('id-ID')} Kg</p>
                    <p className="text-xs text-[#70766B] font-medium">
                      {b.jumlahKarung} Karung ({b.ukuranKarungKg} Kg/Karung)
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[#ECE7DF]">
                  <button
                    onClick={() => setDetailBatch(b)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Info className="w-4 h-4" /> Rincian Batch
                  </button>
                  <button
                    onClick={() => handleTriggerPrint(b.karungList)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FFF8E1] border border-[#FFE082] text-[#B78103] text-xs font-bold hover:bg-[#FFE082]/40 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Cetak QR Batch ({b.jumlahKarung} Karung)
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 2: Daftar Semua Karung */}
      {activeTab === 'sack' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredSacks.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-[#c4c8bb]/20 p-8 text-center">
              <ShoppingBag className="w-12 h-12 text-[#C3E28D] mx-auto mb-3" />
              <p className="text-base font-bold text-[#6B7280]">Karung tidak ditemukan</p>
            </div>
          ) : (
            filteredSacks.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 shadow-2xs flex items-center gap-3.5 hover:border-[#2C4219]/40 transition-all"
              >
                <div className="shrink-0">
                  <QrCodeSvg value={s.id} size={70} />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-sm font-bold text-[#172C05] truncate">{s.id}</h4>
                    {getStatusBadge(s.status)}
                  </div>
                  <p className="text-xs text-[#6B7280] truncate">
                    {s.lahanNama} • Varietas {s.varietas}
                  </p>
                  <p className="text-xs font-bold text-[#2C4219]">
                    Berat: {s.beratKg} Kg • Panen: {formatTanggalId(s.tanggalPanen)}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setDetailSack(s)}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 hover:bg-amber-100 cursor-pointer"
                    >
                      Detail Karung
                    </button>
                    <button
                      onClick={() => handleTriggerPrint([s])}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-bold hover:bg-gray-200 cursor-pointer"
                    >
                      Print Label
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal 1: Detail Batch & Traceability Visual */}
      <Modal
        isOpen={!!detailBatch}
        onClose={() => setDetailBatch(null)}
        title={`Detail Batch: ${detailBatch?.id}`}
        subtitle={`Informasi Penanaman & Traceability Alur Pasok`}
        maxWidth="2xl"
      >
        {detailBatch && (
          <div className="space-y-5">
            {/* Visual Traceability Stepper */}
            <div className="bg-[#fff8f4] p-4 rounded-2xl border border-[#c4c8bb]/30">
              <p className="text-xs font-bold text-[#2C4219] mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Alur Traceability Penanaman Hingga Gudang
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#44483e]">
                <div className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded-full bg-[#2C4219] text-white flex items-center justify-center font-bold text-[10px]">1</span>
                  <span>Lahan ({detailBatch.lahanNama})</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#c4c8bb]" />
                <div className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded-full bg-[#2C4219] text-white flex items-center justify-center font-bold text-[10px]">2</span>
                  <span>Tanam (#{detailBatch.penanamanKe})</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#c4c8bb]" />
                <div className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded-full bg-[#2C4219] text-white flex items-center justify-center font-bold text-[10px]">3</span>
                  <span>Panen ({formatTanggalId(detailBatch.tanggalPanen)})</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#c4c8bb]" />
                <div className="flex items-center gap-1">
                  <span className="w-6 h-6 rounded-full bg-[#2C4219] text-white flex items-center justify-center font-bold text-[10px]">4</span>
                  <span>Batch ({detailBatch.id})</span>
                </div>
              </div>
            </div>

            {/* Rincian Batch Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-4 rounded-2xl border border-[#c4c8bb]/20">
              <div>
                <span className="text-[#9CA3AF] block">VARIETAS</span>
                <strong className="text-sm font-bold text-[#172C05]">{detailBatch.varietas}</strong>
              </div>
              <div>
                <span className="text-[#9CA3AF] block">STOK SISA</span>
                <strong className="text-sm font-bold text-[#2C4219]">{detailBatch.sisaStokKg} Kg</strong>
              </div>
              <div>
                <span className="text-[#9CA3AF] block">JUMLAH KARUNG</span>
                <strong className="text-sm font-bold text-[#172C05]">{detailBatch.jumlahKarung} Karung</strong>
              </div>
              <div>
                <span className="text-[#9CA3AF] block">UKURAN KARUNG</span>
                <strong className="text-sm font-bold text-[#172C05]">{detailBatch.ukuranKarungKg} Kg / Karung</strong>
              </div>
              <div>
                <span className="text-[#9CA3AF] block">TANGGAL TANAM</span>
                <strong className="text-sm font-bold text-[#172C05]">{formatTanggalId(detailBatch.tanggalTanam)}</strong>
              </div>
              <div>
                <span className="text-[#9CA3AF] block">LOKASI RAK</span>
                <strong className="text-sm font-bold text-[#172C05]">{detailBatch.gudangLokasi}</strong>
              </div>
            </div>

            {/* List Karung di Batch Ini */}
            <div>
              <h4 className="text-sm font-bold text-[#172C05] mb-2">Daftar Karung Terdaftar Dalam Batch Ini:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {detailBatch.karungList.map((sk) => (
                  <div key={sk.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                    <div>
                      <p className="font-bold text-[#172C05]">{sk.id}</p>
                      <p className="text-[11px] text-[#6B7280]">Berat: {sk.beratKg} Kg • {sk.lokasiGudang}</p>
                    </div>
                    {getStatusBadge(sk.status)}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2 border-t border-[#c4c8bb]/20">
              <button
                onClick={() => setDetailBatch(null)}
                className="flex-1 py-3 rounded-2xl text-xs font-bold text-[#44483e] bg-[#F7F7F5] border border-[#c4c8bb]/30 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const b = detailBatch;
                  setDetailBatch(null);
                  handleTriggerPrint(b.karungList);
                }}
                className="flex-1 py-3 rounded-2xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak Semua Label QR Batch
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 2: Detail Karung */}
      <Modal
        isOpen={!!detailSack}
        onClose={() => setDetailSack(null)}
        title={`Detail Karung: ${detailSack?.id}`}
        subtitle={`Nomor Kode Karung Unik`}
      >
        {detailSack && (
          <div className="space-y-5">
            <div className="flex items-center justify-center p-4 bg-[#fff8f4] rounded-2xl border border-[#c4c8bb]/20">
              <QrCodeSvg value={detailSack.id} size={150} />
            </div>

            <div className="space-y-2 text-xs text-[#44483e] bg-white p-4 rounded-xl border border-[#c4c8bb]/20">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-[#9CA3AF]">KODE KARUNG</span>
                <strong className="font-bold text-[#172C05]">{detailSack.id}</strong>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-[#9CA3AF]">BATCH ID</span>
                <strong className="font-bold text-[#172C05]">{detailSack.batchId}</strong>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-[#9CA3AF]">LAHAN & PENANAMAN</span>
                <strong className="font-bold text-[#172C05]">{detailSack.lahanNama} (#{detailSack.penanamanKe})</strong>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-[#9CA3AF]">VARIETAS</span>
                <strong className="font-bold text-[#172C05]">{detailSack.varietas}</strong>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-[#9CA3AF]">BERAT KARUNG</span>
                <strong className="font-bold text-[#2C4219]">{detailSack.beratKg} Kg</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9CA3AF]">STATUS</span>
                <div>{getStatusBadge(detailSack.status)}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#c4c8bb]/20">
              <button
                onClick={() => setDetailSack(null)}
                className="flex-1 py-3 rounded-2xl text-xs font-bold text-[#44483e] bg-[#F7F7F5] border border-[#c4c8bb]/30 cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const s = detailSack;
                  setDetailSack(null);
                  handleTriggerPrint([s]);
                }}
                className="flex-1 py-3 rounded-2xl text-xs font-bold bg-[#2C4219] text-white hover:bg-[#172C05] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Label QR Ini
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 3: Scanner Simulator */}
      <Modal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Simulasi Scanner Kamera QR"
        subtitle="Arahkan kamera atau pilih kode karung di bawah ini"
      >
        <div className="space-y-4">
          <div className="relative w-full h-48 bg-black rounded-2xl overflow-hidden flex flex-col items-center justify-center text-white border-2 border-[#2C4219]">
            {/* Red Laser Line Animation */}
            <div className="absolute inset-x-4 top-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
            <QrCode className="w-16 h-16 text-[#C3E28D] opacity-40 mb-2" />
            <p className="text-xs text-gray-300 font-semibold">Memindai Kode QR Karung...</p>
          </div>

          <div>
            <p className="text-xs font-bold text-[#172C05] mb-2">Atau Ketuk Kode Karung Untuk Membuka Details:</p>
            <div className="space-y-2">
              {allSacks.slice(0, 4).map((sk) => (
                <button
                  key={sk.id}
                  onClick={() => {
                    setScannerOpen(false);
                    setDetailSack(sk);
                    setToast({ msg: `QR Karung ${sk.id} berhasil dipindai!`, type: 'success' });
                  }}
                  className="w-full text-left p-3 rounded-xl bg-[#fff8f4] border border-[#c4c8bb]/30 hover:border-[#2C4219] transition-all flex items-center justify-between text-xs cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-[#172C05]">{sk.id}</p>
                    <p className="text-[11px] text-[#6B7280]">{sk.lahanNama} • {sk.beratKg} Kg</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#2C4219]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
