'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  MousePointerClick,
  Users,
  Link2,
  Clock,
  ArrowUpRight,
  Copy,
  Check,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ClickChart } from '@/components/dashboard/ClickChart';
import { QRModal } from '@/components/dashboard/QRModal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

export default function DashboardOverview() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    shortUrl: string;
    shortCode: string;
    title: string;
  }>({
    isOpen: false,
    shortUrl: '',
    shortCode: '',
    title: '',
  });

  const { success } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, linksRes] = await Promise.all([
        fetch(`/api/analytics/overview?range=${range}`),
        fetch(`/api/links?limit=5&sortBy=createdAt&sortOrder=desc`),
      ]);

      const analyticsData = await analyticsRes.json();
      const linksData = await linksRes.json();

      if (analyticsData.success) {
        setAnalytics(analyticsData);
      }
      if (linksData.success) {
        setLinks(linksData.links || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();

    const handleCreated = () => fetchData();
    window.addEventListener('kairo:link_created', handleCreated);
    return () => window.removeEventListener('kairo:link_created', handleCreated);
  }, [fetchData]);

  const handleCopy = (shortUrl: string, id: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const metrics = analytics?.metrics || {
    totalClicks: 0,
    clicksToday: 0,
    uniqueVisitors: 0,
    activeLinks: 0,
    botClicksFiltered: 0,
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#F5F5F5]">
      {/* 1. Summary KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Clicks"
          value={metrics.totalClicks.toLocaleString()}
          subtext={`Captured across ${range} period`}
          trend={12}
          icon={MousePointerClick}
          accentColor="text-[#FF6B2C]"
        />
        <MetricCard
          label="Unique Visitors"
          value={metrics.uniqueVisitors.toLocaleString()}
          subtext="Privacy-safe HMAC hashed"
          trend={8}
          icon={Users}
          accentColor="text-[#FF8C42]"
        />
        <MetricCard
          label="Active Links"
          value={metrics.activeLinks.toLocaleString()}
          subtext="Currently receiving traffic"
          icon={Link2}
          accentColor="text-[#FF6B2C]"
        />
        <MetricCard
          label="Clicks Today"
          value={metrics.clicksToday.toLocaleString()}
          subtext="Recorded since midnight"
          icon={Clock}
          accentColor="text-[#FF8C42]"
        />
      </div>

      {/* 2. Interactive Click Activity Chart */}
      <ClickChart
        data={analytics?.timeSeries || []}
        currentRange={range}
        onRangeChange={(newRange) => setRange(newRange)}
        loading={loading}
      />

      {/* 3. Bottom Grid: Recent Links and Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Links (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold tracking-tight text-[#F5F5F5]">
                Recent Short Links
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Your latest destinations with live click telemetry.
              </p>
            </div>
            <Link
              href="/dashboard/links"
              className="text-xs font-semibold text-[#FF6B2C] hover:underline flex items-center gap-1"
            >
              <span>View All Links</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {links.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#303030] rounded-xl">
              <Link2 className="w-8 h-8 text-[#A1A1AA] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#F5F5F5]">No shortened links yet</p>
              <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto">
                Click &quot;New Short Link&quot; in the sidebar or header to create your first trackable destination.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                const shortUrl = `${appUrl}/r/${link.shortCode}`;
                return (
                  <div
                    key={link.id}
                    className="p-3.5 rounded-xl border border-[#303030] hover:border-[#454545] bg-[#1D1D1D]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="truncate min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/dashboard/links/${link.id}`}
                          className="text-sm font-bold text-[#F5F5F5] hover:text-[#FF6B2C] transition-colors truncate"
                        >
                          {link.title || 'Untitled Link'}
                        </Link>
                        {link.isActive ? (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#FF6B2C]/15 text-[#FF8C42] border border-[#FF6B2C]/30 shrink-0">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#242424] text-[#A1A1AA] border border-[#303030] shrink-0">
                            Paused
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono truncate">
                        <span className="text-[#FF6B2C] font-semibold truncate">
                          {shortUrl}
                        </span>
                        <span className="text-[#A1A1AA]">→</span>
                        <span className="truncate max-w-[200px] text-[#A1A1AA]">{link.originalUrl}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <div className="px-2.5 py-1 rounded-lg bg-[#151515] border border-[#303030] text-xs font-mono font-bold text-[#F5F5F5]">
                        {link.totalClicks} clicks
                      </div>

                      <button
                        onClick={() => handleCopy(shortUrl, link.id)}
                        title="Copy Short URL"
                        className="p-2 rounded-lg bg-[#151515] border border-[#303030] text-[#A1A1AA] hover:text-[#F5F5F5] hover:border-[#FF6B2C]/40 transition-colors"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-3.5 h-3.5 text-[#FF6B2C]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() =>
                          setQrModalData({
                            isOpen: true,
                            shortUrl,
                            shortCode: link.shortCode,
                            title: link.title,
                          })
                        }
                        title="Generate QR Code"
                        className="p-2 rounded-lg bg-[#151515] border border-[#303030] text-[#A1A1AA] hover:text-[#F5F5F5] hover:border-[#FF6B2C]/40 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={`/dashboard/links/${link.id}`}
                        title="Detailed Analytics"
                        className="p-2 rounded-lg bg-[#151515] border border-[#303030] text-[#A1A1AA] hover:text-[#FF6B2C] hover:border-[#FF6B2C]/40 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real-time Click Activity Stream (1 Col) */}
        <div className="p-6 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold tracking-tight text-[#F5F5F5]">
                Live Click Stream
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#FF8C42]">
                <span className="w-2 h-2 rounded-full bg-[#FF6B2C] animate-pulse" />
                <span>Connected</span>
              </div>
            </div>

            <div className="space-y-3">
              {analytics?.recentActivity?.length === 0 ? (
                <p className="text-xs text-[#A1A1AA] py-8 text-center">
                  No clicks recorded yet.
                </p>
              ) : (
                analytics?.recentActivity?.slice(0, 6).map((item: any) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D]/50 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="truncate min-w-0">
                      <p className="font-semibold text-[#F5F5F5] truncate">
                        {item.linkTitle || item.shortCode}
                      </p>
                      <p className="text-[11px] text-[#A1A1AA] mt-0.5 truncate">
                        {item.referrerDomain} • {item.browser} on {item.os}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#A1A1AA] font-mono shrink-0">
                      {formatDate(item.timestamp).split(',')[0]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#303030] text-[11px] text-[#A1A1AA] flex items-center justify-between">
            <span>Filtered bot requests:</span>
            <span className="font-mono font-bold text-[#FF8C42]">
              {metrics.botClicksFiltered}
            </span>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        shortUrl={qrModalData.shortUrl}
        shortCode={qrModalData.shortCode}
        title={qrModalData.title}
      />
    </div>
  );
}
