'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { success } = useToast();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
        }
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    success('Logged out successfully');
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in text-[#F5F5F5]">
      {/* 1. Profile Information Card */}
      <div className="p-6 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[#F5F5F5]">
            Account Profile
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Your personal credentials and platform identification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
              Display Name
            </label>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-sm font-medium text-[#F5F5F5]">
              <User className="w-4 h-4 text-[#FF6B2C]" />
              <span>{user?.name || 'Loading...'}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
              Email Address
            </label>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-sm font-medium text-[#F5F5F5]">
              <Mail className="w-4 h-4 text-[#FF6B2C]" />
              <span>{user?.email || 'Loading...'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 text-xs text-[#A1A1AA] flex items-center gap-2">
          <KeyRound className="w-3.5 h-3.5 text-[#A1A1AA]" />
          <span>User ID: <code className="font-mono text-[#FF8C42]">{user?.id}</code></span>
        </div>
      </div>

      {/* 2. Security & Sessions Card */}
      <div className="p-6 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[#F5F5F5]">
            Security & Session Controls
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Session tokens and cryptographic authentication policies.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1D1D1D] border border-[#303030] text-xs space-y-2 text-[#A1A1AA]">
          <div className="flex items-center gap-2 font-semibold text-[#F5F5F5]">
            <Lock className="w-4 h-4 text-[#FF6B2C]" />
            <span>Active Cryptographic Session</span>
          </div>
          <p>
            Your session is secured using JSON Web Tokens (JWT) signed with HMAC-SHA256 and stored in an HTTP-only, SameSite=Lax cookie.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-900/60 text-rose-400 hover:bg-rose-950/30 text-xs font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Current Device</span>
        </button>
      </div>

      {/* 3. Privacy & Telemetry Disclosure Card */}
      <div className="p-6 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#1D1D1D] border border-[#303030] text-[#FF6B2C]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#F5F5F5]">
              Privacy-Conscious Telemetry Policy
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              How Kairo balances deep analytics with visitor privacy protection.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-[#A1A1AA]">
          <div className="p-3.5 rounded-xl border border-[#303030] bg-[#1D1D1D]/60">
            <h4 className="font-bold text-[#F5F5F5] mb-1">
              1. Zero Raw IP Address Storage
            </h4>
            <p>
              When a visitor accesses a short URL, the incoming IP address is masked at the subnet level (IPv4 /24 or IPv6 /48) and immediately combined with the User-Agent and a daily rotating server secret into an irreversible SHA-256 HMAC hash. The raw IP is discarded and never written to the database or access logs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#303030] bg-[#1D1D1D]/60">
            <h4 className="font-bold text-[#F5F5F5] mb-1">
              2. Approximate Unique Visitors Calculation
            </h4>
            <p>
              Unique visitor counts are calculated by querying <code>COUNT(DISTINCT visitor_hash)</code> over the selected time window. Because visitor hashes incorporate a daily epoch salt, visitors cannot be tracked across extended time horizons, ensuring ethical, privacy-first engagement metrics.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-[#303030] bg-[#1D1D1D]/60">
            <h4 className="font-bold text-[#F5F5F5] mb-1">
              3. Heuristic Bot & Web Scraper Filtering
            </h4>
            <p>
              Incoming requests are evaluated against regular expressions matching known search engine spiders, social media link preview generators (Twitterbot, WhatsApp, Slack, Discord), and script libraries (curl, python-requests). Hits flagged as automated are segregated so your primary click figures reflect authentic human engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
