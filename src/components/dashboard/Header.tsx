'use client';

import React from 'react';
import { Menu, Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  description?: string;
  onOpenCreateModal: () => void;
  onOpenMobileSidebar: () => void;
}

export function Header({
  title,
  description,
  onOpenCreateModal,
  onOpenMobileSidebar,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#151515]/90 backdrop-blur-md border-b border-[#303030]">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl border border-[#303030] text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#1D1D1D] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#F5F5F5]">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-[#A1A1AA] hidden sm:block">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-semibold text-xs sm:text-sm transition-all shadow-orange-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Link</span>
        </button>
      </div>
    </header>
  );
}
