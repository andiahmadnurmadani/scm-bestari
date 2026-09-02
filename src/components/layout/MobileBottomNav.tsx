import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Tractor,
  Factory,
  Wrench,
  Award,
  Package,
  Truck,
  Database,
  LayoutGrid,
  X,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  BookOpen,
  Layers,
  Sun,
  Moon,
} from 'lucide-react';
import { authApi } from '../../api/endpoints/authApi';
import { Modal } from '../common/Modal';
import { useAppMode } from '../../context/AppModeContext';
import { useTheme } from '../../context/ThemeContext';

// ── Primary: tampil langsung di bar (4 item) ────────────────────────────────
const primaryNav = [
  { label: 'Dasbor', shortLabel: 'Dasbor', path: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Panen', shortLabel: 'Panen', path: '/dashboard/panen', icon: Sprout },
  { label: 'Lahan', shortLabel: 'Lahan', path: '/dashboard/lahan', icon: Tractor },
  { label: 'Olahan', shortLabel: 'Olahan', path: '/dashboard/produksi', icon: Factory },
] as const;

// ── Secondary: masuk sheet "Lainnya" ────────────────────────────────────────
const secondaryNav = [
  { label: 'Peralatan', sub: 'Sarana & Alat', path: '/dashboard/peralatan', icon: Wrench, desc: 'Stok & kondisi alat' },
  { label: 'Sertifikat', sub: 'Legalitas', path: '/dashboard/sertifikat', icon: Award, desc: 'Halal, P-IRT, Lab' },
  { label: 'Kemasan', sub: 'Stok Kemasan', path: '/dashboard/kemasan', icon: Package, desc: 'Pouch, Box, Botol' },
  { label: 'Logistik', sub: 'Keuangan', path: '/dashboard/logistik', icon: Truck, desc: 'Nota & pengeluaran' },
  { label: 'Varietas', sub: 'Master Data', path: '/dashboard/master/varietas', icon: Database, desc: 'Benih sorgum' },
] as const;

const utilityNav = [
  { label: 'Profil Saya', path: '/dashboard/profil', icon: User },
  { label: 'Konten Web', path: '/dashboard/cms', icon: Settings },
] as const;

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setMode } = useAppMode();
  const { isDark, toggleTheme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Kunci scroll body saat sheet terbuka
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sheetOpen]);

  // Tutup sheet otomatis saat pindah halaman
  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  const isSecondaryActive = secondaryNav.some(
    (item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );
  const isUtilityActive = utilityNav.some((item) => location.pathname === item.path);

  const isLainnyaActive = isSecondaryActive || isUtilityActive;

  const handleLogout = async () => {
    await authApi.logout();
    setConfirmLogoutOpen(false);
    setSheetOpen(false);
    navigate('/login');
  };

  const handleSwitchToLite = () => {
    setSheetOpen(false);
    setMode('lite');
    navigate('/lite');
  };

  return (
    <>
      {/* ── Bottom Navigation Bar — Glassmorphism Floating Pill ─────────────── */}
      <nav
        aria-label="Navigasi bawah"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      >
        {/* Wrapper pill glass */}
        <div
          className="pointer-events-auto mx-auto max-w-[440px] flex items-center justify-between gap-1 px-2 py-2 rounded-[26px] border border-white/60 shadow-[0_8px_32px_rgba(44,66,25,0.16),0_2px_12px_rgba(44,66,25,0.10),inset_0_1px_0_rgba(255,255,255,0.8)]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,248,244,0.88) 50%, rgba(255,255,255,0.84) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          {/* Primary items */}
          {primaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={(item as any).end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-2 px-0.5 rounded-[18px] transition-all duration-200 ${
                    isActive
                      ? 'bg-[#2C4219] text-white shadow-[0_4px_16px_rgba(44,66,25,0.30),inset_0_1px_0_rgba(255,255,255,0.15)] scale-[0.98]'
                      : 'text-[#5a6652] hover:text-[#2C4219] hover:bg-white/60 active:scale-95'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`relative flex items-center justify-center w-7 h-7 rounded-xl transition-all duration-200 ${
                        isActive ? 'bg-white/15' : 'bg-transparent'
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] transition-all ${isActive ? 'text-white' : 'text-[#2C4219]'}`}
                        strokeWidth={isActive ? 2.2 : 1.9}
                      />
                      {isActive && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#C3E28D] rounded-full ring-2 ring-[#2C4219] animate-pulse" />
                      )}
                    </span>
                    <span
                      className={`text-[10px] leading-none tracking-wide whitespace-nowrap ${
                        isActive ? 'font-bold text-white' : 'font-semibold text-[#44483e]'
                      }`}
                    >
                      {item.shortLabel}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Divider subtle */}
          <div className="w-px h-9 bg-[#c4c8bb]/25 mx-0.5 shrink-0" />

          {/* Lainnya button */}
          <button
            onClick={() => setSheetOpen((v) => !v)}
            aria-expanded={sheetOpen}
            aria-controls="mobile-lainnya-sheet"
            className={`relative flex flex-col items-center justify-center gap-1 min-w-0 flex-1 py-2 px-0.5 rounded-[18px] transition-all duration-200 cursor-pointer active:scale-95 ${
              sheetOpen || isLainnyaActive
                ? 'bg-[#2C4219] text-white shadow-[0_4px_16px_rgba(44,66,25,0.28)]'
                : 'text-[#5a6652] hover:text-[#2C4219] hover:bg-white/60 bg-white/40 border border-white/30'
            }`}
          >
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-xl transition-all ${
                sheetOpen || isLainnyaActive ? 'bg-white/15' : 'bg-[#C3E28D]/30'
              }`}
            >
              {sheetOpen ? (
                <X className="w-[18px] h-[18px] text-white" strokeWidth={2.2} />
              ) : (
                <LayoutGrid
                  className={`w-[18px] h-[18px] ${isLainnyaActive ? 'text-white' : 'text-[#2C4219]'}`}
                  strokeWidth={1.9}
                />
              )}
            </span>
            <span
              className={`text-[10px] leading-none tracking-wide whitespace-nowrap ${
                sheetOpen || isLainnyaActive ? 'font-bold text-white' : 'font-semibold text-[#44483e]'
              }`}
            >
              Lainnya
            </span>
            {isLainnyaActive && !sheetOpen && (
              <span className="absolute top-1.5 right-3 w-1.5 h-1.5 bg-[#C3E28D] rounded-full ring-2 ring-white" />
            )}
          </button>
        </div>

        {/* Home indicator hint (iOS style) — subtle */}
        <div className="pointer-events-none mx-auto mt-2 w-32 h-1 rounded-full bg-[#2C4219]/10 hidden sm:block" />
      </nav>

      {/* ── Overlay backdrop ─────────────────────────────────────────────── */}
      {sheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-[#221A12]/20 backdrop-blur-[2px] transition-opacity duration-200"
          onClick={() => setSheetOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Bottom Sheet — Glassmorphism & High-Contrast Dark ─────────────── */}
      <div
        id="mobile-lainnya-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu lainnya"
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[78vh] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          sheetOpen ? 'translate-y-0' : 'translate-y-[110%]'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Sheet card */}
        <div
          className="mx-auto w-full max-w-[640px] flex flex-col rounded-t-[28px] border-t border-[#ECE7DF] dark:border-[#2E3A42] bg-[#FFF9F5] dark:bg-[#182126] shadow-[0_-12px_40px_rgba(0,0,0,0.25)] overflow-hidden max-h-[78vh]"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-10 h-1.5 rounded-full bg-[#c4c8bb]/60 dark:bg-[#3E4B56]" />
          </div>

          {/* Sheet header */}
          <div className="px-5 pb-4 flex items-start justify-between gap-3 shrink-0 border-b border-[#c4c8bb]/20 dark:border-[#2E3A42]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2C4219] to-[#3d5a25] flex items-center justify-center shadow-md shrink-0">
                <Sparkles className="w-5 h-5 text-[#C3E28D]" />
              </div>
              <div>
                <h2 className="text-[15px] font-extrabold text-[#172C05] dark:text-white leading-none">Menu Lainnya</h2>
                <p className="text-[11px] font-medium text-[#6B7280] dark:text-[#94A3B8] mt-1">Akses cepat semua fitur Sorgum SCM</p>
              </div>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              className="w-9 h-9 rounded-full bg-[#F7F7F5] dark:bg-[#242D34] hover:bg-[#efe0d2] dark:hover:bg-[#2A343B] border border-[#c4c8bb]/20 dark:border-[#33414B] flex items-center justify-center text-[#44483e] dark:text-white transition-colors shrink-0 cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto custom-scrollbar flex-1 px-4 sm:px-5 py-4 space-y-5">
            {/* Secondary grid */}
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] dark:text-[#A3E635] mb-3 px-1">
                Kelola Data Utama
              </p>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {secondaryNav.map((item) => {
                  const Icon = item.icon;
                  const active =
                    location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSheetOpen(false)}
                      className={`group relative flex flex-col items-center gap-2 p-3.5 sm:p-4 rounded-2xl border text-center transition-all duration-200 active:scale-[0.97] ${
                        active
                          ? 'bg-[#2C4219] dark:bg-[#65A60B] border-[#2C4219] dark:border-[#65A60B] text-white shadow-md'
                          : 'bg-white dark:bg-[#242D34] border-[#c4c8bb]/30 dark:border-[#33414B] hover:border-[#2C4219]/30 hover:bg-[#fff8f4] dark:hover:bg-[#2A343B] text-[#221A12] dark:text-white'
                      }`}
                    >
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                          active
                            ? 'bg-white/15 text-white'
                            : 'bg-[#F7F7F5] dark:bg-[#1A2126] group-hover:bg-[#C3E28D]/20 text-[#2C4219] dark:text-[#A3E635]'
                        }`}
                      >
                        <Icon className="w-6 h-6" strokeWidth={active ? 2 : 1.8} />
                      </span>
                      <span className={`text-xs font-bold leading-tight ${active ? 'text-white' : 'text-[#172C05] dark:text-white'}`}>
                        {item.label}
                      </span>
                      <span className={`text-[10px] leading-tight ${active ? 'text-white/70' : 'text-[#9CA3AF] dark:text-[#94A3B8]'}`}>
                        {item.sub}
                      </span>
                      {active && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-[#C3E28D] rounded-full ring-2 ring-[#2C4219]" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Utility section */}
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] dark:text-[#A3E635] mb-3 px-1">
                Akun & Pengaturan
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {utilityNav.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setSheetOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                        active
                          ? 'bg-[#2C4219] dark:bg-[#65A60B] border-[#2C4219] dark:border-[#65A60B] text-white shadow-md'
                          : 'bg-white dark:bg-[#242D34] border-[#c4c8bb]/30 dark:border-[#33414B] hover:bg-[#fff8f4] dark:hover:bg-[#2A343B] text-[#221A12] dark:text-white'
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          active ? 'bg-white/15' : 'bg-[#FFF8F4] dark:bg-[#1A2126] text-[#2C4219] dark:text-[#A3E635]'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <span className={`text-xs font-bold ${active ? 'text-white' : 'text-[#172C05] dark:text-white'}`}>
                        {item.label}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 ml-auto ${active ? 'text-white/60' : 'text-[#9CA3AF] dark:text-[#94A3B8]'}`}
                      />
                    </NavLink>
                  );
                })}
                {/* Theme Mode Toggle */}
                <button
                  onClick={() => {
                    toggleTheme();
                    setSheetOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-white dark:bg-[#242D34] border-[#c4c8bb]/30 dark:border-[#33414B] hover:bg-[#fff8f4] dark:hover:bg-[#2A343B] text-[#221A12] dark:text-white transition-all active:scale-[0.98] cursor-pointer text-left"
                >
                  <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-[#1A2126] flex items-center justify-center shrink-0 text-indigo-700 dark:text-[#A3E635]">
                    {isDark ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px] text-indigo-600" />}
                  </span>
                  <span className="text-xs font-bold text-[#172C05] dark:text-white">
                    {isDark ? 'Mode Terang' : 'Mode Malam'}
                  </span>
                  <ChevronRight className="w-4 h-4 ml-auto text-[#9CA3AF] dark:text-[#94A3B8]" />
                </button>

                {/* Bantuan */}
                <button
                  onClick={() => {
                    setSheetOpen(false);
                    setHelpOpen(true);
                  }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-white dark:bg-[#242D34] border-[#c4c8bb]/30 dark:border-[#33414B] hover:bg-[#fff8f4] dark:hover:bg-[#2A343B] text-[#221A12] dark:text-white transition-all active:scale-[0.98] cursor-pointer text-left"
                >
                  <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-[#1A2126] flex items-center justify-center shrink-0 text-amber-700 dark:text-[#A3E635]">
                    <HelpCircle className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-xs font-bold text-[#172C05] dark:text-white">
                    Bantuan
                  </span>
                  <ChevronRight className="w-4 h-4 ml-auto text-[#9CA3AF] dark:text-[#94A3B8]" />
                </button>
              </div>
            </div>

            {/* Info card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#2C4219] via-[#2C4219] to-[#3d5a25] p-4 flex items-center gap-3 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(195,226,141,0.15),transparent_60%)]" />
              <div className="relative w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#C3E28D]" />
              </div>
              <div className="relative flex-1 min-w-0">
                <p className="text-xs font-bold text-white">Butuh bantuan?</p>
                <p className="text-[11px] text-white/70 leading-snug">Hubungi tim Sorgum SCM via WhatsApp</p>
              </div>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noreferrer"
                className="relative shrink-0 px-3 py-1.5 rounded-full bg-[#C3E28D] text-[#172C05] text-xs font-bold hover:bg-[#d0ec9b] transition-colors"
              >
                Chat
              </a>
            </div>

            {/* Switch to Lite Mode */}
            <button
              onClick={handleSwitchToLite}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#C3E28D]/20 border border-[#2C4219]/20 text-[#172C05] hover:bg-[#C3E28D]/40 transition-colors cursor-pointer active:scale-[0.98]"
            >
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] flex items-center justify-center shrink-0">
                <Layers className="w-[18px] h-[18px] text-[#C3E28D]" />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-[#172C05]">Beralih ke Lite Mode</p>
                <p className="text-[10px] text-[#6B7280]">Tampilan lebih sederhana</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto text-[#9CA3AF]" />
            </button>

            {/* Logout */}
            <button
              onClick={() => setConfirmLogoutOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold">Keluar Akun</span>
            </button>

            <div className="h-2" />
          </div>
        </div>
      </div>

      {/* Confirm logout (mobile sheet context) */}
      {confirmLogoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-[#221A12]/30 backdrop-blur-sm" onClick={() => setConfirmLogoutOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[20px] shadow-2xl border border-[#c4c8bb]/20 p-5 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-center text-sm font-bold text-[#172C05]">Keluar dari akun?</h3>
            <p className="text-center text-xs text-[#6B7280] mt-1.5 leading-relaxed">
              Sesi akan diakhiri. Anda perlu login kembali untuk masuk.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                onClick={() => setConfirmLogoutOpen(false)}
                className="py-2.5 rounded-xl bg-[#F7F7F5] hover:bg-[#efe0d2] border border-[#c4c8bb]/30 text-xs font-bold text-[#44483e] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help modal — khusus mobile (glassmorphism reuse Modal common) */}
      <Modal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Pusat Bantuan"
        subtitle="Panduan cepat Sorgum SCM"
        maxWidth="lg"
      >
        <div className="space-y-3 text-sm text-[#44483e] max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
          <div className="p-3.5 bg-[#fff1e5] rounded-xl border border-[#c4c8bb]/30">
            <h4 className="font-bold text-[#2C4219] mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Cara cepat pakai aplikasi
            </h4>
            <p className="text-xs text-[#74796d] leading-relaxed">
              Navigasi utama ada di bar bawah (Dasbor, Panen, Lahan, Olahan). Menu lainnya ada di tombol{' '}
              <b>Lainnya</b>. Semua data panen & keuangan bisa dicari lewat kotak pencarian di atas.
            </p>
          </div>
          <div className="grid gap-2 text-xs">
            {[
              { t: 'Catat Panen', d: 'Buka Panen → Input Data Panen → isi lahan, varietas, tonase → Simpan.' },
              { t: 'Tambah Lahan', d: 'Buka Lahan → Tambah Lahan Baru → tandai lokasi di peta → Simpan.' },
              { t: 'Kelola Olahan', d: 'Buka Olahan → Tambah Batch → isi produk, kategori, QC → Simpan.' },
              { t: 'Cek Logistik', d: 'Buka Logistik (di Lainnya) → Catat Pengeluaran → Export PDF/Excel.' },
            ].map((x) => (
              <div key={x.t} className="p-3 bg-white rounded-xl border border-[#c4c8bb]/15">
                <p className="font-bold text-[#172C05]">{x.t}</p>
                <p className="text-[#6B7280] mt-0.5 leading-relaxed">{x.d}</p>
              </div>
            ))}
          </div>
          <div className="p-3.5 bg-[#2C4219] text-white rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-[#C3E28D]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">Butuh bantuan langsung?</p>
              <p className="text-[11px] text-white/70">WA: 0812-3456-7890 • support@sorgumscm.id</p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
