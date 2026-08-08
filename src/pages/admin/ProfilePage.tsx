import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Camera,
  Save,
  Eye,
  EyeOff,
  Edit3,
  Sprout,
  Lock,
  AlertCircle,
  Leaf,
  KeyRound,
  Copy,
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { authApi } from '../../api/endpoints/authApi';
import { apiKeyApi, ApiKey, ApiKeyCreated } from '../../api/endpoints/apiKeyApi';
import { Toast } from '../../components/common/Toast';

// ---------- Types ----------
interface ProfileData {
  name: string;
  email: string;
  phone: string;
  jabatan: string;
  namaKWT: string;
  alamat: string;
  kecamatan: string;
  kabupaten: string;
  bio: string;
  avatar: string;
}

// ---------- Section Card wrapper ----------
const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#c4c8bb]/20 bg-[#F7F7F5]">
      <span className="text-[#2C4219]">{icon}</span>
      <h3 className="text-sm font-bold text-[#172C05]">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ---------- Labeled field ----------
const Field: React.FC<{ label: string; id: string; children: React.ReactNode }> = ({ label, id, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-[10px] font-bold text-[#172C05] uppercase tracking-wider">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  'w-full px-3 py-2 bg-[#F7F7F5] border border-[#c4c8bb]/40 rounded-xl text-xs font-medium text-[#221A12] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 focus:border-[#2C4219] focus:bg-white transition-all';

// ---------- Main component ----------
export const ProfilePage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState<'profil' | 'keamanan'>('profil');

  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    jabatan: '',
    namaKWT: '',
    alamat: '',
    kecamatan: '',
    kabupaten: '',
    bio: '',
    avatar: '',
  });

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwError, setPwError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const MAX_AVATAR_MB = 2;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  // ── State API Key (tab Pengaturan) ──
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysToast, setKeysToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Muat profil dari backend saat halaman dibuka
  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const user = await authApi.getProfile();
        if (!cancelled && user) {
          setProfile((p) => ({
            ...p,
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            jabatan: user.jabatan || '',
            namaKWT: user.namaKWT || '',
            alamat: user.alamat || '',
            kecamatan: user.kecamatan || '',
            kabupaten: user.kabupaten || '',
            bio: user.bio || '',
            avatar: user.avatar || '',
          }));
        }
      } catch {
        // Biarkan state default kosong
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset agar bisa pilih file sama lagi
    if (!file) return;

    // Validasi tipe file
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError('Format foto tidak didukung! Gunakan JPG, PNG, atau WebP.');
      return;
    }

    // Validasi ukuran (maks 2 MB)
    const maxBytes = MAX_AVATAR_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setAvatarError(`Ukuran foto terlalu besar! Maksimal ${MAX_AVATAR_MB} MB (file Anda ${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setAvatarError('');
    const reader = new FileReader();
    reader.onload = (ev) => setProfile((p) => ({ ...p, avatar: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    try {
      await authApi.updateProfile({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        jabatan: profile.jabatan,
        namaKWT: profile.namaKWT,
        alamat: profile.alamat,
        kecamatan: profile.kecamatan,
        kabupaten: profile.kabupaten,
        bio: profile.bio,
        avatar: profile.avatar || undefined,
      });
      setSaveSuccess('Profil berhasil disimpan!');
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan profil.';
      setSaveError(msg);
      // Jika server tolak avatar, tampilkan juga sebagai avatarError
      if (/foto profil/i.test(msg)) {
        setAvatarError(msg);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (passwords.new.length < 8) { setPwError('Kata sandi baru minimal 8 karakter.'); return; }
    if (passwords.new !== passwords.confirm) { setPwError('Konfirmasi kata sandi tidak cocok.'); return; }
    try {
      await authApi.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      setPasswords({ current: '', new: '', confirm: '' });
      setPasswordSuccess('Kata sandi berhasil diperbarui!');
      setTimeout(() => setPasswordSuccess(''), 3500);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Gagal mengganti kata sandi.');
    }
  };

  const tabs = [
    { id: 'profil' as const, label: 'Data Profil', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'keamanan' as const, label: 'Keamanan Akun', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'pengaturan' as const, label: 'Pengaturan', icon: <KeyRound className="w-3.5 h-3.5" /> },
  ];

  // Muat daftar API key saat halaman dibuka
  useEffect(() => {
    let cancelled = false;
    const loadKeys = async () => {
      try {
        const keys = await apiKeyApi.getAll();
        if (!cancelled) setApiKeys(keys);
      } catch {
        if (!cancelled) setKeysToast({ msg: 'Gagal memuat daftar API key.', type: 'error' });
      } finally {
        if (!cancelled) setKeysLoading(false);
      }
    };
    loadKeys();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setKeysToast({ msg: 'Nama API key wajib diisi.', type: 'error' });
      return;
    }
    setCreatingKey(true);
    try {
      const created = await apiKeyApi.create(newKeyName.trim());
      setCreatedKey(created);
      setApiKeys((prev) => [
        {
          id: created.id,
          nama: created.nama,
          keyPreview: `${created.keyValue.slice(0, 12)}...${created.keyValue.slice(-4)}`,
          isActive: true,
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
          revokedAt: null,
        },
        ...prev,
      ]);
      setNewKeyName('');
      setCopiedKey(false);
      setKeysToast({ msg: 'API key berhasil dibuat.', type: 'success' });
    } catch (err: any) {
      setKeysToast({ msg: err?.response?.data?.message || 'Gagal membuat API key.', type: 'error' });
    } finally {
      setCreatingKey(false);
    }
  };

  const handleCopyKey = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    } catch {
      setKeysToast({ msg: 'Gagal menyalin ke clipboard.', type: 'error' });
    }
  };

  const handleToggleKey = async (key: ApiKey) => {
    try {
      const updated = await apiKeyApi.update(key.id, !key.isActive);
      setApiKeys((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
      setKeysToast({ msg: updated.isActive ? 'API key diaktifkan.' : 'API key dinonaktifkan.', type: 'success' });
    } catch (err: any) {
      setKeysToast({ msg: err?.response?.data?.message || 'Gagal memperbarui API key.', type: 'error' });
    }
  };

  const handleDeleteKey = async (key: ApiKey) => {
    if (!window.confirm(`Hapus API key "${key.nama}"?`)) return;
    try {
      await apiKeyApi.delete(key.id);
      setApiKeys((prev) => prev.filter((k) => k.id !== key.id));
      setKeysToast({ msg: 'API key berhasil dihapus.', type: 'success' });
    } catch (err: any) {
      setKeysToast({ msg: err?.response?.data?.message || 'Gagal menghapus API key.', type: 'error' });
    }
  };

  const pwFieldConfig: { key: 'current' | 'new' | 'confirm'; label: string }[] = [
    { key: 'current', label: 'Kata Sandi Saat Ini' },
    { key: 'new', label: 'Kata Sandi Baru' },
    { key: 'confirm', label: 'Konfirmasi Kata Sandi Baru' },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-[#172C05] flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#C3E28D]/40 text-[#2C4219] flex items-center justify-center">
            <User className="w-4 h-4" />
          </span>
          Profil Pengguna
        </h1>
        <p className="text-xs text-[#6B7280] font-medium mt-0.5 ml-9">
          Kelola informasi pribadi dan keamanan akun Anda
        </p>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-[#2C4219] via-[#304a1c] to-[#1a2c0f] rounded-2xl p-5 sm:p-7 flex flex-col sm:flex-row items-center sm:items-start gap-5 relative overflow-hidden shadow-xl border border-[#C3E28D]/20">
        <div className="absolute -top-12 -right-12 w-52 h-52 bg-[#C3E28D]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-[#A8B774]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar */}
        <div className="relative shrink-0 z-10">
          <img
            src={profile.avatar}
            alt="Foto Profil"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white/20 shadow-2xl"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#C3E28D] text-[#172C05] flex items-center justify-center shadow-lg hover:bg-white transition-colors cursor-pointer border-2 border-[#2C4219]"
            title="Ganti foto profil"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Info */}
        <div className="text-center sm:text-left z-10 space-y-2 flex-1">
          <p className="text-white font-bold text-lg leading-tight">{profile.name}</p>
          <p className="text-[#d4e8b8]/80 text-xs font-medium">{profile.email}</p>
          <p className="text-[#A8B774]/70 text-[11px] leading-relaxed max-w-md">{profile.bio}</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C3E28D]/20 border border-[#C3E28D]/30 text-[#C3E28D] text-[10px] font-bold">
              <Leaf className="w-3 h-3" />{profile.jabatan}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-[10px] font-semibold">
              <Sprout className="w-3 h-3" />{profile.namaKWT}
            </span>
          </div>
        </div>

        <div className="sm:self-start z-10 shrink-0">
          <span className="flex items-center gap-1.5 text-[10px] text-[#A8B774]/80 font-semibold">
            <Edit3 className="w-3 h-3" /> Klik kamera untuk ganti foto
          </span>
          <span className="block text-[9px] text-[#A8B774]/60 font-medium mt-1">
            Maks {MAX_AVATAR_MB} MB · JPG, PNG, atau WebP
          </span>
        </div>
      </div>

      {/* Error notifikasi avatar */}
      {avatarError && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p>{avatarError}</p>
            <p className="text-[11px] font-normal text-red-500 mt-0.5">Pilih foto lain dengan ukuran lebih kecil.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[#c4c8bb]/30 rounded-xl p-1 w-fit shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#2C4219] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#2C4219] hover:bg-[#F7F7F5]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB PROFIL ===== */}
      {activeTab === 'profil' && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-24 bg-[#F7F7F5] animate-pulse rounded" />
                  <div className="h-9 bg-[#F7F7F5] animate-pulse rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
          <>
          <SectionCard title="Informasi Pribadi" icon={<User className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nama Lengkap" id="name">
                <input
                  id="name" type="text" value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className={inputCls} placeholder="Nama Lengkap" required
                />
              </Field>
              <Field label="Jabatan / Peran" id="jabatan">
                <input
                  id="jabatan" type="text" value="Admin"
                  disabled
                  className={`${inputCls} opacity-60 cursor-not-allowed`}
                />
              </Field>
              <Field label="Nama Kelompok Wanita Tani" id="namaKWT">
                <input
                  id="namaKWT" type="text" value={profile.namaKWT}
                  onChange={(e) => setProfile((p) => ({ ...p, namaKWT: e.target.value }))}
                  className={inputCls} placeholder="Nama KWT"
                />
              </Field>
              <Field label="Bio / Deskripsi Singkat" id="bio">
                <input
                  id="bio" type="text" value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  className={inputCls} placeholder="Deskripsi peran Anda"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Kontak & Alamat" icon={<Phone className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email Aktif" id="email">
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    id="email" type="email" value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    className={`${inputCls} pl-9`} placeholder="email@kwt.com" required
                  />
                </div>
              </Field>
              <Field label="Nomor WhatsApp / HP" id="phone">
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    id="phone" type="tel" value={profile.phone}
                    onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    className={`${inputCls} pl-9`} placeholder="0812-xxxx-xxxx"
                  />
                </div>
              </Field>
              <Field label="Alamat Desa / Dusun" id="alamat">
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    id="alamat" type="text" value={profile.alamat}
                    onChange={(e) => setProfile((p) => ({ ...p, alamat: e.target.value }))}
                    className={`${inputCls} pl-9`} placeholder="Alamat lengkap"
                  />
                </div>
              </Field>
              <Field label="Kecamatan" id="kecamatan">
                <input
                  id="kecamatan" type="text" value={profile.kecamatan}
                  onChange={(e) => setProfile((p) => ({ ...p, kecamatan: e.target.value }))}
                  className={inputCls} placeholder="Nama Kecamatan"
                />
              </Field>
              <Field label="Kabupaten / Kota" id="kabupaten">
                <input
                  id="kabupaten" type="text" value={profile.kabupaten}
                  onChange={(e) => setProfile((p) => ({ ...p, kabupaten: e.target.value }))}
                  className={inputCls} placeholder="Kabupaten / Kota"
                />
              </Field>
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2C4219] text-white font-bold text-sm hover:bg-[#213213] shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Memuat...' : 'Simpan Perubahan'}
            </button>
          </div>
          </>
          )}
        </form>
      )}

      {/* ===== TAB KEAMANAN ===== */}
      {activeTab === 'keamanan' && (
        <div className="space-y-4">
          <form onSubmit={handleChangePassword}>
            <SectionCard title="Ubah Kata Sandi" icon={<Lock className="w-4 h-4" />}>
              <div className="space-y-4 max-w-md">
                {pwFieldConfig.map(({ key, label }) => (
                  <Field label={label} id={`pw-${key}`} key={key}>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                      <input
                        id={`pw-${key}`}
                        type={showPw[key] ? 'text' : 'password'}
                        value={passwords[key]}
                        onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder="••••••••"
                        className={`${inputCls} pl-9 pr-9`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => ({ ...s, [key]: !s[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#2C4219] transition-colors cursor-pointer"
                      >
                        {showPw[key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </Field>
                ))}
                <p className="text-[10px] text-[#9CA3AF] font-medium pt-0.5">
                  ✓ Minimal 8 karakter &nbsp;·&nbsp; ✓ Kombinasi huruf & angka disarankan
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2C4219] text-white font-bold text-xs hover:bg-[#213213] shadow-sm transition-all cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Perbarui Kata Sandi
                </button>
              </div>
            </SectionCard>
          </form>

          <SectionCard title="Informasi Akun" icon={<Shield className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-0.5">
                <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">Status Akun</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-[#172C05]">Aktif & Terverifikasi</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">Hak Akses</p>
                <span className="font-semibold text-[#2C4219]">Manajer SCM — Akses Penuh</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">Tanggal Bergabung</p>
                <span className="font-semibold text-[#172C05]">15 Maret 2021</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider">Login Terakhir</p>
                <span className="font-semibold text-[#172C05]">Hari ini, 08:44 WIB</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ===== TAB PENGATURAN (API Key) ===== */}
      {activeTab === 'pengaturan' && (
        <div className="space-y-4">
          <SectionCard title="API Key (Akses Read-Only)" icon={<KeyRound className="w-4 h-4" />}>
            <div className="space-y-4">
              <div className="p-4 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl">
                <p className="text-xs font-bold text-[#2C4219] mb-1">🔑 Kunci API untuk integrasi data</p>
                <p className="text-[11px] text-[#6B7280] leading-relaxed">
                  Gunakan API key ini untuk membaca data dari luar (laporan, website, aplikasi lain) tanpa login.
                  Header: <code className="bg-white border border-[#c4c8bb]/30 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#2C4219]">x-api-key</code>.
                  API key <b>hanya bisa membaca</b> (GET) — perubahan data tetap butuh login admin.
                  Dokumentasi lengkap tersedia di{' '}
                  <a
                    href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/docs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#2C4219] font-bold hover:underline"
                  >
                    /api/docs <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              {/* Form buat key baru */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Nama API key (contoh: Aplikasi Laporan)"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={handleCreateKey}
                  disabled={creatingKey}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C4219] text-white font-bold text-xs hover:bg-[#213213] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {creatingKey ? 'Membuat...' : 'Buat API Key'}
                </button>
              </div>

              {/* Key baru dibuat — tampilkan SEKALI */}
              {createdKey && (
                <div className="p-4 bg-[#2C4219] text-white rounded-xl space-y-2">
                  <p className="text-xs font-bold text-[#C3E28D] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> API Key baru berhasil dibuat!
                  </p>
                  <p className="text-[11px] text-[#efe0d2]/80">
                    Salin sekarang — <b>tidak akan ditampilkan lagi</b>.
                  </p>
                  <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-lg p-2">
                    <code className="flex-1 text-[11px] font-mono break-all text-[#C3E28D]">
                      {createdKey.keyValue}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(createdKey.keyValue)}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C3E28D] text-[#172C05] text-[10px] font-bold hover:bg-white transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedKey ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCreatedKey(null)}
                    className="text-[10px] text-[#efe0d2]/70 hover:text-white underline cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {/* Daftar key */}
              <div>
                <p className="text-[10px] font-bold text-[#172C05] uppercase tracking-wider mb-2">
                  Daftar API Key
                </p>
                {keysLoading ? (
                  <div className="text-xs text-[#9CA3AF] py-4 text-center">Memuat...</div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-xs text-[#9CA3AF] py-4 text-center">
                    Belum ada API key. Buat satu di atas.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map((k) => (
                      <div
                        key={k.id}
                        className="flex items-center justify-between gap-3 p-3 bg-white border border-[#c4c8bb]/30 rounded-xl"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#221A12] truncate flex items-center gap-1.5">
                            <KeyRound className="w-3 h-3 text-[#2C4219] shrink-0" />
                            {k.nama}
                          </p>
                          <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5 truncate">
                            {k.keyPreview}
                          </p>
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                            Dibuat: {new Date(k.createdAt).toLocaleDateString('id-ID')}
                            {k.lastUsedAt ? ` · Terakhir dipakai: ${new Date(k.lastUsedAt).toLocaleDateString('id-ID')}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleKey(k)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              k.isActive
                                ? 'bg-[#C3E28D]/40 text-[#2C4219] hover:bg-[#C3E28D]/60'
                                : 'bg-[#F7F7F5] text-[#9CA3AF] hover:bg-[#efe0d2]'
                            }`}
                          >
                            {k.isActive ? 'Aktif' : 'Nonaktif'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteKey(k)}
                            title="Hapus API key"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Toast Floating Notifikasi */}
      <Toast message={saveError} type="error" onClose={() => setSaveError('')} />
      <Toast message={saveSuccess} type="success" onClose={() => setSaveSuccess('')} />
      <Toast message={pwError} type="error" onClose={() => setPwError('')} />
      <Toast message={passwordSuccess} type="success" onClose={() => setPasswordSuccess('')} />
      {keysToast && (
        <Toast message={keysToast.msg} type={keysToast.type} onClose={() => setKeysToast(null)} />
      )}
    </div>
  );
};
