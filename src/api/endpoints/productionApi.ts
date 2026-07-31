import axiosClient from '../axiosClient';
import { ProductionBatch } from '../../types';
import { mockProductionBatches } from '../../mockData/productionData';

let localProductionData: ProductionBatch[] = [...mockProductionBatches];

export const productionApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/production');
      return response.data;
    } catch {
      return localProductionData;
    }
  },

  create: async (data: Partial<ProductionBatch>) => {
    try {
      const response = await axiosClient.post('/production', data);
      return response.data;
    } catch {
      const newBatch: ProductionBatch = {
        id: 'pb-' + Date.now(),
        kodeBatch: data.kodeBatch || `PRD-2026-00${localProductionData.length + 1}`,
        namaProduk: data.namaProduk || 'Batch Produk Baru',
        kategori: data.kategori || 'Ready to Eat (Siap Konsumsi)',
        tanggalProduksi: data.tanggalProduksi || 'Hari ini',
        tanggalKadaluarsa: data.tanggalKadaluarsa || '1 Tahun Lagi',
        jumlahHasil: data.jumlahHasil || 1000,
        satuan: data.satuan || 'Pcs',
        nomorBatchBahanBaku: data.nomorBatchBahanBaku || 'HARVEST-RAW-001',
        operatorProduksi: data.operatorProduksi || 'Tim KWT Sorgum',
        statusQC: data.statusQC || 'Pending QC',
        lokasiGudang: data.lokasiGudang || 'Gudang Utama A',
      };
      localProductionData.unshift(newBatch);
      return { success: true, data: newBatch };
    }
  },

  update: async (id: string, data: Partial<ProductionBatch>) => {
    try {
      const response = await axiosClient.put(`/production/${id}`, data);
      return response.data;
    } catch {
      localProductionData = localProductionData.map((item) =>
        item.id === id ? { ...item, ...data } : item
      );
      const updatedItem = localProductionData.find((item) => item.id === id);
      return { success: true, data: updatedItem };
    }
  },

  delete: async (id: string) => {
    try {
      const response = await axiosClient.delete(`/production/${id}`);
      return response.data;
    } catch {
      localProductionData = localProductionData.filter((item) => item.id !== id);
      return { success: true, message: 'Batch produksi berhasil dihapus.' };
    }
  },
};
