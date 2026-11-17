'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const { success, error } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to create account.');
        error(data.error || 'Registration failed.');
      } else {
        success(`Welcome to Kairo, ${data.user.name}!`);
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setErrorMsg('A network error occurred. Please try again.');
      error('Network error during registration.');
    } finally {
      setLoading(false);
    }
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
            Create your account
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Start shortening links, analyzing clicks, and securing your telemetry.
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-[#151515] border border-[#303030] rounded-2xl p-7 shadow-2xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                <input
                  type="text"
                  placeholder="Alex Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] transition-all placeholder:text-[#A1A1AA]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                <input
                  type="email"
                  placeholder="alex@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] transition-all font-mono placeholder:font-sans placeholder:text-[#A1A1AA]/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] transition-all font-mono"
                />
              </div>
              <p className="text-[11px] text-[#A1A1AA] mt-1">Must be at least 8 characters long.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-semibold text-sm transition-all shadow-orange-sm active:scale-[0.98] disabled:opacity-50"
            >
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#A1A1AA] mt-6">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#FF6B2C] hover:underline"
          >
            Sign in
          </Link>
        </p>

        {/* Security guarantee */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#A1A1AA]">
          <ShieldCheck className="w-4 h-4 text-[#FF6B2C]" />
          <span>Strict tenant isolation & zero telemetry cross-contamination</span>
        </div>
      </div>
    </div>
  );
}
