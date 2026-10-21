import React from 'react';
import { CalendarClock } from 'lucide-react';
import { Planting } from '../../types';
import { parseTanggal, formatTanggalId } from '../../utils/dateUtils';
import { todayLocalISO } from '../../utils/tanggal';

/** Selisih hari (b - a) berbasis tanggal lokal, aman dari pergeseran zona waktu. */
function selisihHari(a: string, b: string): number | null {
  const da = parseTanggal(a?.slice(0, 10));
  const db = parseTanggal(b?.slice(0, 10));
  if (!da || !db) return null;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

interface HarvestPredictionProps {
  planting: Planting | null;
  /** Tanggal panen yang sedang diisi di form (YYYY-MM-DD) */
  tanggalPanen?: string;
}

/**
 * Kartu "Prediksi Panen" di form input panen: menampilkan perkiraan tanggal
 * panen (dari tanggal tanam + umur panen varietas) dan berapa hari lagi.
 */
export default function HarvestPrediction({ planting, tanggalPanen }: HarvestPredictionProps) {
  if (!planting) return null;

  const hariIni = todayLocalISO();
  const umurHariIni = selisihHari(planting.tanggalTanam, hariIni);
  const estimasi = planting.estimasiPanen || '';
  const sisaHari = estimasi ? selisihHari(hariIni, estimasi) : null;
  const totalHari = estimasi ? selisihHari(planting.tanggalTanam, estimasi) : null;
  const umurSaatPanen = tanggalPanen ? selisihHari(planting.tanggalTanam, tanggalPanen) : null;

  const persen =
    totalHari && totalHari > 0 && umurHariIni !== null
      ? Math.max(0, Math.min(100, Math.round((umurHariIni / totalHari) * 100)))
      : null;

  let pesan = 'Perkiraan panen belum diisi pada data penanaman.';
  let warna = 'text-[#6B7280]';
  if (sisaHari !== null) {
    if (sisaHari > 0) {
      pesan = `${sisaHari} hari lagi`;
      warna = 'text-[#2C4219]';
    } else if (sisaHari === 0) {
      pesan = 'Hari ini waktunya panen';
      warna = 'text-amber-700';
    } else {
      pesan = `Sudah lewat ${Math.abs(sisaHari)} hari dari perkiraan`;
      warna = 'text-amber-700';
    }
  }

  return (
    <div className="mt-3 p-4 bg-white border border-[#C3E28D]/70 rounded-2xl space-y-3">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-[#C3E28D]/40 text-[#2C4219] flex items-center justify-center shrink-0">
          <CalendarClock className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#6B7280]">Prediksi Panen</p>
          <p className={`text-lg font-extrabold leading-tight ${warna}`}>{pesan}</p>
          {estimasi && (
            <p className="text-sm text-[#44483e] mt-0.5">
              Perkiraan tanggal panen: <b>{formatTanggalId(estimasi)}</b>
            </p>
          )}
        </div>
      </div>

      {persen !== null && (
        <div>
          <div className="h-2.5 w-full bg-[#F1F8E9] rounded-full overflow-hidden">
            <div className="h-full bg-[#2C4219] rounded-full transition-all" style={{ width: `${persen}%` }} />
          </div>
          <p className="text-xs text-[#6B7280] mt-1.5">
            Umur tanaman hari ini <b className="text-[#2C4219]">{umurHariIni} hari</b> dari sekitar {totalHari} hari
          </p>
        </div>
      )}

      {umurSaatPanen !== null && umurSaatPanen >= 0 && (
        <p className="text-xs text-[#44483e] bg-[#F7F7F5] rounded-xl px-3 py-2">
          Dengan tanggal panen yang diisi, umur tanaman saat panen: <b>{umurSaatPanen} hari</b> sejak tanam.
        </p>
      )}
    </div>
  );
}
