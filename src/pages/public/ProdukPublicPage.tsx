import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { getApiBaseUrl } from '../../utils/apiConfig';
import { QrStory, QrStoryData, QrStoryLoading, QrStoryNotFound } from '../../components/public/QrStory';

/** Halaman dari QR batch olahan (1 olahan = 1 QR): cerita persis batch ini. */
export const ProdukPublicPage: React.FC = () => {
  const { kodeBatch } = useParams<{ kodeBatch: string }>();
  const [story, setStory] = useState<QrStoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!kodeBatch) return;
    let mounted = true;
    axios
      .get(`${getApiBaseUrl()}/public/produk/${encodeURIComponent(kodeBatch)}`)
      .then((res) => {
        const d = res.data?.data || {};
        if (mounted) setStory({
          namaProduk: d.namaProduk,
          subjudul: d.kapasitas ? `Kemasan ${d.kapasitas}` : undefined,
          deskripsi: d.deskripsi,
          fotos: d.fotos || [],
          kelompokTani: d.kelompokTani, desa: d.lokasiDesa, kecamatan: d.kecamatan, varietas: d.varietas,
          tanggalTanam: d.tanggalTanam, tanggalPanen: d.tanggalPanen, umurTanamHari: d.umurTanamHari, petani: d.petani,
          tanggalProduksi: d.tanggalProduksi, pengolah: d.pengolah, tanggalKadaluarsa: d.tanggalKadaluarsa,
          komposisi: d.komposisi, nilaiGizi: d.nilaiGizi,
        });
      })
      .catch((err) => mounted && setError(err?.response?.data?.message ? 'QR ini sudah tidak aktif atau datanya belum tersedia.' : 'Gagal memuat. Periksa koneksi internet Anda.'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [kodeBatch]);

  if (loading) return <QrStoryLoading />;
  if (error || !story) return <QrStoryNotFound pesan={error} />;
  return <QrStory data={story} />;
};
