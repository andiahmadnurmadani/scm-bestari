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

export const apiKeyApi = {
  getAll: async (): Promise<ApiKey[]> => {
    const res = await axiosClient.get('/keys');
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
