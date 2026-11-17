'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  MousePointerClick,
  Users,
  Clock,
  ShieldCheck,
  Globe2,
  Smartphone,
  Layers,
  Laptop,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ClickChart } from '@/components/dashboard/ClickChart';
import { DistributionChart } from '@/components/dashboard/DistributionChart';
import { useToast } from '@/components/ui/Toast';

export default function AnalyticsSuitePage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/overview?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        error(json.error || 'Failed to load analytics.');
      }
    } catch {
      error('Network error loading analytics.');
    } finally {
      setLoading(false);
    }
  }, [range, error]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const metrics = data?.metrics || {
    totalClicks: 0,
    clicksToday: 0,
    uniqueVisitors: 0,
    activeLinks: 0,
    botClicksFiltered: 0,
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#F5F5F5]">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Portfolio Clicks"
          value={metrics.totalClicks.toLocaleString()}
          subtext={`Captured over ${range}`}
          trend={14}
          icon={MousePointerClick}
          accentColor="text-[#FF6B2C]"
        />
        <MetricCard
          label="Unique Visitors"
          value={metrics.uniqueVisitors.toLocaleString()}
          subtext="HMAC deduplicated reach"
          trend={9}
          icon={Users}
          accentColor="text-[#FF8C42]"
        />
        <MetricCard
          label="Clicks Today"
          value={metrics.clicksToday.toLocaleString()}
          subtext="Since midnight local time"
          icon={Clock}
          accentColor="text-[#FF6B2C]"
        />
        <MetricCard
          label="Filtered Bots"
          value={metrics.botClicksFiltered.toLocaleString()}
          subtext="Segregated crawler hits"
          icon={ShieldCheck}
          accentColor="text-[#A1A1AA]"
        />
      </div>

      {/* Main Aggregated Trend Chart */}
      <ClickChart
        data={data?.timeSeries || []}
        currentRange={range}
        onRangeChange={(newRange) => setRange(newRange)}
        loading={loading}
      />

      {/* Distribution Breakdowns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DistributionChart
          title="Top Referrers"
          description="Traffic sources"
          data={data?.referrers || []}
          icon={Globe2}
          barColor="bg-[#FF6B2C]"
        />
        <DistributionChart
          title="Device Categories"
          description="Hardware profile"
          data={data?.devices || []}
          icon={Smartphone}
          barColor="bg-[#FF8C42]"
        />
        <DistributionChart
          title="Web Browsers"
          description="User client"
          data={data?.browsers || []}
          icon={Layers}
          barColor="bg-[#FF6B2C]"
        />
        <DistributionChart
          title="Operating Systems"
          description="Host platforms"
          data={data?.operatingSystems || []}
          icon={Laptop}
          barColor="bg-[#FF8C42]"
        />
      </div>
    </div>
  );
}
