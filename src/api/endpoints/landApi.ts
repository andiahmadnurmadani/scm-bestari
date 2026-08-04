import axiosClient from '../axiosClient';
import { LandPlot } from '../../types';

export interface LandPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LandListResponse {
  success: boolean;
  data: LandPlot[];
  pagination: LandPagination;
}

export const landApi = {
  /**
   * GET /api/land?page=&limit=&search=
   * Mengembalikan { data, pagination } dari backend.
   */
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await axiosClient.get('/land', { params });
    return response.data as LandListResponse;
  },

  getById: async (id: string) => {
    const response = await axiosClient.get(`/land/${id}`);
    return response.data;
  },

  create: async (data: Partial<LandPlot>) => {
    const response = await axiosClient.post('/land', data);
    return response.data;
  },

  update: async (id: string, data: Partial<LandPlot>) => {
    const response = await axiosClient.put(`/land/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosClient.delete(`/land/${id}`);
    return response.data;
  },
};
