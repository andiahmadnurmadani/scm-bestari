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
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { harvestApi } from '../../api/endpoints/harvestApi';
import { varietyApi, Variety } from '../../api/endpoints/varietyApi';
import { landApi } from '../../api/endpoints/landApi';
import { HarvestRecord, LandPlot } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';
import { ActionButtons } from '../../components/common/ActionButtons';
import { timestampCode } from '../../utils/kodeGenerator';

const filterInputCls =
  'w-full px-2.5 py-1.5 bg-[#F7F7F5] border border-[#c4c8bb]/40 rounded-lg text-xs font-medium text-[#221A12] focus:outline-none focus:ring-2 focus:ring-[#2C4219]/30 focus:border-[#2C4219] focus:bg-white transition-all';

export const PanenPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [harvestList, setHarvestList] = useState<HarvestRecord[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // ID yang sedang diedit (null = tambah baru)
  const [deleteTarget, setDeleteTarget] = useState<HarvestRecord | null>(null); // Data yang akan dihapus
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    lokasiLahan: '',
    varietas: '',
    tanggalPanen: new Date().toISOString().split('T')[0],
    tonase: '',
    petaniPenanggungJawab: '',
    catatan: '',
  });
  const [formKodePanen, setFormKodePanen] = useState('');

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
        // Sinkronkan default formData.varietas jika belum terisi
        setFormData((prev) => {
          if (res.data && res.data.length > 0 && !prev.varietas) {
            return { ...prev, varietas: res.data[0].name };
          }
          return prev;
        });
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
        // Sinkronkan default formData.lokasiLahan jika belum terisi
        setFormData((prev) => {
          if (res.data && res.data.length > 0 && !prev.lokasiLahan) {
            const first = res.data[0];
            return {
              ...prev,
              lokasiLahan: first.namaLahan,
              varietas: prev.varietas || first.varietasSorgum,
              petaniPenanggungJawab: prev.petaniPenanggungJawab || first.pemilikKelompokTani,
            };
          }
          return prev;
        });
      })
      .catch(() => setLandList([]))
      .finally(() => setLandLoading(false));
  }, []);

  // Saat pilih lahan dari dropdown, isi otomatis varietas & penanggung jawab
  const handleLandChange = (namaLahan: string) => {
    const selected = landList.find((l) => l.namaLahan === namaLahan);
    setFormData((prev) => ({
      ...prev,
      lokasiLahan: namaLahan,
      varietas: selected?.varietasSorgum || prev.varietas,
      petaniPenanggungJawab: selected?.pemilikKelompokTani || prev.petaniPenanggungJawab,
    }));
  };

  // Buka modal untuk tambah data baru
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      lokasiLahan: landList[0]?.namaLahan || '',
      varietas: landList[0]?.varietasSorgum || '',
      tanggalPanen: new Date().toISOString().split('T')[0],
      tonase: '',
      petaniPenanggungJawab: landList[0]?.pemilikKelompokTani || '',
      catatan: '',
    });
    // Kode panen otomatis, hanya untuk tampilan (read-only)
    setFormKodePanen(timestampCode('PN-'));
    setImagePreview(null);
    setSelectedImage(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  // Buka modal untuk edit data yang ada
  const openEditModal = (row: HarvestRecord) => {
    setEditingId(row.id);
    setFormKodePanen(row.kodePanen);
    setFormData({
      lokasiLahan: row.namaLahan,
      varietas: row.varietas, // Dropdown dinamis berisi nama lengkap (Sorgum Bioguma 1, dst)
      tanggalPanen: row.tanggalPanen ? row.tanggalPanen.split('T')[0] : new Date().toISOString().split('T')[0],
      tonase: (row.jumlahHasilKg / 1000).toFixed(1),
      petaniPenanggungJawab: row.petaniPenanggungJawab,
      catatan: row.catatan || '',
    });
    setImagePreview(row.fotoUrl || null);
    setSelectedImage(null);
    setImageError(null);
    setIsModalOpen(true);
  };

  // Simpan (create ATAU update tergantung editingId)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      namaLahan: formData.lokasiLahan,
      varietas: formData.varietas,
      tanggalPanen: formData.tanggalPanen,
      jumlahHasilKg: Number(formData.tonase) * 1000,
      kualitasGrade: 'Grade A (Premium)' as const,
      petaniPenanggungJawab: formData.petaniPenanggungJawab,
      status: 'Selesai' as const,
      catatan: formData.catatan,
      fotoUrl: imagePreview || '',
    };

    if (editingId) {
      await harvestApi.update(editingId, payload);
    } else {
      await harvestApi.create({
        ...payload,
        kodePanen: formKodePanen || timestampCode('PN-'),
      });
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

  // Format tonase (kg → ton dengan 2 desimal)
  const formatTonase = (kg: number) => {
    return `${(kg / 1000).toFixed(2)} Ton`;
  };

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
      'Tonase (Ton)': (r.jumlahHasilKg / 1000).toFixed(2),
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
        alert('Tidak ada data panen yang bisa diekspor.');
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
      alert('Gagal mengekspor data CSV.');
    }
  };

  const exportExcel = async () => {
    try {
      const rows = await fetchAllForExport();
      if (rows.length === 0) {
        alert('Tidak ada data panen yang bisa diekspor.');
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
      alert('Gagal mengekspor data Excel.');
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
                  <th className="py-2 px-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c8bb]/15 font-medium text-[#221A12]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                      <span className="inline-block w-4 h-4 border-2 border-[#2C4219] border-t-transparent rounded-full animate-spin align-middle mr-2" />
                      Memuat data panen...
                    </td>
                  </tr>
                ) : harvestList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                      Tidak ada data panen yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  harvestList.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F7F7F5] transition-colors">
                      <td className="py-2 px-3 text-[#44483e] whitespace-nowrap">{formatTanggal(row.tanggalPanen)}</td>
                      <td className="py-2 px-3 font-semibold text-[#172C05]">{row.namaLahan}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D1E6A5] text-[#2C4219]">
                          {row.varietas}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold text-[#2C4219]">
                        {(row.jumlahHasilKg / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Ton
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <ActionButtons
                          onDetail={() => setSelectedDetail(row)}
                          onEdit={() => openEditModal(row)}
                          onDelete={() => setDeleteTarget(row)}
                          detailTitle="Lihat Detail Panen"
                          editTitle="Edit Data Panen"
                          deleteTitle="Hapus Data Panen"
                        />
                      </td>
                    </tr>
                  ))
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
        subtitle={
          editingId
            ? 'Perbarui tonase, lahan, dan varietas sorgum terpanen'
            : 'Catat hasil tonase lahan dan varietas sorgum terpanen'
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Lokasi Lahan & Blok
            </label>
            <select
              value={formData.lokasiLahan}
              onChange={(e) => handleLandChange(e.target.value)}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
              required
            >
              <option value="" disabled>
                {landLoading ? 'Memuat data lahan...' : 'Pilih lokasi lahan'}
              </option>
              {landList.map((l) => (
                <option key={l.id} value={l.namaLahan}>
                  {l.namaLahan} ({l.kodeLahan})
                </option>
              ))}
            </select>
            {!landLoading && landList.length === 0 && (
              <p className="text-[11px] font-semibold text-amber-600 mt-1">
                Belum ada data lahan. Silakan tambah di menu Kelola Lahan terlebih dahulu.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Kode Panen
            </label>
            <input
              type="text"
              value={formKodePanen}
              readOnly
              disabled
              title="Kode panen dibuat otomatis oleh sistem"
              className="w-full p-3 bg-[#F7F7F5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold text-[#6B7280] cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Tanggal Panen
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Varietas Sorgum
              </label>
              <select
                value={formData.varietas}
                onChange={(e) => setFormData({ ...formData, varietas: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
              >
                <option value="" disabled>
                  {varietyLoading ? 'Memuat varietas...' : 'Pilih varietas sorgum'}
                </option>
                {varietyList.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name}
                  </option>
                ))}
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
                placeholder="Contoh: 35.5"
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
              placeholder="Contoh: Ibu Hastuti"
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
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {imageError}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c4c8bb]/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingId(null);
                handleRemoveImage();
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              {editingId ? 'Simpan Perubahan' : 'Simpan Data Panen'}
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
          subtitle={`${selectedDetail.kodePanen} • ${formatTanggal(selectedDetail.tanggalPanen)}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Foto seluruh lebar */}
            <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-[#c4c8bb]/30 bg-[#F7F7F5]">
              {selectedDetail.fotoUrl ? (
                <img
                  src={selectedDetail.fotoUrl}
                  alt={`Foto Hasil Panen ${selectedDetail.namaLahan}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                  <ImageIcon className="w-10 h-10" />
                  <span className="text-xs font-semibold">Belum ada foto dokumentasi</span>
                </div>
              )}
            </div>

            {/* Grid data — mirip form input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Kode Panen
                </span>
                <span className="text-sm font-extrabold text-[#2C4219] mt-0.5 block">
                  {selectedDetail.kodePanen}
                </span>
              </div>

              <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Tanggal Panen
                </span>
                <span className="text-sm font-extrabold text-[#221A12] mt-0.5 block">
                  {formatTanggal(selectedDetail.tanggalPanen)}
                </span>
              </div>

              <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20 sm:col-span-2">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Lokasi Lahan & Blok
                </span>
                <span className="text-sm font-extrabold text-[#221A12] mt-0.5 block">
                  {selectedDetail.namaLahan}
                </span>
              </div>

              <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Varietas Sorgum
                </span>
                <span className="inline-block px-3 py-0.5 rounded-full bg-[#C3E28D] text-[#2C4219] text-xs font-bold mt-1">
                  {selectedDetail.varietas}
                </span>
              </div>

              <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Tonase Hasil
                </span>
                <span className="text-sm font-black text-[#221A12] mt-0.5 block">
                  {(selectedDetail.jumlahHasilKg / 1000).toFixed(2)}
                  <span className="text-xs font-bold text-[#44483e]"> Ton</span>
                </span>
              </div>

              <div className="p-3 bg-[#FFF8F4] rounded-xl border border-[#c4c8bb]/20">
                <span className="text-[10px] font-bold text-[#74796d] uppercase tracking-wider block">
                  Penanggung Jawab
                </span>
                <span className="text-sm font-extrabold text-[#221A12] mt-0.5 block">
                  {selectedDetail.petaniPenanggungJawab || '-'}
                </span>
              </div>
            </div>

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
    </div>
  );
};
