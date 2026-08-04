import axiosClient from '../axiosClient';
import { ProductionBatch } from '../../types';

export interface ProductionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductionListResponse {
  success: boolean;
  data: ProductionBatch[];
  pagination: ProductionPagination;
}

export const productionApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; kategori?: string }) => {
    const response = await axiosClient.get('/production', { params });
    return response.data as ProductionListResponse;
  },

  getById: async (id: string) => {
    const response = await axiosClient.get(`/production/${id}`);
    return response.data;
  },

  create: async (data: Partial<ProductionBatch>) => {
    const response = await axiosClient.post('/production', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ProductionBatch>) => {
    const response = await axiosClient.put(`/production/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosClient.delete(`/production/${id}`);
    return response.data;
  },
};
