import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Camera,
  Save,
  Eye,
  EyeOff,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Sprout,
} from 'lucide-react';
import { authApi } from '../../api/endpoints/authApi';
import { Toast } from '../../components/common/Toast';
import { LITE_CSS } from './liteDesign';

// ── Tipe data profil ─────────────────────────────────────────────────────────
interface ProfileData {
  name: string;
  email: string;
  phone: string;
  jabatan: string;
  namaKWT: string;
  alamat: string;
  avatar: string;
}

const MAX_AVATAR_MB = 2;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// ── Input style ───────────────────────────────────────────────────────────────
const inputCls =
  'w-full p-3.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-2xl text-base font-medium text-[#221A12] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 focus:bg-white transition-all';

// ── Label ─────────────────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm font-bold text-[#172C05] mb-1.5">{children}</p>
);

// ── Halaman Profil Lite Mode ──────────────────────────────────────────────────
export const LiteProfilePage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profil' | 'sandi'>('profil');

  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    jabatan: '',
    namaKWT: '',
    alamat: '',
    avatar: '',
  });

  const [avatarError, setAvatarError] = useState('');
  const [passwords, setPasswords] = useState({ current: '', baru: '', konfirmasi: '' });
  const [showPw, setShowPw] = useState({ current: false, baru: false, konfirmasi: false });
  const [pwError, setPwError] = useState('');

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // ── Load profil dari backend ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const user = await authApi.getProfile();
        if (!cancelled && user) {
          setProfile({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            jabatan: user.jabatan || '',
            namaKWT: user.namaKWT || '',
            alamat: user.alamat || '',
            avatar: user.avatar || '',
          });
          // Sync localStorage agar header ikut update
          try {
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...stored, ...user }));
          } catch { /* abaikan */ }
        }
      } catch {
        // biarkan default
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Ganti foto ────────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Format foto tidak didukung. Gunakan JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setAvatarError(`Ukuran foto terlalu besar. Maksimal ${MAX_AVATAR_MB} MB.`);
      return;
    }
    setAvatarError('');
    const reader = new FileReader();
    reader.onload = (ev) => setProfile((p) => ({ ...p, avatar: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  // ── Simpan profil ─────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setToast({ msg: 'Nama lengkap tidak boleh kosong.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        jabatan: profile.jabatan,
        namaKWT: profile.namaKWT,
        alamat: profile.alamat,
        avatar: profile.avatar || undefined,
      });
      // Sync localStorage agar nama/avatar di header ikut update
      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, ...updated }));
      } catch { /* abaikan */ }
      setToast({ msg: 'Profil berhasil disimpan! 🎉', type: 'success' });
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan profil.';
      setToast({ msg, type: 'error' });
      if (/foto/i.test(msg)) setAvatarError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Ganti kata sandi ──────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (!passwords.current) { setPwError('Masukkan kata sandi saat ini.'); return; }
    if (passwords.baru.length < 8) { setPwError('Kata sandi baru minimal 8 karakter.'); return; }
    if (passwords.baru !== passwords.konfirmasi) { setPwError('Konfirmasi kata sandi tidak cocok. Coba lagi.'); return; }
    setSavingPw(true);
    try {
      await authApi.changePassword({ currentPassword: passwords.current, newPassword: passwords.baru });
      setPasswords({ current: '', baru: '', konfirmasi: '' });
      setToast({ msg: 'Kata sandi berhasil diubah! 🔐', type: 'success' });
    } catch (err: any) {
      setPwError(err instanceof Error ? err.message : 'Gagal mengubah kata sandi.');
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-[#C3E28D] border-t-[#2C4219] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#6B7280]">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-8">
      {/* Header halaman */}
      <div>
        <h1 className={LITE_CSS.pageTitle}>
          <User className="w-7 h-7 text-[#2C4219]" /> Profil Saya
        </h1>
        <p className={LITE_CSS.pageSubtitle}>Kelola informasi akun dan kata sandi Anda</p>
      </div>

      {/* Foto Profil — selalu tampil di atas */}
      <div className="bg-white rounded-3xl border border-[#ECE7DF] shadow-[0_4px_20px_rgba(44,66,25,0.03)] p-6 sm:p-7 flex flex-col items-center gap-4">
        <div className="relative">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt="Foto Profil"
              className="w-28 h-28 rounded-full object-cover ring-4 ring-[#C3E28D] shadow-md"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-4xl font-black ring-4 ring-[#C3E28D] shadow-md select-none">
              {profile.name ? profile.name.charAt(0).toUpperCase() : <Sprout className="w-12 h-12" />}
            </div>
          )}
          {/* Tombol ganti foto */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#2C4219] text-white flex items-center justify-center shadow-lg hover:bg-[#172C05] transition-colors cursor-pointer ring-2 ring-white"
            title="Ganti foto profil"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        <div className="text-center">
          <p className="text-xl font-black text-[#172C05]">{profile.name || 'Nama Pengguna'}</p>
          <p className="text-sm text-[#70766B] font-medium">{profile.jabatan || 'Anggota KWT'}</p>
          {profile.namaKWT && (
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#EBF7EE] text-[#1B5E20] border border-[#C8E6C9] text-xs font-bold">
              {profile.namaKWT}
            </span>
          )}
        </div>

        <p className="text-xs text-[#8A9084] text-center">
          Ketuk ikon kamera untuk mengganti foto · Format: JPG, PNG, WebP · Maks 2 MB
        </p>

        {avatarError && (
          <div className="w-full flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{avatarError}</span>
          </div>
        )}
      </div>

      {/* Tab: Profil | Kata Sandi */}
      <div className="flex gap-2 bg-[#F4EFEB] rounded-2xl p-1.5 border border-[#ECE7DF]">
        {([
          { id: 'profil', label: '👤 Data Saya', icon: User },
          { id: 'sandi', label: '🔒 Ganti Sandi', icon: Shield },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-[#172C05] shadow-xs'
                : 'text-[#70766B] hover:text-[#2D3328]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Data Profil ────────────────────────────────────────────── */}
      {activeTab === 'profil' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-[#ECE7DF] shadow-[0_4px_20px_rgba(44,66,25,0.03)] p-6 space-y-4">
          <h2 className="text-lg font-black text-[#172C05] mb-1">Informasi Pribadi</h2>

          {/* Nama Lengkap */}
          <div>
            <Label>Nama Lengkap</Label>
            <div className="relative">
              <User className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: Ibu Sari Dewi"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label>Alamat Email</Label>
            <div className="relative">
              <Mail className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                placeholder="Contoh: ibu.sari@gmail.com"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          {/* Nomor Telepon */}
          <div>
            <Label>Nomor Telepon / WhatsApp</Label>
            <div className="relative">
              <Phone className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Contoh: 0812-3456-7890"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          {/* Jabatan */}
          <div>
            <Label>Jabatan / Peran</Label>
            <input
              type="text"
              value={profile.jabatan}
              onChange={(e) => setProfile((p) => ({ ...p, jabatan: e.target.value }))}
              placeholder="Contoh: Ketua KWT, Anggota, Bendahara"
              className={inputCls}
            />
          </div>

          {/* Nama KWT */}
          <div>
            <Label>Nama Kelompok Wanita Tani</Label>
            <div className="relative">
              <Sprout className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={profile.namaKWT}
                onChange={(e) => setProfile((p) => ({ ...p, namaKWT: e.target.value }))}
                placeholder="Contoh: KWT Melati Desa Parung"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          {/* Alamat */}
          <div>
            <Label>Alamat / Domisili</Label>
            <div className="relative">
              <MapPin className="w-4.5 h-4.5 absolute left-3.5 top-3.5 text-[#9CA3AF]" />
              <textarea
                value={profile.alamat}
                onChange={(e) => setProfile((p) => ({ ...p, alamat: e.target.value }))}
                rows={2}
                placeholder="Contoh: Desa Parung, Kec. Cisarua, Bogor"
                className={`${inputCls} pl-10 resize-none`}
              />
            </div>
          </div>

          {/* Tombol Simpan */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-[#2C4219] text-white text-base font-bold hover:bg-[#172C05] transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2.5 mt-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Menyimpan...' : 'Simpan Data Profil'}
          </button>
        </form>
      )}

      {/* ── TAB: Ganti Kata Sandi ───────────────────────────────────────── */}
      {activeTab === 'sandi' && (
        <form onSubmit={handleChangePassword} className="bg-white rounded-3xl border border-[#c4c8bb]/20 shadow-sm p-5 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Tips Keamanan</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Gunakan kata sandi yang mudah Anda ingat tapi susah ditebak orang lain. Minimal 8 karakter.
              </p>
            </div>
          </div>

          {/* Kata sandi saat ini */}
          <div>
            <Label>Kata Sandi Saat Ini</Label>
            <div className="relative">
              <Lock className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type={showPw.current ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                placeholder="Masukkan kata sandi lama"
                className={`${inputCls} pl-10 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#2C4219] cursor-pointer transition-colors"
              >
                {showPw.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Kata sandi baru */}
          <div>
            <Label>Kata Sandi Baru</Label>
            <div className="relative">
              <Lock className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type={showPw.baru ? 'text' : 'password'}
                value={passwords.baru}
                onChange={(e) => setPasswords((p) => ({ ...p, baru: e.target.value }))}
                placeholder="Minimal 8 karakter"
                className={`${inputCls} pl-10 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => ({ ...s, baru: !s.baru }))}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#2C4219] cursor-pointer transition-colors"
              >
                {showPw.baru ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Indikator kekuatan */}
            {passwords.baru.length > 0 && (
              <div className="mt-2 flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      passwords.baru.length >= (i + 1) * 3
                        ? passwords.baru.length >= 12
                          ? 'bg-green-500'
                          : passwords.baru.length >= 8
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
                <p className="text-xs font-semibold ml-1 text-[#6B7280]">
                  {passwords.baru.length >= 12 ? 'Kuat' : passwords.baru.length >= 8 ? 'Cukup' : 'Lemah'}
                </p>
              </div>
            )}
          </div>

          {/* Konfirmasi kata sandi */}
          <div>
            <Label>Ulangi Kata Sandi Baru</Label>
            <div className="relative">
              <Lock className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type={showPw.konfirmasi ? 'text' : 'password'}
                value={passwords.konfirmasi}
                onChange={(e) => setPasswords((p) => ({ ...p, konfirmasi: e.target.value }))}
                placeholder="Ketik ulang kata sandi baru"
                className={`${inputCls} pl-10 pr-12 ${
                  passwords.konfirmasi && passwords.baru !== passwords.konfirmasi
                    ? 'border-red-300 bg-red-50'
                    : passwords.konfirmasi && passwords.baru === passwords.konfirmasi
                    ? 'border-green-300 bg-green-50/30'
                    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => ({ ...s, konfirmasi: !s.konfirmasi }))}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#2C4219] cursor-pointer transition-colors"
              >
                {showPw.konfirmasi ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {/* Ikon centang jika cocok */}
              {passwords.konfirmasi && passwords.baru === passwords.konfirmasi && (
                <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-10 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>

          {/* Error */}
          {pwError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 font-semibold">{pwError}</p>
            </div>
          )}

          {/* Tombol Ubah */}
          <button
            type="submit"
            disabled={savingPw}
            className="w-full py-4 rounded-2xl bg-[#2C4219] text-white text-base font-bold hover:bg-[#172C05] transition-all shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2.5 mt-2"
          >
            <Shield className="w-5 h-5" />
            {savingPw ? 'Mengubah Sandi...' : 'Simpan Kata Sandi Baru'}
          </button>
        </form>
      )}

      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
