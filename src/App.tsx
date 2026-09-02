import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CmsProvider } from './context/CmsContext';
import { UnitSettingsProvider } from './context/UnitSettingsContext';
import { AppModeProvider } from './context/AppModeContext';
import { ThemeProvider } from './context/ThemeContext';
import { ApiOfflineBanner } from './components/common/ApiOfflineBanner';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';

// Admin Layout & Pages (Pro Mode)
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { PanenPage } from './pages/admin/PanenPage';
import { LahanPage } from './pages/admin/LahanPage';
import { PeralatanPage } from './pages/admin/PeralatanPage';
import { ProduksiPage } from './pages/admin/ProduksiPage';
import { SertifikatPage } from './pages/admin/SertifikatPage';
import { KemasanPage } from './pages/admin/KemasanPage';
import { GudangPage } from './pages/admin/GudangPage';
import { LogistikPage } from './pages/admin/LogistikPage';
import { ProfilePage } from './pages/admin/ProfilePage';
import { CmsPage } from './pages/admin/CmsPage';
import { MasterVarietasPage } from './pages/admin/MasterVarietasPage';

// Lite Mode Layout & Pages
import { LiteLayout } from './components/layout/lite/LiteLayout';
import { LiteDashboardPage } from './pages/lite/LiteDashboardPage';
import { LitePanenPage } from './pages/lite/LitePanenPage';
import { LiteLahanPage } from './pages/lite/LiteLahanPage';
import { LiteProduksiPage } from './pages/lite/LiteProduksiPage';
import { LiteVarietasPage } from './pages/lite/LiteVarietasPage';
import { LiteGudangPage } from './pages/lite/LiteGudangPage';
import { LiteProfilePage } from './pages/lite/LiteProfilePage';

export default function App() {
  return (
    <ThemeProvider>
      <CmsProvider>
        <UnitSettingsProvider>
          <AppModeProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* ── LITE MODE Routes ──────────────────────────────────────── */}
              <Route
                path="/lite"
                element={
                  <ProtectedRoute>
                    <LiteLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<LiteDashboardPage />} />
                <Route path="panen" element={<LitePanenPage />} />
                <Route path="lahan" element={<LiteLahanPage />} />
                <Route path="produksi" element={<LiteProduksiPage />} />
                <Route path="varietas" element={<LiteVarietasPage />} />
                <Route path="gudang" element={<LiteGudangPage />} />
                <Route path="profil" element={<LiteProfilePage />} />
              </Route>

              {/* ── PRO MODE Routes (Dashboard Admin) ──────────────────── */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="panen" element={<PanenPage />} />
                <Route path="lahan" element={<LahanPage />} />
                <Route path="peralatan" element={<PeralatanPage />} />
                <Route path="produksi" element={<ProduksiPage />} />
                <Route path="sertifikat" element={<SertifikatPage />} />
                <Route path="kemasan" element={<KemasanPage />} />
                <Route path="gudang" element={<GudangPage />} />
                <Route path="logistik" element={<LogistikPage />} />
                <Route path="profil" element={<ProfilePage />} />
                <Route path="cms" element={<CmsPage />} />
                <Route path="master/varietas" element={<MasterVarietasPage />} />
                {/* Backward compat: keep old integrasi route */}
                <Route path="integrasi" element={<Navigate to="/dashboard/cms" replace />} />
              </Route>

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Popup saat backend tidak terhubung */}
            <ApiOfflineBanner />
          </BrowserRouter>
        </AppModeProvider>
      </UnitSettingsProvider>
    </CmsProvider>
  </ThemeProvider>
  );
}
