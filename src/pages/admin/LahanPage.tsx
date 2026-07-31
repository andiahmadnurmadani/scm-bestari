import React, { useEffect, useState } from 'react';
import { Plus, MapPin, Layers, LayoutGrid, Sprout, FileText, TrendingUp, Compass, Edit3, Eye, Trash2, Upload, X } from 'lucide-react';
import { landApi } from '../../api/endpoints/landApi';
import { LandPlot } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';

export const LahanPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [landList, setLandList] = useState<LandPlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<LandPlot | null>(null);
  const [detailPlot, setDetailPlot] = useState<LandPlot | null>(null);

  // Image Upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');

  const [formData, setFormData] = useState<Partial<LandPlot>>({
    namaLahan: '',
    lokasiDesa: 'Sukamaju',
    kecamatan: 'Cisalak',
    luasHektar: 2.5,
    varietasSorgum: 'Bioguma',
    statusIrigasi: 'Irigasi Teknis',
    jenisTanah: 'Aluvial',
    pemilikKelompokTani: 'Kelompok Tani Sukamaju',
    statusKesiapan: 'Siap Tanam',
    statusBadge: 'AKTIF',
    panenLaluTon: 10.0,
    fotoUrl: '',
  });

  const fetchLand = async () => {
    setLoading(true);
    const data = await landApi.getAll();
    setLandList(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLand();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setImageError('Format file tidak didukung! Harap pilih file JPG, JPEG, atau PNG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Ukuran file terlalu besar! Maksimal 5 MB.');
      return;
    }

    setImageError('');
    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setFormData((prev) => ({ ...prev, fotoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    setImageError('');
    setFormData((prev) => ({ ...prev, fotoUrl: '' }));
  };

  const handleOpenAdd = () => {
    setEditingPlot(null);
    handleRemoveImage();
    setFormData({
      namaLahan: '',
      lokasiDesa: 'Sukamaju',
      kecamatan: 'Cisalak',
      luasHektar: 2.5,
      varietasSorgum: 'Bioguma',
      statusIrigasi: 'Irigasi Teknis',
      jenisTanah: 'Aluvial',
      pemilikKelompokTani: 'Kelompok Tani Sukamaju',
      statusKesiapan: 'Siap Tanam',
      statusBadge: 'AKTIF',
      panenLaluTon: 12.0,
      fotoUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    });
    setImagePreview('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plot: LandPlot) => {
    setEditingPlot(plot);
    setFormData(plot);
    setSelectedImage(null);
    setImageError('');
    setImagePreview(plot.fotoUrl || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalFotoUrl = formData.fotoUrl || imagePreview || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';
    
    if (editingPlot) {
      await landApi.update(editingPlot.id, { ...formData, fotoUrl: finalFotoUrl });
    } else {
      await landApi.create({
        ...formData,
        kodeLahan: `BLK-${formData.namaLahan?.slice(0, 3).toUpperCase() || 'LHN'}-${Math.floor(Math.random() * 90 + 10)}`,
        fotoUrl: finalFotoUrl,
      });
    }
    setIsModalOpen(false);
    handleRemoveImage();
    fetchLand();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data lahan ini?')) {
      await landApi.delete(id);
      fetchLand();
    }
  };

  const filteredList = landList.filter((item) => {
    return (
      item.kodeLahan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.namaLahan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lokasiDesa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.varietasSorgum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.pemilikKelompokTani.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalHektar = landList.reduce((acc, curr) => acc + (curr.luasHektar || 0), 0);

  const getBadgeStyle = (badge?: string, statusKesiapan?: string) => {
    const val = (badge || statusKesiapan || '').toUpperCase();
    if (val.includes('AKTIF') || val.includes('SIAP')) {
      return 'bg-[#D1E6A5] text-[#2C4219] border-transparent';
    }
    if (val.includes('PERSIAPAN') || val.includes('TUMBUH')) {
      return 'bg-[#FEF3C7] text-[#92400E] border-transparent';
    }
    if (val.includes('PEMBESARAN') || val.includes('PANEN')) {
      return 'bg-[#FEE2E2] text-[#991B1B] border-transparent';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#221A12] tracking-tight">
            Kelola Lahan
          </h1>
        </div>

        {/* Primary CTA Button */}
        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-[#1C3615] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#12240E] transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-[#D1E6A5]" />
          <span>Tambah Lahan Baru</span>
        </button>
      </div>

      {/* Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Card 1: Total Luas Lahan */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            TOTAL LUAS LAHAN
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {totalHektar > 0 ? totalHektar.toFixed(1) : '42.5'} Ha
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            Tersebar di 6 desa wilayah binaan
          </p>
        </div>

        {/* Card 2: Jumlah Blok Lahan */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            JUMLAH BLOK LAHAN
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            18 Blok Lahan
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            Kelompok Tani & KWT Mitra
          </p>
        </div>

        {/* Card 3: Lahan Siap Panen */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            LAHAN SIAP PANEN
          </p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            5 Lokasi Lahan
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            Siap panen dalam 14 hari kedepan
          </p>
        </div>
      </div>

      {/* Grid of Land Block Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredList.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow-xs border border-[#c4c8bb]/25 p-3.5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-all duration-200 group"
          >
            {/* Left Image */}
            <div className="w-full sm:w-40 h-40 sm:h-full shrink-0 rounded-lg overflow-hidden relative bg-[#F7F7F5] border border-[#c4c8bb]/20">
              <img
                src={
                  item.fotoUrl ||
                  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
                }
                alt={item.namaLahan}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Right Details */}
            <div className="flex-1 flex flex-col justify-between py-0.5">
              <div>
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-[#221A12] text-sm leading-snug">
                    {item.namaLahan}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0 ${getBadgeStyle(
                      item.statusBadge,
                      item.statusKesiapan
                    )}`}
                  >
                    {item.statusBadge || (item.statusKesiapan === 'Siap Tanam' ? 'AKTIF' : 'PERSIAPAN')}
                  </span>
                </div>

                {/* Info List */}
                <div className="space-y-1.5 text-xs text-[#44483e] font-semibold">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#74796d] shrink-0" />
                    <span>
                      Luas: <strong className="text-[#221A12]">{item.luasHektar} Ha</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#74796d] shrink-0" />
                    <span>
                      Panen Lalu:{' '}
                      <strong className="text-[#221A12]">
                        {item.panenLaluTon || (item.luasHektar * 4.8).toFixed(1)} Ton
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-[#74796d] shrink-0" />
                    <span>
                      Sorgum {item.varietasSorgum} / {item.jenisTanah}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#c4c8bb]/15">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="px-3 py-1 rounded-lg border border-[#c4c8bb]/50 bg-white hover:bg-[#F7F7F5] text-xs font-semibold text-[#44483e] transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDetailPlot(item)}
                  className="px-3.5 py-1 rounded-lg bg-[#1C3615] hover:bg-[#12240E] text-xs font-semibold text-white transition-all shadow-2xs cursor-pointer"
                >
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-auto cursor-pointer"
                  title="Hapus Plot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail Plot Lahan */}
      <Modal
        isOpen={Boolean(detailPlot)}
        onClose={() => setDetailPlot(null)}
        title="Detail Data Lahan"
        maxWidth="md"
      >
        {detailPlot && (
          <div className="-mx-6 -my-6">
            <div className="p-6 bg-white">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Left: Land Image */}
                <div className="w-44 h-44 sm:w-48 sm:h-48 shrink-0 rounded-2xl overflow-hidden border border-[#c4c8bb]/30 shadow-xs bg-[#F7F7F5]">
                  <img
                    src={
                      detailPlot.fotoUrl ||
                      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={detailPlot.namaLahan}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Right: Info Specs */}
                <div className="flex-1 space-y-3.5 text-left w-full">
                  <div>
                    <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                      NAMA LAHAN / BLOK
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-[#221A12] mt-0.5 block">
                      {detailPlot.namaLahan} ({detailPlot.kodeLahan})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                        LUAS LAHAN
                      </span>
                      <span className="text-xs sm:text-sm font-black text-[#221A12] mt-0.5 block">
                        {detailPlot.luasHektar} Ha
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                        PANEN LALU
                      </span>
                      <span className="text-xs sm:text-sm font-black text-[#221A12] mt-0.5 block">
                        {detailPlot.panenLaluTon || (detailPlot.luasHektar * 4.8).toFixed(1)} Ton
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block mb-1">
                      VARIETAS & TANAH
                    </span>
                    <span className="inline-block px-3 py-0.5 rounded-full bg-[#D1E6A5] text-[#2C4219] text-xs font-bold">
                      Sorgum {detailPlot.varietasSorgum} / {detailPlot.jenisTanah}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                      KELOMPOK TANI / PENGELOLA
                    </span>
                    <span className="text-xs font-extrabold text-[#221A12] mt-0.5 block">
                      {detailPlot.pemilikKelompokTani} ({detailPlot.lokasiDesa}, {detailPlot.kecamatan})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#FFF8F4] border-t border-[#c4c8bb]/20 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailPlot(null)}
                className="px-6 py-2 rounded-lg bg-[#1C3615] text-white text-xs font-bold hover:bg-[#12240E] transition-all shadow-2xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tambah / Edit Lahan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlot ? 'Edit Data Plot Lahan' : 'Tambah Lahan Baru'}
        subtitle="Daftarkan sektor tanah baru mitra KWT"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Nama Lahan / Blok
            </label>
            <input
              type="text"
              value={formData.namaLahan}
              onChange={(e) => setFormData({ ...formData, namaLahan: e.target.value })}
              placeholder="Contoh: Blok A - Sukamaju"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Lokasi Desa
              </label>
              <input
                type="text"
                value={formData.lokasiDesa}
                onChange={(e) => setFormData({ ...formData, lokasiDesa: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Luas (Hektar)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.luasHektar}
                onChange={(e) => setFormData({ ...formData, luasHektar: Number(e.target.value) })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Varietas Sorgum
              </label>
              <select
                value={formData.varietasSorgum}
                onChange={(e) => setFormData({ ...formData, varietasSorgum: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="Bioguma">Bioguma</option>
                <option value="Kawali">Kawali</option>
                <option value="Supur-1">Supur-1</option>
                <option value="Numbu">Numbu</option>
                <option value="Bioguma 2">Bioguma 2</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Status Badge
              </label>
              <select
                value={formData.statusBadge || 'AKTIF'}
                onChange={(e) => setFormData({ ...formData, statusBadge: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              >
                <option value="AKTIF">AKTIF</option>
                <option value="PERSIAPAN">PERSIAPAN</option>
                <option value="PEMBESARAN">PEMBESARAN</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Jenis Tanah
              </label>
              <input
                type="text"
                value={formData.jenisTanah}
                onChange={(e) => setFormData({ ...formData, jenisTanah: e.target.value })}
                placeholder="Aluvial / Latosol / Grumosol"
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Panen Lalu (Ton)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.panenLaluTon || 10.0}
                onChange={(e) => setFormData({ ...formData, panenLaluTon: Number(e.target.value) })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Upload Foto Lahan (JPG/PNG Only) */}
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Foto Lahan (Khusus JPG / PNG)
            </label>

            {imagePreview ? (
              <div className="relative p-3 bg-[#FFF8F4] border border-[#c4c8bb]/40 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Foto Lahan"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-cover rounded-lg border border-[#c4c8bb]/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#221A12] truncate">
                      {selectedImage?.name || 'Foto Lahan Terpilih'}
                    </p>
                    <p className="text-[10px] text-[#74796d] font-semibold">
                      {selectedImage ? `${(selectedImage.size / 1024).toFixed(1)} KB • ` : ''}Format JPG/PNG
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
                  Klik untuk unggah foto lahan atau seret ke sini
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
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Data Lahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

