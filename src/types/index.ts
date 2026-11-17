export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Link {
  id: string;
  userId: string;
  originalUrl: string;
  shortCode: string;
  title: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  totalClicks?: number;
}

export interface ClickEvent {
  id: string;
  linkId: string;
  timestamp: string;
  referrerDomain: string;
  browser: string;
  os: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Other';
  countryCode: string;
  visitorHash: string;
  isBot: boolean;
}

export interface AnalyticsSummary {
  totalClicks: number;
  clicksToday: number;
  uniqueVisitors: number;
  activeLinks: number;
  botClicksFiltered: number;
}

export interface TimeSeriesPoint {
  date: string;
  clicks: number;
  unique: number;
}

export interface DistributionMetric {
  name: string;
  value: number;
  percentage?: number;
}

export interface HourlyActivityPoint {
  hour: number;
  formattedHour: string;
  clicks: number;
}

export interface LinkAnalyticsDetail {
  link: Link;
  metrics: AnalyticsSummary;
  timeSeries: TimeSeriesPoint[];
  hourlyActivity: HourlyActivityPoint[];
  devices: DistributionMetric[];
  browsers: DistributionMetric[];
  operatingSystems: DistributionMetric[];
  referrers: DistributionMetric[];
  recentClicks: Array<{
    id: string;
    timestamp: string;
    referrerDomain: string;
    browser: string;
    os: string;
    deviceType: string;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
