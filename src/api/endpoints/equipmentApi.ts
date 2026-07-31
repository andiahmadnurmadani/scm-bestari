import axiosClient from '../axiosClient';
import { Equipment } from '../../types';
import { mockEquipmentList } from '../../mockData/equipmentData';

let localEquipmentData: Equipment[] = [...mockEquipmentList];

export const equipmentApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/equipment');
      return response.data;
    } catch {
      return localEquipmentData;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await axiosClient.get(`/equipment/${id}`);
      return response.data;
    } catch {
      return localEquipmentData.find((item) => item.id === id) || null;
    }
  },

  create: async (data: Partial<Equipment>) => {
    try {
      const response = await axiosClient.post('/equipment', data);
      return response.data;
    } catch {
      const newItem: Equipment = {
        id: 'eq-' + Date.now(),
        kodeAlat: data.kodeAlat || `S-00${localEquipmentData.length + 1}`,
        namaPeralatan: data.namaPeralatan || 'Peralatan Baru',
        kategori: data.kategori || 'Pascapanen',
        jumlahStok: data.jumlahStok || 1,
        kondisi: data.kondisi || 'Baik',
        status: data.status || 'Tersedia',
        lokasiPenyimpanan: data.lokasiPenyimpanan || 'Gudang Utama KWT',
        tanggalPengadaan: data.tanggalPengadaan || new Date().toLocaleDateString('id-ID'),
        spesifikasi: data.spesifikasi || 'Spesifikasi standar alat pertanian sorgum.',
        fotoUrl: data.fotoUrl || 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80',
        terakhirServis: data.terakhirServis || 'Hari ini',
      };
      localEquipmentData.unshift(newItem);
      return { success: true, data: newItem };
    }
  },

  update: async (id: string, data: Partial<Equipment>) => {
    try {
      const response = await axiosClient.put(`/equipment/${id}`, data);
      return response.data;
    } catch {
      localEquipmentData = localEquipmentData.map((item) =>
        item.id === id ? { ...item, ...data } : item
      );
      const updatedItem = localEquipmentData.find((item) => item.id === id);
      return { success: true, data: updatedItem };
    }
  },

  delete: async (id: string) => {
    try {
      const response = await axiosClient.delete(`/equipment/${id}`);
      return response.data;
    } catch {
      localEquipmentData = localEquipmentData.filter((item) => item.id !== id);
      return { success: true, message: 'Peralatan berhasil dihapus.' };
    }
  },
};
