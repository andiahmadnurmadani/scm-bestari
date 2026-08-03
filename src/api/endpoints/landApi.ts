import axiosClient from '../axiosClient';
import { LandPlot } from '../../types';
import { mockLandPlots } from '../../mockData/landData';

let localLandData: LandPlot[] = [...mockLandPlots];

export const landApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/land');
      return response.data;
    } catch {
      return localLandData;
    }
  },

  create: async (data: Partial<LandPlot>) => {
    try {
      const response = await axiosClient.post('/land', data);
      return response.data;
    } catch {
      const newItem: LandPlot = {
        id: 'lhn-' + Date.now(),
        kodeLahan: data.kodeLahan || `LHN-SLM-0${localLandData.length + 1}`,
        namaLahan: data.namaLahan || 'Lahan Sektor Baru',
        lokasiDesa: data.lokasiDesa || 'Desa Cangkringan',
        kecamatan: data.kecamatan || 'Kecamatan Pakem',
        luasHektar: data.luasHektar || 5.0,
        varietasSorgum: data.varietasSorgum || 'Sorgum Bioguma 1',
        statusIrigasi: data.statusIrigasi || 'Irigasi Teknis',
        jenisTanah: data.jenisTanah || 'Regosol Subur',
        pemilikKelompokTani: data.pemilikKelompokTani || 'Kelompok Tani Mitra',
        statusKesiapan: data.statusKesiapan || 'Siap Tanam',
        latitude: data.latitude,
        longitude: data.longitude,
      };
      localLandData.unshift(newItem);
      return { success: true, data: newItem };
    }
  },

  update: async (id: string, data: Partial<LandPlot>) => {
    try {
      const response = await axiosClient.put(`/land/${id}`, data);
      return response.data;
    } catch {
      localLandData = localLandData.map((item) =>
        item.id === id ? { ...item, ...data } : item
      );
      const updatedItem = localLandData.find((item) => item.id === id);
      return { success: true, data: updatedItem };
    }
  },

  delete: async (id: string) => {
    try {
      const response = await axiosClient.delete(`/land/${id}`);
      return response.data;
    } catch {
      localLandData = localLandData.filter((item) => item.id !== id);
      return { success: true, message: 'Data lahan berhasil dihapus.' };
    }
  },
};
