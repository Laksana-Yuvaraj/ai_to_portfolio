import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PortfolioData, PortfolioVersion, PortfolioAestheticStyle } from '../types';
import { AnimatedAvatar } from './AnimatedAvatar';
import { GlitteringStarsBackground } from './GlitteringStarsBackground';
import {
  parseFullResumeNarration,
  parseExecutiveSummaryNarration,
  sanitizeNarrationText,
  getStructuredSentencesFromResume,
  SpokenSentenceItem,
} from '../utils/resumeNarrationParser';
import {
  Github,
  Linkedin,
  Globe,
  Twitter,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  ExternalLink,
  Code2,
  Share2,
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Sliders,
  ChevronRight,
  Layers,
  Copy,
  Send,
  Palette,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Headphones,
  Radio,
  FileText,
  ChevronDown,
  ChevronUp,
  QrCode,
} from 'lucide-react';
import { ShareQrModal } from './ShareQrModal';

interface PortfolioViewProps {
  portfolio: PortfolioVersion;
  isOwner?: boolean;
  onOpenCustomizer?: () => void;
  onBackToDashboard?: () => void;
  onSetCanonical?: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  portfolio,
  isOwner = false,
  onOpenCustomizer,
  onBackToDashboard,
  onSetCanonical,
}) => {
  const [copied, setCopied] = useState(false);
  const [contactHovered, setContactHovered] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const data: PortfolioData = portfolio.data;
  const config = data.avatarConfig;

  // Web Speech API Character Narration States
  const [fullResumeNarration, setFullResumeNarration] = useState<string>('');
  const [executiveSummaryNarration, setExecutiveSummaryNarration] = useState<string>('');
  const [narrationMode, setNarrationMode] = useState<'full' | 'summary'>('full');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>(
    config?.gender || 'female'
  );
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);
  const [sentenceQueue, setSentenceQueue] = useState<SpokenSentenceItem[]>([]);
  const [currentSentenceText, setCurrentSentenceText] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeSubIndex, setActiveSubIndex] = useState<number | undefined>(undefined);
  const [boundaryCharIndex, setBoundaryCharIndex] = useState<number>(-1);
  const [boundaryCharLength, setBoundaryCharLength] = useState<number>(0);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Speech engine refs
  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const keepAliveTimerRef = useRef<any>(null);
  const currentSentenceIndexRef = useRef<number>(0);
  const sentenceQueueRef = useRef<SpokenSentenceItem[]>([]);
  const lastScrolledSectionRef = useRef<string | null>(null);

  // Active narration script based on selected mode
  const currentActiveNarrationText = narrationMode === 'full' 
    ? fullResumeNarration 
    : executiveSummaryNarration;

  // 1. Bind voice list and synthesis event listener on mount/unmount
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const handleVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    handleVoicesChanged();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 2. CRITICAL BINDING: Verify and bind the synthesis event listener and full resume parsing
  // directly to the portfolio data load!
  useEffect(() => {
    if (!portfolio || !portfolio.data) return;

    // Parse complete, authentic resume content without placeholders
    const fullText = parseFullResumeNarration(portfolio.data);
    const execText = parseExecutiveSummaryNarration(portfolio.data);

    setFullResumeNarration(fullText);
    setExecutiveSummaryNarration(execText);

    // Generate section-tagged structured sentences
    const structuredSentences = getStructuredSentencesFromResume(portfolio.data, narrationMode);

    sentenceQueueRef.current = structuredSentences;
    setSentenceQueue(structuredSentences);

    // If active speech is running and new portfolio data loads, stop previous speech and reset pointers
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setActiveSentenceIndex(0);
      currentSentenceIndexRef.current = 0;
      setCurrentSentenceText('');
      setActiveSectionId(null);
      setActiveSubIndex(undefined);
      setBoundaryCharIndex(-1);
      setBoundaryCharLength(0);
      lastScrolledSectionRef.current = null;
      if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    }
  }, [
    portfolio.id,
    portfolio.versionNumber,
    portfolio.data?.name,
    portfolio.data?.title,
    portfolio.data?.summary,
    portfolio.data?.experience,
    portfolio.data?.projects,
    portfolio.data?.skills,
    portfolio.data?.education,
    portfolio.data?.certifications,
    narrationMode,
  ]);

  // Keep voiceGender synced if avatar config gender changes
  useEffect(() => {
    if (config?.gender) {
      setVoiceGender(config.gender);
    }
  }, [config?.gender]);

  // Find best natural voice for selected gender
  const getBestVoice = useCallback((gender: 'female' | 'male'): SpeechSynthesisVoice | null => {
    const voices = availableVoices.length > 0
      ? availableVoices
      : ('speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);

    if (voices.length === 0) return null;

    const englishVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    if (gender === 'female') {
      const femaleKeywords = ['female', 'samantha', 'victoria', 'karen', 'zira', 'susan', 'jenny', 'serena', 'moira', 'fiona', 'veena', 'tessa'];
      const match = pool.find((v) => femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw)));
      if (match) return match;
      const natural = pool.find((v) => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google'));
      if (natural) return natural;
      return pool[0];
    } else {
      const maleKeywords = ['male', 'daniel', 'alex', 'david', 'george', 'fred', 'oliver', 'rishi', 'tom', 'james'];
      const match = pool.find((v) => maleKeywords.some((kw) => v.name.toLowerCase().includes(kw)));
      if (match) return match;
      const maleFallback = pool.find((v) => !v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('samantha') && !v.name.toLowerCase().includes('zira'));
      return maleFallback || pool[0];
    }
  }, [availableVoices]);

  // Execute sentence-by-sentence queue with utterance listeners and onboundary word tracking
  const speakNextSentenceInQueue = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const queue = sentenceQueueRef.current;
    const currentIndex = currentSentenceIndexRef.current;

    if (currentIndex >= queue.length) {
      // Completed narration
      setIsSpeaking(false);
      setIsPaused(false);
      setActiveSentenceIndex(0);
      currentSentenceIndexRef.current = 0;
      setCurrentSentenceText('');
      setActiveSectionId(null);
      setActiveSubIndex(undefined);
      setBoundaryCharIndex(-1);
      setBoundaryCharLength(0);
      lastScrolledSectionRef.current = null;
      activeUtterancesRef.current = [];
      if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
      return;
    }

    const item = queue[currentIndex];
    const sentence = item.sentence;
    setCurrentSentenceText(sentence);
    setActiveSentenceIndex(currentIndex);
    setActiveSectionId(item.sectionId);
    setActiveSubIndex(item.subIndex);
    setBoundaryCharIndex(-1);
    setBoundaryCharLength(0);

    // Automatically scroll the active section into the center of the viewport whenever a new section starts being read aloud
    if (item.sectionId && item.sectionId !== lastScrolledSectionRef.current && typeof document !== 'undefined') {
      lastScrolledSectionRef.current = item.sectionId;
      const targetEl = document.getElementById(item.sectionId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    const selectedVoice = getBestVoice(voiceGender);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = voiceGender === 'female' ? 1.05 : 0.95;

    // Properly bind utterance event listeners, including boundary events for word highlighting
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === 'word' || event.charIndex !== undefined) {
        setBoundaryCharIndex(event.charIndex);
        setBoundaryCharLength(event.charLength || 5);
      }
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setActiveSectionId(item.sectionId);
      setActiveSubIndex(item.subIndex);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utterance.onend = () => {
      currentSentenceIndexRef.current += 1;
      speakNextSentenceInQueue();
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      console.warn('Utterance error:', e);
      currentSentenceIndexRef.current += 1;
      speakNextSentenceInQueue();
    };

    // Keep reference in array to avoid garbage collection in Chromium
    activeUtterancesRef.current.push(utterance);
    window.speechSynthesis.speak(utterance);
  }, [getBestVoice, voiceGender]);

  // Keep-alive timer to prevent Chrome 15s pause glitch
  const startKeepAliveTimer = useCallback(() => {
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    keepAliveTimerRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 9000);
  }, []);

  const handleStartSpeaking = useCallback((targetGender: 'female' | 'male' = voiceGender) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Your browser does not support text-to-speech audio.');
      return;
    }

    window.speechSynthesis.cancel();
    activeUtterancesRef.current = [];
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);

    const structuredSentences = getStructuredSentencesFromResume(portfolio.data, narrationMode);

    sentenceQueueRef.current = structuredSentences;
    setSentenceQueue(structuredSentences);
    currentSentenceIndexRef.current = 0;
    setActiveSentenceIndex(0);
    setBoundaryCharIndex(-1);
    setBoundaryCharLength(0);
    lastScrolledSectionRef.current = null;

    if (structuredSentences.length > 0) {
      setActiveSectionId(structuredSentences[0].sectionId);
      setActiveSubIndex(structuredSentences[0].subIndex);
    }

    startKeepAliveTimer();
    speakNextSentenceInQueue();
  }, [voiceGender, narrationMode, portfolio.data, startKeepAliveTimer, speakNextSentenceInQueue]);

  const handleToggleSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    } else {
      handleStartSpeaking(voiceGender);
    }
  }, [isSpeaking, isPaused, voiceGender, handleStartSpeaking]);

  const handleStopSpeech = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveSentenceIndex(0);
    currentSentenceIndexRef.current = 0;
    setCurrentSentenceText('');
    setActiveSectionId(null);
    setActiveSubIndex(undefined);
    setBoundaryCharIndex(-1);
    setBoundaryCharLength(0);
    lastScrolledSectionRef.current = null;
    activeUtterancesRef.current = [];
  }, []);

  const handleVoiceGenderChange = useCallback((gender: 'female' | 'male') => {
    setVoiceGender(gender);
    if (isSpeaking) {
      // Re-trigger with new voice seamlessly
      setTimeout(() => {
        handleStartSpeaking(gender);
      }, 50);
    }
  }, [isSpeaking, handleStartSpeaking]);

  const handleNarrationModeChange = (mode: 'full' | 'summary') => {
    setNarrationMode(mode);
    if (isSpeaking) {
      handleStopSpeech();
    }
  };

  // Social Share URLs
  const portfolioUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/portfolio/${portfolio.id}`
    : `/portfolio/${portfolio.id}`;

  const shareText = `Check out ${data.name}'s interactive animated portfolio site!`;

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(portfolioUrl)}`;
  const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portfolioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.name} - Portfolio`,
          text: shareText,
          url: portfolioUrl,
        });
      } catch (err) {
        console.log('Native share closed or not available');
      }
    } else {
      handleCopyLink();
    }
  };

  // Aesthetic theme design tokens supporting all styles (Cosmic Blue with glittering stars, modern, minimalist, corporate, cyberpunk, warm editorial)
  const currentAestheticStyle: PortfolioAestheticStyle = data.aestheticStyle || 'modern';

  const aestheticThemeConfig = {
  cosmic_stars: {
    bg: 'bg-[#03071b] text-blue-50',
    headerBg: 'bg-[#03071b]/80 border-blue-900/50 backdrop-blur-xl',
    cardBg: 'bg-[#0b1739]/80 border-blue-800/60 shadow-xl shadow-blue-950/60',
    accentText: 'text-sky-300',
    accentBg: 'bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/30',
    badgeBg: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
    sectionAltBg: 'bg-[#050e29]/60',
    sectionDivider: 'border-blue-900/50',
    timelineDot: 'border-sky-400 shadow-[0_0_12px_#38bdf8]',
    timelineDotInner: 'bg-sky-300',
    timelineLine: 'before:bg-blue-900/60',
    skillChip: 'bg-[#0e2154] text-sky-100 border-blue-800 hover:border-sky-400',
    contactCard: 'bg-[#0a1638] border-blue-800 shadow-2xl',
    label: 'Cosmic Stars',
  },
  cyberpunk: {
    bg: 'bg-black text-emerald-100',
    headerBg: 'bg-black/90 border-emerald-900/50 backdrop-blur-xl',
    cardBg: 'bg-zinc-950 border-emerald-500/30 shadow-xl shadow-emerald-950/30 hover:border-emerald-400/70',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-lg shadow-emerald-500/40',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    sectionAltBg: 'bg-neutral-950/70',
    sectionDivider: 'border-emerald-900/40',
    timelineDot: 'border-emerald-400 shadow-[0_0_12px_#10b981]',
    timelineDotInner: 'bg-emerald-400',
    timelineLine: 'before:bg-emerald-950',
    skillChip: 'bg-black text-emerald-300 border-emerald-800 hover:border-emerald-400',
    contactCard: 'bg-zinc-950 border-emerald-500/40 shadow-2xl',
    label: 'Cyberpunk Neon',
  },
  warm_editorial: {
    bg: 'bg-[#18110c] text-amber-50',
    headerBg: 'bg-[#18110c]/90 border-amber-900/40 backdrop-blur-xl',
    cardBg: 'bg-[#261c16]/85 border-amber-800/40 shadow-xl shadow-amber-950/40 hover:border-amber-500/50',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30',
    badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-600/40',
    sectionAltBg: 'bg-[#1e1510]/60',
    sectionDivider: 'border-amber-900/40',
    timelineDot: 'border-amber-400 shadow-[0_0_12px_#f59e0b]',
    timelineDotInner: 'bg-amber-400',
    timelineLine: 'before:bg-amber-950',
    skillChip: 'bg-[#30221a] text-amber-200 border-amber-800 hover:border-amber-400',
    contactCard: 'bg-[#261c16] border-amber-800/50 shadow-2xl',
    label: 'Warm Editorial',
  },
  minimalist: {
    bg: 'bg-[#0f1115] text-zinc-100',
    headerBg: 'bg-[#0f1115]/90 border-zinc-800 backdrop-blur-md',
    cardBg: 'bg-[#161920] border-zinc-700/60 shadow-none hover:border-zinc-400',
    accentText: 'text-zinc-100 font-semibold',
    accentBg: 'bg-zinc-100 hover:bg-white text-zinc-900 font-bold',
    badgeBg: 'bg-zinc-800/80 text-zinc-300 border-zinc-700',
    sectionAltBg: 'bg-[#12141a]',
    sectionDivider: 'border-zinc-800',
    timelineDot: 'border-zinc-300',
    timelineDotInner: 'bg-zinc-200',
    timelineLine: 'before:bg-zinc-800',
    skillChip: 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-zinc-400',
    contactCard: 'bg-[#161920] border-zinc-700',
    label: 'Minimalist Clean',
  },
  modern: {
    bg: 'bg-slate-950 text-slate-100',
    headerBg: 'bg-slate-950/80 border-slate-800 backdrop-blur-lg',
    cardBg: 'bg-slate-900/90 border-slate-800 shadow-xl hover:border-slate-700',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    sectionAltBg: 'bg-slate-950/60',
    sectionDivider: 'border-slate-800',
    timelineDot: 'border-blue-500 shadow-md',
    timelineDotInner: 'bg-blue-400',
    timelineLine: 'before:bg-slate-800',
    skillChip: 'bg-slate-800 text-slate-200 border-slate-700 hover:border-blue-500',
    contactCard: 'bg-slate-900 border-slate-800 shadow-2xl',
    label: 'Modern Slate',
  },
};

  // Map customization theme keys to aesthetic tokens
  const rawThemeKey = 
    data.aestheticStyle || 
    data.avatarConfig?.theme || 
    config?.theme || 
    'modern';

  const themeKeyMap: Record<string, string> = {
    slate: 'modern',
    neon: 'cyberpunk',
    pastel: 'minimalist',
    midnight: 'cosmic_stars',
    corporate: 'corporate',
    cosmic_stars: 'cosmic_stars',
    modern: 'modern',
    minimalist: 'minimalist',
    cyberpunk: 'cyberpunk',
    warm_editorial: 'warm_editorial',
  };

  const activeThemeKey = themeKeyMap[rawThemeKey] || rawThemeKey;
  const currentTheme = (aestheticThemeConfig as any)[activeThemeKey] || aestheticThemeConfig.modern;

  const topSkills = data.skills?.flatMap((s) => s.items).slice(0, 6) || [];

  return (
    <div className={`min-h-screen font-sans ${currentTheme.bg} transition-colors duration-500 relative`}>
      {/* Glittering Stars Animated Background Layer for Cosmic/Midnight Styles */}
      {(activeThemeKey === 'cosmic_stars' || rawThemeKey === 'midnight' || rawThemeKey === 'neon') && (
        <GlitteringStarsBackground isContained={false} count={110} />
      )}

      {/* Owner Control Bar */}
      {isOwner && (
        <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold text-xs">
                Version #{portfolio.versionNumber}
              </span>
              {portfolio.isCanonical ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-xs flex items-center gap-1">
                  <Check className="w-3 h-3" /> Canonical Main Link
                </span>
              ) : (
                <span className="text-slate-400 text-xs hidden sm:inline">Secondary Version</span>
              )}

              {/* Active Aesthetic Style Pill */}
              {onOpenCustomizer && (
                <button
                  onClick={onOpenCustomizer}
                  className="px-2.5 py-0.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-blue-500/50"
                  title="Change Portfolio Theme in Customizer"
                >
                  <Palette className="w-3 h-3 text-blue-400" />
                  <span>Theme: {currentTheme.label}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onBackToDashboard && (
                <button
                  onClick={onBackToDashboard}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium text-xs"
                >
                  Dashboard
                </button>
              )}
              {onOpenCustomizer && (
                <button
                  onClick={onOpenCustomizer}
                  className="px-3 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 transition-colors font-medium text-xs flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Customize Theme & Persona
                </button>
              )}
              {!portfolio.isCanonical && onSetCanonical && (
                <button
                  onClick={onSetCanonical}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-medium text-xs"
                >
                  Set as Main Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Permanent Live Link Preservation Notice if Portfolio is Deleted / Archived */}
      {portfolio.isDeleted && (
        <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2 backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Permanent Live Link:</strong> This portfolio version was {portfolio.deletedReason === 'automatic_cleanup' ? 'automatically cleaned from workspace' : 'wantedly deleted by author'}, but its public link remains <strong>permanently live and active</strong>!
          </span>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className={`border-b ${currentTheme.headerBg} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-md">
                {data.name.charAt(0)}
              </div>
              {isSpeaking && !isPaused && (
                <span id="header-avatar-pulse" className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-slate-900" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-100 tracking-tight text-base sm:text-lg block leading-none">
                  {data.name}
                </span>
                {isSpeaking && (
                  <button
                    id="header-speaking-indicator"
                    onClick={handleToggleSpeech}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-300 cursor-pointer ${
                      isPaused
                        ? 'bg-amber-950/70 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
                        : 'bg-amber-500/20 border-amber-400/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40 hover:bg-amber-500/30'
                    }`}
                    title={isPaused ? "Speech synthesis paused (click to resume)" : "Speech synthesis active (click to pause)"}
                  >
                    {!isPaused ? (
                      <span className="flex items-end gap-0.5 h-2.5">
                        <span className="w-0.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                        <span className="w-0.5 h-2.5 bg-amber-300 rounded-full animate-bounce" />
                        <span className="w-0.5 h-1 bg-amber-400 rounded-full animate-pulse" />
                        <span className="w-0.5 h-2 bg-amber-300 rounded-full animate-bounce" />
                      </span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                    <span className="uppercase tracking-wider text-[9px] font-mono">
                      {isPaused ? 'Paused' : 'Speaking'}
                    </span>
                  </button>
                )}
              </div>
              <span className={`text-xs ${currentTheme.accentText} font-medium block mt-0.5`}>
                {data.title}
              </span>
            </div>
          </div>


          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#experience" className="hover:text-white transition-colors">Experience</a>
            <a href="#projects" className="hover:text-white transition-colors">Projects</a>
            <a href="#skills" className="hover:text-white transition-colors">Skills</a>
            <a href="#education" className="hover:text-white transition-colors">Education</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>

          {/* Header Action & Social Profile Bar */}
          <div className="flex items-center gap-2">
            {/* Social Profile Links - Rendered ONLY if present in user resume */}
            {data.links?.github && (
              <a
                href={data.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                title="GitHub Profile"
              >
                <Github className="w-4 h-4" />
              </a>
            )}

            {data.links?.linkedin && (
              <a
                href={data.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-blue-400 transition-colors"
                title="LinkedIn Profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}

            {data.links?.twitter && (
              <a
                href={data.links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-sky-400 transition-colors"
                title="Twitter / X Profile"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}

            {data.links?.website && (
              <a
                href={data.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-colors"
                title="Personal Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}

            {/* Share via QR Code Button */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Share portfolio via QR Code"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Share QR</span>
            </button>

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500'
              }`}
              title="Copy canonical portfolio URL"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section - Matching Reference Photo Workspace Aesthetic */}
      <section
        id="hero"
        className={`relative pt-10 pb-20 overflow-hidden border-b transition-all duration-300 ${currentTheme.sectionDivider} ${
          isSpeaking && activeSectionId === 'hero' ? 'speaking-active-card ring-2 ring-amber-500/50' : ''
        }`}
      >
        
        {/* Starfield Cosmic / Aesthetic Background Particle Accents */}
        <div className={`absolute inset-0 ${currentTheme.heroOverlay} pointer-events-none`}>
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
          {/* Cosmic Glowing Flares */}
          <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-blue-600/15 filter blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-600/10 filter blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Bold Name, Skills, Open to Work, CTA Buttons */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Open to Work Badge (Matching reference image) */}
              {data.openToWork !== false && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Open To Work</span>
                </div>
              )}

              {/* Bold Hero Display Name (Matching PRAVARIKA reference typography style) */}
              <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase leading-none font-serif sm:font-sans transition-all ${
                isSpeaking && activeSectionId === 'hero' ? 'decoration-amber-400 underline underline-offset-8 decoration-4' : ''
              }`}>
                {data.name}
              </h1>

              {/* Subtitle / Role */}
              <p className={`text-sm sm:text-base font-bold tracking-widest uppercase transition-colors ${
                isSpeaking && activeSectionId === 'hero' ? 'text-amber-300' : 'text-slate-300'
              }`}>
                {data.customTagline || `${data.title} · SOFTWARE ENGINEER`}
              </p>

              {/* Skill Chips (Matching reference image chips: JAVA, GRAILS, JENKINS, PYTHON, AWS) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                {topSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all border ${currentTheme.skillChip}`}
                  >
                    {sk}
                  </span>
                ))}
              </div>

              {/* Action Buttons (VIEW PROJECTS & GITHUB > matching reference image) */}
              {/* Action Buttons (VIEW PROJECTS, RESUME LINKS, SHARE QR & CONTACT) */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <a
                  href="#projects"
                  className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg border ${currentTheme.actionSecondary}`}
                >
                  <span>View Projects</span>
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </a>

                {data.links?.github && (
                  <a
                    href={data.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}

                {data.links?.linkedin && (
                  <a
                    href={data.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                )}

                {data.links?.website && (
                  <a
                    href={data.links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/25"
                    title="Website"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white shadow-lg"
                  title="Generate printable QR Code"
                >
                  <QrCode className="w-4 h-4 text-blue-400" />
                  <span>Share QR</span>
                </button>

                <a
                  href="#contact"
                  onMouseEnter={() => setContactHovered(true)}
                  onMouseLeave={() => setContactHovered(false)}
                  className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${currentTheme.actionSecondary}`}
                >
                  <Mail className={`w-4 h-4 ${currentTheme.accentText}`} />
                  <span>Contact</span>
                </a>
              </div>

              {/* AI Character Speech Synthesis Audio Resume Deck */}
              <div className="pt-2">
                <div className={`p-4 rounded-2xl border backdrop-blur-md transition-all shadow-xl text-left ${
                  isSpeaking 
                    ? 'bg-slate-900/90 border-amber-500/50 ring-1 ring-amber-500/30' 
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${
                        isSpeaking 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        <Headphones className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            AI Character Audio Resume
                          </span>
                          {isSpeaking && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              {isPaused ? 'Paused' : 'Playing Audio'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {narrationMode === 'full' 
                            ? 'Full Resume Walkthrough: Reads complete work history, projects, skills & education' 
                            : 'Executive Pitch: 45-second high-impact career elevator summary'}
                        </p>
                      </div>
                    </div>

                    {/* Mode Selector Toggle: Full Resume vs. Executive Pitch */}
                    <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => handleNarrationModeChange('full')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          narrationMode === 'full'
                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Comprehensive Walkthrough: Reads complete resume content"
                      >
                        Full Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNarrationModeChange('summary')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          narrationMode === 'summary'
                            ? 'bg-blue-600 text-white font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Executive Pitch: 45-second summary"
                      >
                        Executive Pitch
                      </button>
                    </div>
                  </div>

                  {/* Primary Audio Controls & Gender Options */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleSpeech}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                          isSpeaking
                            ? isPaused
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-500/30 shadow-emerald-600/30'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                        }`}
                      >
                        {isSpeaking ? (
                          isPaused ? (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Resume Voice</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current" />
                              <span>Pause Voice</span>
                            </>
                          )
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Listen to {narrationMode === 'full' ? 'Full Resume' : 'Executive Pitch'}</span>
                          </>
                        )}
                      </button>

                      {isSpeaking && (
                        <button
                          type="button"
                          onClick={handleStopSpeech}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950 border border-slate-800 text-rose-400 hover:text-rose-300 transition-colors"
                          title="Stop Audio Narration"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}

                      {/* Equalizer Sound Waves Animation when Speaking */}
                      {isSpeaking && !isPaused && (
                        <div className="flex items-end gap-1 h-5 px-2">
                          <span className="w-1 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_100ms] h-4" />
                          <span className="w-1 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_300ms] h-5" />
                          <span className="w-1 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_200ms] h-3" />
                          <span className="w-1 bg-amber-400 rounded-full animate-[bounce_0.8s_infinite_400ms] h-4" />
                        </div>
                      )}
                    </div>

                    {/* Voice Selection (Female vs Male) */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Voice:</span>
                      <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => handleVoiceGenderChange('female')}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-all flex items-center gap-1 ${
                            voiceGender === 'female'
                              ? 'bg-pink-600 text-white font-bold shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span>👩 Female</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVoiceGenderChange('male')}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-all flex items-center gap-1 ${
                            voiceGender === 'male'
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span>👨 Male</span>
                        </button>
                      </div>

                      {/* View Live Transcript toggle */}
                      <button
                        type="button"
                        onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                        className={`p-2 rounded-xl border text-xs transition-colors flex items-center gap-1 ${
                          isTranscriptOpen
                            ? 'bg-slate-800 text-slate-100 border-slate-700'
                            : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border-slate-800'
                        }`}
                        title="Toggle Live Spoken Transcript"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Transcript</span>
                        {isTranscriptOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Live Sentence Display & Progress with onboundary word-level underline highlight */}
                  {isSpeaking && currentSentenceText && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/40 ring-1 ring-amber-500/20 text-left">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 font-mono font-bold">
                            Sentence {activeSentenceIndex + 1} of {sentenceQueue.length}
                          </span>
                          {activeSectionId && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] uppercase border border-amber-500/30">
                              Active: {activeSectionId}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-300">
                          {Math.round(((activeSentenceIndex + 1) / Math.max(1, sentenceQueue.length)) * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {boundaryCharIndex >= 0 ? (
                          <>
                            <span className="text-slate-400">"{currentSentenceText.slice(0, boundaryCharIndex)}</span>
                            <span className="speaking-word-highlight font-bold underline decoration-amber-400 decoration-2 underline-offset-4">
                              {currentSentenceText.slice(
                                boundaryCharIndex,
                                boundaryCharIndex + (boundaryCharLength || 5)
                              )}
                            </span>
                            <span>{currentSentenceText.slice(boundaryCharIndex + (boundaryCharLength || 5))}"</span>
                          </>
                        ) : (
                          <span className="italic">"{currentSentenceText}"</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Full Expandable Transcript Box */}
                  {isTranscriptOpen && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-left max-h-52 overflow-y-auto text-xs leading-relaxed space-y-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-slate-400 text-[11px] font-semibold">
                        <span>Full Narration Script ({narrationMode === 'full' ? 'Complete Resume' : 'Executive Pitch'})</span>
                        <span className="text-[10px] font-mono text-slate-400">{sentenceQueue.length} sentences</span>
                      </div>
                      <div className="text-slate-300 space-y-1.5">
                        {sentenceQueue.map((item, idx) => (
                          <span
                            key={idx}
                            className={`inline mr-1.5 px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                              isSpeaking && idx === activeSentenceIndex
                                ? 'bg-amber-500/25 text-amber-300 font-semibold ring-1 ring-amber-500/50 underline decoration-amber-400 decoration-2 underline-offset-2'
                                : 'text-slate-300 hover:text-white'
                            }`}
                            onClick={() => {
                              currentSentenceIndexRef.current = idx;
                              lastScrolledSectionRef.current = null;
                              speakNextSentenceInQueue();
                            }}
                            title={`Section: ${item.sectionId} (Click to jump speech)`}
                          >
                            <span className="text-[9px] uppercase font-mono text-slate-500 mr-1">[{item.sectionId}]</span>
                            {item.sentence}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Links & Share Bar */}
              <div className={`pt-4 border-t ${currentTheme.sectionDivider} flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400`}>
                {/* Resume Profile Links - ONLY rendered if mentioned in user's resume */}
                {(data.links?.github || data.links?.linkedin || data.links?.twitter || data.links?.website) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-300 mr-1">Profiles:</span>
                    {data.links?.github && (
                      <a
                        href={data.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
                        title="GitHub"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {data.links?.linkedin && (
                      <a
                        href={data.links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-blue-400 font-medium flex items-center gap-1.5 transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {data.links?.twitter && (
                      <a
                        href={data.links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-sky-400 font-medium flex items-center gap-1.5 transition-colors"
                        title="Twitter / X"
                      >
                        <Twitter className="w-3.5 h-3.5" />
                        <span>Twitter / X</span>
                      </a>
                    )}
                    {data.links?.website && (
                      <a
                        href={data.links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-medium flex items-center gap-1.5 transition-colors"
                        title="Website"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <div />
                )}

                {/* Share Portfolio Options: QR Code & Copy Link */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Generate printable QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>Share via QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-medium flex items-center gap-1.5 transition-colors"
                    title="Copy portfolio URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Interactive Animated Character Studio */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative">
                <AnimatedAvatar
                  config={{ ...config, gender: voiceGender }}
                  portfolioData={data}
                  size="xl"
                  interactive={true}
                  ctaHovered={contactHovered}
                  customSpeechText={currentActiveNarrationText}
                  externalSpeechState={{
                    isSpeaking,
                    isPaused,
                    voiceGender,
                    spokenText: currentSentenceText || currentActiveNarrationText,
                    onToggleSpeech: handleToggleSpeech,
                    onStopSpeech: handleStopSpeech,
                    onVoiceGenderChange: handleVoiceGenderChange,
                  }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* About & Summary Section */}
      <section
        id="about"
        className={`py-16 border-b transition-all duration-300 ${currentTheme.sectionDivider} ${
          isSpeaking && activeSectionId === 'about' ? 'speaking-active-card' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.accentText}`}>
              About & Summary
            </h2>
            <h3 className={`text-3xl font-bold text-white transition-colors ${
              isSpeaking && activeSectionId === 'about' ? 'decoration-amber-400 underline underline-offset-4 decoration-2' : ''
            }`}>
              Professional Overview
            </h3>
            <p className={`text-base leading-relaxed transition-all duration-300 ${
              isSpeaking && activeSectionId === 'about'
                ? 'text-amber-200 bg-amber-500/10 p-4 rounded-xl border border-amber-500/30'
                : 'text-slate-300'
            }`}>
              {data.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className={`p-6 rounded-2xl border backdrop-blur-sm ${currentTheme.cardBg}`}>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Experience</h4>
              <p className="text-sm text-slate-400">
                {data.experience.length} key professional positions held across top engineering teams.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border backdrop-blur-sm ${currentTheme.cardBg}`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Code2 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Core Tech</h4>
              <p className="text-sm text-slate-400">
                {topSkills.join(', ')} and more.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border backdrop-blur-sm ${currentTheme.cardBg}`}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Education</h4>
              <p className="text-sm text-slate-400">
                {data.education[0]?.degree || 'Higher Degree'} in {data.education[0]?.field || 'Computer Science'}.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Timeline Section */}
      <section
        id="experience"
        className={`py-16 border-b transition-all duration-300 ${currentTheme.sectionDivider} ${currentTheme.sectionAltBg} ${
          isSpeaking && activeSectionId === 'experience' ? 'speaking-active-card' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.accentText}`}>
              Career History
            </h2>
            <h3 className={`text-3xl font-bold text-white mt-1 transition-all ${
              isSpeaking && activeSectionId === 'experience' ? 'decoration-amber-400 underline underline-offset-4 decoration-2' : ''
            }`}>
              Work Experience
            </h3>
          </div>

          <div className={`space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:md:left-1/2 before:-ml-px before:w-0.5 ${currentTheme.timelineLine}`}>
            {data.experience.map((exp, idx) => {
              const isCardActive = isSpeaking && activeSectionId === 'experience' && (activeSubIndex === idx || activeSubIndex === undefined);
              return (
                <div
                  key={exp.id || idx}
                  className="relative flex flex-col md:flex-row items-start group"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute left-3.5 md:left-1/2 -translate-x-1/2 top-1.5 w-7 h-7 rounded-full bg-slate-900 border-2 ${
                    isCardActive ? 'border-amber-400 ring-4 ring-amber-400/30' : currentTheme.timelineDot
                  } flex items-center justify-center z-10 shadow-md transition-all`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${isCardActive ? 'bg-amber-400 animate-ping' : currentTheme.timelineDotInner}`} />
                  </div>

                  {/* Content Card */}
                  <div className={`ml-10 md:ml-0 md:w-1/2 ${idx % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'}`}>
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                      isCardActive
                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                        : currentTheme.cardBg
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          isCardActive ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : currentTheme.badgeBg
                        }`}>
                          {exp.dates}
                        </span>
                        {exp.location && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {exp.location}
                          </span>
                        )}
                      </div>

                      <h4 className={`text-xl font-bold transition-colors ${isCardActive ? 'text-amber-300 underline decoration-amber-400 decoration-2 underline-offset-4' : 'text-white'}`}>
                        {exp.role}
                      </h4>
                      <p className={`text-sm font-semibold mb-3 ${currentTheme.accentText}`}>{exp.company}</p>

                      <p className="text-sm text-slate-300 leading-relaxed mb-4">{exp.description}</p>

                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="space-y-2 mb-4 text-left text-xs text-slate-300">
                        {exp.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className={`w-3.5 h-3.5 ${currentTheme.accentText} shrink-0 mt-0.5`} />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                      <div className={`flex flex-wrap gap-1.5 pt-2 border-t ${currentTheme.sectionDivider}`}>
                        {exp.skillsUsed.map((sk, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${currentTheme.skillChip}`}
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Projects Grid Section */}
      {data.projects && data.projects.length > 0 && (
        <section
          id="projects"
          className={`py-16 border-b transition-all duration-300 ${currentTheme.sectionDivider} ${
            isSpeaking && activeSectionId === 'projects' ? 'speaking-active-card' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.accentText}`}>
                Featured Engineering
              </h2>
              <h3 className={`text-3xl font-bold text-white mt-1 transition-all ${
                isSpeaking && activeSectionId === 'projects' ? 'decoration-amber-400 underline underline-offset-4 decoration-2' : ''
              }`}>
                Key Projects & Products
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.projects.map((proj, idx) => {
                const isProjectActive = isSpeaking && activeSectionId === 'projects' && (activeSubIndex === idx || activeSubIndex === undefined);
                return (
                  <div
                    key={proj.id || idx}
                    className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between group ${
                      isProjectActive
                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                        : currentTheme.cardBg
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                          isProjectActive
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                            : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                        }`}>
                          #{idx + 1}
                        </div>
                        {proj.metrics && (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                            isProjectActive
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          }`}>
                            {proj.metrics}
                          </span>
                        )}
                      </div>

                      <h4 className={`text-xl font-bold mb-2 transition-colors ${
                        isProjectActive
                          ? 'text-amber-300 underline decoration-amber-400 decoration-2 underline-offset-4'
                          : 'text-white group-hover:text-blue-400'
                      }`}>
                        {proj.title}
                      </h4>

                      <p className="text-sm text-slate-300 leading-relaxed mb-6">
                        {proj.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {proj.tags.map((tag, i) => (
                          <span
                            key={i}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${currentTheme.skillChip}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className={`flex items-center gap-4 pt-4 border-t ${currentTheme.sectionDivider}`}>
                        {proj.demoUrl && (
                          <a
                            href={proj.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs font-semibold ${currentTheme.accentText} hover:underline flex items-center gap-1.5`}
                          >
                            <span>Live Demo</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>Code Repository</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Skills Section */}
      {data.skills && data.skills.length > 0 && (
        <section
          id="skills"
          className={`py-16 border-b transition-all duration-300 ${currentTheme.sectionDivider} ${currentTheme.sectionAltBg} ${
            isSpeaking && activeSectionId === 'skills' ? 'speaking-active-card' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.accentText}`}>
                Technical Capabilities
              </h2>
              <h3 className={`text-3xl font-bold text-white mt-1 transition-all ${
                isSpeaking && activeSectionId === 'skills' ? 'decoration-amber-400 underline underline-offset-4 decoration-2' : ''
              }`}>
                Skills & Tech Stack
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {data.skills.map((cat, idx) => {
                const isCatActive = isSpeaking && activeSectionId === 'skills' && (activeSubIndex === idx || activeSubIndex === undefined);
                return (
                  <div
                    key={idx}
                    className={`p-6 rounded-2xl border transition-all duration-300 ${
                      isCatActive
                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                        : currentTheme.cardBg
                    }`}
                  >
                    <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${currentTheme.sectionDivider}`}>
                      <Layers className={`w-5 h-5 ${isCatActive ? 'text-amber-400' : currentTheme.accentText}`} />
                      <h4 className={`text-lg font-bold ${isCatActive ? 'text-amber-300' : 'text-white'}`}>{cat.category}</h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((skill, i) => (
                        <span
                          key={i}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                            isCatActive
                              ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                              : currentTheme.skillChip
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Education & Certifications Section */}
      <section
        id="education"
        className={`py-16 border-b transition-all duration-300 ${currentTheme.sectionDivider} ${
          isSpeaking && activeSectionId === 'education' ? 'speaking-active-card' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Education */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <GraduationCap className={`w-6 h-6 ${currentTheme.accentText}`} />
                <h3 className={`text-2xl font-bold text-white transition-all ${
                  isSpeaking && activeSectionId === 'education' ? 'decoration-amber-400 underline underline-offset-4 decoration-2' : ''
                }`}>
                  Education
                </h3>
              </div>

              <div className="space-y-6">
                {data.education.map((edu, idx) => {
                  const isEduActive = isSpeaking && activeSectionId === 'education' && (activeSubIndex === idx || activeSubIndex === undefined);
                  return (
                    <div
                      key={edu.id || idx}
                      className={`p-6 rounded-2xl border transition-all duration-300 ${
                        isEduActive
                          ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                          : currentTheme.cardBg
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`text-lg font-bold ${isEduActive ? 'text-amber-300' : 'text-white'}`}>{edu.institution}</h4>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                          isEduActive ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : currentTheme.badgeBg
                        }`}>
                          {edu.dates}
                        </span>
                      </div>
                      <p className={`text-sm font-semibold mb-1 ${currentTheme.accentText}`}>
                        {edu.degree} {edu.field && `in ${edu.field}`}
                      </p>
                      {edu.gpa && (
                        <p className="text-xs text-slate-400 mb-2">GPA / Honors: {edu.gpa}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Certifications */}
            {data.certifications && data.certifications.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-6 h-6 text-amber-400" />
                  <h3 className="text-2xl font-bold text-white">Certifications</h3>
                </div>

                <div className="space-y-6">
                  {data.certifications.map((cert, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border ${currentTheme.cardBg}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-white">{cert.title}</h4>
                        <span className="text-xs text-amber-400 font-semibold">{cert.date}</span>
                      </div>
                      <p className="text-sm text-slate-400">Issued by {cert.issuer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className={`py-20 relative overflow-hidden transition-all duration-300 ${
          isSpeaking && activeSectionId === 'contact' ? 'speaking-active-card' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl border shadow-2xl text-center space-y-8 transition-all ${
            isSpeaking && activeSectionId === 'contact'
              ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-500/10'
              : currentTheme.contactCard
          }`}>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Available for New Opportunities</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Get In Touch
            </h2>

            <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Interested in collaborating or hiring? Reach out directly via email or phone.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              {data.contact.email && (
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(data.contact.email)}&su=${encodeURIComponent('Inquiry from Portfolio')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-6 py-3.5 rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2.5 ${currentTheme.accentBg}`}
                >
                  <Mail className="w-5 h-5" />
                  <span>{data.contact.email}</span>
                </a>
            )}

              {data.contact.phone && (
                <div className="px-6 py-3.5 rounded-2xl bg-slate-800 text-slate-200 border border-slate-700 font-medium flex items-center gap-2">
                  <Phone className={`w-4 h-4 ${currentTheme.accentText}`} />
                  <span>{data.contact.phone}</span>
                </div>
              )}
            </div>

            {/* Footer Links & Share Bar */}
            <div className={`pt-8 border-t ${currentTheme.sectionDivider} flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4`}>
              <span>© {new Date().getFullYear()} {data.name}. All rights reserved.</span>
              
              <div className="flex items-center gap-3">
                {/* Social Profile Links - Rendered ONLY if present in user resume */}
                {data.links?.github && (
                  <a
                    href={data.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors p-1"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {data.links?.linkedin && (
                  <a
                    href={data.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors p-1"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {data.links?.twitter && (
                  <a
                    href={data.links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sky-400 transition-colors p-1"
                    title="Twitter / X"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {data.links?.website && (
                  <a
                    href={data.links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 transition-colors p-1"
                    title="Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}

                <span className="text-slate-600">|</span>

                {/* Share via QR Code */}
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  className="hover:text-blue-400 transition-colors p-1 flex items-center gap-1.5"
                  title="Share via QR Code"
                >
                  <QrCode className="w-4 h-4 text-blue-400" />
                  <span className="text-[11px] font-semibold text-slate-300">Share QR</span>
                </button>

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="hover:text-emerald-400 transition-colors p-1 flex items-center gap-1.5"
                  title="Copy portfolio URL"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span className="text-[11px] font-semibold">{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Share via QR Code Modal */}
      <ShareQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        canonicalUrl={portfolioUrl}
        portfolioData={data}
        versionNumber={portfolio.versionNumber}
      />
    </div>
  );
};
