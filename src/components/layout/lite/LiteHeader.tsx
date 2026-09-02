import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  User as UserIcon,
  LogOut,
  CheckCheck,
  Sprout,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { authApi } from '../../../api/endpoints/authApi';
import { notificationsApi, AppNotification } from '../../../api/endpoints/notificationsApi';
import { Modal } from '../../common/Modal';
import { useCms } from '../../../context/CmsContext';
import { useAppMode } from '../../../context/AppModeContext';
import { useTheme } from '../../../context/ThemeContext';

interface LiteHeaderProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const PAGE_TITLES: Record<string, { title: string; desc: string; icon: string }> = {
  '/lite': { title: 'Dashboard Utama', desc: 'Ringkasan rantai pasok hari ini', icon: '🏠' },
  '/lite/panen': { title: 'Catatan Panen', desc: 'Hasil panen sorgum', icon: '🌾' },
  '/lite/lahan': { title: 'Kelola Lahan', desc: 'Blok lahan & penanaman', icon: '🌱' },
  '/lite/produksi': { title: 'Kelola Olahan', desc: 'Produksi beras & tepung', icon: '🥣' },
  '/lite/varietas': { title: 'Varietas Sorgum', desc: 'Katalog benih sorgum', icon: '🌾' },
  '/lite/gudang': { title: 'Gudang & FIFO', desc: 'Stok karung & pengambilan tertua', icon: '📦' },
  '/lite/profil': { title: 'Profil Saya', desc: 'Pengaturan akun', icon: '👤' },
};

export const LiteHeader: React.FC<LiteHeaderProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cms } = useCms();
  const { setMode } = useAppMode();
  const { isDark, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  // User
  const [user] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const userName = user?.name || 'Ibu Petani';
  const userAvatar = user?.avatar || '';

  // Notifikasi
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await notificationsApi.getAll();
        setNotifications(res.data || []);
        setUnreadCount(res.unread || 0);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    })();
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

  const handleLogout = async () => {
    await authApi.logout();
    setConfirmLogoutOpen(false);
    navigate('/login');
  };

  const handleSwitchToPro = () => {
    setMode('pro');
    navigate('/dashboard');
  };

  const currentInfo = PAGE_TITLES[location.pathname] || {
    title: 'Sorgum SCM',
    desc: 'Sistem Rantai Pasok',
    icon: '🌾',
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#ECE7DF] px-4 sm:px-6 lg:px-7 py-2.5 select-none">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Pill Card with Logo + Active Page Title */}
        <div className="flex items-center gap-2.5">
          <div className="bg-white border border-[#DCE4D6] shadow-xs px-3.5 py-1.5 rounded-2xl flex items-center gap-2.5">
            {cms.logo ? (
              <img
                src={cms.logo}
                alt="Logo"
                className="w-6 h-6 rounded-lg object-cover ring-1 ring-[#C3E28D]"
              />
            ) : (
              <div className="w-6 h-6 rounded-lg bg-[#2C4219] text-[#C3E28D] flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-[#172C05]">{currentInfo.title}</span>
              <span className="hidden sm:inline text-xs text-[#8A9084] font-medium">• {currentInfo.desc}</span>
            </div>
          </div>
        </div>

        {/* Right: Pro Mode Switch + Notifications + Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Tombol Toggle Light Mode / Night Mode (Icon Only — Persis Pro Mode) */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-white hover:bg-[#F4EFEB] border border-[#ECE7DF] transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center text-[#3E4338]"
            title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Malam'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Tombol Pindah Mode Pro (Di samping Notifikasi) */}
          <button
            onClick={handleSwitchToPro}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBF7EE] hover:bg-[#D8EEDB] border border-[#C8E6C9] text-[#1B5E20] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Beralih ke Pro Mode"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2C4219]" />
            <span>Pro Mode</span>
          </button>

          {/* Bell Notification */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="w-9 h-9 rounded-xl bg-white hover:bg-[#F4EFEB] border border-[#ECE7DF] transition-colors relative cursor-pointer text-[#3E4338] flex items-center justify-center shadow-2xs"
              title="Pemberitahuan"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-1 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-76 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-[#ECE7DF] z-50 p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#ECE7DF] pb-2">
                  <span className="font-bold text-xs text-[#172C05]">Pemberitahuan</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>

                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#2C4219] hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" /> Tandai semua dibaca
                  </button>
                )}

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="text-center text-[#9E988F] py-5 font-medium">Belum ada pemberitahuan.</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => !n.isRead && handleMarkRead(n.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-colors cursor-pointer ${
                          n.isRead
                            ? 'bg-white border-[#ECE7DF]/60 opacity-70'
                            : 'bg-[#FFF8F2] border-[#FFE082]/60 hover:border-[#2C4219]/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-[#172C05] text-[11px]">{n.judul}</p>
                          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-1" />}
                        </div>
                        <p className="text-[#6E7368] text-[10px] mt-0.5 leading-relaxed">{n.pesan}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 sm:pl-2 sm:pr-2.5 py-1 bg-white hover:bg-[#F4EFEB] border border-[#ECE7DF] rounded-xl cursor-pointer shadow-2xs transition-all"
            >
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#2C4219]/20" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#2C4219] text-white flex items-center justify-center text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-bold text-[#172C05] whitespace-nowrap">
                {userName}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#ECE7DF] z-50 p-2 space-y-1">
                <div className="p-2 border-b border-[#ECE7DF]/60 mb-1">
                  <p className="text-xs font-bold text-[#172C05] truncate">{userName}</p>
                  <p className="text-[10px] text-[#7A8072] truncate">{user?.email || 'admin@sorgum.com'}</p>
                </div>
                <Link
                  to="/lite/profil"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-[#2D3328] hover:bg-[#F4EFEB] transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#70766B]" />
                  <span>Profil Saya</span>
                </Link>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setConfirmLogoutOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
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
    </header>
  );
};
