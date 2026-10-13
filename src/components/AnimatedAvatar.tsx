import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { AvatarConfig, PortfolioData } from '../types';
import { Sparkles, Terminal, Palette, BarChart3, Rocket, Code2, Camera, Volume2, VolumeX, Play, Pause, Square, MessageSquareQuote } from 'lucide-react';
import pixarAvatarImg from '../assets/images/disney_pixar_avatar_1785724980669.jpg';
import pixarMaleAvatarImg from '../assets/images/pixar_male_avatar_1791910367988.jpg';
import { parseFullResumeNarration, sanitizeNarrationText } from '../utils/resumeNarrationParser';

export interface ExternalSpeechState {
  isSpeaking: boolean;
  isPaused: boolean;
  voiceGender: 'female' | 'male';
  spokenText?: string;
  onToggleSpeech?: () => void;
  onStopSpeech?: () => void;
  onVoiceGenderChange?: (gender: 'female' | 'male') => void;
}

interface AnimatedAvatarProps {
  config?: AvatarConfig;
  portfolioData?: PortfolioData;
  customSpeechText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  ctaHovered?: boolean;
  className?: string;
  externalSpeechState?: ExternalSpeechState;
}

const defaultConfig: AvatarConfig = {
  archetype: 'developer',
  theme: 'slate',
  intensity: 'balanced',
  animationsEnabled: true,
  gender: 'female',
  hasGlasses: true,
};

