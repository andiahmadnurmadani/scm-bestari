export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
}

export interface SummaryMetric {
  id: string;
  title: string;
  value: string;
  unit?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  subtitle?: string;
}

export interface ProductionChartData {
  month: string;
  panenKg: number;
  targetKg: number;
}

export interface ProcessingDonutData {
  category: string;
  percentage: number;
  volumeKg: number;
  color: string;
}

export interface Equipment {
  id: string;
  kodeAlat: string;
  namaPeralatan: string;
  kategori: string;
  jumlahStok: number;
  kondisi: 'Sangat Baik' | 'Baik' | 'Perlu Perbaikan' | 'Rusak';
  status: 'Tersedia' | 'Sedang Digunakan' | 'Dalam Perawatan' | 'Diarsipkan';
  lokasiPenyimpanan: string;
  tanggalPengadaan: string;
  spesifikasi: string;
  fotoUrl: string;
  terakhirServis: string;
}

export interface HarvestRecord {
  id: string;
  kodePanen: string;
  namaLahan: string;
  varietas: string;
  tanggalPanen: string;
  jumlahHasilKg: number;
  kualitasGrade: 'Grade A (Premium)' | 'Grade B (Standar)' | 'Grade C (Pakan)';
  petaniPenanggungJawab: string;
  status: 'Siap Panen' | 'Dalam Proses' | 'Selesai' | 'Tersimpan di Gudang';
  catatan: string;
  fotoUrl?: string;
}

export interface LandPlot {
  id: string;
  kodeLahan: string;
  namaLahan: string;
  lokasiDesa: string;
  kecamatan: string;
  luasHektar: number;
  varietasSorgum: string;
  statusIrigasi: 'Irigasi Teknis' | 'Tadah Hujan' | 'Semi Teknis';
  jenisTanah: string;
  pemilikKelompokTani: string;
  statusKesiapan: 'Siap Tanam' | 'Masa Pertumbuhan' | 'Masa Panen' | 'Bera (Istirahat)' | 'AKTIF' | 'PERSIAPAN' | 'PEMBESARAN';
  panenLaluTon?: number;
  fotoUrl?: string;
  statusBadge?: 'AKTIF' | 'PERSIAPAN' | 'PEMBESARAN' | string;
  latitude?: number;
  longitude?: number;
}

export interface ProductionBatch {
  id: string;
  kodeBatch: string;
  namaProduk: string;
  kategori: 'Raw (Bahan Mentah)' | 'Ready to Eat (Siap Konsumsi)';
  tanggalProduksi: string;
  tanggalKadaluarsa: string;
  jumlahHasil: number;
  satuan: string;
  nomorBatchBahanBaku: string;
  operatorProduksi: string;
  statusQC: 'Lolos QC' | 'Pending QC' | 'Revisi Batch';
  lokasiGudang: string;
}

export interface Certificate {
  id: string;
  kodeDokumen: string;
  namaSertifikat: string;
  penerbitSertifikat: string;
  nomorSertifikat: string;
  tanggalTerbit: string;
  tanggalKadaluarsa: string;
  status: 'AKTIF' | 'PROSES' | 'KADALUARSA';
  jenisDokumen: 'Sertifikat Halal' | 'Izin P-IRT' | 'Uji Lab Nutrisi' | 'Sertifikat Organik' | 'Lainnya';
  fileUrl?: string;
  fileName?: string;
  fileType?: 'pdf' | 'image';
  keterangan: string;
}

export interface PackagingMaterial {
  id: string;
  kodeKemasan: string;
  namaKemasan: string;
  kategori: 'Standing Pouch' | 'Box Custom' | 'Karung Bulk' | 'Botol Kaca' | 'Aksesoris';
  kapasitas: string;
  stokTersedia: number;
  satuan: string;
  stokMinimal: number;
  pemasok: string;
  hargaPerUnitRp: number;
  statusStok: 'Stok Cukup' | 'Stok Menipis' | 'Habis';
  extraData?: {
    komposisi?: string;
    nilaiGizi?: {
      energiKkal?: number;
      lemakTotalG?: number;
      lemakJenuhG?: number;
      karbohidratG?: number;
      seratG?: number;
      proteinG?: number;
      natriumMg?: number;
      gulaTotalG?: number;
    };
    akg?: Array<{ nutrisi: string; perSajian: string; akgPersen: number }>;
    riwayat?: Array<{ tanggal: string; aksi: string; keterangan: string; oleh: string }>;
    imageDataUrl?: string;
    imagesDataUrl?: string[];
  } | null;
}

export interface FinancialExpense {
  id: string;
  kodeTransaksi: string;
  tanggal: string;
  kategori: 'Bahan Baku' | 'Transportasi' | 'Operasional' | 'Kemasan' | 'Perawatan Peralatan' | 'Sertifikasi';
  keteranganVendor: string;
  totalBiayaRp: number;
  statusPembayaran: 'LUNAS' | 'PENDING' | 'DIBATALKAN';
  metodePembayaran: 'Transfer Bank' | 'Kas Tunai' | 'E-Wallet' | 'Giro';
  nomorNotaReceipt: string;
  detailItem: { nama: string; qty: number; hargaSatuan: number }[];
  catatanNota?: string;
  notaUrl?: string;
}
