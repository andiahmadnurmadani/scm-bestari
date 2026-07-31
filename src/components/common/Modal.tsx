import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#c4c8bb]/30 z-10 overflow-hidden transform transition-all my-auto max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 border-b border-[#c4c8bb]/20 bg-[#fff8f4] shrink-0">
          <div className="pr-2">
            <h3 className="text-sm sm:text-base font-semibold text-[#2C4219] leading-tight">{title}</h3>
            {subtitle && (
              <p className="text-[11px] text-[#44483e] mt-0.5 sm:mt-1 font-medium">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-full text-[#44483e] hover:bg-[#efe0d2] transition-colors cursor-pointer shrink-0"
            aria-label="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto custom-scrollbar flex-1">{children}</div>
      </div>
    </div>
  );
};
