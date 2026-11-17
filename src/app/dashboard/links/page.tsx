'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  Pause,
  Play,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Link2,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import { QRModal } from '@/components/dashboard/QRModal';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

export default function LinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLinks, setTotalLinks] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // QR Modal
  const [qrModal, setQrModal] = useState<{
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

  // Edit Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    id: string;
    title: string;
    originalUrl: string;
    customAlias: string;
  }>({
    isOpen: false,
    id: '',
    title: '',
    originalUrl: '',
    customAlias: '',
  });

  // Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    shortCode: string;
  }>({
    isOpen: false,
    id: '',
    shortCode: '',
  });

  const { success, error } = useToast();

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        status,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/links?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLinks(data.links || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalLinks(data.pagination?.total || 0);
      }
    } catch {
      error('Failed to load links.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sortBy, sortOrder, error]);

  useEffect(() => {
    fetchLinks();

    const handleCreated = () => fetchLinks();
    window.addEventListener('kairo:link_created', handleCreated);
    return () => window.removeEventListener('kairo:link_created', handleCreated);
  }, [fetchLinks]);

  const handleCopy = (shortUrl: string, id: string) => {
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(id);
    success('Copied short URL to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (link: any) => {
    try {
      const res = await fetch(`/api/links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        success(link.isActive ? 'Link paused' : 'Link reactivated');
        fetchLinks();
      } else {
        error(data.error || 'Failed to update status');
      }
    } catch {
      error('Network error changing status');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/links/${editModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editModal.title,
          originalUrl: editModal.originalUrl,
          customAlias: editModal.customAlias,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success('Link successfully updated');
        setEditModal({ isOpen: false, id: '', title: '', originalUrl: '', customAlias: '' });
        fetchLinks();
      } else {
        error(data.error || 'Failed to update link');
      }
    } catch {
      error('Network error saving updates');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/links/${deleteModal.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        success('Link permanently deleted');
        setDeleteModal({ isOpen: false, id: '', shortCode: '' });
        fetchLinks();
      } else {
        error(data.error || 'Failed to delete');
      }
    } catch {
      error('Network error deleting link');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#F5F5F5]">
      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-[#151515] border border-[#303030] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Search by title, alias, or URL..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#303030] bg-[#1D1D1D] text-xs sm:text-sm text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] transition-all placeholder:text-[#A1A1AA]/50"
          />
        </div>

        {/* Filter and Sort Pills */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Select */}
          <div className="flex items-center gap-1 p-1 bg-[#1D1D1D] rounded-xl border border-[#303030]">
            {['all', 'active', 'paused', 'expired'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  status === s
                    ? 'bg-[#FF6B2C] text-white shadow-sm'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F5]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort By Select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-xs font-medium text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]"
          >
            <option value="createdAt">Date Created</option>
            <option value="clicks">Total Clicks</option>
            <option value="title">Title</option>
          </select>

          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            title="Toggle sort direction"
            className="p-2 rounded-xl border border-[#303030] bg-[#1D1D1D] text-[#A1A1AA] hover:text-[#FF6B2C] transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Links List / Table */}
      <div className="rounded-2xl bg-[#151515] border border-[#303030] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[#A1A1AA] text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin" />
              <span>Fetching links catalog...</span>
            </div>
          </div>
        ) : links.length === 0 ? (
          <div className="py-20 text-center">
            <Link2 className="w-10 h-10 text-[#303030] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#F5F5F5]">No matching short links</h4>
            <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto">
              Try adjusting your search filters or generate a new short link to populate this table.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#303030] bg-[#1D1D1D]/40 text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                    <th className="py-3.5 px-6">Link Title & Details</th>
                    <th className="py-3.5 px-6">Short URL</th>
                    <th className="py-3.5 px-4 text-center">Clicks</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#303030]/60 text-sm">
                  {links.map((link) => {
                    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                    const shortUrl = `${appUrl}/r/${link.shortCode}`;
                    return (
                      <tr
                        key={link.id}
                        className="hover:bg-[#1D1D1D]/40 transition-colors group"
                      >
                        <td className="py-4 px-6 max-w-xs">
                          <Link
                            href={`/dashboard/links/${link.id}`}
                            className="font-bold text-[#F5F5F5] hover:text-[#FF6B2C] transition-colors line-clamp-1"
                          >
                            {link.title || 'Untitled Link'}
                          </Link>
                          <p className="text-xs text-[#A1A1AA] font-mono truncate mt-0.5" title={link.originalUrl}>
                            {link.originalUrl}
                          </p>
                          <span className="text-[10px] text-[#A1A1AA]/60 block mt-1">
                            Created {formatDate(link.createdAt)}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#FF6B2C]">
                              /r/{link.shortCode}
                            </span>
                            <button
                              onClick={() => handleCopy(shortUrl, link.id)}
                              className="p-1 rounded text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#1D1D1D] transition-colors"
                              title="Copy URL"
                            >
                              {copiedId === link.id ? (
                                <Check className="w-3.5 h-3.5 text-[#FF6B2C]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-lg bg-[#1D1D1D] border border-[#303030] font-mono text-xs font-bold text-[#FF8C42]">
                            {link.totalClicks}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          {link.isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF6B2C]/15 text-[#FF8C42] border border-[#FF6B2C]/30">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#242424] text-[#A1A1AA] border border-[#303030]">
                              Paused
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                setQrModal({
                                  isOpen: true,
                                  shortUrl,
                                  shortCode: link.shortCode,
                                  title: link.title,
                                })
                              }
                              title="QR Code"
                              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#FF6B2C] hover:bg-[#1D1D1D] transition-colors"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(link)}
                              title={link.isActive ? 'Pause Link' : 'Reactivate Link'}
                              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#FF8C42] hover:bg-[#1D1D1D] transition-colors"
                            >
                              {link.isActive ? (
                                <Pause className="w-4 h-4 text-[#FF8C42]" />
                              ) : (
                                <Play className="w-4 h-4 text-[#FF6B2C]" />
                              )}
                            </button>

                            <button
                              onClick={() =>
                                setEditModal({
                                  isOpen: true,
                                  id: link.id,
                                  title: link.title,
                                  originalUrl: link.originalUrl,
                                  customAlias: link.shortCode,
                                })
                              }
                              title="Edit Link"
                              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#1D1D1D] transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <Link
                              href={`/dashboard/links/${link.id}`}
                              title="Analytics"
                              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#FF6B2C] hover:bg-[#1D1D1D] transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  id: link.id,
                                  shortCode: link.shortCode,
                                })
                              }
                              title="Delete Link"
                              className="p-1.5 rounded-lg text-[#A1A1AA] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-[#303030]/60">
              {links.map((link) => {
                const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
                const shortUrl = `${appUrl}/r/${link.shortCode}`;
                return (
                  <div key={link.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/dashboard/links/${link.id}`}
                          className="font-bold text-sm text-[#F5F5F5] hover:text-[#FF6B2C]"
                        >
                          {link.title || 'Untitled Link'}
                        </Link>
                        <p className="text-xs font-mono text-[#FF6B2C] mt-0.5">
                          /r/{link.shortCode}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1D1D1D] text-[#FF8C42] border border-[#303030] font-mono">
                        {link.totalClicks} clicks
                      </span>
                    </div>

                    <p className="text-xs text-[#A1A1AA] truncate">{link.originalUrl}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-[#303030]">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(shortUrl, link.id)}
                          className="p-2 rounded-lg bg-[#1D1D1D] text-xs font-medium text-[#F5F5F5] flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={() =>
                            setQrModal({
                              isOpen: true,
                              shortUrl,
                              shortCode: link.shortCode,
                              title: link.title,
                            })
                          }
                          className="p-2 rounded-lg bg-[#1D1D1D] text-[#A1A1AA] hover:text-[#F5F5F5] text-xs font-medium"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/dashboard/links/${link.id}`}
                          className="px-3 py-1.5 rounded-lg bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 text-[#FF8C42] text-xs font-semibold"
                        >
                          Analytics
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              id: link.id,
                              shortCode: link.shortCode,
                            })
                          }
                          className="p-2 rounded-lg text-rose-400 hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-[#303030] flex items-center justify-between text-xs text-[#A1A1AA]">
              <span>
                Showing {links.length} of {totalLinks} links
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-[#303030] bg-[#1D1D1D] disabled:opacity-40 hover:text-[#FF6B2C] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono font-medium text-[#F5F5F5]">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-[#303030] bg-[#1D1D1D] disabled:opacity-40 hover:text-[#FF6B2C] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Link Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
        title="Edit Short Link"
        description="Update destination URL, title, or custom alias."
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
              Destination URL
            </label>
            <input
              type="text"
              value={editModal.originalUrl}
              onChange={(e) => setEditModal({ ...editModal, originalUrl: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-sm text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
              Link Title
            </label>
            <input
              type="text"
              value={editModal.title}
              onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-sm text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1">
              Custom Alias
            </label>
            <input
              type="text"
              value={editModal.customAlias}
              onChange={(e) => setEditModal({ ...editModal, customAlias: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-sm text-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#303030]">
            <button
              type="button"
              onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 text-sm font-medium text-[#A1A1AA] hover:bg-[#1D1D1D] hover:text-[#F5F5F5] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold bg-[#FF6B2C] hover:bg-[#E55A1F] text-white rounded-xl shadow-orange-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', shortCode: '' })}
        title="Delete Short Link"
        maxWidth="sm"
      >
        <div className="py-2 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-rose-950/40 text-rose-300 rounded-xl border border-rose-800/50">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium">
              Are you sure you want to permanently delete short code <strong>/r/{deleteModal.shortCode}</strong>? This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteModal({ isOpen: false, id: '', shortCode: '' })}
              className="px-4 py-2 text-sm font-medium text-[#A1A1AA] hover:bg-[#1D1D1D] hover:text-[#F5F5F5] rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>

      {/* QR Code Modal */}
      <QRModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal((prev) => ({ ...prev, isOpen: false }))}
        shortUrl={qrModal.shortUrl}
        shortCode={qrModal.shortCode}
        title={qrModal.title}
      />
    </div>
  );
}
