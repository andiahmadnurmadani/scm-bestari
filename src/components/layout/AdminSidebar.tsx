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
  Database,
  HelpCircle,
  LogOut,
  X,
  BookOpen,
  Eye,
  Pencil,
  ChevronDown,
  Settings,
  AlertCircle,
  Headphones,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { authApi } from '../../api/endpoints/authApi';
import { Modal } from '../common/Modal';
import { useCms } from '../../context/CmsContext';

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isMobileOpen = false,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}) => {
  const { cms } = useCms();
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
    { label: 'Kelola Olahan', path: '/dashboard/produksi', icon: Factory },
    { label: 'Kelola Sertifikat', path: '/dashboard/sertifikat', icon: Award },
    { label: 'Kelola Data Kemasan', path: '/dashboard/kemasan', icon: Package },
    { label: 'Logistik', path: '/dashboard/logistik', icon: Truck },
    { label: 'Varietas Sorgum', path: '/dashboard/master/varietas', icon: Database },
  ];

  const sidebarContent = (
    <div
      className={`flex flex-col h-full bg-[#FFF8F4] border-r border-[#c4c8bb]/20 p-3 justify-between select-none transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      <div>
        {/* Logo Banner */}
        <div className="flex items-center justify-between mb-4 px-1 pt-0.5">
          <div className="flex items-center gap-2">
            {cms.logo ? (
              <img
                src={cms.logo}
                alt={cms.siteName || 'Logo'}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#c4c8bb]/30 shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#2C4219] flex items-center justify-center shrink-0 shadow-2xs">
                <Sprout className="w-3.5 h-3.5 text-[#C3E28D]" />
              </div>
            )}
            {!collapsed && (
              <div className="flex flex-col">
                <h1 className="text-sm font-extrabold text-[#172C05] leading-none whitespace-nowrap">
                  {cms.siteName || 'Sorgum SCM'}
                </h1>
                <p className="text-[9px] font-bold text-[#44483e] tracking-wider uppercase mt-0.5">
                  {cms.siteTagline || 'Sistem Manajemen'}
                </p>
              </div>
            )}
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
                title={collapsed ? item.label : undefined}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    collapsed ? 'justify-center px-1.5' : ''
                  } ${
                    isActive
                      ? 'bg-[#C3E28D] text-[#172C05] font-semibold shadow-2xs'
                      : 'text-[#44483e] hover:text-[#172C05] hover:bg-[#efe0d2]/50'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Tombol collapse/expand — di tengah sidebar, antara menu & footer */}
      {onToggleCollapse && (
        <div className="pt-3 pb-1">
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Perluas menu' : 'Ciutkan menu'}
            className={`hidden lg:flex w-full items-center gap-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
              collapsed
                ? 'justify-center px-1.5 py-2.5 bg-[#fff1e5] text-[#2C4219] hover:bg-[#efe0d2]'
                : 'px-3 py-2.5 bg-[#fff1e5] text-[#2C4219] hover:bg-[#efe0d2]'
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0" />
                <span>Ciutkan menu</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Utility Bottom Links */}
      <div className="pt-3 border-t border-[#c4c8bb]/30 space-y-0.5">
        <button
          onClick={() => setHelpModalOpen(true)}
          title={collapsed ? 'Bantuan' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-[#44483e] hover:text-[#172C05] hover:bg-[#efe0d2]/50 transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-1.5' : ''
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Bantuan</span>}
        </button>

        <button
          onClick={handleLogoutClick}
          title={collapsed ? 'Keluar' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-1.5' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      {/* Help Modal */}
      <Modal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="Pusat Bantuan Sorgum SCM"
        subtitle="Panduan Penggunaan Sistem Manajemen Rantai Pasok"
        maxWidth="lg"
      >
        <div className="space-y-4 text-sm text-[#44483e] max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
          {/* Intro */}
          <div className="p-4 bg-[#fff1e5] rounded-xl border border-[#c4c8bb]/30">
            <h4 className="font-bold text-[#2C4219] mb-1">👋 Selamat datang di Sorgum SCM</h4>
            <p className="text-xs text-[#74796d] leading-relaxed">
              Sistem ini membantu Anda mencatat dan memantau seluruh rantai pasok sorgum:
              mulai dari <b>lahan</b>, <b>panen</b>, <b>produksi olahan</b>, <b>kemasan</b>,
              hingga <b>keuangan logistik</b>. Pilih panduan sesuai kebutuhan Anda di bawah.
            </p>
          </div>

          {/* Panduan per fitur */}
          <div className="space-y-3">
            <p className="font-bold text-[#172C05]"><BookOpen className="w-4 h-4 inline-block mr-1 text-[#2C4219]" /> Panduan Langkah demi Langkah:</p>

            {/* Dashboard */}
            <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-[#2C4219]" />
                <span className="text-xs font-bold text-[#2C4219]">Dashboard</span>
              </div>
              <ol className="px-4 py-3 space-y-1.5 text-xs list-decimal pl-8">
                <li>Buka menu <b>Dashboard</b> (halaman pertama setelah login).</li>
                <li>Lihat ringkasan: lahan panen tertinggi/terendah, rata-rata panen, dan total volume.</li>
                <li>Gunakan dropdown <b>Bulanan / Triwulan / Tahunan</b> untuk mengubah grafik hasil panen.</li>
                <li>Gulir ke bawah untuk melihat <b>Catatan Panen Terbaru</b> & <b>Status QC produksi</b>.</li>
              </ol>
            </div>

            {/* Kelola Data Panen */}
            <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-[#2C4219]" />
                <span className="text-xs font-bold text-[#2C4219]">Kelola Data Panen</span>
              </div>
              <ol className="px-4 py-3 space-y-1.5 text-xs list-decimal pl-8">
                <li>Klik <b>Input Data Panen</b> (tombol hijau kanan atas).</li>
                <li>Isi form: lokasi lahan, varietas, tanggal panen, tonase, penanggung jawab, foto (opsional).</li>
                <li>Klik <b>Simpan</b> — data langsung masuk tabel & kalender.</li>
                <li><b>Filter</b>: gunakan dropdown lahan / varietas / tanggal / status di atas tabel.</li>
                <li><b>Export</b>: klik tombol Export → pilih CSV atau Excel untuk mengunduh laporan.</li>
                <li><b>Kalender</b> (kolom kanan): klik tanggal untuk melihat detail panen hari itu.</li>
              </ol>
            </div>

            {/* Kelola Lahan */}
            <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15 flex items-center gap-2">
                <Tractor className="w-4 h-4 text-[#2C4219]" />
                <span className="text-xs font-bold text-[#2C4219]">Kelola Lahan</span>
              </div>
              <ol className="px-4 py-3 space-y-1.5 text-xs list-decimal pl-8">
                <li>Klik <b>Tambah Lahan Baru</b> untuk mendaftarkan blok lahan baru.</li>
                <li>Isi nama lahan, desa, luas (hektar), varietas, jenis tanah, dan status kesiapan.</li>
                <li>Klik peta untuk menandai <b>lokasi GPS</b> lahan (opsional).</li>
                <li>Gunakan ikon <b><Eye className="w-3 h-3 inline" /> Lihat</b> untuk detail, <b><Pencil className="w-3 h-3 inline" /> Edit</b> untuk ubah data.</li>
              </ol>
            </div>

            {/* Produksi */}
            <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15 flex items-center gap-2">
                <Factory className="w-4 h-4 text-[#2C4219]" />
                <span className="text-xs font-bold text-[#2C4219]">Produksi Olahan</span>
              </div>
              <ol className="px-4 py-3 space-y-1.5 text-xs list-decimal pl-8">
                <li>Klik <b>Tambah Batch Produksi</b>.</li>
                <li>Isi nama produk, kategori, jumlah hasil, satuan, dan status QC.</li>
                <li>Filter berdasarkan kategori tab (Raw / Ready to Eat) di atas tabel.</li>
              </ol>
            </div>

            {/* Kemasan */}
            <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#2C4219]" />
                <span className="text-xs font-bold text-[#2C4219]">Bahan Kemasan</span>
              </div>
              <ol className="px-4 py-3 space-y-1.5 text-xs list-decimal pl-8">
                <li>Klik <b>Tambah Stok Kemasan</b> untuk mencatat material baru.</li>
                <li>Isi kode, nama, kategori, stok, harga per unit, dan pemasok.</li>
                <li>Klik panah <ChevronDown className="w-3 h-3 inline" /> di baris untuk membuka detail: <b>Nilai Gizi</b>, <b>Komposisi</b>, <b>AKG</b>, <b>Riwayat</b>.</li>
                <li>Status stok (Cukup / Menipis / Habis) dihitung otomatis dari stok minimal.</li>
              </ol>
            </div>

            {/* Logistik */}
            <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#2C4219]" />
                <span className="text-xs font-bold text-[#2C4219]">Logistik & Keuangan</span>
              </div>
              <ol className="px-4 py-3 space-y-1.5 text-xs list-decimal pl-8">
                <li>Klik <b>Catat Pengeluaran Baru</b> untuk menambahkan transaksi.</li>
                <li>Isi kode transaksi, tanggal, kategori, vendor, total biaya, dan status pembayaran.</li>
                <li>Filter kategori: Semua / Transportasi / Bahan Baku (tab di atas tabel).</li>
                <li><b>Export Laporan</b>: pilih CSV, Excel, atau PDF (buka jendela cetak → simpan sebagai PDF).</li>
              </ol>
            </div>

            {/* Sertifikat */}
            <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#2C4219]" />
                <span className="text-xs font-bold text-[#2C4219]">Sertifikat</span>
              </div>
              <ol className="px-4 py-3 space-y-1.5 text-xs list-decimal pl-8">
                <li>Klik <b>Tambah Sertifikat</b> untuk mendaftarkan dokumen (Halal, P-IRT, dll).</li>
                <li>Isi nama, penerbit, nomor, tanggal terbit/kadaluarsa, dan unggah file dokumen.</li>
                <li>Klik ikon <b><Eye className="w-3 h-3 inline" /></b> untuk pratinjau dokumen di modal.</li>
              </ol>
            </div>

            {/* CMS */}
            <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
              <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#2C4219]" />
                <span className="text-xs font-bold text-[#2C4219]">Konten Website (CMS)</span>
              </div>
              <ol className="px-4 py-3 space-y-1.5 text-xs list-decimal pl-8">
                <li>Buka menu <b>Konten Website</b> (ikon roda gigi di header, atau menu sidebar).</li>
                <li>Ubah <b>logo aplikasi</b>, nama situs, hero, dan statistik di tab <b>Umum</b>.</li>
                <li>Kelola galeri & produk di tab <b>Konten</b>, FAQ di tab <b>FAQ</b>.</li>
                <li>Klik <b>Simpan Perubahan</b> — tampilan publik langsung diperbarui.</li>
              </ol>
            </div>
          </div>

          {/* FAQ ringkas */}
          <div className="bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 p-4 space-y-2">
            <p className="font-bold text-[#172C05]">❓ Pertanyaan Umum:</p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-[#c4c8bb]/15">
                <p className="font-bold text-[#221A12]">Q: Data tidak muncul / popup "Koneksi Terputus"?</p>
                <p className="text-[#74796d] mt-0.5">Pastikan server backend berjalan, lalu klik <b>Coba Hubungkan Sekarang</b> pada popup.</p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#c4c8bb]/15">
                <p className="font-bold text-[#221A12]">Q: Bagaimana cara mengunduh laporan panen?</p>
                <p className="text-[#74796d] mt-0.5">Buka <b>Kelola Data Panen</b> → klik tombol <b>Export</b> → pilih CSV atau Excel.</p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#c4c8bb]/15">
                <p className="font-bold text-[#221A12]">Q: Status stok kemasan tidak sesuai?</p>
                <p className="text-[#74796d] mt-0.5">Status dihitung otomatis: stok ≤ minimal = <b>Menipis</b>, stok 0 = <b>Habis</b>. Perbarui stok di form edit.</p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#c4c8bb]/15">
                <p className="font-bold text-[#221A12]">Q: Lupa password?</p>
                <p className="text-[#74796d] mt-0.5">Hubungi admin KWT atau helpdesk di kontak di bawah untuk reset akun.</p>
              </div>
            </div>
          </div>

          {/* Kontak */}
          <div className="p-4 bg-[#2C4219] text-white rounded-xl space-y-2">
            <p className="font-bold text-[#C3E28D]"><Headphones className="w-4 h-4 inline-block mr-1.5" /> Kontak Layanan Dukungan:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#efe0d2]">
              <li>WhatsApp Hotline: <b>0812-3456-7890</b> (Ibu Tani / Helpdesk)</li>
              <li>Email Operasional: <b>support@sorgumscm.id</b></li>
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
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-40 h-screen transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
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
