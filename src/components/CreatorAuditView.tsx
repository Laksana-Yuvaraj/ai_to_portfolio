import React, { useState, useEffect } from 'react';
import { PortfolioVersion, User, ResumeRecord } from '../types';
import {
  ShieldAlert,
  Globe,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
  User as UserIcon,
  Trash2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Clock,
  FileText,
  Lock,
} from 'lucide-react';

interface CreatorAuditViewProps {
  onViewPortfolio: (id: string) => void;
  onBackToMyDashboard?: () => void;
}

interface AuditSummary {
  totalPortfolios: number;
  activePortfolios: number;
  deletedByUser: number;
  autoCleaned: number;
  totalUsers: number;
}

export const CreatorAuditView: React.FC<CreatorAuditViewProps> = ({
  onViewPortfolio,
  onBackToMyDashboard,
}) => {
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioVersion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'user_deleted' | 'auto_cleaned'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/creator/audit');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setPortfolios(data.portfolios || []);
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching creator audit:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (portfolioId: string) => {
    const url = `${window.location.origin}/portfolio/${portfolioId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(portfolioId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRestore = async (portfolioId: string) => {
    setActionLoadingId(portfolioId);
    try {
      const res = await fetch(`/api/portfolios/${portfolioId}/restore`, { method: 'POST' });
      if (res.ok) {
        setActionMessage(`Portfolio ${portfolioId} restored to active dashboard status!`);
        await fetchAuditData();
      }
    } catch (err) {
      console.error('Error restoring portfolio:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSimulateAutoClean = async (portfolioId: string) => {
    setActionLoadingId(portfolioId);
    try {
      const res = await fetch(`/api/portfolios/${portfolioId}/auto-clean`, { method: 'POST' });
      if (res.ok) {
        setActionMessage(`Portfolio ${portfolioId} marked as automatically cleaned. Public link remains LIVE forever!`);
        await fetchAuditData();
      }
    } catch (err) {
      console.error('Error simulating auto-cleanup:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredPortfolios = portfolios.filter((p) => {
    // Search match
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = p.data?.name?.toLowerCase().includes(searchLower);
    const titleMatch = p.data?.title?.toLowerCase().includes(searchLower);
    const emailMatch = p.userEmail?.toLowerCase().includes(searchLower);
    const idMatch = p.id.toLowerCase().includes(searchLower);
    const matchesSearch = !searchTerm || nameMatch || titleMatch || emailMatch || idMatch;

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === 'active') return !p.isDeleted;
    if (statusFilter === 'user_deleted') return p.isDeleted && p.deletedReason !== 'automatic_cleanup';
    if (statusFilter === 'auto_cleaned') return p.isDeleted && p.deletedReason === 'automatic_cleanup';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Creator Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-500/40 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Creator Master Audit Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>All Created & Deleted Portfolios</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Creator: <strong>Laksana Yuvaraj</strong> (<span className="text-amber-300 font-mono">laksanayuvaraj6@gmail.com</span>).
              Every portfolio ever created, whether currently active or deleted (wantedly by user or automatically cleaned), remains visible here with permanent live public links!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onBackToMyDashboard && (
              <button
                onClick={onBackToMyDashboard}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
              >
                ← Back to My Workspace
              </button>
            )}
            <button
              onClick={fetchAuditData}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Audit Metric Counters */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Total Ever Created</span>
            <p className="text-2xl font-black text-white mt-1">{summary.totalPortfolios}</p>
            <span className="text-[10px] text-slate-500">100% permanently preserved</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30">
            <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400">Active Live Sites</span>
            <p className="text-2xl font-black text-emerald-400 mt-1">{summary.activePortfolios}</p>
            <span className="text-[10px] text-emerald-500/80">In user workspaces</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30">
            <span className="text-[11px] uppercase font-bold tracking-wider text-rose-400">Wantedly Deleted</span>
            <p className="text-2xl font-black text-rose-400 mt-1">{summary.deletedByUser}</p>
            <span className="text-[10px] text-rose-400/80 font-medium">Public link remains live!</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30">
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400">Auto-Cleaned</span>
            <p className="text-2xl font-black text-amber-400 mt-1">{summary.autoCleaned}</p>
            <span className="text-[10px] text-amber-400/80 font-medium">Public link remains live!</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 col-span-2 sm:col-span-1">
            <span className="text-[11px] uppercase font-bold tracking-wider text-blue-400">Registered Users</span>
            <p className="text-2xl font-black text-blue-400 mt-1">{summary.totalUsers}</p>
            <span className="text-[10px] text-blue-500/80">Isolated access</span>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Author Name, Email, Portfolio ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === 'all' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({portfolios.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({portfolios.filter((p) => !p.isDeleted).length})
          </button>
          <button
            onClick={() => setStatusFilter('user_deleted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === 'user_deleted' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            User Deleted ({portfolios.filter((p) => p.isDeleted && p.deletedReason !== 'automatic_cleanup').length})
          </button>
          <button
            onClick={() => setStatusFilter('auto_cleaned')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusFilter === 'auto_cleaned' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Auto-Cleaned ({portfolios.filter((p) => p.isDeleted && p.deletedReason === 'automatic_cleanup').length})
          </button>
        </div>
      </div>

      {/* Portfolio Audit Grid */}
      {filteredPortfolios.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
          <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No portfolios match current filter</h3>
          <p className="text-xs text-slate-500">Try changing the search query or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPortfolios.map((portfolio) => {
            const author = users.find((u) => u.id === portfolio.userId);
            const authorName = portfolio.userName || author?.name || 'User';
            const authorEmail = portfolio.userEmail || author?.email || 'N/A';
            const liveUrl = `${window.location.origin}/portfolio/${portfolio.id}`;

            return (
              <div
                key={portfolio.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  portfolio.isDeleted
                    ? portfolio.deletedReason === 'automatic_cleanup'
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      v#{portfolio.versionNumber}
                    </span>

                    {portfolio.isDeleted ? (
                      portfolio.deletedReason === 'automatic_cleanup' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Auto-Cleaned (Link Live!)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Wantedly Deleted (Link Live!)
                        </span>
                      )
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active Live
                      </span>
                    )}
                  </div>

                  {/* Portfolio Name & Title */}
                  <div>
                    <h3 className="text-base font-bold text-white truncate">{portfolio.data.name}</h3>
                    <p className="text-xs text-blue-400 font-medium truncate">{portfolio.data.title}</p>
                  </div>

                  {/* Author Meta */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        <UserIcon className="w-3 h-3 text-amber-400" />
                        {authorName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{authorEmail}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Created: {new Date(portfolio.createdAt).toLocaleDateString()}</span>
                      {portfolio.deletedAt && (
                        <span className="text-rose-400">Deleted: {new Date(portfolio.deletedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Permanent Live URL with copy */}
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
                    <div className="truncate font-mono text-slate-400 text-[10px] flex items-center gap-1">
                      <Globe className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="truncate">{liveUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(portfolio.id)}
                      className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
                      title="Copy Permanent Live Link"
                    >
                      {copiedId === portfolio.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onViewPortfolio(portfolio.id)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                    title="Visit and confirm permanent live link"
                  >
                    <span>Open Live Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {portfolio.isDeleted ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(portfolio.id)}
                      disabled={actionLoadingId === portfolio.id}
                      className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Restore to active dashboard"
                    >
                      <RotateCcw className={`w-3 h-3 ${actionLoadingId === portfolio.id ? 'animate-spin' : ''}`} />
                      <span>Restore</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSimulateAutoClean(portfolio.id)}
                      disabled={actionLoadingId === portfolio.id}
                      className="py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-medium transition-colors"
                      title="Test auto-cleaning this portfolio to verify link remains live"
                    >
                      <span>Simulate Auto-Clean</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
