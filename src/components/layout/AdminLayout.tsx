import React, { useEffect, useState } from 'react';
import { Outlet, useOutletContext, Link, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminFooter } from './AdminFooter';

export type AdminContextType = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
};

export function useAdminSearch() {
  return useOutletContext<AdminContextType>();
}

export const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Preferensi collapse sidebar (desktop) — disimpan agar diingat antar sesi
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const pathname = location.pathname;

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', next ? '1' : '0');
      } catch {
        // abaikan jika localStorage tidak tersedia
      }
      return next;
    });
  };

  // Reset kata kunci pencarian setiap pindah halaman
  useEffect(() => {
    setSearchTerm('');
  }, [pathname]);

  const renderBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length <= 1) {
      return null;
    }

    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      panen: 'Panen',
      lahan: 'Kelola Lahan',
      peralatan: 'Sarana & Peralatan',
      produksi: 'Kelola Olahan',
      sertifikat: 'Kelola Sertifikat',
      kemasan: 'Kelola Data Kemasan',
      logistik: 'Logistik',
      profil: 'Profil Saya',
      integrasi: 'Pengaturan & Integrasi API',
      cms: 'Manajemen Konten Website',
    };

    const currentLabel = labels[paths[1]] || paths[1];

    return (
      <nav className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280] mb-3 select-none">
        <Link
          to="/dashboard"
          className="hover:text-[#2C4219] hover:underline transition-colors duration-150"
        >
          Dashboard
        </Link>
        <span className="text-[#9CA3AF]">&gt;</span>
        <span className="text-[#2C4219] font-semibold">
          {currentLabel}
        </span>
      </nav>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#F7F7F5] text-[#221A12] antialiased overflow-x-hidden">
      {/* Sidebar */}
      <AdminSidebar
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-64'
        }`}
      >
        <AdminHeader
          onMenuClick={() => setMobileSidebarOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <main className="flex-1 p-3 sm:p-4.5 lg:p-6 max-w-6xl w-full mx-auto min-w-0">
          {renderBreadcrumbs()}
          <Outlet context={{ searchTerm, setSearchTerm }} />
        </main>

        <AdminFooter />
      </div>
    </div>
  );
};
