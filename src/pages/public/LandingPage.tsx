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
  TrendingUp,
  Users,
  PackageCheck,
  Layers,
} from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { FeatureDemoModal } from '../../components/landing/FeatureDemoModal';
import { FaqAccordion } from '../../components/landing/FaqAccordion';
import { useCms } from '../../context/CmsContext';
import sorghumFieldImg from '../../assets/sorghum_field.png';
import tepungSorgumImg from '../../assets/tepung_sorgum.png';
import berasSorgumImg from '../../assets/beras_sorgum.png';
import gulaSorgumImg from '../../assets/gula_sorgum.png';
import rengginangSorgumImg from '../../assets/rengginang_sorgum.png';

export const LandingPage: React.FC = () => {
  const { cms } = useCms();
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
        {/* HERO SECTION - Full viewport height with enhanced UI/UX */}
        <section id="beranda" className="min-h-[calc(100vh-72px)] flex flex-col justify-center py-2 sm:py-4 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center gap-5 flex-1">

            {/* Hero Banner Card — Redesigned */}
            <div className="bg-gradient-to-br from-[#2C4219] via-[#243816] to-[#1a2c0f] text-white rounded-3xl px-6 sm:px-8 lg:px-10 py-8 sm:py-10 relative overflow-hidden shadow-2xl border border-[#C3E28D]/15 flex-1 flex flex-col justify-center min-h-[340px]">

              {/* Animated glow orbs */}
              <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#C3E28D]/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#6a9a2e]/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-[#A8B774]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">

                {/* Left: Text Content */}
                <div className="lg:col-span-7 space-y-5 text-left">

                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C3E28D]/15 border border-[#C3E28D]/35 text-[#C3E28D] text-[10px] font-bold tracking-wide backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C3E28D] animate-pulse" />
                    <Sprout className="w-3.5 h-3.5" />
                  <span>{cms.heroBadge}</span>
                  </div>

                  {/* Headline — larger & bolder */}
                  <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-white tracking-tight leading-snug">
                    {cms.heroHeadlinePre}{' '}
                    <span className="text-[#C3E28D]">{cms.heroHeadlineHighlight}</span>{' '}
                    {cms.heroHeadlinePost}
                  </h1>

                  {/* Subtext */}
                  <p className="text-sm text-[#d4e8b8]/80 leading-relaxed max-w-lg font-normal">
                    {cms.heroSubtitle}
                  </p>

                  {/* CTA Buttons — more prominent */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Link
                      to="/dashboard"
                      className="group px-5 py-2.5 rounded-xl bg-[#C3E28D] text-[#172C05] hover:bg-white font-bold text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                    >
                      <span>{cms.heroCta1}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      to="/register"
                      className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 text-white hover:bg-white/20 hover:border-white/40 font-semibold text-sm transition-all duration-200 cursor-pointer"
                    >
                      {cms.heroCta2}
                    </Link>
                  </div>

                  {/* Trust indicators */}
                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
                    <span className="flex items-center gap-1.5 text-[10px] text-[#A8B774] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#A8B774]" />
                      {cms.heroTrust1}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-[#A8B774] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#A8B774]" />
                      {cms.heroTrust2}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-[#A8B774] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#A8B774]" />
                      {cms.heroTrust3}
                    </span>
                  </div>
                </div>

                {/* Right: Image Slider — larger & with better framing */}
                <div className="lg:col-span-5 relative">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/15 group h-[220px] sm:h-[260px] w-full ring-1 ring-[#C3E28D]/20">

                    {/* Images */}
                    <img
                      src={heroImages[heroImageIndex].src}
                      alt={heroImages[heroImageIndex].title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105"
                    />
                    {/* Overlay gradients */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

                    {/* Image count badge (top right) */}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] text-white/80 font-semibold border border-white/10">
                      {heroImageIndex + 1} / {heroImages.length}
                    </div>

                    {/* Floating Title */}
                    <div className="absolute bottom-3 left-3 right-12 flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-[9px] text-[#A8B774] font-semibold uppercase tracking-wider">Galeri Produk</p>
                        <p className="text-xs text-white font-bold leading-tight mt-0.5">{heroImages[heroImageIndex].title}</p>
                      </div>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                      onClick={() => setHeroImageIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1))}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md border border-white/15"
                      title="Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setHeroImageIndex((prev) => (prev + 1) % heroImages.length)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md border border-white/15"
                      title="Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Progress Bar Dots */}
                    <div className="absolute bottom-3 right-3 flex flex-col gap-1">
                      {heroImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHeroImageIndex(idx)}
                          className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                            idx === heroImageIndex ? 'w-5 bg-[#C3E28D]' : 'w-2 bg-white/35 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Stats Bar — redesigned with icons & colors */}
            <div className="bg-white rounded-2xl px-4 sm:px-6 py-4 border border-[#c4c8bb]/30 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-2 md:gap-0 text-center md:divide-x divide-[#c4c8bb]/25">

                <div className="flex flex-col items-center md:px-4 gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-[#C3E28D]/30 text-[#2C4219] flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-[#172C05] leading-none">{cms.stats[0].value}</p>
                  <p className="text-[10px] font-bold text-[#2C4219]">{cms.stats[0].label}</p>
                  <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 font-semibold">
                    <TrendingUp className="w-3 h-3" /> {cms.stats[0].sublabel}
                  </span>
                </div>

                <div className="flex flex-col items-center md:px-4 gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-[#2C4219] leading-none">{cms.stats[1].value}</p>
                  <p className="text-[10px] font-bold text-[#2C4219]">{cms.stats[1].label}</p>
                  <span className="flex items-center gap-0.5 text-[9px] text-amber-600 font-semibold">
                    <TrendingUp className="w-3 h-3" /> {cms.stats[1].sublabel}
                  </span>
                </div>

                <div className="flex flex-col items-center md:px-4 gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-[#172C05] leading-none">{cms.stats[2].value}</p>
                  <p className="text-[10px] font-bold text-[#2C4219]">{cms.stats[2].label}</p>
                  <span className="flex items-center gap-0.5 text-[9px] text-blue-600 font-semibold">
                    <TrendingUp className="w-3 h-3" /> {cms.stats[2].sublabel}
                  </span>
                </div>

                <div className="flex flex-col items-center md:px-4 gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-[#2C4219] leading-none">{cms.stats[3].value}</p>
                  <p className="text-[10px] font-bold text-[#2C4219]">{cms.stats[3].label}</p>
                  <span className="flex items-center gap-0.5 text-[9px] text-purple-600 font-semibold">
                    <TrendingUp className="w-3 h-3" /> {cms.stats[3].sublabel}
                  </span>
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
                {cms.featuresBadge}
              </span>
              <h2 className="text-lg sm:text-xl font-semibold text-[#172C05] mt-2">
                {cms.featuresTitle}
              </h2>
              <p className="text-[11px] text-[#6B7280] font-medium mt-1">
                {cms.featuresSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Feature Card 1 */}
              <div className="bg-white p-4.5 rounded-2xl border border-[#c4c8bb]/30 shadow-2xs hover:shadow-md hover:border-[#C3E28D] transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#C3E28D]/40 text-[#2C4219] flex items-center justify-center mb-3 group-hover:bg-[#2C4219] group-hover:text-[#C3E28D] transition-colors">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#172C05] mb-1.5">{cms.featureCards[0].title}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-normal">
                    {cms.featureCards[0].desc}
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
                  <h3 className="text-sm font-semibold text-[#172C05] mb-1.5">{cms.featureCards[1].title}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-normal">
                    {cms.featureCards[1].desc}
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
                  <h3 className="text-sm font-semibold text-[#172C05] mb-1.5">{cms.featureCards[2].title}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed font-normal">
                    {cms.featureCards[2].desc}
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
                  <span>{cms.ctaBadge}</span>
                </div>
                <h2 className="text-base sm:text-lg font-semibold leading-tight text-white">
                  {cms.ctaTitle}
                </h2>
                <p className="text-xs text-[#efe0d2] max-w-xl mx-auto font-medium leading-relaxed">
                  {cms.ctaSubtitle}
                </p>
                <div className="flex flex-wrap justify-center gap-2.5 pt-1">
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-lg bg-[#C3E28D] text-[#172C05] font-semibold text-xs hover:bg-[#b5d87b] transition-all cursor-pointer shadow-2xs"
                  >
                    {cms.ctaBtn1}
                  </Link>
                  <Link
                    to="/dashboard"
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 text-white font-semibold text-xs border border-white/30 hover:bg-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{cms.ctaBtn2}</span>
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
