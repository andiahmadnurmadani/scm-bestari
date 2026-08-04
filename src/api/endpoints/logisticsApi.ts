import axiosClient from '../axiosClient';
import { FinancialExpense } from '../../types';

export interface LogisticsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LogisticsListResponse {
  success: boolean;
  data: FinancialExpense[];
  pagination: LogisticsPagination;
}

export const logisticsApi = {
  getFinancialLogs: async (params?: { page?: number; limit?: number; search?: string; kategori?: string }) => {
    const response = await axiosClient.get('/logistics', { params });
    return response.data as LogisticsListResponse;
  },

  getById: async (id: string) => {
    const response = await axiosClient.get(`/logistics/${id}`);
    return response.data;
  },

  createExpense: async (data: Partial<FinancialExpense>) => {
    const response = await axiosClient.post('/logistics', data);
    return response.data;
  },

  updateExpense: async (id: string, data: Partial<FinancialExpense>) => {
    const response = await axiosClient.put(`/logistics/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: string) => {
    const response = await axiosClient.delete(`/logistics/${id}`);
    return response.data;
  },
};
