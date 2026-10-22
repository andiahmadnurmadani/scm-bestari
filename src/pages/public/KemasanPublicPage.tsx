import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ChevronRight, Search, ScanLine, MapPin, CalendarDays, ShieldCheck, List, Beaker } from 'lucide-react';
import axios from 'axios';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { formatTanggalId } from '../../utils/dateUtils';
import { getApiBaseUrl } from '../../utils/apiConfig';

interface KemasanData {
  kemasan: {
    kodeKemasan: string;
    namaKemasan: string;
    kategori: string;
    kapasitas: string;
    fotos: string[];
    komposisi: string;
    nilaiGizi: Record<string, number | string>;
    akg: { nutrisi: string; perSajian: string; akgPersen: number }[];
  };
  produk: { name: string; deskripsi: string; fotoUrl: string | null; satuanHasil: string } | null;
  batches: {
    kodeBatch: string;
    tanggalProduksi: string | null;
    tanggalKadaluarsa: string | null;
    namaLahan: string | null;
    varietas: string | null;
    tanggalPanen: string | null;
    kodeBatchStok: string | null;
  }[];
}

/** Label & satuan nilai gizi (hanya yang terisi yang ditampilkan). */
const GIZI: { key: string; label: string; satuan: string }[] = [
  { key: 'energiKkal', label: 'Energi', satuan: 'kkal' },
  { key: 'proteinG', label: 'Protein', satuan: 'g' },
  { key: 'lemakTotalG', label: 'Lemak total', satuan: 'g' },
  { key: 'lemakJenuhG', label: 'Lemak jenuh', satuan: 'g' },
  { key: 'karbohidratG', label: 'Karbohidrat', satuan: 'g' },
  { key: 'seratG', label: 'Serat pangan', satuan: 'g' },
  { key: 'gulaTotalG', label: 'Gula total', satuan: 'g' },
  { key: 'natriumMg', label: 'Natrium', satuan: 'mg' },
];

