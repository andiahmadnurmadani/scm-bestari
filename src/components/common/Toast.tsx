import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

// ── Toast / Notifikasi Floating (muncul di pojok kanan atas, tanpa scroll) ──
interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number; // ms, default 3500
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3500 }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-[toastIn_0.25s_ease-out]">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md min-w-[260px] max-w-sm ${
          type === 'success'
            ? 'bg-emerald-50/95 border-emerald-200 text-emerald-700'
            : 'bg-red-50/95 border-red-200 text-red-700'
        }`}
      >
        {type === 'success' ? (
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
        ) : (
          <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500" />
        )}
        <span className="text-sm font-semibold flex-1">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="p-0.5 rounded hover:bg-black/5 transition-colors cursor-pointer shrink-0"
          title="Tutup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
