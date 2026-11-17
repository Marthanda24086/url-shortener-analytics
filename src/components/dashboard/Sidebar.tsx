'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Link2,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface SidebarProps {
  user?: { name: string; email: string } | null;
  onOpenCreateModal?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ user, onOpenCreateModal, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { success } = useToast();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      success('Logged out successfully');
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Links', href: '/dashboard/links', icon: Link2 },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#151515] border-r border-[#303030] w-64 select-none text-[#F5F5F5]">
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b border-[#303030]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#FF6B2C] flex items-center justify-center text-white font-extrabold text-lg shadow-orange-sm group-hover:scale-105 transition-transform">
            K
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-[#F5F5F5]">
              KAIRO
            </span>
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-[#FF6B2C]/15 text-[#FF8C42] rounded-md border border-[#FF6B2C]/30">
              PRO
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Action Button */}
      <div className="p-4">
        <button
          onClick={onOpenCreateModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-semibold text-sm transition-all shadow-orange-sm active:scale-[0.98]"
        >
          <Zap className="w-4 h-4" />
          <span>New Short Link</span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#FF6B2C]/15 text-[#FF6B2C] font-semibold border border-[#FF6B2C]/20'
                  : 'text-[#A1A1AA] hover:bg-[#1D1D1D] hover:text-[#F5F5F5]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF6B2C]' : 'text-[#A1A1AA]'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-[#FF6B2C]" />}
            </Link>
          );
        })}
      </nav>

      {/* Privacy & System Badge */}
      <div className="px-4 py-3 mx-3 my-2 bg-[#1D1D1D] rounded-xl border border-[#303030]">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#F5F5F5]">
          <ShieldCheck className="w-4 h-4 text-[#FF8C42]" />
          <span>Privacy Protected</span>
        </div>
        <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
          Zero raw IP storage. Keyed HMAC hashing enabled.
        </p>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-[#303030] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#1D1D1D] border border-[#303030] flex items-center justify-center font-bold text-xs text-[#FF8C42] shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div className="truncate min-w-0">
            <p className="text-xs font-semibold text-[#F5F5F5] truncate">
              {user?.name || 'Account'}
            </p>
            <p className="text-[11px] text-[#A1A1AA] truncate">{user?.email || 'user@kairo.sh'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-rose-400 hover:bg-rose-950/30 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full animate-fade-in">{content}</div>
        </div>
      )}
    </>
  );
}
