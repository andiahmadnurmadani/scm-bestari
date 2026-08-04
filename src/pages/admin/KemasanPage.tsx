import React, { useEffect, useRef, useState } from 'react';
import {
  Package, Plus, Edit3, Trash2, ChevronDown, ChevronUp,
  ImagePlus, Clock, Beaker, List, X, Upload, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { packagingApi } from '../../api/endpoints/packagingApi';
import { PackagingMaterial } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { nextCode } from '../../utils/kodeGenerator';

// ── Extended types ─────────────────────────────────────────────────────────────

interface NilaiGizi {
  energiKkal: number;
  lemakTotalG: number;
  lemakJenuhG: number;
  karbohidratG: number;
  seratG: number;
  proteinG: number;
  natriumMg: number;
  gulaTotalG: number;
}

interface AkgRow {
  nutrisi: string;
  perSajian: string;
  akgPersen: number;
}

interface RiwayatItem {
  tanggal: string;
  aksi: string;
  keterangan: string;
  oleh: string;
}

interface ProductExtra {
  komposisi: string;          // free text ingredient list
  nilaiGizi: NilaiGizi;
  akg: AkgRow[];
  riwayat: RiwayatItem[];
  imageDataUrl?: string;      // base64 preview
}

// ── Default values ────────────────────────────────────────────────────────────

const defaultNilaiGizi: NilaiGizi = {
  energiKkal: 0, lemakTotalG: 0, lemakJenuhG: 0,
  karbohidratG: 0, seratG: 0, proteinG: 0, natriumMg: 0, gulaTotalG: 0,
};

const defaultAkg: AkgRow[] = [
  { nutrisi: 'Energi', perSajian: '0 kkal', akgPersen: 0 },
  { nutrisi: 'Protein', perSajian: '0 g', akgPersen: 0 },
  { nutrisi: 'Lemak Total', perSajian: '0 g', akgPersen: 0 },
  { nutrisi: 'Karbohidrat Total', perSajian: '0 g', akgPersen: 0 },
  { nutrisi: 'Serat Pangan', perSajian: '0 g', akgPersen: 0 },
  { nutrisi: 'Natrium', perSajian: '0 mg', akgPersen: 0 },
];

// ── Helper: ambil data tambahan (komposisi/gizi/AKG/riwayat) dari API ─────────

const getExtra = (item?: { extraData?: PackagingMaterial['extraData'] } | null): ProductExtra => {
  const e = item?.extraData;
  if (!e) {
    return {
      komposisi: '',
      nilaiGizi: { ...defaultNilaiGizi },
      akg: defaultAkg.map((r) => ({ ...r })),
      riwayat: [],
      imageDataUrl: undefined,
    };
  }
  return {
    komposisi: e.komposisi || '',
    nilaiGizi: { ...defaultNilaiGizi, ...(e.nilaiGizi || {}) },
    akg: e.akg && e.akg.length > 0 ? e.akg.map((r) => ({ ...r })) : defaultAkg.map((r) => ({ ...r })),
    riwayat: e.riwayat || [],
    imageDataUrl: e.imageDataUrl,
  };
};

// ── Helper components ─────────────────────────────────────────────────────────

const inputCls = 'w-full p-2.5 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2C4219]/20';
const labelCls = 'block text-[10px] font-bold text-[#2C4219] uppercase tracking-wider mb-1';

const AkgBar: React.FC<{ persen: number }> = ({ persen }) => (
  <div className="w-full bg-[#F7F7F5] rounded-full h-1.5 mt-1">
    <div
      className="h-1.5 rounded-full bg-[#C3E28D] transition-all"
      style={{ width: `${Math.min(persen, 100)}%` }}
    />
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

export const KemasanPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [packagingList, setPackagingList] = useState<PackagingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('Semua');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<'komposisi' | 'gizi' | 'akg' | 'riwayat'>('gizi');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackagingMaterial | null>(null);
  const [modalTab, setModalTab] = useState<'dasar' | 'komposisi' | 'gizi' | 'akg'>('dasar');

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState<Partial<PackagingMaterial>>({
    kodeKemasan: '', namaKemasan: '', kategori: 'Standing Pouch',
    kapasitas: '', stokTersedia: 0, satuan: 'Pcs',
    stokMinimal: 0, pemasok: '', hargaPerUnitRp: 0,
  });
  const [formExtra, setFormExtra] = useState<ProductExtra>({
    komposisi: '', nilaiGizi: { ...defaultNilaiGizi },
    akg: defaultAkg.map((r) => ({ ...r })), riwayat: [], imageDataUrl: undefined,
  });

  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPackaging = async (targetPage = page, search = searchTerm, cat = activeCategoryTab) => {
    setLoading(true);
    try {
      const res = await packagingApi.getAll({
        page: targetPage,
        limit,
        search: search || undefined,
        kategori: cat === 'Semua' ? undefined : cat,
      });
      setPackagingList(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setPackagingList([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset ke halaman 1 saat search/tab berubah
  }, [searchTerm, activeCategoryTab]);

  useEffect(() => {
    fetchPackaging(page, searchTerm, activeCategoryTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, activeCategoryTab]);

  const handleOpenAdd = () => {
    setEditId(null);
    setModalTab('dasar');
    setFormData({
      kodeKemasan: nextCode('KMG-', packagingList, 3),
      namaKemasan: '', kategori: 'Standing Pouch', kapasitas: '',
      stokTersedia: 0, satuan: 'Pcs', stokMinimal: 0,
      pemasok: '', hargaPerUnitRp: 0,
    });
    setFormExtra({ komposisi: '', nilaiGizi: { ...defaultNilaiGizi }, akg: defaultAkg.map((r) => ({ ...r })), riwayat: [] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PackagingMaterial) => {
    setEditId(item.id);
    setModalTab('dasar');
    setFormData({ ...item });
    setFormExtra(getExtra(item));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const kode = formData.kodeKemasan ?? '';
    const newRiwayat: RiwayatItem = {
      tanggal: new Date().toISOString().slice(0, 10),
      aksi: editId ? 'Diperbarui' : 'Dibuat',
      keterangan: editId ? `Update data kemasan ${kode}` : `Item baru ${kode} didaftarkan`,
      oleh: 'Ibu KWT',
    };
    const payload: Partial<PackagingMaterial> = {
      ...formData,
      extraData: {
        komposisi: formExtra.komposisi,
        nilaiGizi: formExtra.nilaiGizi,
        akg: formExtra.akg,
        riwayat: [newRiwayat, ...(formExtra.riwayat ?? [])],
        imageDataUrl: formExtra.imageDataUrl,
      },
    };
    if (editId) {
      await packagingApi.update(editId, payload);
    } else {
      await packagingApi.create(payload);
    }
    setIsModalOpen(false);
    fetchPackaging();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await packagingApi.delete(deleteTarget.id);
    setDeleteTarget(null);
    fetchPackaging();
  };

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    setPage(targetPage);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormExtra((prev) => ({ ...prev, imageDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const updateGizi = (key: keyof NilaiGizi, val: number) =>
    setFormExtra((prev) => ({ ...prev, nilaiGizi: { ...prev.nilaiGizi, [key]: val } }));

  const updateAkg = (idx: number, field: keyof AkgRow, val: string | number) =>
    setFormExtra((prev) => {
      const akg = prev.akg.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
      return { ...prev, akg };
    });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setExpandedTab('gizi');
  };

  const categoriesList = ['Semua', 'Standing Pouch', 'Box Custom', 'Karung Bulk', 'Botol Kaca', 'Aksesoris'];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">Kelola Data Bahan Kemasan</h1>
        <Button onClick={handleOpenAdd} icon={<Plus className="w-3.5 h-3.5" />} variant="primary" className="w-full sm:w-auto text-xs py-1.5 px-3 justify-center">
          Tambah Stok Kemasan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-3.5 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-4 border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL ITEM KEMASAN</p>
          <h3 className="text-lg font-bold text-[#221A12] mt-0.5">{packagingList.length} Kategori Material</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5">Standing Pouch, Aluminium & Karung</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-4 border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">STOK MENIPIS (&lt; MINIMAL)</p>
          <h3 className="text-lg font-bold text-[#221A12] mt-0.5">{packagingList.filter((p) => p.statusStok === 'Stok Menipis').length} Jenis Item</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5">Perlu re-stock dalam waktu dekat</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-4 border-l-red-600">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">STOK HABIS (PERLU ORDER)</p>
          <h3 className="text-lg font-bold text-[#221A12] mt-0.5">{packagingList.filter((p) => p.statusStok === 'Habis').length} Jenis Item</h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5">Segera lakukan pemesanan ulang</p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-2xs border border-[#c4c8bb]/30 overflow-hidden">
        {/* Category tabs */}
        <div className="p-3.5 border-b border-[#c4c8bb]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-[#2C4219] text-sm">Daftar Persediaan Material Kemasan</h3>
          <div className="flex items-center gap-1 bg-[#F7F7F5] p-1 rounded-lg border border-[#c4c8bb]/30 overflow-x-auto custom-scrollbar">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryTab(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategoryTab === cat ? 'bg-[#C3E28D] text-[#172C05] shadow-2xs' : 'text-[#44483e] hover:text-[#172C05]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-b border-[#c4c8bb]/20">
                <th className="py-2.5 px-3 pl-4 w-6"></th>
                <th className="py-2.5 px-3 whitespace-nowrap">KODE KEMASAN</th>
                <th className="py-2.5 px-3 whitespace-nowrap">NAMA KEMASAN</th>
                <th className="py-2.5 px-3 whitespace-nowrap">STOK TERSEDIA</th>
                <th className="py-2.5 px-3 whitespace-nowrap">HARGA / UNIT</th>
                <th className="py-2.5 px-3 whitespace-nowrap">STATUS STOK</th>
                <th className="py-2.5 px-3 pr-4 text-center whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="text-[#221A12] font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B7280]">
                    <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                    Memuat data kemasan...
                  </td>
                </tr>
              ) : packagingList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B7280]">
                    Tidak ada data kemasan yang ditemukan.
                  </td>
                </tr>
              ) : (
              packagingList.map((item) => {
                const extra = getExtra(item);
                const isOpen = expandedId === item.id;
                return (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`border-b border-[#c4c8bb]/10 hover:bg-[#F7F7F5] transition-colors ${isOpen ? 'bg-[#F7F7F5]' : ''}`}
                    >
                      {/* Expand toggle */}
                      <td className="py-2.5 px-3 pl-4">
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="p-0.5 rounded text-[#6B7280] hover:text-[#2C4219] hover:bg-[#C3E28D]/20 transition-colors cursor-pointer"
                          title="Lihat detail gizi & riwayat"
                        >
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#2C4219] whitespace-nowrap">{item.kodeKemasan}</td>
                      <td className="py-2.5 px-3 font-semibold">{item.namaKemasan}</td>
                      <td className="py-2.5 px-3 font-bold whitespace-nowrap">{item.stokTersedia.toLocaleString('id-ID')} {item.satuan}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#2C4219] whitespace-nowrap">Rp {item.hargaPerUnitRp.toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <Badge variant={item.statusStok === 'Stok Cukup' ? 'success' : item.statusStok === 'Stok Menipis' ? 'warning' : 'error'}>
                          {item.statusStok}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 pr-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => handleOpenEdit(item)} className="p-1 text-[#2C4219] hover:bg-[#efe0d2] rounded transition-colors cursor-pointer" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(item)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" title="Hapus">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded Detail Panel ── */}
                    {isOpen && (
                      <tr>
                        <td colSpan={7} className="bg-[#FAFAFA] border-b border-[#c4c8bb]/20 p-0">
                          <div className="p-4 sm:p-5 space-y-4">
                            {/* Photo + tabs header */}
                            <div className="flex flex-col sm:flex-row gap-4">
                              {/* Product image */}
                              <div className="shrink-0">
                                {extra.imageDataUrl ? (
                                  <img
                                    src={extra.imageDataUrl}
                                    alt={item.namaKemasan}
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-[#c4c8bb]/30 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-[#c4c8bb]/40 flex flex-col items-center justify-center gap-1 text-[#9CA3AF] bg-white">
                                    <Package className="w-6 h-6" />
                                    <span className="text-[9px] font-semibold text-center leading-tight">Belum ada foto</span>
                                  </div>
                                )}
                              </div>

                              {/* Info + sub-tabs */}
                              <div className="flex-1 space-y-3">
                                <div>
                                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Pemasok</p>
                                  <p className="text-xs font-semibold text-[#221A12]">{item.pemasok}</p>
                                </div>
                                <div className="flex gap-1 border-b border-[#c4c8bb]/20 pb-0">
                                  {([
                                    { key: 'gizi', label: 'Nilai Gizi', icon: <Beaker className="w-3 h-3" /> },
                                    { key: 'komposisi', label: 'Komposisi', icon: <List className="w-3 h-3" /> },
                                    { key: 'akg', label: 'AKG', icon: <List className="w-3 h-3" /> },
                                    { key: 'riwayat', label: 'Riwayat', icon: <Clock className="w-3 h-3" /> },
                                  ] as const).map((t) => (
                                    <button
                                      key={t.key}
                                      onClick={() => setExpandedTab(t.key)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                                        expandedTab === t.key
                                          ? 'border-[#2C4219] text-[#2C4219] bg-white'
                                          : 'border-transparent text-[#6B7280] hover:text-[#2C4219]'
                                      }`}
                                    >
                                      {t.icon} {t.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Tab: Komposisi */}
                            {expandedTab === 'komposisi' && (
                              <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
                                <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15">
                                  <p className="text-[10px] font-bold text-[#2C4219] uppercase tracking-wider">Komposisi / Ingredients</p>
                                </div>
                                {extra.komposisi ? (
                                  <div className="px-4 py-3">
                                    <p className="text-xs text-[#44483e] leading-relaxed">{extra.komposisi}</p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#9CA3AF] text-center py-6">Belum ada data komposisi</p>
                                )}
                              </div>
                            )}

                            {/* Tab: Nilai Gizi */}
                            {expandedTab === 'gizi' && (
                              <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
                                <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15">
                                  <p className="text-[10px] font-bold text-[#2C4219] uppercase tracking-wider">Informasi Nilai Gizi (per 100g)</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-[#c4c8bb]/15 text-center">
                                  {[
                                    { label: 'Energi', val: `${extra.nilaiGizi.energiKkal} kkal`, color: 'text-orange-600' },
                                    { label: 'Protein', val: `${extra.nilaiGizi.proteinG} g`, color: 'text-blue-600' },
                                    { label: 'Lemak Total', val: `${extra.nilaiGizi.lemakTotalG} g`, color: 'text-amber-600' },
                                    { label: 'Lemak Jenuh', val: `${extra.nilaiGizi.lemakJenuhG} g`, color: 'text-red-500' },
                                    { label: 'Karbohidrat', val: `${extra.nilaiGizi.karbohidratG} g`, color: 'text-purple-600' },
                                    { label: 'Serat', val: `${extra.nilaiGizi.seratG} g`, color: 'text-emerald-600' },
                                    { label: 'Natrium', val: `${extra.nilaiGizi.natriumMg} mg`, color: 'text-[#2C4219]' },
                                    { label: 'Gula Total', val: `${extra.nilaiGizi.gulaTotalG} g`, color: 'text-pink-500' },
                                  ].map((n) => (
                                    <div key={n.label} className="p-3 space-y-0.5">
                                      <p className={`text-sm font-extrabold ${n.color}`}>{n.val}</p>
                                      <p className="text-[10px] text-[#6B7280] font-semibold">{n.label}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tab: AKG */}
                            {expandedTab === 'akg' && (
                              <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
                                <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15">
                                  <p className="text-[10px] font-bold text-[#2C4219] uppercase tracking-wider">
                                    Angka Kecukupan Gizi (AKG) — 2000 kkal
                                  </p>
                                </div>
                                <div className="divide-y divide-[#c4c8bb]/10">
                                  {extra.akg.map((row, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-2">
                                      <p className="text-xs font-semibold text-[#221A12] w-32 shrink-0">{row.nutrisi}</p>
                                      <p className="text-xs font-bold text-[#2C4219] w-20 shrink-0">{row.perSajian}</p>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                          <span className="text-[9px] font-bold text-[#6B7280]">{row.akgPersen}% AKG</span>
                                        </div>
                                        <AkgBar persen={row.akgPersen} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tab: Riwayat */}
                            {expandedTab === 'riwayat' && (
                              <div className="bg-white rounded-xl border border-[#c4c8bb]/20 overflow-hidden">
                                <div className="px-4 py-2.5 bg-[#F7F7F5] border-b border-[#c4c8bb]/15">
                                  <p className="text-[10px] font-bold text-[#2C4219] uppercase tracking-wider">Riwayat Aktivitas Produk</p>
                                </div>
                                {extra.riwayat.length === 0 ? (
                                  <p className="text-xs text-[#9CA3AF] text-center py-6">Belum ada riwayat</p>
                                ) : (
                                  <div className="divide-y divide-[#c4c8bb]/10">
                                    {extra.riwayat.map((r, i) => (
                                      <div key={i} className="flex items-start gap-3 px-4 py-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#C3E28D] mt-1.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold text-[#2C4219] bg-[#C3E28D]/20 px-1.5 py-0.5 rounded">{r.aksi}</span>
                                            <span className="text-[9px] text-[#9CA3AF] font-medium">{r.tanggal} · {r.oleh}</span>
                                          </div>
                                          <p className="text-xs text-[#44483e] mt-0.5">{r.keterangan}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Pagination */}
        {!loading && total > 0 && (
          <div className="p-3 sm:p-4 border-t border-[#c4c8bb]/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280]">
            <span className="font-medium">
              Menampilkan {packagingList.length === 0 ? 0 : (page - 1) * limit + 1}-
              {Math.min(page * limit, total)} dari {total} item
            </span>
            <div className="flex items-center gap-1 font-bold">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="p-1 rounded-md border border-[#c4c8bb]/30 text-[#44483e] hover:bg-[#F7F7F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => goToPage(num)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                    num === page ? 'bg-[#2C4219] text-white' : 'hover:bg-[#F7F7F5] text-[#44483e]'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="p-1 rounded-md border border-[#c4c8bb]/30 text-[#44483e] hover:bg-[#F7F7F5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? 'Edit Data Kemasan' : 'Tambah Material Kemasan Baru'}
        subtitle="Lengkapi informasi kemasan, nilai gizi, dan AKG produk"
      >
        <form onSubmit={handleSave} className="space-y-0">
          {/* Modal sub-tabs */}
          <div className="flex gap-1 border-b border-[#c4c8bb]/20 mb-4 -mt-1">
            {([
              { key: 'dasar', label: 'Data Dasar' },
              { key: 'komposisi', label: 'Komposisi' },
              { key: 'gizi', label: 'Nilai Gizi' },
              { key: 'akg', label: 'AKG' },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setModalTab(t.key)}
                className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  modalTab === t.key ? 'border-[#2C4219] text-[#2C4219]' : 'border-transparent text-[#6B7280] hover:text-[#2C4219]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Data Dasar ── */}
          {modalTab === 'dasar' && (
            <div className="space-y-4">
              {/* Image upload */}
              <div>
                <label className={labelCls}>Foto Produk (JPG / PNG)</label>
                <div
                  className="relative border-2 border-dashed border-[#c4c8bb]/40 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-[#2C4219]/40 hover:bg-[#F7F7F5] transition-all group"
                  onClick={() => fileRef.current?.click()}
                >
                  {formExtra.imageDataUrl ? (
                    <>
                      <img src={formExtra.imageDataUrl} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-[#c4c8bb]/30" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFormExtra((p) => ({ ...p, imageDataUrl: undefined })); }}
                        className="absolute top-2 right-2 p-0.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-[10px] text-[#9CA3AF] font-medium">Klik untuk ganti foto</p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[#C3E28D]/30 text-[#2C4219] flex items-center justify-center group-hover:bg-[#C3E28D]/50 transition-colors">
                        <ImagePlus className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-[#2C4219]">Upload foto produk</p>
                      <p className="text-[10px] text-[#9CA3AF]">JPG atau PNG, maks. 5 MB</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleImageUpload} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Kode Kemasan</label>
                  <input
                    type="text"
                    value={formData.kodeKemasan}
                    readOnly
                    disabled
                    title="Kode dibuat otomatis oleh sistem (auto-increment)"
                    className={`${inputCls} bg-[#F7F7F5] text-[#2C4219] cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Kategori</label>
                  <select value={formData.kategori} onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })} className={inputCls}>
                    <option>Standing Pouch</option>
                    <option>Box Custom</option>
                    <option>Karung Bulk</option>
                    <option>Botol Kaca</option>
                    <option>Aksesoris</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Nama Kemasan</label>
                <input type="text" value={formData.namaKemasan} onChange={(e) => setFormData({ ...formData, namaKemasan: e.target.value })} placeholder="Contoh: Standing Pouch Alufoil 500g" className={inputCls} required />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Stok Tersedia</label>
                  <input type="number" value={formData.stokTersedia} onChange={(e) => setFormData({ ...formData, stokTersedia: Number(e.target.value) })} placeholder="Contoh: 2000" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Stok Minimal</label>
                  <input type="number" value={formData.stokMinimal} onChange={(e) => setFormData({ ...formData, stokMinimal: Number(e.target.value) })} placeholder="Contoh: 500" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Harga / Unit (Rp)</label>
                  <input type="number" value={formData.hargaPerUnitRp} onChange={(e) => setFormData({ ...formData, hargaPerUnitRp: Number(e.target.value) })} placeholder="Contoh: 1850" className={inputCls} required />
                </div>
              </div>

              <div>
                <label className={labelCls}>Pemasok / Vendor</label>
                <input type="text" value={formData.pemasok} onChange={(e) => setFormData({ ...formData, pemasok: e.target.value })} placeholder="Contoh: PT Kemasan Mulia Jaya" className={inputCls} required />
              </div>
            </div>
          )}

          {/* ── Tab: Komposisi ── */}
          {modalTab === 'komposisi' && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Komposisi / Ingredients Produk</p>
              <textarea
                rows={8}
                value={formExtra.komposisi}
                onChange={(e) => setFormExtra((p) => ({ ...p, komposisi: e.target.value }))}
                placeholder={"Tuliskan daftar bahan/komposisi produk secara lengkap.\nContoh: Tepung Sorgum (Sorghum bicolor L.) varietas Bioguma, tanpa bahan pengawet, tanpa pewarna buatan, bebas gluten."}
                className={`${inputCls} resize-none`}
              />
              {formExtra.komposisi && (
                <div className="px-3 py-2.5 bg-[#C3E28D]/10 border border-[#C3E28D]/30 rounded-xl">
                  <p className="text-[10px] font-bold text-[#2C4219] mb-1">Preview</p>
                  <p className="text-xs text-[#44483e] leading-relaxed whitespace-pre-line">{formExtra.komposisi}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Nilai Gizi ── */}
          {modalTab === 'gizi' && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Nilai Gizi per 100g Produk</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'energiKkal', label: 'Energi (kkal)' },
                  { key: 'proteinG', label: 'Protein (g)' },
                  { key: 'lemakTotalG', label: 'Lemak Total (g)' },
                  { key: 'lemakJenuhG', label: 'Lemak Jenuh (g)' },
                  { key: 'karbohidratG', label: 'Karbohidrat (g)' },
                  { key: 'seratG', label: 'Serat Pangan (g)' },
                  { key: 'natriumMg', label: 'Natrium (mg)' },
                  { key: 'gulaTotalG', label: 'Gula Total (g)' },
                ] as { key: keyof NilaiGizi; label: string }[]).map(({ key, label }) => (
                  <div key={key}>
                    <label className={labelCls}>{label}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formExtra.nilaiGizi[key]}
                      onChange={(e) => updateGizi(key, parseFloat(e.target.value) || 0)}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: AKG ── */}
          {modalTab === 'akg' && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Angka Kecukupan Gizi (AKG) — Referensi 2000 kkal</p>
              <div className="space-y-2">
                {formExtra.akg.map((row, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-end bg-[#F7F7F5] rounded-xl p-2.5">
                    <div className="col-span-2">
                      <label className={labelCls}>Nutrisi</label>
                      <input
                        type="text"
                        value={row.nutrisi}
                        onChange={(e) => updateAkg(i, 'nutrisi', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Per Sajian</label>
                      <input
                        type="text"
                        value={row.perSajian}
                        onChange={(e) => updateAkg(i, 'perSajian', e.target.value)}
                        className={inputCls}
                        placeholder="0 g"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>% AKG</label>
                      <input
                        type="number"
                        value={row.akgPersen}
                        onChange={(e) => updateAkg(i, 'akgPersen', Number(e.target.value))}
                        className={inputCls}
                        min="0"
                        max="999"
                      />
                    </div>
                    <div className="pb-0.5">
                      <AkgBar persen={row.akgPersen} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="primary" icon={<Upload className="w-3.5 h-3.5" />}>
              {editId ? 'Perbarui Data' : 'Simpan Kemasan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Hapus Data Kemasan"
          maxWidth="sm"
        >
          <div className="space-y-4 text-sm text-[#221A12]">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">
                  Apakah Anda yakin ingin menghapus data kemasan ini?
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                  <strong>{deleteTarget.kodeKemasan}</strong> — {deleteTarget.namaKemasan}.
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#c4c8bb]/20">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Batal
              </Button>
              <Button type="button" variant="danger" onClick={confirmDelete}>
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
