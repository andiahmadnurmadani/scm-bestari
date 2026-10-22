import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { QrStory, QrStoryData, QrStoryLoading, QrStoryNotFound } from '../../components/public/QrStory';

interface TraceApi {
  batch: { jenis: 'GABAH' | 'SORGUM' };
  lahan: { lokasiDesa?: string; kecamatan?: string | null; kelompokTani?: string | null } | null;
  tanam: { tanggalTanam: string | null; petugas: string | null } | null;
  panen: { varietas: string; tanggalPanen: string | null; petaniPenanggungJawab: string; periodeHari: number | null } | null;
  produksi: {
    namaProduk: string; tanggalProduksi: string | null; tanggalKadaluarsa: string | null; operatorProduksi: string | null;
    fotoUrl: string | null; deskripsi: string; kapasitas: string; komposisi: string; nilaiGizi: Record<string, number | string>; fotos: string[];
  }[];
}

/** Halaman dari QR batch: perjalanan satu batch dari lahan sampai produk. */
export const TracePage: React.FC = () => {
  const { kodeBatchStok } = useParams<{ kodeBatchStok: string }>();
  const [story, setStory] = useState<QrStoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!kodeBatchStok) return;
    let mounted = true;
    axios
      .get(`${getApiBaseUrl()}/public/trace/${encodeURIComponent(kodeBatchStok)}`)
      .then((res) => {
        const d: TraceApi = res.data?.data;
        const p = d.produksi?.[0];
        const bahan = d.batch.jenis === 'SORGUM' ? 'Sorgum sosoh' : 'Gabah sorgum';
        const fotos = p?.fotos?.length ? p.fotos : p?.fotoUrl ? [p.fotoUrl] : [];
        if (mounted) setStory({
          namaProduk: p?.namaProduk || `${bahan}${d.panen?.varietas ? ` ${d.panen.varietas}` : ''}`,
          subjudul: p?.kapasitas ? `Kemasan ${p.kapasitas}` : undefined,
          deskripsi: p?.deskripsi,
          fotos,
          kelompokTani: d.lahan?.kelompokTani, desa: d.lahan?.lokasiDesa, kecamatan: d.lahan?.kecamatan, varietas: d.panen?.varietas,
          tanggalTanam: d.tanam?.tanggalTanam, tanggalPanen: d.panen?.tanggalPanen, umurTanamHari: d.panen?.periodeHari,
          petani: d.panen?.petaniPenanggungJawab || d.tanam?.petugas,
          tanggalProduksi: p?.tanggalProduksi, pengolah: p?.operatorProduksi, tanggalKadaluarsa: p?.tanggalKadaluarsa,
          komposisi: p?.komposisi, nilaiGizi: p?.nilaiGizi,
        });
      })
      .catch((err) => mounted && setError(err?.response?.data?.message ? 'QR ini sudah tidak aktif atau datanya belum tersedia.' : 'Gagal memuat. Periksa koneksi internet Anda.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [kodeBatchStok]);

  if (loading) return <QrStoryLoading />;
  if (error || !story) return <QrStoryNotFound pesan={error} />;
  return <QrStory data={story} />;
};
