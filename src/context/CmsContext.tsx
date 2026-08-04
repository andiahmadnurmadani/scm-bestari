import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cmsApi } from '../api/endpoints/cmsApi';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CmsStat {
  value: string;
  label: string;
  sublabel: string;
}

export interface CmsHeroImage {
  src: string;
  title: string;
}

export interface CmsProduct {
  name: string;
  img: string;
  badge: string;
  desc: string;
  pack: string;
  tag: string;
}

export interface CmsWorkflowStep {
  number: string;
  title: string;
  desc: string;
}

export interface CmsFaq {
  question: string;
  answer: string;
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
  logo: string;

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

  // Navbar
  navLinks: { label: string; section: string }[];
  navbarLogin: string;

  // Hero gallery (gambar slideshow)
  heroImages: CmsHeroImage[];

  // Produk unggulan
  productsBadge: string;
  productsTitle: string;
  productsSubtitle: string;
  products: CmsProduct[];

  // Alur rantai pasok
  workflowTitle: string;
  workflowSteps: CmsWorkflowStep[];

  // FAQ
  faqBadge: string;
  faqTitle: string;
  faqSubtitle: string;
  faqs: CmsFaq[];
}

// ── Default content (matches current LandingPage) ─────────────────────────────

export const defaultCms: CmsData = {
  siteName: 'Sorgum SCM',
  siteTagline: 'Rantai Pasok Terintegrasi',
  navbarCta: 'Masuk Dashboard',
  logo: '',

  heroBadge: 'Sistem Informasi Rantai Pasok Sorgum Indonesia',
  heroHeadlinePre: 'Transparansi Rantai Pasok',
  heroHeadlineHighlight: 'Sorgum',
  heroHeadlinePost: 'dari Akar hingga Meja',
  heroSubtitle:
    'Platform digital terpadu untuk monitoring panen, digitalisasi sertifikat halal & P-IRT, manajemen peralatan pertanian, hingga tata kelola logistik keuangan KWT & Kelompok Tani Sorgum.',
  heroCta1: 'Jelajahi Dashboard Admin',
  heroCta2: 'Masuk Dashboard',
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
  ctaBtn1: 'Masuk Dashboard Admin',
  ctaBtn2: 'Masuk ke Dashboard Admin',

  footerTagline: 'Platform Manajemen Rantai Pasok Sorgum untuk Kelompok Wanita Tani Indonesia.',
  footerAlamat: 'Bandung, Jawa Barat, Indonesia',
  footerTelepon: '+62 812-3456-7890',
  footerEmail: 'info@sorgumscm.id',
  footerCopyright: '© 2026 Sorgum SCM. Seluruh hak cipta dilindungi.',
  footerBottomTagline: 'Memberdayakan Kelompok Wanita Tani & Petani Lokal',

  navLinks: [
    { label: 'Beranda', section: 'beranda' },
    { label: 'Fitur Utama', section: 'fitur' },
    { label: 'Produk Olahan', section: 'produk' },
    { label: 'FAQ', section: 'faq' },
  ],
  navbarLogin: 'Masuk',

  heroImages: [
    { src: '', title: 'Lahan Sorgum KWT Subang' },
    { src: '', title: 'Beras Sorgum Kemasan Vacuum' },
    { src: '', title: 'Tepung Sorgum Bebas Gluten' },
    { src: '', title: 'Camilan Rengginang Sorgum Gurih' },
  ],

  productsBadge: 'Diversifikasi Olahan Pangan',
  productsTitle: 'Produk Turunan Sorgum KWT Berstandar Mutu',
  productsSubtitle: 'Geser untuk menjelajahi berbagai macam olahan sorgum sehat hasil produksi kami.',
  products: [
    {
      name: 'Tepung Sorgum Bioguma',
      img: '',
      badge: 'Gluten-Free',
      desc: 'Pengganti tepung terigu sehat untuk pembuatan kue, roti, dan olahan mie sehat.',
      pack: 'Kemasan 500g Pouch',
      tag: 'Halal & P-IRT',
    },
    {
      name: 'Beras Sorgum Sosoh',
      img: '',
      badge: 'Low GI',
      desc: 'Biji sorgum pilihan kaya serat & indeks glikemik rendah, ideal untuk penderita diabetes.',
      pack: 'Kemasan 1 Kg Vacuum',
      tag: 'Grade A',
    },
    {
      name: 'Gula Nira Sorgum Cair',
      img: '',
      badge: '100% Organik',
      desc: 'Pemanis alami hasil perasan batang sorgum segar tanpa bahan pengawet sintesis.',
      pack: 'Botol Kaca 350ml',
      tag: 'Nectar',
    },
    {
      name: 'Rengginang Sorgum',
      img: '',
      badge: 'Siap Makan',
      desc: 'Camilan tradisional renyah dengan rasa gurih alami hasil kreasi kelompok wanita tani.',
      pack: 'Box Custom 250g',
      tag: 'Gurih',
    },
  ],

  workflowTitle: 'Alur Digital Rantai Pasok Sorgum KWT',
  workflowSteps: [
    { number: '01', title: 'Panen & Lahan', desc: 'Pendataan varietas & tonase hasil panen kelompok tani.' },
    { number: '02', title: 'Sertifikasi & Batch', desc: 'Pencatatan batch olahan & tracking sertifikat Halal/P-IRT.' },
    { number: '03', title: 'Distribusi & Logistik', desc: 'Pencatatan nota, stok pengemasan, & arus kas KWT.' },
  ],

  faqBadge: 'Tanya Jawab Ramah KWT',
  faqTitle: 'Pertanyaan Ringkas Ibu KWT',
  faqSubtitle: 'Jawaban lengkap untuk pertanyaan yang sering ditanyakan pengurus dan anggota kelompok tani.',
  faqs: [
    {
      question: 'Apakah aplikasi Sorgum SCM ini sulit digunakan untuk pemula?',
      answer:
        'Sangat mudah! Aplikasi ini dirancang khusus dengan tombol besar, petunjuk langkah demi langkah, dan bahasa Indonesia yang ramah. Ibu-ibu KWT hanya perlu memasukkan angka tonase panen atau mengunggah foto nota, sisanya sistem yang menghitung otomatis.',
    },
    {
      question: 'Bagaimana cara mendaftarkan Kelompok Wanita Tani (KWT) kami?',
      answer:
        'Sangat cepat! Klik tombol "Daftar Akun KWT Baru", isi nama kelompok, lokasi lahan, dan kontak ketua. Tim pendamping KWT kami akan menghubungi Anda melalui WhatsApp untuk membantu proses aktivasi gratis.',
    },
    {
      question: 'Apakah data keuangan dan transaksi kami aman?',
      answer:
        'Ya, 100% aman dan terlindungi digital! Seluruh data panen, stok kemasan, dan pengeluaran KWT tersimpan rapi dan hanya dapat diakses oleh pengurus berwenang yang diberi password.',
    },
    {
      question: 'Apakah catatan panen & produksi bisa dicetak untuk laporan bulanan?',
      answer:
        'Tentu bisa! Setiap modul (Panen, Sertifikasi, Logistik) menyediakan tombol "Export / Cetak". Anda dapat mengunduh laporan rapi dalam bentuk PDF yang siap dibagikan dalam rapat bulanan KWT.',
    },
  ],
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
  updateHeroImage: (index: number, patch: Partial<CmsHeroImage>) => void;
  updateProduct: (index: number, patch: Partial<CmsProduct>) => void;
  updateWorkflowStep: (index: number, patch: Partial<CmsWorkflowStep>) => void;
  updateFaq: (index: number, patch: Partial<CmsFaq>) => void;
  reset: () => void;
}

