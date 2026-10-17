import React, { useState, useEffect } from 'react';
import { PortfolioVersion, ResumeRecord, PortfolioData, User } from './types';
import { PortfolioView } from './components/PortfolioView';
import { Dashboard } from './components/Dashboard';
import { UploadModal } from './components/UploadModal';
import { CustomizerModal } from './components/CustomizerModal';
import { AuthModal } from './components/AuthModal';
import { Sparkles, Layers, Upload, ArrowLeft, Users, Lock, LogIn } from 'lucide-react';

const SAMPLE_RESUME_TEXT = `Laksana Yuvaraj
Senior Full-Stack AI Engineer & Creative Developer
Email: laksanayuvaraj6@gmail.com | Phone: +1 (555) 432-8921 | Location: San Francisco, CA
Portfolio: https://github.com/laksanayuvaraj

PROFESSIONAL SUMMARY
Dynamic, product-driven Senior Full-Stack Engineer with 6+ years specializing in modern web architectures (React, TypeScript, Node.js), generative AI integrations, and responsive interactive UX. Passionate about building delightful user-centric applications, automated version control systems, and engaging visual experiences.

TECHNICAL SKILLS
• Languages & Frameworks: TypeScript, JavaScript (ESNext), React, Next.js, Node.js, Express, Tailwind CSS, Python
• AI & Machine Learning: Google Gemini API, Prompt Engineering, Structured JSON Outputs, Web Speech Synthesis
• Architecture & Systems: RESTful APIs, Distributed Systems, Cloud Run, Microservices, CI/CD Pipelines
• Tools & Database: Git, Docker, Vite, PostgreSQL, Redis, Jest, Playwright

WORK EXPERIENCE
Senior Full-Stack Engineer | Apex AI Innovations | 2022 - Present
• Architected real-time portfolio generation engine converting unstructured resume documents into interactive, responsive web applications.
• Implemented automated multi-version snapshotting and 7-day privacy auto-deletion data pipelines handling thousands of documents.
• Designed custom aesthetic themes and animated interactive avatar systems utilizing CSS transformations and Web Speech synthesis.

Full-Stack Software Engineer | CloudScale Systems | 2019 - 2022
• Developed modular micro-frontend components in React and TypeScript, boosting core web vitals by 38%.
• Collaborated with UX teams to implement fluid CSS animations, high-contrast accessible color schemes, and seamless responsive layouts.

PROJECTS
• Live Resume AI Engine: Interactive platform transforming documents into animated portfolio sites with voice synthesis narration.
• Cloud Cleanse Daemon: Autonomous data privacy worker orchestrating 7-day data expiration lifecycle management.

EDUCATION
B.S. in Computer Science & Engineering | University of California | Magna Cum Laude`;

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'portfolio'>('dashboard');
  const [portfolios, setPortfolios] = useState<PortfolioVersion[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(null);
  const [externalPortfolio, setExternalPortfolio] = useState<PortfolioVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Modals & Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadInitialText, setUploadInitialText] = useState('');
  const [customizerPortfolio, setCustomizerPortfolio] = useState<PortfolioVersion | null>(null);

  useEffect(() => {
    initAuthAndPortfolios();
  }, []);

  const fetchStandalonePortfolio = async (id: string) => {
    try {
      const res = await fetch(`/api/portfolios/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.portfolio) {
          setExternalPortfolio(data.portfolio);
          return data.portfolio;
        }
      }
    } catch (err) {
      console.error('Error fetching standalone portfolio:', err);
    }
    return null;
  };

  const initAuthAndPortfolios = async () => {
    setIsLoading(true);
    let userToLoad: User | null = null;
    const storedUserId = localStorage.getItem('rp_current_user_id');

    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        const users: User[] = data.users || [];
        if (storedUserId) {
          userToLoad = users.find((u) => u.id === storedUserId) || null;
        }
        if (!userToLoad && users.length > 0) {
          // Default to the first user (Laksana Yuvaraj)
          userToLoad = users.find((u) => u.id === 'usr_default') || users[0];
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }

    if (userToLoad) {
      setCurrentUser(userToLoad);
      localStorage.setItem('rp_current_user_id', userToLoad.id);
      await fetchUserPortfolios(userToLoad.id);
    } else {
      setIsLoading(false);
    }

    // Check initial URL route
    const path = window.location.pathname;
    if (path.startsWith('/portfolio/')) {
      const idFromUrl = path.split('/portfolio/')[1];
      if (idFromUrl) {
        setActivePortfolioId(idFromUrl);
        setCurrentView('portfolio');
        await fetchStandalonePortfolio(idFromUrl);
      }
    }
  };

  const fetchUserPortfolios = async (userId: string) => {
    try {
      const res = await fetch(`/api/portfolios?userId=${encodeURIComponent(userId)}`, {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        const userPortfolios: PortfolioVersion[] = data.portfolios || [];
        const userResumes: ResumeRecord[] = data.resumes || [];
        setPortfolios(userPortfolios);
        setResumes(userResumes);

        // If activePortfolioId wasn't set from URL, set to canonical or first
        if (userPortfolios.length > 0) {
          const canonical = userPortfolios.find((p) => p.isCanonical) || userPortfolios[0];
          setActivePortfolioId(canonical.id);
        } else {
          setActivePortfolioId(null);
        }
      }
    } catch (err) {
      console.error('Error fetching portfolios for user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('rp_current_user_id', user.id);
    setIsAuthModalOpen(false);
    setIsLoading(true);
    fetchUserPortfolios(user.id);
    setCurrentView('dashboard');
  };

  const handleUploadSuccess = (newPortfolio: PortfolioVersion, newResume: ResumeRecord) => {
    setIsUploadOpen(false);
    setUploadInitialText('');
    setPortfolios((prev) => [newPortfolio, ...prev]);
    setResumes((prev) => [newResume, ...prev]);
    setActivePortfolioId(newPortfolio.id);
    setCurrentView('portfolio');
  };

  const handleSampleUploadClick = () => {
    setUploadInitialText(SAMPLE_RESUME_TEXT);
    setIsUploadOpen(true);
  };

  const handleNormalUploadClick = () => {
    setUploadInitialText('');
    setIsUploadOpen(true);
  };

  const handleViewPortfolio = async (id: string) => {
    setActivePortfolioId(id);
    setCurrentView('portfolio');
    window.history.pushState({}, '', `/portfolio/${id}`);
    if (!portfolios.some((p) => p.id === id)) {
      await fetchStandalonePortfolio(id);
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    window.history.pushState({}, '', '/');
  };

  const handleSetCanonical = async (id: string) => {
    try {
      const res = await fetch(`/api/portfolios/${id}/canonical`, { method: 'POST' });
      if (res.ok && currentUser) {
        await fetchUserPortfolios(currentUser.id);
      }
    } catch (err) {
      console.error('Error setting canonical:', err);
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Remove this portfolio from your active dashboard? The public portfolio link will remain LIVE forever, and is archived in the Creator Master Registry.')) {
      return;
    }
    try {
      const res = await fetch(`/api/portfolios/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'user_deleted' }),
      });
      if (res.ok && currentUser) {
        if (activePortfolioId === id) {
          setActivePortfolioId(null);
          setCurrentView('dashboard');
        }
        await fetchUserPortfolios(currentUser.id);
      }
    } catch (err) {
      console.error('Error deleting portfolio:', err);
    }
  };

  const handleDeleteResumeImmediately = async (resumeId: string) => {
    if (!confirm('Delete this source resume file immediately? The generated portfolio website will remain live forever.')) {
      return;
    }
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, { method: 'DELETE' });
      if (res.ok && currentUser) {
        await fetchUserPortfolios(currentUser.id);
      }
    } catch (err) {
      console.error('Error deleting resume file:', err);
    }
  };

  const handleSaveCustomizer = async (updatedData: PortfolioData) => {
    if (!customizerPortfolio) return;

    // 1. Immediately update local state so the screen and currentPortfolio update instantly
    setPortfolios((prev: any[]) =>
      prev.map((p) =>
        p.id === customizerPortfolio.id
          ? { ...p, data: { ...p.data, ...updatedData } }
          : p
      )
    );

    // 2. Close modal immediately
    setCustomizerPortfolio(null);

    // 3. Persist to server
    try {
      const res = await fetch(`/api/portfolios/${customizerPortfolio.id}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData, ...updatedData }),
      });

      if (!res.ok) {
        // Fallback for standard endpoint without /data suffix
        await fetch(`/api/portfolios/${customizerPortfolio.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: updatedData }),
        });
      }

      if (currentUser) {
        await fetchUserPortfolios(currentUser.id);
      }
    } catch (err) {
      console.error('Error updating portfolio customizer:', err);
    }
  };

  const currentPortfolio =
    portfolios.find((p) => p.id === activePortfolioId) ||
    (externalPortfolio && externalPortfolio.id === activePortfolioId ? externalPortfolio : null) ||
    portfolios[0] ||
    externalPortfolio;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center animate-spin">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Loading Your Personalized Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      
      {/* Top Application Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 py-2.5 text-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <button
              onClick={handleBackToDashboard}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dashboard ({portfolios.length} Versions)</span>
            </button>

            {currentPortfolio && (
              <button
                onClick={() => handleViewPortfolio(currentPortfolio.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  currentView === 'portfolio'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>View Portfolio (#{currentPortfolio.versionNumber})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* User Access Chip */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-left"
              title="Click to Switch User Account or Register"
            >
              <div className="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block">
                <span className="text-[11px] font-semibold text-slate-200 block leading-tight">
                  {currentUser?.name || 'Account'}
                </span>
                <span className="text-[9px] text-slate-400 block leading-tight">
                  Personal Access
                </span>
              </div>
            </button>

            <button
              onClick={handleNormalUploadClick}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Resume</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main View Router */}
      {currentView === 'dashboard' ? (
        <Dashboard
          portfolios={portfolios}
          resumes={resumes}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onUploadClick={handleNormalUploadClick}
          onSampleUploadClick={handleSampleUploadClick}
          onViewPortfolio={handleViewPortfolio}
          onOpenCustomizer={(p) => setCustomizerPortfolio(p)}
          onSetCanonical={handleSetCanonical}
          onDeletePortfolio={handleDeletePortfolio}
          onDeleteResumeImmediately={handleDeleteResumeImmediately}
          onRefreshData={() => currentUser && fetchUserPortfolios(currentUser.id)}
        />
      ) : currentPortfolio ? (
        <PortfolioView
          portfolio={currentPortfolio}
          isOwner={true}
          onOpenCustomizer={() => setCustomizerPortfolio(currentPortfolio)}
          onBackToDashboard={handleBackToDashboard}
          onSetCanonical={() => handleSetCanonical(currentPortfolio.id)}
        />
      ) : (
        <div className="p-12 text-center text-slate-400">
          <p className="mb-4">No portfolio found for your account.</p>
          <button
            onClick={handleNormalUploadClick}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Upload Resume to Generate First Portfolio
          </button>
        </div>
      )}

      {/* Modals */}
      {isUploadOpen && (
        <UploadModal
          userId={currentUser?.id || 'usr_default'}
          initialPastedText={uploadInitialText}
          onSuccess={handleUploadSuccess}
          onCancel={() => {
            setIsUploadOpen(false);
            setUploadInitialText('');
          }}
        />
      )}

      {customizerPortfolio && (
        <CustomizerModal
          initialData={customizerPortfolio.data}
          onSave={handleSaveCustomizer}
          onClose={() => setCustomizerPortfolio(null)}
        />
      )}

      {/* Personalized Login / Registration / Account Switch Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
