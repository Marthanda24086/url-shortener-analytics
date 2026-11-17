'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const { success, error } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid credentials.');
        error(data.error || 'Login failed.');
      } else {
        success(`Welcome back, ${data.user.name}!`);
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setErrorMsg('A network error occurred. Please check your connection.');
      error('Network error during login.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@kairo.sh');
    setPassword('Password123!');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#090909] text-[#F5F5F5] px-6 py-12 selection:bg-[#FF6B2C]/30 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Monogram */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B2C] flex items-center justify-center text-white font-extrabold text-lg shadow-orange-sm group-hover:scale-105 transition-transform">
              K
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#F5F5F5]">
              KAIRO
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-[#F5F5F5]">
            Sign in to your account
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Access your short links, analytics pipelines, and QR generation suite.
          </p>
        </div>

        {/* Demo Account Quick-Fill Pill */}
        <div className="mb-4 p-3 rounded-xl bg-[#1D1D1D] border border-[#FF6B2C]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#FF8C42]">
            <Zap className="w-4 h-4 text-[#FF6B2C] shrink-0" />
            <span>Want to test immediately?</span>
          </div>
          <button
            type="button"
            onClick={fillDemoAccount}
            className="px-3 py-1 rounded-lg bg-[#FF6B2C] text-white text-xs font-semibold hover:bg-[#E55A1F] transition-colors shrink-0 shadow-orange-sm"
          >
            Fill Demo Login
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-[#151515] border border-[#303030] rounded-2xl p-7 shadow-2xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] transition-all font-mono placeholder:font-sans placeholder:text-[#A1A1AA]/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-semibold text-sm transition-all shadow-orange-sm active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#A1A1AA] mt-6">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/register"
            className="font-semibold text-[#FF6B2C] hover:underline"
          >
            Create an account
          </Link>
        </p>

        {/* Security guarantee */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#A1A1AA]">
          <ShieldCheck className="w-4 h-4 text-[#FF6B2C]" />
          <span>bcrypt password encryption & HTTP-only sessions</span>
        </div>
      </div>
    </div>
  );
}
