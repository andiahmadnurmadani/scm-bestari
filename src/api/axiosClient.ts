import axios from 'axios';
import { getApiBaseUrl, API_URL_CHANGED_EVENT } from '../utils/apiConfig';

/** Buat instance axios baru dengan baseURL aktif (dipanggil ulang saat URL diganti). */
function createClient() {
  const API_BASE_URL = getApiBaseUrl();
  const isDefaultLocalhost = API_BASE_URL.includes('localhost:8000');

  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: isDefaultLocalhost ? 10000 : 5000,
  });

  // Request Interceptor: Attach Bearer Authorization Token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor: Centralized Error Handling
  instance.interceptors.response.use(
    (response) => {
      // Koneksi kembali normal — beri tahu UI (sekali saja)
      if ((window as any).__apiWasOffline) {
        (window as any).__apiWasOffline = false;
        window.dispatchEvent(new Event('api:online'));
      }
      return response;
    },
    (error) => {
      // Ambil pesan error dari backend jika tersedia ({ success: false, message: "..." })
      const backendMessage = error.response?.data?.message;

      // Deteksi koneksi terputus (bukan error HTTP dari server)
      const isConnectionError =
        !error.response || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';

      if (isConnectionError && !(window as any).__apiWasOffline) {
        (window as any).__apiWasOffline = true;
        window.dispatchEvent(new Event('api:offline'));
      }

      if (error.response) {
        if (error.response.status === 401) {
          // Token tidak valid / kedaluwarsa → logout otomatis & redirect ke login
          const hadToken = !!localStorage.getItem('token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (hadToken && window.location.pathname !== '/login') {
            console.warn(backendMessage || 'Sesi berakhir. Silakan login kembali.');
            window.location.href = '/login';
          } else if (!backendMessage) {
            console.warn('Sesi berakhir atau tidak terotorisasi. Silakan login kembali.');
          }
        } else if (error.response.status === 403) {
          console.error(backendMessage || 'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.');
        } else if (error.response.status === 500) {
          console.error(backendMessage || 'Kesalahan Server Internal (500).');
        }
      } else if (error.code === 'ECONNABORTED') {
        console.info('Koneksi ke API timeout.');
      } else if (!error.response) {
        console.info('Koneksi ke API backend tidak terhubung.');
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

let axiosClient = createClient();

// Saat URL API diganti dari Settings → buat ulang instance axios
if (typeof window !== 'undefined') {
  window.addEventListener(API_URL_CHANGED_EVENT, () => {
    axiosClient = createClient();
  });
}

export default axiosClient;
