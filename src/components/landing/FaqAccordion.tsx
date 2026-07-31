import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const faqs = [
    {
      question: 'Apakah aplikasi Sorgum SCM ini sulit digunakan untuk pemula?',
      answer:
        'Sangat mudah! Aplikasi ini dirancang khusus dengan tombol besar, petunjuk langkah demi langkah, dan bahasa Indonesia yang ramah. Ibu-ibu KWT hanya perlu memasukkan angka tonase panen atau mengunggah foto nota, sisanya sistem yang menghitung otomatis.',
    },
    {
      question: 'Bagaimana cara mendaftarkan Kelompok Wanita Tani (KWT) kami?',
      answer:
        'Sangat cepat! Klik tombol "Daftar Akun KWT Baru", isi nama kelompok, lokasi lahan, dan kontak ketua. Tim pendamping KWT kami akan menghubungi Anda melalui WhatsApp untuk membantu proses aktivasi gratis.',
    },
    {
      question: 'Apakah data keuangan dan transaksi kami aman?',
      answer:
        'Ya, 100% aman dan terlindungi digital! Seluruh data panen, stok kemasan, dan pengeluaran KWT tersimpan rapi dan hanya dapat diakses oleh pengurus berwenang yang diberi password.',
    },
    {
      question: 'Apakah catatan panen & produksi bisa dicetak untuk laporan bulanan?',
      answer:
        'Tentu bisa! Setiap modul (Panen, Sertifikasi, Logistik) menyediakan tombol "Export / Cetak". Anda dapat mengunduh laporan rapi dalam bentuk PDF yang siap dibagikan dalam rapat bulanan KWT.',
    },
  ];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="min-h-[calc(100vh-72px)] flex flex-col justify-center py-6 sm:py-8 bg-[#FFF8F4] border-t border-[#c4c8bb]/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center flex-1">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C3E28D]/40 text-[#172C05] text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#2C4219]" />
            <span>Tanya Jawab Ramah KWT</span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-[#2C4219]">
            Pertanyaan Ringkas Ibu KWT
          </h2>
          <p className="text-[11px] text-[#44483e] font-medium mt-1">
            Jawaban lengkap untuk pertanyaan yang sering ditanyakan pengurus dan anggota kelompok tani.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-[#c4c8bb]/30 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="w-full py-2.5 px-3.5 text-left flex items-center justify-between gap-3 font-semibold text-xs sm:text-sm text-[#172C05] hover:bg-[#FFF8F4] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#2C4219]/10 text-[#2C4219] text-[10px] font-bold flex items-center justify-center shrink-0">
                      0{index + 1}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#2C4219] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-3.5 pb-3 pt-0.5 text-xs text-[#44483e] leading-relaxed border-t border-[#c4c8bb]/15 bg-[#FFF8F4]/50 animate-fadeIn">
                    <p className="p-2.5 bg-white rounded-lg border border-[#c4c8bb]/20 font-normal">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
