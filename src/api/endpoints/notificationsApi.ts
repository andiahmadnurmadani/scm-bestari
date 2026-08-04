import axiosClient from '../axiosClient';

export interface AppNotification {
  id: string;
  judul: string;
  pesan: string;
  kategori: 'sertifikat' | 'panen' | 'produksi' | 'logistik' | 'sistem';
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: AppNotification[];
  unread: number;
}

export const notificationsApi = {
  getAll: async () => {
    const response = await axiosClient.get('/notifications');
    return response.data as NotificationsResponse;
  },

  markRead: async (id: string) => {
    const response = await axiosClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await axiosClient.put('/notifications/all/read');
    return response.data;
  },

  create: async (data: { judul: string; pesan: string; kategori?: string }) => {
    const response = await axiosClient.post('/notifications', data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosClient.delete(`/notifications/${id}`);
    return response.data;
  },
};
