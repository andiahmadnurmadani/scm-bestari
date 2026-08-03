import React, { createContext, useContext, useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CmsStat {
  value: string;
  label: string;
  sublabel: string;
}

export interface CmsFeatureCard {
  title: string;
  desc: string;
}

export interface CmsData {
  // Pengaturan umum
  siteName: string;
  siteTagline: string;
  navbarCta: string;

  // Hero section
  heroBadge: string;
  heroHeadlinePre: string;
  heroHeadlineHighlight: string;
  heroHeadlinePost: string;
  heroSubtitle: string;
  heroCta1: string;
  heroCta2: string;
  heroTrust1: string;
  heroTrust2: string;
  heroTrust3: string;

  // Stats bar
  stats: CmsStat[];

  // Features section
  featuresBadge: string;
  featuresTitle: string;
  featuresSubtitle: string;
  featureCards: CmsFeatureCard[];

  // CTA Banner
  ctaBadge: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaBtn1: string;
  ctaBtn2: string;

  // Footer
  footerTagline: string;
  footerAlamat: string;
  footerTelepon: string;
  footerEmail: string;
  footerCopyright: string;
  footerBottomTagline: string;
}

// ── Default content (matches current LandingPage) ─────────────────────────────

export const defaultCms: CmsData = {
  siteName: 'Sorgum SCM',
  siteTagline: 'Rantai Pasok Terintegrasi',
  navbarCta: 'Daftar Sekarang',

  heroBadge: 'Sistem Informasi Rantai Pasok Sorgum Indonesia',
  heroHeadlinePre: 'Transparansi Rantai Pasok',
  heroHeadlineHighlight: 'Sorgum',
  heroHeadlinePost: 'dari Akar hingga Meja',
  heroSubtitle:
    'Platform digital terpadu untuk monitoring panen, digitalisasi sertifikat halal & P-IRT, manajemen peralatan pertanian, hingga tata kelola logistik keuangan KWT & Kelompok Tani Sorgum.',
  heroCta1: 'Jelajahi Dashboard Admin',
  heroCta2: 'Daftar Mitra KWT Baru',
  heroTrust1: 'Gratis untuk KWT',
  heroTrust2: 'Data Aman & Terenkripsi',
  heroTrust3: 'Tanpa Biaya Langganan',

  stats: [
    { value: '50.000+', label: 'Kg Panen Terdata', sublabel: 'Monitoring Lahan SCM' },
    { value: 'Rp 1,2 M', label: 'Nilai Transaksi', sublabel: 'Transparan & Akuntabel' },
    { value: '30%', label: 'Efisiensi Logistik', sublabel: 'Hemat Biaya Operasional' },
    { value: '15+ KWT', label: 'Mitra Kelompok Tani', sublabel: 'Ekonomi Desa Berdaya' },
  ],

  featuresBadge: 'Solusi End-to-End Pengelolaan Sorgum',
  featuresTitle: 'Tiga Pilar Utama Tata Kelola Rantai Pasok Sorgum',
  featuresSubtitle: 'Setiap modul terintegrasi untuk membantu mempercepat digitalisasi kelompok wanita tani.',
  featureCards: [
    {
      title: 'Monitoring Panen & Lahan',
      desc: 'Pemetaan luas hektar tanah, irigasi teknis, jadwal tanam, hingga pencatatan tonase hasil panen berdasarkan varietas Bioguma, Numbu, & Suri 4.',
    },
    {
      title: 'Produksi & Sertifikasi Legal',
      desc: 'Kelola batch olahan Tepung Sorgum, Rengginang, dan Gula Cair Nira. Pantau status Sertifikat Halal BPJPH, Izin P-IRT, dan Uji Lab Gluten-Free.',
    },
    {
      title: 'Logistik & Transaksi Keuangan',
      desc: 'Pencatatan pengeluaran pupuk, sewa truk distribusi, persediaan kemasan Pouch & Box, hingga verifikasi nota digital secara akurat.',
    },
  ],

  ctaBadge: 'Pendampingan Digital KWT Gratis',
  ctaTitle: 'Siap Digitalisasi Rantai Pasok Sorgum Anda?',
  ctaSubtitle:
    'Bergabunglah bersama 15+ Kelompok Wanita Tani yang telah merasakan kemudahan mencatat panen dan memantau legalitas sertifikat secara transparan.',
  ctaBtn1: 'Daftar Akun KWT Baru',
  ctaBtn2: 'Masuk ke Dashboard Admin',

  footerTagline: 'Platform Manajemen Rantai Pasok Sorgum untuk Kelompok Wanita Tani Indonesia.',
  footerAlamat: 'Bandung, Jawa Barat, Indonesia',
  footerTelepon: '+62 812-3456-7890',
  footerEmail: 'info@sorgumscm.id',
  footerCopyright: '© 2026 Sorgum SCM. Seluruh hak cipta dilindungi.',
  footerBottomTagline: 'Memberdayakan Kelompok Wanita Tani & Petani Lokal',
};

// ── Load / save helpers ───────────────────────────────────────────────────────

const STORAGE_KEY = 'sorgum_cms_data';

const loadFromStorage = (): CmsData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultCms, ...JSON.parse(raw) };
  } catch {}
  return defaultCms;
};

const saveToStorage = (data: CmsData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

// ── Context ───────────────────────────────────────────────────────────────────

interface CmsContextValue {
  cms: CmsData;
  update: (patch: Partial<CmsData>) => void;
  updateStat: (index: number, patch: Partial<CmsStat>) => void;
  updateFeatureCard: (index: number, patch: Partial<CmsFeatureCard>) => void;
  reset: () => void;
}

const CmsContext = createContext<CmsContextValue | null>(null);

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cms, setCms] = useState<CmsData>(loadFromStorage);

  const update = useCallback((patch: Partial<CmsData>) => {
    setCms((prev) => {
      const next = { ...prev, ...patch };
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateStat = useCallback((index: number, patch: Partial<CmsStat>) => {
    setCms((prev) => {
      const stats = prev.stats.map((s, i) => (i === index ? { ...s, ...patch } : s));
      const next = { ...prev, stats };
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateFeatureCard = useCallback((index: number, patch: Partial<CmsFeatureCard>) => {
    setCms((prev) => {
      const featureCards = prev.featureCards.map((c, i) => (i === index ? { ...c, ...patch } : c));
      const next = { ...prev, featureCards };
      saveToStorage(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCms(defaultCms);
  }, []);

  return (
    <CmsContext.Provider value={{ cms, update, updateStat, updateFeatureCard, reset }}>
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = (): CmsContextValue => {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error('useCms must be used inside CmsProvider');
  return ctx;
};
