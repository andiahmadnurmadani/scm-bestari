import axiosClient from '../axiosClient';
import { Planting } from '../../types';

export interface PlantingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
export interface PlantingListResponse {
  success: boolean;
  data: Planting[];
  pagination: PlantingPagination;
}
export interface PlantingFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  lahanId?: string;
  status?: string;
}

export const plantingApi = {
  getAll: async (params?: PlantingFilterParams) => {
    const response = await axiosClient.get('/plantings', { params });
    return response.data as PlantingListResponse;
  },
  getById: async (id: string) => {
    const response = await axiosClient.get(`/plantings/${id}`);
    return response.data;
  },
  create: async (data: Partial<Planting> & { fotoUrl?: string }) => {
    const response = await axiosClient.post('/plantings', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Planting> & { fotoUrl?: string }) => {
    const response = await axiosClient.put(`/plantings/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await axiosClient.delete(`/plantings/${id}`);
    return response.data;
  },
};
