import axiosClient from '../axiosClient';
import { PackagingMaterial } from '../../types';

export interface PackagingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PackagingListResponse {
  success: boolean;
  data: PackagingMaterial[];
  pagination: PackagingPagination;
}

export const packagingApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; kategori?: string }) => {
    const response = await axiosClient.get('/packaging', { params });
    return response.data as PackagingListResponse;
  },

  getById: async (id: string) => {
    const response = await axiosClient.get(`/packaging/${id}`);
    return response.data;
  },

  create: async (data: Partial<PackagingMaterial>) => {
    const response = await axiosClient.post('/packaging', data);
    return response.data;
  },

  update: async (id: string, data: Partial<PackagingMaterial>) => {
    const response = await axiosClient.put(`/packaging/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosClient.delete(`/packaging/${id}`);
    return response.data;
  },
};
