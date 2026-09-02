import React, { useEffect, useState } from 'react';
import { Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { LiteHeader } from './LiteHeader';
import { LiteSidebar } from './LiteSidebar';
import { LiteBottomNav } from './LiteBottomNav';

export type LiteContextType = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
};

export function useLiteSearch() {
  return useOutletContext<LiteContextType>();
}

export const LiteLayout: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  // Reset search saat rute berpindah
  useEffect(() => {
    setSearchTerm('');
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-[#FBF9F5] text-[#221A12] antialiased overflow-x-hidden selection:bg-[#C3E28D]/50 selection:text-[#172C05]">
      {/* Sidebar Botanical Rail Khusus Lite — Desktop */}
      <LiteSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-[82px]">
        {/* Header Lite */}
        <LiteHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Page Body */}
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-7 pb-28 lg:pb-10 min-w-0">
          <Outlet context={{ searchTerm, setSearchTerm }} />
        </main>

        {/* Mobile Bottom Navigation */}
        <LiteBottomNav />
      </div>
    </div>
  );
};
