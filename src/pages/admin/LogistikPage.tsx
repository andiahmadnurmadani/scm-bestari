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
} from 'lucide-react';
import { logisticsApi } from '../../api/endpoints/logisticsApi';
import { FinancialExpense } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
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
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<FinancialExpense>>({
    kodeTransaksi: '',
    tanggal: '14 Mei 2026',
    kategori: 'Bahan Baku',
    keteranganVendor: '',
    totalBiayaRp: 500000,
    statusPembayaran: 'LUNAS',
    metodePembayaran: 'Transfer Bank',
    nomorNotaReceipt: '',
    catatanNota: '',
  });

  const fetchExpenses = async () => {
    setLoading(true);
    const data = await logisticsApi.getFinancialLogs();
    setExpenses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenReceipt = (expense: FinancialExpense) => {
    setActiveReceipt(expense);
    setReceiptModalOpen(true);
  };

  const handleOpenAddExpense = () => {
    setFormData({
      kodeTransaksi: `LOG-TRX-00${expenses.length + 1}`,
      tanggal: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      kategori: 'Bahan Baku',
      keteranganVendor: '',
      totalBiayaRp: 1500000,
      statusPembayaran: 'LUNAS',
      metodePembayaran: 'Transfer Bank',
      nomorNotaReceipt: `INV/KWT/2026/${Math.floor(100 + Math.random() * 900)}`,
      catatanNota: 'Pencatatan nota pengeluaran operasional terverifikasi.',
    });
    setAddExpenseModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    await logisticsApi.createExpense(formData);
    setAddExpenseModalOpen(false);
    fetchExpenses();
  };

  const handleExportPdf = async () => {
    await logisticsApi.exportPdf();
    setPdfModalOpen(true);
  };

  // Filter items
  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch =
      item.kodeTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keteranganVendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesTab = true;
    if (selectedCategoryTab === 'Transportasi & Bensin') {
      matchesTab = item.kategori === 'Transportasi';
    } else if (selectedCategoryTab === 'Pembelian Bahan Baku') {
      matchesTab = item.kategori === 'Bahan Baku';
    }

    return matchesSearch && matchesTab;
  });

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
          <button
            onClick={handleExportPdf}
            className="flex items-center justify-center gap-1.5 border border-[#c4c8bb] text-[#44483e] hover:bg-[#F7F7F5] px-3 py-1.5 rounded-lg font-semibold text-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Laporan PDF</span>
          </button>

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
            Rp 14.500.000
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
            Rp 8.200.000
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
            Rp 6.300.000
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

          <div className="flex items-center gap-3 text-xs font-bold overflow-x-auto max-w-full custom-scrollbar pb-1 md:pb-0">
            {['Semua Transaksi', 'Transportasi & Bensin', 'Pembelian Bahan Baku'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedCategoryTab(tab)}
                className={`py-1 transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategoryTab === tab
                    ? 'text-[#2C4219] border-b-2 border-[#2C4219] font-bold'
                    : 'text-[#6B7280] hover:text-[#2C4219]'
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
              {filteredExpenses.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#F7F7F5] transition-all cursor-default"
                >
                  <td className="py-2 px-3 pl-4 font-bold text-[#2C4219]">
                    {item.kodeTransaksi}
                  </td>
                  <td className="py-2 px-3 text-[#6B7280] font-medium">{item.tanggal}</td>
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
                  <td className="py-2 px-3 pr-4 text-center">
                    {/* Detail Nota Eye Icon Button */}
                    <button
                      onClick={() => handleOpenReceipt(item)}
                      className="p-1 text-[#44483e] hover:text-[#2C4219] hover:bg-[#efe0d2] rounded transition-colors cursor-pointer"
                      title="Lihat Detail Nota Receipt"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-[#c4c8bb]/20 gap-3 text-xs">
          <p className="text-[#6B7280] font-medium">
            Menampilkan 1-{filteredExpenses.length} dari {expenses.length} transaksi
          </p>

          <div className="flex items-center gap-2">
            <button className="px-3.5 py-2 rounded-xl border border-[#c4c8bb] hover:bg-[#fff1e5] transition-all font-bold text-[#44483e] cursor-pointer">
              Sebelumnya
            </button>
            <button className="w-9 h-9 rounded-xl bg-[#2C4219] text-white font-extrabold flex items-center justify-center">
              1
            </button>
            <button className="w-9 h-9 rounded-xl border border-[#c4c8bb] hover:bg-[#fff1e5] font-bold text-[#44483e] flex items-center justify-center cursor-pointer">
              2
            </button>
            <button className="px-3.5 py-2 rounded-xl border border-[#c4c8bb] hover:bg-[#fff1e5] transition-all font-bold text-[#44483e] cursor-pointer">
              Selanjutnya
            </button>
          </div>
        </div>
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
          <div className="space-y-6 text-sm text-[#221A12]">
            {/* Receipt Visual Header Card */}
            <div className="p-6 bg-[#fff8f4] border border-[#c4c8bb]/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#c4c8bb]/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#2C4219]">{activeReceipt.keteranganVendor}</h4>
                    <p className="text-xs text-[#74796d]">Nomor Nota: {activeReceipt.nomorNotaReceipt}</p>
                  </div>
                </div>
                <Badge variant={activeReceipt.statusPembayaran === 'LUNAS' ? 'success' : 'warning'}>
                  {activeReceipt.statusPembayaran}
                </Badge>
              </div>

              {/* Itemized Breakdown Table */}
              <div>
                <p className="text-xs font-bold text-[#74796d] uppercase mb-2">Rincian Barang / Jasa</p>
                <div className="space-y-2">
                  {activeReceipt.detailItem?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-[#c4c8bb]/20"
                    >
                      <span className="font-semibold text-[#221A12]">
                        {item.nama} (x{item.qty})
                      </span>
                      <span className="font-extrabold text-[#2C4219]">
                        Rp {(item.qty * item.hargaSatuan).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#c4c8bb]/20 flex items-center justify-between text-base font-black">
                <span className="text-[#2C4219]">TOTAL BAYAR</span>
                <span className="text-[#2C4219]">
                  Rp {activeReceipt.totalBiayaRp.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Note & Metadata */}
            <div className="p-4 bg-[#fff1e5] rounded-xl text-xs space-y-1">
              <p className="font-bold text-[#2C4219] uppercase">Catatan Verifikasi</p>
              <p className="text-[#44483e] leading-relaxed">{activeReceipt.catatanNota}</p>
              <p className="text-[#74796d] pt-1">Metode Pembayaran: {activeReceipt.metodePembayaran}</p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
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

      {/* CATAT PENGELUARAN BARU MODAL */}
      <Modal
        isOpen={addExpenseModalOpen}
        onClose={() => setAddExpenseModalOpen(false)}
        title="Catat Transaksi Pengeluaran Baru"
        subtitle="Input data biaya pupuk, logistik armada, perawatan, atau kemasan"
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
                onChange={(e) => setFormData({ ...formData, kodeTransaksi: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-bold"
                required
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Total Biaya (Rp)
              </label>
              <input
                type="number"
                value={formData.totalBiayaRp}
                onChange={(e) => setFormData({ ...formData, totalBiayaRp: Number(e.target.value) })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-extrabold"
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
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-bold"
              >
                <option value="LUNAS">LUNAS</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
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
                placeholder="INV-00129"
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
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm h-20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="outline" onClick={() => setAddExpenseModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Transaksi Pengeluaran
            </Button>
          </div>
        </form>
      </Modal>

      {/* EXPORT PDF SUCCESS MODAL */}
      <Modal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        title="Laporan Logistik PDF Berhasil Digenerate"
      >
        <div className="space-y-4 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#cfecb3] text-[#172C05] flex items-center justify-center mx-auto">
            <Download className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-[#2C4219]">Laporan Keuangan & Logistik Sorgum SCM 2026</h4>
          <p className="text-xs text-[#74796d]">
            Dokumen siap diunduh dan dicetak untuk keperluan arsip keuangan bulanan.
          </p>
          <div className="pt-2">
            <Button variant="primary" onClick={() => setPdfModalOpen(false)}>
              Tutup & Unduh PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
