import axiosClient from '../axiosClient';
import { Certificate } from '../../types';
import { mockCertificates } from '../../mockData/certificatesData';

let localCertificatesData: Certificate[] = [...mockCertificates];

export const certificatesApi = {
  getAll: async () => {
    try {
      const response = await axiosClient.get('/certificates');
      return response.data;
    } catch {
      return localCertificatesData;
    }
  },

  upload: async (data: Partial<Certificate>) => {
    try {
      const response = await axiosClient.post('/certificates/upload', data);
      return response.data;
    } catch {
      const newCert: Certificate = {
        id: 'cert-' + Date.now(),
        kodeDokumen: data.kodeDokumen || `CERT-DOC-00${localCertificatesData.length + 1}`,
        namaSertifikat: data.namaSertifikat || 'Sertifikat Baru',
        penerbitSertifikat: data.penerbitSertifikat || 'Lembaga Sertifikasi Pangan',
        nomorSertifikat: data.nomorSertifikat || 'REG/2026/00192',
        tanggalTerbit: data.tanggalTerbit || 'Hari ini',
        tanggalKadaluarsa: data.tanggalKadaluarsa || '3 Tahun Lagi',
        status: data.status || 'PROSES',
        jenisDokumen: data.jenisDokumen || 'Sertifikat Halal',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        keterangan: data.keterangan || 'Dokumen resmi legalitas produk sorgum.',
      };
      localCertificatesData.unshift(newCert);
      return { success: true, data: newCert };
    }
  },

  update: async (id: string, data: Partial<Certificate>) => {
    try {
      const response = await axiosClient.put(`/certificates/${id}`, data);
      return response.data;
    } catch {
      localCertificatesData = localCertificatesData.map((item) =>
        item.id === id ? { ...item, ...data } : item
      );
      const updatedItem = localCertificatesData.find((item) => item.id === id);
      return { success: true, data: updatedItem };
    }
  },

  delete: async (id: string) => {
    try {
      const response = await axiosClient.delete(`/certificates/${id}`);
      return response.data;
    } catch {
      localCertificatesData = localCertificatesData.filter((item) => item.id !== id);
      return { success: true, message: 'Dokumen sertifikat berhasil dihapus.' };
    }
  },
};
