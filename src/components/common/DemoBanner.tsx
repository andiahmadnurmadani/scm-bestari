import React from 'react';
import { useLocation } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';

/**
 * Penanda situs DEMO (scm1). Aktif hanya bila build memakai VITE_DEMO_MODE=true,
 * agar pengguna tidak salah mengisi data asli di situs demo.
 */
export const isDemoMode = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

export const DemoBanner: React.FC = () => {
  const { pathname } = useLocation();
  if (!isDemoMode) return null;

  // Halaman QR untuk pembeli: strip tipis di atas agar tidak menutupi cerita produk
  if (pathname.startsWith('/kemasan/') || pathname.startsWith('/trace/')) {
    return (
      <div className="fixed top-0 inset-x-0 z-[60] pointer-events-none bg-amber-100/95 text-amber-900 text-xs font-semibold text-center py-1">
        Mode Demo — data contoh, bukan data asli
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 sm:bottom-4 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-sm font-semibold shadow-md">
        <FlaskConical className="w-4 h-4 shrink-0" />
        Mode Demo — data contoh, bukan data asli
      </div>
    </div>
  );
};
