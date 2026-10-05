import React from 'react';
import { MapPin, Sprout, Package, Warehouse, Factory, ArrowRight, QrCode, Wheat, Droplets, CalendarDays } from 'lucide-react';
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
 * variant="full"    → timeline vertikal + QR (untuk modal Lacak)
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

  // ── Full: timeline vertikal + QR ──────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Ringkasan produk */}
      <div className="rounded-2xl border border-[#c4c8bb]/30 bg-[#FFF8F4] p-4">
        <p className="text-sm font-bold uppercase tracking-wider text-[#6B7280]">Produk</p>
        <p className="text-xl font-extrabold text-[#172C05] mt-0.5">{batch.namaProduk}</p>
        <p className="text-base text-[#6B7280] mt-0.5">
          {shortKode(batch.kodeBatch)} • {Number(batch.jumlahHasil || 0).toLocaleString('id-ID')} {batch.satuan}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-[#c4c8bb]/30" />
        <div className="space-y-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="relative flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 p-3.5 bg-white rounded-2xl border border-[#c4c8bb]/20 min-w-0">
                  <p className="text-sm font-extrabold text-[#2C4219] uppercase tracking-wide">{s.title}</p>
                  <div className="mt-1.5 space-y-1">
                    {s.rows.map((r) => (
                      <div key={r.label} className="flex items-baseline gap-2 text-base">
                        <span className="text-[#9CA3AF] shrink-0 w-32">{r.label}</span>
                        <span className="font-semibold text-[#221A12] break-words min-w-0">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR untuk lacak publik */}
      {showQr && (
        <div className="rounded-2xl border border-[#c4c8bb]/30 bg-white p-4 flex items-center gap-4">
          {kodeStok ? (
            <>
              <div className="shrink-0 rounded-xl border border-[#c4c8bb]/30 p-1.5 bg-white">
                <QRCodeCanvas value={traceUrl} size={96} level="M" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-[#172C05] flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#2C4219]" /> Pindai untuk melacak
                </p>
                <p className="text-base text-[#6B7280] mt-0.5">
                  Konsumen memindai QR ini untuk melihat asal-usul produk (lahan, tanggal tanam & panen).
                </p>
              </div>
            </>
          ) : (
            <p className="text-base text-[#9CA3AF]">
              QR lacak belum tersedia karena batch ini belum tertaut ke stok gudang (bahan baku).
            </p>
          )}
        </div>
      )}

      {/* Catatan kecil */}
      <div className="flex items-start gap-2 text-base text-[#6B7280]">
        <CalendarDays className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Semua tanggal di atas tercatat otomatis dari setiap tahap pengelolaan.</span>
      </div>
    </div>
  );
};
