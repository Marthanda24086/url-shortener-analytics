'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Link2,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  QrCode,
  Sparkles,
  CheckCircle2,
  Globe2,
  Smartphone,
  Copy,
  Check,
  Clock,
  Layers,
  Zap,
  HelpCircle,
  ChevronDown,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/Toast';

export default function LandingPage() {
  const [demoInput, setDemoInput] = useState('');
  const [demoOutput, setDemoOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const { success } = useToast();

  const handleDemoShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim()) return;

    setShortening(true);
    setTimeout(() => {
      const code = Math.random().toString(36).substring(2, 8);
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kairo.sh';
      setDemoOutput(`${appUrl}/r/${code}`);
      setShortening(false);
      success('Link converted! Sign in to persist and track analytics.');
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#FF6B2C', '#FF8C42', '#FFFFFF'],
        });
      } catch {}
    }, 350);
  };

  const handleCopyDemo = () => {
    if (!demoOutput) return;
    navigator.clipboard.writeText(demoOutput);
    setCopied(true);
    success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const faqs = [
    {
      q: 'How does Kairo achieve sub-2ms redirect speeds?',
      a: 'Kairo uses an indexed SQLite database in WAL mode paired with lightweight Next.js edge route handlers. Lookups run in single-digit milliseconds and telemetry ingestion is executed asynchronously so visitors redirect immediately.',
    },
    {
      q: 'How are unique visitors counted without tracking cookies or raw IP addresses?',
      a: 'Incoming IP addresses are masked at the subnet level (IPv4 /24 or IPv6 /48) and combined with the User-Agent and a daily rotating server secret into an irreversible SHA-256 HMAC hash. This ensures accurate daily unique reach without storing personally identifiable data.',
    },
    {
      q: 'Can I use custom aliases and set expiration dates on links?',
      a: 'Yes. You can customize any slug (e.g. kairo.sh/r/black-friday) with character validation and reserved route protection. You can also configure expiration dates down to the exact minute, after which the link displays a clean branded 410 page.',
    },
    {
      q: 'Are automated web scrapers and crawlers filtered from click reports?',
      a: 'Yes. Every incoming request is evaluated against known search engine and preview bot signatures (Googlebot, Bingbot, Twitterbot, WhatsApp, Slack, curl). Crawlers are segregated so your primary click figures reflect authentic human engagement.',
    },
    {
      q: 'Can I export QR codes for physical or print marketing?',
      a: 'Every shortened link includes an integrated QR code studio supporting live SVG preview and high-resolution PNG download with customized filenames for print materials, flyers, slides, and packaging.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#090909] text-[#F5F5F5] selection:bg-[#FF6B2C]/30 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-[#090909]/90 backdrop-blur-md border-b border-[#303030]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B2C] flex items-center justify-center text-white font-extrabold text-base shadow-orange-sm group-hover:scale-105 transition-transform">
              K
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[#F5F5F5]">KAIRO</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#A1A1AA]">
            <a href="#features" className="hover:text-[#F5F5F5] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[#F5F5F5] transition-colors">
              How It Works
            </a>
            <a href="#analytics" className="hover:text-[#F5F5F5] transition-colors">
              Analytics
            </a>
            <a href="#security" className="hover:text-[#F5F5F5] transition-colors">
              Security
            </a>
            <a href="#faq" className="hover:text-[#F5F5F5] transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 text-[#A1A1AA] hover:text-[#F5F5F5] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white transition-all shadow-orange-sm active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden subtle-grid">
        {/* Subtle orange radial ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-[#FF6B2C]/10 blur-[140px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#303030] bg-[#151515] shadow-sm text-xs font-semibold mb-8 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-[#FF6B2C] animate-pulse" />
            <span className="text-[#F5F5F5]">Kairo 2.0 Engine Live</span>
            <span className="text-[#303030]">|</span>
            <span className="text-[#FF8C42]">Zero-latency Redirection</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#F5F5F5] leading-[1.08] mb-6">
            Shorten links. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B2C] via-[#FF8C42] to-[#FF6B2C]">
              Understand every click.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#A1A1AA] leading-relaxed mb-10">
            Create intelligent short links, track real-time engagement with privacy-first telemetry, and understand exactly how your audience interacts with your content.
          </p>

          {/* Live Interactive Shortener Bar in Hero */}
          <div className="max-w-2xl mx-auto mb-16">
            <form
              onSubmit={handleDemoShorten}
              className="p-2 sm:p-2.5 rounded-2xl bg-[#151515] border border-[#303030] shadow-xl flex flex-col sm:flex-row items-center gap-2.5"
            >
              <div className="relative flex-1 w-full flex items-center">
                <Link2 className="absolute left-3.5 w-4 h-4 text-[#A1A1AA]" />
                <input
                  type="text"
                  placeholder="Paste your long destination URL here..."
                  value={demoInput}
                  onChange={(e) => setDemoInput(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-transparent text-sm focus:outline-none text-[#F5F5F5] placeholder:text-[#A1A1AA]/60 font-mono placeholder:font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={shortening}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-semibold text-sm transition-all shadow-orange-sm active:scale-95 flex items-center justify-center gap-2 shrink-0"
              >
                <span>{shortening ? 'Shortening...' : 'Try Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Generated demo link preview */}
            {demoOutput && (
              <div className="mt-3.5 p-3 rounded-xl bg-[#151515] border border-[#FF6B2C]/50 shadow-sm flex items-center justify-between gap-3 animate-slide-up">
                <div className="flex items-center gap-2.5 truncate">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B2C] shrink-0" />
                  <span className="font-mono text-sm font-semibold text-[#FF8C42] truncate">
                    {demoOutput}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyDemo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D1D1D] text-xs font-medium text-[#F5F5F5] hover:bg-[#242424] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#FF6B2C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <Link
                    href="/register"
                    className="text-xs font-semibold text-[#FF6B2C] hover:underline underline-offset-2"
                  >
                    Claim & Track
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Product UI Preview Card */}
          <div className="relative max-w-4xl mx-auto rounded-2xl border border-[#303030] bg-[#151515] p-2 sm:p-3 shadow-2xl">
            <div className="rounded-xl border border-[#303030] bg-[#090909] p-4 sm:p-6 text-left">
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#303030] gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-mono text-[11px] sm:text-xs text-[#A1A1AA]">
                    kairo.sh/dashboard/overview
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 sm:py-1 rounded-full bg-[#FF6B2C]/15 text-[#FF8C42] border border-[#FF6B2C]/30 shrink-0">
                  Live Telemetry Ingest
                </span>
              </div>

              {/* Mock Dashboard Preview Inside */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                <div className="p-3 bg-[#151515] rounded-xl border border-[#303030]">
                  <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">Total Clicks</p>
                  <p className="text-xl font-bold font-mono text-[#F5F5F5] mt-1">42,890</p>
                  <span className="text-[10px] text-[#FF8C42] font-semibold">+18.4% vs last week</span>
                </div>
                <div className="p-3 bg-[#151515] rounded-xl border border-[#303030]">
                  <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">Unique Visitors</p>
                  <p className="text-xl font-bold font-mono text-[#F5F5F5] mt-1">31,420</p>
                  <span className="text-[10px] text-[#FF8C42] font-semibold">+12.1% unique</span>
                </div>
                <div className="p-3 bg-[#151515] rounded-xl border border-[#303030]">
                  <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">Active Links</p>
                  <p className="text-xl font-bold font-mono text-[#F5F5F5] mt-1">128</p>
                  <span className="text-[10px] text-[#FF6B2C] font-semibold">100% operational</span>
                </div>
                <div className="p-3 bg-[#151515] rounded-xl border border-[#303030]">
                  <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">Redirect Latency</p>
                  <p className="text-xl font-bold font-mono text-[#FF6B2C] mt-1">1.8 ms</p>
                  <span className="text-[10px] text-[#A1A1AA] font-semibold">302 fast-path</span>
                </div>
              </div>

              <div className="p-4 bg-[#151515] rounded-xl border border-[#303030] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#1D1D1D] text-[#FF6B2C]">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#F5F5F5]">Click Traffic & Referrer Channels</p>
                    <p className="text-xs text-[#A1A1AA]">Direct, Google Search, X/Twitter, and LinkedIn</p>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#FF6B2C] hover:bg-[#E55A1F] text-white transition-colors"
                >
                  Explore Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Flow Pipeline Section */}
      <section id="how-it-works" className="py-20 border-y border-[#303030] bg-[#151515]/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#FF6B2C] mb-2">The Architecture</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">The 4-Stage Redirection & Ingest Loop</h3>
            <p className="text-sm text-[#A1A1AA] mt-2">
              How Kairo redirects visitors in under 2ms while asynchronously calculating deep clickstream analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Link Creation',
                desc: 'Paste any destination URL. Specify optional custom aliases, custom titles, and expiration dates.',
                icon: Link2,
              },
              {
                step: '02',
                title: 'Edge Ingestion',
                desc: 'Requests hit the /r/[code] high-speed route. Indexed query looks up destination and status.',
                icon: Zap,
              },
              {
                step: '03',
                title: 'Privacy Telemetry',
                desc: 'User-agent and referrers are parsed. A privacy-safe HMAC visitor fingerprint is computed without saving IP addresses.',
                icon: ShieldCheck,
              },
              {
                step: '04',
                title: 'Real-Time Insights',
                desc: 'Data immediately syncs to your dashboard. Filter by 24h, 7d, 30d, device types, and referrers.',
                icon: BarChart3,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-2xl bg-[#151515] border border-[#303030] relative hover:border-[#FF6B2C]/40 transition-colors"
              >
                <div className="text-3xl font-extrabold font-mono text-[#303030] mb-4">
                  {item.step}
                </div>
                <item.icon className="w-5 h-5 text-[#FF6B2C] mb-3" />
                <h4 className="text-base font-bold text-[#F5F5F5] mb-2">{item.title}</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Feature Showcase */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#FF6B2C] mb-2">Core Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Everything Required for Link Dominance</h3>
            <p className="text-sm text-[#A1A1AA] mt-2">
              Engineered with commercial SaaS standards, precision controls, and zero bloat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'High-Throughput Shortening',
                desc: 'Convert any URL into a compact, shareable link with collision-resistant base62 code generation.',
                icon: Sparkles,
              },
              {
                title: 'Deep Click Analytics',
                desc: 'Monitor real-time clicks, unique visitors, today’s volume, and time-series trends over 24h to all time.',
                icon: BarChart3,
              },
              {
                title: 'Referrer Attribution',
                desc: 'Uncover where your clicks originate: Direct, Google Search, X/Twitter, LinkedIn, YouTube, and beyond.',
                icon: Globe2,
              },
              {
                title: 'Device & Platform Breakdown',
                desc: 'Categorize your audience by Desktop, Mobile, Tablet, Browser (Chrome, Safari, Firefox), and Operating System.',
                icon: Smartphone,
              },
              {
                title: 'Custom Aliases & Slugs',
                desc: 'Brand your short links with memorable custom aliases like kairo.sh/r/product-launch with reserved word checks.',
                icon: Layers,
              },
              {
                title: 'High-Res QR Code Export',
                desc: 'Generate instant downloadable QR codes for offline print materials, billboards, slides, and packaging.',
                icon: QrCode,
              },
              {
                title: 'Link Status & Expiration',
                desc: 'Set automatic expiration timestamps or temporarily pause incoming redirects at any time with custom landing pages.',
                icon: Clock,
              },
              {
                title: 'Bot & Crawler Filtering',
                desc: 'Automatically identify and filter automated web scrapers and crawlers so your engagement counts remain authentic.',
                icon: CheckCircle2,
              },
              {
                title: 'Privacy-First Architecture',
                desc: 'Completely eliminates raw IP address storage. Uses rotating daily keyed HMAC hashes to estimate unique reach.',
                icon: ShieldCheck,
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm hover:border-[#FF6B2C]/40 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1D1D1D] border border-[#303030] text-[#FF6B2C] flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#F5F5F5] mb-2">{f.title}</h4>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Security and Reliability Section */}
      <section id="security" className="py-20 bg-[#151515]/60 border-t border-[#303030]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1D1D1D] text-[#FF6B2C] border border-[#FF6B2C]/30 flex items-center justify-center mx-auto mb-5 shadow-orange-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
            Security & Enterprise Reliability
          </h3>
          <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-2xl mx-auto mb-8">
            Kairo is built from the ground up to prevent malicious exploits, open redirects, and unauthorized cross-tenant data leaks.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl bg-[#151515] border border-[#303030]">
              <p className="text-xs font-bold text-[#F5F5F5] mb-1">Strict Protocol Sanitation</p>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">Blocks javascript:, data:, and private loopback/SSRF ranges (127.0.0.1, localhost).</p>
            </div>
            <div className="p-4 rounded-xl bg-[#151515] border border-[#303030]">
              <p className="text-xs font-bold text-[#F5F5F5] mb-1">Tenant Data Isolation</p>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">Cryptographic JWT sessions enforce strict user_id boundaries across all queries.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#151515] border border-[#303030]">
              <p className="text-xs font-bold text-[#F5F5F5] mb-1">SQL Injection Immunity</p>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">100% prepared statements with parameterized SQL prevent injection vulnerabilities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="py-24 border-t border-[#303030]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#FF6B2C] mb-2">Answers & Documentation</h2>
            <h3 className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#303030] bg-[#151515] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-[#F5F5F5] hover:text-[#FF6B2C] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#A1A1AA] transition-transform ${
                      faqOpen === idx ? 'rotate-180 text-[#FF6B2C]' : ''
                    }`}
                  />
                </button>
                {faqOpen === idx && (
                  <div className="px-4 pb-4 text-xs text-[#A1A1AA] leading-relaxed border-t border-[#303030]/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Final High-Impact CTA */}
      <section className="py-20 relative overflow-hidden bg-[#151515] border-t border-[#303030]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-5">
            Ready to deploy your links with precision?
          </h2>
          <p className="text-base text-[#A1A1AA] max-w-xl mx-auto mb-8">
            Join developers, creators, and growth teams who trust Kairo for lightning-fast URL shortening and deep visitor telemetry.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-semibold text-sm transition-all shadow-orange-sm active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#1D1D1D] border border-[#303030] hover:bg-[#242424] text-[#F5F5F5] font-semibold text-sm transition-all"
            >
              Log In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="mt-auto border-t border-[#303030] py-10 bg-[#090909]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#FF6B2C] flex items-center justify-center text-white font-bold text-xs">
              K
            </div>
            <span className="font-bold text-sm tracking-tight">KAIRO</span>
            <span className="text-xs text-[#A1A1AA] ml-2">© 2026 Kairo Technologies. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#A1A1AA]">
            <Link href="/dashboard" className="hover:text-[#F5F5F5] transition-colors">
              Dashboard
            </Link>
            <Link href="/login" className="hover:text-[#F5F5F5] transition-colors">
              Sign In
            </Link>
            <a href="#features" className="hover:text-[#F5F5F5] transition-colors">
              Features
            </a>
            <a href="#faq" className="hover:text-[#F5F5F5] transition-colors">
              FAQ
            </a>
            <a href="#security" className="hover:text-[#F5F5F5] transition-colors">
              Security & Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
