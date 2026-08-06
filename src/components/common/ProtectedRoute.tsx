import React from 'react';
import { Navigate } from 'react-router-dom';

/** Decode payload JWT (tanpa verifikasi) untuk cek masa berlaku. */
function decodeJwt(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4 !== 0) payload += '=';
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/** True jika token ada, format valid, dan belum kedaluwarsa. */
export function isTokenValid(): boolean {
  const token = localStorage.getItem('token');
  if (!token) return false;

  const decoded = decodeJwt(token);
  if (!decoded || typeof decoded.exp !== 'number') return false;

  // exp dalam detik (Unix). Kedaluwarsa jika exp * 1000 <= now.
  return decoded.exp * 1000 > Date.now();
}

/**
 * Guard untuk halaman admin. Hanya render children jika token valid;
 * jika tidak, bersihkan storage & redirect ke /login.
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isTokenValid()) {
    // Hapus token/user yang tidak valid/kedaluwarsa biar tidak tersisa
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
