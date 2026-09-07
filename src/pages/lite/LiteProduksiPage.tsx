import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Factory, Trash2, Boxes } from 'lucide-react';
import { productionApi } from '../../api/endpoints/productionApi';
import { productApi, Product } from '../../api/endpoints/productApi';
import { warehouseApi } from '../../api/endpoints/warehouseApi';
import { ProductionBatch } from '../../types';
import { useUnitSettings } from '../../context/UnitSettingsContext';
import { formatTanggalId } from '../../utils/dateUtils';
import { useLiteSearch } from '../../components/layout/lite/LiteLayout';
import { Modal } from '../../components/common/Modal';
import { Toast } from '../../components/common/Toast';
import { Button } from '../../components/common/Button';
import { Combobox, ComboboxOption } from '../../components/common/Combobox';

interface StockBatchOption {
  id: string;
  kodeBatchStok: string;
  sisaKg: number;
  tanggalMasuk: string | null;
}

export const LiteProduksiPage: React.FC = () => {
  const { searchTerm } = useLiteSearch();
  const { formatBerat } = useUnitSettings();
  const [dataList, setDataList] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Master produk untuk dropdown
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Bahan baku (batch stok gudang)
  const [gudangOptions, setGudangOptions] = useState<ComboboxOption[]>([]);
  const [gudangId, setGudangId] = useState('');
  const [stockBatchOptions, setStockBatchOptions] = useState<StockBatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductionBatch | null>(null);

  const [formData, setFormData] = useState({
    tanggalProduksi: new Date().toISOString().split('T')[0],
    tanggalKadaluarsa: '',
    jumlahHasil: '',
    bahanDigunakan: '',
    satuan: 'Pouch',
    operatorProduksi: '',
    catatan: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productionApi.getAll({ page: 1, limit: 100, search: searchTerm || undefined });
      setDataList(res.data || []);
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal memuat data olahan.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Muat master produk aktif
  useEffect(() => {
    productApi.getAll({ isActive: true }).then((res) => setProductOptions(res.data || [])).catch(() => setProductOptions([]));
    warehouseApi.getOptions().then((res) => {
      setGudangOptions((res.data || []).map((g) => ({ value: String(g.id), label: `${g.namaGudang}`, searchText: g.kodeGudang })));
    }).catch(() => setGudangOptions([]));
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setSelectedProductId(null);
    setGudangId('');
    setSelectedBatchId('');
    setStockBatchOptions([]);
    setFormData({ tanggalProduksi: new Date().toISOString().split('T')[0], tanggalKadaluarsa: '', jumlahHasil: '', bahanDigunakan: '', satuan: 'Pouch', operatorProduksi: '', catatan: '' });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Pilih produk master → nama & satuan terkunci otomatis
  const handleProductChange = (productId: string) => {
    const prod = productOptions.find((x) => String(x.id) === productId) || null;
    setSelectedProductId(prod ? String(prod.id) : null);
    setFormData((prev) => ({
      ...prev,
      satuan: prod ? prod.satuanHasil || 'Pouch' : prev.satuan,
    }));
  };

  // Pilih gudang → muat batch stok
  const handleGudangChange = async (gid: string) => {
    setGudangId(gid);
    setSelectedBatchId('');
    setStockBatchOptions([]);
    if (!gid) return;
    try {
      const res = await warehouseApi.getStockBatches(gid);
      const list = (res.data || []).filter((b: any) => Number(b.sisaKg) > 0);
      const options: StockBatchOption[] = list.map((b: any) => ({
        id: String(b.id),
        kodeBatchStok: b.kodeBatchStok,
        sisaKg: Number(b.sisaKg) || 0,
        tanggalMasuk: b.tanggalMasuk || null,
      }));
      setStockBatchOptions(options);
    } catch {
      setStockBatchOptions([]);
    }
  };

  const handleOpenEdit = (item: ProductionBatch) => {
    setEditingId(item.id);
    setSelectedProductId((item as any).productId ? String((item as any).productId) : null);
    setFormData({
      tanggalProduksi: item.tanggalProduksi ? String(item.tanggalProduksi).slice(0, 10) : '',
      tanggalKadaluarsa: item.tanggalKadaluarsa ? String(item.tanggalKadaluarsa).slice(0, 10) : '',
      jumlahHasil: item.jumlahHasil != null ? String(item.jumlahHasil) : '',
      bahanDigunakan: item.bahanDigunakan != null ? String(item.bahanDigunakan) : '',
      satuan: item.satuan || 'Pouch',
      operatorProduksi: item.operatorProduksi || '',
      catatan: (item as any).catatan || '',
    });
    setGudangId((item as any).gudangId ? String((item as any).gudangId) : '');
    setSelectedBatchId((item as any).stockBatchId ? String((item as any).stockBatchId) : '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = productOptions.find((x) => String(x.id) === String(selectedProductId || '')) || null;
    if (!product) {
      setToast({ msg: 'Pilih produk dari master data dulu (nama & satuan otomatis terisi).', type: 'error' });
      return;
    }
    const jumlahHasil = Number(formData.jumlahHasil) || 0;
    const bahan = Number(formData.bahanDigunakan) || 0;
    if (!jumlahHasil || jumlahHasil <= 0) {
      setToast({ msg: 'Jumlah hasil olahan wajib diisi.', type: 'error' });
      return;
    }
    if (bahan > 0) {
      const batch = stockBatchOptions.find((b) => String(b.id) === selectedBatchId);
      if (!batch) {
        setToast({ msg: 'Pilih stok batch (asal bahan) dulu.', type: 'error' });
        return;
      }
      if (bahan > batch.sisaKg) {
        setToast({ msg: `Bahan (${bahan} kg) melebihi sisa batch ${batch.kodeBatchStok} (${batch.sisaKg} kg).`, type: 'error' });
        return;
      }
    }
    // Kode batch dibuat otomatis oleh server (format sama dgn Mode Pro: PRD-<slug>-<tanggal>-<urutan>)
    const payload: any = {
      productId: String(product.id),
      namaProduk: product.name,
      satuan: product.satuanHasil || 'Pouch',
      tanggalProduksi: formData.tanggalProduksi,
      tanggalKadaluarsa: formData.tanggalKadaluarsa || null,
      jumlahHasil,
      bahanDigunakan: bahan > 0 ? bahan : null,
      satuanBahan: 'Kg',
      nomorBatchBahanBaku: bahan > 0 ? (stockBatchOptions.find((b) => String(b.id) === selectedBatchId)?.kodeBatchStok || '') : '',
      operatorProduksi: formData.operatorProduksi,
      statusQC: 'Pending QC',
      lokasiGudang: gudangOptions.find((g) => g.value === gudangId)?.label || '',
      gudangId: gudangId || null,
      stockBatchId: bahan > 0 ? selectedBatchId || null : null,
    };
    try {
      if (editingId) {
        await productionApi.update(editingId, payload);
        setToast({ msg: 'Batch olahan diperbarui.', type: 'success' });
      } else {
        await productionApi.create(payload);
        setToast({ msg: 'Batch olahan berhasil ditambahkan.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menyimpan olahan.', type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await productionApi.delete(deleteTarget.id);
      setToast({ msg: 'Batch olahan dihapus.', type: 'success' });
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setToast({ msg: err?.response?.data?.message || 'Gagal menghapus olahan.', type: 'error' });
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#172C05]">Kelola Olahan</h1>
          <p className="text-xs text-[#6B7280]">Catat produksi olahan dari bahan di gudang</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/lite/produk"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#C3E28D]/30 transition-colors text-xs font-bold cursor-pointer"
          >
            <Boxes className="w-4 h-4" /> Kelola Produk
          </Link>
          <Button onClick={handleOpenAdd} variant="primary">
            <Plus className="w-4 h-4" /> Catat Olahan
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-xs text-[#6B7280] py-10">Memuat data...</p>
      ) : dataList.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#c4c8bb]/50">
          <Factory className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
          <p className="text-sm text-[#6B7280]">Belum ada batch olahan.</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Klik "Catat Olahan" untuk mencatat batch pertama.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {dataList.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-[#c4c8bb]/30 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Factory className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#172C05] truncate">{item.namaProduk}</p>
                <p className="text-[11px] text-[#6B7280] truncate">
                  {item.kodeBatch} • {formatTanggalId(item.tanggalProduksi)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-extrabold text-[#2C4219]">{Number(item.jumlahHasil).toLocaleString('id-ID')} {item.satuan}</p>
                <p className="text-[10px] text-[#9CA3AF]">Bahan: {formatBerat(Number(item.bahanDigunakan) || 0)}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleOpenEdit(item)} title="Edit" className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 cursor-pointer">
                  <span className="text-xs font-bold">Edit</span>
                </button>
                <button onClick={() => setDeleteTarget(item)} title="Hapus" className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Batch Olahan' : 'Catat Batch Olahan Baru'}
        subtitle="Pilih produk lalu lengkapi hasil olahan"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Nama Produk Olahan *</label>
              <Combobox
                options={productOptions.map((p) => ({ value: String(p.id), label: p.name, searchText: p.satuanHasil || '' }))}
                value={selectedProductId || ''}
                onChange={handleProductChange}
                placeholder="Pilih produk dari master data..."
                emptyText="Belum ada produk master aktif."
                searchPlaceholder="Cari produk..."
                required
              />
              {productOptions.length === 0 && (
                <p className="text-[11px] font-semibold text-amber-600 mt-1.5">
                  Belum ada produk aktif. <Link to="/lite/produk" className="underline font-bold text-[#2C4219]">Kelola Produk Olahan</Link> dulu untuk membuat pilihan produk.
                </p>
              )}
              {selectedProductId && (
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Satuan otomatis: <b className="text-[#2C4219]">{formData.satuan}</b> (terkunci mengikuti master produk)
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Tanggal Produksi *</label>
              <input
                type="date"
                value={formData.tanggalProduksi}
                onChange={(e) => setFormData({ ...formData, tanggalProduksi: e.target.value })}
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Tanggal Kadaluarsa</label>
              <input
                type="date"
                value={formData.tanggalKadaluarsa}
                onChange={(e) => setFormData({ ...formData, tanggalKadaluarsa: e.target.value })}
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Jumlah Hasil *</label>
              <input
                type="number"
                step="0.01"
                value={formData.jumlahHasil}
                onChange={(e) => setFormData({ ...formData, jumlahHasil: e.target.value })}
                placeholder="Contoh: 250"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
              {selectedProductId && <p className="text-[10px] text-[#6B7280] mt-1">Satuan: {formData.satuan}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Jumlah Bahan (Kg)</label>
              <input
                type="number"
                step="0.01"
                value={formData.bahanDigunakan}
                onChange={(e) => setFormData({ ...formData, bahanDigunakan: e.target.value })}
                placeholder="Contoh: 300"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Gudang Asal Bahan</label>
              <Combobox
                options={gudangOptions}
                value={gudangId}
                onChange={handleGudangChange}
                placeholder="Pilih gudang..."
                emptyText="Belum ada gudang."
              />
            </div>
            {gudangId && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#2C4219] mb-1">Batch Stok (Asal Bahan)</label>
                <Combobox
                  options={stockBatchOptions.map((b) => ({ value: b.id, label: `${b.kodeBatchStok} — sisa ${formatBerat(b.sisaKg)}` }))}
                  value={selectedBatchId}
                  onChange={setSelectedBatchId}
                  placeholder="Pilih batch stok..."
                  emptyText="Tidak ada batch dengan sisa stok."
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#2C4219] mb-1">Operator Produksi</label>
              <input
                value={formData.operatorProduksi}
                onChange={(e) => setFormData({ ...formData, operatorProduksi: e.target.value })}
                placeholder="Contoh: Ibu Sri"
                className="w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary">{editingId ? 'Simpan Perubahan' : 'Simpan Olahan'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Hapus Batch Olahan?" subtitle="Konfirmasi Penghapusan" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-[#44483e] leading-relaxed">
            Apakah Anda yakin ingin menghapus <b>{deleteTarget?.namaProduk}</b> ({deleteTarget?.kodeBatch})?
          </p>
          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button type="button" variant="danger" onClick={confirmDelete}>Ya, Hapus</Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

