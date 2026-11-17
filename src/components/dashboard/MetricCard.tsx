'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: number;
  icon: LucideIcon;
  accentColor?: string;
}

export function MetricCard({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  accentColor = 'text-[#FF6B2C]',
}: MetricCardProps) {
  return (
    <div className="p-5 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm hover:border-[#454545] transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
          {label}
        </span>
        <div className={`p-2 rounded-xl bg-[#1D1D1D] border border-[#303030] ${accentColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F5] font-mono">
          {value}
        </div>

        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend > 0
                ? 'bg-[#FF6B2C]/10 text-[#FF8C42] border border-[#FF6B2C]/30'
                : trend < 0
                ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                : 'bg-[#1D1D1D] text-[#A1A1AA]'
            }`}
          >
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            <span>{trend > 0 ? `+${trend}%` : `${trend}%`}</span>
          </div>
        )}
      </div>

      {subtext && (
        <p className="text-[11px] text-[#A1A1AA] mt-2 font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
}
