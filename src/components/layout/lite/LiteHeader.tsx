import React, { useEffect, useState } from 'react';
import { Search, Bell, User as UserIcon, LogOut, Layers, Sprout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi, AppNotification } from '../../../api/endpoints/notificationsApi';
import { authApi } from '../../../api/endpoints/authApi';
import { useCms } from '../../../context/CmsContext';
import { useAppMode } from '../../../context/AppModeContext';
import { Modal } from '../../common/Modal';
import { formatTanggalId } from '../../../utils/dateUtils';

interface LiteHeaderProps {
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  pageTitle?: string;
}

export const LiteHeader: React.FC<LiteHeaderProps> = ({ searchTerm = '', onSearchChange, pageTitle }) => {
  const navigate = useNavigate();
  const { cms } = useCms();
  const { setMode } = useAppMode();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [user] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const userName = user?.name || 'Pengguna';
  const userEmail = user?.email || '';
  const userAvatar = user?.avatar || '';

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

  const handleLogout = async () => {
    await authApi.logout();
    setConfirmLogout(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FFF8F4] border-b border-[#c4c8bb]/20 shadow-2xs px-3 sm:px-6 py-2">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand (mobile) & Search input */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Mobile: logo kecil pengganti hamburger — navigasi utama ada di bottom bar */}
          {cms.logo ? (
            <img
              src={cms.logo}
              alt={cms.siteName || 'Logo'}
              className="lg:hidden w-8 h-8 rounded-xl object-cover ring-1 ring-[#c4c8bb]/30 shrink-0 shadow-2xs"
            />
          ) : (
            <div className="lg:hidden w-8 h-8 rounded-xl bg-[#2C4219] flex items-center justify-center shrink-0 shadow-2xs">
              <Sprout className="w-4 h-4 text-[#C3E28D]" />
            </div>
          )}
          {pageTitle && (
            <h2 className="text-base sm:text-lg font-bold text-[#172C05] truncate">{pageTitle}</h2>
          )}
          {/* Search — di samping kiri */}
          {onSearchChange && (
            <div className="w-full max-w-xs sm:max-w-sm flex-1 min-w-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#44483e]/60" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Cari data..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-full text-xs font-medium text-[#221A12] placeholder-[#44483e]/60 focus:outline-none focus:ring-1 focus:ring-[#2C4219] transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Switch ke Mode Lengkap (Pro) — posisi sama di header atas */}
          <button
            onClick={() => {
              setMode('pro');
              navigate('/dashboard');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#C3E28D]/50 text-[#2C4219] hover:bg-[#C3E28D] transition-colors cursor-pointer text-[11px] font-bold whitespace-nowrap"
            title="Beralih ke Mode Lengkap (Pro)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Mode Lengkap</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-[#efe0d2] transition-colors cursor-pointer text-[#44483e] relative"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-1 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#c4c8bb]/30 z-50 overflow-hidden">
                <div className="px-4 py-3 bg-[#fff8f4] border-b border-[#c4c8bb]/15 flex items-center justify-between">
                  <p className="text-xs font-bold text-[#172C05]">Notifikasi</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        await notificationsApi.markAllRead();
                        setUnreadCount(0);
                        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                      }}
                      className="text-[10px] font-bold text-[#2C4219] hover:underline cursor-pointer"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-xs text-[#6B7280]">Tidak ada notifikasi.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-2.5 border-b border-[#c4c8bb]/10 ${n.isRead ? 'bg-white' : 'bg-[#C3E28D]/10'}`}>
                        <p className="text-xs font-semibold text-[#172C05]">{n.judul}</p>
                        <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">{n.pesan}</p>
                        <p className="text-[10px] text-[#9CA3AF] mt-1">{formatTanggalId(n.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center p-0.5 rounded-full hover:bg-[#efe0d2]/60 cursor-pointer"
              title="Profil Saya"
            >
              {userAvatar ? (
                <img src={userAvatar} alt="Profil" className="w-7.5 h-7.5 rounded-full object-cover ring-2 ring-[#2C4219]/20" />
              ) : (
                <div className="w-7.5 h-7.5 rounded-full bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-xs font-black ring-2 ring-[#2C4219]/20">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#c4c8bb]/30 z-50 p-2 text-xs space-y-1">
                <div className="p-3 bg-[#fff8f4] rounded-xl border border-[#c4c8bb]/15 mb-2">
                  <p className="font-bold text-[#172C05]">{userName}</p>
                  <p className="text-[11px] text-[#74796d] truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/lite/profil');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-[#44483e] hover:bg-[#fff1e5] hover:text-[#2C4219] transition-colors cursor-pointer text-left"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profil Saya</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setConfirmLogout(true);
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

      {/* Logout modal */}
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
    </header>
  );
};
