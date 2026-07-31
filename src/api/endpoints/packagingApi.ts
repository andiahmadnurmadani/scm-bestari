import axiosClient from '../axiosClient';
import { PackagingMaterial } from '../../types';
import { mockPackagingList } from '../../mockData/packagingData';

let localPackagingData: PackagingMaterial[] = [...mockPackagingList];

export const packagingApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/packaging');
      return response.data;
    } catch {
      return localPackagingData;
    }
  },

  create: async (data: Partial<PackagingMaterial>) => {
    try {
      const response = await axiosClient.post('/packaging', data);
      return response.data;
    } catch {
      const newPackaging: PackagingMaterial = {
        id: 'pack-' + Date.now(),
        kodeKemasan: data.kodeKemasan || `KMG-NEW-00${localPackagingData.length + 1}`,
        namaKemasan: data.namaKemasan || 'Bahan Kemasan Baru',
        kategori: data.kategori || 'Standing Pouch',
        kapasitas: data.kapasitas || '500g',
        stokTersedia: data.stokTersedia || 1000,
        satuan: data.satuan || 'Pcs',
        stokMinimal: data.stokMinimal || 200,
        pemasok: data.pemasok || 'Pemasok Kemasan KWT',
        hargaPerUnitRp: data.hargaPerUnitRp || 1500,
        statusStok: (data.stokTersedia || 1000) > 500 ? 'Stok Cukup' : 'Stok Menipis',
      };
      localPackagingData.unshift(newPackaging);
      return { success: true, data: newPackaging };
    }
  },

  update: async (id: string, data: Partial<PackagingMaterial>) => {
    try {
      const response = await axiosClient.put(`/packaging/${id}`, data);
      return response.data;
    } catch {
      localPackagingData = localPackagingData.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...data };
          if (updated.stokTersedia === 0) updated.statusStok = 'Habis';
          else if (updated.stokTersedia <= updated.stokMinimal) updated.statusStok = 'Stok Menipis';
          else updated.statusStok = 'Stok Cukup';
          return updated;
        }
        return item;
      });
      const updatedItem = localPackagingData.find((item) => item.id === id);
      return { success: true, data: updatedItem };
    }
  },

  delete: async (id: string) => {
    try {
      const response = await axiosClient.delete(`/packaging/${id}`);
      return response.data;
    } catch {
      localPackagingData = localPackagingData.filter((item) => item.id !== id);
      return { success: true, message: 'Data kemasan berhasil dihapus.' };
    }
  },
};
