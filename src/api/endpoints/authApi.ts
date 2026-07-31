import axiosClient from '../axiosClient';
import { User } from '../../types';

export const authApi = {
  login: async (credentials: { usernameOrEmail: string; password: string }) => {
    try {
      const response = await axiosClient.post('/auth/login', credentials);
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch {
      // Fallback mock response for front-end demonstration
      const mockUser: User = {
        id: 'user-01',
        name: 'Ibu KWT',
        email: credentials.usernameOrEmail || 'kwt.sorgum@gmail.com',
        role: 'Manajer Operasional',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaXEzYVwh8rBuM7PtbQrpP39W0HmakJ4kHsPwX7_vIZgRvfmqm9pRP7szJLdko2G45UQYO6M8aY_i21j9x3xP65UULd5xpGsQFN_UJLI_uhaMGDzoeASs_69MYwt__JwI7APZiqq772N9JKeOU5BvNgzdWn6GnagOmEqSIELGYuWu1lmmQwuMjv7jMWicYeALwoLwWCWLovQjtbqzrS6MtD5xNOIkU9WUx6BIywUugUVIF0XwaXwzJ',
      };
      const mockToken = 'mock-jwt-token-sorgum-scm-2026';
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return { success: true, token: mockToken, user: mockUser };
    }
  },

  register: async (userData: { fullName: string; email: string; phone: string; password: string }) => {
    try {
      const response = await axiosClient.post('/auth/register', userData);
      return response.data;
    } catch {
      const mockUser: User = {
        id: 'user-' + Date.now(),
        name: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: 'Anggota KWT',
      };
      return { success: true, message: 'Pendaftaran berhasil!', user: mockUser };
    }
  },

  logout: async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch {
      // Ignore error in offline mode
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getProfile: async () => {
    try {
      const response = await axiosClient.get('/auth/me');
      return response.data;
    } catch {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      return {
        id: 'user-01',
        name: 'Ibu KWT',
        email: 'kwt.sorgum@gmail.com',
        role: 'Manajer Operasional',
      };
    }
  },
};
