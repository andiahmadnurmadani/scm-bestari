import React, { useState, useRef } from 'react';
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
  CheckCircle2,
  Edit3,
  Sprout,
  Lock,
  AlertCircle,
  Leaf,
} from 'lucide-react';

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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profil' | 'keamanan'>('profil');

  const [profile, setProfile] = useState<ProfileData>({
    name: 'Ibu KWT Mawar',
    email: 'kwt.sorgum@gmail.com',
    phone: '0812-3456-7890',
    jabatan: 'Manajer SCM',
    namaKWT: 'KWT Subang Mandiri',
    alamat: 'Jl. Sorgum No. 12, Desa Cijambe',
    kecamatan: 'Cijambe',
    kabupaten: 'Subang, Jawa Barat',
    bio: 'Pengelola rantai pasok sorgum KWT Subang Mandiri sejak 2021.',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCaXEzYVwh8rBuM7PtbQrpP39W0HmakJ4kHsPwX7_vIZgRvfmqm9pRP7szJLdko2G45UQYO6M8aY_i21j9x3xP65UULd5xpGsQFN_UJLI_uhaMGDzoeASs_69MYwt__JwI7APZiqq772N9JKeOU5BvNgzdWn6GnagOmEqSIELGYuWu1lmmQwuMjv7jMWicYeALwoLwWCWLovQjtbqzrS6MtD5xNOIkU9WUx6BIywUugUVIF0XwaXwzJ',
  });

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwError, setPwError] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfile((p) => ({ ...p, avatar: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (passwords.new.length < 8) { setPwError('Kata sandi baru minimal 8 karakter.'); return; }
    if (passwords.new !== passwords.confirm) { setPwError('Konfirmasi kata sandi tidak cocok.'); return; }
    setPasswords({ current: '', new: '', confirm: '' });
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 3500);
  };

  const tabs = [
    { id: 'profil' as const, label: 'Data Profil', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'keamanan' as const, label: 'Keamanan Akun', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

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
        </div>
      </div>

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
          {saveSuccess && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Profil berhasil disimpan!
            </div>
          )}

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
                <select
                  id="jabatan" value={profile.jabatan}
                  onChange={(e) => setProfile((p) => ({ ...p, jabatan: e.target.value }))}
                  className={inputCls}
                >
                  <option>Manajer SCM</option>
                  <option>Koordinator Panen</option>
                  <option>Bendahara KWT</option>
                  <option>Sekretaris KWT</option>
                  <option>Anggota</option>
                </select>
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
                    className={`${inputCls} pl-9`} placeholder="email@kwt.com"
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2C4219] text-white font-bold text-sm hover:bg-[#213213] shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      )}

      {/* ===== TAB KEAMANAN ===== */}
      {activeTab === 'keamanan' && (
        <div className="space-y-4">
          {passwordSuccess && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Kata sandi berhasil diperbarui!
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <SectionCard title="Ubah Kata Sandi" icon={<Lock className="w-4 h-4" />}>
              <div className="space-y-4 max-w-md">
                {pwError && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {pwError}
                  </div>
                )}
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
    </div>
  );
};
