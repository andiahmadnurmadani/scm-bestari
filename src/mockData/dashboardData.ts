import { SummaryMetric, ProductionChartData, ProcessingDonutData } from '../types';

export const mockDashboardMetrics: SummaryMetric[] = [
  {
    id: 'm-1',
    title: 'Luas Panen Total',
    value: '28.5',
    unit: 'Hektar',
    change: '+15%',
    trend: 'up',
    icon: 'Sprout',
    subtitle: 'Di 4 kelompok tani mitra',
  },
  {
    id: 'm-2',
    title: 'Rata-rata Hasil Panen',
    value: '4.8',
    unit: 'Ton/Ha',
    change: '+8%',
    trend: 'up',
    icon: 'TrendingUp',
    subtitle: 'Varietas Sorgum Bioguma 1',
  },
  {
    id: 'm-3',
    title: 'Total Nilai Panen',
    value: 'Rp 342.5M',
    change: '+22%',
    trend: 'up',
    icon: 'Coins',
    subtitle: 'Musim tanam I & II 2026',
  },
  {
    id: 'm-4',
    title: 'Stok Olahan Siap Edar',
    value: '12.4',
    unit: 'Ton',
    change: 'Stabil',
    trend: 'neutral',
    icon: 'PackageCheck',
    subtitle: 'Gudang Utama KWT Sorgum',
  },
];

export const mockProductionChartData: ProductionChartData[] = [
  { month: 'Jan', panenKg: 4200, targetKg: 4000 },
  { month: 'Feb', panenKg: 5100, targetKg: 4500 },
  { month: 'Mar', panenKg: 6300, targetKg: 5000 },
  { month: 'Apr', panenKg: 5800, targetKg: 5500 },
  { month: 'Mei', panenKg: 7400, targetKg: 6000 },
  { month: 'Jun', panenKg: 8900, targetKg: 7000 },
  { month: 'Jul', panenKg: 9500, targetKg: 8000 },
];

export const mockDonutData: ProcessingDonutData[] = [
  { category: 'Tepung Sorgum Premium', percentage: 45, volumeKg: 5580, color: '#2C4219' },
  { category: 'Rengginang Sorgum Crisp', percentage: 25, volumeKg: 3100, color: '#A8B774' },
  { category: 'Gula Cair Sorgum Nira', percentage: 18, volumeKg: 2232, color: '#DEB938' },
  { category: 'Beras Sorgum Utah', percentage: 12, volumeKg: 1488, color: '#433A30' },
];

export const mockRecentActivities = [
  {
    id: 'act-1',
    time: '10 menit yang lalu',
    title: 'Pencatatan Panen Baru',
    desc: 'Lahan Sektor C (Kelompok Tani Tani Makmur) mencatat 1.850 kg sorgum varietas Bioguma.',
    icon: 'Sprout',
    type: 'success',
  },
  {
    id: 'act-2',
    time: '1 jam yang lalu',
    title: 'Audit Sertifikat Halal',
    desc: 'Sertifikat BPJPH No. ID31110001294812 telah diperbarui statusnya menjadi AKTIF.',
    icon: 'Award',
    type: 'info',
  },
  {
    id: 'act-3',
    time: '3 jam yang lalu',
    title: 'Pengeluaran Logistik Diinput',
    desc: 'LOG-TRX-001 (Beli Pupuk Organik Rp 3.500.000) terverifikasi LUNAS.',
    icon: 'Receipt',
    type: 'warning',
  },
];