export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
  config: providedConfig,
  portfolioData,
  customSpeechText,
  size = 'lg',
  interactive = true,
  ctaHovered = false,
  className = '',
  externalSpeechState,
}) => {
  const config = providedConfig || defaultConfig;
  const [isWaving, setIsWaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [viewMode, setViewMode] = useState<'pixar' | 'vector'>('pixar');
  
  // Speech Synthesis & Voice Gender States
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [speechBubbleOpen, setSpeechBubbleOpen] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>(
    config.gender || (portfolioData?.avatarConfig?.gender as 'female' | 'male') || 'female'
  );

  // Derive effective speech values either from external state or internal state
  const effectiveIsSpeaking = externalSpeechState ? externalSpeechState.isSpeaking : isSpeaking;
  const effectiveIsPaused = externalSpeechState ? externalSpeechState.isPaused : isPaused;
  const effectiveVoiceGender = externalSpeechState ? externalSpeechState.voiceGender : voiceGender;
  const effectiveSpokenText = externalSpeechState?.spokenText || spokenText;

  const [mouthViseme, setMouthViseme] = useState<number>(0); // 0=neutral, 1=vowel ah, 2=wide ee, 3=round oh
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Refs for keeping utterances alive in memory (preventing Chrome garbage collection bugs)
  const activeUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const sentenceQueueRef = useRef<string[]>([]);
  const currentSentenceIdxRef = useRef<number>(0);
  const keepAliveTimerRef = useRef<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync voice gender if config or portfolio data changes
  useEffect(() => {
    if (config.gender) {
      setVoiceGender(config.gender);
    } else if (portfolioData?.avatarConfig?.gender) {
      setVoiceGender(portfolioData.avatarConfig.gender as 'female' | 'male');
    }
  }, [config.gender, portfolioData?.avatarConfig?.gender]);

  // Open speech bubble whenever speaking begins
  useEffect(() => {
    if (effectiveIsSpeaking) {
      setSpeechBubbleOpen(true);
    }
  }, [effectiveIsSpeaking]);

  // Mouse tracking spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const eyeX = useSpring(useTransform(mouseX, [-200, 200], [-6, 6]), springConfig);
  const eyeY = useSpring(useTransform(mouseY, [-200, 200], [-4, 4]), springConfig);
  const headRotateX = useSpring(useTransform(mouseY, [-200, 200], [4, -4]), springConfig);
  const headRotateY = useSpring(useTransform(mouseX, [-200, 200], [-7, 7]), springConfig);

  // Load available speech synthesis voices from browser with proper event listener cleanup
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setAvailableVoices(v);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Natural Eye Blinking Timer (so character never looks static or idle)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3200);
    return () => clearInterval(blinkInterval);
  }, []);

  // Audio-reactive Mouth Viseme Flapping (words spoken directly through the mouth)
  useEffect(() => {
    if (!effectiveIsSpeaking || effectiveIsPaused) {
      setMouthViseme(0);
      return;
    }
    // Cycles through mouth opening visemes at conversational speaking pace (110ms)
    const mouthCycle = setInterval(() => {
      setMouthViseme((prev) => (prev + 1) % 4);
    }, 115);
    return () => clearInterval(mouthCycle);
  }, [effectiveIsSpeaking, effectiveIsPaused]);

  // Clean text helper
  const cleanNarrationText = (val?: string): string => {
    return sanitizeNarrationText(val);
  };

  // Construct resume narration summary text directly from the professional resume dashboard data
  const getNarrationText = (): string => {
    if (customSpeechText) return sanitizeNarrationText(customSpeechText);
    if (!portfolioData) {
      return "Hello! Welcome to my interactive animated portfolio website. Feel free to explore my background, experience, and projects.";
    }
    return parseFullResumeNarration(portfolioData);
  };

  // Find best matching voice for selected gender
  const getBestVoice = (gender: 'female' | 'male'): SpeechSynthesisVoice | null => {
    const voices = availableVoices.length > 0
      ? availableVoices
      : ('speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);

    if (voices.length === 0) return null;

    // Filter to English voices or all if no English
    const englishVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : voices;

    if (gender === 'female') {
      const femaleKeywords = [
        'female', 'woman', 'zira', 'jenny', 'aria', 'samantha', 'victoria',
        'karen', 'moira', 'fiona', 'tessa', 'veena', 'neerja', 'heera',
        'sangeeta', 'clara', 'sonia', 'libby', 'natasha', 'serena', 'ava',
        'allison', 'susan', 'kate', 'stephanie', 'ana', 'hazel', 'catherine'
      ];
      // Check direct female name match
      const matched = pool.find((v) => {
        const name = (v.name + ' ' + v.voiceURI).toLowerCase();
        return femaleKeywords.some((kw) => name.includes(kw));
      });
      if (matched) return matched;

      // Filter out explicitly male voices
      const maleKeywords = ['male', 'david', 'george', 'guy', 'mark', 'daniel', 'alex', 'fred', 'rishi', 'james', 'thomas', 'richard'];
      const nonMale = pool.filter((v) => {
        const name = (v.name + ' ' + v.voiceURI).toLowerCase();
        return !maleKeywords.some((kw) => name.includes(kw));
      });

      return nonMale[0] || pool[0];
    } else {
      const maleKeywords = [
        'male', 'alex', 'david', 'daniel', 'george', 'guy', 'fred', 'oliver',
        'rishi', 'mark', 'james', 'thomas', 'richard', 'brian', 'christopher'
      ];
      const matched = pool.find((v) => {
        const name = (v.name + ' ' + v.voiceURI).toLowerCase();
        return maleKeywords.some((kw) => name.includes(kw));
      });
      return matched || pool[0];
    }
  };

  // Speak sentence-by-sentence queue to prevent Chrome 15-second speech cutoff and handle pauses
  const speakNextSentence = (gender: 'female' | 'male') => {
    if (currentSentenceIdxRef.current >= sentenceQueueRef.current.length) {
      setIsSpeaking(false);
      setIsPaused(false);
      setMouthViseme(0);
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current);
        keepAliveTimerRef.current = null;
      }
      return;
    }

    const currentText = sentenceQueueRef.current[currentSentenceIdxRef.current];
    const utterance = new SpeechSynthesisUtterance(currentText);

    // Keep reference to prevent garbage collection in Chrome
    activeUtterancesRef.current.push(utterance);

    const chosenVoice = getBestVoice(gender);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    // Calibrate pitch and cadence for natural voice distinction
    if (gender === 'female') {
      utterance.pitch = 1.25; // warm, distinctive feminine pitch
      utterance.rate = 0.98;
    } else {
      utterance.pitch = 0.88; // deeper masculine cadence
      utterance.rate = 0.94;
    }

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      // Modulate mouth viseme rapidly on word boundaries for realistic speech lip-sync
      const visemes = [1, 2, 3];
      const nextViseme = visemes[Math.floor(Math.random() * visemes.length)];
      setMouthViseme(nextViseme);
      setTimeout(() => {
        setMouthViseme(0);
      }, 140);
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      currentSentenceIdxRef.current += 1;
      speakNextSentence(gender);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis sentence error:', e);
      currentSentenceIdxRef.current += 1;
      if (currentSentenceIdxRef.current < sentenceQueueRef.current.length) {
        speakNextSentence(gender);
      } else {
        setIsSpeaking(false);
        setIsPaused(false);
        setMouthViseme(0);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Speech synthesis start handler
  const startSpeakingWithGender = (gender: 'female' | 'male') => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    window.speechSynthesis.cancel();
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }

    const textToSpeak = getNarrationText();
    setSpokenText(textToSpeak);
    setSpeechBubbleOpen(true);

    // Split text into natural conversational sentences for reliable playback
    const sentences = textToSpeak
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    sentenceQueueRef.current = sentences.length > 0 ? sentences : [textToSpeak];
    currentSentenceIdxRef.current = 0;
    activeUtterancesRef.current = [];

    setIsSpeaking(true);
    setIsPaused(false);
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 2000);

    // Chrome keep-alive: pulse pause and resume every 9s if still active
    keepAliveTimerRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 9000);

    speakNextSentence(gender);
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
        setMouthViseme(0);
      }
    } else {
      startSpeakingWithGender(voiceGender);
    }
  };

  const handleVoiceGenderChange = (gender: 'female' | 'male') => {
    setVoiceGender(gender);
    if (isSpeaking) {
      handleStopSpeech();
      setTimeout(() => {
        startSpeakingWithGender(gender);
      }, 100);
    }
  };

  const handleStopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
    sentenceQueueRef.current = [];
    currentSentenceIdxRef.current = 0;
    activeUtterancesRef.current = [];
    setIsSpeaking(false);
    setIsPaused(false);
    setMouthViseme(0);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!interactive || !config.animationsEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive, config.animationsEnabled, mouseX, mouseY]);

  // Size mapping
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-44 h-44',
    lg: 'w-72 h-72 md:w-80 md:h-80',
    xl: 'w-80 h-80 md:w-[420px] md:h-[420px]',
  };

  // Theme Colors
  const themeStyles = {
    slate: {
      bgGlow: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      skin: '#fde047',
      clothing: '#2a201b', // dark brown hoodie matching image
      accent: '#3b82f6',
      hair: '#3b2318', // rich warm dark brown
      glasses: '#1e1b18',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    neon: {
      bgGlow: 'from-emerald-500/25 via-cyan-500/15 to-transparent',
      skin: '#fde047',
      clothing: '#0f2928',
      accent: '#06b6d4',
      hair: '#241b17',
      glasses: '#0284c7',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    pastel: {
      bgGlow: 'from-pink-400/20 via-purple-400/15 to-transparent',
      skin: '#fde047',
      clothing: '#3d1d2e',
      accent: '#a855f7',
      hair: '#473229',
      glasses: '#831843',
      badgeBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    },
    midnight: {
      bgGlow: 'from-purple-600/30 via-indigo-600/20 to-transparent',
      skin: '#fde047',
      clothing: '#1c1926',
      accent: '#8b5cf6',
      hair: '#1d1716',
      glasses: '#581c87',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
  };

  const currentTheme = themeStyles[config.theme] || themeStyles.slate;
  const isAnimated = config.animationsEnabled;
  const intensityFactor = config.intensity === 'dynamic' ? 1.5 : config.intensity === 'calm' ? 0.6 : 1.0;
  const isFemale = effectiveVoiceGender === 'female'; // dynamically matches selected voice gender
  const showGlasses = config.hasGlasses !== false; // true by default

  const triggerWave = () => {
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 2000);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Floating Speech Bubble with Resume Narration Text */}
      {speechBubbleOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="mb-3 max-w-sm sm:max-w-md w-full bg-slate-900/95 border border-amber-500/30 text-slate-100 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md z-40 text-xs text-left relative"
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <MessageSquareQuote className="w-4 h-4 text-amber-400" />
              <span>Avatar Voice Narration</span>
            </span>
            <div className="flex items-center gap-2">
              {effectiveIsSpeaking && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Speaking...
                </span>
              )}
              <button
                onClick={() => setSpeechBubbleOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
            "{effectiveSpokenText || spokenText || getNarrationText()}"
          </p>
          {/* Speech bubble pointer tail */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-r border-b border-amber-500/30 rotate-45" />
        </motion.div>
      )}

      {/* Main Avatar Frame */}
      <div
        ref={containerRef}
        className={`relative flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={triggerWave}
      >
      {/* Soft Glow Aura */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${currentTheme.bgGlow} filter blur-2xl opacity-75 animate-pulse`}
      />

      {/* Floating Archetype Tech Badges */}
      {isAnimated && (
        <>
          <motion.div
            className={`absolute -top-2 left-2 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border flex items-center gap-1 shadow-md z-20 ${currentTheme.badgeBg}`}
            animate={
              isAnimated
                ? {
                    y: [0, -6 * intensityFactor, 0],
                    rotate: [-2, 2, -2],
                  }
                : {}
            }
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {config.archetype === 'developer' && <Code2 className="w-3.5 h-3.5 text-blue-400" />}
            {config.archetype === 'designer' && <Palette className="w-3.5 h-3.5 text-pink-400" />}
            {config.archetype === 'data_scientist' && <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />}
            {(config.archetype === 'product_manager' || config.archetype === 'executive') && (
              <Rocket className="w-3.5 h-3.5 text-purple-400" />
            )}
            {config.archetype === 'general' && <Terminal className="w-3.5 h-3.5 text-amber-400" />}
            <span className="capitalize">{config.archetype.replace('_', ' ')}</span>
          </motion.div>

          <motion.div
            className={`absolute bottom-2 -right-1 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md border flex items-center gap-1 shadow-md z-20 ${currentTheme.badgeBg}`}
            animate={
              isAnimated
                ? {
                    y: [0, 6 * intensityFactor, 0],
                    rotate: [2, -2, 2],
                  }
                : {}
            }
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
            <span>{isWaving || ctaHovered ? 'Hello! 👋' : 'Interactive Persona'}</span>
          </motion.div>
        </>
      )}

      {/* Main Studio + Character Canvas */}
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{
          rotateX: interactive ? headRotateX : 0,
          rotateY: interactive ? headRotateY : 0,
        }}
        animate={
          effectiveIsSpeaking && !effectiveIsPaused
            ? {
                y: [0, -5 * intensityFactor, 1, -3.5 * intensityFactor, 0],
                rotate: [-0.6, 0.9, -0.4, 0.7, 0],
              }
            : isAnimated
            ? {
                y: [0, -5 * intensityFactor, 0],
              }
            : {}
        }
        transition={{
          duration: effectiveIsSpeaking && !effectiveIsPaused ? 1.4 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {viewMode === 'pixar' ? (
          <div className={`relative w-full h-full rounded-[28px] sm:rounded-[36px] overflow-hidden border-2 shadow-2xl group bg-slate-950 transition-all duration-300 ${
            effectiveIsSpeaking && !effectiveIsPaused
              ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_35px_rgba(245,158,11,0.45)]'
              : 'border-amber-500/30'
          }`}>
            <motion.img
              src={isFemale ? pixarAvatarImg : pixarMaleAvatarImg}
              alt={
                isFemale
                  ? "Disney Pixar 3D Character Portrait - Female Software Engineer with dark hoodie, glasses, and warm smile"
                  : "Disney Pixar 3D Character Portrait - Male Software Engineer with dark hoodie, glasses, and warm smile"
              }
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
              animate={
                effectiveIsSpeaking && !effectiveIsPaused
                  ? {
                      y: [0, -3.5, 0.5, -2, 0],
                      scale: [1, 1.02, 0.998, 1.015, 1],
                      rotate: [0, -0.6, 0.8, -0.4, 0],
                    }
                  : {
                      y: [0, -2, 0],
                      scale: 1,
                      rotate: 0,
                    }
              }
              transition={{
                duration: effectiveIsSpeaking && !effectiveIsPaused ? 1.4 : 3.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            {/* Cinematic Studio Lighting Flare Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 pointer-events-none" />

            {/* Live Audio Equalizer & Speaking Status Badge - No additional fake mouth */}
            {effectiveIsSpeaking && !effectiveIsPaused && (
              <div className="absolute top-3 left-3 z-30 px-3 py-1.5 rounded-full bg-slate-950/90 border border-amber-400/60 text-[10px] font-bold text-amber-300 backdrop-blur-md flex items-center gap-2 shadow-lg ring-1 ring-amber-400/30">
                <span className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 h-2 bg-amber-400 rounded-full animate-pulse" />
                  <span className="w-0.5 h-3 bg-amber-300 rounded-full animate-bounce" />
                  <span className="w-0.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                  <span className="w-0.5 h-2.5 bg-amber-300 rounded-full animate-bounce" />
                </span>
                <span>Speaking ({effectiveVoiceGender === 'female' ? 'Female' : 'Male'} Voice)</span>
              </div>
            )}
            
            {/* Pixar Mode Tag & Vector Switcher */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[10px] sm:text-[11px] font-bold text-slate-200 flex items-center justify-between shadow-lg">
              <span className="flex items-center gap-1 text-amber-400">
                <Sparkles className="w-3.5 h-3.5" /> Pixar 3D Render
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode('vector');
                }}
                className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20"
              >
                Vector Canvas
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('pixar');
              }}
              className="absolute top-2 right-2 z-30 px-2 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-amber-500/30 text-[10px] font-bold text-amber-400 hover:bg-slate-900 flex items-center gap-1 shadow-md"
            >
              <Camera className="w-3 h-3" />
              <span>3D Pixar Mode</span>
            </button>
            <svg
              viewBox="0 0 240 240"
              className="w-full h-full drop-shadow-2xl overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
          <defs>
            <linearGradient id="bookshelfBg" x1="0" y1="0" x2="240" y2="240">
              <stop offset="0%" stopColor="#1e1815" />
              <stop offset="50%" stopColor="#120e0c" />
              <stop offset="100%" stopColor="#080605" />
            </linearGradient>

            <linearGradient id="laptopScreenGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Studio Frame / Bookshelf */}
          <rect x="10" y="10" width="220" height="220" rx="28" fill="url(#bookshelfBg)" stroke="#33251e" strokeWidth="2" />

          {/* Wooden Bookshelves in Background */}
          <g opacity="0.35">
            {/* Shelf 1 Top */}
            <rect x="15" y="35" width="210" height="6" fill="#4a3528" rx="2" />
            {/* Books on top shelf */}
            <rect x="155" y="16" width="7" height="19" fill="#991b1b" rx="1" />
            <rect x="163" y="12" width="9" height="23" fill="#1e3a8a" rx="1" />
            <rect x="173" y="18" width="6" height="17" fill="#065f46" rx="1" />
            <rect x="180" y="14" width="8" height="21" fill="#854d0e" rx="1" />
            <rect x="189" y="19" width="10" height="16" stroke="#4a3528" fill="#1e293b" rx="1" />

            {/* Shelf 2 Middle */}
            <rect x="15" y="85" width="210" height="6" fill="#4a3528" rx="2" />
            {/* Books on shelf 2 */}
            <rect x="160" y="55" width="8" height="30" fill="#1e40af" rx="1" />
            <rect x="169" y="60" width="7" height="25" fill="#701a75" rx="1" />
            <rect x="177" y="58" width="11" height="27" fill="#064e3b" rx="1" />
            <rect x="189" y="62" width="8" height="23" fill="#b45309" rx="1" />
          </g>

          {/* System Map Holographic Laptop Screen on the Left (from reference image) */}
          <g transform="translate(18, 105)">
            {/* Laptop Body / Stand */}
            <rect x="0" y="0" width="72" height="52" rx="6" fill="#090d16" stroke="#0284c7" strokeWidth="1.5" />
            <rect x="3" y="3" width="66" height="46" rx="4" fill="url(#laptopScreenGlow)" />
            {/* System Map Header */}
            <rect x="6" y="6" width="60" height="8" rx="2" fill="#0284c7" fillOpacity="0.3" />
            <text x="10" y="12" fontSize="5" fontWeight="bold" fill="#38bdf8" letterSpacing="0.5">
              SYSTEM MAP
            </text>
            {/* Blueprint Grid Lines & Nodes */}
            <circle cx="20" cy="28" r="6" stroke="#38bdf8" strokeWidth="1" fill="none" />
            <circle cx="45" cy="22" r="4" stroke="#34d399" strokeWidth="1" fill="none" />
            <circle cx="52" cy="38" r="5" stroke="#f59e0b" strokeWidth="1" fill="none" />
            <path d="M 26 28 L 41 22 M 45 26 L 52 33" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
            <rect x="8" y="40" width="24" height="6" rx="1" fill="#38bdf8" opacity="0.4" />
          </g>

          {/* Shadow / Base Platform */}
          <ellipse cx="145" cy="215" rx="60" ry="10" fill="#000000" fillOpacity="0.4" />

          {/* Body / Clothing (Cozy Hoodie like reference image) */}
          <path
            d="M95 220 C95 160 115 140 145 140 C175 140 195 160 195 220 Z"
            fill={currentTheme.clothing}
          />
          {/* Hoodie Collar & Drawstrings */}
          <path
            d="M130 140 L145 168 L160 140"
            stroke="#453831"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="140" y1="160" x2="138" y2="182" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round" />
          <line x1="150" y1="160" x2="152" y2="182" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round" />

          {/* Neck */}
          <rect x="135" y="122" width="20" height="22" rx="4" fill="#fbcfe8" />

          {/* Back Hair (For Female: long flowing wavy hair over shoulders like image) */}
          {isFemale ? (
            <g>
              {/* Left long cascading hair section */}
              <path
                d="M102 85 Q90 120 100 180 C105 185 120 185 120 170 Q112 125 118 85 Z"
                fill={currentTheme.hair}
              />
              {/* Right long cascading hair section */}
              <path
                d="M172 85 Q188 120 185 180 C180 185 165 185 168 170 Q174 125 168 85 Z"
                fill={currentTheme.hair}
              />
              {/* Main back hair volume */}
              <circle cx="145" cy="82" r="48" fill={currentTheme.hair} />
            </g>
          ) : (
            /* Male Hair Back Volume */
            <circle cx="145" cy="80" r="42" fill={currentTheme.hair} />
          )}

          {/* Head Face Base */}
          <circle cx="145" cy="85" r="36" fill="#ffedd5" stroke="#fdba74" strokeWidth="1.5" />

          {/* Front Hair Style */}
          {isFemale ? (
            /* Female Layered Wavy Bangs & Framing Locks (Matching reference image) */
            <g>
              {/* Top Volume Wave */}
              <path
                d="M105 80 C105 50 125 38 145 38 C165 38 185 50 185 80 C172 60 155 52 145 52 C135 52 118 60 105 80 Z"
                fill={currentTheme.hair}
              />
              {/* Side Swept Bangs */}
              <path
                d="M110 70 C122 55 138 52 148 65 C140 68 125 72 110 70 Z"
                fill="#4a2e20"
              />
              <path
                d="M180 70 C168 55 152 52 142 65 C150 68 165 72 180 70 Z"
                fill="#4a2e20"
              />
            </g>
          ) : (
            /* Male Modern Textured Quiff Cut & Sideburns */
            <g>
              <path
                d="M107 74 C110 44 127 34 145 34 C163 34 180 44 183 74 C173 58 159 52 145 52 C131 52 117 58 107 74 Z"
                fill={currentTheme.hair}
              />
              <path
                d="M122 52 Q138 38 154 44 Q142 48 132 54 Z"
                fill="#4a2e20"
              />
              <path
                d="M144 44 Q162 40 172 50 Q160 48 148 50 Z"
                fill="#4a2e20"
              />
              {/* Male Sideburns */}
              <path d="M109 74 L109 85 L113 81 Z" fill={currentTheme.hair} />
              <path d="M181 74 L181 85 L177 81 Z" fill={currentTheme.hair} />
            </g>
          )}

          {/* Ears */}
          <circle cx="108" cy="88" r="6" fill="#ffedd5" />
          <circle cx="182" cy="88" r="6" fill="#ffedd5" />

          {/* Eyes Group with Pupil Tracking & Natural Blinking */}
          {isBlinking ? (
            <g>
              {/* Closed eyelids when blinking (so character never looks static or idle) */}
              <path d="M 122 84 Q 130 89 138 84" stroke={currentTheme.hair} strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 152 84 Q 160 89 168 84" stroke={currentTheme.hair} strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          ) : (
            <g>
              {/* Left Eye Socket */}
              <circle cx="130" cy="84" r="7.5" fill="#ffffff" />
              {/* Right Eye Socket */}
              <circle cx="160" cy="84" r="7.5" fill="#ffffff" />

              {/* Pupils tracking mouse */}
              <motion.circle
                cx={130}
                cy={84}
                r="4"
                fill="#1e1b18"
                style={{ x: eyeX, y: eyeY }}
              />
              <motion.circle
                cx={160}
                cy={84}
                r="4"
                fill="#1e1b18"
                style={{ x: eyeX, y: eyeY }}
              />

              {/* Catchlight */}
              <circle cx="128.5" cy="82.5" r="1.2" fill="#ffffff" />
              <circle cx="158.5" cy="82.5" r="1.2" fill="#ffffff" />
            </g>
          )}

          {/* Eyebrows (animated when speaking) */}
          <motion.path
            d="M122 73 Q130 69 138 73"
            stroke={currentTheme.hair}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            animate={effectiveIsSpeaking && !effectiveIsPaused ? { y: [-1.2, 1, -1.2] } : { y: 0 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M152 73 Q160 69 168 73"
            stroke={currentTheme.hair}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            animate={effectiveIsSpeaking && !effectiveIsPaused ? { y: [-1.2, 1, -1.2] } : { y: 0 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Glasses Frame (Thick dark frames like reference photo!) */}
          {showGlasses && (
            <g>
              {/* Left Lens Frame */}
              <rect
                x="118"
                y="73"
                width="24"
                height="21"
                rx="6"
                fill="none"
                stroke={currentTheme.glasses}
                strokeWidth="3"
              />
              {/* Right Lens Frame */}
              <rect
                x="148"
                y="73"
                width="24"
                height="21"
                rx="6"
                fill="none"
                stroke={currentTheme.glasses}
                strokeWidth="3"
              />
              {/* Bridge */}
              <line x1="142" y1="81" x2="148" y2="81" stroke={currentTheme.glasses} strokeWidth="3" />
            </g>
          )}

          {/* Expressive Speaking Mouth (Character's natural mouth articulates when speaking) */}
          {effectiveIsSpeaking && !effectiveIsPaused ? (
            <g>
              {mouthViseme === 0 && (
                <path
                  d="M134 102 Q145 107 156 102"
                  stroke="#be123c"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
              {mouthViseme === 1 && (
                <g>
                  {/* Wide open "Ah" vowel with teeth and tongue */}
                  <path
                    d="M132 99 C132 99 133 116 145 116 C157 116 158 99 158 99 Z"
                    fill="#881337"
                    stroke="#be123c"
                    strokeWidth="1.8"
                  />
                  {/* Upper Teeth */}
                  <path d="M135 100 Q145 103 155 100" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                  {/* Tongue */}
                  <ellipse cx="145" cy="112" rx="5" ry="3" fill="#f43f5e" />
                </g>
              )}
              {mouthViseme === 2 && (
                <g>
                  {/* Wide smile "Ee" talking viseme */}
                  <path
                    d="M130 100 Q145 113 160 100 Q145 105 130 100 Z"
                    fill="#9f1239"
                    stroke="#e11d48"
                    strokeWidth="1.8"
                  />
                  <path d="M134 101 Q145 104 156 101" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
                </g>
              )}
              {mouthViseme === 3 && (
                <g>
                  {/* Rounded "Oh" vowel */}
                  <ellipse cx="145" cy="105" rx="7" ry="8" fill="#881337" stroke="#e11d48" strokeWidth="2" />
                  <ellipse cx="145" cy="108" rx="3.5" ry="2" fill="#f43f5e" />
                </g>
              )}
            </g>
          ) : isHovered || ctaHovered || isWaving ? (
            <path
              d="M132 102 Q145 116 158 102 Z"
              fill="#e11d48"
              stroke="#9f1239"
              strokeWidth="1.5"
            />
          ) : (
            <path
              d="M133 102 Q145 112 157 102"
              fill="#f43f5e"
              stroke="#be123c"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Rosy Cheeks */}
          <circle cx="120" cy="95" r="5" fill="#f43f5e" fillOpacity="0.25" />
          <circle cx="170" cy="95" r="5" fill="#f43f5e" fillOpacity="0.25" />

          {/* Waving Arm / Hand Animation (Fixed camelCase transformOrigin!) */}
          <motion.g
            style={{ transformOrigin: '190px 155px' }}
            animate={
              isWaving || ctaHovered
                ? {
                    rotate: [0, 28, -12, 28, -12, 0],
                  }
                : {}
            }
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          >
            {/* Arm */}
            <path
              d="M185 155 C200 150 215 138 220 120"
              stroke={currentTheme.clothing}
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Hand */}
            <circle cx="222" cy="115" r="8" fill="#ffedd5" />
            {/* Waving Fingers */}
            <path
              d="M218 110 L218 104 M222 108 L222 102 M226 110 L226 104"
              stroke="#ffedd5"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </motion.g>
        </svg>
      </div>
    )}
  </motion.div>
</div>

      {/* Avatar Voice Speech Control Bar & Voice Gender Options */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5 z-30">
        <button
          type="button"
          onClick={externalSpeechState?.onToggleSpeech || handleToggleSpeech}
          className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
            effectiveIsSpeaking
              ? effectiveIsPaused
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-amber-500/50'
          }`}
        >
          {effectiveIsSpeaking ? (
            effectiveIsPaused ? (
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
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Speak Resume Summary</span>
            </>
          )}
        </button>

        {/* 2 Options for Character Persona & Voice: Female & Male */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-950/90 border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => (externalSpeechState?.onVoiceGenderChange ? externalSpeechState.onVoiceGenderChange('female') : handleVoiceGenderChange('female'))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              effectiveVoiceGender === 'female'
                ? 'bg-pink-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Switch to Female Character & Voice"
          >
            <span>👩 Female Character</span>
          </button>
          <button
            type="button"
            onClick={() => (externalSpeechState?.onVoiceGenderChange ? externalSpeechState.onVoiceGenderChange('male') : handleVoiceGenderChange('male'))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              effectiveVoiceGender === 'male'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Switch to Male Character & Voice"
          >
            <span>👨 Male Character</span>
          </button>
        </div>

        {effectiveIsSpeaking && (
          <button
            type="button"
            onClick={externalSpeechState?.onStopSpeech || handleStopSpeech}
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-900/50 border border-slate-800 text-rose-400 hover:text-rose-300 transition-colors"
            title="Stop Speech"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
};
