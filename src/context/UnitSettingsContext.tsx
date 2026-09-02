import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cmsApi } from '../api/endpoints/cmsApi';

// ── Types ──────────────────────────────────────────────────────────────────────

export type BeratUnit = 'ton' | 'kg' | 'kuintal' | 'gram';
export type LuasUnit = 'hektar' | 'm2' | 'are' | 'km2';

export interface UnitSettings {
  berat: BeratUnit;
  luas: LuasUnit;
}

export const DEFAULT_UNITS: UnitSettings = {
  berat: 'ton',
  luas: 'hektar',
};

// Faktor konversi ke satuan dasar (kg untuk berat, hektar untuk luas)
export const BERAT_KE_KG: Record<BeratUnit, number> = {
  ton: 1000,
  kuintal: 100,
  kg: 1,
  gram: 0.001,
};

export const LUAS_KE_HEKTAR: Record<LuasUnit, number> = {
  hektar: 1,
  m2: 0.0001, // 1 m² = 0.0001 ha
  are: 0.01,   // 1 are = 100 m² = 0.01 ha
  km2: 100,    // 1 km² = 100 ha
};

export const BERAT_LABEL: Record<BeratUnit, string> = {
  ton: 'Ton',
  kg: 'Kg',
  kuintal: 'Kuintal',
  gram: 'Gram',
};

export const LUAS_LABEL: Record<LuasUnit, string> = {
  hektar: 'Hektar',
  m2: 'm²',
  are: 'Are',
  km2: 'Km²',
};

const STORAGE_KEY = 'unit_settings';

// ── Helper konversi ────────────────────────────────────────────────────────────

function roundFriendly(n: number): number {
  if (!isFinite(n)) return 0;
  // Jika bilangan bulat, kembalikan apa adanya; jika desimal, bulatkan 2 angka.
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  const r = roundFriendly(n);
  return Number.isInteger(r)
    ? r.toLocaleString('id-ID')
    : r.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

// Konversi nilai berat (dasar: kg) ke satuan tampilan + label
export function formatBerat(kg: number, unit: BeratUnit = 'ton'): string {
  const val = (Number(kg) || 0) / BERAT_KE_KG[unit];
  return `${fmt(val)} ${BERAT_LABEL[unit]}`;
}

// Konversi nilai luas (dasar: hektar) ke satuan tampilan + label
export function formatLuas(hektar: number, unit: LuasUnit = 'hektar'): string {
  const val = (Number(hektar) || 0) / LUAS_KE_HEKTAR[unit];
  return `${fmt(val)} ${LUAS_LABEL[unit]}`;
}

// Ubah angka input (dalam satuan tampilan) → satuan dasar (kg / hektar)
export function beratKeKg(angka: number | string, unit: BeratUnit = 'ton'): number {
  const n = Number(angka) || 0;
  return n * BERAT_KE_KG[unit];
}

export function luasKeHektar(angka: number | string, unit: LuasUnit = 'hektar'): number {
  const n = Number(angka) || 0;
  return n * LUAS_KE_HEKTAR[unit];
}

// Ubah nilai dasar → satuan tampilan (untuk isi form saat edit)
export function kgKeUnit(kg: number, unit: BeratUnit = 'ton'): number {
  return (Number(kg) || 0) / BERAT_KE_KG[unit];
}

export function hektarKeUnit(hektar: number, unit: LuasUnit = 'hektar'): number {
  return (Number(hektar) || 0) / LUAS_KE_HEKTAR[unit];
}

// ── Context ────────────────────────────────────────────────────────────────────

interface UnitSettingsContextType {
  units: UnitSettings;
  setUnits: (u: UnitSettings) => void;
  saveUnits: (u: UnitSettings) => Promise<void>;
  loading: boolean;
  // shortcut helpers
  beratSuffix: string;
  luasSuffix: string;
  formatBerat: (kg: number) => string;
  formatLuas: (ha: number) => string;
  beratKeKg: (angka: number | string) => number;
  luasKeHektar: (angka: number | string) => number;
  kgKeUnit: (kg: number) => number;
  hektarKeUnit: (ha: number) => number;
}

const UnitSettingsContext = createContext<UnitSettingsContextType | null>(null);

export const UnitSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [units, setUnits] = useState<UnitSettings>(DEFAULT_UNITS);
  const [loading, setLoading] = useState(true);

  // Load dari localStorage (cepat) lalu backend (sumber kebenaran)
  useEffect(() => {
    let mounted = true;

    // 1) cache lokal
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.berat && parsed.luas) {
          setUnits({ berat: parsed.berat, luas: parsed.luas });
        }
      }
    } catch {
      // abaikan
    }

    // 2) backend cms_settings key 'app_units'
    (async () => {
      try {
        const res: any = await cmsApi.getSetting('app_units');
        const data = res?.data || null;
        if (mounted && data && data.berat && data.luas) {
          setUnits({ berat: data.berat, luas: data.luas });
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } catch { /* abaikan */ }
        }
      } catch {
        // offline → pakai localStorage/default
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const saveUnits = useCallback(async (u: UnitSettings) => {
    setUnits(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch { /* abaikan */ }
    try {
      await cmsApi.saveSetting('app_units', u);
    } catch { /* backend offline — tetap simpan lokal */ }
  }, []);

  const value: UnitSettingsContextType = {
    units,
    setUnits,
    saveUnits,
    loading,
    beratSuffix: BERAT_LABEL[units.berat],
    luasSuffix: LUAS_LABEL[units.luas],
    formatBerat: (kg) => formatBerat(kg, units.berat),
    formatLuas: (ha) => formatLuas(ha, units.luas),
    beratKeKg: (angka) => beratKeKg(angka, units.berat),
    luasKeHektar: (angka) => luasKeHektar(angka, units.luas),
    kgKeUnit: (kg) => kgKeUnit(kg, units.berat),
    hektarKeUnit: (ha) => hektarKeUnit(ha, units.luas),
  };

  return <UnitSettingsContext.Provider value={value}>{children}</UnitSettingsContext.Provider>;
};

export function useUnitSettings(): UnitSettingsContextType {
  const ctx = useContext(UnitSettingsContext);
  if (!ctx) {
    throw new Error('useUnitSettings harus dipakai di dalam <UnitSettingsProvider>.');
  }
  return ctx;
}
