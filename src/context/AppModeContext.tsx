import React, { createContext, useContext, useState, useCallback } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────────
export type AppMode = 'lite' | 'pro';

interface AppModeContextType {
  mode: AppMode;
  isLite: boolean;
  isPro: boolean;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

// ── Context ─────────────────────────────────────────────────────────────────────
const AppModeContext = createContext<AppModeContextType | null>(null);

const STORAGE_KEY = 'app_mode';

// ── Provider ─────────────────────────────────────────────────────────────────────
export const AppModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'pro') return 'pro';
    } catch {
      // abaikan jika localStorage tidak tersedia
    }
    // Default = lite (untuk user baru / setelah login pertama kali)
    return 'lite';
  });

  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // abaikan
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'lite' ? 'pro' : 'lite');
  }, [mode, setMode]);

  return (
    <AppModeContext.Provider
      value={{
        mode,
        isLite: mode === 'lite',
        isPro: mode === 'pro',
        setMode,
        toggleMode,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────────
export function useAppMode(): AppModeContextType {
  const ctx = useContext(AppModeContext);
  if (!ctx) {
    throw new Error('useAppMode harus dipakai di dalam <AppModeProvider>.');
  }
  return ctx;
}
