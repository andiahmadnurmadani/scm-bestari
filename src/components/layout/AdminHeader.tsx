import React, { useState } from 'react';
import { Search, Bell, Settings, Menu, LogOut, Home, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/endpoints/authApi';
import { Modal } from '../common/Modal';

interface AdminHeaderProps {
  onMenuClick?: () => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onMenuClick,
  searchTerm = '',
  onSearchChange,
}) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    setConfirmLogoutOpen(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFF8F4] border-b border-[#c4c8bb]/20 shadow-2xs px-3 sm:px-6 py-1.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Mobile menu toggle & Search input */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 rounded-xl bg-white border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#efe0d2]/40 transition-colors shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search input */}
          <div className="w-full max-w-xs sm:max-w-md">
            <div className="relative group">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#44483e]/60 group-focus-within:text-[#2C4219] transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                placeholder="Cari data..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-full text-xs font-medium text-[#221A12] placeholder-[#44483e]/60 focus:outline-none focus:ring-1 focus:ring-[#2C4219] focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Right: Notifications, Settings, Profile Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-full hover:bg-[#efe0d2] transition-colors relative cursor-pointer text-[#44483e] min-w-[34px] min-h-[34px] flex items-center justify-center"
              title="Notifikasi Operasional"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full ring-1 ring-white" />
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute -right-8 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-xs sm:max-w-none bg-white rounded-2xl shadow-xl border border-[#c4c8bb]/30 z-50 p-3.5 sm:p-4 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#c4c8bb]/20 pb-2">
                  <span className="font-bold text-[#2C4219]">Notifikasi Baru</span>
                  <span className="text-[10px] bg-[#C3E28D] text-[#172C05] px-2 py-0.5 rounded-full font-extrabold">
                    2 Baru
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-[#fff8f4] rounded-xl border border-[#c4c8bb]/15">
                    <p className="font-bold text-[#221A12]">Sertifikat Halal Diperbarui</p>
                    <p className="text-[#74796d] mt-0.5">
                      BPJPH No. ID31110001294812 berstatus AKTIF.
                    </p>
                    <span className="text-[10px] text-[#2C4219] font-medium block mt-1">10 min lalu</span>
                  </div>
                  <div className="p-2.5 bg-[#fff8f4] rounded-xl border border-[#c4c8bb]/15">
                    <p className="font-bold text-[#221A12]">Pencatatan Panen Sektor C</p>
                    <p className="text-[#74796d] mt-0.5">
                      Hasil panen 1.850 kg sorgum varietas Bioguma berhasil diinput.
                    </p>
                    <span className="text-[10px] text-[#2C4219] font-medium block mt-1">1 jam lalu</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings gear */}
          <button
            className="p-1.5 rounded-full hover:bg-[#efe0d2] transition-colors cursor-pointer text-[#44483e] min-w-[34px] min-h-[34px] flex items-center justify-center"
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-[#c4c8bb]/30 mx-1 hidden sm:block" />

          {/* Profile badge with dropdown */}
          <div className="relative pl-1">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-[#efe0d2]/60 transition-all cursor-pointer focus:outline-none"
            >
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-[#221A12] leading-none">Ibu KWT</p>
                <p className="text-[9px] font-bold text-[#44483e] uppercase tracking-wider mt-0.5">
                  Manajer Operasional
                </p>
              </div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaXEzYVwh8rBuM7PtbQrpP39W0HmakJ4kHsPwX7_vIZgRvfmqm9pRP7szJLdko2G45UQYO6M8aY_i21j9x3xP65UULd5xpGsQFN_UJLI_uhaMGDzoeASs_69MYwt__JwI7APZiqq772N9JKeOU5BvNgzdWn6GnagOmEqSIELGYuWu1lmmQwuMjv7jMWicYeALwoLwWCWLovQjtbqzrS6MtD5xNOIkU9WUx6BIywUugUVIF0XwaXwzJ"
                alt="Profil User"
                className="w-7.5 h-7.5 rounded-full object-cover ring-2 ring-[#2C4219]/20 shrink-0"
              />
            </button>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#c4c8bb]/30 z-50 p-2 text-xs space-y-1">
                <div className="p-3 bg-[#fff8f4] rounded-xl border border-[#c4c8bb]/15 mb-2">
                  <p className="font-bold text-[#172C05]">Ibu KWT Mawar</p>
                  <p className="text-[11px] text-[#74796d]">kwt.sorgum@gmail.com</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-[#C3E28D] text-[#172C05] text-[10px] font-extrabold">
                    Manajer SCM
                  </span>
                </div>

                <Link
                  to="/"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-[#44483e] hover:bg-[#fff1e5] hover:text-[#2C4219] transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Lihat Landing Page</span>
                </Link>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setConfirmLogoutOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#c4c8bb]/20">
            <button
              onClick={() => setConfirmLogoutOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#44483e] bg-[#F7F7F5] hover:bg-[#efe0d2] border border-[#c4c8bb]/30 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ya, Keluar Akun</span>
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
};
