import React, { useEffect, useState, useRef } from 'react';
import {
  Award,
  Plus,
  Eye,
  Edit3,
  Trash2,
  FileText,
  ShieldCheck,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  FileCheck,
  X,
  Download,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { certificatesApi } from '../../api/endpoints/certificatesApi';
import { Certificate } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useAdminSearch } from '../../components/layout/AdminLayout';

export const SertifikatPage: React.FC = () => {
  const { searchTerm } = useAdminSearch();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activeCert, setActiveCert] = useState<Certificate | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Certificate>>({
    kodeDokumen: '',
    namaSertifikat: '',
    penerbitSertifikat: 'BPJPH Kementerian Agama RI',
    nomorSertifikat: '',
    tanggalTerbit: new Date().toLocaleDateString('id-ID'),
    tanggalKadaluarsa: '2028-12-31',
    status: 'AKTIF',
    jenisDokumen: 'Sertifikat Halal',
    fileUrl: '',
    fileName: '',
    fileType: 'pdf',
    keterangan: '',
  });

  const fetchCertificates = async () => {
    setLoading(true);
    const data = await certificatesApi.getAll();
    setCertificates(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleOpenDetail = (cert: Certificate) => {
    setActiveCert(cert);
    setDetailModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      kodeDokumen: `CERT-DOC-00${certificates.length + 1}`,
      namaSertifikat: '',
      penerbitSertifikat: 'BPJPH Kementerian Agama RI',
      nomorSertifikat: 'ID3111000' + Math.floor(100000 + Math.random() * 900000),
      tanggalTerbit: new Date().toLocaleDateString('id-ID'),
      tanggalKadaluarsa: '2028-12-31',
      status: 'AKTIF',
      jenisDokumen: 'Sertifikat Halal',
      fileUrl: '',
      fileName: '',
      fileType: 'pdf',
      keterangan: 'Dokumen legalitas kualifikasi pangan sorgum.',
    });
    setFormModalOpen(true);
  };

  const handleOpenEdit = (cert: Certificate) => {
    setEditId(cert.id);
    setFormData({ ...cert });
    setFormModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await certificatesApi.update(editId, formData);
    } else {
      await certificatesApi.upload(formData);
    }
    setFormModalOpen(false);
    fetchCertificates();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen sertifikat ini?')) {
      await certificatesApi.delete(id);
      fetchCertificates();
    }
  };

  // Process File Selection (PDF, JPG, PNG)
  const processSelectedFile = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(file.name);

    if (!isPdf && !isImage) {
      alert('Format file tidak didukung. Mohon unggah dokumen berformat PDF, JPG, atau PNG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        fileUrl: result,
        fileName: file.name,
        fileType: isPdf ? 'pdf' : 'image',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      fileUrl: '',
      fileName: '',
      fileType: 'pdf',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredList = certificates.filter((item) => {
    return (
      item.kodeDokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.namaSertifikat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nomorSertifikat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.penerbitSertifikat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.fileName && item.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#2C4219] tracking-tight">Kelola Sertifikat & Legalitas Pangan</h1>
        </div>

        <div className="w-full sm:w-auto">
          <Button onClick={handleOpenAdd} icon={<Plus className="w-3.5 h-3.5" />} variant="primary" className="w-full sm:w-auto text-xs py-1.5 px-3 justify-center">
            Unggah Dokumen Sertifikat
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#1C3615]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">SERTIFIKAT AKTIF</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {certificates.filter((c) => c.status === 'AKTIF').length} Dokumen Legal
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Halal BPJPH, P-IRT & SNI Pangan</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-[#DEB938]">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">DALAM PROSES AUDIT</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {certificates.filter((c) => c.status === 'PROSES').length} Dokumen Audit
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Audit Surveillance Organik & HACCP</p>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl shadow-2xs border border-[#c4c8bb]/30 border-l-[4px] border-l-red-600">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">KADALUARSA / RE-LAB</p>
          <h3 className="text-base sm:text-lg font-bold text-[#221A12] mt-0.5 sm:mt-1">
            {certificates.filter((c) => c.status === 'KADALUARSA').length} Dokumen
          </h3>
          <p className="text-xs font-semibold text-[#6B7280] mt-0.5 sm:mt-1">Perlu perpanjangan & re-sampling lab</p>
        </div>
      </div>

      {/* Legal Documents Table */}
      <div className="bg-white rounded-xl shadow-2xs border border-[#c4c8bb]/30 overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-[#c4c8bb]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-semibold text-[#2C4219] text-sm">
            Arsip Sertifikasi & Legalitas Produk Sorgum
          </h3>
          <span className="text-xs text-[#6B7280] font-medium">
            Total {filteredList.length} berkas tersimpan
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[820px]">
            <thead>
              <tr className="bg-[#F7F7F5] text-[#6B7280] font-bold uppercase text-[11px] tracking-wider border-b border-[#c4c8bb]/20">
                <th className="py-2 px-3 pl-4">KODE DOKUMEN</th>
                <th className="py-2 px-3">NAMA SERTIFIKAT</th>
                <th className="py-2 px-3">PENERBIT / LEMBAGA</th>
                <th className="py-2 px-3">BERKAS / FILE</th>
                <th className="py-2 px-3">EXP.</th>
                <th className="py-2 px-3">STATUS</th>
                <th className="py-2 px-3 pr-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bb]/15 text-[#221A12] font-medium">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-[#F7F7F5] transition-colors">
                  <td className="py-2.5 px-3 pl-4 font-bold text-[#2C4219]">{item.kodeDokumen}</td>
                  <td className="py-2.5 px-3 font-semibold">{item.namaSertifikat}</td>
                  <td className="py-2.5 px-3 text-[#44483e] font-medium">{item.penerbitSertifikat}</td>
                  <td className="py-2.5 px-3">
                    {item.fileUrl || item.fileName ? (
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#fff8f4] hover:bg-[#efe0d2] border border-[#c4c8bb]/40 transition-colors text-[11px] font-bold cursor-pointer"
                        title="Klik untuk melihat berkas"
                      >
                        {item.fileType === 'pdf' || (item.fileName && item.fileName.toLowerCase().endsWith('.pdf')) ? (
                          <span className="flex items-center gap-1 text-red-700">
                            <FileText className="w-3.5 h-3.5 text-red-600" /> PDF
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-700">
                            <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Gambar
                          </span>
                        )}
                        <span className="text-[#44483e] font-normal truncate max-w-[100px]">
                          {item.fileName || 'Sertifikat.pdf'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-[#9CA3AF] italic text-[11px]">Belum ada file</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[#6B7280] font-semibold">{item.tanggalKadaluarsa}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'AKTIF'
                          ? 'bg-[#C3E28D]/50 text-[#172C05] border border-[#b4cf98]'
                          : item.status === 'PROSES'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 pr-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="p-1.5 text-[#2C4219] hover:bg-[#efe0d2] rounded-lg transition-colors cursor-pointer"
                        title="Preview Sertifikat & Download"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Sertifikat"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Sertifikat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Document Preview Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail & Pratinjau Dokumen Legalitas"
        subtitle={activeCert ? `${activeCert.kodeDokumen} - ${activeCert.namaSertifikat}` : ''}
        maxWidth="lg"
      >
        {activeCert && (
          <div className="space-y-5 text-sm text-[#221A12]">
            {/* Visual Document Viewer (Image / PDF / Fallback) */}
            <div className="bg-[#fff8f4] p-4 sm:p-5 rounded-2xl border-2 border-[#2C4219]/20 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#c4c8bb]/30">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#2C4219] text-[#C3E28D] flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#2C4219] text-sm sm:text-base leading-snug">
                      {activeCert.namaSertifikat}
                    </h4>
                    <p className="text-xs text-[#6B7280]">Penerbit: {activeCert.penerbitSertifikat}</p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shrink-0 ${
                    activeCert.status === 'AKTIF'
                      ? 'bg-[#cfecb3] text-[#172C05]'
                      : activeCert.status === 'PROSES'
                      ? 'bg-[#ffe083] text-[#564500]'
                      : 'bg-[#ffdad6] text-[#93000a]'
                  }`}
                >
                  {activeCert.status}
                </span>
              </div>

              {/* Document Preview Renderer */}
              {activeCert.fileUrl ? (
                <div className="space-y-3">
                  {activeCert.fileType === 'image' ||
                  activeCert.fileUrl.startsWith('data:image') ||
                  /\.(jpg|jpeg|png)$/i.test(activeCert.fileName || activeCert.fileUrl) ? (
                    <div className="relative group rounded-xl overflow-hidden border border-[#c4c8bb]/40 bg-white max-h-[400px] flex items-center justify-center p-2">
                      <img
                        src={activeCert.fileUrl}
                        alt={activeCert.namaSertifikat}
                        className="max-h-[360px] w-auto object-contain rounded-lg shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full h-[320px] rounded-xl overflow-hidden border border-[#c4c8bb]/40 bg-white">
                        <iframe
                          src={activeCert.fileUrl}
                          title={activeCert.namaSertifikat}
                          className="w-full h-full border-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Document Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-xl border border-[#c4c8bb]/30">
                    <div className="flex items-center gap-2 truncate">
                      {activeCert.fileType === 'pdf' ? (
                        <FileText className="w-4 h-4 text-red-600 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-[#2C4219] truncate">
                        {activeCert.fileName || 'Dokumen_Sertifikat.pdf'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={activeCert.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#F7F7F5] hover:bg-[#efe0d2] text-[#2C4219] font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Tab Baru</span>
                      </a>
                      <a
                        href={activeCert.fileUrl}
                        download={activeCert.fileName || 'Sertifikat_Legalitas'}
                        className="px-3 py-1.5 rounded-lg bg-[#2C4219] hover:bg-[#12240E] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5 text-[#C3E28D]" />
                        <span>Unduh Dokumen</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback Graphic Badge Box if no file uploaded */
                <div className="p-6 bg-white border border-dashed border-[#2C4219]/30 rounded-xl text-center space-y-2">
                  <FileText className="w-10 h-10 text-[#2C4219]/50 mx-auto" />
                  <p className="text-xs font-bold text-[#44483e]">
                    Belum ada berkas terlampir untuk dokumen ini.
                  </p>
                  <p className="text-[11px] text-[#6B7280]">
                    Anda dapat mengunggah berkas PDF / JPG / PNG melalui menu edit dokumen.
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#fff1e5] rounded-xl text-xs">
              <div>
                <p className="text-[#74796d] font-bold uppercase">Nomor Registrasi / Sertifikat</p>
                <p className="font-mono font-bold text-[#2C4219] text-sm mt-0.5">{activeCert.nomorSertifikat}</p>
              </div>
              <div>
                <p className="text-[#74796d] font-bold uppercase">Lembaga Penerbit</p>
                <p className="font-extrabold text-[#221A12] text-sm mt-0.5">{activeCert.penerbitSertifikat}</p>
              </div>
              <div>
                <p className="text-[#74796d] font-bold uppercase">Tanggal Terbit</p>
                <p className="font-semibold text-xs mt-0.5">{activeCert.tanggalTerbit}</p>
              </div>
              <div>
                <p className="text-[#74796d] font-bold uppercase">Tanggal Kadaluarsa</p>
                <p className="font-semibold text-xs text-red-700 mt-0.5">{activeCert.tanggalKadaluarsa}</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-[#74796d] font-bold uppercase">Keterangan & Lingkup Sertifikasi Pangan</p>
              <p className="text-xs text-[#44483e] leading-relaxed p-3 bg-white rounded-xl border border-[#c4c8bb]/30">
                {activeCert.keterangan || 'Tidak ada catatan tambahan.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Add / Edit Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editId ? 'Edit Dokumen Sertifikat' : 'Unggah Sertifikat Legalitas Baru'}
        subtitle="Kelola arsip sertifikat Halal, P-IRT, dan Uji Laboratorium (PDF, JPG, PNG)"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Kode Dokumen
              </label>
              <input
                type="text"
                value={formData.kodeDokumen}
                onChange={(e) => setFormData({ ...formData, kodeDokumen: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Jenis Dokumen
              </label>
              <select
                value={formData.jenisDokumen}
                onChange={(e) => setFormData({ ...formData, jenisDokumen: e.target.value as any })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-semibold"
              >
                <option value="Sertifikat Halal">Sertifikat Halal</option>
                <option value="Izin P-IRT">Izin P-IRT</option>
                <option value="Uji Lab Nutrisi">Uji Lab Nutrisi</option>
                <option value="Sertifikat Organik">Sertifikat Organik</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Nama Sertifikat / Legalitas
            </label>
            <input
              type="text"
              value={formData.namaSertifikat}
              onChange={(e) => setFormData({ ...formData, namaSertifikat: e.target.value })}
              placeholder="Contoh: Sertifikat Halal Olahan Sorgum BPJPH"
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Lembaga Penerbit
              </label>
              <input
                type="text"
                value={formData.penerbitSertifikat}
                onChange={(e) => setFormData({ ...formData, penerbitSertifikat: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Nomor Sertifikat / Registrasi
              </label>
              <input
                type="text"
                value={formData.nomorSertifikat}
                onChange={(e) => setFormData({ ...formData, nomorSertifikat: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-mono"
                required
              />
            </div>
          </div>

          {/* Dedicated File Upload Section (PDF, JPG, PNG) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2C4219] uppercase">
              Unggah Berkas Sertifikat (PDF, JPG, PNG)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg"
              className="hidden"
            />

            {formData.fileUrl || formData.fileName ? (
              <div className="p-3.5 bg-white border-2 border-[#2C4219]/30 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 rounded-lg bg-[#fff1e5] border border-[#c4c8bb]/40 flex items-center justify-center shrink-0">
                    {formData.fileType === 'pdf' ? (
                      <FileText className="w-5 h-5 text-red-600" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#2C4219] truncate">
                      {formData.fileName || 'Berkas_Sertifikat'}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      Format: {formData.fileType === 'pdf' ? 'Dokumen PDF' : 'Gambar (JPG/PNG)'} • Tersimpan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-[#F7F7F5] hover:bg-[#efe0d2] text-[#2C4219] text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Berkas"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#2C4219] bg-[#C3E28D]/20 scale-[1.01]'
                    : 'border-[#c4c8bb]/50 bg-[#fff8f4] hover:bg-[#efe0d2]/40 hover:border-[#2C4219]/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#2C4219]/10 text-[#2C4219] flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-[#2C4219]">
                  Klik untuk unggah atau seret file dokumen ke sini
                </p>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  Mendukung format berkas <span className="font-bold text-[#221A12]">PDF, JPG, atau PNG</span> (Maksimal 10 MB)
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Tanggal Terbit
              </label>
              <input
                type="text"
                value={formData.tanggalTerbit}
                onChange={(e) => setFormData({ ...formData, tanggalTerbit: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Tanggal Exp.
              </label>
              <input
                type="text"
                value={formData.tanggalKadaluarsa}
                onChange={(e) => setFormData({ ...formData, tanggalKadaluarsa: e.target.value })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm font-bold"
              >
                <option value="AKTIF">AKTIF</option>
                <option value="PROSES">PROSES</option>
                <option value="KADALUARSA">KADALUARSA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C4219] uppercase mb-1">
              Keterangan Lingkup Pangan
            </label>
            <textarea
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full p-3 bg-[#fff1e5] border border-[#c4c8bb]/30 rounded-xl text-sm h-20"
              placeholder="Detail tambahan kualifikasi atau cakupan produk..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c4c8bb]/20">
            <Button type="button" variant="outline" onClick={() => setFormModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              {editId ? 'Perbarui Dokumen' : 'Simpan Dokumen'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

