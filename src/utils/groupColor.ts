/**
 * Warna pengelompokan data panen (ratoon).
 *
 * Tujuan: panen ke-1, ke-2, ke-3 dari SATU penanaman diberi warna yang SAMA
 * agar mudah terlihat sebagai satu kelompok; penanaman lain (beda lahan /
 * beda waktu tanam) memakai warna BERBEDA.
 *
 * Warna diberikan secara STABIL berdasarkan urutan kunci grup yang sudah
 * diurutkan, sehingga tidak berubah-ubah saat data di-refresh.
 *
 * Catatan: kelas Tailwind ditulis literal di bawah agar ikut ter-generate.
 */

export interface GroupColor {
  /** Kelas untuk garis tepi kiri (border). */
  border: string;
  /** Kelas untuk latar lembut (badge/baris). */
  soft: string;
  /** Kelas teks (judul/badge). */
  text: string;
  /** Kelas titik penanda (dot). */
  dot: string;
  /** Kelas latar kuat (badge padat). */
  solid: string;
}

const PALETTE: GroupColor[] = [
  { border: 'border-l-[#2C4219]', soft: 'bg-[#2C4219]/8', text: 'text-[#2C4219]', dot: 'bg-[#2C4219]', solid: 'bg-[#2C4219] text-white' },
  { border: 'border-l-[#0EA5E9]', soft: 'bg-[#0EA5E9]/10', text: 'text-[#0369A1]', dot: 'bg-[#0EA5E9]', solid: 'bg-[#0EA5E9] text-white' },
  { border: 'border-l-[#F59E0B]', soft: 'bg-[#F59E0B]/12', text: 'text-[#B45309]', dot: 'bg-[#F59E0B]', solid: 'bg-[#F59E0B] text-white' },
  { border: 'border-l-[#8B5CF6]', soft: 'bg-[#8B5CF6]/10', text: 'text-[#6D28D9]', dot: 'bg-[#8B5CF6]', solid: 'bg-[#8B5CF6] text-white' },
  { border: 'border-l-[#14B8A6]', soft: 'bg-[#14B8A6]/10', text: 'text-[#0F766E]', dot: 'bg-[#14B8A6]', solid: 'bg-[#14B8A6] text-white' },
  { border: 'border-l-[#F43F5E]', soft: 'bg-[#F43F5E]/10', text: 'text-[#BE123C]', dot: 'bg-[#F43F5E]', solid: 'bg-[#F43F5E] text-white' },
  { border: 'border-l-[#8C5A2B]', soft: 'bg-[#8C5A2B]/10', text: 'text-[#8C5A2B]', dot: 'bg-[#8C5A2B]', solid: 'bg-[#8C5A2B] text-white' },
  { border: 'border-l-[#64748B]', soft: 'bg-[#64748B]/10', text: 'text-[#475569]', dot: 'bg-[#64748B]', solid: 'bg-[#64748B] text-white' },
];

export function groupColor(index: number): GroupColor {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

/**
 * Bangun peta kunci-grup → indeks warna yang STABIL.
 * @param keys daftar kunci grup (urutan apa pun; akan diurutkan agar stabil)
 */
export function buildGroupColorMap(keys: string[]): Map<string, number> {
  const unik = Array.from(new Set(keys)).sort();
  const map = new Map<string, number>();
  unik.forEach((k, i) => map.set(k, i));
  return map;
}

/** Kunci grup untuk satu data panen: utamakan penanaman, fallback lahan. */
export function groupKeyOf(item: { plantingId?: string | null; namaLahan?: string | null }): string {
  return item.plantingId ? `planting:${item.plantingId}` : `lahan:${item.namaLahan || 'tanpa-lahan'}`;
}
