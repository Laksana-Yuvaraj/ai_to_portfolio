import React, { useState, useRef } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, ArrowLeft, CheckCircle2, Loader2, File, ShieldAlert, Clock, Globe, ArrowRight, Lock } from 'lucide-react';
import { PortfolioVersion, ResumeRecord } from '../types';

interface UploadModalProps {
  onSuccess: (portfolio: PortfolioVersion, resume: ResumeRecord) => void;
  onCancel: () => void;
  userId?: string;
  initialPastedText?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  onSuccess,
  onCancel,
  userId = 'usr_default',
  initialPastedText = '',
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>(initialPastedText ? 'text' : 'file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState(initialPastedText);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Pop-up notice state for 7-day auto-deletion confirmation
  const [uploadedNoticeData, setUploadedNoticeData] = useState<{
    portfolioVersion: PortfolioVersion;
    resumeRecord: ResumeRecord;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !pastedText.trim()) {
      setError('Please attach a resume file or paste text content.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress(15);
    setStatusMessage('Uploading resume document...');

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('resumeFile', selectedFile);
      }
      if (pastedText.trim()) {
        formData.append('pastedText', pastedText.trim());
      }
      formData.append('userId', userId);

      // Simulate step progress for user feedback
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(timer);
            return 85;
          }
          if (prev === 15) {
            setStatusMessage('Gemini AI extracting structured JSON skills, experience & projects...');
          } else if (prev === 55) {
            setStatusMessage('Generating animated vector avatar & static permanent portfolio site...');
          }
          return prev + 15;
        });
      }, 700);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(timer);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to parse resume.');
      }

      const result = await response.json();
      setProgress(100);
      setStatusMessage('Portfolio created successfully!');

      // Set notice state to display the mandatory 7-day auto-delete popup notice
      setUploadedNoticeData({
        portfolioVersion: result.portfolioVersion,
        resumeRecord: result.resumeRecord,
      });
      setIsUploading(false);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setError(err.message || 'An error occurred during resume parsing.');
      setIsUploading(false);
    }
  };

  if (uploadedNoticeData) {
    const formattedDate = new Date(uploadedNoticeData.resumeRecord.expiresAt).toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
        <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          
          {/* Top Notice Badge */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider mb-1">
                <Clock className="w-3 h-3" /> Privacy Auto-Cleanup Notice
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                Resume Scheduled for Deletion in 7 Days
              </h3>
            </div>
          </div>

          {/* Body Notice Details */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-2 font-semibold text-slate-200">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>{uploadedNoticeData.resumeRecord.fileName}</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-semibold">
                  7 Days Remaining
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  <strong className="text-amber-300">Automatic Document Deletion:</strong> Your uploaded resume source file will be <strong className="text-rose-400">automatically & permanently deleted</strong> from our servers on <u className="text-amber-200 font-semibold">{formattedDate}</u> (in 7 days) to protect your privacy.
                </p>
                <p>
                  <strong className="text-emerald-400">Permanent Portfolio Website:</strong> Your generated interactive portfolio (<span className="text-blue-400 font-mono">Version #{uploadedNoticeData.portfolioVersion.versionNumber}</span>) and avatar <strong className="text-emerald-300">remain live forever</strong> and will NOT be deleted when the source file expires.
                </p>
              </div>
            </div>

            {/* Privacy highlights bullet grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Auto-Purged in 7 Days</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2 text-slate-300">
                <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Permanent Portfolio Link</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-end">
            <button
              onClick={() => {
                const data = uploadedNoticeData;
                setUploadedNoticeData(null);
                onSuccess(data.portfolioVersion, data.resumeRecord);
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>I Understand & View Generated Portfolio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Upload Resume & Generate Portfolio</h3>
              <p className="text-xs text-slate-400">AI parses content into a permanent animated portfolio site</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'file'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload File (PDF / DOCX / TXT)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'text'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Resume Text</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'file' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-blue-500 bg-blue-500/10'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <File className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-white text-sm">{selectedFile.name}</span>
                  <span className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop to replace
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200 text-sm block">
                      Drag & Drop your resume file here
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Supports PDF, DOCX, DOC, or TXT up to 15MB
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Paste Resume Text Content
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste work experience, education, skills, and summary here..."
                rows={8}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
              />
            </div>
          )}

          {/* Privacy Security Callout */}
          <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs text-slate-300 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-300 font-semibold block mb-0.5">7-Day Privacy Guarantee:</strong>
              Uploaded resume files are stored securely and automatically deleted after 7 days. Your generated portfolio website stays live permanently at its static URL.
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Progress Indicator */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  {statusMessage}
                </span>
                <span className="font-mono font-bold text-blue-400">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Portfolio Version</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
