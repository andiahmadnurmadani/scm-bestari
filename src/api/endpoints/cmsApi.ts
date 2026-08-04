import axios from 'axios';
import axiosClient from '../axiosClient';
import { CmsData } from '../../context/CmsContext';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

export const cmsApi = {
  /** GET /api/cms — ambil konten landing page dari backend. */
  getContent: async (): Promise<CmsData | null> => {
    const response = await axiosClient.get('/cms');
    const data = response.data;
    return data?.data || null;
  },

  /** PUT /api/cms — simpan konten landing page (perlu token). */
  saveContent: async (content: CmsData) => {
    try {
      const response = await axiosClient.put('/cms', content);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal menyimpan konten CMS.'));
    }
  },

  /** DELETE /api/cms — reset konten ke default (perlu token). */
  resetContent: async () => {
    try {
      const response = await axiosClient.delete('/cms');
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal reset konten CMS.'));
    }
  },
};
