import axiosClient from '../axiosClient';
import { Equipment } from '../../types';

export interface EquipmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface EquipmentListResponse {
  success: boolean;
  data: Equipment[];
  pagination: EquipmentPagination;
}

export const equipmentApi = {
  /**
   * GET /api/equipment?page=&limit=&search=
   * Mengembalikan { data, pagination } dari backend.
   */
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await axiosClient.get('/equipment', { params });
    return response.data as EquipmentListResponse;
  },

  getById: async (id: string) => {
    const response = await axiosClient.get(`/equipment/${id}`);
    return response.data;
  },

  create: async (data: Partial<Equipment>) => {
    const response = await axiosClient.post('/equipment', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Equipment>) => {
    const response = await axiosClient.put(`/equipment/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosClient.delete(`/equipment/${id}`);
    return response.data;
  },
};
