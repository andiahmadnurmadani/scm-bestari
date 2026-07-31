import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Tractor,
  Wrench,
  Factory,
  Award,
  Package,
  Truck,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import { authApi } from '../../api/endpoints/authApi';
import { Modal } from '../common/Modal';

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen = false,
  onMobileClose,
}) => {
  const navigate = useNavigate();
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const handleLogoutClick = () => {
    setConfirmLogoutOpen(true);
  };

  const handleConfirmLogout = async () => {
    await authApi.logout();
    setConfirmLogoutOpen(false);
    if (onMobileClose) onMobileClose();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Panen', path: '/dashboard/panen', icon: Sprout },
    { label: 'Kelola Lahan', path: '/dashboard/lahan', icon: Tractor },
    { label: 'Sarana & Peralatan', path: '/dashboard/peralatan', icon: Wrench },
    { label: 'Kelola Produksi', path: '/dashboard/produksi', icon: Factory },
    { label: 'Kelola Sertifikat', path: '/dashboard/sertifikat', icon: Award },
    { label: 'Kelola Data Kemasan', path: '/dashboard/kemasan', icon: Package },
    { label: 'Logistik', path: '/dashboard/logistik', icon: Truck },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFF8F4] border-r border-[#c4c8bb]/20 p-3 justify-between select-none">
      <div>
        {/* Logo Banner */}
        <div className="flex items-center justify-between mb-4 px-1 pt-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2C4219] flex items-center justify-center shrink-0 shadow-2xs">
              <Sprout className="w-3.5 h-3.5 text-[#C3E28D]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-extrabold text-[#172C05] leading-none whitespace-nowrap">
                Sorgum SCM
              </h1>
              <p className="text-[9px] font-bold text-[#44483e] tracking-wider uppercase mt-0.5">
                Sistem Manajemen
              </p>
            </div>
          </div>
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1 rounded-lg text-[#44483e] hover:bg-[#efe0d2]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-0.5 custom-scrollbar overflow-y-auto max-h-[calc(100vh-190px)] pr-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#C3E28D] text-[#172C05] font-semibold shadow-2xs'
                      : 'text-[#44483e] hover:text-[#172C05] hover:bg-[#efe0d2]/50'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Utility Bottom Links */}
      <div className="pt-3 border-t border-[#c4c8bb]/30 space-y-0.5">
        <button
          onClick={() => setHelpModalOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-[#44483e] hover:text-[#172C05] hover:bg-[#efe0d2]/50 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Bantuan</span>
        </button>

        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Help Modal */}
      <Modal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="Pusat Bantuan Sorgum SCM"
        subtitle="Panduan Penggunaan Sistem Manajemen Rantai Pasok"
      >
        <div className="space-y-4 text-sm text-[#44483e]">
          <div className="p-4 bg-[#fff1e5] rounded-xl border border-[#c4c8bb]/30">
            <h4 className="font-bold text-[#2C4219] mb-1">Butuh bantuan operasional?</h4>
            <p className="text-xs text-[#74796d]">
              Tim pendamping teknis KWT Sorgum SCM siap membantu Anda terkait pencatatan panen, pemutakhiran sertifikat, atau penginputan nota logistik.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-[#172C05]">Kontak Layanan Dukungan:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>WhatsApp Hotline: 0812-3456-7890 (Ibu Tani / Helpdesk)</li>
              <li>Email Operasional: support@sorgumscm.id</li>
              <li>Jam Layanan: Senin - Sabtu, 08.00 - 17.00 WIB</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        title="Konfirmasi Sesi Keluar"
        subtitle="Sorgum SCM - Sistem Rantai Pasok"
      >
        <div className="space-y-4 text-sm text-[#221A12]">
          <p className="text-xs sm:text-sm font-medium text-[#44483e] leading-relaxed">
            Apakah Anda yakin ingin keluar dari akun ini? Seluruh data operasional yang telah disimpan akan tetap aman.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <button
              onClick={() => setConfirmLogoutOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#44483e] bg-[#F7F7F5] hover:bg-[#efe0d2] border border-[#c4c8bb]/30 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmLogout}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Ya, Keluar Akun</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 w-64 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onMobileClose}
          />
          <div className="relative w-64 max-w-xs h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
