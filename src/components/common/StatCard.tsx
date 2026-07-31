import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  subtitle?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  borderColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  change,
  trend,
  icon,
  borderColor = 'border-[#2C4219]',
}) => {
  return (
    <div
      className={`bg-white p-3 sm:p-4 rounded-xl shadow-2xs border-l-4 ${borderColor} transition-all duration-200 hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold text-[#44483e] uppercase tracking-wider mb-0.5">
          {title}
        </p>
        {icon && <div className="p-1.5 rounded-lg bg-[#F7F7F5] text-[#2C4219]">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-1 mt-1">
        <h3 className="text-lg sm:text-xl font-bold text-[#221A12]">{value}</h3>
        {unit && <span className="text-[10px] font-semibold text-[#44483e]">{unit}</span>}
      </div>

      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#c4c8bb]/15 text-[10px]">
        {subtitle && <span className="text-[#6B7280] font-medium">{subtitle}</span>}
        {change && (
          <span
            className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              trend === 'up'
                ? 'bg-[#cfecb3] text-[#0d2000]'
                : trend === 'down'
                ? 'bg-[#ffdad6] text-[#93000a]'
                : 'bg-[#efe0d2] text-[#44483e]'
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
