import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { PortfolioData } from '../types';
import {
  QrCode,
  X,
  Copy,
  Check,
  Download,
  Printer,
  ExternalLink,
  Share2,
  Sparkles,
  Headphones,
  CheckCircle2,
} from 'lucide-react';

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  canonicalUrl: string;
  portfolioData: PortfolioData;
  versionNumber?: number;
}

export const ShareQrModal: React.FC<ShareQrModalProps> = ({
  isOpen,
  onClose,
  canonicalUrl,
  portfolioData,
  versionNumber,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !canonicalUrl) return;

    // Generate high-resolution, sharp QR code with error correction level 'H' (High - 30%)
    QRCode.toDataURL(canonicalUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#030712', // Deep obsidian black for ultra-fast camera scanner contrast
        light: '#ffffff', // Crisp white background
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
  }, [isOpen, canonicalUrl]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(canonicalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const cleanName = (portfolioData.name || 'portfolio')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const filename = `${cleanName}-portfolio-qr.png`;

    const downloadLink = document.createElement('a');
    downloadLink.href = qrDataUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handlePrint = () => {
    // Print window triggers native print dialog with printable media query
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Container */}
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh] print:max-h-none print:border-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Printable Section Header / In-App Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Share via QR Code</span>
                {versionNumber && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    v{versionNumber}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Scan to instantly launch live animated portfolio & speech narration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex flex-col items-center">
          {/* Printable Card Area */}
          <div
            ref={printableRef}
            id="printable-portfolio-qr-card"
            className="w-full max-w-sm bg-white text-slate-950 rounded-2xl p-6 shadow-xl border border-slate-200 flex flex-col items-center text-center transition-all print:border-2 print:border-black print:shadow-none print:max-w-none print:w-full print:m-0"
          >
            {/* Candidate Header on Printable Card */}
            <div className="mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1.5 border border-blue-200">
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Interactive Portfolio</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {portfolioData.name}
              </h2>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {portfolioData.title}
              </p>
            </div>

            {/* High-Resolution QR Graphic */}
            <div className="relative p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center my-2">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${portfolioData.name}'s Portfolio`}
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  <span className="text-xs">Generating QR...</span>
                </div>
              )}
            </div>

            {/* Scan Prompt Details */}
            <div className="mt-2 space-y-1">
              <p className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-blue-600" />
                <span>Scan with any camera to view & listen</span>
              </p>
              <p className="text-[11px] font-mono text-slate-500 break-all px-2 select-all">
                {canonicalUrl}
              </p>
            </div>

            {/* Contact Details on Printable Card */}
            {(portfolioData.contact.email || portfolioData.contact.phone) && (
              <div className="mt-4 pt-3 border-t border-slate-200 w-full flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-600 font-medium">
                {portfolioData.contact.email && (
                  <span>✉ {portfolioData.contact.email}</span>
                )}
                {portfolioData.contact.phone && (
                  <span>☎ {portfolioData.contact.phone}</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons Toolbar (Hidden on Print) */}
          <div className="w-full space-y-3 print:hidden">
            {/* Quick Link Field with Copy */}
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
              <input
                type="text"
                readOnly
                value={canonicalUrl}
                className="bg-transparent text-xs font-mono text-slate-300 px-2 py-1 flex-1 outline-none truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
                title="Copy canonical portfolio URL"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Primary Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  downloadSuccess
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
                }`}
                title="Download high-resolution QR PNG for print resumes"
              >
                {downloadSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <Download className="w-4 h-4 text-blue-400" />
                )}
                <span>{downloadSuccess ? 'Downloaded!' : 'Download PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                title="Print ready-to-share QR card or save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Print QR Card</span>
              </button>
            </div>

            {/* Test Link Button */}
            <div className="pt-1 text-center">
              <a
                href={canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-300 transition-colors"
              >
                <span>Test open canonical URL in new tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-center text-[11px] text-slate-400 print:hidden">
          💡 Ideal for resumes, interview handouts, business cards, LinkedIn banners, and conference badges.
        </div>
      </div>
    </div>
  );
};
