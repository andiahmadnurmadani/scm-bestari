import React, { useState } from 'react';
import {
  Settings,
  Key,
  Globe,
  Webhook,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  AlertCircle,
  FileCode2,
  ShieldCheck,
  Activity,
  Link2,
  Server,
  Sprout,
  Factory,
  Truck,
  LayoutDashboard,
} from 'lucide-react';
import { Toast } from '../../components/common/Toast';

// ── Helpers ──────────────────────────────────────────────────────────────────

const generateKey = () =>
  'sk_live_' +
  Array.from({ length: 36 }, () =>
    '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 36)]
  ).join('');

const generateWebhookSecret = () =>
  'whsec_' +
  Array.from({ length: 32 }, () =>
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'[
      Math.floor(Math.random() * 62)
    ]
  ).join('');

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, badge, children }) => (
  <div className="bg-white rounded-2xl border border-[#c4c8bb]/30 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-[#c4c8bb]/20 bg-[#F7F7F5]">
      <div className="flex items-center gap-2.5">
        <span className="text-[#2C4219]">{icon}</span>
        <div>
          <h3 className="text-sm font-bold text-[#172C05]">{title}</h3>
          {subtitle && <p className="text-[10px] text-[#6B7280] font-medium mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {badge}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const CopyField: React.FC<{ label: string; value: string; secret?: boolean }> = ({
  label,
  value,
  secret = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(!secret);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-[#172C05] uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center bg-[#F7F7F5] border border-[#c4c8bb]/40 rounded-xl px-3 py-2 gap-2 min-w-0">
          <code className="flex-1 text-[11px] font-mono text-[#2C4219] truncate">
            {visible ? value : '•'.repeat(Math.min(value.length, 40))}
          </code>
        </div>
        {secret && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="p-2 rounded-xl bg-[#F7F7F5] border border-[#c4c8bb]/40 text-[#6B7280] hover:text-[#2C4219] hover:bg-[#efe0d2] transition-colors cursor-pointer shrink-0"
            title={visible ? 'Sembunyikan' : 'Tampilkan'}
          >
            {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
            copied
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-[#F7F7F5] border-[#c4c8bb]/40 text-[#6B7280] hover:text-[#2C4219] hover:bg-[#efe0d2]'
          }`}
          title="Salin"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

// Endpoint row
const EndpointRow: React.FC<{
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  desc: string;
  auth?: boolean;
}> = ({ method, path, desc, auth = true }) => {
  const colors: Record<string, string> = {
    GET: 'bg-blue-50 text-blue-700 border-blue-200',
    POST: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PUT: 'bg-amber-50 text-amber-700 border-amber-200',
    PATCH: 'bg-orange-50 text-orange-700 border-orange-200',
    DELETE: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-2.5 border-b border-[#c4c8bb]/15 last:border-0">
      <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-md border w-fit ${colors[method]}`}>
        {method}
      </span>
      <code className="text-[11px] font-mono text-[#2C4219] flex-1 bg-[#F7F7F5] px-2.5 py-1 rounded-lg border border-[#c4c8bb]/20">
        {path}
      </code>
      <span className="text-[10px] text-[#6B7280] font-medium sm:w-52 shrink-0">{desc}</span>
      {auth && (
        <span className="inline-flex items-center gap-1 text-[9px] text-[#A8B774] font-bold border border-[#A8B774]/30 bg-[#C3E28D]/15 px-1.5 py-0.5 rounded-md w-fit">
          <ShieldCheck className="w-2.5 h-2.5" /> Bearer
        </span>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const IntegrationPage: React.FC = () => {
  // API Config state
  const [apiBaseUrl, setApiBaseUrl] = useState(
    (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api'
  );
  const [apiKey, setApiKey] = useState(generateKey());
  const [webhookUrl, setWebhookUrl] = useState('https://');
  const [webhookSecret, setWebhookSecret] = useState(generateWebhookSecret());
  const [webhookEvents, setWebhookEvents] = useState<string[]>([
    'panen.created', 'sertifikat.updated', 'logistik.expense.created',
  ]);
  const [savedSuccess, setSavedSuccess] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'endpoints' | 'logs'>('config');

  const allEvents = [
    'panen.created', 'panen.updated', 'sertifikat.created', 'sertifikat.updated',
    'sertifikat.expired', 'logistik.expense.created', 'produksi.batch.created',
    'lahan.updated', 'kemasan.stok.rendah',
  ];

  const toggleEvent = (ev: string) => {
    setWebhookEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setApiKey(generateKey());
      setWebhookSecret(generateWebhookSecret());
      setRegenerating(false);
    }, 800);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess('Konfigurasi berhasil disimpan & diterapkan!');
    setTimeout(() => setSavedSuccess(''), 3500);
  };

  const tabs = [
    { id: 'config' as const, label: 'Konfigurasi API', icon: <Key className="w-3.5 h-3.5" /> },
    { id: 'endpoints' as const, label: 'REST Endpoints', icon: <FileCode2 className="w-3.5 h-3.5" /> },
    { id: 'logs' as const, label: 'Log Aktivitas', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  const sampleLogs = [
    { time: '09:21:04', status: 200, method: 'POST', path: '/api/panen', app: 'Sistem Internal' },
    { time: '09:18:47', status: 200, method: 'GET', path: '/api/sertifikat', app: 'Sistem Internal' },
    { time: '09:15:12', status: 401, method: 'POST', path: '/api/logistik/expense', app: 'Unknown' },
    { time: '09:10:55', status: 200, method: 'GET', path: '/api/dashboard/summary', app: 'Sistem Internal' },
    { time: '09:05:30', status: 422, method: 'POST', path: '/api/lahan', app: 'Unknown' },
    { time: '09:01:11', status: 200, method: 'GET', path: '/api/kemasan', app: 'Sistem Internal' },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-[#172C05] flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#C3E28D]/40 text-[#2C4219] flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </span>
          Pengaturan & Integrasi API
        </h1>
        <p className="text-xs text-[#6B7280] font-medium mt-0.5 ml-9">
          Kelola koneksi API, webhook, dan aplikasi eksternal yang terhubung dengan Sorgum SCM
        </p>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Activity className="w-4 h-4" />, value: '1,247', label: 'Request Hari Ini', color: 'bg-blue-50 text-blue-700' },
          { icon: <Webhook className="w-4 h-4" />, value: '3', label: 'Event Aktif', color: 'bg-amber-50 text-amber-700' },
          { icon: <ShieldCheck className="w-4 h-4" />, value: '99.8%', label: 'Uptime API', color: 'bg-[#C3E28D]/30 text-[#2C4219]' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#c4c8bb]/30 shadow-sm p-3.5 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-base font-bold text-[#172C05] leading-none">{s.value}</p>
              <p className="text-[9px] text-[#6B7280] font-semibold mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
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

      {/* ═══ TAB: KONFIGURASI API ═══ */}
      {activeTab === 'config' && (
        <form onSubmit={handleSave} className="space-y-4">
          {/* API Server Config */}
          <SectionCard
            title="Konfigurasi Server API"
            subtitle="URL backend yang digunakan Sorgum SCM untuk semua permintaan data"
            icon={<Server className="w-4 h-4" />}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#172C05] uppercase tracking-wider">
                  API Base URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type="url"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#F7F7F5] border border-[#c4c8bb]/40 rounded-xl text-xs font-mono text-[#221A12] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 focus:border-[#2C4219] focus:bg-white transition-all"
                      placeholder="https://api.sorgum-scm.id/api"
                    />
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-[#F7F7F5] border border-[#c4c8bb]/40 text-xs font-semibold text-[#2C4219] hover:bg-[#efe0d2] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Ping
                  </button>
                </div>
                <p className="text-[10px] text-[#9CA3AF] font-medium">
                  Ubah variabel <code className="bg-[#F7F7F5] px-1 rounded">VITE_API_BASE_URL</code> di file <code className="bg-[#F7F7F5] px-1 rounded">.env</code> untuk lingkungan produksi.
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-blue-500" />
                <p className="font-medium">Sistem terhubung ke <strong>API backend Node.js + MySQL</strong> secara real-time. Semua data (panen, produksi, kemasan, logistik) diambil langsung dari server.</p>
              </div>
            </div>
          </SectionCard>

          {/* API Key */}
          <SectionCard
            title="API Key"
            subtitle="Kunci autentikasi Bearer untuk aplikasi eksternal yang ingin mengakses data"
            icon={<Key className="w-4 h-4" />}
            badge={
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                AKTIF
              </span>
            }
          >
            <div className="space-y-4">
              <CopyField label="Secret API Key (Bearer Token)" value={apiKey} secret />

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                  Regenerate Key
                </button>
                <p className="text-[10px] text-[#9CA3AF] font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Regenerate akan menonaktifkan semua koneksi yang menggunakan key lama.
                </p>
              </div>

              <div className="bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 p-3.5">
                <p className="text-[10px] font-bold text-[#172C05] uppercase tracking-wider mb-2">Contoh Penggunaan</p>
                <code className="text-[10px] font-mono text-[#2C4219] block whitespace-pre-wrap break-all">
{`curl -X GET "${apiBaseUrl}/panen" \\
  -H "Authorization: Bearer ${apiKey.slice(0, 20)}..." \\
  -H "Content-Type: application/json"`}
                </code>
              </div>
            </div>
          </SectionCard>

          {/* Webhook */}
          <SectionCard
            title="Webhook Konfigurasi"
            subtitle="Kirim notifikasi otomatis ke URL eksternal saat event tertentu terjadi"
            icon={<Webhook className="w-4 h-4" />}
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#172C05] uppercase tracking-wider">
                  Webhook Endpoint URL
                </label>
                <div className="relative">
                  <Link2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-app.com/webhook/sorgum-scm"
                    className="w-full pl-9 pr-3 py-2 bg-[#F7F7F5] border border-[#c4c8bb]/40 rounded-xl text-xs font-mono text-[#221A12] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 focus:border-[#2C4219] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <CopyField label="Webhook Signing Secret" value={webhookSecret} secret />

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-[#172C05] uppercase tracking-wider">
                  Event yang Dikirim
                </p>
                <div className="flex flex-wrap gap-2">
                  {allEvents.map((ev) => (
                    <button
                      key={ev}
                      type="button"
                      onClick={() => toggleEvent(ev)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        webhookEvents.includes(ev)
                          ? 'bg-[#2C4219] text-white border-[#2C4219]'
                          : 'bg-[#F7F7F5] text-[#6B7280] border-[#c4c8bb]/40 hover:border-[#2C4219]/40 hover:text-[#2C4219]'
                      }`}
                    >
                      {ev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 p-3.5">
                <p className="text-[10px] font-bold text-[#172C05] uppercase tracking-wider mb-2">Contoh Payload Webhook</p>
                <code className="text-[10px] font-mono text-[#2C4219] block whitespace-pre-wrap">
{`{
  "event": "panen.created",
  "timestamp": "2026-08-03T09:21:00Z",
  "data": {
    "id": "PHV-2026-001",
    "varietas": "Bioguma",
    "hasil_kg": 1850,
    "status": "Selesai"
  }
}`}
                </code>
              </div>
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2C4219] text-white font-bold text-sm hover:bg-[#213213] shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              Simpan Konfigurasi
            </button>
          </div>
        </form>
      )}

      {/* ═══ TAB: REST ENDPOINTS ═══ */}
      {activeTab === 'endpoints' && (
        <SectionCard
          title="Dokumentasi REST API"
          subtitle="Semua endpoint yang tersedia untuk integrasi aplikasi eksternal"
          icon={<FileCode2 className="w-4 h-4" />}
          badge={
            <a
              href={`${apiBaseUrl.replace('/api', '')}/api/documentation`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[10px] text-[#2C4219] font-bold hover:underline"
            >
              Swagger Docs <ExternalLink className="w-3 h-3" />
            </a>
          }
        >
          <div className="space-y-6">
            {[
              {
                group: 'Panen & Lahan',
                rows: [
                  { method: 'GET', path: '/api/panen', desc: 'Daftar semua data panen' },
                  { method: 'POST', path: '/api/panen', desc: 'Tambah data panen baru' },
                  { method: 'GET', path: '/api/panen/{id}', desc: 'Detail data panen' },
                  { method: 'PUT', path: '/api/panen/{id}', desc: 'Perbarui data panen' },
                  { method: 'DELETE', path: '/api/panen/{id}', desc: 'Hapus data panen' },
                  { method: 'GET', path: '/api/lahan', desc: 'Daftar semua data lahan' },
                  { method: 'POST', path: '/api/lahan', desc: 'Tambah data lahan baru' },
                ],
              },
              {
                group: 'Produksi & Sertifikat',
                rows: [
                  { method: 'GET', path: '/api/produksi', desc: 'Daftar batch produksi' },
                  { method: 'POST', path: '/api/produksi', desc: 'Tambah batch baru' },
                  { method: 'GET', path: '/api/sertifikat', desc: 'Daftar sertifikat legal' },
                  { method: 'POST', path: '/api/sertifikat', desc: 'Upload sertifikat baru' },
                  { method: 'PATCH', path: '/api/sertifikat/{id}/status', desc: 'Perbarui status sertifikat' },
                ],
              },
              {
                group: 'Logistik & Kemasan',
                rows: [
                  { method: 'GET', path: '/api/logistik/expense', desc: 'Daftar pengeluaran logistik' },
                  { method: 'POST', path: '/api/logistik/expense', desc: 'Catat pengeluaran baru' },
                  { method: 'GET', path: '/api/kemasan', desc: 'Stok bahan kemasan' },
                  { method: 'PUT', path: '/api/kemasan/{id}', desc: 'Perbarui data kemasan' },
                ],
              },
              {
                group: 'Dashboard & Auth',
                rows: [
                  { method: 'GET', path: '/api/dashboard/summary', desc: 'Ringkasan metrik utama' },
                  { method: 'POST', path: '/api/auth/login', desc: 'Login & terima token', auth: false },
                  { method: 'POST', path: '/api/auth/logout', desc: 'Hapus sesi / token' },
                  { method: 'GET', path: '/api/auth/me', desc: 'Info user aktif saat ini' },
                ],
              },
            ].map((group) => (
              <div key={group.group}>
                <p className="text-xs font-bold text-[#172C05] mb-2">{group.group}</p>
                <div className="bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 px-3 py-1">
                  {group.rows.map((r, i) => (
                    <EndpointRow key={i} method={r.method as any} path={r.path} desc={r.desc} auth={r.auth !== false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ═══ TAB: LOG AKTIVITAS ═══ */}
      {activeTab === 'logs' && (
        <SectionCard
          title="Log Permintaan API"
          subtitle="Histori permintaan dari aplikasi eksternal dalam 24 jam terakhir"
          icon={<Activity className="w-4 h-4" />}
          badge={
            <button className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-[#6B7280] text-[10px] font-bold hover:bg-[#efe0d2] transition-colors cursor-pointer">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider border-b border-[#c4c8bb]/20">
                  <th className="text-left pb-2 pr-3">Waktu</th>
                  <th className="text-left pb-2 pr-3">Method</th>
                  <th className="text-left pb-2 pr-3">Endpoint</th>
                  <th className="text-left pb-2 pr-3">Aplikasi</th>
                  <th className="text-left pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c8bb]/10">
                {sampleLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-2 pr-3 font-mono text-[10px] text-[#6B7280]">{log.time}</td>
                    <td className="py-2 pr-3">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                        log.method === 'GET' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>{log.method}</span>
                    </td>
                    <td className="py-2 pr-3 font-mono text-[10px] text-[#2C4219]">{log.path}</td>
                    <td className="py-2 pr-3 text-[10px] text-[#44483e] font-medium">{log.app}</td>
                    <td className="py-2">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        log.status === 200 ? 'bg-emerald-50 text-emerald-700' :
                        log.status === 401 ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-700'
                      }`}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Toast Floating Notifikasi */}
      <Toast message={savedSuccess} type="success" onClose={() => setSavedSuccess('')} />
    </div>
  );
};
