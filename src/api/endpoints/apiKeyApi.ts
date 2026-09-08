import axiosClient from '../axiosClient';

export interface ApiKey {
  id: string;
  nama: string;
  keyPreview: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

/** Respons saat membuat key — keyValue hanya tampil sekali ini. */
export interface ApiKeyCreated extends ApiKey {
  keyValue: string;
}

/** Respons saat mengambil key aktif (dari env API_KEYS atau DB) — nilai penuh. */
export interface ActiveApiKey {
  id?: string;
  nama: string;
  keyValue: string;
  isActive: boolean;
  source: 'env' | 'db';
}

export const apiKeyApi = {
  getAll: async (): Promise<ApiKey[]> => {
    const res = await axiosClient.get('/keys');
    return res.data.data;
  },
  /** Ambil API key aktif (nilai penuh) — khusus admin login. */
  getActive: async (): Promise<ActiveApiKey> => {
    const res = await axiosClient.get('/keys/active');
    return res.data.data;
  },
  create: async (nama: string): Promise<ApiKeyCreated> => {
    const res = await axiosClient.post('/keys', { nama });
    return res.data.data;
  },
  update: async (id: string, isActive: boolean): Promise<ApiKey> => {
    const res = await axiosClient.put(`/keys/${id}`, { isActive });
    return res.data.data;
  },
  delete: async (id: string): Promise<void> => {
    await axiosClient.delete(`/keys/${id}`);
  },
};
