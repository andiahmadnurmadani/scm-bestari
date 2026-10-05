import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sprout,
  Package,
  ArrowDownToLine,
  Factory,
  MapPin,
  ShieldCheck,
  ScanLine,
  Search,
  ChevronRight,
  Droplets,
} from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { formatTanggalId } from '../../utils/dateUtils';
import { shortKode } from '../../utils/kode';
import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiConfig';

interface TraceData {
  batch: { kodeBatchStok: string; jenis: 'GABAH' | 'SORGUM'; asalBatch?: { id: string; kodeBatchStok: string } | null; tanggalSosoh: string | null; jumlahMasukKg: number; sisaKg: number; tanggalMasuk: string | null };
  gudang: { kodeGudang: string; namaGudang: string } | null;
  lahan: { kodeLahan: string; namaLahan: string; lokasiDesa?: string } | null;
  tanam: { kodeTanam: string; tanggalTanam: string | null; estimasiPanen: string | null; petugas: string | null; statusTanam: string | null } | null;
  panen: { kodePanen: string; namaLahan: string; varietas: string; tanggalPanen: string | null; jumlahHasilKg: number; petaniPenanggungJawab: string; status: string; periodeHari: number | null } | null;
  movements: { id: string; tipe: 'MASUK' | 'KELUAR'; jumlahKg: number; keterangan: string; createdAt: string | null; kodeBatch: string | null; namaProduk: string | null }[];
  produksi: { id: string; kodeBatch: string; namaProduk: string; kategori: string; tanggalProduksi: string | null; jumlahHasil: number; satuan: string; bahanDigunakan: number | null; operatorProduksi: string | null; createdAt: string | null }[];
}

const formatBerat = (kg: number) => `${Number(kg || 0).toLocaleString('id-ID')} kg`;

