import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CmsProvider } from './context/CmsContext';
import { UnitSettingsProvider } from './context/UnitSettingsContext';
import { AppModeProvider } from './context/AppModeContext';
import { ApiOfflineBanner } from './components/common/ApiOfflineBanner';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { TracePage } from './pages/public/TracePage';

// Admin Layout & Pages
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
import { MasterProdukPage } from './pages/admin/MasterProdukPage';

// Lite Mode Layout & Pages
import { LiteLayout } from './components/layout/lite/LiteLayout';
import { LiteDashboardPage } from './pages/lite/LiteDashboardPage';
import { LiteLahanPage } from './pages/lite/LiteLahanPage';
import { LitePanenPage } from './pages/lite/LitePanenPage';
import { LiteGudangPage } from './pages/lite/LiteGudangPage';
import { LiteProduksiPage } from './pages/lite/LiteProduksiPage';
import { LiteProdukPage } from './pages/lite/LiteProdukPage';
import { LiteVarietasPage } from './pages/lite/LiteVarietasPage';
import { LiteProfilePage } from './pages/lite/LiteProfilePage';

export default function App() {
  return (
    <CmsProvider>
        <UnitSettingsProvider>
          <AppModeProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/trace/:kodeBatchStok" element={<TracePage />} />

                {/* Lite Mode Routes (Mode Mudah KWT) */}
                <Route
                  path="/lite"
                  element={
                    <ProtectedRoute>
                      <LiteLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<LiteDashboardPage />} />
                  <Route path="lahan" element={<LiteLahanPage />} />
                  <Route path="panen" element={<LitePanenPage />} />
                  <Route path="gudang" element={<LiteGudangPage />} />
                  <Route path="produksi" element={<LiteProduksiPage />} />
                  <Route path="produk" element={<LiteProdukPage />} />
                  <Route path="varietas" element={<LiteVarietasPage />} />
                  <Route path="profil" element={<LiteProfilePage />} />
                </Route>

                {/* Protected / Admin Dashboard Routes */}
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
                  <Route path="master/produk" element={<MasterProdukPage />} />
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
  );
}
