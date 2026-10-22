import React, { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { packagingApi } from '../../api/endpoints/packagingApi';
import { PackagingMaterial } from '../../types';

interface Props {
  productId: string | null;
  packagingId: string;
  jumlahKemasan: string;
  jumlahHasil: string;
  /** satuan hasil olahan (mis. Pcs/Pouch) — ditampilkan di petunjuk jumlah */
  satuanHasil?: string;
  /** sedang menambah produk olahan baru (belum punya kemasan) */
  produkBaru?: boolean;
  /** stok kemasan yang sudah terpakai oleh batch ini (saat edit) — dihitung kembali */
  terpakaiSebelumnya?: { packagingId: string | null; jumlah: number };
  /** pilih otomatis bila produk hanya punya 1 kemasan (hanya untuk olahan baru) */
  autoPilih?: boolean;
  onChange: (v: { packagingId: string; jumlahKemasan: string }) => void;
}

/**
 * Pilih kemasan yang dipakai batch olahan. Hanya menampilkan kemasan milik produk
 * terpilih; stok kemasan otomatis berkurang sebanyak "Jumlah kemasan" saat disimpan.
 */
export const KemasanPicker: React.FC<Props> = ({ productId, packagingId, jumlahKemasan, jumlahHasil, satuanHasil = '', produkBaru = false, terpakaiSebelumnya, autoPilih = true, onChange }) => {
  const [list, setList] = useState<PackagingMaterial[]>([]);

  useEffect(() => {
    if (!productId) { setList([]); return; }
    packagingApi.getAll({ productId, limit: 100 }).then((r) => {
      const data = r.data || [];
      setList(data);
      // Hanya ada 1 kemasan untuk produk ini → pilih otomatis
      if (autoPilih && !packagingId && data.length === 1) onChange({ packagingId: data[0].id, jumlahKemasan });
    }).catch(() => setList([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const dipilih = list.find((k) => k.id === packagingId) || null;
  const butuh = Number(jumlahKemasan !== '' ? jumlahKemasan : jumlahHasil) || 0;
  const tersedia = dipilih
    ? dipilih.stokTersedia + (terpakaiSebelumnya && terpakaiSebelumnya.packagingId === dipilih.id ? terpakaiSebelumnya.jumlah : 0)
    : 0;
  const kurang = dipilih && butuh > tersedia;

  return (
    <div className="p-4 bg-[#fff8f4] border border-[#efe0d2] rounded-2xl space-y-3">
      <p className="text-sm font-extrabold text-[#2C4219] flex items-center gap-1.5"><Package className="w-4 h-4" /> Kemasan yang Dipakai</p>
      {produkBaru ? (
        <p className="text-xs text-[#6B7280]">Produk baru belum punya kemasan. Setelah disimpan, tambahkan kemasannya di menu Kelola Data Kemasan (pilih produk ini), lalu hubungkan lewat Edit olahan.</p>
      ) : !productId ? (
        <p className="text-xs text-[#6B7280]">Pilih produk dulu.</p>
      ) : list.length === 0 ? (
        <p className="text-xs text-amber-700">Belum ada kemasan untuk produk ini. Tambahkan di menu Kelola Data Kemasan (pilih produknya), atau lanjutkan tanpa kemasan.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Kemasan</label>
            <select
              value={packagingId}
              onChange={(e) => onChange({ packagingId: e.target.value, jumlahKemasan })}
              className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
            >
              <option value="">-- Tanpa kemasan --</option>
              {list.map((k) => (
                <option key={k.id} value={k.id}>{k.namaKemasan} (stok {k.stokTersedia.toLocaleString('id-ID')})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#2C4219] mb-1">Jumlah kemasan dipakai</label>
            <input
              type="number"
              min="0"
              value={jumlahKemasan}
              onChange={(e) => onChange({ packagingId, jumlahKemasan: e.target.value })}
              placeholder={jumlahHasil ? `Sama dengan hasil: ${jumlahHasil}${satuanHasil ? ` ${satuanHasil}` : ''}` : 'Contoh: 150'}
              disabled={!packagingId}
              className="w-full p-3 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold disabled:opacity-60"
            />
          </div>
        </div>
      )}
      {dipilih && (
        <p className={`text-xs ${kurang ? 'font-semibold text-red-600' : 'text-[#6B7280]'}`}>
          {kurang
            ? `Stok kemasan tidak cukup: butuh ${butuh.toLocaleString('id-ID')}, tersedia ${tersedia.toLocaleString('id-ID')}.`
            : `Stok kemasan akan berkurang ${butuh.toLocaleString('id-ID')} ${dipilih.satuan || 'Pcs'} saat disimpan. Setiap batch olahan punya QR sendiri.`}
        </p>
      )}
    </div>
  );
};
