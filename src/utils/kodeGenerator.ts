/**
 * Membuat kode unik berikutnya dari daftar item yang sudah dimuat.
 * Menghindari duplikat saat data dihapus (length+1 tidak aman).
 * Memakai MAX(id numeric) + 1, lalu menaikkan sampai tidak bertabrakan
 * dengan kode yang sudah ada di daftar.
 */
export function nextCode(
  prefix: string,
  items: { id?: string; [key: string]: any }[],
  digits = 3
): string {
  let seq = items.reduce((max, it) => Math.max(max, Number(it.id) || 0), 0) + 1;
  let code = `${prefix}${String(seq).padStart(digits, '0')}`;

  // Pastikan unik terhadap kode yang tampil (fallback saat id tidak berurutan)
  const used = new Set<string>();
  items.forEach((it) => {
    const key = Object.keys(it).find((k) => k.toLowerCase().includes('kode'));
    if (key && typeof it[key] === 'string') used.add(it[key]);
  });
  while (used.has(code)) {
    seq += 1;
    code = `${prefix}${String(seq).padStart(digits, '0')}`;
  }
  return code;
}

/** Membuat kode berbasis timestamp (aman untuk kasus non-sekuensial). */
export function timestampCode(prefix: string, digits = 4): string {
  return `${prefix}${String(Date.now()).slice(-digits)}`;
}
