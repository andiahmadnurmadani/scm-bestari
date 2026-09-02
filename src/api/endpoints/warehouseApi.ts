import axiosClient from '../axiosClient';
import type { Warehouse, WarehouseOption } from '../../types';

export interface WarehousePayload {
  kodeGudang?: string;
  namaGudang: string;
  lahanId?: string | null;
  lokasi?: string;
  kapasitasKg?: number | null;
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
  async stockIn(payload: { gudangId: string; harvestId?: string | null; jumlahKg: number; tanggalMasuk?: string; keterangan?: string }) {
    const res = await axiosClient.post('/warehouse/stock/in', payload);
    return res.data as { success: boolean; message: string; data: unknown };
  },
  async stockOut(payload: { gudangId: string; jumlahKg: number; productionId?: string | null; keterangan?: string }) {
    const res = await axiosClient.post('/warehouse/stock/out', payload);
    return res.data as { success: boolean; message: string; data: unknown };
  },
};
