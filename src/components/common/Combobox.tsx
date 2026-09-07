import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

// ── Combobox / Dropdown yang Bisa Dicari (Searchable Select) ──────────────────
// Menggantikan <select> biasa agar user bisa mengetik untuk memfilter opsi.
// Cocok untuk daftar panjang (pilih panen, pilih batch stok, dll).

export interface ComboboxOption {
  value: string;
  label: string;
  searchText?: string; // teks tambahan untuk pencarian (mis. nama lahan)
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  required?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  emptyText = 'Tidak ada pilihan.',
  disabled = false,
  required = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => options.find((o) => o.value === value) || null, [options, value]);

  // Filter opsi berdasarkan query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.label} ${o.searchText || ''}`.toLowerCase().includes(q)
    );
  }, [options, query]);

  // Tutup saat klik di luar komponen
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Fokus ke input pencarian saat dibuka
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const pick = (opt: ComboboxOption) => {
    onChange(opt.value);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      {/* Tombol tampilan pilihan saat ini */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm text-left transition-colors ${
          open ? 'border-[#2C4219]/50 ring-2 ring-[#2C4219]/10' : ''
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#2C4219]/40 cursor-pointer'}`}
      >
        <span className={`truncate ${selected ? 'text-[#172C05] font-semibold' : 'text-[#9CA3AF]'}`}>
          {selected ? selected.label : placeholder}
        </span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setOpen(true);
            }}
            className="shrink-0 p-0.5 rounded-full hover:bg-[#2C4219]/10 text-[#6B7280] cursor-pointer"
            title="Hapus pilihan"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : (
          <ChevronDown
            className={`w-4 h-4 shrink-0 text-[#6B7280] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Panel dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-[#c4c8bb]/30 rounded-xl shadow-lg overflow-hidden">
          {/* Input pencarian */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#c4c8bb]/20 bg-[#F7F7F5]">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#9CA3AF] text-[#172C05]"
            />
          </div>

          {/* Daftar opsi */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-[#9CA3AF]">{emptyText}</p>
            ) : (
              filtered.map((o) => {
                const isActive = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => pick(o)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#2C4219]/10 text-[#2C4219] font-semibold'
                        : 'text-[#221A12] hover:bg-[#F7F7F5]'
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0 text-[#2C4219]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
