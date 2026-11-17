'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { CreateLinkModal } from '@/components/dashboard/CreateLinkModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.success) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const getPageInfo = () => {
    if (pathname === '/dashboard') {
      return {
        title: 'Platform Overview',
        description: 'Real-time telemetry, click velocity, and active link metrics.',
      };
    }
    if (pathname === '/dashboard/links') {
      return {
        title: 'Link Management',
        description: 'Create, monitor, pause, and export QR codes for your short URLs.',
      };
    }
    if (pathname.startsWith('/dashboard/links/')) {
      return {
        title: 'Link Telemetry & Analytics',
        description: 'Granular breakdown of visitor devices, referrers, and hourly engagement.',
      };
    }
    if (pathname === '/dashboard/analytics') {
      return {
        title: 'Clickstream Intelligence',
        description: 'Aggregated analytics across all short links in your portfolio.',
      };
    }
    if (pathname === '/dashboard/settings') {
      return {
        title: 'Account & Security Settings',
        description: 'Manage your profile, credentials, and privacy preferences.',
      };
    }
    return { title: 'Dashboard', description: '' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090909]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FF6B2C] flex items-center justify-center text-white font-bold text-sm shadow-orange-sm animate-pulse">
            K
          </div>
          <p className="text-xs font-mono text-[#A1A1AA]">Loading Kairo session...</p>
        </div>
      </div>
    );
  }

  const { title, description } = getPageInfo();

  return (
    <div className="min-h-screen flex bg-[#090909] text-[#F5F5F5]">
      <Sidebar
        user={user}
        onOpenCreateModal={() => setCreateModalOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={title}
          description={description}
          onOpenCreateModal={() => setCreateModalOpen(true)}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <CreateLinkModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onLinkCreated={() => {
          window.dispatchEvent(new Event('kairo:link_created'));
        }}
      />
    </div>
  );
}
