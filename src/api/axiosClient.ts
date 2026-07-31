import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';
const isDefaultLocalhost = !((import.meta as any).env?.VITE_API_BASE_URL) || API_BASE_URL.includes('localhost:8000');

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: isDefaultLocalhost ? 200 : 5000,
});

// Request Interceptor: Attach Bearer Authorization Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized Error Handling
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        console.warn('Sesi berakhir atau tidak terotorisasi. Silakan login kembali.');
      } else if (error.response.status === 403) {
        console.error('Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.');
      } else if (error.response.status === 500) {
        console.error('Kesalahan Server Internal (500).');
      }
    } else {
      console.info('Menggunakan data lokal/mock karena koneksi API belum terhubung.');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
