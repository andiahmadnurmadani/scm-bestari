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
  HeartHandshake,
  TrendingUp,
  Users,
  PackageCheck,
  Layers,
  QrCode,
  ScanLine,
  Droplets,
  Wheat,
  Factory,
  Warehouse,
} from 'lucide-react';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { FaqAccordion } from '../../components/landing/FaqAccordion';
import { useCms } from '../../context/CmsContext';
import sorghumFieldImg from '../../assets/sorghum_field.png';
import tepungSorgumImg from '../../assets/tepung_sorgum.png';
import berasSorgumImg from '../../assets/beras_sorgum.png';
import gulaSorgumImg from '../../assets/gula_sorgum.png';
import rengginangSorgumImg from '../../assets/rengginang_sorgum.png';

export const LandingPage: React.FC = () => {
  const { cms } = useCms();

  // Spotlight Carousel State
  const [productIndex, setProductIndex] = useState(0);

  const fallbackProducts = [
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

  const products = cms.products && cms.products.length > 0 ? cms.products : fallbackProducts;

  // CMS bisa punya entri produk tanpa gambar (img: '') — pakai gambar fallback
  // agar area gambar tidak pernah kosong.
  const productImage = (idx: number) => {
    const p = products[idx];
    if (p?.img) return p.img;
    return fallbackProducts[idx % fallbackProducts.length]?.img || tepungSorgumImg;
  };

  const handlePrevProduct = () => {
    setProductIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  const handleNextProduct = () => {
    setProductIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
  };

  // Hero Slideshow State
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const fallbackHeroImages = [
    { src: sorghumFieldImg, title: 'Lahan Sorgum KWT Subang' },
    { src: berasSorgumImg, title: 'Beras Sorgum Kemasan Vacuum' },
    { src: tepungSorgumImg, title: 'Tepung Sorgum Bebas Gluten' },
    { src: rengginangSorgumImg, title: 'Camilan Rengginang Sorgum Gurih' },
  ];
  const heroImages =
    cms.heroImages && cms.heroImages.length > 0 && cms.heroImages.some((h) => h.src)
      ? cms.heroImages
      : fallbackHeroImages;

  // Jaga-jaga: jika slide aktif tidak punya gambar, pakai fallback sejenis.
  const heroImage = (idx: number) => {
    const h = heroImages[idx];
    if (h?.src) return h;
    return fallbackHeroImages[idx % fallbackHeroImages.length];
  };

  // Auto-play slideshow every 4 seconds
  React.useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Rantai lacak produk (traceability) — inti nilai platform
  const traceChain = [
    { icon: Sprout, label: 'Tanam' },
    { icon: Wheat, label: 'Panen' },
    { icon: Warehouse, label: 'Gudang' },
    { icon: Droplets, label: 'Sosoh' },
    { icon: Factory, label: 'Olahan' },
    { icon: QrCode, label: 'QR Lacak' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-[#221A12]">
      <PublicNavbar />

      <main className="flex-1">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section id="beranda" className="relative overflow-hidden bg-gradient-to-b from-[#F7F7F5] to-[#eef0e6]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-14 pb-16 sm:pt-20 sm:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

              {/* Left: Text */}
              <div className="lg:col-span-7 reveal">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2C4219]/8 border border-[#2C4219]/15 text-[#2C4219] text-xs sm:text-sm font-semibold">
                  <Sprout className="w-4 h-4" />
                  <span>{cms.heroBadge}</span>
                </div>

                <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#172C05] leading-[1.06] tracking-tight">
                  {cms.heroHeadlinePre}{' '}
                  <span className="text-[#4a6b2f]">{cms.heroHeadlineHighlight}</span>{' '}
                  {cms.heroHeadlinePost}
                </h1>

                <p className="mt-5 text-base sm:text-lg text-[#44483e] leading-relaxed max-w-2xl">
                  {cms.heroSubtitle}
                </p>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2C4219] text-white font-bold text-sm sm:text-base hover:bg-[#3a5520] transition-colors shadow-lg shadow-[#2C4219]/20"
                  >
                    <ScanLine className="w-4 h-4" />
                    {cms.heroCta1}
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#2C4219] font-bold text-sm sm:text-base border border-[#c4c8bb]/50 hover:border-[#2C4219]/40 hover:bg-[#FFF8F4] transition-colors"
                  >
                    {cms.heroCta2}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Trust row */}
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {[cms.heroTrust1, cms.heroTrust2, cms.heroTrust3].map((t, i) => (
                    <span key={i} className="flex items-center gap-2 text-sm text-[#44483e] font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#4a6b2f]" />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: Image slideshow */}
              <div className="lg:col-span-5 reveal-2">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#c4c8bb]/30 aspect-[4/3] lg:aspect-[4/5] group">
                  <img
                    src={heroImage(heroImageIndex).src}
                    alt={heroImage(heroImageIndex).title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                  {/* Caption */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs text-[#C3E28D] font-bold uppercase tracking-wider">{cms.galleryBadge}</p>
                    <p className="text-base sm:text-lg text-white font-bold leading-snug mt-1">
                      {heroImages[heroImageIndex].title}
                    </p>
                  </div>

                  {/* Count */}
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs text-white/90 font-semibold border border-white/15">
                    {heroImageIndex + 1} / {heroImages.length}
                  </div>

                  {/* Arrows */}
                  <button
                    onClick={() => setHeroImageIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer border border-white/15 opacity-0 group-hover:opacity-100"
                    aria-label="Gambar sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setHeroImageIndex((prev) => (prev + 1) % heroImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer border border-white/15 opacity-0 group-hover:opacity-100"
                    aria-label="Gambar berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-4 right-4 flex gap-1.5">
                    {heroImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setHeroImageIndex(idx)}
                        aria-label={`Gambar ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === heroImageIndex ? 'w-6 bg-[#C3E28D]' : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────────────────────────────── */}
        <section className="bg-white border-y border-[#c4c8bb]/25">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10 sm:py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
              {[
                { icon: Layers, tone: 'bg-[#C3E28D]/40 text-[#2C4219]', i: 0 },
                { icon: PackageCheck, tone: 'bg-amber-100 text-amber-700', i: 1 },
                { icon: TrendingUp, tone: 'bg-sky-100 text-sky-700', i: 2 },
                { icon: Users, tone: 'bg-purple-100 text-purple-700', i: 3 },
              ].map(({ icon: Icon, tone, i }) => (
                <div key={i} className="flex flex-col items-center text-center lg:border-r lg:last:border-r-0 border-[#c4c8bb]/30">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tone}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#172C05] leading-none tracking-tight">
                    {cms.stats[i].value}
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-[#2C4219]">{cms.stats[i].label}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{cms.stats[i].sublabel}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FITUR ────────────────────────────────────────────────────────── */}
        <section id="fitur" className="bg-[#F7F7F5]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-24">
            <div className="max-w-3xl">
              <span className="inline-block text-xs sm:text-sm font-bold text-[#4a6b2f] uppercase tracking-wider mb-3">{cms.featuresBadge}</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#172C05] leading-tight tracking-tight">
                {cms.featuresTitle}
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#44483e] leading-relaxed">
                {cms.featuresSubtitle}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Sprout, i: 0 },
                { icon: Award, i: 1 },
                { icon: Truck, i: 2 },
              ].map(({ icon: Icon, i }) => (
                <div
                  key={i}
                  className="bg-white p-7 rounded-2xl border border-[#c4c8bb]/30 hover:border-[#2C4219]/30 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#C3E28D]/40 text-[#2C4219] flex items-center justify-center group-hover:bg-[#2C4219] group-hover:text-[#C3E28D] transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-5 text-lg sm:text-xl font-bold text-[#172C05]">{cms.featureCards[i].title}</h3>
                  <p className="mt-2.5 text-sm sm:text-base text-[#44483e] leading-relaxed">{cms.featureCards[i].desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ALUR LACAK (TRACEABILITY) ────────────────────────────────────── */}
        <section className="bg-[#2C4219] text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#C3E28D]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#C3E28D] text-xs sm:text-sm font-bold">
                <QrCode className="w-4 h-4" />
                {cms.traceBadge}
              </div>
              <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                {cms.traceTitlePre} <span className="text-[#C3E28D]">{cms.traceTitleHighlight}</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#d4e8b8]/85 leading-relaxed">
                {cms.traceDesc}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {traceChain.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="relative flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.06] border border-white/10">
                    <div className="w-11 h-11 rounded-full bg-[#C3E28D] text-[#172C05] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-white">{step.label}</p>
                    <p className="text-[11px] text-[#A8B774] font-semibold">Tahap {i + 1}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── PRODUK ───────────────────────────────────────────────────────── */}
        <section id="produk" className="bg-[#FFF8F4]">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-24">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#2C4219] leading-tight tracking-tight">
                {cms.productsTitle}
              </h2>
              <p className="mt-4 text-base sm:text-lg text-[#44483e] leading-relaxed">{cms.productsSubtitle}</p>
            </div>

            <div className="mt-12 bg-white rounded-3xl border border-[#c4c8bb]/30 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
              {/* Image */}
              <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[420px] bg-[#F7F7F5]">
                <img
                  src={productImage(productIndex)}
                  alt={products[productIndex].name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-4 left-4 bg-[#2C4219] text-[#C3E28D] text-xs font-bold px-3 py-1 rounded-full shadow">
                  {products[productIndex].badge}
                </span>
              </div>

              {/* Info */}
              <div className="p-7 sm:p-10 flex flex-col justify-center">
                <span className="text-xs text-[#4a6b2f] font-bold uppercase tracking-wider">{cms.productsBadge}</span>
                <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#172C05] leading-tight">
                  {products[productIndex].name}
                </h3>
                <p className="mt-3 text-base text-[#44483e] leading-relaxed">{products[productIndex].desc}</p>

                <div className="mt-6 pt-6 border-t border-[#c4c8bb]/25 space-y-3">
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-[#6B7280]">{cms.productPackLabel}</span>
                    <span className="text-[#172C05] font-bold">{products[productIndex].pack}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-[#6B7280]">{cms.productTagLabel}</span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#C3E28D]/40 text-[#2C4219] text-xs font-bold">
                      {products[productIndex].tag}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevProduct}
                      aria-label="Produk sebelumnya"
                      className="w-10 h-10 rounded-xl bg-[#F7F7F5] border border-[#c4c8bb]/40 text-[#2C4219] flex items-center justify-center hover:bg-[#efe0d2] transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextProduct}
                      aria-label="Produk berikutnya"
                      className="w-10 h-10 rounded-xl bg-[#F7F7F5] border border-[#c4c8bb]/40 text-[#2C4219] flex items-center justify-center hover:bg-[#efe0d2] transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {products.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setProductIndex(idx)}
                        aria-label={`Produk ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === productIndex ? 'w-6 bg-[#2C4219]' : 'w-2 bg-[#c4c8bb] hover:bg-[#a8b0a0]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ALUR RANTAI PASOK (workflow) ─────────────────────────────────── */}
        {cms.workflowSteps && cms.workflowSteps.length > 0 && (
          <section className="bg-white border-y border-[#c4c8bb]/25">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20">
              <div className="max-w-3xl">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172C05] leading-tight tracking-tight">
                  {cms.workflowTitle}
                </h2>
              </div>
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                {cms.workflowSteps.map((step, i) => (
                  <div key={i} className="p-6 bg-[#F7F7F5] rounded-2xl border border-[#c4c8bb]/30">
                    <div className="w-11 h-11 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">
                      {step.number}
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-[#172C05]">{step.title}</h3>
                    <p className="mt-2 text-sm sm:text-base text-[#44483e] leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <FaqAccordion />

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="bg-[#F7F7F5]">
          <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-20">
            <div className="bg-gradient-to-br from-[#2C4219] to-[#1a2c0f] rounded-3xl px-7 sm:px-12 py-12 sm:py-14 text-center relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#C3E28D]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#C3E28D] text-xs sm:text-sm font-bold border border-white/20">
                  <HeartHandshake className="w-4 h-4" />
                  <span>{cms.ctaBadge}</span>
                </div>
                <h2 className="mt-5 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
                  {cms.ctaTitle}
                </h2>
                <p className="mt-4 text-base sm:text-lg text-[#d4e8b8]/85 max-w-2xl mx-auto leading-relaxed">
                  {cms.ctaSubtitle}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C3E28D] text-[#172C05] font-bold text-sm sm:text-base hover:bg-[#b5d87b] transition-colors shadow-lg shadow-black/20"
                  >
                    <ScanLine className="w-4 h-4" />
                    {cms.ctaBtn1}
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-bold text-sm sm:text-base border border-white/30 hover:bg-white/20 transition-colors"
                  >
                    {cms.ctaBtn2}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
