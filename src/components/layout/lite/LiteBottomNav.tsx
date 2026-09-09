import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Tractor,
  Factory,
  Warehouse,
  Boxes,
  Database,
  LayoutGrid,
  X,
  User,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { authApi } from '../../../api/endpoints/authApi';
import { useCms } from '../../../context/CmsContext';
import { Modal } from '../../common/Modal';

// ── Primary: tampil langsung di bar (4 item) ────────────────────────────────
const primaryNav = [
  { label: 'Utama', shortLabel: 'Utama', path: '/lite', icon: LayoutDashboard, end: true },
  { label: 'Panen', shortLabel: 'Panen', path: '/lite/panen', icon: Sprout },
  { label: 'Lahan', shortLabel: 'Lahan', path: '/lite/lahan', icon: Tractor },
  { label: 'Gudang', shortLabel: 'Gudang', path: '/lite/gudang', icon: Warehouse },
] as const;

// ── Secondary: masuk sheet "Lainnya" ────────────────────────────────────────
const secondaryNav = [
  { label: 'Olahan', sub: 'Hasil Olahan', path: '/lite/produksi', icon: Factory, desc: 'Catat hasil olahan' },
  { label: 'Produk Olahan', sub: 'Master Data', path: '/lite/produk', icon: Boxes, desc: 'Pilihan produk olahan' },
  { label: 'Varietas', sub: 'Master Data', path: '/lite/varietas', icon: Database, desc: 'Benih sorgum' },
] as const;

const utilityNav = [
  { label: 'Profil Saya', path: '/lite/profil', icon: User },
] as const;

export const LiteBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cms } = useCms();
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
            aria-controls="lite-lainnya-sheet"
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

      {/* ── Bottom Sheet — Glassmorphism ───────────────────────────────── */}
      <div
        id="lite-lainnya-sheet"
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
          className="mx-auto w-full max-w-[640px] flex flex-col rounded-t-[28px] border-t border-white/60 shadow-[0_-12px_40px_rgba(44,66,25,0.16),0_-2px_12px_rgba(44,66,25,0.08)] overflow-hidden max-h-[78vh]"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,248,244,0.94) 100%)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-10 h-1.5 rounded-full bg-[#c4c8bb]/60" />
          </div>

          {/* Sheet header */}
          <div className="px-5 pb-4 flex items-start justify-between gap-3 shrink-0 border-b border-[#c4c8bb]/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2C4219] to-[#3d5a25] flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                {cms.logo ? (
                  <img src={cms.logo} alt={cms.siteName || 'Logo'} className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#C3E28D]" />
                )}
              </div>
              <div>
                <h2 className="text-[15px] font-extrabold text-[#172C05] leading-none">Menu Lainnya</h2>
                <p className="text-[11px] font-medium text-[#6B7280] mt-1">Akses cepat semua fitur Mode Mudah</p>
              </div>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              className="w-9 h-9 rounded-full bg-[#F7F7F5] hover:bg-[#efe0d2] border border-[#c4c8bb]/20 flex items-center justify-center text-[#44483e] hover:text-[#2C4219] transition-colors shrink-0 cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto custom-scrollbar flex-1 px-4 sm:px-5 py-4 space-y-5">
            {/* Secondary grid */}
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] mb-3 px-1">
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
                          ? 'bg-[#2C4219] border-[#2C4219] text-white shadow-[0_4px_16px_rgba(44,66,25,0.25)]'
                          : 'bg-white border-[#c4c8bb]/20 hover:border-[#2C4219]/20 hover:shadow-md hover:bg-[#fff8f4] text-[#221A12]'
                      }`}
                    >
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                          active
                            ? 'bg-white/15 text-white'
                            : 'bg-[#F7F7F5] group-hover:bg-[#C3E28D]/20 text-[#2C4219]'
                        }`}
                      >
                        <Icon className="w-6 h-6" strokeWidth={active ? 2 : 1.8} />
                      </span>
                      <span className={`text-xs font-bold leading-tight ${active ? 'text-white' : 'text-[#172C05]'}`}>
                        {item.label}
                      </span>
                      <span className={`text-[10px] leading-tight ${active ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
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
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] mb-3 px-1">
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
                          ? 'bg-[#2C4219] border-[#2C4219] text-white shadow-md'
                          : 'bg-white border-[#c4c8bb]/20 hover:bg-[#fff8f4] hover:border-[#2C4219]/20 text-[#221A12]'
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          active ? 'bg-white/15' : 'bg-[#FFF8F4] text-[#2C4219]'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <span className={`text-xs font-bold ${active ? 'text-white' : 'text-[#172C05]'}`}>
                        {item.label}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 ml-auto ${active ? 'text-white/60' : 'text-[#9CA3AF]'}`}
                      />
                    </NavLink>
                  );
                })}
                {/* Bantuan */}
                <button
                  onClick={() => {
                    setSheetOpen(false);
                    setHelpOpen(true);
                  }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-white border-[#c4c8bb]/20 hover:bg-[#fff8f4] hover:border-[#2C4219]/20 text-[#221A12] transition-all active:scale-[0.98] cursor-pointer text-left"
                >
                  <span className="w-9 h-9 rounded-xl bg-[#FFF8F4] flex items-center justify-center shrink-0 text-[#2C4219]">
                    <HelpCircle className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-xs font-bold text-[#172C05]">Bantuan</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-[#9CA3AF]" />
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
                <p className="text-xs font-bold text-white">Punya pertanyaan seputar KWT?</p>
                <p className="text-[11px] text-white/70 leading-snug">Tim lapangan siap membantu penggunaan aplikasi</p>
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
        title="Pusat Bantuan Mode Mudah"
        subtitle="Panduan cepat untuk KWT"
        maxWidth="lg"
      >
        <div className="space-y-3 text-sm text-[#44483e] max-h-[65vh] overflow-y-auto custom-scrollbar pr-1">
          <div className="p-3.5 bg-[#fff1e5] rounded-xl border border-[#c4c8bb]/30">
            <h4 className="font-bold text-[#2C4219] mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Cara cepat pakai aplikasi
            </h4>
            <p className="text-xs text-[#74796d] leading-relaxed">
              Navigasi utama ada di bar bawah (Utama, Lahan, Panen, Gudang). Menu lainnya ada di tombol{' '}
              <b>Lainnya</b>. Semua data bisa dicari lewat kotak pencarian di atas.
            </p>
          </div>
          <div className="grid gap-2 text-xs">
            {[
              { t: 'Tambah Lahan & Tanam', d: 'Buka Lahan & Tanaman → Tambah Lahan / Tanam → isi → Simpan.' },
              { t: 'Catat Panen', d: 'Buka Panen → Catat Panen → pilih lahan & penanaman → isi hasil → Simpan.' },
              { t: 'Kelola Olahan', d: 'Buka Lainnya → Olahan → Catat Olahan → pilih produk → isi hasil → Simpan.' },
              { t: 'Lihat Gudang', d: 'Buka tombol Gudang di bar bawah untuk memantau stok hasil panen.' },
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
