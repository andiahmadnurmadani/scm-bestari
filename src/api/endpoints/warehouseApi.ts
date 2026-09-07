import axiosClient from '../axiosClient';
import type { Warehouse, WarehouseOption } from '../../types';

export interface WarehousePayload {
  kodeGudang?: string;
  namaGudang: string;
  lahanId?: string | null;
  lokasi?: string;
}

export const warehouseApi = {
  async getAll(params?: Record<string, string | number>) {
    const res = await axiosClient.get('/warehouse', { params });
    return res.data as {
      success: boolean;
      data: Warehouse[];
      pagination?: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
    };
  },
  async getById(id: string) {
    const res = await axiosClient.get(`/warehouse/${id}`);
    return res.data as { success: boolean; data: Warehouse };
  },
  async create(data: WarehousePayload) {
    const res = await axiosClient.post('/warehouse', data);
    return res.data as { success: boolean; message: string; data: Warehouse };
  },
  async update(id: string, data: Partial<WarehousePayload>) {
    const res = await axiosClient.put(`/warehouse/${id}`, data);
    return res.data as { success: boolean; message: string; data: Warehouse };
  },
  async delete(id: string) {
    const res = await axiosClient.delete(`/warehouse/${id}`);
    return res.data as { success: boolean; message: string };
  },
  async getOptions() {
    const res = await axiosClient.get('/warehouse/options');
    return res.data as { success: boolean; data: WarehouseOption[] };
  },
  async getHarvestOptions() {
    const res = await axiosClient.get('/warehouse/harvest-options');
    return res.data as {
      success: boolean;
      data: {
        id: string;
        kodePanen: string;
        varietas: string;
        tanggalPanen: string | null;
        jumlahHasilKg: number;
        lahanId: string | null;
        namaLahan: string | null;
        sudahMasukKg: number;
        sisaBelumMasukKg: number;
      }[];
    };
  },
  async stockIn(payload: { harvestId: string; jumlahKg: number; tanggalMasuk?: string; keterangan?: string }) {
    const res = await axiosClient.post('/warehouse/stock/in', payload);
    return res.data as { success: boolean; message: string; data: unknown };
  },
  async stockOut(payload: { gudangId: string; stockBatchId: string; jumlahKg: number; productionId?: string | null; keterangan?: string }) {
    const res = await axiosClient.post('/warehouse/stock/out', payload);
    return res.data as { success: boolean; message: string; data: unknown };
  },
  async sosoh(payload: { gudangId: string; batchGabahId: string; kgGabah: number; kgHasilSorgum: number; operator?: string; keterangan?: string }) {
    const res = await axiosClient.post('/warehouse/stock/sosoh', payload);
    return res.data as {
      success: boolean;
      message: string;
      data: {
        kodeSosoh: string;
        batchGabahId: string;
        kodeBatchGabah: string;
        kodeBatchSorgum: string;
        batchSorgumId: string;
        kgGabah: number;
        kgHasil: number;
        rendemen: number;
      };
    };
  },
  async getStockBatches(gudangId: string) {
    const res = await axiosClient.get(`/warehouse/${gudangId}/stock-batches`);
    return res.data as {
      success: boolean;
      data: {
        id: string;
        kodeBatchStok: string;
        jenis: 'GABAH' | 'SORGUM';
        asalBatch?: { id: string; kodeBatchStok: string } | null;
        harvestId: string | null;
        kodePanen: string | null;
        jumlahMasukKg: number;
        sisaKg: number;
        tanggalMasuk: string | null;
      }[];
    };
  },
  async getAllStockSorgum() {
    const res = await axiosClient.get('/warehouse/stock-sorgum/all');
    return res.data as {
      success: boolean;
      data: {
        id: string;
        gudangId: string;
        kodeGudang: string;
        namaGudang: string;
        namaLahan: string | null;
        harvestId: string | null;
        kodeBatchStok: string;
        jenis: 'GABAH' | 'SORGUM';
        asalBatch?: { id: string; kodeBatchStok: string } | null;
        kodePanen: string | null;
        varietas: string | null;
        jumlahMasukKg: number;
        sisaKg: number;
        tanggalMasuk: string | null;
      }[];
    };
  },
  async getHistory(gudangId: string, params?: { bulan?: string; search?: string; tipe?: 'MASUK' | 'KELUAR' | 'SOSOH'; page?: number; limit?: number }) {
    const res = await axiosClient.get(`/warehouse/${gudangId}/history`, { params });
    return res.data as {
      success: boolean;
      data: WarehouseHistoryItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },
  async getBatchTrace(gudangId: string, batchId: string) {
    const res = await axiosClient.get(`/warehouse/${gudangId}/trace/${batchId}`);
    return res.data as {
      success: boolean;
      data: BatchTrace;
    };
  },
};

export interface WarehouseHistoryItem {
  id: string;
  tipe: 'MASUK' | 'KELUAR' | 'SOSOH';
  jumlahKg: number;
  keterangan: string | null;
  createdAt: string | null;
  kodeBatch: string | null;
  kodeSosoh: string | null;
  kodeBatchGabah: string | null;
  kodeBatchSorgum: string | null;
  kgGabah: number | null;
  kgSorgum: number | null;
  rendemen: number | null;
  operator: string | null;
}

export interface BatchTrace {
  batch: {
    id: string;
    kodeBatchStok: string;
    jenis: 'GABAH' | 'SORGUM';
    jumlahMasukKg: number;
    sisaKg: number;
    tanggalMasuk: string | null;
    tanggalSosoh: string | null;
    asalBatch: {
      id: string;
      kodeBatchStok: string;
      jumlahMasukKg: number | null;
      sisaKg: number | null;
      tanggalMasuk: string | null;
    } | null;
    sosoh: {
      kgGabahDipakai: number;
      kgSorgumHasil: number;
      rendemenPersen: number;
      operator: string | null;
      createdAt: string | null;
    } | null;
  };
  gudang: { id: string; kodeGudang: string; namaGudang: string };
  lahan: { kodeLahan: string; namaLahan: string; lokasiDesa?: string } | null;
  tanam: {
    kodeTanam: string;
    tanggalTanam: string | null;
    estimasiPanen: string | null;
    petugas: string | null;
    statusTanam: string | null;
  } | null;
  panen: {
    id: string;
    kodePanen: string;
    namaLahan: string;
    varietas: string;
    tanggalPanen: string | null;
    jumlahHasilKg: number;
    kualitasGrade: string;
    petaniPenanggungJawab: string;
    status: string;
    periodeHari: number | null;
  } | null;
  movements: {
    id: string;
    tipe: 'MASUK' | 'KELUAR';
    jumlahKg: number;
    keterangan: string;
    createdAt: string | null;
    kodeBatch: string | null;
    namaProduk: string | null;
  }[];
  produksi: {
    id: string;
    kodeBatch: string;
    namaProduk: string;
    kategori: string;
    tanggalProduksi: string | null;
    jumlahHasil: number;
    satuan: string;
    bahanDigunakan: number | null;
    operatorProduksi: string | null;
    statusQC: string | null;
    createdAt: string | null;
  }[];
  logistik: {
    id: string;
    kodeTransaksi: string;
    tanggal: string | null;
    kategori: string;
    keteranganVendor: string | null;
    totalBiayaRp: number;
    statusPembayaran: string | null;
  }[];
}
