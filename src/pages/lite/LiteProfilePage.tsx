import React, { useEffect, useState } from 'react';
import { User as UserIcon, KeyRound, Camera, Save } from 'lucide-react';
import { authApi } from '../../api/endpoints/authApi';
import { Toast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';

export const LiteProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [avatar, setAvatar] = useState<string>('');
  const [avatarError, setAvatarError] = useState('');

  const [formData, setFormData] = useState({ name: '', phone: '', jabatan: '', namaKWT: '' });
  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    authApi.getProfile().then((u) => {
      setUser(u);
      setAvatar(u?.avatar || '');
      setFormData({
        name: u?.name || '',
        phone: u?.phone || '',
        jabatan: u?.jabatan || '',
        namaKWT: u?.namaKWT || '',
      });
    }).catch(() => {});
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAvatarError('');
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Foto harus JPG/PNG/WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Ukuran foto maksimal 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.updateProfile({ ...formData, avatar });
      setToast({ msg: 'Profil berhasil diperbarui.', type: 'success' });
    } catch (err: any) {
      setToast({ msg: err?.message || 'Gagal memperbarui profil.', type: 'error' });
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwData.currentPassword || !pwData.newPassword) {
      setToast({ msg: 'Isi kata sandi lama dan baru.', type: 'error' });
      return;
    }
    if (pwData.newPassword.length < 6) {
      setToast({ msg: 'Kata sandi baru minimal 6 karakter.', type: 'error' });
      return;
    }
    if (pwData.newPassword !== pwData.confirmPassword) {
      setToast({ msg: 'Konfirmasi kata sandi tidak cocok.', type: 'error' });
      return;
    }
    try {
      await authApi.changePassword({ currentPassword: pwData.currentPassword, newPassword: pwData.newPassword });
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setToast({ msg: 'Kata sandi berhasil diganti.', type: 'success' });
    } catch (err: any) {
      setToast({ msg: err?.message || 'Gagal mengganti kata sandi.', type: 'error' });
    }
  };

  if (!user) {
    return <p className="text-center text-xs text-[#6B7280] py-10">Memuat profil...</p>;
  }

  const inputCls = 'w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm';
  const labelCls = 'block text-xs font-bold text-[#2C4219] mb-1';

  return (
    <div className="space-y-5 pb-6">
      <h1 className="text-lg sm:text-xl font-extrabold text-[#172C05]">Profil Saya</h1>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-5 flex flex-col sm:flex-row items-center gap-5">
        <div className="relative shrink-0">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-[#C3E28D]/40" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-3xl font-black">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2C4219] text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-[#213213]">
            <Camera className="w-3.5 h-3.5" />
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </label>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-lg font-extrabold text-[#172C05]">{user.name}</p>
          <p className="text-xs text-[#6B7280]">{user.email}</p>
          <p className="text-[11px] font-bold text-[#2C4219] mt-1 inline-block px-2 py-0.5 rounded-md bg-[#C3E28D]/30">{user.role || 'Anggota KWT'}</p>
          {avatarError && <p className="text-[11px] text-red-600 mt-1">{avatarError}</p>}
        </div>
      </div>

      {/* Edit profil */}
      <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-5 space-y-3.5">
        <h2 className="text-sm font-bold text-[#172C05] flex items-center gap-2"><UserIcon className="w-4 h-4 text-[#2C4219]" /> Data Diri</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className={labelCls}>Nama Lengkap</label>
            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="Nama Anda" />
          </div>
          <div>
            <label className={labelCls}>No. HP</label>
            <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} placeholder="08xxxx" />
          </div>
          <div>
            <label className={labelCls}>Jabatan</label>
            <input value={formData.jabatan} onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })} className={inputCls} placeholder="Contoh: Ketua KWT" />
          </div>
          <div>
            <label className={labelCls}>Nama Kelompok</label>
            <input value={formData.namaKWT} onChange={(e) => setFormData({ ...formData, namaKWT: e.target.value })} className={inputCls} placeholder="Contoh: KWT Melati" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary"><Save className="w-4 h-4" /> Simpan Profil</Button>
        </div>
      </form>

      {/* Ganti password */}
      <form onSubmit={changePassword} className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-5 space-y-3.5">
        <h2 className="text-sm font-bold text-[#172C05] flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#2C4219]" /> Ganti Kata Sandi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className={labelCls}>Kata Sandi Lama</label>
            <input type="password" value={pwData.currentPassword} onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })} className={inputCls} placeholder="••••••" />
          </div>
          <div>
            <label className={labelCls}>Kata Sandi Baru</label>
            <input type="password" value={pwData.newPassword} onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })} className={inputCls} placeholder="Minimal 6 karakter" />
          </div>
          <div>
            <label className={labelCls}>Ulangi Kata Sandi Baru</label>
            <input type="password" value={pwData.confirmPassword} onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })} className={inputCls} placeholder="Ulangi" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="secondary"><KeyRound className="w-4 h-4" /> Ganti Kata Sandi</Button>
        </div>
      </form>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
