import React, { useEffect, useState } from 'react';
import {
  Sprout,
  Plus,
  Filter,
  Download,
  Leaf,
  Calendar,
  CheckSquare,
  Info,
  Sun,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Users,
  Eye,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { HarvestRecord } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';

export const PanenPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [harvestList, setHarvestList] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState<HarvestRecord | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    lokasiLahan: 'Blok E - Subang',
    varietas: 'Bioguma 1',
    tanggalPanen: new Date().toISOString().split('T')[0],
    tonase: '35.0',
    petaniPenanggungJawab: 'Ibu KWT Subang',
    catatan: '',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setImageError('Format file tidak didukung! Harap unggah file berformat JPG atau PNG saja.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Ukuran file terlalu besar! Maksimal 5 MB.');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
  };

  // Table rows baseline as specified in prompt
  const tableDataSpec = [
    {
      id: 'spec-1',
      tanggal: '12 Oktober 2023',
      lokasi: 'Blok A - Subang',
      varietas: 'Bioguma 1',
      varietasColor: 'bg-[#D1E6A5] text-[#2C4219]',
      tonase: '45.2 Ton',
      fotoUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'spec-2',
      tanggal: '10 Oktober 2023',
      lokasi: 'Blok C - Indramayu',
      varietas: 'Numbu',
      varietasColor: 'bg-[#D1E6A5] text-[#2C4219]',
      tonase: '38.7 Ton',
      fotoUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'spec-3',
      tanggal: '08 Oktober 2023',
      lokasi: 'Blok B - Subang',
      varietas: 'Bioguma 2',
      varietasColor: 'bg-[#D1E6A5] text-[#2C4219]',
      tonase: '42.1 Ton',
      fotoUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'spec-4',
      tanggal: '05 Oktober 2023',
      lokasi: 'Blok D - Indramayu',
      varietas: 'Bioguma 3',
      varietasColor: 'bg-[#D1E6A5] text-[#2C4219]',
      tonase: '51.4 Ton',
      fotoUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const fetchHarvest = async () => {
    setLoading(true);
    const data = await harvestApi.getAll();
    setHarvestList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHarvest();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await harvestApi.create({
      kodePanen: `PN-${Date.now().toString().slice(-4)}`,
      namaLahan: formData.lokasiLahan,
      varietas: formData.varietas,
      tanggalPanen: formData.tanggalPanen,
      jumlahHasilKg: Number(formData.tonase) * 1000,
      kualitasGrade: 'Grade A (Premium)',
      petaniPenanggungJawab: formData.petaniPenanggungJawab,
      status: 'Selesai',
      catatan: formData.catatan,
      fotoUrl: imagePreview || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    });
    setIsModalOpen(false);
    handleRemoveImage();
    fetchHarvest();
  };

  const filteredSpecData = tableDataSpec.filter(
    (item) =>
      item.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.varietas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tanggal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Page Heading & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">
            Kelola Data Panen
          </h1>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-[#2C4219] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#172C05] transition-all shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-[#C3E28D]" />
          <span>Input Data Panen</span>
        </button>
      </div>

      {/* Row 1: Top Summary Stat Cards (3 Cards Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Total Hasil Panen */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL HASIL PANEN</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">1.284 Ton</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Akumulasi seluruh lahan (+12%)</p>
        </div>

        {/* Card 2: Panen Bulan Ini */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">PANEN BULAN INI</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">342,5 Ton</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">75% dari target 450 Ton</p>
        </div>

        {/* Card 3: Status Jadwal Panen */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">STATUS JADWAL PANEN</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">On Schedule</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">5 Tim lapangan aktif</p>
        </div>
      </div>

      {/* Row 2: Main Grid Layout (2 Columns - Left Table, Right Side Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Data Table Card ("Data Hasil Panen") */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#c4c8bb]/30 shadow-2xs overflow-hidden flex flex-col justify-between space-y-3">
          <div className="p-3.5 sm:p-4 border-b border-[#c4c8bb]/20 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#2C4219]">Data Hasil Panen</h2>
              <p className="text-[11px] text-[#6B7280] font-medium">Laporan tonase terkini per lokasi</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                className="p-1.5 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#efe0d2] transition-colors cursor-pointer"
                title="Filter Data"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1.5 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#efe0d2] transition-colors cursor-pointer"
                title="Export Data"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto custom-scrollbar px-1">
            <table className="w-full text-left text-xs min-w-[520px]">
              <thead>
                <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-y border-[#c4c8bb]/20">
                  <th className="py-2 px-3">TANGGAL PANEN</th>
                  <th className="py-2 px-3">LOKASI LAHAN</th>
                  <th className="py-2 px-3">VARIETAS</th>
                  <th className="py-2 px-3">TONASE</th>
                  <th className="py-2 px-3 text-right">DETAIL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c8bb]/15 font-medium text-[#221A12]">
                {filteredSpecData.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F7F7F5] transition-colors">
                    <td className="py-2 px-3 text-[#44483e] whitespace-nowrap">{row.tanggal}</td>
                    <td className="py-2 px-3 font-semibold text-[#172C05]">{row.lokasi}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.varietasColor}`}>
                        {row.varietas}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-[#2C4219]">{row.tonase}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() =>
                          setSelectedDetail({
                            id: row.id,
                            kodePanen: `PN-2023-${row.id}`,
                            namaLahan: row.lokasi,
                            varietas: row.varietas,
                            tanggalPanen: row.tanggal,
                            jumlahHasilKg: parseFloat(row.tonase) * 1000,
                            kualitasGrade: 'Grade A (Premium)',
                            petaniPenanggungJawab: 'Ibu KWT Subang',
                            status: 'Selesai',
                            catatan: 'Kondisi panen optimal, kadar air 14%.',
                            fotoUrl: row.fotoUrl,
                          })
                        }
                        className="text-xs font-semibold text-[#2C4219] hover:text-[#172C05] hover:underline transition-colors cursor-pointer"
                      >
                        Lihat Detail &gt;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 sm:p-4 border-t border-[#c4c8bb]/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280]">
            <span className="font-medium">Menampilkan 1-4 dari 48 data</span>

            <div className="flex items-center gap-1 font-bold">
              <button className="p-1 rounded-md border border-[#c4c8bb]/30 text-[#44483e] hover:bg-[#F7F7F5] disabled:opacity-50">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button className="w-6 h-6 rounded-md bg-[#2C4219] text-white flex items-center justify-center font-bold text-xs">
                1
              </button>
              <button className="w-6 h-6 rounded-md hover:bg-[#F7F7F5] text-[#44483e] flex items-center justify-center text-xs">
                2
              </button>
              <button className="w-6 h-6 rounded-md hover:bg-[#F7F7F5] text-[#44483e] flex items-center justify-center text-xs">
                3
              </button>
              <button className="p-1 rounded-md border border-[#c4c8bb]/30 text-[#44483e] hover:bg-[#F7F7F5]">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dark Green Summary Sidebar Card Widget */}
        <div className="lg:col-span-4 space-y-5">
          {/* Main Card Widget "Informasi Waktu Panen" */}
          <div className="bg-[#2C4219] text-white p-4.5 rounded-xl shadow-md space-y-4 border border-[#172C05]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#C3E28D]" />
                <h3 className="font-semibold text-sm text-white">Informasi Waktu Panen</h3>
              </div>
            </div>

            {/* Nested Dark Card 1: Estimasi Panen Berikutnya */}
            <div className="bg-white/10 p-3 rounded-lg border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#C3E28D] font-extrabold">
                  Estimasi Panen Berikutnya
                </span>
                <Sprout className="w-3.5 h-3.5 text-[#C3E28D]" />
              </div>
              <h4 className="text-base font-bold text-white">24 Oktober 2023</h4>
              <p className="text-xs text-[#efe0d2] font-semibold">Blok E - Luas 12 Ha</p>
            </div>

            {/* Nested Weather Widget */}
            <div className="bg-white/10 p-3 rounded-lg border border-white/10 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">
                Kondisi Cuaca: Cerah Berawan (29°C)
              </p>
            </div>

            {/* Important Reminders Section */}
            <div className="space-y-2 pt-1.5">
              <p className="text-[10px] font-black uppercase text-[#C3E28D] tracking-wider">
                Peringatan Penting
              </p>
              <div className="space-y-1.5 text-xs font-medium text-[#efe0d2]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C3E28D] shrink-0 mt-0.5" />
                  <span>Persiapkan gudang penyimpanan di Subang.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C3E28D] shrink-0 mt-0.5" />
                  <span>Kalibrasi timbangan digital di lokasi.</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-1.5">
              <button
                onClick={() => alert('Jadwal Kalender Panen: Semua sektor terpantau siap panen pertengahan bulan.')}
                className="w-full py-1.5 px-3.5 rounded-lg bg-white text-[#2C4219] hover:bg-[#efe0d2] text-xs font-semibold transition-all text-center cursor-pointer shadow-xs"
              >
                Lihat Detail Kalender
              </button>
            </div>
          </div>

          {/* Bottom Card Widget ("Status Musim") */}
          <div className="bg-white p-4 rounded-xl border border-[#c4c8bb]/30 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#74796d]">Status Musim</span>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                PEAK HARVEST
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#221A12]">Indeks Kematangan</span>
                <span className="text-[#2C4219] font-black">88% OPTIMUM</span>
              </div>
              <div className="w-full h-2.5 bg-[#efe0d2] rounded-full overflow-hidden">
                <div className="h-full bg-[#2C4219] rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Input Data Panen */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Input Data Hasil Panen Baru"
        subtitle="Catat hasil tonase lahan dan varietas sorgum terpanen"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Lokasi Lahan & Blok
            </label>
            <input
              type="text"
              value={formData.lokasiLahan}
              onChange={(e) => setFormData({ ...formData, lokasiLahan: e.target.value })}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Varietas Sorgum
              </label>
              <select
                value={formData.varietas}
                onChange={(e) => setFormData({ ...formData, varietas: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
              >
                <option value="Bioguma 1">Bioguma 1</option>
                <option value="Bioguma 2">Bioguma 2</option>
                <option value="Bioguma 3">Bioguma 3</option>
                <option value="Numbu">Numbu</option>
                <option value="Suri 4">Suri 4</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Tonase Hasil (Ton)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.tonase}
                onChange={(e) => setFormData({ ...formData, tonase: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Penanggung Jawab Lahan
            </label>
            <input
              type="text"
              value={formData.petaniPenanggungJawab}
              onChange={(e) => setFormData({ ...formData, petaniPenanggungJawab: e.target.value })}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Catatan Lapangan
            </label>
            <textarea
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Catatan kondisi cuaca, timbangan, atau gudang"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold h-20"
            />
          </div>

          {/* Upload Foto Dokumentasi (JPG/PNG Only) */}
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Foto Dokumentasi Panen (Khusus JPG / PNG)
            </label>

            {imagePreview ? (
              <div className="relative p-3 bg-[#FFF8F4] border border-[#c4c8bb]/40 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Dokumentasi Panen"
                    className="w-14 h-14 object-cover rounded-lg border border-[#c4c8bb]/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#221A12] truncate">
                      {selectedImage?.name || 'Foto Panen'}
                    </p>
                    <p className="text-[10px] text-[#74796d] font-semibold">
                      {selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB` : ''} • Format JPG/PNG
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors shrink-0 cursor-pointer"
                  title="Hapus foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#c4c8bb]/50 hover:border-[#2C4219] bg-[#fff1e5]/60 hover:bg-[#FFF8F4] rounded-2xl cursor-pointer transition-all text-center">
                <div className="w-10 h-10 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-[#2C4219]">
                  Klik untuk unggah foto atau seret ke sini
                </span>
                <span className="text-[11px] text-[#74796d] font-semibold mt-0.5">
                  Format yang didukung: <strong className="text-[#2C4219]">.JPG, .JPEG, .PNG</strong> (Maks. 5 MB)
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}

            {imageError && (
              <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center gap-1">
                ⚠️ {imageError}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c4c8bb]/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                handleRemoveImage();
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Data Panen
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Record Modal */}
      {selectedDetail && (
        <Modal
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          title="Detail Data Panen"
          maxWidth="md"
        >
          <div className="-mx-6 -my-6">
            {/* Modal Body */}
            <div className="p-6 bg-white">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Left: Harvest Image */}
                <div className="w-44 h-44 sm:w-48 sm:h-48 shrink-0 rounded-2xl overflow-hidden border border-[#c4c8bb]/30 shadow-xs bg-[#F7F7F5]">
                  <img
                    src={selectedDetail.fotoUrl || "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80"}
                    alt={`Foto Hasil Panen ${selectedDetail.namaLahan}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Right: Info Details */}
                <div className="flex-1 space-y-3.5 text-left w-full">
                  <div>
                    <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                      TANGGAL PANEN
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#221A12] mt-0.5 block">
                      {selectedDetail.tanggalPanen}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                      LOKASI LAHAN
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#221A12] mt-0.5 block">
                      {selectedDetail.namaLahan}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block mb-1">
                      VARIETAS SORGUM
                    </span>
                    <span className="inline-block px-3 py-0.5 rounded-full bg-[#D1E6A5] text-[#2C4219] text-xs font-bold">
                      {selectedDetail.varietas}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                      TOTAL TONASE
                    </span>
                    <span className="text-sm sm:text-base font-black text-[#221A12] mt-0.5 block">
                      {(selectedDetail.jumlahHasilKg / 1000).toFixed(1)}{' '}
                      <span className="text-xs font-bold text-[#44483e]">Ton</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#FFF8F4] border-t border-[#c4c8bb]/20 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="px-6 py-2 rounded-lg bg-[#2C4219] text-white text-xs font-bold hover:bg-[#172C05] transition-all shadow-2xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
