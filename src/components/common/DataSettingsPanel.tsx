import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Trash2,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Users,
  Globe,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  Package,
  Tractor,
  Warehouse,
  Factory,
} from 'lucide-react';
import { settingsApi, ClearDataResult, SeedDataResult } from '../../api/endpoints/settingsApi';
import { Toast } from '../../components/common/Toast';
import { Modal } from '../../components/common/Modal';

/**
 * Panel "Pengaturan Data" — dipakai di dalam halaman Manajemen Konten (/dashboard/cms).
 * Berisi 2 fitur:
 *  1. Kosongkan Data  → hapus semua data operasional & master (user + landing page aman)
 *  2. Isi Data Contoh → seeder sekali klik (data lengkap & saling terhubung)
 */

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
        {subtitle && <p className="text-xs text-[#6B7280] font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

type ToastState = { msg: string; type: 'success' | 'error' } | null;

export const DataSettingsPanel: React.FC = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastState>(null);

  const [clearOpen, setClearOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState('');
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<ClearDataResult | null>(null);

  const [seedOpen, setSeedOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedDataResult | null>(null);

  const doClear = async () => {
    setClearing(true);
    try {
      const res = await settingsApi.clearData();
      setClearResult(res);
      setSeedResult(null);
      setToast({ msg: `Berhasil! ${res.totalDeleted} baris data dikosongkan.`, type: 'success' });
      setClearOpen(false);
      setClearConfirm('');
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'Gagal mengosongkan data.', type: 'error' });
    } finally {
      setClearing(false);
    }
  };

  const doSeed = async () => {
    setSeeding(true);
    try {
      const res = await settingsApi.seedData();
      setSeedResult(res);
      setClearResult(null);
      setToast({ msg: 'Data contoh berhasil diisi!', type: 'success' });
      setSeedOpen(false);
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'Gagal mengisi data contoh.', type: 'error' });
      setSeedOpen(false);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <p className="text-xs text-[#6B7280] font-medium">
        Kelola isi data aplikasi: kosongkan untuk memulai dari nol, atau isi data contoh untuk mencoba semua fitur.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── 1. Kosongkan Data ── */}
        <SectionCard
          title="Kosongkan Data"
          subtitle="Hapus semua data operasional & master, mulai dari nol"
          icon={<Trash2 className="w-4 h-4" />}
        >
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-1.5">
              <p className="font-bold">Yang dihapus:</p>
              <p>Lahan, penanaman, panen, gudang & stok, sosoh, produksi olahan, varietas, produk, peralatan, sertifikat, kemasan, logistik, dan notifikasi.</p>
              <p className="font-bold pt-1">Yang tetap aman:</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-semibold">
                  <Users className="w-3 h-3" /> Akun pengguna (login)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md font-semibold">
                  <Globe className="w-3 h-3" /> Konten landing page
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setClearOpen(true); setClearConfirm(''); }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4" /> Kosongkan Semua Data
          </button>

          {clearResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Selesai — {clearResult.totalDeleted} baris dihapus
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {clearResult.cleared.filter((c) => c.deleted > 0).map((c) => (
                  <div key={c.table} className="text-[11px] text-emerald-700 flex justify-between gap-2">
                    <span>{c.label}</span>
                    <span className="font-bold">{c.deleted}</span>
                  </div>
                ))}
              </div>
              {clearResult.kept.length > 0 && (
                <p className="mt-2 pt-2 border-t border-emerald-200 text-[11px] text-emerald-700">
                  Dipertahankan: {clearResult.kept.map((k) => `${k.label} (${k.kept ?? '-'})`).join(', ')}
                </p>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── 2. Isi Data Contoh ── */}
        <SectionCard
          title="Isi Data Contoh (Seeder)"
          subtitle="Isi otomatis data lengkap yang saling terhubung & bisa dilacak"
          icon={<Database className="w-4 h-4" />}
        >
          <p className="text-xs text-[#44483E] leading-relaxed">
            Sekali klik, aplikasi terisi data contoh lengkap dari <b>lahan → beberapa musim tanam → panen (ratoon 1-3) → gudang → sosoh → produksi olahan</b>,
            plus master varietas, produk, peralatan, sertifikat, kemasan, logistik, dan notifikasi.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Tractor className="w-4 h-4" />, label: 'Lahan & Tanam' },
              { icon: <Sprout className="w-4 h-4" />, label: 'Panen' },
              { icon: <Warehouse className="w-4 h-4" />, label: 'Gudang & Stok' },
              { icon: <Factory className="w-4 h-4" />, label: 'Produksi Olahan' },
            ].map((x) => (
              <div key={x.label} className="flex items-center gap-2 p-2.5 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl">
                <span className="text-[#2C4219]">{x.icon}</span>
                <span className="text-[11px] font-semibold text-[#172C05]">{x.label}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSeedOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2C4219] text-white rounded-xl text-sm font-bold hover:bg-[#213213] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
          >
            <Database className="w-4 h-4" /> Isi Data Contoh
          </button>

          <p className="text-[11px] text-[#9CA3AF]">
            Catatan: pengisian data contoh hanya bisa bila data masih kosong. Kosongkan data dulu bila sudah ada isinya.
          </p>

          {seedResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Data contoh berhasil diisi!
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {Object.entries(seedResult.counts).map(([k, v]) => (
                  <div key={k} className="text-[11px] text-emerald-700 flex justify-between gap-2">
                    <span className="capitalize">{k}</span>
                    <span className="font-bold">{v}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer"
              >
                Lihat Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Modal konfirmasi kosongkan data ── */}
      <Modal
        isOpen={clearOpen}
        onClose={() => !clearing && setClearOpen(false)}
        title="Kosongkan Semua Data?"
        subtitle="Tindakan ini tidak bisa dibatalkan"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={clearing}
              onClick={() => setClearOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-[#44483E] hover:bg-[#F7F7F5] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={clearing || clearConfirm.trim().toUpperCase() !== 'KOSONGKAN'}
              onClick={doClear}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {clearing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {clearing ? 'Menghapus…' : 'Ya, Kosongkan'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 space-y-1">
              <p className="font-bold">Semua data operasional & master akan dihapus permanen.</p>
              <p>Data <b>akun pengguna</b> dan <b>konten landing page</b> tetap aman dan tidak terhapus.</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172C05] mb-1.5">
              Ketik <span className="font-mono text-red-600">KOSONGKAN</span> untuk konfirmasi:
            </label>
            <input
              type="text"
              value={clearConfirm}
              onChange={(e) => setClearConfirm(e.target.value)}
              placeholder="KOSONGKAN"
              autoFocus
              className="w-full px-3 py-2.5 bg-[#fff1e5] border border-[#c4c8bb]/40 rounded-xl text-sm font-medium text-[#221A12] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            />
          </div>
        </div>
      </Modal>

      {/* ── Modal konfirmasi isi data contoh ── */}
      <Modal
        isOpen={seedOpen}
        onClose={() => !seeding && setSeedOpen(false)}
        title="Isi Data Contoh?"
        subtitle="Data contoh lengkap akan dibuat otomatis"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={seeding}
              onClick={() => setSeedOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-[#44483E] hover:bg-[#F7F7F5] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={seeding}
              onClick={doSeed}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2C4219] text-white rounded-xl text-sm font-bold hover:bg-[#213213] disabled:opacity-40 transition-all cursor-pointer"
            >
              {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {seeding ? 'Mengisi…' : 'Ya, Isi Data'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3.5 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl">
            <Package className="w-5 h-5 text-[#2C4219] shrink-0 mt-0.5" />
            <p className="text-xs text-[#44483E] leading-relaxed">
              Akan dibuat: 4 lahan dengan <b>beberapa musim tanam</b> & panen berulang (ratoon), gudang + stok gabah,
              proses sosoh jadi sorgum, batch produksi olahan, serta data pendukung lainnya.
              Semua saling terhubung sehingga fitur <b>lacak batch</b> bisa dicoba.
            </p>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">
            Proses ini hanya berjalan bila data masih kosong, agar tidak menimpa data asli.
          </p>
        </div>
      </Modal>
    </div>
  );
};
