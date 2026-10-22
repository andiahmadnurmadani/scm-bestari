import React, { useState } from 'react';
import { Sprout, Wheat, HandHeart, PackageCheck, Quote, MapPin, Leaf, Search } from 'lucide-react';
import { useCms } from '../../context/CmsContext';
import { formatTanggalId } from '../../utils/dateUtils';
import { isDemoMode } from '../common/DemoBanner';

/**
 * Tampilan halaman yang dibuka pembeli dari QR (kemasan / batch).
 * Sengaja tanpa navbar, tanpa kode-kode internal — cukup cerita produk yang
 * hangat, informatif, dan nyaman dibaca di HP.
 */
export interface QrStoryData {
  namaProduk: string;
  subjudul?: string;
  deskripsi?: string;
  fotos: string[];
  kelompokTani?: string | null;
  desa?: string | null;
  kecamatan?: string | null;
  varietas?: string | null;
  tanggalTanam?: string | null;
  tanggalPanen?: string | null;
  umurTanamHari?: number | null;
  petani?: string | null;
  tanggalProduksi?: string | null;
  pengolah?: string | null;
  tanggalKadaluarsa?: string | null;
  komposisi?: string;
  nilaiGizi?: Record<string, number | string>;
}

const GIZI: { key: string; label: string; satuan: string }[] = [
  { key: 'energiKkal', label: 'Energi', satuan: 'kkal' },
  { key: 'proteinG', label: 'Protein', satuan: 'g' },
  { key: 'lemakTotalG', label: 'Lemak total', satuan: 'g' },
  { key: 'karbohidratG', label: 'Karbohidrat', satuan: 'g' },
  { key: 'seratG', label: 'Serat pangan', satuan: 'g' },
  { key: 'gulaTotalG', label: 'Gula total', satuan: 'g' },
  { key: 'natriumMg', label: 'Natrium', satuan: 'mg' },
];

const tgl = (v?: string | null) => (v ? formatTanggalId(v) : '');
/** Nama ditampilkan apa adanya (tidak menebak sapaan dari nama). */
const sapaPetani = (nama?: string | null) => (nama ? nama.trim() : '');

/** Kerangka halaman QR (latar hangat, lebar nyaman di HP). */
const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#FBF7F0] text-[#221A12]">
    <div className="mx-auto w-full max-w-md min-h-screen bg-[#FBF7F0] sm:shadow-xl">{children}</div>
  </div>
);

export const QrStoryLoading: React.FC = () => (
  <Shell>
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-8 text-center">
      <span className="w-10 h-10 border-4 border-[#C3E28D] border-t-[#2C4219] rounded-full animate-spin" />
      <p className="text-lg text-[#44483e]">Menyiapkan cerita produk…</p>
    </div>
  </Shell>
);

export const QrStoryNotFound: React.FC<{ pesan?: string }> = ({ pesan }) => (
  <Shell>
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#fff1e5] text-[#8C5A2B] flex items-center justify-center">
        <Search className="w-7 h-7" />
      </div>
      <p className="text-xl font-bold text-[#172C05]">Produk belum ditemukan</p>
      <p className="text-base text-[#6B7280]">{pesan || 'QR ini sudah tidak aktif atau datanya belum tersedia.'}</p>
    </div>
  </Shell>
);