/** Halaman publik dari QR kemasan: info produk + batch yang bisa dilacak. */
export const KemasanPublicPage: React.FC = () => {
  const { kodeKemasan } = useParams<{ kodeKemasan: string }>();
  const [data, setData] = useState<KemasanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fotoAktif, setFotoAktif] = useState(0);

  useEffect(() => {
    if (!kodeKemasan) return;
    let mounted = true;
    setLoading(true);
    setError('');
    axios
      .get(`${getApiBaseUrl()}/public/kemasan/${encodeURIComponent(kodeKemasan)}`)
      .then((res) => mounted && setData(res.data?.data || null))
      .catch((err) => mounted && setError(err?.response?.data?.message || 'Kemasan tidak ditemukan.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [kodeKemasan]);

  const fotos = data ? [...(data.kemasan.fotos || []), ...(data.produk?.fotoUrl && !data.kemasan.fotos?.length ? [data.produk.fotoUrl] : [])] : [];
  const gizi = data ? GIZI.filter((g) => Number(data.kemasan.nilaiGizi?.[g.key]) > 0) : [];
  const akg = data ? (data.kemasan.akg || []).filter((a) => Number(a.akgPersen) > 0) : [];

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      <PublicNavbar />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 text-base text-[#6B7280] mb-5">
          <Link to="/" className="hover:text-[#2C4219] font-medium">Beranda</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#44483e] font-medium">Info Produk</span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-12 text-center text-base text-[#6B7280]">
            <span className="inline-block w-6 h-6 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
            Memuat info produk…
          </div>
        ) : error || !data ? (
          <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7" />
            </div>
            <p className="text-lg font-bold text-[#172C05]">Produk Tidak Ditemukan</p>
            <p className="text-base text-[#6B7280] mt-1">{error || 'Kemasan tidak ditemukan.'}</p>
            <Link to="/" className="inline-flex items-center gap-1 mt-5 text-base font-bold text-[#2C4219] hover:underline">
              <ChevronRight className="w-5 h-5" /> Kembali ke Beranda
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Kartu produk */}
            <div className="bg-white rounded-3xl border border-[#c4c8bb]/30 overflow-hidden">
              {fotos.length > 0 && (
                <div>
                  <img src={fotos[fotoAktif] || fotos[0]} alt={data.kemasan.namaKemasan} className="w-full aspect-[4/3] object-cover" />
                  {fotos.length > 1 && (
                    <div className="flex gap-2 p-3">
                      {fotos.map((f, i) => (
                        <button key={i} type="button" onClick={() => setFotoAktif(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer ${i === fotoAktif ? 'border-[#2C4219]' : 'border-transparent'}`}>
                          <img src={f} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="p-5 sm:p-6">
                <p className="text-sm font-bold text-[#2C4219] flex items-center gap-1.5"><ScanLine className="w-4 h-4" /> Produk KWT Sorgum</p>
                <h1 className="text-2xl sm:text-3xl font-black text-[#172C05] mt-1">{data.produk?.name || data.kemasan.namaKemasan}</h1>
                <p className="text-base text-[#6B7280] mt-1">
                  {data.kemasan.namaKemasan}{data.kemasan.kapasitas ? ` • ${data.kemasan.kapasitas}` : ''}
                </p>
                {data.produk?.deskripsi && <p className="text-base text-[#44483e] mt-3 leading-relaxed">{data.produk.deskripsi}</p>}
              </div>
            </div>

            {/* Komposisi */}
            {data.kemasan.komposisi && (
              <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-5">
                <h2 className="text-lg font-extrabold text-[#172C05] flex items-center gap-2"><List className="w-5 h-5 text-[#2C4219]" /> Komposisi</h2>
                <p className="text-base text-[#44483e] mt-2 leading-relaxed whitespace-pre-line">{data.kemasan.komposisi}</p>
              </div>
            )}

            {/* Nilai gizi */}
            {(gizi.length > 0 || akg.length > 0) && (
              <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-5">
                <h2 className="text-lg font-extrabold text-[#172C05] flex items-center gap-2"><Beaker className="w-5 h-5 text-[#2C4219]" /> Informasi Nilai Gizi</h2>
                <div className="mt-3 divide-y divide-[#c4c8bb]/20">
                  {gizi.map((g) => (
                    <div key={g.key} className="flex justify-between py-2 text-base">
                      <span className="text-[#44483e]">{g.label}</span>
                      <span className="font-bold text-[#172C05]">{data.kemasan.nilaiGizi[g.key]} {g.satuan}</span>
                    </div>
                  ))}
                  {gizi.length === 0 && akg.map((a) => (
                    <div key={a.nutrisi} className="flex justify-between py-2 text-base">
                      <span className="text-[#44483e]">{a.nutrisi}</span>
                      <span className="font-bold text-[#172C05]">{a.perSajian} ({a.akgPersen}% AKG)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Batch produksi → lacak asal-usul */}
            <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-5">
              <h2 className="text-lg font-extrabold text-[#172C05] flex items-center gap-2"><Package className="w-5 h-5 text-[#2C4219]" /> Asal-usul Produk</h2>
              {data.batches.length === 0 ? (
                <p className="text-base text-[#9CA3AF] mt-2">Belum ada catatan produksi untuk produk ini.</p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {data.batches.map((b) => (
                    <div key={b.kodeBatch} className="rounded-2xl bg-[#F7F7F5] p-4">
                      <p className="text-sm font-bold text-[#6B7280]">Batch {b.kodeBatch}</p>
                      <div className="mt-1.5 space-y-1 text-base text-[#44483e]">
                        {b.tanggalProduksi && <p className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-[#2C4219]" /> Diproduksi {formatTanggalId(b.tanggalProduksi)}</p>}
                        {b.namaLahan && <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#2C4219]" /> Dari lahan {b.namaLahan}{b.tanggalPanen ? `, dipanen ${formatTanggalId(b.tanggalPanen)}` : ''}</p>}
                        {b.tanggalKadaluarsa && <p className="text-sm text-[#6B7280]">Baik digunakan sebelum {formatTanggalId(b.tanggalKadaluarsa)}</p>}
                      </div>
                      {b.kodeBatchStok && (
                        <Link to={`/trace/${encodeURIComponent(b.kodeBatchStok)}`} className="inline-flex items-center gap-1 mt-2.5 text-base font-bold text-[#2C4219] hover:underline">
                          Lacak dari lahan sampai produk <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-base text-[#6B7280] pt-1">
              <ShieldCheck className="w-5 h-5 text-[#2C4219]" />
              Data dicatat langsung dari sistem Sorgum KWT.
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
};
