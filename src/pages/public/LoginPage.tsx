import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Lock, Mail, ArrowRight, Tractor, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api/endpoints/authApi';
import { useCms } from '../../context/CmsContext';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import sorghumGrainImg from '../../assets/sorghum_grain.jpg';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { cms } = useCms();
  // Aplikasi single-user: kredensial diisi otomatis, user tinggal klik Masuk
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin@sorgum.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!usernameOrEmail || !password) {
      setError('Silakan isi Username/Email dan Kata Sandi.');
      return;
    }

    setLoading(true);
    try {
      await authApi.login({ usernameOrEmail, password });
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal masuk. Periksa kembali kredensial Anda.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5]">
      <PublicNavbar />

      <main className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-[#c4c8bb]/30 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          {/* Left Side: Form */}
          <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-between">
            {/* Top Brand Header */}
            <div className="flex items-center gap-2 mb-6">
              {cms.logo ? (
                <img
                  src={cms.logo}
                  alt={cms.siteName || 'Logo'}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-[#c4c8bb]/30 shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#2C4219] text-[#C3E28D] flex items-center justify-center shadow-2xs">
                  <Tractor className="w-4 h-4" />
                </div>
              )}
              <span className="text-sm font-bold text-[#2C4219]">{cms.siteName || 'Sorgum SCM'}</span>
            </div>

            {/* Form Content */}
            <div className="space-y-5 flex-1 flex flex-col justify-center">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#172C05]">Masuk ke Akun Anda</h2>
                <p className="text-xs text-[#6B7280]">
                  Silakan masukkan kredensial KWT Anda untuk melanjutkan
                </p>
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-[11px] rounded-lg font-medium text-center text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#172C05] uppercase tracking-wider mb-1">
                    Username / Email KWT
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type="text"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder="kwt.sorgum@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2 bg-[#F7F7F5] border border-[#c4c8bb]/40 rounded-xl text-xs font-medium text-[#221A12] focus:outline-none focus:ring-1 focus:ring-[#2C4219] focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#172C05] uppercase tracking-wider mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 bg-[#F7F7F5] border border-[#c4c8bb]/40 rounded-xl text-xs font-medium text-[#221A12] focus:outline-none focus:ring-1 focus:ring-[#2C4219] focus:bg-white transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#2C4219] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#44483e]">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-[#c4c8bb] text-[#2C4219] focus:ring-[#2C4219]"
                    />
                    Ingat Saya
                  </label>
                </div>

                {/* Login Button Full Width */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 rounded-full bg-[#2C4219] text-white hover:bg-[#213213] font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      'Memproses...'
                    ) : (
                      <>
                        <span>Masuk</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C3E28D]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Footer Credits */}
            <div className="text-[10px] text-[#6B7280] mt-6 border-t border-[#c4c8bb]/20 pt-3">
              <span>Sorgum SCM • Kelompok Wanita Tani Indonesia</span>
            </div>
          </div>

          {/* Right Side: Sorghum Image Cover */}
          <div className="hidden md:block md:w-1/2 relative">
            <img
              src={sorghumGrainImg}
              alt="Bulir Sorgum"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Visual gradient overlay matching the green palette */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#172C05]/80 via-[#2C4219]/30 to-[#172C05]/20" />
            <div className="absolute bottom-8 left-8 right-8 text-white space-y-2 z-10">
              <h3 className="text-lg font-bold leading-tight">Digitalisasi Rantai Pasok Sorgum</h3>
              <p className="text-xs text-[#efe0d2] leading-relaxed">
                Meningkatkan produktivitas, transparansi, dan kesejahteraan Kelompok Wanita Tani melalui teknologi terintegrasi.
              </p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
