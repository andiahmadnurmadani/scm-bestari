import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
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
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl',
    '3xl': 'max-w-4xl',
    '4xl': 'max-w-5xl',
    '5xl': 'max-w-6xl',
    '6xl': 'max-w-7xl',
    '7xl': 'max-w-[92vw]',
    full: 'max-w-[96vw]',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#c4c8bb]/30 z-10 overflow-hidden my-4 sm:my-6 mx-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 sm:px-7 py-3.5 sm:py-5 border-b border-[#c4c8bb]/20 bg-[#fff8f4] shrink-0">
          <div className="pr-2">
            <h3 className="text-base sm:text-lg font-bold text-[#2C4219] leading-tight">{title}</h3>
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#44483e] mt-1 sm:mt-1.5 font-medium">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-full text-[#44483e] hover:bg-[#efe0d2] transition-colors cursor-pointer shrink-0"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-7 overflow-y-auto custom-scrollbar flex-1 min-h-0">{children}</div>

        {/* Footer (opsional) — selalu menempel di dasar modal, di luar area scroll */}
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-5 sm:px-7 py-4 border-t border-[#c4c8bb]/20 bg-white shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
