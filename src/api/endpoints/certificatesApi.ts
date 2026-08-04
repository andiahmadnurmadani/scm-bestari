import axiosClient from '../axiosClient';
import { Certificate } from '../../types';

export interface CertificatePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CertificateListResponse {
  success: boolean;
  data: Certificate[];
  pagination: CertificatePagination;
}

export const certificatesApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await axiosClient.get('/certificates', { params });
    return response.data as CertificateListResponse;
  },

  getById: async (id: string) => {
    const response = await axiosClient.get(`/certificates/${id}`);
    return response.data;
  },

  upload: async (data: Partial<Certificate>) => {
    const response = await axiosClient.post('/certificates', data);
    return response.data;
  },

  create: async (data: Partial<Certificate>) => {
    const response = await axiosClient.post('/certificates', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Certificate>) => {
    const response = await axiosClient.put(`/certificates/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosClient.delete(`/certificates/${id}`);
    return response.data;
  },
};
