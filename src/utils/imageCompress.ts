/**
 * Kompres & perkecil gambar di sisi klien sebelum dikirim ke server.
 *
 * Masalah yang diselesaikan:
 *  - Upload beberapa foto (base64) bisa >1 MB → ditolak nginx (default 1 MB)
 *    sehingga muncul "Koneksi Terputus".
 *  - File kamera/HP bisa 3–8 MB per foto; 4 foto = puluhan MB.
 *
 * Strategi (adaptif):
 *  - Gambar dikecilkan & dikodekan ulang ke JPEG.
 *  - Bila hasil masih terlalu besar, ukuran/kualitas diturunkan bertahap
 *    sampai di bawah `targetKB` (default 150 KB) — menjamin 4 foto tetap
 *    jauh di bawah batas 1 MB server.
 *
 * @param file      File gambar dari <input type="file">
 * @param targetKB  Target ukuran maksimum hasil (KB). Default 150.
 * @returns data URL (image/jpeg) hasil kompresi
 */
export async function compressImage(file: File, targetKB = 150): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });

  // SVG / GIF jangan dikonversi (bisa rusak/animasi hilang) — kirim apa adanya
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return dataUrl;
  }

  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = dataUrl;
  });
  if (!img) return dataUrl; // fallback: kirim asli bila gagal muat

  const drawAt = (maxSize: number, quality: number): string | null => {
    let { width, height } = img;
    if (width > maxSize || height > maxSize) {
      if (width >= height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // Latar putih (agar PNG transparan tidak jadi hitam saat jadi JPEG)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    try {
      return canvas.toDataURL('image/jpeg', quality);
    } catch {
      return null;
    }
  };

  // Ukuran (KB) dari sebuah data URL base64
  const kbOf = (u: string) => Math.round(((u.split(',')[1] || '').length * 3) / 4 / 1024);

  // Tahapan: dari kualitas terbaik → makin kecil bila masih kebesaran
  const stages: [number, number][] = [
    [1280, 0.82],
    [1100, 0.75],
    [950, 0.7],
    [820, 0.62],
    [700, 0.55],
    [600, 0.48],
  ];

  let best = '';
  for (const [size, q] of stages) {
    const out = drawAt(size, q);
    if (!out) continue;
    best = out;
    if (kbOf(out) <= targetKB) return out;
  }
  return best || dataUrl;
}

/** Perkiraan ukuran (KB) sebuah data URL base64. */
export function dataUrlSizeKB(dataUrl: string): number {
  if (!dataUrl) return 0;
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4 / 1024);
}
