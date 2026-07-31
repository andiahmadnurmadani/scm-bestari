import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, LogIn, UserPlus, Menu, X } from 'lucide-react';

interface PublicNavbarProps {
  isLargeText?: boolean;
  onToggleTextSize?: () => void;
}

export const PublicNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Beranda', id: 'beranda', path: '/#beranda' },
    { label: 'Fitur Utama', id: 'fitur', path: '/#fitur' },
    { label: 'Produk Olahan', id: 'produk', path: '/#produk' },
    { label: 'FAQ', id: 'faq', path: '/#faq' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (location.pathname === '/' || location.pathname === '') {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el) {
        const headerOffset = 72; // header height (64px) + margin spacing
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
        window.history.pushState(null, '', `#${id}`);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F7F7F5]/95 backdrop-blur-md border-b border-[#c4c8bb]/30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#2C4219] flex items-center justify-center text-white transition-transform group-hover:scale-105 shadow-2xs">
            <Sprout className="w-4 h-4 text-[#C3E28D]" />
          </div>
          <div>
            <span className="text-base font-extrabold text-[#2C4219] tracking-tight block leading-none">
              Sorgum SCM
            </span>
            <span className="text-[9px] font-bold text-[#44483e] uppercase tracking-wider block mt-0.5">
              Rantai Pasok Terintegrasi
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.path}
              onClick={(e) => handleNavClick(e, link.id)}
              className="text-xs xl:text-sm font-semibold text-[#44483e] hover:text-[#2C4219] transition-colors cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            to="/login"
            className="px-3 py-1.5 text-xs font-bold text-[#2C4219] hover:text-[#172C05] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            Masuk
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-xs font-bold bg-[#2C4219] text-white hover:bg-[#213213] rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#C3E28D]" />
            Daftar Sekarang
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-[#2C4219] hover:bg-[#efe0d2]/40"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFF8F4] border-b border-[#c4c8bb]/30 px-4 py-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.path}
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  handleNavClick(e, link.id);
                }}
                className="text-base font-semibold text-[#44483e] hover:text-[#2C4219]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-[#c4c8bb]/30 flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center font-bold text-[#2C4219] border border-[#2C4219] rounded-xl"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center font-bold bg-[#2C4219] text-white rounded-xl"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
