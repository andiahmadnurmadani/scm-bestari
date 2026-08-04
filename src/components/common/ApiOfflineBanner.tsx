import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Server, CheckCircle2 } from 'lucide-react';
import { notificationsApi } from '../../api/endpoints/notificationsApi';

interface Props {
  onRetry?: () => Promise<void>;
}

/**
 * Popup global saat frontend tidak dapat terhubung ke backend API.
 * Mendengarkan event `api:offline` / `api:online` yang dipancarkan
 * axiosClient. Menyediakan tombol "Coba Lagi" untuk ping backend.
 */
export const ApiOfflineBanner: React.FC<Props> = ({ onRetry }) => {
  const [offline, setOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const [justOnline, setJustOnline] = useState(false);

  useEffect(() => {
    const off = () => setOffline(true);
    const on = () => {
      setOffline(false);
      setJustOnline(true);
      setTimeout(() => setJustOnline(false), 3500);
    };
    window.addEventListener('api:offline', off);
    window.addEventListener('api:online', on);
    return () => {
      window.removeEventListener('api:offline', off);
      window.removeEventListener('api:online', on);
    };
  }, []);

  // Cek koneksi dengan ping ringan ke backend.
  const checkConnection = async () => {
    setChecking(true);
    try {
      await notificationsApi.getAll();
      window.dispatchEvent(new Event('api:online'));
    } catch {
      setOffline(true);
    } finally {
      setChecking(false);
      if (onRetry) await onRetry();
    }
  };

  if (justOnline) {
    return (
      <div className="fixed bottom-5 right-5 z-[100] bg-[#2C4219] text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-2.5 text-sm font-semibold border border-[#C3E28D]/40">
        <CheckCircle2 className="w-4 h-4 text-[#C3E28D]" />
        Koneksi ke server berhasil dipulihkan
      </div>
    );
  }

  if (!offline) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl border border-[#c4c8bb]/30 overflow-hidden">
        <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#221A12]">Koneksi Terputus</h3>
            <p className="text-[11px] text-[#74796d] font-medium">
              Tidak dapat terhubung ke server backend
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#44483e]">
            <Server className="w-3.5 h-3.5 text-[#6B7280]" />
            <span>
              Data tidak dapat dimuat dari <strong>API server</strong>. Periksa apakah backend
              sedang berjalan, lalu coba lagi.
            </span>
          </div>

          <button
            onClick={checkConnection}
            disabled={checking}
            className="w-full py-2.5 rounded-xl bg-[#2C4219] text-white text-xs font-bold hover:bg-[#213213] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Menghubungkan...' : 'Coba Hubungkan Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
};