export const QrStory: React.FC<{ data: QrStoryData }> = ({ data }) => {
  const { cms } = useCms();
  const [fotoAktif, setFotoAktif] = useState(0);
  const fotos = data.fotos.length ? data.fotos : ['/demo/sorghum_grain.webp'];
  const lokasi = [data.desa && `Desa ${data.desa}`, data.kecamatan && `Kec. ${data.kecamatan}`].filter(Boolean).join(', ');
  const pengirim = data.kelompokTani || cms.qrPesanPengirim || 'Ibu-ibu Kelompok Wanita Tani';
  const gizi = GIZI.filter((g) => Number(data.nilaiGizi?.[g.key]) > 0);

  const langkah = [
    data.tanggalTanam && {
      icon: Sprout,
      judul: 'Ditanam di ladang',
      waktu: tgl(data.tanggalTanam),
      isi: [lokasi || 'Di ladang desa kami', data.varietas && `bibit ${data.varietas}`].filter(Boolean).join(' • '),
    },
    data.tanggalPanen && {
      icon: Wheat,
      judul: 'Dirawat & dipanen',
      waktu: tgl(data.tanggalPanen),
      isi: [
        data.petani && `Dipanen oleh ${sapaPetani(data.petani)}`,
        data.umurTanamHari && data.umurTanamHari > 0 && `setelah ${data.umurTanamHari} hari dirawat di ladang`,
      ].filter(Boolean).join(', ') || 'Dipanen saat bulirnya matang sempurna',
    },
    data.tanggalProduksi && {
      icon: HandHeart,
      judul: 'Diolah dengan tangan',
      waktu: tgl(data.tanggalProduksi),
      isi: data.pengolah ? `Diolah oleh ${sapaPetani(data.pengolah)} di dapur produksi kelompok` : 'Diolah di dapur produksi kelompok tani',
    },
    {
      icon: PackageCheck,
      judul: 'Siap untuk keluarga Anda',
      waktu: data.tanggalKadaluarsa ? `Baik digunakan sebelum ${tgl(data.tanggalKadaluarsa)}` : '',
      isi: 'Dikemas bersih dan rapi supaya kualitasnya tetap terjaga.',
    },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; judul: string; waktu: string; isi: string }[];

  return (
    <Shell>
      {/* Foto produk */}
      <div className="relative">
        <img src={fotos[fotoAktif] || fotos[0]} alt={data.namaProduk} className="w-full aspect-[4/5] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#172C05]/90 via-[#172C05]/20 to-transparent" />
        <div className={`absolute ${isDemoMode ? 'top-9' : 'top-4'} left-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-[#2C4219]`}>
          <Leaf className="w-4 h-4" /> Hasil tangan petani desa
        </div>
        <div className="absolute bottom-0 inset-x-0 p-5 text-white">
          <h1 className="text-3xl font-extrabold leading-tight">{data.namaProduk}</h1>
          {data.subjudul && <p className="text-base text-white/85 mt-1">{data.subjudul}</p>}
          {lokasi && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#C3E28D]">
              <MapPin className="w-4 h-4" /> Dari {lokasi}
            </p>
          )}
        </div>
      </div>
      {fotos.length > 1 && (
        <div className="flex gap-2 px-5 pt-3">
          {fotos.map((f, i) => (
            <button key={i} type="button" onClick={() => setFotoAktif(i)} aria-label={`Foto ${i + 1}`}
              className={`w-14 h-14 rounded-xl overflow-hidden border-2 cursor-pointer ${i === fotoAktif ? 'border-[#2C4219]' : 'border-transparent opacity-70'}`}>
              <img src={f} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-5 py-6 space-y-6">
        {data.deskripsi && <p className="text-lg leading-relaxed text-[#44483e]">{data.deskripsi}</p>}

        {/* Pesan petani */}
        <section className="relative rounded-3xl bg-white p-5 shadow-sm border border-[#efe0d2]">
          <Quote className="absolute -top-3 left-5 w-8 h-8 p-1.5 rounded-full bg-[#2C4219] text-[#C3E28D]" />
          <p className="text-sm font-bold text-[#8C5A2B] mt-1">Pesan dari petani</p>
          <p className="mt-2 text-lg leading-relaxed italic text-[#172C05]">“{cms.qrPesanPetani}”</p>
          <p className="mt-3 text-base font-semibold text-[#2C4219]">— {pengirim}</p>
        </section>

        {/* Perjalanan produk */}
        <section>
          <h2 className="text-xl font-extrabold text-[#172C05]">Dari ladang ke tangan Anda</h2>
          <ol className="mt-4 space-y-0">
            {langkah.map((l, i) => {
              const Icon = l.icon;
              const last = i === langkah.length - 1;
              return (
                <li key={l.judul} className="relative flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="w-11 h-11 rounded-2xl bg-[#C3E28D]/50 text-[#2C4219] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    {!last && <span className="w-0.5 flex-1 my-1 bg-[#c4c8bb]/50 rounded-full" />}
                  </div>
                  <div className={last ? 'pb-1' : 'pb-6'}>
                    <p className="text-lg font-bold text-[#172C05] leading-snug">{l.judul}</p>
                    {l.waktu && <p className="text-sm font-semibold text-[#8C5A2B]">{l.waktu}</p>}
                    <p className="text-base text-[#44483e] mt-0.5 leading-relaxed">{l.isi}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Komposisi */}
        {data.komposisi && (
          <section className="rounded-3xl bg-white p-5 border border-[#efe0d2]">
            <h2 className="text-lg font-extrabold text-[#172C05]">Bahan</h2>
            <p className="mt-1.5 text-base leading-relaxed text-[#44483e] whitespace-pre-line">{data.komposisi}</p>
          </section>
        )}

        {/* Nilai gizi */}
        {gizi.length > 0 && (
          <section className="rounded-3xl bg-white p-5 border border-[#efe0d2]">
            <h2 className="text-lg font-extrabold text-[#172C05]">Kandungan gizi</h2>
            <div className="mt-2 divide-y divide-[#efe0d2]">
              {gizi.map((g) => (
                <div key={g.key} className="flex justify-between py-2 text-base">
                  <span className="text-[#44483e]">{g.label}</span>
                  <span className="font-bold text-[#172C05]">{data.nilaiGizi?.[g.key]} {g.satuan}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="pb-4" />
      </div>
    </Shell>
  );
};
