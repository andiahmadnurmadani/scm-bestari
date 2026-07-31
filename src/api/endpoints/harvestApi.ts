import axiosClient from '../axiosClient';
import { HarvestRecord } from '../../types';
import { mockHarvestRecords } from '../../mockData/harvestData';

let localHarvestData: HarvestRecord[] = [...mockHarvestRecords];

export const harvestApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/harvest');
      return response.data;
    } catch {
      return localHarvestData;
    }
  },

  create: async (data: Partial<HarvestRecord>) => {
    try {
      const response = await axiosClient.post('/harvest', data);
      return response.data;
    } catch {
      const newItem: HarvestRecord = {
        id: 'hrv-' + Date.now(),
        kodePanen: data.kodePanen || `PANEN-2026-00${localHarvestData.length + 1}`,
        namaLahan: data.namaLahan || 'Lahan Sektor Baru',
        varietas: data.varietas || 'Sorgum Bioguma 1',
        tanggalPanen: data.tanggalPanen || 'Hari ini',
        jumlahHasilKg: data.jumlahHasilKg || 3000,
        kualitasGrade: data.kualitasGrade || 'Grade A (Premium)',
        petaniPenanggungJawab: data.petaniPenanggungJawab || 'Petani Mitra KWT',
        status: data.status || 'Selesai',
        catatan: data.catatan || 'Hasil panen tersimpan dengan baik.',
      };
      localHarvestData.unshift(newItem);
      return { success: true, data: newItem };
    }
  },

  update: async (id: string, data: Partial<HarvestRecord>) => {
    try {
      const response = await axiosClient.put(`/harvest/${id}`, data);
      return response.data;
    } catch {
      localHarvestData = localHarvestData.map((item) =>
        item.id === id ? { ...item, ...data } : item
      );
      const updatedItem = localHarvestData.find((item) => item.id === id);
      return { success: true, data: updatedItem };
    }
  },

  delete: async (id: string) => {
    try {
      const response = await axiosClient.delete(`/harvest/${id}`);
      return response.data;
    } catch {
      localHarvestData = localHarvestData.filter((item) => item.id !== id);
      return { success: true, message: 'Data panen berhasil dihapus.' };
    }
  },
};
