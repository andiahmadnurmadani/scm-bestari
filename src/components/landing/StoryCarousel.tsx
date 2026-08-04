import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Quote, Star, CheckCircle2, UserRound } from 'lucide-react';

interface StoryCarouselProps {
  onOpenVideoModal: () => void;
}

export const StoryCarousel: React.FC<StoryCarouselProps> = ({ onOpenVideoModal }) => {
  const stories = [
    {
      id: 1,
      name: 'Ibu Mawar Lestari',
      role: 'Ketua Kelompok Wanita Tani (KWT) Sukamaju - Subang',
      quote:
        'Sorgum SCM memudahkan kami mencatat hasil panen 45 Ton musim ini tanpa perlu buku manual yang mudah hilang. Sertifikat Halal BPJPH kami pun langsung terpantau digital dan teratur!',
      harvestInfo: 'Hasil Panen: 45 Ton Bioguma',
    },
    {
      id: 2,
      name: 'Ibu Siti Aminah',
      role: 'Pengelola Unit Olahan KWT Asri - Indramayu',
      quote:
        'Pemasaran beras dan tepung sorgum kami makin dipercaya pembeli Toko Pangan Organik karena ada kode tracking varietas dari lahan ke kemasan. Pembeli tahu persis bahan baku kami aman.',
      harvestInfo: 'Produksi: 1.200 Pouch Tepung/Bulan',
    },
    {
      id: 3,
      name: 'Ibu Nur Syafiqah',
      role: 'Bendahara KWT Mekar Jaya - Sumedang',
      quote:
        'Catatan logistik pupuk, sewa alat, dan ongkos angkut armada truk jadi sangat rapi. Transparansi keuangan kelompok kami meningkat pesat dan laporan bulanan langsung siap cetak.',
      harvestInfo: 'Luas Lahan: 8.5 Hektar',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? stories.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === stories.length - 1 ? 0 : prev + 1));
  };

  const current = stories[currentIndex];

  return (
    <section id="kisah" className="py-20 bg-[#F7F7F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-3.5 py-1 rounded-full bg-[#C3E28D]/40 text-[#172C05] text-xs font-black uppercase tracking-wider">
            Kisah Nyata Petani KWT
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[#2C4219] mt-3">
            Berdaya Bersama Petani & Ibu KWT
          </h2>
          <p className="text-xs sm:text-sm text-[#44483e] font-medium mt-2">
            Simak pengalaman langsung para ketua dan pengurus Kelompok Wanita Tani dalam mengelola rantai pasok sorgum digital.
          </p>
        </div>

        {/* Carousel Card */}
        <div className="bg-white rounded-3xl border border-[#c4c8bb]/30 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
          {/* Left Column: Photo & Video Modal Trigger */}
          <div className="lg:col-span-5 relative h-72 lg:h-auto min-h-[300px]">
            <div className="w-full h-full bg-gradient-to-br from-[#2C4219] to-[#172C05] flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-[#C3E28D]/20 border-2 border-[#C3E28D]/40 flex items-center justify-center">
                <UserRound className="w-12 h-12 text-[#C3E28D]" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-6">
              <span className="self-start px-3 py-1 rounded-full bg-[#2C4219]/80 backdrop-blur-xs text-[#C3E28D] text-xs font-extrabold flex items-center gap-1.5 border border-white/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {current.harvestInfo}
              </span>

              {/* Video Play Button Overlay */}
              <button
                onClick={onOpenVideoModal}
                className="self-center my-auto w-16 h-16 rounded-full bg-[#2C4219] hover:bg-[#172C05] text-[#C3E28D] flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 cursor-pointer border-2 border-[#C3E28D] group"
                title="Putar Video Cerita (1 Menit)"
              >
                <Play className="w-7 h-7 fill-[#C3E28D] text-[#C3E28D] ml-1 group-hover:scale-105 transition-transform" />
              </button>

              <span className="text-white text-xs font-bold text-center bg-black/40 py-1.5 px-3 rounded-xl backdrop-blur-xs">
                ▶ Klik untuk Memutar Video Cerita (1 Menit)
              </span>
            </div>
          </div>

          {/* Right Column: Quote & Details */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-500" />
                <Star className="w-4 h-4 fill-amber-500" />
                <Star className="w-4 h-4 fill-amber-500" />
                <Star className="w-4 h-4 fill-amber-500" />
                <Star className="w-4 h-4 fill-amber-500" />
                <span className="text-xs font-bold text-[#74796d] ml-2">Cerita Inspiratif KWT</span>
              </div>

              <Quote className="w-10 h-10 text-[#C3E28D]" />

              <blockquote className="text-base sm:text-xl font-bold text-[#221A12] leading-relaxed italic">
                "{current.quote}"
              </blockquote>
            </div>

            <div className="pt-6 border-t border-[#c4c8bb]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-black text-[#2C4219]">{current.name}</h4>
                <p className="text-xs text-[#74796d] font-semibold">{current.role}</p>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 mr-2">
                  {stories.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                        currentIndex === idx
                          ? 'w-7 bg-[#2C4219]'
                          : 'bg-[#c4c8bb] hover:bg-[#74796d]'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handlePrev}
                  className="p-2.5 rounded-xl bg-[#FFF8F4] border border-[#c4c8bb]/40 text-[#2C4219] hover:bg-[#efe0d2] transition-colors cursor-pointer"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2.5 rounded-xl bg-[#2C4219] text-white hover:bg-[#172C05] transition-colors cursor-pointer shadow-xs"
                  title="Berikutnya"
                >
                  <ChevronRight className="w-5 h-5 text-[#C3E28D]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
