import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ShieldCheck,
  Award,
  Truck,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  ArrowRight,
  Eye,
  HeartHandshake,
} from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { FeatureDemoModal } from '../../components/landing/FeatureDemoModal';
import { FaqAccordion } from '../../components/landing/FaqAccordion';
import sorghumFieldImg from '../../assets/sorghum_field.png';
import tepungSorgumImg from '../../assets/tepung_sorgum.png';
import berasSorgumImg from '../../assets/beras_sorgum.png';
import gulaSorgumImg from '../../assets/gula_sorgum.png';
import rengginangSorgumImg from '../../assets/rengginang_sorgum.png';

export const LandingPage: React.FC = () => {
  // Demo Modal State
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [activeDemoCategory, setActiveDemoCategory] = useState<'panen' | 'produksi' | 'logistik'>('panen');

  const openDemoModal = (category: 'panen' | 'produksi' | 'logistik') => {
    setActiveDemoCategory(category);
    setDemoModalOpen(true);
  };

  // Spotlight Carousel State
  const [productIndex, setProductIndex] = useState(0);

  const products = [
    {
      name: 'Tepung Sorgum Bioguma',
      img: tepungSorgumImg,
      badge: 'Gluten-Free',
      desc: 'Pengganti tepung terigu sehat untuk pembuatan kue, roti, dan olahan mie sehat.',
      pack: 'Kemasan 500g Pouch',
      tag: 'Halal & P-IRT',
    },
    {
      name: 'Beras Sorgum Sosoh',
      img: berasSorgumImg,
      badge: 'Low GI',
      desc: 'Biji sorgum pilihan kaya serat & indeks glikemik rendah, ideal untuk penderita diabetes.',
      pack: 'Kemasan 1 Kg Vacuum',
      tag: 'Grade A',
    },
    {
      name: 'Gula Nira Sorgum Cair',
      img: gulaSorgumImg,
      badge: '100% Organik',
      desc: 'Pemanis alami hasil perasan batang sorgum segar tanpa bahan pengawet sintesis.',
      pack: 'Botol Kaca 350ml',
      tag: 'Nectar',
    },
    {
      name: 'Rengginang Sorgum',
      img: rengginangSorgumImg,
      badge: 'Siap Makan',
      desc: 'Camilan tradisional renyah dengan rasa gurih alami hasil kreasi kelompok wanita tani.',
      pack: 'Box Custom 250g',
      tag: 'Gurih',
    },
  ];

  const handlePrevProduct = () => {
    setProductIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  const handleNextProduct = () => {
    setProductIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
  };

  // Hero Slideshow State
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const heroImages = [
    { src: sorghumFieldImg, title: 'Lahan Sorgum KWT Subang' },
    { src: berasSorgumImg, title: 'Beras Sorgum Kemasan Vacuum' },
    { src: tepungSorgumImg, title: 'Tepung Sorgum Bebas Gluten' },
    { src: rengginangSorgumImg, title: 'Camilan Rengginang Sorgum Gurih' },
  ];

  // Auto-play slideshow every 4 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-base">
      <PublicNavbar />

      <main className="flex-1">
        {/* HERO SECTION - Redesigned to occupy full viewport height (1 halaman penuh) */}
        <section id="beranda" className="min-h-[calc(100vh-72px)] flex flex-col justify-center py-2 sm:py-4 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center gap-4 flex-1">
            
            {/* Top Container Hero Banner Card */}
            <div className="bg-[#2C4219] text-white rounded-2xl p-4 sm:p-6 lg:p-6 relative overflow-hidden shadow-xl border border-[#C3E28D]/20 flex-1 flex flex-col justify-center min-h-[300px]">
              {/* Subtle background atmospheric glow */}
              <div className="absolute top-0 right-0 -mt-24 -mr-24 w-80 h-80 bg-[#C3E28D]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-80 h-80 bg-[#A8B774]/15 rounded-full blur-3xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center relative z-10">
                
                {/* Left Text Content */}
                <div className="lg:col-span-7 space-y-3.5 text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C3E28D]/20 border border-[#C3E28D]/40 text-[#C3E28D] text-[10px] font-bold">
                    <Sprout className="w-3 h-3 text-[#C3E28D]" />
                    <span>Sistem Informasi Rantai Pasok Sorgum Indonesia</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl lg:text-2xl font-semibold text-white tracking-tight leading-tight">
                    Transparansi Rantai Pasok Sorgum dari Akar hingga Meja
                  </h1>

                  <p className="text-[11px] sm:text-xs text-[#efe0d2] leading-relaxed max-w-xl font-normal">
                    Platform digital terpadu untuk monitoring panen, digitalisasi sertifikat halal & P-IRT, manajemen peralatan pertanian, hingga tata kelola logistik keuangan KWT & Kelompok Tani Sorgum.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                    <Link
                      to="/dashboard"
                      className="px-3 py-1.5 rounded-lg bg-[#C3E28D] text-[#172C05] hover:bg-white font-semibold text-xs flex items-center gap-1.5 shadow-xs hover:shadow-sm transition-all cursor-pointer"
                    >
                      <span>Jelajahi Dashboard Admin</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#172C05]" />
                    </Link>
                    <Link
                      to="/register"
                      className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Daftar Mitra KWT Baru
                    </Link>
                  </div>
                </div>

                {/* Right Column: Interactive Image Slider */}
                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-xl overflow-hidden shadow-lg border border-white/20 group h-[180px] sm:h-[210px] w-full">
                    <img
                      src={heroImages[heroImageIndex].src}
                      alt={heroImages[heroImageIndex].title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all duration-700 ease-in-out transform hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    
                    {/* Floating Title Indicator */}
                    <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-[#C3E28D] font-bold border border-white/10">
                      {heroImages[heroImageIndex].title}
                    </div>

                    {/* Navigation Arrows (Visible on Hover) */}
                    <button
                      onClick={() => setHeroImageIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm border border-white/10"
                      title="Sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setHeroImageIndex((prev) => (prev + 1) % heroImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm border border-white/10"
                      title="Berikutnya"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Bottom Dots Indicator */}
                    <div className="absolute bottom-2.5 right-2.5 flex gap-1">
                      {heroImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHeroImageIndex(idx)}
                          className={`w-1 h-1 rounded-full transition-all duration-300 ${
                            idx === heroImageIndex ? 'w-2 bg-[#C3E28D]' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Integrated Metric Stats Bar Card */}
            <div className="mt-4 bg-white rounded-2xl p-3.5 sm:p-4 border border-[#c4c8bb]/40 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-[#c4c8bb]/20">
                
                <div className="pt-1 md:pt-0 md:px-3">
                  <p className="text-base sm:text-lg font-bold text-[#172C05]">50.000+ Kg</p>
                  <p className="text-[11px] font-semibold text-[#74796d] mt-0.5">Total Hasil Panen Terdata</p>
                  <p className="text-[9px] text-[#6B7280] font-medium mt-0.5">Monitoring Sektor Lahan SCM</p>
                </div>

                <div className="pt-3 md:pt-0 md:px-3">
                  <p className="text-base sm:text-lg font-bold text-[#2C4219]">Rp 1,2 Miliar</p>
                  <p className="text-[11px] font-semibold text-[#74796d] mt-0.5">Nilai Transaksi Rantai Pasok</p>
                  <p className="text-[9px] text-[#6B7280] font-medium mt-0.5">Transparan & Akuntabel</p>
                </div>

                <div className="pt-3 md:pt-0 md:px-3">
                  <p className="text-base sm:text-lg font-bold text-[#172C05]">30%</p>
                  <p className="text-[11px] font-semibold text-[#74796d] mt-0.5">Efisiensi Distribusi Logistik</p>
                  <p className="text-[9px] text-[#6B7280] font-medium mt-0.5">Penghematan Biaya Operasional</p>
                </div>

                <div className="pt-3 md:pt-0 md:px-3">
                  <p className="text-base sm:text-lg font-bold text-[#2C4219]">15+ KWT</p>
                  <p className="text-[11px] font-semibold text-[#74796d] mt-0.5">Mitra Kelompok Tani</p>
                  <p className="text-[9px] text-[#6B7280] font-medium mt-0.5">Pemberdayaan Ekonomi Desa</p>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* 3. KEY FEATURES SECTION (SOLUSI END-TO-END) */}
        <section id="fitur" className="min-h-[calc(100vh-72px)] flex flex-col justify-center py-6 sm:py-8 bg-[#F7F7F5] border-t border-[#c4c8bb]/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center flex-1">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C3E28D]/40 text-[#172C05] text-[10px] font-bold uppercase tracking-wider">
                Solusi End-to-End Pengelolaan Sorgum
              </span>
              <h2 className="text-lg sm:text-xl font-semibold text-[#172C05] mt-2">
                Tiga Pilar Utama Tata Kelola Rantai Pasok Sorgum
              </h2>
              <p className="text-[11px] text-[#6B7280] font-medium mt-1">
                Setiap modul terintegrasi untuk membantu mempercepat digitalisasi kelompok wanita tani.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Feature Card 1 */}
              <div className="bg-white p-4.5 rounded-2xl border border-[#c4c8bb]/30 shadow-2xs hover:shadow-md hover:border-[#C3E28D] transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#C3E28D]/40 text-[#2C4219] flex items-center justify-center mb-3 group-hover:bg-[#2C4219] group-hover:text-[#C3E28D] transition-colors">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#172C05] mb-1.5">Monitoring Panen & Lahan</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-normal">
                    Pemetaan luas hektar tanah, irigasi teknis, jadwal tanam, hingga pencatatan tonase hasil panen berdasarkan varietas Bioguma, Numbu, & Suri 4.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#c4c8bb]/20 flex items-center justify-between">
                  <button
                    onClick={() => openDemoModal('panen')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2C4219] hover:text-[#172C05] hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#A8B774]" />
                    <span>Lihat Demo Fitur</span>
                  </button>
                  <Link
                    to="/dashboard/panen"
                    className="text-[11px] font-semibold text-[#2C4219] hover:underline flex items-center gap-1"
                  >
                    Buka Modul <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-white p-4.5 rounded-2xl border border-[#c4c8bb]/30 shadow-2xs hover:shadow-md hover:border-[#C3E28D] transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#C3E28D]/40 text-[#2C4219] flex items-center justify-center mb-3 group-hover:bg-[#2C4219] group-hover:text-[#C3E28D] transition-colors">
                    <Award className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#172C05] mb-1.5">Produksi & Sertifikasi Legal</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-normal">
                    Kelola batch olahan Tepung Sorgum, Rengginang, dan Gula Cair Nira. Pantau status Sertifikat Halal BPJPH, Izin P-IRT, dan Uji Lab Gluten-Free.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#c4c8bb]/20 flex items-center justify-between">
                  <button
                    onClick={() => openDemoModal('produksi')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2C4219] hover:text-[#172C05] hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#A8B774]" />
                    <span>Lihat Demo Fitur</span>
                  </button>
                  <Link
                    to="/dashboard/sertifikat"
                    className="text-[11px] font-semibold text-[#2C4219] hover:underline flex items-center gap-1"
                  >
                    Buka Sertifikasi <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Feature Card 3 */}
              <div className="bg-white p-4.5 rounded-2xl border border-[#c4c8bb]/30 shadow-2xs hover:shadow-md hover:border-[#C3E28D] transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#C3E28D]/40 text-[#2C4219] flex items-center justify-center mb-3 group-hover:bg-[#2C4219] group-hover:text-[#C3E28D] transition-colors">
                    <Truck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#172C05] mb-1.5">Logistik & Transaksi Keuangan</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-normal">
                    Pencatatan pengeluaran pupuk, sewa truk distribusi, persediaan kemasan Pouch & Box, hingga verifikasi nota digital secara akurat.
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-[#c4c8bb]/20 flex items-center justify-between">
                  <button
                    onClick={() => openDemoModal('logistik')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2C4219] hover:text-[#172C05] hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#A8B774]" />
                    <span>Lihat Demo Fitur</span>
                  </button>
                  <Link
                    to="/dashboard/logistik"
                    className="text-[11px] font-semibold text-[#2C4219] hover:underline flex items-center gap-1"
                  >
                    Lihat Logistik <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Visual Workflow Map (Alur Rantai Pasok Sorgum) */}
            <div className="mt-8 bg-white/60 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#c4c8bb]/30 shadow-3xs">
              <h3 className="text-[10px] font-bold text-[#2C4219] uppercase tracking-wider mb-4 text-center">
                Alur Digital Rantai Pasok Sorgum KWT
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
                {/* Step 1 */}
                <div className="bg-white p-3 rounded-xl border border-[#c4c8bb]/20 shadow-3xs flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center font-bold text-xs mb-1.5">
                    01
                  </div>
                  <h4 className="text-xs font-bold text-[#172C05]">Panen & Lahan</h4>
                  <p className="text-[10px] text-[#6B7280] mt-0.5 font-normal">Pendataan varietas & tonase hasil panen kelompok tani.</p>
                </div>

                {/* Arrow 1 */}
                <div className="hidden md:flex justify-center text-[#A8B774]">
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                </div>

                {/* Step 2 */}
                <div className="bg-white p-3 rounded-xl border border-[#c4c8bb]/20 shadow-3xs flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center font-bold text-xs mb-1.5">
                    02
                  </div>
                  <h4 className="text-xs font-bold text-[#172C05]">Sertifikasi & Batch</h4>
                  <p className="text-[10px] text-[#6B7280] mt-0.5 font-normal">Pencatatan batch olahan & tracking sertifikat Halal/P-IRT.</p>
                </div>

                {/* Arrow 2 */}
                <div className="hidden md:flex justify-center text-[#A8B774]">
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                </div>

                {/* Step 3 */}
                <div className="bg-white p-3 rounded-xl border border-[#c4c8bb]/20 shadow-3xs flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center font-bold text-xs mb-1.5">
                    03
                  </div>
                  <h4 className="text-xs font-bold text-[#172C05]">Distribusi & Logistik</h4>
                  <p className="text-[10px] text-[#6B7280] mt-0.5 font-normal">Pencatatan nota, stok pengemasan, & arus kas KWT.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS SHOWCASE GALLERY */}
        <section id="produk" className="min-h-[calc(100vh-72px)] flex flex-col justify-center py-6 sm:py-8 bg-[#FFF8F4] border-t border-[#c4c8bb]/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center flex-1">
            <div className="text-center max-w-xl mx-auto mb-6">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C3E28D]/40 text-[#172C05] text-[10px] font-bold uppercase tracking-wider">
                Diversifikasi Olahan Pangan
              </span>
              <h2 className="text-lg sm:text-xl font-semibold text-[#2C4219] mt-1">
                Produk Turunan Sorgum KWT Berstandar Mutu
              </h2>
              <p className="text-[11px] text-[#6B7280] mt-0.5 font-medium">
                Geser untuk menjelajahi berbagai macam olahan sorgum sehat hasil produksi kami.
              </p>
            </div>

            {/* Spotlight Slideable Card */}
            <div className="relative bg-white rounded-2xl border border-[#c4c8bb]/30 shadow-sm overflow-hidden p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-center">
              
              {/* Image Container */}
              <div className="w-full md:w-1/2 h-44 sm:h-52 md:h-60 rounded-xl overflow-hidden relative shrink-0 bg-[#F7F7F5] border border-[#c4c8bb]/20">
                <img
                  src={products[productIndex].img}
                  alt={products[productIndex].name}
                  className="w-full h-full object-cover transition-all duration-500 transform hover:scale-105"
                />
                <span className="absolute top-2.5 left-2.5 bg-[#2C4219] text-[#C3E28D] text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                  {products[productIndex].badge}
                </span>
              </div>

              {/* Text Info Container */}
              <div className="flex-grow flex flex-col justify-between space-y-4 w-full text-left">
                <div className="space-y-1.5">
                  <span className="text-[9px] text-[#A8B774] font-bold uppercase tracking-wider">
                    Produk Unggulan KWT
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-[#172C05]">
                    {products[productIndex].name}
                  </h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-normal">
                    {products[productIndex].desc}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#c4c8bb]/15 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#44483e] font-semibold">Tipe Kemasan:</span>
                    <span className="text-[#172C05] font-bold">{products[productIndex].pack}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#44483e] font-semibold">Standar Legalitas:</span>
                    <span className="px-2 py-0.5 rounded bg-[#C3E28D]/30 text-[#2C4219] text-[9px] font-bold">
                      {products[productIndex].tag}
                    </span>
                  </div>
                </div>

                {/* Navigation Dots & Arrows inside the card */}
                <div className="flex items-center justify-between pt-2.5 border-t border-[#c4c8bb]/15">
                  {/* Left / Right Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrevProduct}
                      className="w-7 h-7 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-[#2C4219] flex items-center justify-center hover:bg-[#efe0d2] transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextProduct}
                      className="w-7 h-7 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-[#2C4219] flex items-center justify-center hover:bg-[#efe0d2] transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dots indicator */}
                  <div className="flex gap-1.5">
                    {products.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setProductIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === productIndex ? 'w-5 bg-[#2C4219]' : 'w-1.5 bg-[#c4c8bb]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* 7. FAQ ACCORDION SECTION */}
        <FaqAccordion />

        {/* 8. ENHANCED CTA BANNER */}
        <section className="py-6 bg-[#F7F7F5] border-t border-[#c4c8bb]/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#2C4219] rounded-2xl p-5 sm:p-6 text-center space-y-3 shadow-xs border border-[#C3E28D]/20 relative overflow-hidden">
              {/* Ambient decoration glow inside the card */}
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-[#C3E28D]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-[#A8B774]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[#C3E28D] text-[10px] font-bold border border-white/20">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#C3E28D]" />
                  <span>Pendampingan Digital KWT Gratis</span>
                </div>
                <h2 className="text-base sm:text-lg font-semibold leading-tight text-white">
                  Siap Digitalisasi Rantai Pasok Sorgum Anda?
                </h2>
                <p className="text-xs text-[#efe0d2] max-w-xl mx-auto font-medium leading-relaxed">
                  Bergabunglah bersama 15+ Kelompok Wanita Tani yang telah merasakan kemudahan mencatat panen dan memantau legalitas sertifikat secara transparan.
                </p>
                <div className="flex flex-wrap justify-center gap-2.5 pt-1">
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-lg bg-[#C3E28D] text-[#172C05] font-semibold text-xs hover:bg-[#b5d87b] transition-all cursor-pointer shadow-2xs"
                  >
                    Daftar Akun KWT Baru
                  </Link>
                  <Link
                    to="/dashboard"
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white font-semibold text-xs border border-white/30 hover:bg-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Masuk ke Dashboard Admin</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Feature Demo Modal */}
      <FeatureDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        featureTitle={
          activeDemoCategory === 'panen'
            ? 'Monitoring Panen & Lahan'
            : activeDemoCategory === 'produksi'
            ? 'Produksi & Sertifikasi Legal'
            : 'Logistik & Transaksi Keuangan'
        }
        featureCategory={activeDemoCategory}
      />
    </div>
  );
};
