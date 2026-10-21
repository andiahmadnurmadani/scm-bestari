import React from 'react';
import { MapPin, Sprout, Warehouse, Factory, ArrowRight, QrCode, Wheat, Droplets, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { formatTanggalId } from '../../utils/dateUtils';
import { shortKode } from '../../utils/kode';
import { ProductionBatch } from '../../types';

/**
 * ProductTraceTimeline — rantai asal-usul satu batch olahan (traceability).
 *
 * Menampilkan jejak lengkap dari hulu ke hilir:
 *   Lahan → Tanam → Panen → Gudang/Sosoh → Olahan
 * sehingga petani & konsumen bisa tahu KAPAN ditanam, KAPAN dipanen, dan
 * dari lahan mana produk berasal.
 *
 * Semua data diambil dari lineage yang sudah disertakan API produksi
 * (lahan, planting, harvest, gudang, stockBatch) — tanpa endpoint baru.
 *
 * variant="full"    → info singkat + QR (untuk modal Lacak)
 * variant="compact" → rantai ringkas satu baris (untuk pratinjau di form)
 */

interface Props {
  batch: ProductionBatch;
  variant?: 'full' | 'compact';
  showQr?: boolean;
}

const fmtDate = (v?: string | null) => (v ? formatTanggalId(v) : '-');

/** Bangun daftar langkah rantai pasok dari lineage batch olahan. */
function buildSteps(batch: ProductionBatch) {
  const steps: {
    key: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    rows: { label: string; value: string }[];
  }[] = [];

  const { lahan, planting, harvest, gudang, stockBatch } = batch;

  if (lahan) {
    steps.push({
      key: 'lahan',
      title: 'Lahan',
      icon: MapPin,
      color: 'bg-[#2C4219] text-white',
      rows: [
        { label: 'Nama lahan', value: lahan.namaLahan || '-' },
        { label: 'Kode', value: shortKode(lahan.kodeLahan) },
      ],
    });
  }

  if (planting) {
    steps.push({
      key: 'tanam',
      title: 'Ditanam',
      icon: Sprout,
      color: 'bg-[#C3E28D] text-[#172C05]',
      rows: [
        { label: 'Tanggal tanam', value: fmtDate(planting.tanggalTanam) },
        { label: 'Kode tanam', value: shortKode(planting.kodeTanam) },
        { label: 'Varietas', value: planting.varietas || '-' },
        ...(planting.estimasiPanen ? [{ label: 'Estimasi panen', value: fmtDate(planting.estimasiPanen) }] : []),
        ...(planting.petugas ? [{ label: 'Petugas', value: planting.petugas }] : []),
      ],
    });
  }

  if (harvest) {
    steps.push({
      key: 'panen',
      title: 'Dipanen',
      icon: Wheat,
      color: 'bg-amber-100 text-amber-800',
      rows: [
        { label: 'Tanggal panen', value: fmtDate(harvest.tanggalPanen) },
        { label: 'Kode panen', value: shortKode(harvest.kodePanen) },
        ...(harvest.periodeHari != null ? [{ label: 'Umur tanam', value: `${harvest.periodeHari} hari` }] : []),
      ],
    });
  }

  if (gudang || stockBatch) {
    const rows: { label: string; value: string }[] = [];
    if (gudang) {
      rows.push({ label: 'Gudang', value: `${gudang.namaGudang || '-'}${gudang.kodeGudang ? ` (${gudang.kodeGudang})` : ''}` });
    }
    if (stockBatch) {
      rows.push({ label: 'Batch bahan', value: shortKode(stockBatch.kodeBatchStok) });
      rows.push({ label: 'Jenis', value: stockBatch.jenis === 'SORGUM' ? 'Sorgum (sudah disosoh)' : 'Gabah' });
      if (stockBatch.asalBatch?.kodeBatchStok) {
        rows.push({ label: 'Gabah asal', value: shortKode(stockBatch.asalBatch.kodeBatchStok) });
      }
    }
    steps.push({
      key: 'gudang',
      title: stockBatch?.jenis === 'SORGUM' ? 'Gudang & Sosoh' : 'Gudang',
      icon: stockBatch?.jenis === 'SORGUM' ? Droplets : Warehouse,
      color: 'bg-sky-100 text-sky-700',
      rows,
    });
  }

  steps.push({
    key: 'olahan',
    title: 'Jadi Produk Olahan',
    icon: Factory,
    color: 'bg-purple-100 text-purple-700',
    rows: [
      { label: 'Nama produk', value: batch.namaProduk || '-' },
      { label: 'Tanggal produksi', value: fmtDate(batch.tanggalProduksi) },
      { label: 'Kode batch', value: shortKode(batch.kodeBatch) },
      { label: 'Hasil', value: `${Number(batch.jumlahHasil || 0).toLocaleString('id-ID')} ${batch.satuan || ''}`.trim() },
      ...(batch.bahanDigunakan != null ? [{ label: 'Bahan dipakai', value: `${Number(batch.bahanDigunakan).toLocaleString('id-ID')} Kg` }] : []),
      ...(batch.operatorProduksi ? [{ label: 'Operator', value: batch.operatorProduksi }] : []),
      { label: 'Status QC', value: batch.statusQC || '-' },
      ...(batch.tanggalKadaluarsa ? [{ label: 'Kadaluarsa', value: fmtDate(batch.tanggalKadaluarsa) }] : []),
    ],
  });

  return steps;
}

export const ProductTraceTimeline: React.FC<Props> = ({ batch, variant = 'full', showQr = true }) => {
  const steps = buildSteps(batch);
  const kodeStok = batch.stockBatch?.kodeBatchStok;
  const traceUrl = kodeStok && typeof window !== 'undefined' ? `${window.location.origin}/trace/${kodeStok}` : '';

  // ── Compact: rantai ringkas satu baris (pratinjau di form) ────────────────
  if (variant === 'compact') {
    const chips = steps.map((s) => ({ key: s.key, title: s.title, icon: s.icon }));
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((c, i) => {
          const Icon = c.icon;
          return (
            <React.Fragment key={c.key}>
              {i > 0 && <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C3E28D]/25 text-[#2C4219] text-[13px] font-bold">
                <Icon className="w-3.5 h-3.5" />
                {c.title}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // ── Full (modal Lacak): info singkat + QR saja ───────────────────────────
  const info = [
    { label: 'Lahan', value: batch.lahan?.namaLahan || '-' },
    { label: 'Tanggal panen', value: fmtDate(batch.harvest?.tanggalPanen) },
    { label: 'Tanggal produksi', value: fmtDate(batch.tanggalProduksi) },
    { label: 'Hasil', value: `${Number(batch.jumlahHasil || 0).toLocaleString('id-ID')} ${batch.satuan || ''}`.trim() },
  ];

  const unduhQr = () => {
    const canvas = document.querySelector('#qr-canvas-produk') as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `QR-${batch.kodeBatch}.png`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Ringkasan produk */}
      <div className="rounded-2xl border border-[#c4c8bb]/30 bg-[#FFF8F4] p-4 text-center">
        <p className="text-xl font-extrabold text-[#172C05]">{batch.namaProduk}</p>
        <p className="text-sm text-[#6B7280] mt-0.5">Kode batch {shortKode(batch.kodeBatch)}</p>
      </div>

      {/* QR untuk lacak publik */}
      {showQr && (
        kodeStok ? (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-2xl border border-[#c4c8bb]/30 p-3 bg-white">
              <QRCodeCanvas id="qr-canvas-produk" value={traceUrl} size={200} level="M" includeMargin fgColor="#172C05" bgColor="#ffffff" />
            </div>
            <p className="text-base font-bold text-[#172C05] flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#2C4219]" /> Pindai untuk melihat asal-usul produk
            </p>
            <button
              type="button"
              onClick={unduhQr}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2C4219] text-white text-sm font-bold hover:bg-[#172C05] transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Unduh QR
            </button>
          </div>
        ) : (
          <p className="text-base text-center text-[#9CA3AF] bg-[#F7F7F5] rounded-2xl p-4">
            QR belum tersedia karena batch ini belum tertaut ke stok gudang.
          </p>
        )
      )}

      {/* Info singkat */}
      <div className="grid grid-cols-2 gap-2.5">
        {info.map((r) => (
          <div key={r.label} className="rounded-xl bg-[#F7F7F5] px-3.5 py-2.5 min-w-0">
            <p className="text-xs text-[#6B7280]">{r.label}</p>
            <p className="text-sm font-bold text-[#172C05] break-words">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
