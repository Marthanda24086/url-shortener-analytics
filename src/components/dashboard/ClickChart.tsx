'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { MousePointerClick } from 'lucide-react';

interface ClickChartProps {
  data: Array<{ date: string; clicks: number; unique: number }>;
  currentRange: string;
  onRangeChange: (range: string) => void;
  loading?: boolean;
}

export function ClickChart({
  data,
  currentRange,
  onRangeChange,
  loading = false,
}: ClickChartProps) {
  const [activeMetric, setActiveMetric] = useState<'both' | 'clicks' | 'unique'>('both');

  const ranges = [
    { label: '24h', value: '24h' },
    { label: '7d', value: '7d' },
    { label: '30d', value: '30d' },
    { label: '90d', value: '90d' },
    { label: 'All', value: 'all' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-[#151515] text-[#F5F5F5] rounded-xl shadow-2xl border border-[#303030] text-xs font-sans min-w-[140px]">
          <p className="text-[#A1A1AA] font-medium mb-1.5">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[#FF6B2C]">
                <span className="w-2 h-2 rounded-full bg-[#FF6B2C]" />
                Clicks:
              </span>
              <span className="font-mono font-bold">{payload[0]?.value ?? 0}</span>
            </div>
            {payload[1] && (
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-[#FF8C42]">
                  <span className="w-2 h-2 rounded-full bg-[#FF8C42]" />
                  Unique:
                </span>
                <span className="font-mono font-bold">{payload[1]?.value ?? 0}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[#F5F5F5]">
            Click Activity Over Time
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Real-time telemetry showing verified human visitor clicks and unique devices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range Pills */}
          <div className="flex items-center p-1 bg-[#1D1D1D] rounded-xl border border-[#303030]">
            {ranges.map((r) => (
              <button
                key={r.value}
                onClick={() => onRangeChange(r.value)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  currentRange === r.value
                    ? 'bg-[#FF6B2C] text-white shadow-sm'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F5]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-[#A1A1AA] text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin" />
              <span>Loading analytics telemetry...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#A1A1AA] text-sm">
            <MousePointerClick className="w-8 h-8 text-[#303030] mb-2" />
            <p className="font-medium text-[#F5F5F5]">No clicks recorded in this timeframe</p>
            <p className="text-xs text-[#A1A1AA]">Share your short links to begin capturing live analytics.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="orangeClickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B2C" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#FF6B2C" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="amberUniqueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8C42" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF8C42" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#252525" opacity={0.8} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#A1A1AA' }}
                dy={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#A1A1AA' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {(activeMetric === 'both' || activeMetric === 'clicks') && (
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#FF6B2C"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#orangeClickGradient)"
                />
              )}
              {(activeMetric === 'both' || activeMetric === 'unique') && (
                <Area
                  type="monotone"
                  dataKey="unique"
                  stroke="#FF8C42"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#amberUniqueGradient)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-end gap-5 mt-4 pt-4 border-t border-[#303030] text-xs">
        <button
          onClick={() => setActiveMetric('clicks')}
          className={`flex items-center gap-1.5 transition-opacity ${
            activeMetric === 'clicks' || activeMetric === 'both' ? 'opacity-100 font-semibold' : 'opacity-40'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B2C]" />
          <span className="text-[#F5F5F5]">Total Clicks</span>
        </button>
        <button
          onClick={() => setActiveMetric('unique')}
          className={`flex items-center gap-1.5 transition-opacity ${
            activeMetric === 'unique' || activeMetric === 'both' ? 'opacity-100 font-semibold' : 'opacity-40'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF8C42]" />
          <span className="text-[#A1A1AA]">Unique Visitors</span>
        </button>
        {activeMetric !== 'both' && (
          <button
            onClick={() => setActiveMetric('both')}
            className="text-[#FF6B2C] text-[11px] underline"
          >
            Show Both
          </button>
        )}
      </div>
    </div>
  );
}
