import axiosClient from '../axiosClient';

export interface Product {
  id: string;
  name: string;
  satuanHasil: string;
  deskripsi: string;
  fotoUrl: string | null;
  isActive: boolean;
  createdAt?: string;
}

export const productApi = {
  /** GET /api/products — daftar semua produk master */
  getAll: async (params?: { isActive?: boolean }) => {
    const response = await axiosClient.get('/products', { params });
    return response.data as { success: boolean; data: Product[] };
  },

  /** GET /api/products/:id — detail produk */
  getById: async (id: string) => {
    const response = await axiosClient.get(`/products/${id}`);
    return response.data as { success: boolean; data: Product };
  },

  /** POST /api/products — tambah produk baru */
  create: async (data: { name: string; satuanHasil?: string; deskripsi?: string; fotoUrl?: string | null }) => {
    const response = await axiosClient.post('/products', data);
    return response.data;
  },

  /** PUT /api/products/:id — update produk */
  update: async (
    id: string,
    data: Partial<{ name: string; satuanHasil: string; deskripsi: string; isActive: boolean; fotoUrl: string | null }>
  ) => {
    const response = await axiosClient.put(`/products/${id}`, data);
    return response.data;
  },

  /** DELETE /api/products/:id — hapus produk */
  delete: async (id: string) => {
    const response = await axiosClient.delete(`/products/${id}`);
    return response.data;
  },
};
