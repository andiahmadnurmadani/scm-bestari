import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sprout,
  Package,
  ArrowDownToLine,
  Factory,
  History,
  MapPin,
  User,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  ScanLine,
  Search,
  ChevronRight,
  Wallet,
  FileText,
} from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { formatDateTimeId } from '../../utils/dateUtils';
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
  logistik: { id: string; kodeTransaksi: string; tanggal: string | null; kategori: string; keteranganVendor: string | null; totalBiayaRp: number; statusPembayaran: string | null }[];
}

const formatBerat = (kg: number) => `${Number(kg || 0).toLocaleString('id-ID')} kg`;

const rupiah = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

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

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      <PublicNavbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-4">
          <Link to="/" className="hover:text-[#2C4219] font-medium">Beranda</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#44483e] font-medium">Lacak Batch</span>
        </div>

        <div className="bg-gradient-to-br from-[#2C4219] to-[#1d2e0f] rounded-2xl p-5 sm:p-6 text-white mb-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <ScanLine className="w-5 h-5 text-[#C3E28D]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-[#C3E28D] uppercase tracking-wider">Telusuri Asal-usul Produk</p>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">
                  {loading ? 'Memuat...' : data ? `Batch ${data.batch.kodeBatchStok}` : kodeBatchStok}
                </h1>
                {data && (
                  <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${data.batch.jenis === 'SORGUM' ? 'bg-[#C3E28D] text-[#172C05]' : 'bg-amber-200 text-amber-900'}`}>
                    {data.batch.jenis === 'SORGUM' ? 'Sorgum Sosoh' : 'Gabah'}
                  </span>
                )}
              </div>
            </div>
          </div>
          {data && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-bold uppercase opacity-80">Masuk</p>
                <p className="text-sm font-black">{formatBerat(data.batch.jumlahMasukKg)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-bold uppercase opacity-80">Sisa</p>
                <p className="text-sm font-black">{formatBerat(data.batch.sisaKg)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-bold uppercase opacity-80">Gudang</p>
                <p className="text-sm font-black truncate">{data.gudang?.kodeGudang || '-'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-10 text-center text-sm text-[#6B7280]">
            <span className="inline-block w-5 h-5 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
            Memuat riwayat batch...
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-bold text-[#172C05]">Batch Tidak Ditemukan</p>
            <p className="text-sm text-[#6B7280] mt-1">{error}</p>
            <Link to="/" className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-[#2C4219] hover:underline">
              <ChevronRight className="w-4 h-4" /> Kembali ke Beranda
            </Link>
          </div>
        ) : data ? (
          <div className="space-y-3">
            {/* Timeline */}
            {/* 1. LAHAN & TANAM */}
            {(data.lahan || data.tanam) && (
              <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 sm:p-5">
                <p className="text-[10px] font-black text-[#2C4219] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5" /> Penanaman & Lahan
                </p>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#2C4219] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-[#172C05]">{data.lahan?.namaLahan || '-'}</p>
                      <p className="text-xs text-[#6B7280]">
                        {data.lahan?.kodeLahan ? `Kode ${data.lahan.kodeLahan} ` : ''}
                        {data.lahan?.lokasiDesa ? `• ${data.lahan.lokasiDesa}` : ''}
                      </p>
                    </div>
                  </div>
                  {data.tanam && (
                    <div className="flex items-start gap-2.5">
                      <CalendarDays className="w-4 h-4 text-[#2C4219] mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-[#172C05]">{data.tanam.kodeTanam}</p>
                        <p className="text-xs text-[#6B7280]">
                          Tanam {formatDateTimeId(data.tanam.tanggalTanam)} • Petugas {data.tanam.petugas || '-'}
                        </p>
                        {data.tanam.estimasiPanen && (
                          <p className="text-xs text-[#6B7280]">Estimasi panen {formatDateTimeId(data.tanam.estimasiPanen)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PANEN */}
            {data.panen && (
              <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 sm:p-5">
                <p className="text-[10px] font-black text-[#2C4219] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Panen
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs text-[#6B7280]">Kode Panen</p>
                    <p className="font-bold text-[#172C05]">{data.panen.kodePanen}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Tanggal</p>
                    <p className="font-bold text-[#172C05]">{formatDateTimeId(data.panen.tanggalPanen)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Varietas</p>
                    <p className="font-bold text-[#172C05]">{data.panen.varietas || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Total Hasil</p>
                    <p className="font-bold text-[#172C05]">{formatBerat(data.panen.jumlahHasilKg)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280]">Penanggung Jawab</p>
                    <p className="font-bold text-[#172C05]">{data.panen.petaniPenanggungJawab || '-'}</p>
                  </div>
                  {data.panen.periodeHari != null && (
                    <div>
                      <p className="text-xs text-[#6B7280]">Umur Panen</p>
                      <p className="font-bold text-[#172C05]">{data.panen.periodeHari} hari</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. MASUK GUDANG */}
            <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 sm:p-5">
              <p className="text-[10px] font-black text-[#2C4219] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <ArrowDownToLine className="w-3.5 h-3.5" /> Masuk Gudang
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-[#6B7280]">Kode Batch</p>
                  <p className="font-bold text-[#2C4219]">{data.batch.kodeBatchStok}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Jenis</p>
                  <p className="font-bold text-[#172C05]">
                    {data.batch.jenis === 'SORGUM' ? 'Sorgum (hasil sosoh)' : 'Gabah (kulit utuh)'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Gudang</p>
                  <p className="font-bold text-[#172C05]">{data.gudang?.namaGudang || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Waktu Masuk</p>
                  <p className="font-bold text-[#172C05]">{formatDateTimeId(data.batch.tanggalMasuk)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Jumlah Masuk</p>
                  <p className="font-bold text-[#172C05]">{formatBerat(data.batch.jumlahMasukKg)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Sisa Saat Ini</p>
                  <p className="font-bold text-[#172C05]">{formatBerat(data.batch.sisaKg)}</p>
                </div>
              </div>
              {data.batch.jenis === 'SORGUM' && data.batch.asalBatch?.kodeBatchStok && (
                <div className="mt-3 p-3 bg-[#C3E28D]/20 border border-[#2C4219]/10 rounded-xl text-xs">
                  <p className="font-bold text-[#172C05]">
                    Proses Sosoh: <span className="text-[#8C5A2B]">{data.batch.asalBatch.kodeBatchStok}</span> (gabah) →{' '}
                    <span className="text-[#2C4219]">{data.batch.kodeBatchStok}</span> (sorgum)
                  </p>
                  {data.batch.tanggalSosoh && (
                    <p className="text-[#6B7280] mt-0.5">Selesai disosoh {formatDateTimeId(data.batch.tanggalSosoh)}</p>
                  )}
                </div>
              )}
            </div>

            {/* 4. OLAHAN */}
            <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 sm:p-5">
              <p className="text-[10px] font-black text-[#2C4219] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5" /> Digunakan untuk Olahan
              </p>
              {data.produksi.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Belum ada olahan dari batch ini.</p>
              ) : (
                <div className="space-y-2">
                  {data.produksi.map((p) => (
                    <div key={p.id} className="bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20 p-3">
                      <p className="font-bold text-[#172C05]">{p.kodeBatch} — {p.namaProduk}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Produksi {formatDateTimeId(p.tanggalProduksi)}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        Hasil {Number(p.jumlahHasil).toLocaleString('id-ID')} {p.satuan} • Bahan {p.bahanDigunakan != null ? `${p.bahanDigunakan} kg` : '-'} • PJ {p.operatorProduksi || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. LOGISTIK */}
            <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 sm:p-5">
              <p className="text-[10px] font-black text-[#2C4219] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Logistik & Keuangan
              </p>
              {data.logistik.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">Belum ada transaksi logistik tercatat.</p>
              ) : (
                <div className="space-y-2">
                  {data.logistik.slice(0, 5).map((lg) => (
                    <div key={lg.id} className="flex items-start gap-2.5 bg-[#F7F7F5] rounded-xl p-3 text-sm">
                      <FileText className="w-4 h-4 text-[#2C4219] mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[#172C05]">{lg.kodeTransaksi} — {lg.keteranganVendor || '-'}</p>
                        <p className="text-xs text-[#6B7280]">
                          {lg.kategori} • {lg.tanggal || '-'} • {rupiah(lg.totalBiayaRp)}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lg.statusPembayaran === 'LUNAS' ? 'bg-[#C3E28D]/60 text-[#172C05]' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {lg.statusPembayaran || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Badge autentikasi */}
            <div className="flex items-center justify-center gap-2 text-xs text-[#6B7280] pt-2 pb-4">
              <ShieldCheck className="w-4 h-4 text-[#2C4219]" />
              Data ini dicatat langsung dari sistem manajemen Sorgum KWT.
            </div>
          </div>
        ) : null}
      </main>

      <PublicFooter />
    </div>
  );
};
