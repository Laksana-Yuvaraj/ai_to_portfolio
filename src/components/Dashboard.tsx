import React, { useState, useEffect } from 'react';
import { PortfolioVersion, ResumeRecord, CleanupStats, User } from '../types';
import { AnimatedAvatar } from './AnimatedAvatar';
import { EmptyStateGraphic } from './EmptyStateGraphic';
import { CreatorAuditView } from './CreatorAuditView';
import {
  Sparkles,
  Upload,
  Globe,
  Clock,
  ShieldCheck,
  Check,
  Sliders,
  Trash2,
  ExternalLink,
  RefreshCw,
  FileText,
  AlertTriangle,
  Layers,
  ArrowRight,
  Volume2,
  Lock,
  User as UserIcon,
  LogIn,
  Users,
  Crown,
} from 'lucide-react';

interface DashboardProps {
  portfolios: PortfolioVersion[];
  resumes: ResumeRecord[];
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onUploadClick: () => void;
  onSampleUploadClick?: () => void;
  onViewPortfolio: (id: string) => void;
  onOpenCustomizer: (portfolio: PortfolioVersion) => void;
  onSetCanonical: (id: string) => void;
  onDeletePortfolio: (id: string) => void;
  onDeleteResumeImmediately: (resumeId: string) => void;
  onRefreshData: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  portfolios,
  resumes,
  currentUser,
  onOpenAuthModal,
  onUploadClick,
  onSampleUploadClick,
  onViewPortfolio,
  onOpenCustomizer,
  onSetCanonical,
  onDeletePortfolio,
  onDeleteResumeImmediately,
  onRefreshData,
}) => {
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null);
  const [isRunningCleanup, setIsRunningCleanup] = useState(false);
  const [cleanupNotification, setCleanupNotification] = useState<string | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'my_portfolios' | 'creator_audit'>('my_portfolios');

  const isCreator = Boolean(
    currentUser?.isCreator ||
    currentUser?.email?.toLowerCase() === 'laksanayuvaraj6@gmail.com'
  );

  useEffect(() => {
    fetchCleanupStats();
  }, [resumes]);

  const fetchCleanupStats = async () => {
    try {
      const res = await fetch('/api/cleanup/status');
      if (res.ok) {
        const data = await res.json();
        setCleanupStats(data);
      }
    } catch (err) {
      console.error('Error fetching cleanup stats:', err);
    }
  };

  const handleRunCleanup = async () => {
    setIsRunningCleanup(true);
    setCleanupNotification(null);
    try {
      const res = await fetch('/api/admin/run-cleanup', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCleanupNotification(data.message);
        onRefreshData();
      }
    } catch (err) {
      console.error('Error running cleanup:', err);
    } finally {
      setIsRunningCleanup(false);
    }
  };

  const canonicalPortfolio = portfolios.find((p) => p.isCanonical) || portfolios[0];

  const calculateDaysRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired (Pending Cleanup)';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Personalised User Access Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {currentUser ? currentUser.name : 'Guest User'}
                </span>
                {isCreator ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40 flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5 text-amber-400" /> App Creator
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Private Workspace
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {currentUser ? currentUser.email : 'Personalised access enabled: only your portfolios are visible'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Switch / Sign In</span>
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs (Personal Workspace vs Creator Master Audit) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDashboardTab('my_portfolios')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                dashboardTab === 'my_portfolios'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>My Workspace ({portfolios.length})</span>
            </button>

            <button
              onClick={() => setDashboardTab('creator_audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                dashboardTab === 'creator_audit'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                  : 'bg-slate-900 text-amber-300 hover:text-white border border-amber-500/30'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Creator Master Audit</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-200 font-mono">
                All Created & Deleted
              </span>
            </button>
          </div>

          {isCreator && (
            <div className="text-[11px] font-medium text-amber-300 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Creator View (Laksana Yuvaraj)</span>
            </div>
          )}
        </div>

        {dashboardTab === 'creator_audit' ? (
          <CreatorAuditView
            onViewPortfolio={onViewPortfolio}
            onBackToMyDashboard={() => setDashboardTab('my_portfolios')}
          />
        ) : (
          <>
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Resume-to-Animated-Portfolio Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Portfolio Version Control
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Each uploaded resume creates a permanent, static portfolio version. Resumes auto-delete after 7 days for privacy while your portfolios stay live forever.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <button
              onClick={onUploadClick}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New Resume</span>
            </button>
          </div>
        </div>

        {/* Render CSS-Animated Empty State Graphic if User Has No Portfolios */}
        {portfolios.length === 0 ? (
          <EmptyStateGraphic
            userName={currentUser?.name || 'there'}
            userEmail={currentUser?.email}
            onUploadClick={onUploadClick}
            onSampleUploadClick={onSampleUploadClick}
          />
        ) : (
          <>
            {/* Canonical Link Highlight Bar */}
            {canonicalPortfolio && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-1">
                      <Check className="w-3 h-3" /> Canonical Profile Link
                    </span>
                    <span className="text-xs text-slate-400">
                      Version #{canonicalPortfolio.versionNumber} ({canonicalPortfolio.data.name})
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span>{window.location.origin}/portfolio/{canonicalPortfolio.id}</span>
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onViewPortfolio(canonicalPortfolio.id)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <span>View Live Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Avatar Voice & Resume Summary Studio */}
            {canonicalPortfolio && (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="space-y-4 max-w-xl text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Voice Resume Narration</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">
                    Listen to Your Avatar Speak Your Resume
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Your character avatar speaks the contents directly extracted from your uploaded resume or customized dashboard portfolio. Click the voice controls to hear your professional audio summary aloud!
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-slate-400">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      🎙️ Real-time Web Voice Synthesis
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
                      💬 Live Subtitle Speech Bubble
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center">
                  <AnimatedAvatar
                    config={canonicalPortfolio.config}
                    portfolioData={canonicalPortfolio.data}
                    size="md"
                    interactive={true}
                  />
                </div>
              </div>
            )}

            {/* 7-Day Resume Auto-Delete Privacy Engine Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>7-Day Resume Privacy & Cleanup Engine</span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Uploaded resume files are deleted from storage 7 days after upload. Generated portfolio sites remain accessible forever.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunCleanup}
                  disabled={isRunningCleanup}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningCleanup ? 'animate-spin' : ''}`} />
                  <span>Run 7-Day Cleanup Worker Now</span>
                </button>
              </div>

              {cleanupNotification && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{cleanupNotification}</span>
                </div>
              )}

              {/* Stored Resumes List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Uploaded Resume Storage Status ({resumes.filter((r) => !r.isDeleted).length} Files Stored)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resumes.map((res) => (
                    <div
                      key={res.id}
                      className={`p-4 rounded-2xl border ${
                        res.isDeleted
                          ? 'bg-slate-950/60 border-slate-800/60 opacity-75'
                          : 'bg-slate-950 border-slate-800'
                      } flex items-center justify-between gap-4`}
                    >
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="font-bold text-white text-xs truncate">{res.fileName}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Uploaded {new Date(res.uploadedAt).toLocaleDateString()}</span>
                          <span>•</span>
                          {res.isDeleted ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Auto-Deleted on {new Date(res.deletedAt || '').toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {calculateDaysRemaining(res.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {!res.isDeleted && (
                        <button
                          onClick={() => onDeleteResumeImmediately(res.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1"
                          title="Delete resume file immediately while keeping generated portfolio site live"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete File Now</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Portfolio Versions Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  <span>Generated Portfolio Versions ({portfolios.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                      portfolio.isCanonical
                        ? 'bg-slate-900 border-blue-500/50 shadow-xl shadow-blue-500/5'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold text-xs">
                          Version #{portfolio.versionNumber}
                        </span>

                        {portfolio.isCanonical ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-1">
                            <Check className="w-3 h-3" /> Canonical Main
                          </span>
                        ) : (
                          <button
                            onClick={() => onSetCanonical(portfolio.id)}
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                          >
                            Set as Canonical
                          </button>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-white truncate">{portfolio.data.name}</h3>
                        <p className="text-xs text-blue-400 font-medium truncate">{portfolio.data.title}</p>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {portfolio.data.summary}
                      </p>

                      <div className="pt-3 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
                        <div className="flex justify-between">
                          <span>Created Date:</span>
                          <span className="font-mono text-slate-200">
                            {new Date(portfolio.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Source Resume File:</span>
                          <span className="font-mono text-slate-200 truncate max-w-[150px]">
                            {portfolio.sourceResumeFileName}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span>Source File Status:</span>
                          {portfolio.sourceResumeDeleted ? (
                            <span className="text-emerald-400 font-medium">Deleted (Portfolio Live Forever)</span>
                          ) : (
                            <span className="text-amber-400 font-medium">Stored (Auto-deletes in 7d)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onViewPortfolio(portfolio.id)}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>View Site</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onOpenCustomizer(portfolio)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Customize Theme & Avatar"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeletePortfolio(portfolio.id)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors"
                        title="Delete Portfolio Version"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
          </>
        )}

      </div>
    </div>
  );
};
