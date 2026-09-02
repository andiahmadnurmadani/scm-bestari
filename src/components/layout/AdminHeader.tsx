import React, { useEffect, useState } from 'react';
import { Search, Bell, Settings, Menu, LogOut, User as UserIcon, CheckCheck, Sprout, Layers, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/endpoints/authApi';
import { notificationsApi, AppNotification } from '../../api/endpoints/notificationsApi';
import { Modal } from '../common/Modal';
import { useCms } from '../../context/CmsContext';
import { useAppMode } from '../../context/AppModeContext';
import { useTheme } from '../../context/ThemeContext';

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
  const { cms } = useCms();
  const { setMode } = useAppMode();
  const { isDark, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  // ── Data user dari localStorage (hasil login API) ──────────────────────────
  const [user] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const userName = user?.name || 'Pengguna';
  const userRole = user?.role || 'Anggota KWT';
  const userEmail = user?.email || '';
  const userAvatar = user?.avatar || '';

  // ── Notifikasi dari API ────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.getAll();
      setNotifications(res.data || []);
      setUnreadCount(res.unread || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Baru saja';
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    return `${d} hari lalu`;
  };

  const handleLogout = async () => {
    await authApi.logout();
    setConfirmLogoutOpen(false);
    navigate('/login');
  };

  const handleSwitchToLite = () => {
    setMode('lite');
    navigate('/lite');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFF8F4] border-b border-[#c4c8bb]/20 shadow-2xs px-3 sm:px-6 py-1.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Brand (mobile) & Search input */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          {/* Mobile: tampilkan logo kecil sebagai pengganti hamburger — navigasi utama sudah di bottom bar */}
          {cms.logo ? (
            <img
              src={cms.logo}
              alt={cms.siteName || 'Logo'}
              className="lg:hidden w-9 h-9 rounded-xl object-cover ring-1 ring-[#c4c8bb]/30 shrink-0 shadow-2xs"
            />
          ) : (
            <div className="lg:hidden w-9 h-9 rounded-xl bg-[#2C4219] flex items-center justify-center shrink-0 shadow-2xs">
              <Sprout className="w-[18px] h-[18px] text-[#C3E28D]" />
            </div>
          )}
          {/* Fallback toggle tetap ada tapi disembunyikan — bottom nav menggantikan drawer di mobile */}
          <button
            onClick={onMenuClick}
            className="hidden p-2.5 rounded-xl bg-white border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#efe0d2]/40 transition-colors shrink-0 min-w-[40px] min-h-[40px] items-center justify-center cursor-pointer"
            aria-label="Toggle Navigation Menu"
            tabIndex={-1}
            aria-hidden="true"
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
          {/* Theme Mode Toggle (Terang / Malam) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full hover:bg-[#efe0d2] transition-colors relative cursor-pointer text-[#44483e] min-w-[34px] min-h-[34px] flex items-center justify-center border border-[#c4c8bb]/30"
            title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Malam'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-full hover:bg-[#efe0d2] transition-colors relative cursor-pointer text-[#44483e] min-w-[34px] min-h-[34px] flex items-center justify-center"
              title="Notifikasi Operasional"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-1 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute -right-8 sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-xs sm:max-w-none bg-white rounded-2xl shadow-xl border border-[#c4c8bb]/30 z-50 p-3.5 sm:p-4 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#c4c8bb]/20 pb-2">
                  <span className="font-bold text-[#2C4219]">Notifikasi</span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-[#C3E28D] text-[#172C05] px-2 py-0.5 rounded-full font-extrabold">
                        {unreadCount} Baru
                      </span>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#2C4219] hover:text-[#172C05] transition-colors cursor-pointer"
                        title="Tandai semua dibaca"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Tandai dibaca
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center text-[#9CA3AF] py-6">Belum ada notifikasi.</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => !n.isRead && handleMarkRead(n.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
                          n.isRead
                            ? 'bg-white border-[#c4c8bb]/15 opacity-70'
                            : 'bg-[#fff8f4] border-[#c4c8bb]/15 hover:border-[#2C4219]/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-[#221A12]">{n.judul}</p>
                          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-1" />}
                        </div>
                        <p className="text-[#74796d] mt-0.5 leading-relaxed">{n.pesan}</p>
                        <span className="text-[10px] text-[#2C4219] font-medium block mt-1">
                          {timeAgo(n.createdAt)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tombol Lite Mode */}
          <button
            onClick={handleSwitchToLite}
            title="Beralih ke Lite Mode — tampilan sederhana"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C3E28D]/60 hover:bg-[#C3E28D] text-[#172C05] text-[11px] font-extrabold transition-all cursor-pointer border border-[#2C4219]/20"
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Lite</span>
          </button>

          {/* Settings gear */}
          <Link
            to="/dashboard/cms"
            className="p-1.5 rounded-full hover:bg-[#efe0d2] transition-colors cursor-pointer text-[#44483e] min-w-[34px] min-h-[34px] flex items-center justify-center"
            title="Manajemen Konten Website"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <div className="h-6 w-px bg-[#c4c8bb]/30 mx-1 hidden sm:block" />

          {/* Profile badge with dropdown */}
          <div className="relative pl-1">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-[#efe0d2]/60 transition-all cursor-pointer focus:outline-none"
            >
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-[#221A12] leading-none">{userName}</p>
              </div>
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Profil User"
                  className="w-7.5 h-7.5 rounded-full object-cover ring-2 ring-[#2C4219]/20 shrink-0"
                />
              ) : (
                <div className="w-7.5 h-7.5 rounded-full bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-xs font-black shrink-0 ring-2 ring-[#2C4219]/20">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {/* Profile Menu Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#c4c8bb]/30 z-50 p-2 text-xs space-y-1">
                <div className="p-3 bg-[#fff8f4] rounded-xl border border-[#c4c8bb]/15 mb-2">
                  <p className="font-bold text-[#172C05]">{userName}</p>
                  <p className="text-[11px] text-[#74796d]">{userEmail}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-[#C3E28D] text-[#172C05] text-[10px] font-extrabold">
                    {userRole}
                  </span>
                </div>

                <Link
                  to="/dashboard/profil"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-[#44483e] hover:bg-[#fff1e5] hover:text-[#2C4219] transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profil Saya</span>
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
