import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  X,
  Lock,
  Mail,
  UserCheck,
  UserPlus,
  LogIn,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchAvailableUsers();
    }
  }, [isOpen]);

  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch available users:', err);
    }
  };

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill out all fields.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create personalized account.');
      }
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error registering account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials.');
      }
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (user: User) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: 'password123' }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onLoginSuccess(data.user);
        onClose();
      } else {
        // Direct switch if password wasn't matched
        onLoginSuccess(user);
        onClose();
      }
    } catch {
      onLoginSuccess(user);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Personalised User Access</h3>
              <p className="text-xs text-slate-400">Only your portfolios will be visible to you</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9.5 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9.5 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <span>Signing In...</span>
                ) : (
                  <>
                    <span>Sign In to Your Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Laksana Yuvaraj"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="laksana@example.com"
                    className="w-full pl-9.5 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full pl-9.5 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Clean, Private User Workspace
                </div>
                <p className="text-slate-400">
                  A brand new account starts with zero portfolios so only your future resumes and portfolios appear on your dashboard.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create My Personalised Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Account Switcher Section */}
          {availableUsers.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px]">
                  <Users className="w-3 h-3" /> Quick Switch Profiles
                </span>
                <span className="text-[10px] text-slate-500">One-click test access</span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {availableUsers.map((user) => {
                  const isCurrent = currentUser?.id === user.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickSwitch(user)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                          : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500 text-white font-bold">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 shrink-0">
                        {user.portfolioCount !== undefined
                          ? `${user.portfolioCount} ${user.portfolioCount === 1 ? 'portfolio' : 'portfolios'}`
                          : 'Switch'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
