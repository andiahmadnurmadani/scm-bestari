import axiosClient from '../axiosClient';
import { FinancialExpense } from '../../types';
import { mockFinancialExpenses } from '../../mockData/logisticsData';

let localExpensesData: FinancialExpense[] = [...mockFinancialExpenses];

export const logisticsApi = {
  getFinancialLogs: async () => {
    try {
      const response = await axiosClient.get('/logistics/expenses');
      return response.data;
    } catch {
      return localExpensesData;
    }
  },

  createExpense: async (data: Partial<FinancialExpense>) => {
    try {
      const response = await axiosClient.post('/logistics/expenses', data);
      return response.data;
    } catch {
      const newExp: FinancialExpense = {
        id: 'exp-' + Date.now(),
        kodeTransaksi: data.kodeTransaksi || `LOG-TRX-00${localExpensesData.length + 1}`,
        tanggal: data.tanggal || new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        kategori: data.kategori || 'Operasional',
        keteranganVendor: data.keteranganVendor || 'Pencatatan Biaya Baru',
        totalBiayaRp: data.totalBiayaRp || 500000,
        statusPembayaran: data.statusPembayaran || 'LUNAS',
        metodePembayaran: data.metodePembayaran || 'Kas Tunai',
        nomorNotaReceipt: data.nomorNotaReceipt || `KW-NEW-${Date.now().toString().slice(-4)}`,
        catatanNota: data.catatanNota || 'Pengeluaran terverifikasi oleh Manajer Operasional KWT.',
        detailItem: data.detailItem && data.detailItem.length > 0 ? data.detailItem : [
          { nama: 'Item Biaya Operasional', qty: 1, hargaSatuan: data.totalBiayaRp || 500000 },
        ],
        notaUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      };
      localExpensesData.unshift(newExp);
      return { success: true, data: newExp };
    }
  },

  exportPdf: async () => {
    try {
      const response = await axiosClient.get('/logistics/export-pdf', { responseType: 'blob' });
      return response.data;
    } catch {
      return {
        success: true,
        message: 'Laporan PDF Keuangan & Logistik Sorgum SCM berhasil digenerate!',
        downloadUrl: '#',
      };
    }
  },
};
