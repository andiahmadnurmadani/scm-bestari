import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected / Admin Dashboard Routes */}
        <Route path="/dashboard" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="panen" element={<PanenPage />} />
          <Route path="lahan" element={<LahanPage />} />
          <Route path="peralatan" element={<PeralatanPage />} />
          <Route path="produksi" element={<ProduksiPage />} />
          <Route path="sertifikat" element={<SertifikatPage />} />
          <Route path="kemasan" element={<KemasanPage />} />
          <Route path="logistik" element={<LogistikPage />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
