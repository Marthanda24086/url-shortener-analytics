'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Pause,
  Play,
  Trash2,
  MousePointerClick,
  Users,
  Smartphone,
  Globe2,
  Clock,
  ShieldCheck,
  Layers,
  Laptop,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ClickChart } from '@/components/dashboard/ClickChart';
import { DistributionChart } from '@/components/dashboard/DistributionChart';
import { QRModal } from '@/components/dashboard/QRModal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface PageProps {
  params: { id: string };
}

export default function LinkDetailPage({ params }: PageProps) {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  const fetchLinkAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/link/${params.id}?range=${range}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        error(json.error || 'Failed to load link analytics');
      } else {
        setData(json);
      }
    } catch {
      error('Network error loading analytics');
    } finally {
      setLoading(false);
    }
  }, [params.id, range, error]);

  useEffect(() => {
    fetchLinkAnalytics();
  }, [fetchLinkAnalytics]);

  const handleCopy = () => {
    if (!data?.link?.shortUrl) return;
    navigator.clipboard.writeText(data.link.shortUrl);
    setCopied(true);
    success('Copied short URL to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStatus = async () => {
    if (!data?.link) return;
    try {
      const res = await fetch(`/api/links/${data.link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !data.link.isActive }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        success(data.link.isActive ? 'Link paused' : 'Link reactivated');
        fetchLinkAnalytics();
      }
    } catch {
      error('Failed to change link status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this link and all its analytics?')) return;
    try {
      const res = await fetch(`/api/links/${params.id}`, { method: 'DELETE' });
      const resJson = await res.json();
      if (resJson.success) {
        success('Link deleted');
        router.push('/dashboard/links');
      }
    } catch {
      error('Failed to delete link');
    }
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center text-[#A1A1AA] text-sm">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin" />
          <span>Loading link intelligence...</span>
        </div>
      </div>
    );
  }

  if (!data?.link) {
    return (
      <div className="py-20 text-center text-[#A1A1AA]">
        <p>Link not found or access denied.</p>
        <Link href="/dashboard/links" className="mt-3 inline-block text-[#FF6B2C] text-sm font-semibold hover:underline">
          Return to Links Catalog
        </Link>
      </div>
    );
  }

  const { link, metrics, timeSeries, hourlyActivity, devices, browsers, operatingSystems, referrers, recentClicks } = data;

  return (
    <div className="space-y-8 animate-fade-in text-[#F5F5F5]">
      {/* Back Button & Header */}
      <div>
        <Link
          href="/dashboard/links"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A1A1AA] hover:text-[#FF6B2C] transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Links</span>
        </Link>

        {/* Hero Card for Link */}
        <div className="p-6 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#F5F5F5]">
                {link.title || 'Untitled Link'}
              </h2>
              {link.isActive ? (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FF6B2C]/15 text-[#FF8C42] border border-[#FF6B2C]/30">
                  Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#242424] text-[#A1A1AA] border border-[#303030]">
                  Paused
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-[#FF6B2C] font-bold">{link.shortUrl}</span>
              <span className="text-[#A1A1AA]">→</span>
              <a
                href={link.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#A1A1AA] hover:text-[#F5F5F5] truncate max-w-md flex items-center gap-1"
              >
                <span>{link.originalUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0 text-[#FF6B2C]" />
              </a>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#A1A1AA] pt-1">
              <span>Created: {formatDate(link.createdAt)}</span>
              {link.expiresAt && <span>Expires: {formatDate(link.expiresAt)}</span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1D1D1D] hover:bg-[#242424] text-xs font-semibold text-[#F5F5F5] border border-[#303030] transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-[#FF6B2C]" /> : <Copy className="w-4 h-4 text-[#FF6B2C]" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>

            <button
              onClick={() => setQrOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1D1D1D] hover:bg-[#242424] text-xs font-semibold text-[#F5F5F5] border border-[#303030] transition-colors"
            >
              <QrCode className="w-4 h-4 text-[#FF8C42]" />
              <span>QR Code</span>
            </button>

            <button
              onClick={handleToggleStatus}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#303030] text-xs font-semibold text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#1D1D1D] transition-colors"
            >
              {link.isActive ? <Pause className="w-4 h-4 text-[#FF8C42]" /> : <Play className="w-4 h-4 text-[#FF6B2C]" />}
              <span>{link.isActive ? 'Pause' : 'Reactivate'}</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-[#A1A1AA] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Delete Link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Clicks"
          value={metrics.totalClicks.toLocaleString()}
          subtext={`Captured in ${range} timeframe`}
          trend={15}
          icon={MousePointerClick}
          accentColor="text-[#FF6B2C]"
        />
        <MetricCard
          label="Unique Visitors"
          value={metrics.uniqueVisitors.toLocaleString()}
          subtext="Keyed HMAC anonymized"
          trend={10}
          icon={Users}
          accentColor="text-[#FF8C42]"
        />
        <MetricCard
          label="Clicks Today"
          value={metrics.clicksToday.toLocaleString()}
          subtext="Volume since 00:00 UTC"
          icon={Clock}
          accentColor="text-[#FF6B2C]"
        />
        <MetricCard
          label="Filtered Crawlers"
          value={metrics.botClicksFiltered.toLocaleString()}
          subtext="Automated bots segregated"
          icon={ShieldCheck}
          accentColor="text-[#A1A1AA]"
        />
      </div>

      {/* Click Activity Chart */}
      <ClickChart
        data={timeSeries}
        currentRange={range}
        onRangeChange={(newRange) => setRange(newRange)}
        loading={loading}
      />

      {/* Hourly Engagement Heatmap */}
      <div className="p-6 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#F5F5F5]">
              Hour-of-Day Traffic Distribution
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Click activity distributed across 24-hour cycles to identify peak audience engagement windows.
            </p>
          </div>
        </div>

        <div className="h-[200px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyActivity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="orangeHourBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B2C" />
                  <stop offset="100%" stopColor="#E55A1F" />
                </linearGradient>
              </defs>
              <XAxis dataKey="formattedHour" tick={{ fontSize: 10, fill: '#A1A1AA' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#A1A1AA' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2.5 bg-[#151515] text-[#F5F5F5] rounded-lg text-xs font-mono shadow-xl border border-[#303030]">
                        <span className="text-[#A1A1AA]">{label}:</span>{' '}
                        <strong className="text-[#FF6B2C]">{payload[0].value} clicks</strong>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="clicks" fill="url(#orangeHourBarGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 Breakdowns Grid: Referrers, Devices, Browsers, OS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DistributionChart
          title="Top Referrers"
          description="Originating domains"
          data={referrers}
          icon={Globe2}
          barColor="bg-[#FF6B2C]"
        />
        <DistributionChart
          title="Device Category"
          description="Desktop vs mobile split"
          data={devices}
          icon={Smartphone}
          barColor="bg-[#FF8C42]"
        />
        <DistributionChart
          title="Browser Share"
          description="Client software"
          data={browsers}
          icon={Layers}
          barColor="bg-[#FF6B2C]"
        />
        <DistributionChart
          title="Operating System"
          description="Platform distribution"
          data={operatingSystems}
          icon={Laptop}
          barColor="bg-[#FF8C42]"
        />
      </div>

      {/* Recent Clicks Audit Trail */}
      <div className="p-6 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#F5F5F5]">
              Recent Click Telemetry Stream
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Auditable log of individual visitor interactions with privacy hashing applied.
            </p>
          </div>
          <span className="text-xs font-mono text-[#A1A1AA]">{recentClicks.length} logged events</span>
        </div>

        {recentClicks.length === 0 ? (
          <p className="text-xs text-[#A1A1AA] py-6 text-center">No clicks logged yet for this link.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#303030] text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Referrer Domain</th>
                  <th className="py-2.5 px-3">Browser</th>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3">Device Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303030]/60 font-mono">
                {recentClicks.map((click: any) => (
                  <tr key={click.id} className="hover:bg-[#1D1D1D]/50 transition-colors">
                    <td className="py-2.5 px-3 text-[#A1A1AA]">{formatDate(click.timestamp)}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#FF8C42]">
                      {click.referrerDomain}
                    </td>
                    <td className="py-2.5 px-3 text-[#F5F5F5]">{click.browser}</td>
                    <td className="py-2.5 px-3 text-[#F5F5F5]">{click.os}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#1D1D1D] text-[#A1A1AA] border border-[#303030]">
                        {click.deviceType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        shortUrl={link.shortUrl}
        shortCode={link.shortCode}
        title={link.title}
      />
    </div>
  );
}
