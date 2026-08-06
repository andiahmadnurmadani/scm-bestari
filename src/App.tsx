import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CmsProvider } from './context/CmsContext';
import { ApiOfflineBanner } from './components/common/ApiOfflineBanner';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';

// Admin Layout & Pages
import { AdminLayout } from './components/layout/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { PanenPage } from './pages/admin/PanenPage';
import { LahanPage } from './pages/admin/LahanPage';
import { PeralatanPage } from './pages/admin/PeralatanPage';
import { ProduksiPage } from './pages/admin/ProduksiPage';
import { SertifikatPage } from './pages/admin/SertifikatPage';
import { KemasanPage } from './pages/admin/KemasanPage';
import { LogistikPage } from './pages/admin/LogistikPage';
import { ProfilePage } from './pages/admin/ProfilePage';
import { CmsPage } from './pages/admin/CmsPage';
import { MasterVarietasPage } from './pages/admin/MasterVarietasPage';

export default function App() {
  return (
    <CmsProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

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
    </CmsProvider>
  );
}

