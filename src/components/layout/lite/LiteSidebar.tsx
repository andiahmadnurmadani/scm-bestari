import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Tractor,
  Sprout,
  Warehouse,
  Factory,
  Database,
  HelpCircle,
  LogOut,
  BookOpen,
  Headphones,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { authApi } from '../../../api/endpoints/authApi';
import { useCms } from '../../../context/CmsContext';
import { Modal } from '../../common/Modal';

const navItems = [
  { label: 'Dashboard', path: '/lite', icon: LayoutDashboard, end: true },
  { label: 'Lahan & Tanaman', path: '/lite/lahan', icon: Tractor },
  { label: 'Panen', path: '/lite/panen', icon: Sprout },
  { label: 'Gudang', path: '/lite/gudang', icon: Warehouse },
  { label: 'Olahan', path: '/lite/produksi', icon: Factory },
  { label: 'Produk Olahan', path: '/lite/produk', icon: Boxes },
  { label: 'Varietas', path: '/lite/varietas', icon: Database },
];

interface LiteSidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const LiteSidebar: React.FC<LiteSidebarProps> = ({ collapsed = false, onToggleCollapse }) => {
  const navigate = useNavigate();
  const { cms } = useCms();
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    setConfirmLogout(false);
    navigate('/login');
  };

  return (
    <aside className={`hidden lg:block fixed left-0 top-0 bottom-0 z-40 h-screen transition-all duration-300 ${collapsed ? 'w-14' : 'w-60'}`}>
      <div className="relative flex flex-col h-full bg-[#FFF8F4] border-r border-[#c4c8bb]/20 p-3 select-none">
        {/* Brand */}
        <div className={`flex items-center ${collapsed ? 'justify-center mb-3' : 'justify-between mb-4 px-1'}`}>
          <div className="flex items-center gap-2">
            {cms.logo ? (
              <img
                src={cms.logo}
                alt={cms.siteName || 'Logo'}
                className="w-8 h-8 rounded-xl object-cover ring-1 ring-[#c4c8bb]/30 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#2C4219] flex items-center justify-center shrink-0">
                <Sprout className="w-4 h-4 text-[#C3E28D]" />
              </div>
            )}
            {!collapsed && (
              <div className="flex flex-col">
                <h1 className="text-sm font-extrabold text-[#172C05] leading-none whitespace-nowrap">{cms.siteName || 'Sorgum SCM'}</h1>
                <p className="text-[9px] font-bold text-[#44483e] tracking-wider uppercase mt-0.5">Mode Mudah</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-0.5 overflow-y-auto custom-scrollbar flex-1 pr-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 ${collapsed ? 'justify-center px-1.5' : ''} ${
                    isActive
                      ? 'bg-[#C3E28D] text-[#172C05] font-semibold'
                      : 'text-[#44483e] hover:text-[#172C05] hover:bg-[#efe0d2]/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Tombol ciutkan/perluas sidebar (desktop) — di GARIS perbatasan sidebar & konten */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
            className="hidden lg:flex absolute right-[-14px] top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-[#2C4219] text-white hover:bg-[#172C05] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer items-center justify-center shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}

        {/* Bottom */}
        <div className="pt-3 mt-2 border-t border-[#c4c8bb]/30 space-y-0.5">
          <button
            onClick={() => setHelpOpen(true)}
            title={collapsed ? 'Bantuan' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#44483e] hover:bg-[#efe0d2]/50 transition-colors cursor-pointer ${collapsed ? 'justify-center px-1.5' : ''}`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Bantuan</span>}
          </button>
          <button
            onClick={() => setConfirmLogout(true)}
            title={collapsed ? 'Keluar' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer ${collapsed ? 'justify-center px-1.5' : ''}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>

        {/* Help Modal */}
        <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Pusat Bantuan Mode Mudah" subtitle="Panduan penggunaan untuk KWT">
          <div className="space-y-3 text-sm text-[#44483e] max-h-[65vh] overflow-y-auto pr-1">
            <div className="p-4 bg-[#EBF7EE] rounded-xl border border-[#C8E6C9]">
              <h4 className="font-bold text-[#1B5E20] mb-0.5">👋 Selamat datang di Mode Mudah</h4>
              <p className="text-xs text-[#2E7D32] leading-relaxed">
                Menu samping kiri membantu Anda mencatat lahan, panen, gudang, dan olahan dengan tampilan sederhana.
              </p>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { icon: BookOpen, t: 'Pencatatan Simpel', d: 'Formulir ringkas dengan contoh pengisian' },
                { icon: Database, t: 'Mode Lengkap (Pro)', d: 'Fitur lanjutan: sertifikat, kemasan, logistik, CMS' },
                { icon: Headphones, t: 'Bantuan KWT', d: 'Dukungan penuh tim lapangan' },
              ].map((f) => (
                <div key={f.t} className="p-3 bg-white rounded-xl border border-[#ECE7DF] flex items-start gap-2.5">
                  <f.icon className="w-4 h-4 text-[#2C4219] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#172C05]">{f.t}</p>
                    <p className="text-[#70766B] text-[11px]">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>

        {/* Logout Modal */}
        <Modal isOpen={confirmLogout} onClose={() => setConfirmLogout(false)} title="Keluar dari Aplikasi?" subtitle="Konfirmasi Keluar">
          <div className="space-y-4">
            <p className="text-sm text-[#44483e] leading-relaxed">
              Apakah Anda yakin ingin keluar dari akun ini? Anda harus memasukkan kata sandi kembali untuk masuk.
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
      </div>
    </aside>
  );
};
