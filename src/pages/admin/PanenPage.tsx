import React, { useEffect, useState } from 'react';
import {
  Sprout,
  Plus,
  Filter,
  Download,
  Leaf,
  Calendar,
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
  Edit3,
  FileSpreadsheet,
  AlertTriangle,
  MapPin,
  Clock,
  Layers,
  User,
  CalendarDays,
  Hash,
  Warehouse as WarehouseIcon,
  Package,
} from 'lucide-react';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { varietyApi, Variety } from '../../api/endpoints/varietyApi';
import { landApi } from '../../api/endpoints/landApi';
import { plantingApi } from '../../api/endpoints/plantingApi';
import { warehouseApi } from '../../api/endpoints/warehouseApi';
import { HarvestRecord, LandPlot, Planting, Warehouse } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { ActionButtons } from '../../components/common/ActionButtons';
import { Toast } from '../../components/common/Toast';
import { Combobox } from '../../components/common/Combobox';
import { useUnitSettings } from '../../context/UnitSettingsContext';

const filterInputCls =
  'w-full px-2.5 py-1.5 bg-[#F7F7F5] border border-[#c4c8bb]/40 rounded-lg text-xs font-medium text-[#221A12] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 focus:border-[#2C4219] focus:bg-white transition-all';

export const PanenPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const { formatBerat, beratKeKg, kgKeUnit, beratSuffix } = useUnitSettings();
  const [harvestList, setHarvestList] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<HarvestRecord | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // 10 baris per halaman
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter State
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterLahan, setFilterLahan] = useState('');
  const [filterVarietas, setFilterVarietas] = useState('');
  const [filterTanggalAwal, setFilterTanggalAwal] = useState('');
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  // Kalender panen
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);

  // Master Data Varietas (dropdown dinamis)
  const [varietyList, setVarietyList] = useState<Variety[]>([]);
  const [varietyLoading, setVarietyLoading] = useState(true);

  // Master Data Lahan (dropdown lokasi lahan dinamis)
  const [landList, setLandList] = useState<LandPlot[]>([]);
  const [landLoading, setLandLoading] = useState(true);
  const [activePlantings, setActivePlantings] = useState<Planting[]>([]);
  const lahanSedangDitanam = React.useMemo(() => landList.filter(l => activePlantings.some(p => String(p.lahanId) === String(l.id))), [landList, activePlantings]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // ID yang sedang diedit (null = tambah baru)
  const [deleteTarget, setDeleteTarget] = useState<HarvestRecord | null>(null); // Data yang akan dihapus
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    lokasiLahan: '',
    lahanId: '',
    plantingId: '',
    varietas: '',
    tanggalPanen: new Date().toISOString().split('T')[0],
    tonase: '',
    petaniPenanggungJawab: '',
    catatan: '',
    panenKe: 1,
  });
  const [formKodePanen, setFormKodePanen] = useState('');
  const [plantingsForForm, setPlantingsForForm] = useState<Planting[]>([]);
  const [selectedPlanting, setSelectedPlanting] = useState<Planting | null>(null);
  // Opsi B: 1 panen → banyak batch stok gudang [{ jumlahKg, keterangan }]
  const [stokBatch, setStokBatch] = useState<{ jumlahKg: string; keterangan: string }[]>([{ jumlahKg: '', keterangan: '' }]);
  const [stokBatchError, setStokBatchError] = useState('');
  // Daftar gudang untuk pilihan & default sesuai lahan
  const [gudangList, setGudangList] = useState<Warehouse[]>([]);
  const [selectedGudangId, setSelectedGudangId] = useState('');
  // Ratoon sorgum: daftar panen_ke yang sudah terpakai pada planting terpilih
  const [usedPanenKe, setUsedPanenKe] = useState<number[]>([]);

  // Hitung nomor panen berikutnya untuk sebuah planting (1..3) dari panen existing
  const computeNextPanenKe = async (plantingId: string) => {
    if (!plantingId) {
      setUsedPanenKe([]);
      setFormData((prev) => ({ ...prev, panenKe: 1 }));
      return;
    }
    try {
      const res = await harvestApi.getAll({ plantingId, limit: 100 });
      const used = (res.data || []).map((h) => Number(h.panenKe) || 1).filter((n) => n >= 1 && n <= 3);
      setUsedPanenKe(used);
      let next = 1;
      while (used.includes(next) && next < 3) next += 1;
      setFormData((prev) => ({ ...prev, panenKe: next }));
    } catch {
      setUsedPanenKe([]);
      setFormData((prev) => ({ ...prev, panenKe: 1 }));
    }
  };

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

  const fetchHarvest = async (targetPage = page, search = searchTerm) => {
    setLoading(true);
    try {
      const res = await harvestApi.getAll({
        page: targetPage,
        limit,
        search: search || undefined,
        lahan: filterLahan || undefined,
        varietas: filterVarietas || undefined,
        tanggalAwal: filterTanggalAwal || undefined,
        tanggalAkhir: filterTanggalAkhir || undefined,
        status: filterStatus || undefined,
      });
      setHarvestList(res.data || []);
      setTotal(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setHarvestList([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1); // Reset ke halaman 1 saat search atau filter berubah
  }, [searchTerm, filterLahan, filterVarietas, filterTanggalAwal, filterTanggalAkhir, filterStatus]);

  useEffect(() => {
    fetchHarvest(page, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, filterLahan, filterVarietas, filterTanggalAwal, filterTanggalAkhir, filterStatus]);

  // Ambil daftar varietas dari master data saat halaman dimuat
  useEffect(() => {
    varietyApi
      .getAll()
      .then((res) => {
        setVarietyList(res.data || []);
      })
      .catch(() => setVarietyList([]))
      .finally(() => setVarietyLoading(false));
  }, []);

  // Ambil daftar lahan dari kelola lahan saat halaman dimuat
  useEffect(() => {
    landApi
      .getAll({ limit: 100 })
      .then((res) => {
        setLandList(res.data || []);
      })
      .catch(() => setLandList([]))
      .finally(() => setLandLoading(false));
  }, []);

  // Ambil penanaman aktif untuk filter lahan yang sedang ditanam (panen hanya dari lahan aktif)
  useEffect(() => {
    plantingApi.getAll({ limit: 100 }).then(res => {
      const active = (res.data || []).filter((p: Planting) => ['Ditanam','Tumbuh','Siap Panen'].includes(p.statusTanam));
      setActivePlantings(active);
    }).catch(()=> setActivePlantings([]));
  }, []);

  // Ambil daftar gudang untuk pilihan Masuk Gudang
  useEffect(() => {
    warehouseApi
      .getAll({ page: 1, limit: 100 })
      .then((res) => setGudangList(res.data || []))
      .catch(() => setGudangList([]));
  }, []);

  // Saat pilih lahan dari dropdown, isi otomatis varietas & muat penanaman untuk traceability — auto-pilih penanaman aktif terbaru
  const handleLandChange = async (lahanId: string) => {
    const selected = landList.find((l) => l.id === lahanId);
    setFormData((prev) => ({
      ...prev,
      lahanId,
      lokasiLahan: selected?.namaLahan || prev.lokasiLahan,
      varietas: selected?.varietasSorgum || prev.varietas,
      plantingId: '',
    }));
    // Default gudang = gudang milik lahan yang dipilih
    const gudangLahan = gudangList.find((g) => String(g.lahanId) === String(lahanId));
    setSelectedGudangId(gudangLahan ? gudangLahan.id : gudangList[0]?.id || '');
    setSelectedPlanting(null);
    if (lahanId) {
      try {
        const res = await plantingApi.getAll({ lahanId, limit: 50 });
        const list: Planting[] = res.data || [];
        setPlantingsForForm(list);
        // auto-pilih penanaman yang siap panen / tumbuh / ditanam paling baru
        const priority: any = { 'Siap Panen': 0, 'Tumbuh': 1, 'Ditanam': 2 };
        const sorted = [...list].sort((a,b) => (priority[a.statusTanam] ?? 9) - (priority[b.statusTanam] ?? 9) || new Date(b.tanggalTanam).getTime() - new Date(a.tanggalTanam).getTime());
        const auto = sorted.find(p => ['Siap Panen','Tumbuh','Ditanam'].includes(p.statusTanam)) || sorted[0];
        if (auto) {
          setSelectedPlanting(auto);
          setFormData(prev => ({ ...prev, plantingId: auto.id, varietas: auto.varietas || prev.varietas }));
          await computeNextPanenKe(auto.id);
        } else {
          setUsedPanenKe([]);
          setFormData(prev => ({ ...prev, panenKe: 1 }));
        }
      } catch { setPlantingsForForm([]); setUsedPanenKe([]); }
    } else { setPlantingsForForm([]); setUsedPanenKe([]); }
  };
  const handlePlantingChange = (plantingId: string) => {
    const p = plantingsForForm.find((x) => x.id === plantingId) || null;
    setSelectedPlanting(p);
    setFormData((prev) => ({
      ...prev,
      plantingId,
      varietas: p?.varietas || prev.varietas,
    }));
    computeNextPanenKe(plantingId);
  };

  // Buka modal untuk tambah data baru
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      lokasiLahan: '',
      lahanId: '',
      plantingId: '',
      varietas: '',
      tanggalPanen: new Date().toISOString().split('T')[0],
      tonase: '',
      petaniPenanggungJawab: '',
      catatan: '',
      panenKe: 1,
    });
    setPlantingsForForm([]);
    setSelectedPlanting(null);
    setSelectedGudangId('');
    // Kode panen dibuat otomatis backend saat simpan (read-only preview)
    setFormKodePanen('');
    setStokBatch([{ jumlahKg: '', keterangan: '' }]);
    setStokBatchError('');
    setUsedPanenKe([]);
    setImagePreview(null);
    setSelectedImage(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  // Buka detail panen (fetch data lengkap: asal tanam + batch gudang)
  const openDetail = async (row: HarvestRecord) => {
    setSelectedDetail(row);
    try {
      const res = await harvestApi.getById(row.id);
      if (res.data) setSelectedDetail(res.data);
    } catch {
      // Biarkan data baris tampil bila gagal fetch detail
    }
  };

  // Buka modal untuk edit data yang ada
  const openEditModal = async (row: HarvestRecord) => {
    setEditingId(row.id);
    setFormKodePanen(row.kodePanen);
    setFormData({
      lokasiLahan: row.namaLahan,
      lahanId: (row as any).lahanId || '',
      plantingId: (row as any).plantingId || '',
      varietas: row.varietas,
      tanggalPanen: row.tanggalPanen ? row.tanggalPanen.split('T')[0] : new Date().toISOString().split('T')[0],
      tonase: String(kgKeUnit(row.jumlahHasilKg)),
      petaniPenanggungJawab: row.petaniPenanggungJawab,
      catatan: row.catatan || '',
      panenKe: (row as any).panenKe || 1,
    });
    // muat plantings untuk lahan terkait agar dropdown penanaman terisi saat edit
    const lahanIdForEdit = (row as any).lahanId;
    if (lahanIdForEdit) {
      try {
        const res = await plantingApi.getAll({ lahanId: lahanIdForEdit, limit: 50 });
        setPlantingsForForm(res.data || []);
        const p = (res.data || []).find((x: Planting) => x.id === (row as any).plantingId) || null;
        setSelectedPlanting(p);
        // muat daftar panen existing pada planting ini untuk men-disable nomor yang sudah terpakai
        if (p) {
          try {
            const hp = await harvestApi.getAll({ plantingId: p.id, limit: 100 });
            const used = (hp.data || []).map((h) => Number(h.panenKe) || 1).filter((n) => n >= 1 && n <= 3);
            setUsedPanenKe(used);
          } catch { setUsedPanenKe([]); }
        } else {
          setUsedPanenKe([]);
        }
      } catch { setPlantingsForForm([]); }
    } else {
      setPlantingsForForm([]);
      setSelectedPlanting(null);
      setUsedPanenKe([]);
    }
    // Prefill pecahan batch stok dari detail panen (stockBatches dari backend)
    try {
      const det = await harvestApi.getById(row.id);
      const batches = det.data?.stockBatches || [];
      if (batches.length > 0) {
        setStokBatch(batches.map((b: any) => ({ jumlahKg: String(b.jumlahMasukKg), keterangan: '' })));
        // Default gudang = gudang batch pertama
        const g0 = (batches[0] as any)?.gudang;
        setSelectedGudangId(g0?.id || gudangList.find((g) => String(g.lahanId) === String(lahanIdForEdit))?.id || gudangList[0]?.id || '');
      } else {
        setStokBatch([{ jumlahKg: '', keterangan: '' }]);
        setSelectedGudangId(gudangList.find((g) => String(g.lahanId) === String(lahanIdForEdit))?.id || '');
      }
      setStokBatchError('');
    } catch {
      setStokBatch([{ jumlahKg: '', keterangan: '' }]);
      setStokBatchError('');
    }
    setImagePreview(row.fotoUrl || null);
    setSelectedImage(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  // Simpan (create ATAU update tergantung editingId) — lineage hulu
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalPanenKg = beratKeKg(formData.tonase);
    const totalStokKg = stokBatch.reduce((acc, b) => acc + (Number(b.jumlahKg) || 0), 0);

    // Validasi: jika user mengisi batch, total harus sesuai hasil panen
    const adaIsi = stokBatch.some((b) => (Number(b.jumlahKg) || 0) > 0);
    if (adaIsi && Math.abs(totalStokKg - totalPanenKg) > 0.001) {
      setStokBatchError(`Total batch (${totalStokKg} kg) harus sama dengan hasil panen (${totalPanenKg} kg).`);
      return;
    }
    setStokBatchError('');

    const payload = {
      namaLahan: formData.lokasiLahan,
      lahanId: formData.lahanId || null,
      plantingId: formData.plantingId || null,
      varietas: formData.varietas,
      tanggalPanen: formData.tanggalPanen,
      jumlahHasilKg: totalPanenKg,
      kualitasGrade: 'Grade A (Premium)' as const,
      petaniPenanggungJawab: formData.petaniPenanggungJawab,
      status: 'Selesai' as const,
      catatan: formData.catatan,
      fotoUrl: imagePreview || '',
      // Opsi B: pecahan batch stok gudang (kosong → backend otomatis 1 batch penuh)
      stokBatch: stokBatch
        .filter((b) => (Number(b.jumlahKg) || 0) > 0)
        .map((b) => ({ jumlahKg: Number(b.jumlahKg), keterangan: b.keterangan.trim() })),
      gudangId: selectedGudangId || null,
      panenKe: Number(formData.panenKe) || 1,
    };

    if (editingId) {
      await harvestApi.update(editingId, payload);
    } else {
      // Kode panen dibuat otomatis backend (format: <nama lahan>-<tanggal panen>-<urutan>)
      await harvestApi.create(payload);
    }
    setIsModalOpen(false);
    setEditingId(null);
    handleRemoveImage();
    fetchHarvest();
  };

  // Hapus data (dengan konfirmasi)
  const handleDelete = async () => {
    if (!deleteTarget) return;
    await harvestApi.delete(deleteTarget.id);
    setDeleteTarget(null);
    fetchHarvest();
  };

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    setPage(targetPage);
  };

  // Format tanggal dari ISO ke format Indonesia
  const formatTanggal = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  // Format konsisten hari, tanggal bulan tahun (contoh: Jumat, 24 April 2026)
  const formatHariTanggal = (iso: string) => {
    if (!iso) return '-';
    const s = String(iso).slice(0, 10);
    const parts = s.split('-');
    let d: Date;
    if (parts.length === 3) d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    else d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };
  const formatTonase = (kg: number) => formatBerat(kg);

  // Hitung jumlah filter aktif
  const countActiveFilters = () => {
    let n = 0;
    if (filterLahan) n++;
    if (filterVarietas) n++;
    if (filterTanggalAwal || filterTanggalAkhir) n++;
    if (filterStatus) n++;
    return n;
  };

  // Terapkan filter (tutup panel + hitung badge)
  const applyFilters = () => {
    setActiveFilterCount(countActiveFilters());
    setFilterOpen(false);
  };

  // Reset semua filter
  const resetFilters = () => {
    setFilterLahan('');
    setFilterVarietas('');
    setFilterTanggalAwal('');
    setFilterTanggalAkhir('');
    setFilterStatus('');
    setActiveFilterCount(0);
    setFilterOpen(false);
  };

  // ── Export: Unduh semua data (semua halaman) sebagai CSV / Excel ────────────
  const fetchAllForExport = async () => {
    const res = await harvestApi.getAll({
      page: 1,
      limit: 1000,
      search: searchTerm || undefined,
      lahan: filterLahan || undefined,
      varietas: filterVarietas || undefined,
      tanggalAwal: filterTanggalAwal || undefined,
      tanggalAkhir: filterTanggalAkhir || undefined,
      status: filterStatus || undefined,
    });
    return res.data || [];
  };

  const exportRows = (rows: HarvestRecord[]) =>
    rows.map((r) => ({
      'Kode Panen': r.kodePanen || '-',
      'Lokasi Lahan': r.namaLahan || '-',
      'Varietas': r.varietas || '-',
      'Tanggal Panen': r.tanggalPanen ? new Date(r.tanggalPanen).toLocaleDateString('id-ID') : '-',
      'Berat Hasil (Ton)': (r.jumlahHasilKg / 1000).toFixed(2),
      'Jumlah (Kg)': r.jumlahHasilKg ?? 0,
      'Kualitas Grade': r.kualitasGrade || '-',
      'Penanggung Jawab': r.petaniPenanggungJawab || '-',
      'Status': r.status || '-',
      'Catatan': r.catatan || '',
    }));

  const exportCSV = async () => {
    try {
      const rows = await fetchAllForExport();
      if (rows.length === 0) {
        setToast({ msg: 'Tidak ada data panen yang bisa diekspor.', type: 'error' });
        return;
      }
      const data = exportRows(rows);
      const headers = Object.keys(data[0]);
      const escapeCsv = (v: string | number) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [headers.join(','), ...data.map((row) => headers.map((h) => escapeCsv(row[h])).join(','))].join('\n');
      // BOM UTF-8 agar Excel membaca karakter dengan benar
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-panen-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ msg: 'Gagal mengekspor data CSV.', type: 'error' });
    }
  };

  const exportExcel = async () => {
    try {
      const rows = await fetchAllForExport();
      if (rows.length === 0) {
        setToast({ msg: 'Tidak ada data panen yang bisa diekspor.', type: 'error' });
        return;
      }
      const data = exportRows(rows);
      const headers = Object.keys(data[0]);

      // Buat tabel HTML → XLS (dibaca Excel tanpa dependensi eksternal)
      const esc = (v: string | number) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const thead = `<tr>${headers.map((h) => `<th style="background:#2C4219;color:#fff;font-weight:bold;">${esc(h)}</th>`).join('')}</tr>`;
      const tbody = data
        .map((row) => `<tr>${headers.map((h) => `<td>${esc(row[h])}</td>`).join('')}</tr>`)
        .join('');
      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>Data Panen</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
        <body><table border="1">${thead}${tbody}</table></body></html>`;
      const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-panen-${new Date().toISOString().slice(0, 10)}.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ msg: 'Gagal mengekspor data Excel.', type: 'error' });
    }
  };

  // ── Kalender Panen: agregasi data dari API (harvestList) ─────────────────────
  // Map tanggal → daftar panen
  const harvestByDate = React.useMemo(() => {
    const map = new Map<string, HarvestRecord[]>();
    harvestList.forEach((h) => {
      if (!h.tanggalPanen) return;
      const key = h.tanggalPanen.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    });
    return map;
  }, [harvestList]);

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Jumlah panen di bulan cursor (untuk ringkasan)
  const monthStats = React.useMemo(() => {
    const y = calendarCursor.getFullYear();
    const m = calendarCursor.getMonth();
    let totalKg = 0;
    let count = 0;
    const perDay = new Map<string, { kg: number; count: number }>();
    harvestList.forEach((h) => {
      if (!h.tanggalPanen) return;
      const d = new Date(h.tanggalPanen);
      if (d.getUTCFullYear() === y && d.getUTCMonth() === m) {
        totalKg += h.jumlahHasilKg || 0;
        count++;
        const key = h.tanggalPanen.slice(0, 10);
        const cur = perDay.get(key) || { kg: 0, count: 0 };
        cur.kg += h.jumlahHasilKg || 0;
        cur.count++;
        perDay.set(key, cur);
      }
    });
    return { totalKg, count, perDay };
  }, [harvestList, calendarCursor]);

  // Navigasi bulan
  const changeCalMonth = (delta: number) => {
    setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const goToday = () => {
    const today = new Date();
    setCalendarCursor(today);
    // Pilih tanggal hari ini agar detail panen langsung tampil
    setSelectedCalDate(formatCalDate(today));
  };

  // Grid hari dalam bulan
  const calendarDays = React.useMemo(() => {
    const y = calendarCursor.getFullYear();
    const m = calendarCursor.getMonth();
    const first = new Date(y, m, 1);
    const startOffset = first.getDay(); // 0=Min
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
    return cells;
  }, [calendarCursor]);

  // Data panen pada tanggal terpilih
  const selectedCalDateData = React.useMemo(() => {
    if (!selectedCalDate) return [];
    return harvestList.filter((h) => h.tanggalPanen && h.tanggalPanen.slice(0, 10) === selectedCalDate);
  }, [selectedCalDate, harvestList]);

  const openCalendar = () => {
    setCalendarOpen(true);
    setCalendarCursor(new Date());
    setSelectedCalDate(null);
  };

  // Estimasi panen berikutnya: panen terdekat dari hari ini
  const nextHarvest = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = harvestList
      .filter((h) => h.tanggalPanen && new Date(h.tanggalPanen) >= today)
      .sort((a, b) => new Date(a.tanggalPanen).getTime() - new Date(b.tanggalPanen).getTime());
    return upcoming[0] || null;
  }, [harvestList]);

  const formatCalDate = (d: Date) => {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return key;
  };

  const formatCalDisplay = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    // Gunakan UTC date parts agar tidak bergeser +1 hari (zona WIB vs UTC DB).
    const day = d.getUTCDate();
    const month = d.getUTCMonth();
    const year = d.getUTCFullYear();
    return `${day} ${monthNames[month]} ${year}`;
  };

  // ── Stat Cards (dari data API) ──────────────────────────────────────────────
  const statsTotalKg = harvestList.reduce((acc, h) => acc + (h.jumlahHasilKg || 0), 0);
  const currentMonthStats = React.useMemo(() => {
    const now = new Date();
    let kg = 0;
    let count = 0;
    harvestList.forEach((h) => {
      if (!h.tanggalPanen) return;
      const d = new Date(h.tanggalPanen);
      if (d.getUTCFullYear() === now.getFullYear() && d.getUTCMonth() === now.getMonth()) {
        kg += h.jumlahHasilKg || 0;
        count++;
      }
    });
    return { kg, count };
  }, [harvestList]);
  const timLapanganCount = new Set(harvestList.map((h) => h.petaniPenanggungJawab).filter(Boolean)).size;

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
          onClick={openCreateModal}
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
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {loading ? 'Memuat...' : `${formatTonase(statsTotalKg)}`}
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            {total} catatan panen tersimpan
          </p>
        </div>

        {/* Card 2: Panen Bulan Ini */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#8C9E5B]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">PANEN BULAN INI</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {loading ? 'Memuat...' : formatTonase(currentMonthStats.kg)}
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            {currentMonthStats.count} kegiatan panen bulan ini
          </p>
        </div>

        {/* Card 3: Status Jadwal Panen */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">STATUS JADWAL PANEN</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {loading ? 'Memuat...' : nextHarvest ? formatCalDisplay(nextHarvest.tanggalPanen) : 'Belum Ada Jadwal'}
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">
            {nextHarvest ? `${nextHarvest.namaLahan} • ${formatTonase(nextHarvest.jumlahHasilKg)}` : `${timLapanganCount} penanggung jawab aktif`}
          </p>
        </div>
      </div>

      {/* Row 2: Main Grid Layout (2 Columns - Left Table, Right Side Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Data Table Card ("Data Hasil Panen") */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#c4c8bb]/30 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="p-3.5 sm:p-4 border-b border-[#c4c8bb]/20 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#2C4219]">Data Hasil Panen</h2>
              <p className="text-[11px] text-[#6B7280] font-medium">Laporan tonase terkini per lokasi</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={() => {
                    setFilterOpen((v) => !v);
                    setExportOpen(false);
                  }}
                  className={`min-h-9 px-3 py-2 rounded-lg border transition-colors cursor-pointer relative flex items-center gap-2 text-xs font-bold ${
                    activeFilterCount > 0
                      ? 'bg-[#2C4219] text-white border-[#2C4219]'
                      : 'bg-[#F7F7F5] border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#efe0d2]'
                  }`}
                  title="Filter Data Panen"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#DEB938] text-[#172C05] text-[9px] font-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Filter Panel */}
                {filterOpen && (
                  <div className="absolute right-0 top-9 z-30 w-[300px] sm:w-[340px] bg-white rounded-xl shadow-xl border border-[#c4c8bb]/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-[#172C05]">Filter Data Panen</h4>
                      <button
                        onClick={resetFilters}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        Reset Semua
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                        Lokasi Lahan
                      </label>
                      <select
                        value={filterLahan}
                        onChange={(e) => setFilterLahan(e.target.value)}
                        className={filterInputCls}
                      >
                        <option value="">Semua Lahan</option>
                        {Array.from(new Set(harvestList.map((h) => h.namaLahan).concat(landList.map((l) => l.namaLahan))))
                          .filter(Boolean)
                          .map((nama) => (
                            <option key={nama} value={nama}>
                              {nama}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                        Varietas
                      </label>
                      <select
                        value={filterVarietas}
                        onChange={(e) => setFilterVarietas(e.target.value)}
                        className={filterInputCls}
                      >
                        <option value="">Semua Varietas</option>
                        {Array.from(
                          new Set(
                            harvestList
                              .map((h) => h.varietas)
                              .concat(varietyList.map((v) => v.name))
                              .filter(Boolean)
                          )
                        ).map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                          Dari Tanggal
                        </label>
                        <input
                          type="date"
                          value={filterTanggalAwal}
                          onChange={(e) => setFilterTanggalAwal(e.target.value)}
                          className={filterInputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                          Sampai Tanggal
                        </label>
                        <input
                          type="date"
                          value={filterTanggalAkhir}
                          onChange={(e) => setFilterTanggalAkhir(e.target.value)}
                          className={filterInputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className={filterInputCls}
                      >
                        <option value="">Semua Status</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Proses">Proses</option>
                        <option value="Dijadwalkan">Dijadwalkan</option>
                      </select>
                    </div>
                    <button
                      onClick={applyFilters}
                      className="w-full py-2 rounded-lg bg-[#2C4219] text-white text-xs font-bold hover:bg-[#172C05] transition-colors cursor-pointer"
                    >
                      Terapkan Filter
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setExportOpen((v) => !v);
                    setFilterOpen(false);
                  }}
                  className="min-h-9 px-3 py-2 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#efe0d2] transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
                  title="Download Laporan Data Hasil Panen"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Laporan</span>
                </button>
                {exportOpen && (
                  <div className="absolute right-0 top-9 z-30 w-48 bg-white rounded-xl shadow-xl border border-[#c4c8bb]/30 p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        setExportOpen(false);
                        exportCSV();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-bold text-[#2C4219] hover:bg-[#F7F7F5] transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-green-700" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        setExportOpen(false);
                        exportExcel();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-bold text-[#2C4219] hover:bg-[#F7F7F5] transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                      Export Excel (.xls)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table — header & aksi selaras */}
          <div className="overflow-x-auto custom-scrollbar px-1">
            <table className="w-full text-left text-xs min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-y border-[#c4c8bb]/20">
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle">KODE PANEN</th>
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle">TANGGAL PANEN</th>
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle">LOKASI LAHAN</th>
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle">VARIETAS</th>
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle text-center">BERAT HASIL</th>
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle text-center">STATUS GUDANG</th>
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle text-center w-[92px]">DETAIL</th>
                  <th className="py-2.5 px-3 whitespace-nowrap align-middle text-center w-[160px]">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c8bb]/15 font-medium text-[#221A12]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                      <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                      Memuat data panen...
                    </td>
                  </tr>
                ) : harvestList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#6B7280]">
                      Tidak ada data panen yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  harvestList.map((row) => {
                    return (
                    <tr key={row.id} className="hover:bg-[#F7F7F5] transition-colors">
                      <td className="py-2.5 px-3 align-middle font-bold text-[#2C4219] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {row.kodePanen}
                          {(row as any).panenKe && Number((row as any).panenKe) > 1 && (
                            <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-extrabold leading-none ${Number((row as any).panenKe) === 3 ? 'bg-amber-100 text-amber-700' : 'bg-[#C3E28D] text-[#2C4219]'}`}>
                              Panen {Number((row as any).panenKe)}/3
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-middle text-[#44483e] whitespace-nowrap text-xs">
                        {formatTanggal(row.tanggalPanen)}
                      </td>
                      <td className="py-2.5 px-3 align-middle max-w-[180px]" title={row.namaLahan}>
                        <div className="font-semibold text-[#172C05] whitespace-nowrap truncate">{row.namaLahan}</div>
                      </td>
                      <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#D1E6A5] text-[#2C4219] leading-none">
                          {row.varietas}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-middle text-center font-bold text-[#2C4219] whitespace-nowrap">
                        {formatBerat(row.jumlahHasilKg)}
                      </td>
                      {/* Status Gudang: sudah masuk / belum / sebagian */}
                      <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
                        {(() => {
                          const total = row.jumlahHasilKg || 0;
                          const masuk = row.sudahMasukKg || 0;
                          const sisa = row.sisaBelumMasukKg != null ? row.sisaBelumMasukKg : Math.max(0, total - masuk);
                          if (total > 0 && sisa <= 0) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2C4219] text-[#C3E28D] leading-none">
                                <CheckCircle2 className="w-3 h-3" /> Sudah Masuk
                              </span>
                            );
                          }
                          if (masuk > 0) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 leading-none">
                                <AlertTriangle className="w-3 h-3" /> Sebagian ({formatBerat(masuk)})
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7F7F5] text-[#6B7280] border border-[#c4c8bb]/40 leading-none">
                              <X className="w-3 h-3" /> Belum Masuk
                            </span>
                          );
                        })()}
                      </td>
                      {/* Kolom DETAIL — hanya tombol Detail */}
                      <td className="py-2.5 px-2 align-middle text-center whitespace-nowrap">
                        <ActionButtons
                          onDetail={() => openDetail(row)}
                          detailTitle="Lihat Detail Panen"
                          show={{ detail: true, edit: false, delete: false }}
                        />
                      </td>
                      {/* Kolom AKSI — Edit & Hapus */}
                      <td className="py-2.5 px-2 align-middle text-center whitespace-nowrap">
                        <ActionButtons
                          onEdit={() => openEditModal(row)}
                          onDelete={() => setDeleteTarget(row)}
                          editTitle="Edit Data Panen"
                          deleteTitle="Hapus Data Panen"
                          show={{ detail: false, edit: true, delete: true }}
                        />
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 sm:p-4 border-t border-[#c4c8bb]/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280]">
            <span className="font-medium">
              Menampilkan {harvestList.length === 0 ? 0 : (page - 1) * limit + 1}-
              {Math.min(page * limit, total)} dari {total} data
            </span>

            <div className="flex items-center gap-1 font-bold">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="p-1 rounded-md border border-[#c4c8bb]/30 text-[#44483e] hover:bg-[#F7F7F5] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => goToPage(num)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                    num === page
                      ? 'bg-[#2C4219] text-white'
                      : 'hover:bg-[#F7F7F5] text-[#44483e]'
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="p-1 rounded-md border border-[#c4c8bb]/30 text-[#44483e] hover:bg-[#F7F7F5] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Kalender Panen Inline */}
        <div className="lg:col-span-4 space-y-5">
          {/* Kalender Panen */}
          <div className="bg-white p-4 rounded-xl border border-[#c4c8bb]/30 shadow-xs space-y-3">
            {/* Header Navigasi Bulan */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => changeCalMonth(-1)}
                className="p-1.5 rounded-lg border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <h3 className="text-sm font-extrabold text-[#172C05]">
                  {monthNames[calendarCursor.getMonth()]} {calendarCursor.getFullYear()}
                </h3>
                <p className="text-[10px] font-bold text-[#6B7280]">
                  {monthStats.count} panen • {formatTonase(monthStats.totalKg)}
                </p>
              </div>
              <button
                onClick={() => changeCalMonth(1)}
                className="p-1.5 rounded-lg border border-[#c4c8bb]/30 text-[#2C4219] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Grid Hari */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {dayNames.map((d) => (
                <div key={d} className="py-1 text-[10px] font-black text-[#6B7280] uppercase tracking-wider">
                  {d}
                </div>
              ))}
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const key = formatCalDate(day);
                const dayData = harvestByDate.get(key);
                const isToday = key === formatCalDate(new Date());
                const isSelected = key === selectedCalDate;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCalDate(isSelected ? null : key)}
                    className={`relative h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2C4219] text-white shadow-md scale-105'
                        : dayData
                        ? 'bg-[#C3E28D]/50 text-[#172C05] hover:bg-[#C3E28D]'
                        : 'hover:bg-[#F7F7F5] text-[#44483e]'
                    } ${isToday ? 'ring-2 ring-[#DEB938]' : ''}`}
                    title={dayData ? `${dayData.length} panen` : ''}
                  >
                    {day.getDate()}
                    {dayData && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2C4219]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tombol Hari Ini + tanggal terpilih */}
            <div className="flex items-center justify-between">
              <button
                onClick={goToday}
                className="px-3 py-1.5 rounded-lg bg-[#F7F7F5] border border-[#c4c8bb]/30 text-[#2C4219] text-xs font-bold hover:bg-[#efe0d2] transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              {selectedCalDate && (
                <span className="text-xs font-bold text-[#6B7280]">{formatCalDisplay(selectedCalDate)}</span>
              )}
            </div>

            {/* Detail Tanggal Terpilih */}
            {selectedCalDate && (
              <div className="border-t border-[#c4c8bb]/20 pt-3 space-y-2">
                <h4 className="text-xs font-black text-[#172C05] uppercase tracking-wider">
                  Detail Panen — {formatCalDisplay(selectedCalDate)}
                </h4>
                {selectedCalDateData.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {selectedCalDateData.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#2C4219] text-[#C3E28D] flex items-center justify-center shrink-0">
                            <Sprout className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#221A12] truncate">{h.namaLahan}</p>
                            <p className="text-[10px] text-[#6B7280] font-medium truncate">
                              {h.varietas} • {h.kodePanen || ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-[#2C4219]">{formatTonase(h.jumlahHasilKg)}</p>
                          <p className="text-[10px] text-[#6B7280]">{h.petaniPenanggungJawab || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6B7280] py-1">Tidak ada panen pada tanggal ini.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Input/Edit Data Panen */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? 'Edit Data Hasil Panen' : 'Input Data Hasil Panen Baru'}
        subtitle={editingId ? 'Perbarui data panen' : 'Lengkapi data panen sorgum'}
        maxWidth="4xl"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingId(null);
                handleRemoveImage();
              }}
              className="px-6 py-3 text-sm"
            >
              Batal
            </Button>
            <Button type="submit" form="panen-form" variant="primary" className="px-8 py-3 text-sm">
              {editingId ? 'Simpan Perubahan' : 'Simpan Data Panen'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-6" id="panen-form">
          {/* ── Bagian 1: Lokasi & Asal Panen ─────────────────────────── */}
          <div className="p-5 sm:p-6 bg-[#FFF8F4] border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">1</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Lokasi & Asal Panen</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Lokasi Lahan & Blok <span className="text-red-500">*</span>
                </label>
                <Combobox
                  options={lahanSedangDitanam.map((l) => ({
                    value: l.id,
                    label: `${l.namaLahan} (${l.kodeLahan})`,
                    searchText: `${l.namaLahan} ${l.kodeLahan} ${l.varietasSorgum || ''} ${l.lokasiDesa || ''}`,
                  }))}
                  value={formData.lahanId}
                  onChange={(v) => handleLandChange(v)}
                  placeholder={landLoading ? 'Memuat data lahan...' : lahanSedangDitanam.length === 0 ? (landList.length === 0 ? '-- Belum ada lahan --' : '-- Belum ada lahan yang sedang ditanam --') : '-- Pilih Lahan --'}
                  searchPlaceholder="Cari nama lahan / kode blok / varietas..."
                  emptyText={landLoading ? 'Memuat data lahan...' : 'Tidak ada lahan yang cocok.'}
                  required
                />
                {!landLoading && landList.length === 0 && (
                  <p className="text-xs font-semibold text-amber-600 mt-1.5">
                    Belum ada data lahan. Silakan tambah di menu Kelola Lahan terlebih dahulu.
                  </p>
                )}
                {!landLoading && landList.length > 0 && lahanSedangDitanam.length === 0 && (
                  <p className="text-xs font-semibold text-amber-600 mt-1.5">
                    Belum ada lahan yang sedang ditanam. Silakan buka <b>Kelola Lahan → Detail → Catat Tanam</b>.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Kode Panen
                </label>
                <input
                  type="text"
                  value={formKodePanen}
                  readOnly
                  disabled
                  placeholder={formKodePanen ? '' : 'Otomatis — contoh: LUS-10092026-01'}
                  title="Kode panen dibuat otomatis dari nama lahan & tanggal panen saat disimpan"
                  className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold text-[#6B7280] cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Penanaman Asal {formData.lahanId ? '' : '(pilih lahan dulu)'}
                </label>
                <Combobox
                  options={plantingsForForm
                    .filter((p) => ['Ditanam', 'Tumbuh', 'Siap Panen'].includes(p.statusTanam))
                    .map((p) => ({
                      value: p.id,
                      label: `${p.kodeTanam} • ${formatTanggal(p.tanggalTanam)} • ${p.varietas}`,
                      searchText: `${p.kodeTanam} ${p.varietas} ${p.statusTanam} ${formatTanggal(p.tanggalTanam)}`,
                    }))}
                  value={formData.plantingId}
                  onChange={(v) => handlePlantingChange(v)}
                  placeholder={!formData.lahanId ? '-- Pilih lahan terlebih dahulu --' : plantingsForForm.filter((p) => ['Ditanam', 'Tumbuh', 'Siap Panen'].includes(p.statusTanam)).length === 0 ? '-- Tidak ada penanaman aktif --' : '-- Pilih Penanaman --'}
                  searchPlaceholder="Cari kode tanam / varietas..."
                  emptyText="Tidak ada penanaman aktif di lahan ini."
                  disabled={!formData.lahanId}
                />
                {selectedPlanting && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-2.5 bg-[#C3E28D]/15 border border-[#C3E28D]/40 rounded-xl text-xs text-[#2C4219]">
                    <span className="inline-flex items-center gap-1.5 font-extrabold">
                      <Sprout className="w-3.5 h-3.5" /> {selectedPlanting.kodeTanam}
                    </span>
                    <span>Tanam {formatTanggal(selectedPlanting.tanggalTanam)}</span>
                    <span>{selectedPlanting.varietas}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedPlanting.statusTanam === 'Siap Panen' ? 'bg-amber-100 text-amber-800'
                      : selectedPlanting.statusTanam === 'Dipanen' ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-white text-[#6B7280] border border-[#c4c8bb]/30'}`}>
                      {selectedPlanting.statusTanam}
                    </span>
                  </div>
                )}
              </div>

              <div>
                {/* Panen ke-? — ratoon sorgum: 1x tanam maksimal 3x panen */}
                <div className="p-3.5 bg-[#F1F8E9] border border-[#C3E28D]/60 rounded-2xl h-full">
                  <label className="block text-sm font-bold text-[#2C4219] mb-2">
                    Panen Ke-? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.panenKe}
                    onChange={(e) => setFormData({ ...formData, panenKe: Number(e.target.value) })}
                    disabled={!formData.plantingId}
                    className="w-full p-2.5 bg-white border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold disabled:opacity-60"
                  >
                    <option value={1}>Panen 1 (awal)</option>
                    <option value={2}>Panen 2 (ratoon)</option>
                    <option value={3}>Panen 3 (ratoon terakhir)</option>
                  </select>
                  <p className="text-[11px] text-[#2C4219] mt-1.5 leading-relaxed">
                    {formData.plantingId
                      ? usedPanenKe.includes(Number(formData.panenKe))
                        ? 'Nomor ini sudah terpakai — pilih nomor lain.'
                        : '🌾 Satu kali tanam bisa dipanen hingga 3 kali.'
                      : '🌾 Satu kali tanam bisa dipanen hingga 3 kali.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Tanggal Panen <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tanggalPanen}
                  onChange={(e) => setFormData({ ...formData, tanggalPanen: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2C4219]/20"
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Bagian 2: Hasil Panen ─────────────────────────────────── */}
          <div className="p-5 sm:p-6 bg-white border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">2</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Hasil Panen</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Berat Hasil Panen — Gabah ({beratSuffix}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tonase}
                  onChange={(e) => setFormData({ ...formData, tonase: e.target.value })}
                  placeholder={`Contoh: 35.5 ${beratSuffix}`}
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Penanggung Jawab Panen <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.petaniPenanggungJawab}
                  onChange={(e) => setFormData({ ...formData, petaniPenanggungJawab: e.target.value })}
                  placeholder="Contoh: Ibu Hastuti"
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Bagian 3: Catatan & Foto ───────────────────────────────── */}
          <div className="p-5 sm:p-6 bg-white border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center text-base font-black shrink-0">3</span>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Catatan & Foto</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Catatan Lapangan
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Catatan kondisi cuaca, timbangan, atau gudang"
                  className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#2C4219] mb-1.5">
                  Foto Dokumentasi Panen <span className="text-[11px] font-medium text-[#9CA3AF]">(JPG / PNG)</span>
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
                      onClick={() => document.getElementById('panen-foto-input')?.click()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2C4219] text-white text-[11px] font-bold hover:bg-[#213213] transition-colors shrink-0 cursor-pointer"
                      title="Ganti foto panen"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="panen-foto-input"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#c4c8bb]/50 hover:border-[#2C4219] bg-[#fff1e5]/60 hover:bg-[#FFF8F4] rounded-2xl cursor-pointer transition-all text-center h-24"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-[#2C4219] block">
                          Klik untuk unggah foto
                        </span>
                        <span className="text-[11px] text-[#74796d] font-semibold">
                          .JPG, .JPEG, .PNG (Maks. 5 MB)
                        </span>
                      </div>
                    </div>
                  </label>
                )}

                {/* Input file selalu ada di DOM agar tombol Edit bisa memicunya */}
                <input
                  id="panen-foto-input"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {imageError && (
                  <p className="text-xs font-bold text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {imageError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Bagian 4: Masuk Gudang (opsional) ──────────────────────── */}
          <div className="p-5 sm:p-6 bg-[#FFF8F4] border border-[#c4c8bb]/30 rounded-3xl space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#C3E28D] text-[#2C4219] flex items-center justify-center text-base font-black shrink-0">4</span>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#172C05] leading-tight">Masuk Gudang</h3>
                  <p className="text-xs sm:text-sm text-[#6B7280]">Opsional</p>
                </div>
              </div>
            </div>

            {/* Pilih gudang tujuan (default: gudang sesuai lahan) */}
            <div>
              <label className="block text-sm font-bold text-[#2C4219] mb-1.5">Pilih Gudang Tujuan</label>
              <select
                value={selectedGudangId}
                onChange={(e) => setSelectedGudangId(e.target.value)}
                disabled={gudangList.length === 0}
                className="w-full sm:max-w-md p-3 bg-white border border-[#c4c8bb]/40 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                {gudangList.length === 0 ? (
                  <option value="">-- Belum ada gudang --</option>
                ) : (
                  <>
                    <option value="">-- Pilih Gudang --</option>
                    {gudangList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.namaGudang} ({g.kodeGudang})
                        {g.lahan?.namaLahan ? ` — ${g.lahan.namaLahan}` : ' — Gudang umum'}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {stokBatch.map((b, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={b.jumlahKg}
                  onChange={(e) => {
                    const next = [...stokBatch];
                    next[i] = { ...next[i], jumlahKg: e.target.value };
                    setStokBatch(next);
                    setStokBatchError('');
                  }}
                  placeholder={`Jumlah (kg)`}
                  className="w-full sm:w-52 p-3 bg-white border border-[#c4c8bb]/40 rounded-xl text-sm font-semibold"
                />
                <input
                  type="text"
                  value={b.keterangan}
                  onChange={(e) => {
                    const next = [...stokBatch];
                    next[i] = { ...next[i], keterangan: e.target.value };
                    setStokBatch(next);
                  }}
                  placeholder="Catatan (misal: untuk dijual / simpan)"
                  className="flex-1 p-3 bg-white border border-[#c4c8bb]/40 rounded-xl text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (stokBatch.length > 1) {
                      setStokBatch(stokBatch.filter((_, idx) => idx !== i));
                    }
                  }}
                  className="inline-flex items-center justify-center px-3.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors shrink-0 cursor-pointer"
                  title="Hapus baris"
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStokBatch([...stokBatch, { jumlahKg: '', keterangan: '' }])}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C3E28D] text-[#2C4219] text-xs font-bold hover:bg-[#b3d47d] transition-colors cursor-pointer"
              >
                + Tambah Baris
              </button>
              <span className={`text-xs font-bold ${stokBatchError ? 'text-red-600' : 'text-[#6B7280]'}`}>
                {stokBatchError || `Total: ${stokBatch.reduce((a, x) => a + (Number(x.jumlahKg) || 0), 0)} kg`}
              </span>
            </div>
          </div>

        </form>
      </Modal>

      {/* Detail Record Modal */}
      {selectedDetail && (
        <Modal
          isOpen={!!selectedDetail}
          onClose={() => setSelectedDetail(null)}
          title="Detail Data Panen"
          subtitle="Ringkasan hasil panen & asal tanam"
          maxWidth="7xl"
        >
          <div className="space-y-5">
            {/* Header ringkas: foto + kode panen + berat + lahan, dalam satu blok lebar */}
            <div className="flex items-center gap-4 p-4 sm:p-5 bg-gradient-to-r from-[#2C4219] to-[#4a6b2a] rounded-2xl text-white">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-white/30 bg-white/10 shrink-0">
                {selectedDetail.fotoUrl ? (
                  <img
                    src={selectedDetail.fotoUrl}
                    alt={`Foto Hasil Panen ${selectedDetail.namaLahan}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[10px] font-bold text-[#C3E28D] uppercase tracking-wider">Kode Panen</p>
                  {(selectedDetail as any).panenKe && Number((selectedDetail as any).panenKe) > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#C3E28D] text-[#172C05] text-[10px] font-black">
                      Panen {Number((selectedDetail as any).panenKe)}/3
                    </span>
                  )}
                </div>
                <p className="text-lg sm:text-2xl font-black text-white leading-tight truncate">{selectedDetail.kodePanen}</p>
                <p className="text-[11px] sm:text-xs text-white/70 font-medium truncate mt-1">
                  <MapPin className="w-3 h-3 inline -mt-0.5 mr-1" />
                  {selectedDetail.namaLahan} • {selectedDetail.varietas}
                  {selectedDetail.panenKe && Number(selectedDetail.panenKe) > 1 && (
                    <span className="ml-2 font-bold text-[#C3E28D]">• Panen ke-{selectedDetail.panenKe}</span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0 bg-white/10 rounded-xl px-4 py-2.5 border border-white/15">
                <p className="text-[10px] font-bold text-[#C3E28D] uppercase tracking-wider">Berat Hasil</p>
                <p className="text-xl sm:text-2xl font-black text-white leading-tight">{formatBerat(selectedDetail.jumlahHasilKg)}</p>
              </div>
            </div>

            {/* Layout landscape: kiri = data utama, kanan = gudang */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Kolom kiri (8/12): info utama + asal tanam + catatan */}
              <div className="lg:col-span-8 space-y-5 min-w-0">
                {/* Grid data utama — 2/3/4 kolom responsif */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-[#c4c8bb]/20 flex items-start gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-[#fff1e5] text-[#2C4219] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Lokasi Lahan</p>
                      <p className="text-sm font-bold text-[#221A12] leading-snug break-words">{selectedDetail.namaLahan}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#c4c8bb]/20 flex items-start gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-[#fff1e5] text-[#2C4219] flex items-center justify-center shrink-0">
                      <Sprout className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Varietas</p>
                      <p className="text-sm font-bold text-[#221A12] leading-snug break-words">{selectedDetail.varietas}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#c4c8bb]/20 flex items-start gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-[#fff1e5] text-[#2C4219] flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Periode Tanam → Panen</p>
                      <p className="text-sm font-bold text-[#221A12] leading-snug">
                        {(() => {
                          const p = (selectedDetail as any).planting;
                          const periode = (selectedDetail as any).periodeHari;
                          if (periode != null) return `${periode} hari`;
                          if (p?.tanggalTanam) {
                            const parseISO2 = (s: string) => {
                              const parts = String(s).slice(0,10).split('-');
                              if (parts.length===3) return new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
                              return new Date(s);
                            };
                            const t1 = parseISO2(p.tanggalTanam);
                            const t2 = parseISO2(selectedDetail.tanggalPanen);
                            if (!isNaN(t1.getTime()) && !isNaN(t2.getTime())) {
                              return `${Math.round((t2.getTime() - t1.getTime()) / (1000*60*60*24))} hari`;
                            }
                          }
                          return '-';
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#c4c8bb]/20 flex items-start gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-[#fff1e5] text-[#2C4219] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Penanggung Jawab</p>
                      <p className="text-sm font-bold text-[#221A12] leading-snug">{selectedDetail.petaniPenanggungJawab || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Informasi Asal Tanam — ringkas, mudah dibaca, tanpa pengulangan */}
                {(selectedDetail as any).planting ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#2C4219] uppercase tracking-wider flex items-center gap-1.5">
                      <Sprout className="w-3.5 h-3.5" /> Informasi Asal Tanam
                    </h4>
                    {(() => {
                      const p: any = (selectedDetail as any).planting;
                      const l: any = (selectedDetail as any).lahan;
                      // jumlahLubang tersimpan = lubang × 3 (biji) → ubah balik ke lubang asli
                      const lubang = Math.round((Number(p.jumlahLubang) || 0) / 3);
                      const totalBiji = lubang * 3;
                      const periode = (selectedDetail as any).periodeHari;
                      const parseISO = (s: string) => {
                        const parts = String(s).slice(0,10).split('-');
                        if (parts.length===3) return new Date(Number(parts[0]), Number(parts[1])-1, Number(parts[2]));
                        return new Date(s);
                      };
                      const est = p.estimasiPanen ? parseISO(p.estimasiPanen) : null;
                      const panen = parseISO(selectedDetail.tanggalPanen);
                      let estimasiInfo = '';
                      if (est && !isNaN(est.getTime()) && !isNaN(panen.getTime())) {
                        const d = Math.round((panen.getTime() - est.getTime()) / (1000*60*60*24));
                        estimasiInfo = d===0 ? 'Tepat estimasi' : d>0 ? `+${d} hari dari estimasi` : `${Math.abs(d)} hari lebih cepat`;
                      }
                      return (
                        <>
                          {/* Kode tanam + asal lahan + petugas */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2C4219] text-[#C3E28D] text-[11px] font-bold">
                              <Hash className="w-3 h-3" /> {p.kodeTanam}
                            </span>
                            <span className="text-xs text-[#6B7280] font-medium">
                              {l?.namaLahan || selectedDetail.namaLahan}{l?.kodeLahan ? ` • ${l.kodeLahan}` : ''}
                              {l?.lokasiDesa ? ` • ${l.lokasiDesa}` : ''}
                            </span>
                          </div>

                          {/* Tanggal tanam → panen + periode */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                              <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">Tanggal Tanam</span>
                              <span className="text-sm font-extrabold text-[#221A12] mt-0.5 block">{formatHariTanggal(p.tanggalTanam)}</span>
                              <span className="text-[11px] text-[#6B7280] mt-0.5 block">Petugas: {p.petugas || '-'}</span>
                            </div>
                            <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                              <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">Tanggal Panen</span>
                              <span className="text-sm font-extrabold text-[#221A12] mt-0.5 block">{formatHariTanggal(selectedDetail.tanggalPanen)}</span>
                              <span className="text-[11px] text-[#6B7280] mt-0.5 block">
                                {estimasiInfo || (periode == null ? 'Belum ada data periode' : '')}
                              </span>
                            </div>
                          </div>

                          {/* Perhitungan benih — lubang & biji saja */}
                          <div className="p-3.5 bg-[#2C4219] rounded-xl text-white space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#C3E28D] flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5" /> Perhitungan Benih</p>
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div className="p-2.5 bg-white/10 rounded-lg border border-white/10">
                                <p className="text-[10px] font-bold text-white/70 uppercase">Jumlah Lubang</p>
                                <p className="text-sm font-black text-white mt-1">{lubang.toLocaleString('id-ID')}</p>
                              </div>
                              <div className="p-2.5 bg-[#C3E28D] rounded-lg">
                                <p className="text-[10px] font-bold text-[#172C05] uppercase">Jumlah Biji (×3)</p>
                                <p className="text-sm font-black text-[#172C05] mt-1">{totalBiji.toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                            <p className="text-[11px] text-white/70 leading-relaxed text-center">Jumlah biji = jumlah lubang × 3 (1 lubang berisi 3 biji sorgum).</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (selectedDetail as any).lahanId ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">Panen sudah terhubung ke lahan <b>{(selectedDetail as any).lahan?.namaLahan || selectedDetail.namaLahan}</b> namun belum memilih penanaman. Edit panen untuk pilih penanaman agar tanggal tanam, periode & perhitungan lubang tampil.</div>
                ) : (
                  <div className="p-3 bg-[#F7F7F5] border border-[#c4c8bb]/20 rounded-xl text-xs text-[#6B7280]">Belum ada informasi asal tanam. Edit panen untuk pilih lahan & penanaman.</div>
                )}

                {/* Catatan */}
                {selectedDetail.catatan && (
                  <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#c4c8bb]/20">
                    <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                      Catatan Lapangan
                    </span>
                    <p className="text-sm text-[#44483e] mt-1 leading-relaxed">
                      {selectedDetail.catatan}
                    </p>
                  </div>
                )}
              </div>

              {/* Kolom kanan (4/12): Penyimpanan di Gudang */}
              <div className="lg:col-span-4 space-y-2.5 min-w-0">
                <div className="p-4 bg-[#FFF8F4] rounded-2xl border border-[#c4c8bb]/20">
                  <h4 className="text-xs font-bold text-[#2C4219] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <WarehouseIcon className="w-3.5 h-3.5" /> Penyimpanan di Gudang
                  </h4>
                  {(() => {
                    const batches = ((selectedDetail as any).stockBatches || []).filter(
                      (b: any) => !b.jenis || b.jenis === 'GABAH'
                    );
                    if (batches.length === 0) {
                      return (
                        <div className="p-3 bg-white rounded-xl border border-[#c4c8bb]/20 text-xs text-[#6B7280]">
                          Belum ada stok gabah dari panen ini yang tersimpan di gudang.
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        {batches.map((b: any) => {
                          const g = b.gudang;
                          return (
                            <div key={b.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#c4c8bb]/20">
                              <span className="w-9 h-9 rounded-lg bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[#172C05] truncate">{b.kodeBatchStok}</p>
                                <p className="text-[11px] text-[#6B7280] truncate">
                                  {g ? `${g.namaGudang}${g.kodeGudang ? ` (${g.kodeGudang})` : ''}` : 'Gudang tidak diketahui'}
                                  {b.tanggalMasuk ? ` • Masuk ${formatHariTanggal(b.tanggalMasuk)}` : ''}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[9px] font-bold text-[#9CA3AF] uppercase">Masuk</p>
                                <p className="text-sm font-black text-[#221A12]">{formatBerat(b.jumlahMasukKg)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Hapus Data Panen"
          maxWidth="sm"
        >
          <div className="space-y-4 text-sm text-[#221A12]">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-700">
                  Apakah Anda yakin ingin menghapus data panen ini?
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-relaxed">
                  <strong>{deleteTarget.kodePanen}</strong> — {deleteTarget.namaLahan} ({deleteTarget.varietas}).
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#c4c8bb]/20">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Batal
              </Button>
              <Button type="button" variant="danger" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Toast Floating Notifikasi */}
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
