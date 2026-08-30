'use client';

import React, { useEffect, useState } from 'react';
import { generateQRCodeDataUrl } from '@/lib/crypto-utils';
import { QrCode, Download, ExternalLink, Check, Copy } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  showDetails?: boolean;
  label?: string;
}

export function QRCodeDisplay({
  value,
  size = 180,
  showDetails = true,
  label = 'Tamper-Evident QR Code',
}: QRCodeDisplayProps) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateQRCodeDataUrl(value).then(setQrSrc);
  }, [value]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrSrc) return;
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = `Metrology_Verification_QR_${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
      <div className="relative group">
        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrSrc}
            alt="Verification QR Code"
            style={{ width: size, height: size }}
            className="rounded-lg shadow-2xs border border-slate-100 p-1 bg-white"
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 animate-pulse"
          >
            <QrCode className="w-12 h-12" />
          </div>
        )}
      </div>

      {showDetails && (
        <div className="mt-3 w-full text-center">
          <p className="text-xs font-semibold text-slate-800 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            {label}
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
              title="Copy verification link"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy URL'}
            </button>
            <button
              onClick={handleDownloadQR}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
              title="Download QR Image"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
