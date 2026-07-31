import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'sage' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'success',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  const variantClasses = {
    success: 'bg-[#cfecb3] text-[#172C05] border border-[#b4cf98]',
    warning: 'bg-[#ffe083] text-[#564500] border border-[#e9c341]',
    error: 'bg-[#ffdad6] text-[#93000a] border border-[#f2b8b5]',
    info: 'bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]',
    sage: 'bg-[#C3E28D]/40 text-[#172C05] border border-[#C3E28D]',
    neutral: 'bg-[#efe0d2] text-[#44483e] border border-[#c4c8bb]',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${sizeClasses} ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
};
