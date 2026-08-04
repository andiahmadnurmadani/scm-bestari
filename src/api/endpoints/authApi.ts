import axios from 'axios';
import axiosClient from '../axiosClient';

/** Helper: mengekstrak pesan error dari respons backend, dengan fallback. */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

export const authApi = {
  /**
   * Login ke backend. Mengembalikan { token, user } dari server.
   * Melempar error dengan pesan dari backend jika kredensial salah.
   */
  login: async (credentials: { usernameOrEmail: string; password: string }) => {
    try {
      const response = await axiosClient.post('/auth/login', credentials);
      const data = response.data;

      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      // JANGAN fallback ke mock: biarkan pesan error backend tampil di UI
      throw new Error(extractErrorMessage(error, 'Login gagal. Silakan coba lagi.'));
    }
  },

  /**
   * Register akun baru ke backend. Mengembalikan { user } dari server.
   * Melempar error dengan pesan dari backend (mis. email sudah terdaftar).
   */
  register: async (userData: { fullName: string; email: string; phone: string; password: string }) => {
    try {
      const response = await axiosClient.post('/auth/register', userData);
      const data = response.data;

      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Pendaftaran gagal. Silakan coba lagi.'));
    }
  },

  /** Logout: hapus token & user dari localStorage (backend bersifat stateless). */
  logout: async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch {
      // Ignore error saat offline — localStorage tetap dibersihkan
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /** Ambil profil user aktif dari backend (memakai token Bearer). */
  getProfile: async () => {
    try {
      const response = await axiosClient.get('/auth/me');
      const data = response.data;

      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
      return data;
    } catch {
      // Fallback hanya untuk data profil lokal (tidak untuk autentikasi)
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      return {
        id: 'user-01',
        name: 'Ibu KWT',
        email: 'kwt.sorgum@gmail.com',
        role: 'Anggota KWT',
      };
    }
  },

  /** Update profil user aktif. */
  updateProfile: async (data: { name?: string; phone?: string; jabatan?: string; namaKWT?: string; alamat?: string; kecamatan?: string; kabupaten?: string; bio?: string; avatar?: string }) => {
    try {
      const response = await axiosClient.put('/auth/me', data);
      const result = response.data;
      if (result?.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      return result;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal memperbarui profil.'));
    }
  },

  /** Ganti kata sandi user aktif. */
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await axiosClient.put('/auth/me/password', data);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal mengganti kata sandi.'));
    }
  },
};
