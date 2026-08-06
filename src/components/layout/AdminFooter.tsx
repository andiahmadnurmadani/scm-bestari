import React, { useState } from 'react';
import { Modal } from '../common/Modal';

export const AdminFooter: React.FC = () => {
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalContent, setInfoModalContent] = useState('');

  const openInfo = (title: string, content: string) => {
    setInfoModalTitle(title);
    setInfoModalContent(content);
    setLogModalOpen(true);
  };

  return (
    <footer className="w-full py-2.5 px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#44483e] mt-auto border-t border-[#c4c8bb]/20 bg-[#FFF8F4]">
      <p className="font-medium text-center sm:text-left mb-2 sm:mb-0">
        © 2026 Sorgum SCM. Seluruh hak cipta dilindungi.
      </p>

      <div className="flex items-center gap-4 font-semibold">
        <button
          onClick={() =>
            openInfo(
              'Kebijakan Privasi Sorgum SCM',
              'Sorgum SCM menjamin perlindungan data operasional kelompok tani, catatan hasil panen, dan transaksi keuangan. Data disimpan secara terenkripsi dan hanya dapat diakses oleh manajer operasional yang terotorisasi.'
            )
          }
          className="hover:text-[#2C4219] transition-colors cursor-pointer"
        >
          Kebijakan Privasi
        </button>
        <span className="text-[#c4c8bb]">|</span>
        <button
          onClick={() =>
            openInfo(
              'Syarat & Ketentuan Layanan',
              'Setiap pencatatan data panen, bahan baku, dan pengeluaran keuangan harus didasarkan pada nota fisik yang sah. Pengguna bertanggung jawab penuh atas keakuratan data yang dimasukkan ke dalam sistem Sorgum SCM.'
            )
          }
          className="hover:text-[#2C4219] transition-colors cursor-pointer"
        >
          Syarat & Ketentuan
        </button>
        <span className="text-[#c4c8bb]">|</span>
        <button
          onClick={() =>
            openInfo(
              'Pusat Bantuan Sorgum SCM',
              'Hubungi Tim Support SCM:\n• WhatsApp: +62 812-3456-7890\n• Email: support@sorgumscm.id\n• Jam Operasional: Senin - Jumat (08.00 - 17.00 WIB)'
            )
          }
          className="hover:text-[#2C4219] transition-colors cursor-pointer"
        >
          Bantuan
        </button>
      </div>

      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title={infoModalTitle}
      >
        <div className="whitespace-pre-line text-sm text-[#44483e] leading-relaxed p-2">
          {infoModalContent}
        </div>
      </Modal>
    </footer>
  );
};
