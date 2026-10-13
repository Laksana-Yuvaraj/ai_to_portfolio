import React from 'react';
import { Upload, Sparkles, FileText, ArrowRight, ShieldCheck, Volume2, Wand2, Star, CheckCircle2 } from 'lucide-react';

interface EmptyStateGraphicProps {
  userName?: string;
  userEmail?: string;
  onUploadClick: () => void;
  onSampleUploadClick?: () => void;
}

export const EmptyStateGraphic: React.FC<EmptyStateGraphicProps> = ({
  userName = 'there',
  userEmail,
  onUploadClick,
  onSampleUploadClick,
}) => {
  return (
    <div className="relative p-8 sm:p-12 lg:p-16 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden text-center">
      
      {/* Background Ambient Glow & Starfields */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-10 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      {/* Embedded Animation Keyframes */}
      <style>{`
        @keyframes floatLevitate {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(0.5deg); }
        }
        @keyframes scanBeam {
          0% { top: 10%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        @keyframes spinOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes reverseOrbit {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes badgeBob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes shimmerLine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Central CSS-Animated Holographic Graphic */}
      <div className="relative z-10 max-w-lg mx-auto mb-10 flex flex-col items-center">
        
        {/* Orbital Rings Layer */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
          
          {/* Outer Dashed Orbit Ring */}
          <div
            className="absolute inset-0 rounded-full border border-dashed border-blue-500/20 pointer-events-none"
            style={{ animation: 'spinOrbit 28s linear infinite' }}
          />

          {/* Middle Counter-Rotating Glow Ring */}
          <div
            className="absolute inset-6 rounded-full border border-sky-400/25 pointer-events-none"
            style={{ animation: 'reverseOrbit 20s linear infinite' }}
          />

          {/* Floating Orbit Tech Badges */}
          <div
            className="absolute -top-2 left-6 px-3 py-1 rounded-full bg-blue-950/90 border border-blue-500/40 text-[11px] font-mono font-semibold text-sky-300 shadow-lg flex items-center gap-1.5"
            style={{ animation: 'badgeBob 3.5s ease-in-out infinite' }}
          >
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>3D Pixar Avatar</span>
          </div>

          <div
            className="absolute top-1/2 -right-6 -translate-y-1/2 px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-[11px] font-mono font-semibold text-indigo-300 shadow-lg flex items-center gap-1.5"
            style={{ animation: 'badgeBob 4.2s ease-in-out infinite 1s' }}
          >
            <Volume2 className="w-3 h-3 text-indigo-400" />
            <span>Voice Narration</span>
          </div>

          <div
            className="absolute -bottom-2 left-10 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-[11px] font-mono font-semibold text-emerald-300 shadow-lg flex items-center gap-1.5"
            style={{ animation: 'badgeBob 3.8s ease-in-out infinite 0.5s' }}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>7-Day Privacy Cleanup</span>
          </div>

          {/* Central Floating Holographic Resume Sheet */}
          <div
            className="relative w-44 sm:w-52 h-56 sm:h-64 rounded-2xl bg-gradient-to-b from-slate-850 via-slate-900 to-slate-950 border-2 border-blue-500/40 shadow-2xl shadow-blue-500/20 p-4 sm:p-5 flex flex-col justify-between overflow-hidden"
            style={{ animation: 'floatLevitate 4.5s ease-in-out infinite' }}
          >
            
            {/* Luminous Animated Laser Scanner Line */}
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] pointer-events-none z-20"
              style={{ animation: 'scanBeam 3s ease-in-out infinite' }}
            />

            {/* Document Header Skeleton */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="space-y-1">
                    <div className="w-20 h-2.5 rounded bg-slate-700/80" />
                    <div className="w-14 h-1.5 rounded bg-blue-400/60" />
                  </div>
                </div>
                <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Star className="w-3 h-3" />
                </div>
              </div>

              {/* Shimmering Content Lines */}
              <div className="space-y-2 pt-2">
                <div
                  className="w-full h-2 rounded bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%]"
                  style={{ animation: 'shimmerLine 2s linear infinite' }}
                />
                <div
                  className="w-4/5 h-2 rounded bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%]"
                  style={{ animation: 'shimmerLine 2s linear infinite 0.3s' }}
                />
                <div
                  className="w-3/5 h-2 rounded bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%]"
                  style={{ animation: 'shimmerLine 2s linear infinite 0.6s' }}
                />
              </div>

              {/* Skill Pill Mockups */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-[9px] font-mono text-blue-300">
                  Skills
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono text-emerald-300">
                  Projects
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[9px] font-mono text-purple-300">
                  Degree
                </span>
              </div>
            </div>

            {/* Document Bottom Pulsing Prompt */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-sky-400 font-medium">
                <Wand2 className="w-3 h-3 animate-spin" /> Ready to parse
              </span>
              <span className="font-mono text-slate-400">0 KB</span>
            </div>

          </div>
        </div>
      </div>

      {/* Engaging Copy & Details */}
      <div className="relative z-10 max-w-2xl mx-auto space-y-4">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>First-Time Portfolio Setup</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          No Portfolios Created Yet
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
          Welcome, <strong className="text-white font-semibold">{userName}</strong>! Your personal workspace is ready. Upload your resume (PDF, DOCX, or paste text) to automatically generate your interactive animated portfolio website in seconds.
        </p>

        {userEmail && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Personalised access enabled for <strong className="text-slate-200">{userEmail}</strong></span>
          </div>
        )}

        {/* Feature Benefit Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <div className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant AI Parsing</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Zero manual typing. Gemini extracts your projects, skills, education, and career experience.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>3D Character Avatar</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive Pixar-style 3D avatar with head tracking and audible speech summary narration.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1">
            <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>7-Day Auto Cleanup</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Raw resume files are auto-deleted after 7 days, while your portfolio site stays live forever.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onUploadClick}
            className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Your First Resume</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onSampleUploadClick && (
            <button
              onClick={onSampleUploadClick}
              className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Paste / Test With Sample Resume</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
