import React, { useRef, useState } from 'react';
import { Upload, X, Pencil } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_MB = 2;

interface LiteImageUploadProps {
  /** id unik input file (dipakai tombol "Ganti"). */
  id: string;
  /** Label field. */
  label: string;
  /** Nilai gambar saat ini: base64 data URL atau null. */
  value: string | null;
  /** Dipanggil saat gambar dipilih/dihapus — kirim data URL atau null. */
  onChange: (dataUrl: string | null) => void;
  /** Pesan error di luar (dari validasi lain). */
  error?: string | null;
}

/**
 * Komponen upload gambar untuk Mode Mudah.
 * Validasi tipe (JPG/PNG/WebP) & ukuran (maks 2 MB), konversi ke base64 data URL.
 */
export const LiteImageUpload: React.FC<LiteImageUploadProps> = ({ id, label, value, onChange, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const file = e.target.files?.[0];
    e.target.value = ''; // reset agar bisa pilih file yang sama lagi
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError('Format tidak didukung! Gunakan JPG, PNG, atau WebP.');
      return;
    }
    const maxBytes = MAX_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setLocalError(`Ukuran terlalu besar! Maksimal ${MAX_MB} MB (file Anda ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const showError = localError || error;

  return (
    <div>
      <label className="block text-xs font-bold text-[#2C4219] mb-1">{label}</label>
      {value ? (
        <div className="relative p-3 bg-[#FFF8F4] border border-[#c4c8bb]/40 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={value} alt={label} className="w-12 h-12 object-cover rounded-lg border border-[#c4c8bb]/40 shrink-0" referrerPolicy="no-referrer" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#221A12] truncate">Foto tersimpan</p>
              <p className="text-[10px] text-[#74796d] font-semibold">JPG/PNG/WebP · maks. {MAX_MB} MB</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2C4219] text-white text-[11px] font-bold hover:bg-[#213213] transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" /> Ganti
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold hover:bg-red-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#c4c8bb]/50 hover:border-[#2C4219] bg-[#fff1e5]/60 hover:bg-[#FFF8F4] rounded-2xl cursor-pointer transition-all text-center"
        >
          <div className="w-9 h-9 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center mb-2">
            <Upload className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-[#2C4219]">Klik untuk unggah foto</span>
          <span className="text-[10px] text-[#74796d] font-semibold mt-0.5">.JPG, .PNG, .WebP (Maks. {MAX_MB} MB)</span>
        </label>
      )}
      <input id={id} ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFile} className="hidden" />
      {showError && <p className="text-xs font-bold text-red-600 mt-1.5">{showError}</p>}
    </div>
  );
};
