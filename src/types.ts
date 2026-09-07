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
  status: 'Tersedia' | 'Sedang Digunakan' | 'Dalam Perawatan';
  lokasiPenyimpanan: string;
  tanggalPengadaan: string;
  spesifikasi: string;
  fotoUrl: string;
  terakhirServis: string;
}

export interface Planting {
  id: string;
  kodeTanam: string;
  lahanId: string;
  kodeLahan?: string;
  namaLahan?: string;
  tanggalTanam: string;
  estimasiPanen?: string | null;
  varietas: string;
  jumlahLubang: number;
  luasTanam?: number;
  petugas?: string;
  statusTanam: 'Ditanam' | 'Tumbuh' | 'Siap Panen' | 'Gagal' | 'Dipanen';
  catatan?: string;
  fotoUrl?: string;
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
  lahanId?: string | null;
  plantingId?: string | null;
  periodeHari?: number | null;
  lahan?: { id: string; kodeLahan: string; namaLahan: string; lokasiDesa?: string; luasHektar?: number } | null;
  planting?: Planting | null;
  stokBatch?: { jumlahKg: number; keterangan: string }[];
  stockBatches?: {
    id: string;
    gudangId: string;
    gudang?: { id: string; kodeGudang: string; namaGudang: string } | null;
    harvestId: string | null;
    kodeBatchStok: string;
    jumlahMasukKg: number;
    sisaKg: number;
    tanggalMasuk: string | null;
  }[];
  sudahMasukKg?: number;
  sisaBelumMasukKg?: number | null;
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
  jenisTanah?: string; // deprecated — dihapus dari UI, tetap opsional untuk kompatibilitas data lama
  jumlahLubang?: number;
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
  kategori?: 'Ready to Eat (Siap Konsumsi)' | 'Raw (Bahan Mentah)' | 'Lainnya' | string; // legacy — tidak dipakai lagi
  productId?: string | null;
  tanggalProduksi: string;
  tanggalKadaluarsa: string;
  jumlahHasil: number;
  satuan: string;
  bahanDigunakan?: number | null;
  satuanBahan?: string;
  nomorBatchBahanBaku: string;
  operatorProduksi: string;
  statusQC: 'Lolos QC' | 'Pending QC' | 'Revisi Batch';
  lokasiGudang: string;
  lahanId?: string | null;
  plantingId?: string | null;
  harvestId?: string | null;
  gudangId?: string | null;
  stockBatchId?: string | null;
  lahan?: { id: string; kodeLahan: string; namaLahan: string } | null;
  planting?: Planting | null;
  harvest?: HarvestRecord | null;
  gudang?: { id: string; kodeGudang: string; namaGudang: string } | null;
  stockBatch?: { id: string; kodeBatchStok: string; jenis?: 'GABAH' | 'SORGUM'; asalBatch?: { kodeBatchStok: string } | null } | null;
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

export interface Warehouse {
  id: string;
  kodeGudang: string;
  namaGudang: string;
  lahanId: string | null;
  lokasi: string;
  totalStokKg: number;
  stokGabahKg?: number;
  stokSorgumKg?: number;
  lahan?: { id: string; kodeLahan: string; namaLahan: string; lokasiDesa: string } | null;
  stockBatches?: WarehouseStockBatch[];
  movements?: WarehouseMovement[];
  sosohList?: SosohProcess[];
  createdAt?: string;
}

export interface WarehouseStockBatch {
  id: string;
  gudangId: string;
  harvestId: string | null;
  jenis: 'GABAH' | 'SORGUM';
  asalBatchId?: string | null;
  kodeBatchStok: string;
  jumlahMasukKg: number;
  sisaKg: number;
  tanggalMasuk: string | null;
  tanggalSosoh?: string | null;
  operatorSosoh?: string | null;
  asalBatch?: { id: string; kodeBatchStok: string; jumlahMasukKg: number | null } | null;
  harvest?: { id: string; kodePanen: string; tanggalPanen: string | null; varietas: string } | null;
  createdAt?: string;
}

export interface SosohProcess {
  id: string;
  kodeSosoh: string;
  kodeBatchGabah: string | null;
  kodeBatchSorgum: string | null;
  kgGabah: number;
  kgSorgum: number;
  rendemen: number;
  operator: string | null;
  keterangan: string | null;
  createdAt: string | null;
}

export interface WarehouseMovement {
  id: string;
  gudangId: string;
  tipe: 'MASUK' | 'KELUAR';
  jumlahKg: number;
  keterangan: string;
  harvestId: string | null;
  productionId: string | null;
  stockBatchId?: string | null;
  kodePanen?: string | null;
  kodeBatch?: string | null;
  kodeBatchStok?: string | null;
  namaProduk?: string | null;
  createdAt?: string;
}

export interface WarehouseOption {
  id: string;
  kodeGudang: string;
  namaGudang: string;
  totalStokKg: number;
  lahanId: string | null;
  namaLahan: string | null;
}

