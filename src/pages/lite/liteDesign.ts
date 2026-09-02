// ── Lite Mode Design System (Botanical Rail, Elegant, Clean & Balanced) ───────────────

export const LITE_COLOR = {
  green: {
    bg: 'bg-[#EBF7EE]',
    text: 'text-[#1B5E20]',
    border: 'border-[#C8E6C9]',
    badge: 'bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]',
    dot: 'bg-[#2E7D32]',
  },
  amber: {
    bg: 'bg-[#FFF8E1]',
    text: 'text-[#B78103]',
    border: 'border-[#FFE082]',
    badge: 'bg-[#FFF8E1] text-[#B78103] border border-[#FFE082]',
    dot: 'bg-[#F57C00]',
  },
  blue: {
    bg: 'bg-[#E3F2FD]',
    text: 'text-[#1565C0]',
    border: 'border-[#BBDEFB]',
    badge: 'bg-[#E3F2FD] text-[#1565C0] border border-[#BBDEFB]',
    dot: 'bg-[#1976D2]',
  },
  red: {
    bg: 'bg-[#FFEBEE]',
    text: 'text-[#C62828]',
    border: 'border-[#FFCDD2]',
    badge: 'bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]',
    dot: 'bg-[#D32F2F]',
  },
  gray: {
    bg: 'bg-[#F5F5F3]',
    text: 'text-[#616161]',
    border: 'border-[#E0E0E0]',
    badge: 'bg-[#F5F5F3] text-[#616161] border border-[#E0E0E0]',
    dot: 'bg-[#9E9E9E]',
  },
};

// Status panen
export const PANEN_STATUS_COLOR: Record<string, string> = {
  'Selesai': LITE_COLOR.green.badge,
  'Tersimpan di Gudang': LITE_COLOR.blue.badge,
  'Dalam Proses': LITE_COLOR.amber.badge,
  'Siap Panen': LITE_COLOR.amber.badge,
};

// Status Olahan / QC
export const QC_STATUS_COLOR: Record<string, string> = {
  'Lolos QC': LITE_COLOR.green.badge,
  'Pending QC': LITE_COLOR.amber.badge,
  'Revisi Batch': LITE_COLOR.red.badge,
};

// Status Karung Gudang
export const KARUNG_STATUS_COLOR: Record<string, string> = {
  'Tersimpan': LITE_COLOR.green.badge,
  'Sebagian Diambil': LITE_COLOR.amber.badge,
  'Habis': LITE_COLOR.red.badge,
};

// ── Formatters ────────────────────────────────────────────────────────────────
export function formatTanggalId(iso: string | undefined | null): string {
  if (!iso) return '-';
  const s = String(iso).slice(0, 10);
  const parts = s.split('-');
  let d: Date;
  if (parts.length === 3) d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  else d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${d.getDate()} ${namaBulan[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTanggalSingkat(iso: string | undefined | null): string {
  if (!iso) return '-';
  const s = String(iso).slice(0, 10);
  const parts = s.split('-');
  let d: Date;
  if (parts.length === 3) d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  else d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${namaBulan[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatBerat(kg: number | undefined | null): string {
  const n = Number(kg) || 0;
  if (n >= 1000) {
    const ton = n / 1000;
    return `${ton % 1 === 0 ? ton : ton.toFixed(1)} Ton`;
  }
  return `${n.toLocaleString('id-ID')} Kg`;
}

export function formatAngka(n: number | undefined | null): string {
  return (Number(n) || 0).toLocaleString('id-ID');
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

// ── Shared CSS Tokens (Balanced Typography & Soft Cards) ──────────────────────
export const LITE_CSS = {
  // Container & Shell
  layoutBg: 'bg-[#FBF9F5]',
  contentWrapper: 'max-w-5xl mx-auto p-4 sm:p-6 lg:p-7 space-y-6 pb-28 lg:pb-10',

  // Headings (Ukuran font seimbang dan tidak terlalu besar)
  pageTitle: 'text-xl sm:text-2xl font-bold text-[#172C05] tracking-tight flex items-center gap-2.5',
  pageSubtitle: 'text-xs sm:text-sm text-[#6E7368] font-medium mt-0.5 leading-relaxed',
  sectionTitle: 'text-base sm:text-lg font-bold text-[#172C05] flex items-center gap-2',

  // Cards
  card: 'bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE7DF] shadow-[0_2px_12px_rgba(44,66,25,0.03)]',
  cardHover: 'bg-white rounded-2xl p-4 sm:p-5 border border-[#ECE7DF] shadow-[0_2px_12px_rgba(44,66,25,0.03)] hover:shadow-[0_6px_20px_rgba(44,66,25,0.06)] hover:border-[#D9D2C5] transition-all',

  // Buttons (Mudah disentuh, ukuran proporsional)
  btnPrimary: 'inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl bg-[#2C4219] hover:bg-[#1C2E10] text-white text-sm font-bold shadow-xs transition-all cursor-pointer select-none active:scale-[0.98]',
  btnSecondary: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F5EFE9] hover:bg-[#EAE2D8] text-[#2D3328] text-sm font-bold border border-[#E0D7CB] transition-all cursor-pointer select-none active:scale-[0.98]',
  btnDanger: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-xs transition-all cursor-pointer select-none active:scale-[0.98]',

  // Action Buttons (Detail, Edit, Hapus)
  actionDetail: 'flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer',
  actionEdit: 'flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer',
  actionDelete: 'inline-flex items-center justify-center p-2 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer',

  // Forms
  input: 'w-full p-3 bg-[#FFF8F2] border border-[#E4DDD2] focus:border-[#2C4219] rounded-xl text-sm text-[#172C05] placeholder-[#9E988F] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/20 transition-all font-medium',
  select: 'w-full p-3 bg-[#FFF8F2] border border-[#E4DDD2] focus:border-[#2C4219] rounded-xl text-sm text-[#172C05] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/20 transition-all font-medium',
  textarea: 'w-full p-3 bg-[#FFF8F2] border border-[#E4DDD2] focus:border-[#2C4219] rounded-xl text-sm text-[#172C05] placeholder-[#9E988F] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/20 transition-all font-medium resize-none',
  label: 'block text-sm font-bold text-[#172C05] mb-1.5',
  labelSub: 'block text-xs font-semibold text-[#6E7368] mb-1',

  // State
  emptyState: 'bg-white rounded-2xl border border-[#ECE7DF] p-8 sm:p-10 text-center shadow-xs',
  skeletonCard: 'bg-white rounded-2xl border border-[#ECE7DF] animate-pulse',
};
