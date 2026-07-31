import React from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureTitle: string;
  featureCategory: 'panen' | 'produksi' | 'logistik';
}

export const FeatureDemoModal: React.FC<FeatureDemoModalProps> = ({
  isOpen,
  onClose,
  featureTitle,
  featureCategory,
}) => {
  if (!isOpen) return null;

  const contentMap = {
    panen: {
      title: 'Demo Modul: Monitoring Panen & Lahan',
      badge: 'Sektor Lahan',
      description: 'Fitur pencatatan tonase hasil panen real-time dari lahan ke gudang penyimpanan KWT.',
      highlights: [
        'Input data tonase mudah dengan tombol besar',
        'Pencatatan varietas Bioguma 1, Numbu & Suri 4',
        'Grafik statistik panen bulanan otomatis',
        'Ekspor laporan panen ke format PDF/Cetak',
      ],
      route: '/dashboard/panen',
      mockImage: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1000&q=80',
    },
    produksi: {
      title: 'Demo Modul: Produksi & Sertifikasi Legal',
      badge: 'Sertifikasi & Batch',
      description: 'Manajemen perizinan Sertifikat Halal BPJPH, P-IRT, dan lacak batch olahan tepung/beras sorgum.',
      highlights: [
        'Tracking masa berlaku Sertifikat Halal BPJPH',
        'Notifikasi pengingat perpanjangan izin P-IRT',
        'Uji Lab Gluten-Free & Mutu Kemasan',
        'Cetak QR-Code Traceability produk',
      ],
      route: '/dashboard/sertifikat',
      mockImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80',
    },
    logistik: {
      title: 'Demo Modul: Logistik & Transaksi Keuangan',
      badge: 'Keuangan KWT',
      description: 'Pencatatan pengeluaran pupuk, armada distribusi, dan nota transaksi KWT secara terbuka.',
      highlights: [
        'Pencatatan kas masuk dan keluar KWT',
        'Pengelolaan stok kemasan Pouch & Box',
        'Jadwal pengiriman armada truk lokal',
        'Laporan neraca keuangan ramah audit',
      ],
      route: '/dashboard/logistik',
      mockImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1000&q=80',
    },
  };

  const current = contentMap[featureCategory] || contentMap.panen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#c4c8bb]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#2C4219] text-white flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C3E28D] text-[#172C05] text-[10px] font-black uppercase">
              {current.badge}
            </span>
            <h3 className="text-lg sm:text-xl font-black mt-1 text-white">
              {current.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="relative rounded-2xl overflow-hidden border border-[#c4c8bb]/30 h-48 sm:h-56">
            <img
              src={current.mockImage}
              alt={current.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-lg backdrop-blur-xs">
                Tampilan Layar Dashboard Interaktif
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#44483e] font-medium leading-relaxed">
            {current.description}
          </p>

          <div className="space-y-2 bg-[#FFF8F4] p-4 rounded-2xl border border-[#c4c8bb]/20">
            <p className="text-xs font-extrabold text-[#2C4219] uppercase tracking-wider mb-2">
              Keunggulan Utama Modul Ini:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-[#221A12]">
              {current.highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2C4219] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-[#F7F7F5] border-t border-[#c4c8bb]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#c4c8bb]/40 text-[#44483e] font-bold text-xs hover:bg-[#efe0d2]/40 transition-colors cursor-pointer text-center"
          >
            Tutup Preview
          </button>
          <Link
            to={current.route}
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2C4219] text-white hover:bg-[#172C05] font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <span>Buka Langsung di Dashboard</span>
            <ArrowRight className="w-4 h-4 text-[#C3E28D]" />
          </Link>
        </div>
      </div>
    </div>
  );
};
