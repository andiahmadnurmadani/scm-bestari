import React from 'react';
import { Sprout, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-[#172C05] text-[#efe0d2] pt-16 pb-12 border-t border-[#2C4219]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#2C4219]">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2C4219] flex items-center justify-center text-white">
                <Sprout className="w-6 h-6 text-[#C3E28D]" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Sorgum SCM
              </span>
            </div>
            <p className="text-xs text-[#c4c8bb] leading-relaxed">
              Sistem Manajemen Rantai Pasok Sorgum Terintegrasi. Mengoptimalkan panen, pengolahan, hingga sertifikasi dan distribusi untuk kesejahteraan kelompok tani Indonesia.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-xs text-[#c4c8bb]">
              <li><a href="/#fitur" className="hover:text-[#C3E28D] transition-colors">Monitoring Panen</a></li>
              <li><a href="/#fitur" className="hover:text-[#C3E28D] transition-colors">Kelola Produksi & Sertifikat</a></li>
              <li><a href="/#fitur" className="hover:text-[#C3E28D] transition-colors">Logistik & Keuangan</a></li>
              <li><Link to="/login" className="hover:text-[#C3E28D] transition-colors">Portal Dashboard Admin</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Legal & Privasi
            </h4>
            <ul className="space-y-2 text-xs text-[#c4c8bb]">
              <li><a href="#" className="hover:text-[#C3E28D] transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-[#C3E28D] transition-colors">Syarat & Ketentuan Service</a></li>
              <li><a href="#" className="hover:text-[#C3E28D] transition-colors">Sertifikasi Halal BPJPH</a></li>
              <li><a href="#" className="hover:text-[#C3E28D] transition-colors">Standar Mutu Pangan SNI</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Kontak Sentra KWT
            </h4>
            <div className="space-y-2 text-xs text-[#c4c8bb]">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C3E28D] shrink-0" />
                Bandung, Jawa Barat, Indonesia
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C3E28D] shrink-0" />
                +62 812-3456-7890
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C3E28D] shrink-0" />
                info@sorgumscm.id
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#c4c8bb]">
          <p>© 2026 Sorgum SCM. Seluruh hak cipta dilindungi.</p>
          <p className="font-semibold text-[#C3E28D]">
            Memberdayakan Kelompok Wanita Tani & Petani Lokal
          </p>
        </div>
      </div>
    </footer>
  );
};