/** Satu tahap dalam alur visual (ikon besar + judul + ringkasan). */
const Stage: React.FC<{
  no: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  last?: boolean;
}> = ({ no, icon: Icon, color, title, subtitle, children, last }) => (
  <div className="relative flex gap-4 sm:gap-5">
    {/* Garis penghubung + nomor */}
    <div className="flex flex-col items-center shrink-0">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-sm ${color}`}>
        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      {!last && <div className="w-1 flex-1 my-1 rounded-full bg-[#c4c8bb]/40" />}
    </div>

    {/* Kartu isi */}
    <div className={`flex-1 min-w-0 ${last ? '' : 'pb-7'}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-[#9CA3AF]">TAHAP {no}</span>
      </div>
      <h2 className="text-lg sm:text-xl font-extrabold text-[#172C05] leading-tight">{title}</h2>
      {subtitle && <p className="text-base text-[#6B7280] mt-0.5">{subtitle}</p>}
      {children && <div className="mt-3 space-y-2.5">{children}</div>}
    </div>
  </div>
);

/** Baris data sederhana: label kecil + nilai besar & tebal. */
const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-sm text-[#6B7280]">{label}</p>
    <p className="text-base sm:text-lg font-bold text-[#172C05] break-words">{value}</p>
  </div>
);

export const TracePage: React.FC = () => {
  const { kodeBatchStok } = useParams<{ kodeBatchStok: string }>();
  const [data, setData] = useState<TraceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!kodeBatchStok) return;
    let mounted = true;
    setLoading(true);
    setError('');
    axios
      .get(`${getApiBaseUrl()}/public/trace/${encodeURIComponent(kodeBatchStok)}`)
      .then((res) => {
        if (mounted) setData(res.data?.data || null);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || 'Batch tidak ditemukan.');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [kodeBatchStok]);

  const olahanPertama = data?.produksi?.[0];

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      <PublicNavbar />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header ringkas */}
        <div className="flex items-center gap-2 text-base text-[#6B7280] mb-5">
          <Link to="/" className="hover:text-[#2C4219] font-medium">Beranda</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#44483e] font-medium">Lacak Produk</span>
        </div>

        {/* Kartu hero */}
        <div className="bg-gradient-to-br from-[#2C4219] to-[#1d2e0f] rounded-3xl p-6 sm:p-7 text-white mb-7 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <ScanLine className="w-7 h-7 text-[#C3E28D]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#C3E28D] uppercase tracking-wider">Asal-usul Produk</p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {loading ? 'Memuat…' : data ? (olahanPertama?.namaProduk || `Batch ${shortKode(data.batch.kodeBatchStok)}`) : 'Tidak ditemukan'}
              </h1>
              {data && (
                <span className={`inline-block mt-1.5 text-sm font-black px-3 py-1 rounded-full uppercase ${data.batch.jenis === 'SORGUM' ? 'bg-[#C3E28D] text-[#172C05]' : 'bg-amber-200 text-amber-900'}`}>
                  {data.batch.jenis === 'SORGUM' ? 'Sorgum Sosoh' : 'Gabah'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Isi */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-12 text-center text-base text-[#6B7280]">
            <span className="inline-block w-6 h-6 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
            Memuat riwayat produk…
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7" />
            </div>
            <p className="text-lg font-bold text-[#172C05]">Produk Tidak Ditemukan</p>
            <p className="text-base text-[#6B7280] mt-1">{error}</p>
            <Link to="/" className="inline-flex items-center gap-1 mt-5 text-base font-bold text-[#2C4219] hover:underline">
              <ChevronRight className="w-5 h-5" /> Kembali ke Beranda
            </Link>
          </div>
        ) : data ? (
          <div className="bg-white rounded-3xl border border-[#c4c8bb]/30 p-5 sm:p-7">
            {/* ── ALUR VISUAL: Lahan → Tanam → Panen → Gudang/Sosoh → Olahan ── */}
            <div>
              {/* 1. LAHAN */}
              {data.lahan && (
                <Stage no={1} icon={MapPin} color="bg-[#2C4219] text-white" title="Lahan" subtitle={data.lahan.lokasiDesa || undefined}>
                  <Field label="Nama lahan" value={data.lahan.namaLahan} />
                  <Field label="Kode lahan" value={shortKode(data.lahan.kodeLahan)} />
                </Stage>
              )}

              {/* 2. TANAM */}
              {data.tanam && (
                <Stage no={2} icon={Sprout} color="bg-[#C3E28D] text-[#172C05]" title="Ditanam" subtitle={data.tanam.petugas ? `Oleh ${data.tanam.petugas}` : undefined}>
                  <Field label="Tanggal tanam" value={formatTanggalId(data.tanam.tanggalTanam)} />
                  {data.tanam.estimasiPanen && <Field label="Perkiraan panen" value={formatTanggalId(data.tanam.estimasiPanen)} />}
                  <Field label="Kode tanam" value={shortKode(data.tanam.kodeTanam)} />
                </Stage>
              )}

              {/* 3. PANEN */}
              {data.panen && (
                <Stage no={3} icon={Package} color="bg-amber-100 text-amber-800" title="Dipanen" subtitle={data.panen.varietas || undefined}>
                  <Field label="Tanggal panen" value={formatTanggalId(data.panen.tanggalPanen)} />
                  <Field label="Jumlah hasil" value={formatBerat(data.panen.jumlahHasilKg)} />
                  {data.panen.periodeHari != null && <Field label="Umur tanam" value={`${data.panen.periodeHari} hari`} />}
                  <Field label="Kode panen" value={shortKode(data.panen.kodePanen)} />
                </Stage>
              )}

              {/* 4. GUDANG / SOSOH */}
              <Stage
                no={4}
                icon={data.batch.jenis === 'SORGUM' ? Droplets : ArrowDownToLine}
                color="bg-sky-100 text-sky-700"
                title={data.batch.jenis === 'SORGUM' ? 'Disosoh & Disimpan' : 'Masuk Gudang'}
                subtitle={data.gudang?.namaGudang || undefined}
              >
                <Field label="Kode batch" value={shortKode(data.batch.kodeBatchStok)} />
                {data.batch.jenis === 'SORGUM' && data.batch.asalBatch?.kodeBatchStok && (
                  <Field label="Dari gabah" value={shortKode(data.batch.asalBatch.kodeBatchStok)} />
                )}
                <Field label="Waktu" value={formatTanggalId(data.batch.tanggalMasuk)} />
              </Stage>

              {/* 5. OLAHAN */}
              <Stage
                no={5}
                icon={Factory}
                color="bg-purple-100 text-purple-700"
                title="Jadi Produk Olahan"
                subtitle={olahanPertama ? formatTanggalId(olahanPertama.tanggalProduksi) : undefined}
                last
              >
                {data.produksi.length === 0 ? (
                  <p className="text-base text-[#9CA3AF]">Batch ini belum diolah menjadi produk.</p>
                ) : (
                  data.produksi.map((p) => (
                    <div key={p.id} className="bg-[#FFF8F4] rounded-2xl border border-[#c4c8bb]/20 p-4">
                      <p className="text-lg font-extrabold text-[#172C05]">{p.namaProduk}</p>
                      <p className="text-base text-[#6B7280] mt-0.5">{formatTanggalId(p.tanggalProduksi)}</p>
                      <p className="text-base text-[#44483e] mt-1.5">
                        Hasil <b>{Number(p.jumlahHasil).toLocaleString('id-ID')} {p.satuan}</b>
                        {p.operatorProduksi ? ` • PJ ${p.operatorProduksi}` : ''}
                      </p>
                    </div>
                  ))
                )}
              </Stage>
            </div>

            {/* Badge autentikasi */}
            <div className="flex items-center justify-center gap-2 text-base text-[#6B7280] pt-6 mt-2 border-t border-[#c4c8bb]/20">
              <ShieldCheck className="w-5 h-5 text-[#2C4219]" />
              Data dicatat langsung dari sistem Sorgum KWT.
            </div>
          </div>
        ) : null}
      </main>

      <PublicFooter />
    </div>
  );
};
