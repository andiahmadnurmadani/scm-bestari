import axios from 'axios';
import axiosClient from '../axiosClient';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

export interface ClearDataResult {
  cleared: { table: string; label: string; deleted: number }[];
  kept: { table: string; label: string; kept: number | null }[];
  totalDeleted: number;
  errors: string[];
}

export interface SeedDataResult {
  counts: Record<string, number>;
}

export const settingsApi = {
  /** POST /api/settings/clear-data — kosongkan semua data (kecuali user & landing page). */
  clearData: async (): Promise<ClearDataResult> => {
    try {
      const response = await axiosClient.post('/settings/clear-data');
      return response.data.data as ClearDataResult;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal mengosongkan data.'));
    }
  },

  /** POST /api/settings/seed-data — isi data contoh (seeder). */
  seedData: async (): Promise<SeedDataResult> => {
    try {
      const response = await axiosClient.post('/settings/seed-data');
      return response.data.data as SeedDataResult;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal mengisi data contoh.'));
    }
  },
};