const CmsContext = createContext<CmsContextValue | null>(null);

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cms, setCms] = useState<CmsData>(loadFromStorage);
  const [hydrated, setHydrated] = useState(false);

  // Muat konten CMS dari backend saat aplikasi pertama dibuka.
  // Jika backend punya data, maka data backend menang (single source of truth).
  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        const remote = await cmsApi.getContent();
        if (!cancelled && remote && typeof remote === 'object') {
          const merged = { ...defaultCms, ...remote };
          setCms(merged);
          saveToStorage(merged);
        }
      } catch {
        // Backend offline → gunakan data localStorage yang sudah ada
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Simpan otomatis ke backend setiap kali cms berubah (setelah hidrasi awal).
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      try {
        void cmsApi.saveContent(cms);
      } catch {
        // Abaikan — konten tetap tersimpan di localStorage sebagai cadangan
      }
    }, 800); // debounce ringan
    return () => clearTimeout(timer);
  }, [cms, hydrated]);

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

  const updateHeroImage = useCallback((index: number, patch: Partial<CmsHeroImage>) => {
    setCms((prev) => {
      const heroImages = prev.heroImages.map((c, i) => (i === index ? { ...c, ...patch } : c));
      const next = { ...prev, heroImages };
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateProduct = useCallback((index: number, patch: Partial<CmsProduct>) => {
    setCms((prev) => {
      const products = prev.products.map((c, i) => (i === index ? { ...c, ...patch } : c));
      const next = { ...prev, products };
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateWorkflowStep = useCallback((index: number, patch: Partial<CmsWorkflowStep>) => {
    setCms((prev) => {
      const workflowSteps = prev.workflowSteps.map((c, i) => (i === index ? { ...c, ...patch } : c));
      const next = { ...prev, workflowSteps };
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateFaq = useCallback((index: number, patch: Partial<CmsFaq>) => {
    setCms((prev) => {
      const faqs = prev.faqs.map((c, i) => (i === index ? { ...c, ...patch } : c));
      const next = { ...prev, faqs };
      saveToStorage(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setCms(defaultCms);
    try {
      void cmsApi.resetContent();
    } catch {
      // Abaikan — coba hapus dari backend
    }
  }, []);

  return (
    <CmsContext.Provider
      value={{ cms, update, updateStat, updateFeatureCard, updateHeroImage, updateProduct, updateWorkflowStep, updateFaq, reset }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = (): CmsContextValue => {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error('useCms must be used inside CmsProvider');
  return ctx;
};
