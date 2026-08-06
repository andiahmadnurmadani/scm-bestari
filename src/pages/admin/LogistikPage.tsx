import React, { useEffect, useState } from 'react';
import {
  Download,
  Plus,
  Eye,
  Filter,
  Receipt,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  Trash2,
  Edit3,
} from 'lucide-react';
import { logisticsApi } from '../../api/endpoints/logisticsApi';
import { FinancialExpense } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { useAdminSearch } from '../../components/layout/AdminLayout';

export const LogistikPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [expenses, setExpenses] = useState<FinancialExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Category filter state
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('Semua Transaksi');

  // Modal States
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<FinancialExpense | null>(null);

  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinancialExpense | null>(null);

  // Export dropdown state
  const [exportOpen, setExportOpen] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState<Partial<FinancialExpense>>({
    kodeTransaksi: '',
    tanggal: new Date().toISOString().slice(0, 10),
    kategori: 'Bahan Baku',
    keteranganVendor: '',
    totalBiayaRp: 0,
    statusPembayaran: 'LUNAS',
    metodePembayaran: 'Transfer Bank',
    nomorNotaReceipt: '',
    catatanNota: '',
  });

  // Rincian barang/jasa dinamis (diisi user, total otomatis) — qty & hargaSatuan pakai string agar bisa dikosongkan
  const [detailItems, setDetailItems] = useState<{ nama: string; qty: string; hargaSatuan: string }[]>([
    { nama: '', qty: '', hargaSatuan: '' },
  ]);

  // ── Summary terpisah (total bulan ini dihitung dari SEMUA data, bukan halaman aktif) ──
  const [summary, setSummary] = useState({ totalBulanIni: 0, totalTransportasi: 0, totalBahanOp: 0 });

  // Parser tanggal robust: dukung 'YYYY-MM-DD', '14 Mei 2026', '05/08/2026', dsb.
  const parseTanggal = (s: string): Date | null => {
    if (!s) return null;
    const t = String(s).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
      const d = new Date(t + 'T00:00:00');
      return isNaN(d.getTime()) ? null : d;
    }
    const match = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (match) {
      // asumsi DD/MM/YYYY (format Indonesia)
      const d = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  };

  const fetchSummary = async () => {
    try {
      const res = await logisticsApi.getFinancialLogs({ page: 1, limit: 1000 });
      const all = res.data || [];
      const now = new Date();
      const inMonth = (e: FinancialExpense) => {
        const d = parseTanggal(e.tanggal);
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      };
      setSummary({
        totalBulanIni: all.filter(inMonth).reduce((s, e) => s + (e.totalBiayaRp || 0), 0),
        totalTransportasi: all
          .filter((e) => e.kategori === 'Transportasi')
          .reduce((s, e) => s + (e.totalBiayaRp || 0), 0),
        totalBahanOp: all
          .filter((e) => e.kategori === 'Bahan Baku' || e.kategori === 'Operasional')
          .reduce((s, e) => s + (e.totalBiayaRp || 0), 0),
      });
    } catch {
      // biarkan 0
    }
  };

  const fetchExpenses = async (targetPage = page, search = searchTerm, cat = selectedCategoryTab) => {
    setLoading(true);
    try {
      const res = await logisticsApi.getFinancialLogs({
        page: targetPage,
        limit,
        search: search || undefined,
        kategori: cat === 'Semua Transaksi' ? undefined : cat,
      });
      setExpenses(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setExpenses([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset ke halaman 1 saat search/tab berubah
  }, [searchTerm, selectedCategoryTab]);

  useEffect(() => {
    fetchExpenses(page, searchTerm, selectedCategoryTab);
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, selectedCategoryTab]);

  const handleOpenReceipt = (expense: FinancialExpense) => {
    setActiveReceipt(expense);
    setReceiptModalOpen(true);
  };

  const handleOpenAddExpense = () => {
    // Preview kode otomatis: MAX(id) + 1 (sama seperti backend)
    const maxId = expenses.reduce((max, e) => Math.max(max, Number(e.id) || 0), 0);
    const nextKode = `LOG-TRX-${String(maxId + 1).padStart(3, '0')}`;
    setEditingExpenseId(null);
    setFormData({
      kodeTransaksi: nextKode,
      tanggal: new Date().toISOString().slice(0, 10),
      kategori: 'Bahan Baku',
      keteranganVendor: '',
      totalBiayaRp: 0,
      statusPembayaran: 'LUNAS',
      metodePembayaran: 'Transfer Bank',
      nomorNotaReceipt: '',
      catatanNota: '',
    });
    setDetailItems([{ nama: '', qty: '', hargaSatuan: '' }]);
    setAddExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: FinancialExpense) => {
    setEditingExpenseId(expense.id);
    setFormData({
      kodeTransaksi: expense.kodeTransaksi,
      tanggal: expense.tanggal,
      kategori: expense.kategori,
      keteranganVendor: expense.keteranganVendor,
      totalBiayaRp: expense.totalBiayaRp,
      statusPembayaran: expense.statusPembayaran,
      metodePembayaran: expense.metodePembayaran,
      nomorNotaReceipt: expense.nomorNotaReceipt || '',
      catatanNota: expense.catatanNota || '',
    });
    setDetailItems(
      expense.detailItem && expense.detailItem.length > 0
        ? expense.detailItem.map((it) => ({ nama: it.nama, qty: String(it.qty ?? ''), hargaSatuan: String(it.hargaSatuan ?? '') }))
        : [{ nama: '', qty: '', hargaSatuan: '' }]
    );
    setAddExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    // Total otomatis dari rincian barang/jasa
    const total = detailItems.reduce((s, it) => s + (it.nama.trim() ? (Number(it.qty) || 0) * (Number(it.hargaSatuan) || 0) : 0), 0);
    const payload: Partial<FinancialExpense> = {
      ...formData,
      totalBiayaRp: total,
      detailItem: detailItems
        .filter((it) => it.nama.trim())
        .map((it) => ({ nama: it.nama, qty: Number(it.qty) || 0, hargaSatuan: Number(it.hargaSatuan) || 0 })),
    };
    if (editingExpenseId) {
      await logisticsApi.updateExpense(editingExpenseId, payload);
    } else {
      await logisticsApi.createExpense(payload);
    }
    setAddExpenseModalOpen(false);
    setEditingExpenseId(null);
    fetchExpenses();

    // ── Update TOTAL PENGELUARAN BULAN INI langsung (tanpa nunggu fetch ulang) ──
    const d = parseTanggal(payload.tanggal);
    const now = new Date();
    const isThisMonth = d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const amount = payload.totalBiayaRp || 0;
    setSummary((prev) => {
      const next = { ...prev };
      if (editingExpenseId) {
        // Edit: kurangi nilai lama dulu (di-backend), lalu tambah nilai baru
        // Karena tidak tahu nilai lama, paling aman refetch summary di latar belakang.
        // Tapi tetap update optimistik bila tanggalnya bulan ini.
        if (isThisMonth) next.totalBulanIni = prev.totalBulanIni + amount;
      } else {
        if (isThisMonth) next.totalBulanIni = prev.totalBulanIni + amount;
        if (payload.kategori === 'Transportasi') next.totalTransportasi = prev.totalTransportasi + amount;
        if (payload.kategori === 'Bahan Baku' || payload.kategori === 'Operasional') next.totalBahanOp = prev.totalBahanOp + amount;
      }
      return next;
    });
    // Sinkronkan dengan backend (data edit perlu nilai lama) — berjalan di background
    fetchSummary();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await logisticsApi.deleteExpense(deleteTarget.id);
    setDeleteTarget(null);
    fetchExpenses();
    fetchSummary();
  };

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    setPage(targetPage);
  };

  // ── Rincian barang/jasa dinamis ───────────────────────────────────────────
  const updateItem = (idx: number, field: 'nama' | 'qty' | 'hargaSatuan', value: string | number) => {
    setDetailItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };
  const addItem = () => {
      setDetailItems((prev) => [...prev, { nama: '', qty: '', hargaSatuan: '' }]);
  };
  const removeItem = (idx: number) => {
    setDetailItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  // ── Summary dari API ─────────────────────────────────────────────────────
  const formatRupiah = (n: number) =>
    `Rp ${(n || 0).toLocaleString('id-ID')}`;

  const totalBulanIni = summary.totalBulanIni;
  const totalTransportasi = summary.totalTransportasi;
  const totalBahanOp = summary.totalBahanOp;

  // ── Export ──────────────────────────────────────────────────────────
  const fetchAllExpenses = async () => {
    const res = await logisticsApi.getFinancialLogs({ page: 1, limit: 1000, search: searchTerm || undefined, kategori: selectedCategoryTab === 'Semua Transaksi' ? undefined : undefined });
    return res.data || [];
  };

  const exportRows = (rows: FinancialExpense[]) =>
    rows.map((r) => ({
      'Kode Transaksi': r.kodeTransaksi || '-',
      'Tanggal': r.tanggal || '-',
      'Kategori': r.kategori || '-',
      'Keterangan / Vendor': r.keteranganVendor || '-',
      'Total Biaya (Rp)': (r.totalBiayaRp || 0).toLocaleString('id-ID'),
      'Status Pembayaran': r.statusPembayaran || '-',
      'Metode': r.metodePembayaran || '-',
      'No. Nota': r.nomorNotaReceipt || '-',
    }));

  const exportCSV = async () => {
    try {
      const rows = await fetchAllExpenses();
      if (rows.length === 0) { setToast({ msg: 'Tidak ada data untuk diekspor.', type: 'error' }); return; }
      const data = exportRows(rows);
      const headers = Object.keys(data[0]);
      const esc = (v: string | number) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const csv = [headers.join(','), ...data.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-logistik-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { setToast({ msg: 'Gagal mengekspor CSV.', type: 'error' }); }
  };

  const exportExcel = async () => {
    try {
      const rows = await fetchAllExpenses();
      if (rows.length === 0) { setToast({ msg: 'Tidak ada data untuk diekspor.', type: 'error' }); return; }
      const data = exportRows(rows);
      const headers = Object.keys(data[0]);
      const esc = (v: string | number) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const thead = `<tr>${headers.map((h) => `<th style="background:#2C4219;color:#fff;">${esc(h)}</th>`).join('')}</tr>`;
      const tbody = data.map((r) => `<tr>${headers.map((h) => `<td>${esc(r[h])}</td>`).join('')}</tr>`).join('');
      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Logistik</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1">${thead}${tbody}</table></body></html>`;
      const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-logistik-${new Date().toISOString().slice(0, 10)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { setToast({ msg: 'Gagal mengekspor Excel.', type: 'error' }); }
  };

  const exportPdf = async () => {
    try {
      const rows = await fetchAllExpenses();
      const data = rows;
      const win = window.open('', '_blank');
      if (!win) return;
      const esc = (s: string | number) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const rowsHtml = data.map((r) => `
        <tr>
          <td>${esc(r.kodeTransaksi)}</td>
          <td>${esc(r.tanggal)}</td>
          <td>${esc(r.kategori)}</td>
          <td>${esc(r.keteranganVendor)}</td>
          <td>${esc((r.totalBiayaRp || 0).toLocaleString('id-ID'))}</td>
          <td>${esc(r.statusPembayaran)}</td>
        </tr>`).join('');
      win.document.write(`
        <html><head><title>Laporan Logistik</title>
        <style>
          body{font-family:Arial,sans-serif;padding:24px;color:#2C4219}
          h1{font-size:18px;margin:0 0 4px}
          p.sub{font-size:11px;color:#666;margin:0 0 16px}
          table{width:100%;border-collapse:collapse;font-size:11px}
          th{background:#2C4219;color:#fff;padding:7px 8px;text-align:left}
          td{border:1px solid #cfcfcf;padding:6px 8px}
          tr:nth-child(even){background:#f6f6f6}
          .tot{font-weight:bold}
        </style></head><body>
        <h1>Laporan Keuangan Logistik</h1>
        <p class="meta">Sorgum SCM • Dicetak ${new Date().toLocaleDateString('id-ID')} • Jumlah: ${data.length} transaksi</p>
        <table><thead><tr><th>Kode</th><th>Tanggal</th><th>Kategori</th><th>Vendor</th><th>Biaya (Rp)</th><th>Status</th></tr></thead>
        <tbody>${rowsHtml}</tbody></table>
        <p class="meta" style="margin-top:12px">Total Pengeluaran: <b>${formatRupiah(data.reduce((s, r) => s + (r.totalBiayaRp || 0), 0))}</b></p>
        <script>window.print();</script>
        </body></html>`);
      win.document.close();
    } catch { setToast({ msg: 'Gagal membuat laporan PDF.', type: 'error' }); }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">
            Catatan Keuangan Logistik
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="flex items-center justify-center gap-1.5 border border-[#c4c8bb] text-[#44483e] hover:bg-[#F7F7F5] px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Laporan</span>
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-10 z-30 w-52 bg-white rounded-xl shadow-xl border border-[#c4c8bb]/30 p-1.5 space-y-0.5">
                <button
                  onClick={() => { setExportOpen(false); exportCSV(); }}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs font-bold text-[#2C4219] hover:bg-[#F7F7F5] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-green-700" /> Export CSV
                </button>
                <button
                  onClick={() => { setExportOpen(false); exportExcel(); }}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs font-bold text-[#2C4219] hover:bg-[#F7F7F5] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Export Excel (.xls)
                </button>
                <button
                  onClick={() => { setExportOpen(false); exportPdf(); }}
                  className="w-full px-3 py-2 rounded-lg text-left text-xs font-bold text-[#2C4219] hover:bg-[#F7F7F5] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5 text-red-700" /> Export PDF
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenAddExpense}
            className="flex items-center justify-center gap-1.5 bg-[#2C4219] text-white hover:bg-[#213213] px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C3E28D]" />
            <span>Catat Pengeluaran Baru</span>
          </button>
        </div>
      </div>

      {/* Top 3 Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            TOTAL PENGELUARAN BULAN INI
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {formatRupiah(totalBulanIni)}
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            Akumulasi operasional logistik
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            BIAYA TRANSPORTASI & DISTRIBUSI
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {formatRupiah(totalTransportasi)}
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            Pengiriman bahan & produk jadi
          </p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            BIAYA BAHAN & OPERASIONAL
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {formatRupiah(totalBahanOp)}
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            Pemeliharaan & perlengkapan gudang
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-2xs overflow-hidden border border-[#c4c8bb]/30">
        {/* Card Header & Category Filter Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-3.5 sm:p-4 border-b border-[#c4c8bb]/20 gap-3">
          <h3 className="font-semibold text-[#2C4219] text-sm">
            Riwayat Transaksi Keuangan
          </h3>

          <div className="flex items-center gap-1.5 bg-[#F7F7F5] p-1 rounded-lg border border-[#c4c8bb]/30 overflow-x-auto max-w-full custom-scrollbar">
            {[
              'Semua Transaksi',
              'Bahan Baku',
              'Transportasi',
              'Operasional',
              'Kemasan',
              'Perawatan Peralatan',
              'Sertifikasi',
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedCategoryTab(tab)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategoryTab === tab
                    ? 'bg-[#C3E28D] text-[#172C05] shadow-2xs'
                    : 'text-[#44483e] hover:text-[#172C05]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Read-Only Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[720px]">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-b border-[#c4c8bb]/20">
                <th className="py-2 px-3 pl-4">KODE TRANSAKSI</th>
                <th className="py-2 px-3">TANGGAL</th>
                <th className="py-2 px-3">KATEGORI PENGELUARAN</th>
                <th className="py-2 px-3">KETERANGAN / VENDOR</th>
                <th className="py-2 px-3">TOTAL BIAYA (RP)</th>
                <th className="py-2 px-3">STATUS PEMBAYARAN</th>
                <th className="py-2 px-3 pr-4 text-center">DETAIL NOTA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 text-[#221A12] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B7280]">
                    <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                    Memuat data logistik...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B7280]">
                    Tidak ada transaksi yang ditemukan.
                  </td>
                </tr>
              ) : (
              expenses.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#F7F7F5] transition-all cursor-default"
                >
                  <td className="py-2 px-3 pl-4 font-bold text-[#2C4219]">
                    {item.kodeTransaksi}
                  </td>
                      <td className="py-2 px-3 text-[#6B7280] font-medium">
                        {(() => {
                          const d = parseTanggal(item.tanggal);
                          return d
                            ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : (item.tanggal || '-');
                        })()}
                      </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 bg-[#C3E28D]/30 text-[#172C05] rounded text-[10px] font-bold">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-[#44483e]">
                    {item.keteranganVendor}
                  </td>
                  <td className="py-2 px-3 font-bold text-[#221A12]">
                    Rp {item.totalBiayaRp.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.statusPembayaran === 'LUNAS'
                          ? 'bg-[#C3E28D]/50 text-[#172C05]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.statusPembayaran}
                    </span>
                  </td>
                  <td className="py-2 px-3 pr-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenReceipt(item)}
                        className="min-h-8 px-2.5 py-1.5 text-[#2C4219] hover:bg-[#efe0d2] rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                        title="Lihat Detail Nota Receipt"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Detail</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditExpense(item)}
                        className="min-h-8 px-2.5 py-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                        title="Edit Transaksi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="min-h-8 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {!loading && total > 0 && (
        <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-[#c4c8bb]/20 gap-3 text-xs">
          <p className="text-[#6B7280] font-medium">
            Menampilkan {expenses.length === 0 ? 0 : (page - 1) * limit + 1}-
            {Math.min(page * limit, total)} dari {total} transaksi
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3.5 py-2 rounded-xl border border-[#c4c8bb] hover:bg-[#fff1e5] transition-all font-bold text-[#44483e] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => goToPage(num)}
                className={`w-9 h-9 rounded-xl font-extrabold flex items-center justify-center cursor-pointer ${
                  num === page
                    ? 'bg-[#2C4219] text-white'
                    : 'border border-[#c4c8bb] hover:bg-[#fff1e5] font-bold text-[#44483e]'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3.5 py-2 rounded-xl border border-[#c4c8bb] hover:bg-[#fff1e5] transition-all font-bold text-[#44483e] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
        )}
      </div>

      {/* DETAIL NOTA MODAL PREVIEW */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Detail Nota & Kwitansi Logistik"
        subtitle={activeReceipt ? `${activeReceipt.kodeTransaksi} - ${activeReceipt.nomorNotaReceipt}` : ''}
        maxWidth="lg"
      >
        {activeReceipt && (
          <div id="print-struk" className="space-y-5 text-sm text-[#221A12]">
            {/* Kop Struk */}
            <div className="p-5 bg-[#fff8f4] border border-[#c4c8bb]/30 rounded-2xl space-y-4">
              {/* Header Kop */}
              <div className="flex items-center justify-between border-b border-[#c4c8bb]/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#2C4219] leading-tight">KWT Sorgum SCM</h4>
                    <p className="text-[11px] text-[#74796d]">
                      Jl. Tani Makmur No. 17, Desa Sukamaju
                    </p>
                    <p className="text-[11px] text-[#74796d]">Kab. Bogor, Jawa Barat</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider">
                    Nota Penerimaan
                  </p>
                  <p className="text-sm font-extrabold text-[#221A12]">{activeReceipt.nomorNotaReceipt}</p>
                  <p className="text-[11px] text-[#74796d] font-semibold">
                    {activeReceipt.tanggal ? new Date(activeReceipt.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>

              {/* Info Transaksi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider">Kode Transaksi</p>
                  <p className="font-semibold text-[#221A12]">{activeReceipt.kodeTransaksi}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider">Vendor / Penerima</p>
                  <p className="font-semibold text-[#221A12]">{activeReceipt.keteranganVendor}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider">Kategori</p>
                  <p className="font-semibold text-[#221A12]">{activeReceipt.kategori}</p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider">Status Pembayaran</p>
                    <Badge variant={activeReceipt.statusPembayaran === 'LUNAS' ? 'success' : 'warning'}>
                      {activeReceipt.statusPembayaran}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider">Metode</p>
                    <p className="font-semibold text-[#221A12]">{activeReceipt.metodePembayaran}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabel Rincian Barang */}
            <div>
              <p className="text-xs font-bold text-[#74796d] uppercase mb-2">Rincian Barang / Jasa</p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-[#6B7280] font-bold uppercase text-[10px] tracking-wider border-b border-[#c4c8bb]/30">
                    <th className="py-2 text-left">Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Harga Satuan</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeReceipt.detailItem && activeReceipt.detailItem.length > 0) ? (
                    activeReceipt.detailItem.map((item, idx) => (
                      <tr key={idx} className="border-b border-[#c4c8bb]/15">
                        <td className="py-2 font-semibold text-[#221A12]">{item.nama}</td>
                        <td className="py-2 text-center">{item.qty}</td>
                        <td className="py-2 text-right">Rp {Number(item.hargaSatuan).toLocaleString('id-ID')}</td>
                        <td className="py-2 text-right font-bold">Rp {(Number(item.qty) * Number(item.hargaSatuan)).toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-[#c4c8bb]/15">
                      <td className="py-2 font-semibold text-[#221A12]">
                        {activeReceipt.keteranganVendor || activeReceipt.kategori}
                      </td>
                      <td className="py-2 text-center">1</td>
                      <td className="py-2 text-right">Rp {activeReceipt.totalBiayaRp.toLocaleString('id-ID')}</td>
                      <td className="py-2 text-right font-bold">Rp {activeReceipt.totalBiayaRp.toLocaleString('id-ID')}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="py-3 text-right font-black text-base text-[#2C4219]">TOTAL BAYAR</td>
                    <td className="py-3 text-right font-black text-base text-[#2C4219]">
                      Rp {activeReceipt.totalBiayaRp.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Catatan & Verifikasi */}
            <div className="p-4 bg-[#fff1e5] rounded-xl text-xs space-y-1">
              <p className="font-bold text-[#2C4219] uppercase">Catatan Verifikasi</p>
              {activeReceipt.catatanNota && (
                <p className="text-[#44483e] leading-relaxed">{activeReceipt.catatanNota}</p>
              )}
              <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#c4c8bb]/20">
                <p className="text-[#74796d]">
                  Dicetak {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-[#74796d] italic">Dicetak dari Sorgum SCM</p>
              </div>
            </div>

            {/* Modal Actions (tidak ikut tercetak) */}
            <div className="print:hidden flex items-center justify-between pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 text-xs font-bold text-[#2C4219] hover:underline cursor-pointer"
              >
                <Printer className="w-4 h-4" /> CETAK STRUK NOTA
              </button>

              <Button variant="primary" onClick={() => setReceiptModalOpen(false)}>
                Tutup Nota
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CATAT / EDIT TRANSAKSI PENGELUARAN MODAL */}
      <Modal
        isOpen={addExpenseModalOpen}
        onClose={() => setAddExpenseModalOpen(false)}
        title={editingExpenseId ? 'Edit Transaksi Pengeluaran' : 'Catat Transaksi Pengeluaran Baru'}
        subtitle={editingExpenseId ? 'Perbarui data biaya dan rincian barang/jasa' : 'Input data biaya pupuk, logistik armada, perawatan, atau kemasan'}
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kode Transaksi
              </label>
              <input
                type="text"
                value={formData.kodeTransaksi}
                readOnly
                disabled
                title="Kode transaksi dibuat otomatis oleh sistem"
                className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm font-bold text-[#2C4219] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kategori Biaya
              </label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="Bahan Baku">Bahan Baku (Pupuk/Benih)</option>
                <option value="Transportasi">Transportasi / Sewa Truk</option>
                <option value="Operasional">Operasional KWT</option>
                <option value="Kemasan">Kemasan & Packaging</option>
                <option value="Perawatan Peralatan">Perawatan Peralatan</option>
                <option value="Sertifikasi">Sertifikasi Legalitas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Tanggal Transaksi
              </label>
              <input
                type="date"
                value={formData.tanggal || ''}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Status Pembayaran
              </label>
              <select
                value={formData.statusPembayaran}
                onChange={(e) => setFormData({ ...formData, statusPembayaran: e.target.value as any })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="LUNAS">Lunas</option>
                <option value="PENDING">Pending</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Keterangan / Vendor
            </label>
            <input
              type="text"
              value={formData.keteranganVendor}
              onChange={(e) => setFormData({ ...formData, keteranganVendor: e.target.value })}
              placeholder="Contoh: Beli Pupuk Organik / CV BioTech"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              required
            />
          </div>

          {/* Rincian Barang / Jasa */}
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Rincian Barang / Jasa
            </label>
            <div className="space-y-2">
              {detailItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_70px_1fr_70px_32px] gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Nama barang atau jasa"
                    value={item.nama}
                    onChange={(e) => updateItem(idx, 'nama', e.target.value)}
                    className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-lg text-sm min-w-0"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Jumlah (contoh: 5)"
                    value={item.qty}
                    onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                    className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-lg text-sm text-center"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Harga satuan (contoh: 5000)"
                    value={item.hargaSatuan}
                    onChange={(e) => updateItem(idx, 'hargaSatuan', e.target.value)}
                    className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-lg text-sm min-w-0"
                  />
                  <span className="text-xs font-extrabold text-[#2C4219] whitespace-nowrap">
                    Rp {(Number(item.qty) * Number(item.hargaSatuan)).toLocaleString('id-ID')}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={detailItems.length <= 1}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center"
                    title="Hapus baris"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addItem}
              className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#2C4219] hover:text-[#172C05] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Baris Rincian
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Total Biaya (Rp)
            </label>
            <input
              type="number"
              value={detailItems.reduce((s, it) => s + (it.nama.trim() ? (Number(it.qty) || 0) * (Number(it.hargaSatuan) || 0) : 0), 0)}
              readOnly
              className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm font-extrabold text-[#2C4219] cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Metode Pembayaran
              </label>
              <select
                value={formData.metodePembayaran}
                onChange={(e) => setFormData({ ...formData, metodePembayaran: e.target.value as any })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Kas Tunai">Kas Tunai</option>
                <option value="E-Wallet">E-Wallet QRIS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Nomor Nota / Kwitansi
              </label>
              <input
                type="text"
                value={formData.nomorNotaReceipt}
                onChange={(e) => setFormData({ ...formData, nomorNotaReceipt: e.target.value })}
                placeholder="Contoh: INV-00129"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Catatan Pengeluaran
            </label>
            <textarea
              value={formData.catatanNota}
              onChange={(e) => setFormData({ ...formData, catatanNota: e.target.value })}
              placeholder="Contoh: Pembayaran tunai ke pemasok pupuk, nota asli disimpan di arsip KWT"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm h-20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="outline" onClick={() => setAddExpenseModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              {editingExpenseId ? 'Simpan Perubahan' : 'Simpan Transaksi Pengeluaran'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Hapus Transaksi Pengeluaran"
          maxWidth="sm"
        >
          <div className="space-y-4 text-sm text-[#221A12]">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">
                  Apakah Anda yakin ingin menghapus transaksi ini?
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                  <strong>{deleteTarget.kodeTransaksi}</strong> — {deleteTarget.keteranganVendor} (Rp{' '}
                  {deleteTarget.totalBiayaRp.toLocaleString('id-ID')}).
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#c4c8bb]/20">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Batal
              </Button>
              <Button type="button" variant="danger" onClick={confirmDelete}>
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Floating Notifikasi */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
