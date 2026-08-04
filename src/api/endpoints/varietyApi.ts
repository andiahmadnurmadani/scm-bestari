import axiosClient from '../axiosClient';

export interface Variety {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt?: string;
}

export const varietyApi = {
  /** GET /api/varieties — daftar semua varietas */
  getAll: async () => {
    const response = await axiosClient.get('/varieties');
    return response.data as { success: boolean; data: Variety[] };
  },

  /** POST /api/varieties — tambah varietas baru */
  create: async (data: { name: string; description?: string; imageUrl?: string | null }) => {
    const response = await axiosClient.post('/varieties', data);
    return response.data;
  },

  /** PUT /api/varieties/:id — update varietas */
  update: async (
    id: string,
    data: Partial<{ name: string; description: string; isActive: boolean; imageUrl: string | null }>
  ) => {
    const response = await axiosClient.put(`/varieties/${id}`, data);
    return response.data;
  },

  /** DELETE /api/varieties/:id — hapus varietas */
  delete: async (id: string) => {
    const response = await axiosClient.delete(`/varieties/${id}`);
    return response.data;
  },
};
