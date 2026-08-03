import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Heading1,
  BarChart3,
  Star,
  Megaphone,
  Settings2,
  Eye,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  PenLine,
} from 'lucide-react';
import { useCms } from '../../context/CmsContext';

// ── Reusable sub-components ───────────────────────────────────────────────────

const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, children }) => (
  <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#c4c8bb]/20 bg-[#F7F7F5]">
      <span className="text-[#2C4219]">{icon}</span>
      <div>
        <h3 className="text-sm font-bold text-[#172C05]">{title}</h3>
        {subtitle && <p className="text-[10px] text-[#6B7280] font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const Field: React.FC<{
  label: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold text-[#172C05] uppercase tracking-wider">{label}</label>
    {children}
    {hint && <p className="text-[9px] text-[#9CA3AF] font-medium">{hint}</p>}
  </div>
);

const inputCls =
  'w-full px-3 py-2 bg-[#F7F7F5] border border-[#c4c8bb]/40 rounded-xl text-xs font-medium text-[#221A12] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 focus:border-[#2C4219] focus:bg-white transition-all';

const textareaCls =
  'w-full px-3 py-2 bg-[#F7F7F5] border border-[#c4c8bb]/40 rounded-xl text-xs font-medium text-[#221A12] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 focus:border-[#2C4219] focus:bg-white transition-all resize-none';

// ── Inline live preview mini-card ─────────────────────────────────────────────

const HeroPreview: React.FC<{
  pre: string; highlight: string; post: string;
  subtitle: string; cta1: string; cta2: string;
  badge: string;
}> = ({ pre, highlight, post, subtitle, cta1, cta2, badge }) => (
  <div className="rounded-xl bg-gradient-to-br from-[#2C4219] to-[#1a2c0f] p-4 text-white relative overflow-hidden">
    <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#C3E28D]/15 rounded-full blur-2xl" />
    <div className="relative z-10 space-y-2">
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#C3E28D]/15 border border-[#C3E28D]/30 text-[#C3E28D] text-[9px] font-bold">
        <span className="w-1 h-1 rounded-full bg-[#C3E28D] animate-pulse" />
        {badge || '…'}
      </div>
      <p className="text-sm font-bold leading-snug">
        {pre || '…'} <span className="text-[#C3E28D]">{highlight || '…'}</span> {post || '…'}
      </p>
      <p className="text-[10px] text-[#d4e8b8]/80 leading-relaxed line-clamp-2">{subtitle || '…'}</p>
      <div className="flex gap-2 pt-0.5">
        <span className="px-2.5 py-1 rounded-lg bg-[#C3E28D] text-[#172C05] font-bold text-[9px]">{cta1 || '…'}</span>
        <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-[9px] font-semibold">{cta2 || '…'}</span>
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

export const CmsPage: React.FC = () => {
  const { cms, update, updateStat, updateFeatureCard, reset } = useCms();
  const [activeTab, setActiveTab] = useState<'umum' | 'hero' | 'stats' | 'fitur' | 'cta'>('hero');
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (resetConfirm) {
      reset();
      setResetConfirm(false);
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 4000);
    }
  };

  const tabs = [
    { id: 'hero' as const, label: 'Hero', icon: <Heading1 className="w-3.5 h-3.5" /> },
    { id: 'stats' as const, label: 'Statistik', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'fitur' as const, label: 'Fitur', icon: <Star className="w-3.5 h-3.5" /> },
    { id: 'cta' as const, label: 'Banner CTA', icon: <Megaphone className="w-3.5 h-3.5" /> },
    { id: 'umum' as const, label: 'Umum', icon: <Settings2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#172C05] flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#C3E28D]/40 text-[#2C4219] flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4" />
            </span>
            Manajemen Konten Website
          </h1>
        </div>
        <div className="flex items-center gap-2 ml-9 sm:ml-0">
          <Link
            to="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F7F5] border border-[#c4c8bb]/30 text-xs font-semibold text-[#2C4219] hover:bg-[#efe0d2] transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Lihat Landing Page
            <ExternalLink className="w-3 h-3 opacity-50" />
          </Link>
        </div>
      </div>


      {/* Saved toast */}
      {saved && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          Konten berhasil disimpan! Buka landing page untuk melihat hasilnya.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[#c4c8bb]/30 rounded-xl p-1 w-fit shadow-sm flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#2C4219] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#2C4219] hover:bg-[#F7F7F5]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: HERO ═══ */}
      {activeTab === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left: editor */}
          <div className="lg:col-span-3 space-y-4">
            <SectionCard title="Badge & Judul Utama" subtitle="Teks di banner hijau gelap bagian atas" icon={<Heading1 className="w-4 h-4" />}>
              <Field label="Teks Badge" hint="Teks kecil di atas headline">
                <input value={cms.heroBadge} onChange={(e) => update({ heroBadge: e.target.value })} className={inputCls} placeholder="Sistem Informasi..." />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Kata Sebelum Highlight">
                  <input value={cms.heroHeadlinePre} onChange={(e) => update({ heroHeadlinePre: e.target.value })} className={inputCls} placeholder="Transparansi Rantai Pasok" />
                </Field>
                <Field label="Kata Highlight (hijau)" hint="Dicetak dengan warna hijau">
                  <input value={cms.heroHeadlineHighlight} onChange={(e) => update({ heroHeadlineHighlight: e.target.value })} className={inputCls} placeholder="Sorgum" />
                </Field>
                <Field label="Kata Setelah Highlight">
                  <input value={cms.heroHeadlinePost} onChange={(e) => update({ heroHeadlinePost: e.target.value })} className={inputCls} placeholder="dari Akar hingga Meja" />
                </Field>
              </div>
              <Field label="Deskripsi / Subtitle">
                <textarea rows={3} value={cms.heroSubtitle} onChange={(e) => update({ heroSubtitle: e.target.value })} className={textareaCls} placeholder="Platform digital terpadu..." />
              </Field>
            </SectionCard>

            <SectionCard title="Tombol CTA" subtitle="Dua tombol di bawah deskripsi hero" icon={<PenLine className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Tombol Utama (hijau)" hint="Mengarah ke /dashboard">
                  <input value={cms.heroCta1} onChange={(e) => update({ heroCta1: e.target.value })} className={inputCls} placeholder="Jelajahi Dashboard Admin" />
                </Field>
                <Field label="Tombol Sekunder (transparan)" hint="Mengarah ke /register">
                  <input value={cms.heroCta2} onChange={(e) => update({ heroCta2: e.target.value })} className={inputCls} placeholder="Daftar Mitra KWT Baru" />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Trust Indicators" subtitle="Tiga poin kepercayaan di bawah tombol" icon={<CheckCircle2 className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['heroTrust1', 'heroTrust2', 'heroTrust3'] as const).map((key, i) => (
                  <Field key={key} label={`Poin ${i + 1}`}>
                    <input value={cms[key]} onChange={(e) => update({ [key]: e.target.value } as any)} className={inputCls} placeholder={`Poin kepercayaan ${i + 1}`} />
                  </Field>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* Right: live preview */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 shadow-sm overflow-hidden sticky top-24">
              <div className="flex items-center gap-2 px-4 py-3 bg-[#F7F7F5] border-b border-[#c4c8bb]/20">
                <Eye className="w-3.5 h-3.5 text-[#2C4219]" />
                <span className="text-xs font-bold text-[#172C05]">Preview Langsung</span>
                <span className="ml-auto text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
              </div>
              <div className="p-4">
                <HeroPreview
                  pre={cms.heroHeadlinePre}
                  highlight={cms.heroHeadlineHighlight}
                  post={cms.heroHeadlinePost}
                  subtitle={cms.heroSubtitle}
                  cta1={cms.heroCta1}
                  cta2={cms.heroCta2}
                  badge={cms.heroBadge}
                />
                <div className="mt-3 space-y-1.5">
                  {[cms.heroTrust1, cms.heroTrust2, cms.heroTrust3].map((t, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#6B7280] font-medium">
                      <CheckCircle2 className="w-3 h-3 text-[#A8B774] shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: STATISTIK ═══ */}
      {activeTab === 'stats' && (
        <SectionCard title="Kartu Statistik" subtitle="4 angka pencapaian yang tampil di bawah hero" icon={<BarChart3 className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {cms.stats.map((stat, i) => (
              <div key={i} className="p-4 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#2C4219] text-white text-[9px] font-extrabold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-[10px] font-bold text-[#172C05] uppercase tracking-wider">Stat {i + 1}</span>
                </div>
                <Field label="Nilai / Angka">
                  <input
                    value={stat.value}
                    onChange={(e) => updateStat(i, { value: e.target.value })}
                    className={inputCls}
                    placeholder="50.000+"
                  />
                </Field>
                <Field label="Label Utama">
                  <input
                    value={stat.label}
                    onChange={(e) => updateStat(i, { label: e.target.value })}
                    className={inputCls}
                    placeholder="Kg Panen Terdata"
                  />
                </Field>
                <Field label="Sub-label (kecil)">
                  <input
                    value={stat.sublabel}
                    onChange={(e) => updateStat(i, { sublabel: e.target.value })}
                    className={inputCls}
                    placeholder="Monitoring Lahan SCM"
                  />
                </Field>
                {/* mini preview */}
                <div className="flex flex-col items-center gap-1 pt-2 border-t border-[#c4c8bb]/20 text-center">
                  <p className="text-base font-bold text-[#172C05]">{stat.value}</p>
                  <p className="text-[10px] font-bold text-[#2C4219]">{stat.label}</p>
                  <p className="text-[9px] text-emerald-600 font-semibold">{stat.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ═══ TAB: FITUR ═══ */}
      {activeTab === 'fitur' && (
        <div className="space-y-4">
          <SectionCard title="Judul Seksi Fitur" subtitle="Teks header di bagian Fitur Utama" icon={<Star className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Teks Badge Seksi">
                <input value={cms.featuresBadge} onChange={(e) => update({ featuresBadge: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Judul Seksi (H2)">
                <input value={cms.featuresTitle} onChange={(e) => update({ featuresTitle: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Deskripsi Seksi" hint="Teks kecil di bawah judul">
                <input value={cms.featuresSubtitle} onChange={(e) => update({ featuresSubtitle: e.target.value })} className={inputCls} />
              </Field>
            </div>
          </SectionCard>

          {cms.featureCards.map((card, i) => (
            <SectionCard
              key={i}
              title={`Kartu Fitur ${i + 1}`}
              subtitle={card.title}
              icon={<Star className="w-4 h-4" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Judul Kartu">
                  <input
                    value={card.title}
                    onChange={(e) => updateFeatureCard(i, { title: e.target.value })}
                    className={inputCls}
                    placeholder="Nama fitur"
                  />
                </Field>
                <Field label="Deskripsi Kartu">
                  <textarea
                    rows={3}
                    value={card.desc}
                    onChange={(e) => updateFeatureCard(i, { desc: e.target.value })}
                    className={textareaCls}
                    placeholder="Deskripsi fitur..."
                  />
                </Field>
              </div>
              {/* preview */}
              <div className="p-3.5 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20">
                <p className="text-xs font-semibold text-[#172C05] mb-1">{card.title}</p>
                <p className="text-[10px] text-[#6B7280] leading-relaxed">{card.desc}</p>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {/* ═══ TAB: BANNER CTA ═══ */}
      {activeTab === 'cta' && (
        <div className="space-y-4">
          <SectionCard title="Konten Banner CTA" subtitle="Banner hijau gelap di bagian bawah halaman" icon={<Megaphone className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Teks Badge CTA">
                <input value={cms.ctaBadge} onChange={(e) => update({ ctaBadge: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Judul Banner (H2)">
                <input value={cms.ctaTitle} onChange={(e) => update({ ctaTitle: e.target.value })} className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Deskripsi Banner">
                  <textarea rows={2} value={cms.ctaSubtitle} onChange={(e) => update({ ctaSubtitle: e.target.value })} className={textareaCls} />
                </Field>
              </div>
              <Field label="Tombol 1 (hijau)">
                <input value={cms.ctaBtn1} onChange={(e) => update({ ctaBtn1: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Tombol 2 (transparan)">
                <input value={cms.ctaBtn2} onChange={(e) => update({ ctaBtn2: e.target.value })} className={inputCls} />
              </Field>
            </div>
          </SectionCard>

          {/* Preview */}
          <div className="bg-gradient-to-br from-[#2C4219] to-[#1a2c0f] rounded-2xl p-5 text-center space-y-3 border border-[#C3E28D]/20 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C3E28D]/10 rounded-full blur-2xl" />
            <div className="relative z-10 space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-[#C3E28D] text-[10px] font-bold border border-white/20">
                {cms.ctaBadge}
              </span>
              <p className="text-base font-bold text-white">{cms.ctaTitle}</p>
              <p className="text-[10px] text-[#d4e8b8]/80 leading-relaxed max-w-md mx-auto">{cms.ctaSubtitle}</p>
              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-[#C3E28D] text-[#172C05] font-bold text-[10px]">{cms.ctaBtn1}</span>
                <span className="px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-[10px] font-semibold">{cms.ctaBtn2}</span>
              </div>
            </div>
            <p className="text-[9px] text-[#A8B774]/60 relative z-10">↑ Preview banner CTA</p>
          </div>
        </div>
      )}

      {/* ═══ TAB: PENGATURAN UMUM ═══ */}
      {activeTab === 'umum' && (
        <div className="space-y-5">
          {/* General */}
          <SectionCard title="Pengaturan Umum Situs" subtitle="Nama, tagline, dan teks navigasi" icon={<Settings2 className="w-4 h-4" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nama Situs" hint="Tampil di navbar, footer, dan title browser">
                <input value={cms.siteName} onChange={(e) => update({ siteName: e.target.value })} className={inputCls} placeholder="Sorgum SCM" />
              </Field>
              <Field label="Tagline Situs" hint="Tampil di bawah nama di navbar">
                <input value={cms.siteTagline} onChange={(e) => update({ siteTagline: e.target.value })} className={inputCls} placeholder="Rantai Pasok Terintegrasi" />
              </Field>
              <Field label="Teks Tombol Navbar CTA" hint="Tombol hijau di pojok kanan navbar">
                <input value={cms.navbarCta} onChange={(e) => update({ navbarCta: e.target.value })} className={inputCls} placeholder="Daftar Sekarang" />
              </Field>
            </div>
          </SectionCard>

          {/* Footer */}
          <SectionCard title="Footer Landing Page" subtitle="Konten, kontak, dan teks di bagian bawah halaman" icon={<Settings2 className="w-4 h-4" />}>
            <div className="space-y-4">
              <Field label="Tagline Brand Footer" hint="Deskripsi singkat di kolom kiri footer">
                <textarea
                  rows={2}
                  value={cms.footerTagline}
                  onChange={(e) => update({ footerTagline: e.target.value })}
                  className={`${inputCls} resize-none`}
                  placeholder="Sistem Manajemen Rantai Pasok Sorgum Terintegrasi..."
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Alamat / Lokasi" hint="Ditampilkan dengan ikon 📍">
                  <input value={cms.footerAlamat} onChange={(e) => update({ footerAlamat: e.target.value })} className={inputCls} placeholder="Bandung, Jawa Barat" />
                </Field>
                <Field label="No. Telepon / WA" hint="Ditampilkan dengan ikon 📞">
                  <input value={cms.footerTelepon} onChange={(e) => update({ footerTelepon: e.target.value })} className={inputCls} placeholder="+62 812-xxxx-xxxx" />
                </Field>
                <Field label="Email Kontak" hint="Ditampilkan dengan ikon ✉️">
                  <input value={cms.footerEmail} onChange={(e) => update({ footerEmail: e.target.value })} className={inputCls} placeholder="info@sorgumscm.id" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Teks Copyright" hint="Pojok kiri bawah footer">
                  <input value={cms.footerCopyright} onChange={(e) => update({ footerCopyright: e.target.value })} className={inputCls} placeholder="© 2026 Sorgum SCM..." />
                </Field>
                <Field label="Tagline Bawah Footer" hint="Pojok kanan bawah, ditampilkan hijau">
                  <input value={cms.footerBottomTagline} onChange={(e) => update({ footerBottomTagline: e.target.value })} className={inputCls} placeholder="Memberdayakan KWT..." />
                </Field>
              </div>

              {/* Footer preview */}
              <div className="rounded-xl bg-[#172C05] p-4 text-[#efe0d2] space-y-2 border border-[#2C4219]">
                <p className="text-[10px] font-bold text-[#C3E28D] uppercase tracking-wider mb-2">Preview Footer</p>
                <p className="text-sm font-extrabold text-white">{cms.siteName || '…'}</p>
                <p className="text-[11px] text-[#c4c8bb] leading-relaxed">{cms.footerTagline || '…'}</p>
                <div className="flex flex-wrap gap-3 pt-1 text-[10px] text-[#c4c8bb]">
                  <span>📍 {cms.footerAlamat || '…'}</span>
                  <span>📞 {cms.footerTelepon || '…'}</span>
                  <span>✉️ {cms.footerEmail || '…'}</span>
                </div>
                <div className="border-t border-[#2C4219] pt-2 mt-1 flex justify-between text-[10px]">
                  <span className="text-[#c4c8bb]">{cms.footerCopyright || '…'}</span>
                  <span className="text-[#C3E28D] font-semibold">{cms.footerBottomTagline || '…'}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}


      {/* Action bar */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#c4c8bb]/20">
        <button
          onClick={handleReset}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            resetConfirm
              ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
              : 'bg-[#F7F7F5] border-[#c4c8bb]/40 text-[#6B7280] hover:bg-[#efe0d2] hover:text-[#172C05]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {resetConfirm ? 'Klik lagi untuk konfirmasi reset' : 'Reset ke Default'}
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F7F7F5] border border-[#c4c8bb]/30 text-xs font-semibold text-[#2C4219] hover:bg-[#efe0d2] transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Landing Page
          </Link>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2C4219] text-white font-bold text-xs hover:bg-[#213213] shadow-md transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Simpan Konten
          </button>
        </div>
      </div>
    </div>
  );
};
