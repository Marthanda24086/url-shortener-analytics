'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DistributionItem {
  name: string;
  value: number;
}

interface DistributionChartProps {
  title: string;
  description?: string;
  data: DistributionItem[];
  icon: LucideIcon;
  barColor?: string;
}

export function DistributionChart({
  title,
  description,
  data,
  icon: Icon,
  barColor = 'bg-[#FF6B2C]',
}: DistributionChartProps) {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="p-5 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#1D1D1D] text-[#FF6B2C]">
              <Icon className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold tracking-tight text-[#F5F5F5]">
              {title}
            </h4>
          </div>
          <span className="text-xs font-mono text-[#A1A1AA] font-medium">
            {total} total
          </span>
        </div>

        {description && (
          <p className="text-[11px] text-[#A1A1AA] mb-4">{description}</p>
        )}

        <div className="space-y-3 mt-3">
          {data.length === 0 ? (
            <p className="text-xs text-[#A1A1AA] py-4 text-center">No telemetry recorded yet.</p>
          ) : (
            data.slice(0, 5).map((item) => {
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#F5F5F5] truncate max-w-[160px]">
                      {item.name || 'Unknown'}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[#A1A1AA] text-[11px]">{percentage}%</span>
                      <span className="text-[#FF8C42] font-semibold">{item.value}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-[#1D1D1D] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
