import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutGrid,
  Sprout,
  Tractor,
  Soup,
  Layers,
  Package,
  User,
  HelpCircle,
  LogOut,
  BookOpen,
  Headphones,
} from 'lucide-react';
import { authApi } from '../../../api/endpoints/authApi';
import { Modal } from '../../common/Modal';

// 6 Menu Utama Lite Mode (Sesuai Referensi Visual Screenshot)
const liteNavItems = [
  { label: 'Dashboard', path: '/lite', icon: LayoutGrid, end: true },
  { label: 'Panen', path: '/lite/panen', icon: Sprout, end: false },
  { label: 'Lahan', path: '/lite/lahan', icon: Tractor, end: false },
  { label: 'Olahan', path: '/lite/produksi', icon: Soup, end: false },
  { label: 'Varietas', path: '/lite/varietas', icon: Layers, end: false },
  { label: 'Gudang', path: '/lite/gudang', icon: Package, end: false },
];

export const LiteSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    setConfirmLogout(false);
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[82px] bg-[#43622E] text-white z-40 select-none rounded-tr-[30px] rounded-br-[30px] shadow-[4px_0_20px_rgba(30,48,18,0.2)] py-4 justify-between items-center overflow-y-auto custom-scrollbar">
      {/* ── Top Brand Icon / Logo ────────────────────────────────────────── */}
      <div className="flex flex-col items-center pt-0.5 pb-2">
        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-[#C3E28D] shadow-2xs">
          <Sprout className="w-5.5 h-5.5" />
        </div>
      </div>

      {/* ── 6 Main Nav Items (Smooth Animated Pill Transition) ─────────── */}
      <nav className="flex flex-col items-center gap-2 w-full px-2 my-auto">
        {liteNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className="relative w-full flex flex-col items-center justify-center text-center py-2 px-1 rounded-[18px] transition-colors cursor-pointer select-none"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeLiteSidebarPill"
                      className="absolute inset-0 bg-[#65A60B] rounded-[18px] shadow-md z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div
                    className={`relative z-10 flex flex-col items-center justify-center transition-colors ${
                      isActive ? 'text-white font-bold' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`} />
                    <span className="text-[10.5px] leading-tight tracking-tight">{item.label}</span>
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Bottom Section (Profil, Bantuan, Keluar) ───────────────────── */}
      <div className="flex flex-col items-center gap-2 w-full px-2 pt-3 border-t border-white/15">
        {/* Profil */}
        <NavLink
          to="/lite/profil"
          className="relative w-full flex flex-col items-center justify-center text-center py-1.5 px-1 rounded-[16px] transition-colors cursor-pointer select-none"
          title="Profil Saya"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="activeLiteSidebarPill"
                  className="absolute inset-0 bg-[#65A60B] rounded-[16px] shadow-2xs z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div
                className={`relative z-10 flex flex-col items-center justify-center transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-white/80 hover:text-white'
                }`}
              >
                <User className="w-4.5 h-4.5 mb-0.5" />
                <span className="text-[10px] leading-tight">Profil</span>
              </div>
            </>
          )}
        </NavLink>

        {/* Bantuan */}
        <button
          onClick={() => setHelpOpen(true)}
          className="w-full flex flex-col items-center justify-center text-center py-1.5 px-1 rounded-[16px] text-white/85 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Pusat Bantuan"
        >
          <HelpCircle className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[10px] leading-tight">Bantuan</span>
        </button>

        {/* Keluar */}
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full flex flex-col items-center justify-center text-center py-1.5 px-1 rounded-[16px] text-red-200 hover:text-white hover:bg-red-600/40 transition-colors cursor-pointer"
          title="Keluar Akun"
        >
          <LogOut className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[10px] leading-tight">Keluar</span>
        </button>
      </div>

      {/* ── Modal Bantuan ──────────────────────────────────────────────── */}
      <Modal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Pusat Bantuan Mode Mudah"
        subtitle="Panduan & Layanan Informasi Sorgum KWT"
      >
        <div className="space-y-4 text-sm text-[#44483e] max-h-[65vh] overflow-y-auto pr-1">
          <div className="p-4 bg-[#EBF7EE] rounded-2xl border border-[#C8E6C9]">
            <h4 className="font-bold text-[#1B5E20] text-sm mb-0.5">👋 Panduan Penggunaan Mode Mudah</h4>
            <p className="text-xs text-[#2E7D32] leading-relaxed">
              Gunakan menu di samping kiri untuk mengelola rantai pasok sorgum Anda.
            </p>
          </div>

          <div className="space-y-2.5">
            <h5 className="font-bold text-[#172C05] text-xs uppercase tracking-wider">Fitur Utama Lite Mode:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#ECE7DF] flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-[#2C4219] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#172C05]">Pencatatan Simpel</p>
                  <p className="text-[#70766B] text-[11px]">Formulir sederhana & ringkas</p>
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#ECE7DF] flex items-start gap-2.5">
                <Headphones className="w-4 h-4 text-[#2C4219] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#172C05]">Bantuan KWT</p>
                  <p className="text-[#70766B] text-[11px]">Dukungan penuh tim lapangan</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#ECE7DF] flex items-center justify-between text-xs">
            <span className="text-[#70766B]">Butuh bantuan mendesak?</span>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-[#2C4219] text-white font-bold hover:bg-[#1C2E10] transition-colors"
            >
              Hubungi WhatsApp
            </a>
          </div>
        </div>
      </Modal>

      {/* ── Modal Konfirmasi Logout ────────────────────────────────────── */}
      <Modal
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Keluar dari Aplikasi?"
        subtitle="Konfirmasi Log Out"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#44483e] leading-relaxed">
            Apakah Anda yakin ingin keluar dari akun admin? Anda harus memasukkan kata sandi kembali untuk masuk.
          </p>
          <div className="flex gap-3 pt-2 border-t border-[#ECE7DF]">
            <button
              onClick={() => setConfirmLogout(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#44483e] bg-[#F5EFE9] border border-[#E0D7CB] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Ya, Keluar
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  );
};
