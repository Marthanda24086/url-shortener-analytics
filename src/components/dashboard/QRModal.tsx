'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from '@/components/ui/Modal';
import { Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortUrl: string;
  shortCode: string;
  title: string;
}

export function QRModal({ isOpen, onClose, shortUrl, shortCode }: QRModalProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  useEffect(() => {
    if (isOpen && shortUrl) {
      QRCode.toDataURL(shortUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#090909',
          light: '#F5F5F5',
        },
      })
        .then((url) => setDataUrl(url))
        .catch(console.error);
    }
  }, [isOpen, shortUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    success('Short URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPNG = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `kairo-${shortCode}-qr.png`;
    link.href = dataUrl;
    link.click();
    success('QR Code PNG downloaded');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code Generator"
      description="Scan or download this high-resolution QR code for physical or digital distribution."
      maxWidth="md"
    >
      <div className="flex flex-col items-center gap-6 py-2">
        <div className="p-4 bg-[#F5F5F5] rounded-2xl border border-[#303030] shadow-sm flex items-center justify-center">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR Code for ${shortUrl}`}
              className="w-56 h-56 rounded-lg object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-[#A1A1AA] text-sm">
              Generating QR Code...
            </div>
          )}
        </div>

        <div className="w-full bg-[#1D1D1D] p-3.5 rounded-xl border border-[#303030] flex items-center justify-between gap-3">
          <div className="truncate min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Target Short Link</p>
            <p className="text-sm font-mono font-medium text-[#FF6B2C] truncate">{shortUrl}</p>
          </div>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-[#151515] border border-[#303030] text-[#A1A1AA] hover:text-[#F5F5F5] transition-colors shrink-0"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-[#FF6B2C]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={downloadPNG}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FF6B2C] hover:bg-[#E55A1F] text-white font-semibold text-sm transition-colors shadow-orange-sm"
          >
            <Download className="w-4 h-4" />
            Download PNG (High-Res)
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-[#303030] text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#1D1D1D] font-medium text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
