import React from 'react';
import { Sprout, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCms } from '../../context/CmsContext';

export const PublicFooter: React.FC = () => {
  const { cms } = useCms();
  return (
    <footer className="bg-[#172C05] text-[#efe0d2] pt-16 pb-12 border-t border-[#2C4219]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#2C4219]">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {cms.logo ? (
                <img
                  src={cms.logo}
                  alt={cms.siteName}
                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-[#C3E28D]/30 shadow-lg"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#2C4219] flex items-center justify-center text-white">
                  <Sprout className="w-6 h-6 text-[#C3E28D]" />
                </div>
              )}
              <span className="text-xl font-extrabold text-white tracking-tight">
                {cms.siteName}
              </span>
            </div>
            <p className="text-xs text-[#c4c8bb] leading-relaxed">
              {cms.footerTagline}
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-xs text-[#c4c8bb]">
              <li><a href="/#fitur" className="hover:text-[#C3E28D] transition-colors">Monitoring Panen</a></li>
              <li><a href="/#fitur" className="hover:text-[#C3E28D] transition-colors">Kelola Produksi &amp; Sertifikat</a></li>
              <li><a href="/#fitur" className="hover:text-[#C3E28D] transition-colors">Logistik &amp; Keuangan</a></li>
              <li><Link to="/login" className="hover:text-[#C3E28D] transition-colors">Portal Dashboard Admin</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Legal &amp; Privasi
            </h4>
            <ul className="space-y-2 text-xs text-[#c4c8bb]">
              <li><a href="#" className="hover:text-[#C3E28D] transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-[#C3E28D] transition-colors">Syarat &amp; Ketentuan Service</a></li>
              <li><a href="#" className="hover:text-[#C3E28D] transition-colors">Sertifikasi Halal BPJPH</a></li>
              <li><a href="#" className="hover:text-[#C3E28D] transition-colors">Standar Mutu Pangan SNI</a></li>
            </ul>
          </div>

          {/* Col 4 — Kontak (editable via CMS) */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Kontak Sentra KWT
            </h4>
            <div className="space-y-2 text-xs text-[#c4c8bb]">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C3E28D] shrink-0" />
                {cms.footerAlamat}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C3E28D] shrink-0" />
                {cms.footerTelepon}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C3E28D] shrink-0" />
                {cms.footerEmail}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#c4c8bb]">
          <p>{cms.footerCopyright}</p>
          <p className="font-semibold text-[#C3E28D]">
            {cms.footerBottomTagline}
          </p>
        </div>
      </div>
    </footer>
  );
};

