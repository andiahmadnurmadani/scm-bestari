import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap';

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[11px] gap-1',
    md: 'px-3.5 py-1.5 text-xs gap-1.5',
    lg: 'px-5 py-2 text-sm gap-2',
  };

  const variantClasses = {
    primary:
      'bg-[#2C4219] text-white hover:bg-[#213213] shadow-sm hover:shadow-md border border-transparent',
    secondary:
      'bg-[#C3E28D] text-[#172C05] hover:bg-[#b5d87b] border border-transparent font-bold',
    outline:
      'bg-white text-[#2C4219] border border-[#C4C8BB] hover:bg-[#F7F7F5] hover:border-[#2C4219]',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-transparent',
    ghost:
      'bg-transparent text-[#44483E] hover:bg-[#efe0d2]/40 hover:text-[#172C05]',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
