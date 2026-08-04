import axiosClient from '../axiosClient';
import { HarvestRecord } from '../../types';

export interface HarvestPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface HarvestListResponse {
  success: boolean;
  data: HarvestRecord[];
  pagination: HarvestPagination;
}

export interface HarvestFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  lahan?: string;
  varietas?: string;
  tanggalAwal?: string;
  tanggalAkhir?: string;
  grade?: string;
  status?: string;
}

export const harvestApi = {
  /**
   * GET /api/harvest?page=&limit=&search=&lahan=&varietas=&tanggalAwal=&tanggalAkhir=&grade=&status=
   * Mengembalikan { data, pagination } dari backend.
   */
  getAll: async (params?: HarvestFilterParams) => {
    const response = await axiosClient.get('/harvest', { params });
    return response.data as HarvestListResponse;
  },

  getById: async (id: string) => {
    const response = await axiosClient.get(`/harvest/${id}`);
    return response.data;
  },

  create: async (data: Partial<HarvestRecord>) => {
    const response = await axiosClient.post('/harvest', data);
    return response.data;
  },

  update: async (id: string, data: Partial<HarvestRecord>) => {
    const response = await axiosClient.put(`/harvest/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosClient.delete(`/harvest/${id}`);
    return response.data;
  },
};
