import React, { useState } from 'react';
import { X, Play, Pause, Volume2, ShieldCheck, HeartHandshake } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#2C4219] rounded-3xl max-w-3xl w-full border border-white/20 shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#C3E28D]" />
            <span className="text-xs font-black uppercase text-[#C3E28D] tracking-wider">
              Dokumentasi Video KWT (1 Menit)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated Video Player */}
        <div className="relative bg-black h-72 sm:h-96 flex items-center justify-center overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80"
            alt="Video Preview Ibu KWT"
            className="w-full h-full object-cover opacity-80"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-6">
            <div className="flex items-center gap-2 text-xs font-bold text-white bg-black/40 px-3 py-1 rounded-full self-start backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-[#C3E28D]" />
              KWT Sukamaju Subang • Dokumentasi Panen 2026
            </div>

            {/* Play/Pause Center Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="self-center w-20 h-20 rounded-full bg-[#C3E28D] text-[#172C05] flex items-center justify-center shadow-2xl transition-all transform hover:scale-105 cursor-pointer border-4 border-white"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 fill-[#172C05]" />
              ) : (
                <Play className="w-8 h-8 fill-[#172C05] ml-1" />
              )}
            </button>

            {/* Player Controls Bar */}
            <div className="space-y-2">
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer">
                <div className="h-full bg-[#C3E28D] w-2/3 rounded-full" />
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-[#efe0d2]">
                <span>{isPlaying ? '0:42 / 1:00' : 'Dihentikan Sementara'}</span>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#C3E28D]" />
                  <span>Suara Jernih</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Subtitle & Description */}
        <div className="p-5 bg-[#172C05] space-y-2 text-xs sm:text-sm">
          <h4 className="font-extrabold text-[#C3E28D]">
            Kisah Sukses: "Dari Lahan Sorgum Subang Menuju Pasar Produk Organik Nasional"
          </h4>
          <p className="text-[#efe0d2] font-medium leading-relaxed">
            Ibu Mawar dan anggota Kelompok Wanita Tani Sukamaju membagikan cerita bagaimana aplikasi Sorgum SCM membantu meningkatkan pendapatan anggota hingga 30% melalui kepastian harga dan kemudahan sertifikasi halal.
          </p>
        </div>
      </div>
    </div>
  );
};
