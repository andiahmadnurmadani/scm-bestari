import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { QrStory, QrStoryData, QrStoryLoading, QrStoryNotFound } from '../../components/public/QrStory';

interface KemasanApi {
  kemasan: { namaKemasan: string; kapasitas: string; fotos: string[]; komposisi: string; nilaiGizi: Record<string, number | string> };
  produk: { name: string; deskripsi: string; fotoUrl: string | null } | null;
  batches: {
    tanggalProduksi: string | null; tanggalKadaluarsa: string | null; lokasiDesa: string | null; kecamatan: string | null;
    kelompokTani: string | null; varietas: string | null; tanggalTanam: string | null; tanggalPanen: string | null;
    umurTanamHari: number | null; petani: string | null; pengolah: string | null;
  }[];
}

/** Halaman dari QR kemasan: cerita produk dari produksi terbarunya. */
export const KemasanPublicPage: React.FC = () => {
  const { kodeKemasan } = useParams<{ kodeKemasan: string }>();
  const [story, setStory] = useState<QrStoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!kodeKemasan) return;
    let mounted = true;
    axios
      .get(`${getApiBaseUrl()}/public/kemasan/${encodeURIComponent(kodeKemasan)}`)
      .then((res) => {
        const d: KemasanApi = res.data?.data;
        const b = d.batches?.[0];
        const fotos = d.kemasan.fotos?.length ? d.kemasan.fotos : d.produk?.fotoUrl ? [d.produk.fotoUrl] : [];
        if (mounted) setStory({
          namaProduk: d.produk?.name || d.kemasan.namaKemasan,
          subjudul: d.kemasan.kapasitas ? `Kemasan ${d.kemasan.kapasitas}` : undefined,
          deskripsi: d.produk?.deskripsi,
          fotos,
          kelompokTani: b?.kelompokTani, desa: b?.lokasiDesa, kecamatan: b?.kecamatan, varietas: b?.varietas,
          tanggalTanam: b?.tanggalTanam, tanggalPanen: b?.tanggalPanen, umurTanamHari: b?.umurTanamHari, petani: b?.petani,
          tanggalProduksi: b?.tanggalProduksi, pengolah: b?.pengolah, tanggalKadaluarsa: b?.tanggalKadaluarsa,
          komposisi: d.kemasan.komposisi, nilaiGizi: d.kemasan.nilaiGizi,
        });
      })
      .catch((err) => mounted && setError(err?.response?.data?.message ? 'QR ini sudah tidak aktif atau datanya belum tersedia.' : 'Gagal memuat. Periksa koneksi internet Anda.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [kodeKemasan]);

  if (loading) return <QrStoryLoading />;
  if (error || !story) return <QrStoryNotFound pesan={error} />;
  return <QrStory data={story} />;
};
