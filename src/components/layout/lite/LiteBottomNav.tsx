import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Sprout,
  Tractor,
  Soup,
  Layers,
  Package,
  MoreHorizontal,
  X,
  LogOut,
  HelpCircle,
  User,
  BookOpen,
  Headphones,
  Sun,
  Moon,
} from 'lucide-react';
import { authApi } from '../../../api/endpoints/authApi';
import { Modal } from '../../common/Modal';
import { useTheme } from '../../../context/ThemeContext';

const mainMobileNav = [
  { label: 'Dashboard', path: '/lite', icon: LayoutGrid, end: true },
  { label: 'Panen', path: '/lite/panen', icon: Sprout, end: false },
  { label: 'Lahan', path: '/lite/lahan', icon: Tractor, end: false },
  { label: 'Gudang', path: '/lite/gudang', icon: Package, end: false },
];

const extraMobileNav = [
  { label: 'Olahan', path: '/lite/produksi', icon: Soup, desc: 'Produksi beras & tepung' },
  { label: 'Varietas', path: '/lite/varietas', icon: Layers, desc: 'Katalog benih sorgum' },
  { label: 'Profil Saya', path: '/lite/profil', icon: User, desc: 'Pengaturan akun' },
];

export const LiteBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    setConfirmLogoutOpen(false);
    navigate('/login');
  };

  return (
    <>
      {/* ── Botanical Green Floating Bottom Nav Bar (Exact Same Color as Sidebar) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#43622E] text-white rounded-t-[26px] shadow-[0_-4px_24px_rgba(30,48,18,0.25)] px-3 py-2 safe-area-inset-bottom select-none">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mainMobileNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center text-center py-1.5 px-2.5 rounded-[18px] transition-all duration-200 min-w-[56px] ${
                    isActive
                      ? 'bg-[#67A70C] text-white shadow-md font-bold scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/10 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    <span className="text-[11px] leading-tight tracking-tight">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Tombol Lainnya */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center justify-center text-center py-1.5 px-2.5 rounded-[18px] text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer min-w-[56px]"
          >
            <MoreHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight tracking-tight font-medium">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* ── Sheet Menu Tambahan (Mobile) ─────────────────────────────────── */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative bg-[#FCFAF6] dark:bg-[#182126] border-t border-[#ECE7DF] dark:border-[#2E3A42] rounded-t-[28px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 safe-area-inset-bottom max-h-[85vh] flex flex-col">
            {/* Sheet Header — Botanical Green */}
            <div className="bg-[#43622E] dark:bg-[#161B1E] text-white p-4.5 px-5 flex items-center justify-between border-b dark:border-[#2E3A42]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 dark:bg-[#242D34] flex items-center justify-center text-[#C3E28D]">
                  <Sprout className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Menu Lainnya</h3>
                  <p className="text-[11px] text-[#C3E28D] dark:text-[#A3E635]">Sorgum SCM — Mode Mudah</p>
                </div>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 dark:bg-[#242D34] hover:bg-white/25 dark:hover:bg-[#2A343B] text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Sheet Body Links */}
            <div className="p-4 space-y-2.5 overflow-y-auto">
              {extraMobileNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSheetOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 p-3 rounded-2xl transition-all border ${
                        isActive
                          ? 'bg-[#EBF7EE] dark:bg-[#65A60B] border-[#C8E6C9] dark:border-[#65A60B] text-[#172C05] dark:text-white font-bold shadow-xs'
                          : 'bg-white dark:bg-[#242D34] border-[#ECE7DF] dark:border-[#33414B] text-[#2D3328] dark:text-white hover:bg-[#F4EFEB] dark:hover:bg-[#2A343B]'
                      }`
                    }
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#43622E] dark:bg-[#1A2126] text-[#C3E28D] dark:text-[#A3E635] flex items-center justify-center shrink-0 shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#172C05] dark:text-white leading-tight">{item.label}</p>
                      <p className="text-xs text-[#70766B] dark:text-[#94A3B8] mt-0.5 truncate">{item.desc}</p>
                    </div>
                  </NavLink>
                );
              })}

              {/* Theme Mode Toggle Button */}
              <button
                onClick={() => {
                  toggleTheme();
                  setSheetOpen(false);
                }}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-[#242D34] border border-[#ECE7DF] dark:border-[#33414B] text-[#2D3328] dark:text-white hover:bg-[#F4EFEB] dark:hover:bg-[#2A343B] transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-[#1A2126] text-indigo-800 dark:text-[#A3E635] flex items-center justify-center shrink-0">
                  {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#172C05] dark:text-white leading-tight">
                    {isDark ? 'Mode Terang (Light Mode)' : 'Mode Malam (Night Mode)'}
                  </p>
                  <p className="text-xs text-[#70766B] dark:text-[#94A3B8] mt-0.5">
                    {isDark ? 'Ubah tampilan menjadi terang' : 'Ubah ke tampilan gelap malam'}
                  </p>
                </div>
              </button>

              {/* Bantuan Button */}
              <button
                onClick={() => {
                  setSheetOpen(false);
                  setHelpOpen(true);
                }}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-[#242D34] border border-[#ECE7DF] dark:border-[#33414B] text-[#2D3328] dark:text-white hover:bg-[#F4EFEB] dark:hover:bg-[#2A343B] transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-[#1A2126] text-amber-800 dark:text-[#A3E635] flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#172C05] dark:text-white leading-tight">Pusat Bantuan</p>
                  <p className="text-xs text-[#70766B] dark:text-[#94A3B8] mt-0.5">Panduan & kontak WhatsApp</p>
                </div>
              </button>

              {/* Actions: Logout */}
              <div className="pt-2 border-t border-[#ECE7DF] space-y-2">
                <button
                  onClick={() => {
                    setSheetOpen(false);
                    setConfirmLogoutOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Bantuan ──────────────────────────────────────────────── */}
      <Modal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Pusat Bantuan"
        subtitle="Panduan Ringkas Sorgum SCM"
        maxWidth="lg"
      >
        <div className="space-y-4 text-sm text-[#44483e] max-h-[65vh] overflow-y-auto pr-1">
          <div className="p-4 bg-[#EBF7EE] rounded-2xl border border-[#C8E6C9]">
            <h4 className="font-bold text-[#1B5E20] text-sm mb-0.5">👋 Panduan Penggunaan Mode Mudah</h4>
            <p className="text-xs text-[#2E7D32] leading-relaxed">
              Gunakan menu di bagian bawah layar untuk mengelola rantai pasok sorgum Anda.
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="font-bold text-[#172C05] flex items-center gap-1.5 text-xs">
              <BookOpen className="w-4 h-4 text-[#2C4219]" /> Panduan Menu:
            </p>

            {[
              { judul: '🌾 Panen', langkah: 'Catat hasil panen sorgum harian/musiman per lahan.' },
              { judul: '🚜 Lahan', langkah: 'Lihat daftar blok lahan dan lakukan pencatatan penanaman.' },
              { judul: '🥣 Olahan', langkah: 'Catat produksi beras dan tepung sorgum dari hasil panen.' },
              { judul: '🌾 Varietas', langkah: 'Daftar benih sorgum unggulan beserta estimasi hari panen.' },
              { judul: '📦 Gudang', langkah: 'Kelola stok karung dan ambil panen berdasarkan tanggal tertua (FIFO).' },
            ].map((item) => (
              <div key={item.judul} className="bg-white rounded-xl border border-[#ECE7DF] p-3 shadow-2xs">
                <p className="font-bold text-[#172C05] text-xs">{item.judul}</p>
                <p className="text-[11px] text-[#6E7368] mt-0.5">{item.langkah}</p>
              </div>
            ))}
          </div>

          <div className="p-3.5 bg-[#2C4219] text-white rounded-xl shadow-xs">
            <p className="font-bold text-[#C3E28D] flex items-center gap-1.5 text-xs">
              <Headphones className="w-3.5 h-3.5" /> Bantuan WhatsApp:
            </p>
            <p className="text-xs text-[#efe0d2] mt-0.5">
              Hubungi pendamping di <b>0812-3456-7890</b>
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Modal Logout ───────────────────────────────────────────────── */}
      <Modal
        isOpen={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        title="Yakin Ingin Keluar?"
        subtitle="Sorgum SCM"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#44483e] leading-relaxed">
            Apakah Anda yakin ingin keluar dari akun ini? Data yang sudah disimpan tetap aman.
          </p>
          <div className="flex gap-3 pt-2 border-t border-[#ECE7DF]">
            <button
              onClick={() => setConfirmLogoutOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#44483e] bg-[#F4EFEB] hover:bg-[#EAE4DC] border border-[#E0D7CB] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Ya, Keluar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
