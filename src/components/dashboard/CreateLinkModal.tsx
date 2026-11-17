'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Link2, Sparkles, Calendar, Tag, ArrowRight, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkCreated: () => void;
}

export function CreateLinkModal({ isOpen, onClose, onLinkCreated }: CreateLinkModalProps) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { success, error } = useToast();

  const resetForm = () => {
    setOriginalUrl('');
    setCustomAlias('');
    setTitle('');
    setExpiresAt('');
    setErrorMsg('');
    setCreatedResult(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!originalUrl.trim()) {
      setErrorMsg('Please enter a destination URL.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: originalUrl.trim(),
          customAlias: customAlias.trim() || undefined,
          title: title.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to create link.');
        error(data.error || 'Failed to create link.');
      } else {
        setCreatedResult(data.link);
        success('Link successfully shortened!');
        onLinkCreated();

        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#FF6B2C', '#FF8C42', '#FFFFFF'],
          });
        } catch {}
      }
    } catch (err: any) {
      setErrorMsg('A network error occurred. Please try again.');
      error('Network error creating link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!createdResult?.shortUrl) return;
    navigator.clipboard.writeText(createdResult.shortUrl);
    setCopied(true);
    success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdResult ? 'Short Link Ready!' : 'Shorten New Link'}
      description={
        createdResult
          ? 'Your destination has been secured with high-speed redirection and click analytics.'
          : 'Convert lengthy URLs into intelligent, trackable short links.'
      }
      maxWidth="lg"
    >
      {createdResult ? (
        <div className="flex flex-col gap-5 py-2 animate-fade-in text-[#F5F5F5]">
          <div className="p-4 bg-[#1D1D1D] border border-[#FF6B2C]/40 rounded-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#FF8C42] mb-1">
              Your Short URL
            </p>
            <div className="flex items-center justify-between gap-3 bg-[#151515] p-2.5 rounded-lg border border-[#303030]">
              <span className="font-mono text-sm sm:text-base font-bold text-[#FF6B2C] truncate">
                {createdResult.shortUrl}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FF6B2C] hover:bg-[#E55A1F] text-white text-xs font-semibold transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="text-xs sm:text-sm space-y-1.5 text-[#A1A1AA] bg-[#1D1D1D] p-3.5 rounded-xl border border-[#303030]">
            <p className="truncate">
              <strong className="text-[#F5F5F5]">Destination:</strong>{' '}
              <span className="font-mono text-xs">{createdResult.originalUrl}</span>
            </p>
            <p>
              <strong className="text-[#F5F5F5]">Title:</strong> {createdResult.title}
            </p>
            {createdResult.expiresAt && (
              <p>
                <strong className="text-[#F5F5F5]">Expires:</strong>{' '}
                {new Date(createdResult.expiresAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                resetForm();
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#A1A1AA] hover:bg-[#1D1D1D] hover:text-[#F5F5F5] transition-colors"
            >
              Shorten Another
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#FF6B2C] hover:bg-[#E55A1F] text-white transition-colors shadow-orange-sm"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1 text-[#F5F5F5]">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs font-medium rounded-xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
              Destination URL <span className="text-[#FF6B2C]">*</span>
            </label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
              <input
                type="text"
                placeholder="https://example.com/very-long-product-campaign-url"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] transition-all font-mono placeholder:font-sans placeholder:text-[#A1A1AA]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Custom Alias <span className="text-[#A1A1AA]/60 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                <input
                  type="text"
                  placeholder="launch-deal"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] font-mono transition-all placeholder:text-[#A1A1AA]/50"
                />
              </div>
              <p className="text-[11px] text-[#A1A1AA] mt-1">Preview: kairo.sh/r/{customAlias || 'random'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Link Title <span className="text-[#A1A1AA]/60 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
                <input
                  type="text"
                  placeholder="Summer Promotion 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] transition-all placeholder:text-[#A1A1AA]/50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
              Expiration Date <span className="text-[#A1A1AA]/60 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#303030] bg-[#1D1D1D] text-[#F5F5F5] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#303030]">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#A1A1AA] hover:bg-[#1D1D1D] hover:text-[#F5F5F5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#FF6B2C] hover:bg-[#E55A1F] text-white transition-all shadow-orange-sm disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Shorten Link'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
