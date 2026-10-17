import React, { useState } from 'react';
import {
  PortfolioData,
  ProfessionArchetype,
  AvatarTheme,
  AnimationIntensity,
  GenderType,
  PortfolioAestheticStyle,
} from '../types';
import { AnimatedAvatar } from './AnimatedAvatar';
import { GlitteringStarsBackground, StarThemeVariant } from './GlitteringStarsBackground';
import {
  Sliders,
  Sparkles,
  Check,
  RefreshCw,
  User,
  Eye,
  Palette,
  Laptop,
  Building2,
  Feather,
  Zap,
  BookOpen,
  ChevronRight,
  Layers,
  Crown,
  Moon,
  Waves,
  Flame,
  Droplets,
  Sun,
} from 'lucide-react';

interface CustomizerModalProps {
  initialData: PortfolioData;
  onSave: (updatedData: PortfolioData) => void;
  onClose: () => void;
}

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  initialData,
  onSave,
  onClose,
}) => {
  const [data, setData] = useState<PortfolioData>({
    ...initialData,
    aestheticStyle: initialData.aestheticStyle || 'modern',
  });
  const [isSaving, setIsSaving] = useState(false);

  const aestheticStyles: {
    key: PortfolioAestheticStyle;
    title: string;
    subtitle: string;
    description: string;
    badge: string;
    previewBg: string;
    borderActive: string;
    accentColor: string;
    avatarThemeDefault: AvatarTheme;
    hasGlitterStars?: boolean;
    starVariant?: StarThemeVariant;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: 'cosmic_stars',
      title: 'Cosmic Blue & Glittering Stars',
      subtitle: 'Deep celestial blue with sparkling starlight',
      description: 'Twinkling stardust background, galaxy blue gradients, and cosmic sparkle highlights',
      badge: 'Celestial & Animated',
      previewBg: 'bg-gradient-to-br from-[#03071b] via-[#081845] to-[#020617]',
      borderActive: 'border-sky-400 ring-2 ring-sky-400/40 shadow-lg shadow-sky-500/25',
      accentColor: 'text-sky-300',
      avatarThemeDefault: 'midnight',
      hasGlitterStars: true,
      starVariant: 'cosmic_blue',
      icon: Sparkles,
    },
    {
      key: 'golden_stardust',
      title: 'Royal Obsidian & Golden Stardust',
      subtitle: 'Rich obsidian black with golden glittering embers',
      description: 'Floating amber dust particles, warm gold constellations, and royal luxury accents',
      badge: 'Golden Glow',
      previewBg: 'bg-gradient-to-br from-[#090805] via-[#1c1404] to-[#090805]',
      borderActive: 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/25',
      accentColor: 'text-amber-300',
      avatarThemeDefault: 'pastel',
      hasGlitterStars: true,
      starVariant: 'golden_stardust',
      icon: Crown,
    },
    {
      key: 'violet_galaxy',
      title: 'Violet Galaxy & Amethyst Nebula',
      subtitle: 'Deep purple universe with fuchsia stardust',
      description: 'Drifting interstellar violet dust, magenta twinkling diamonds, and cosmic purple glow',
      badge: 'Cosmic Violet',
      previewBg: 'bg-gradient-to-br from-[#0a0318] via-[#1a0538] to-[#0d0421]',
      borderActive: 'border-fuchsia-400 ring-2 ring-fuchsia-400/40 shadow-lg shadow-fuchsia-500/25',
      accentColor: 'text-fuchsia-300',
      avatarThemeDefault: 'midnight',
      hasGlitterStars: true,
      starVariant: 'violet_galaxy',
      icon: Moon,
    },
    {
      key: 'emerald_aurora',
      title: 'Emerald Aurora & Northern Lights',
      subtitle: 'Deep pine night with ethereal green wave glows',
      description: 'Bioluminescent green stars, aurora waves, and glowing jade constellations',
      badge: 'Aurora Glow',
      previewBg: 'bg-gradient-to-br from-[#02120e] via-[#04281e] to-[#02140f]',
      borderActive: 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/25',
      accentColor: 'text-emerald-300',
      avatarThemeDefault: 'neon',
      hasGlitterStars: true,
      starVariant: 'emerald_aurora',
      icon: Waves,
    },
    {
      key: 'crimson_starlight',
      title: 'Velvet Crimson & Rose Quartz',
      subtitle: 'Rich garnet noir with rose stardust and meteors',
      description: 'Deep ruby atmosphere, rose quartz glimmers, and dramatic crimson meteors',
      badge: 'Velvet Ruby',
      previewBg: 'bg-gradient-to-br from-[#140207] via-[#2d0513] to-[#120207]',
      borderActive: 'border-rose-400 ring-2 ring-rose-400/40 shadow-lg shadow-rose-500/25',
      accentColor: 'text-rose-300',
      avatarThemeDefault: 'pastel',
      hasGlitterStars: true,
      starVariant: 'crimson_starlight',
      icon: Flame,
    },
    {
      key: 'ocean_abyss',
      title: 'Ocean Abyss & Bioluminescent Cyan',
      subtitle: 'Midnight oceanic trench with glowing cyan particles',
      description: 'Deep marine waters, aquatic floating bioluminescent plankton, and electric cyan sparkles',
      badge: 'Bioluminescent',
      previewBg: 'bg-gradient-to-br from-[#020b18] via-[#031d3d] to-[#020e20]',
      borderActive: 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/25',
      accentColor: 'text-cyan-300',
      avatarThemeDefault: 'slate',
      hasGlitterStars: true,
      starVariant: 'ocean_abyss',
      icon: Droplets,
    },
    {
      key: 'solar_flare',
      title: 'Solar Flare & Synthwave Sunset',
      subtitle: 'Warm magma ember sky with fiery sunburst stars',
      description: 'Dusk horizon, blazing orange starlight, and retro sunset cosmic atmosphere',
      badge: 'Solar Sunset',
      previewBg: 'bg-gradient-to-br from-[#150602] via-[#330f05] to-[#1a0703]',
      borderActive: 'border-orange-400 ring-2 ring-orange-400/40 shadow-lg shadow-orange-500/25',
      accentColor: 'text-orange-300',
      avatarThemeDefault: 'neon',
      hasGlitterStars: true,
      starVariant: 'solar_flare',
      icon: Sun,
    },
    {
      key: 'cyberpunk',
      title: 'Cyberpunk Neon & Matrix Grid',
      subtitle: 'High-voltage matrix grid with neon data stars',
      description: 'Dark terminal mode with electric neon borders, data stream meteors, and cyber green glow',
      badge: 'Matrix Cyber',
      previewBg: 'bg-gradient-to-br from-gray-950 via-black to-emerald-950/60',
      borderActive: 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/25',
      accentColor: 'text-emerald-400',
      avatarThemeDefault: 'neon',
      hasGlitterStars: true,
      starVariant: 'cyber_matrix',
      icon: Zap,
    },
    {
      key: 'modern',
      title: 'Modern Slate & Electric Blue',
      subtitle: 'Contemporary tech with crisp electric blue',
      description: 'Sleek dark slate, polished glass cards, and crisp vibrant blue typography',
      badge: 'Clean Tech',
      previewBg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/60',
      borderActive: 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20',
      accentColor: 'text-blue-400',
      avatarThemeDefault: 'slate',
      hasGlitterStars: false,
      icon: Laptop,
    },
    {
      key: 'minimalist',
      title: 'Minimalist Mono & Silver Dust',
      subtitle: 'Clean monochrome with delicate silver stardust',
      description: 'Distraction-free off-black canvas, subtle silver stars, and hairline neutral borders',
      badge: 'Silver Mono',
      previewBg: 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-black',
      borderActive: 'border-zinc-200 ring-2 ring-zinc-200/40 shadow-lg shadow-white/10',
      accentColor: 'text-zinc-200',
      avatarThemeDefault: 'slate',
      hasGlitterStars: true,
      starVariant: 'monochrome_silver',
      icon: Feather,
    },
    {
      key: 'corporate',
      title: 'Corporate Executive Navy',
      subtitle: 'Deep midnight navy & royal blue authority',
      description: 'Enterprise precision, structured cards, executive badges, and authoritative polish',
      badge: 'Executive',
      previewBg: 'bg-gradient-to-br from-[#050e21] via-[#091e45] to-[#030a18]',
      borderActive: 'border-blue-400 ring-2 ring-blue-400/40 shadow-lg shadow-blue-900/30',
      accentColor: 'text-sky-400',
      avatarThemeDefault: 'slate',
      hasGlitterStars: false,
      icon: Building2,
    },
    {
      key: 'warm_editorial',
      title: 'Warm Editorial & Espresso',
      subtitle: 'Espresso charcoal with warm champagne gold',
      description: 'Warm literary aesthetic with artisanal tones, refined serif headers, and studio warmth',
      badge: 'Artisanal Warmth',
      previewBg: 'bg-gradient-to-br from-[#12100e] via-[#1c1917] to-[#261f18]',
      borderActive: 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/25',
      accentColor: 'text-amber-300',
      avatarThemeDefault: 'pastel',
      hasGlitterStars: false,
      icon: BookOpen,
    },
  ];

  const currentAestheticKey = data.aestheticStyle || 'modern';
  const currentAestheticConfig =
    aestheticStyles.find((s) => s.key === currentAestheticKey) || aestheticStyles[1];

  const archetypes: { key: ProfessionArchetype; label: string }[] = [
    { key: 'developer', label: 'Developer / Engineer' },
    { key: 'designer', label: 'UI/UX & Product Designer' },
    { key: 'data_scientist', label: 'Data Scientist & AI' },
    { key: 'product_manager', label: 'Product Manager' },
    { key: 'executive', label: 'Executive & Leader' },
    { key: 'general', label: 'General Specialist' },
  ];

  const themes: { key: AvatarTheme; label: string; previewColor: string }[] = [
    { key: 'slate', label: 'Modern Slate', previewColor: '#3b82f6' },
    { key: 'neon', label: 'Cyber Neon', previewColor: '#10b981' },
    { key: 'pastel', label: 'Soft Pastel', previewColor: '#ec4899' },
    { key: 'midnight', label: 'Midnight Luxury', previewColor: '#8b5cf6' },
  ];

  const handleAestheticStyleChange = (styleKey: PortfolioAestheticStyle) => {
    const selected = aestheticStyles.find((s) => s.key === styleKey);
    setData((prev) => ({
      ...prev,
      aestheticStyle: styleKey,
      avatarConfig: {
        ...prev.avatarConfig,
        theme: selected?.avatarThemeDefault || prev.avatarConfig.theme,
      },
    }));
  };

  const handleGenderChange = (gender: GenderType) => {
    setData((prev) => ({
      ...prev,
      avatarConfig: {
        ...prev.avatarConfig,
        gender,
      },
    }));
  };

  const handleGlassesToggle = (hasGlasses: boolean) => {
    setData((prev) => ({
      ...prev,
      avatarConfig: {
        ...prev.avatarConfig,
        hasGlasses,
      },
    }));
  };

  const handleArchetypeChange = (arch: ProfessionArchetype) => {
    setData((prev) => ({
      ...prev,
      profession: arch,
      avatarConfig: {
        ...prev.avatarConfig,
        archetype: arch,
      },
    }));
  };

  const handleThemeChange = (theme: AvatarTheme) => {
    setData((prev) => ({
      ...prev,
      avatarConfig: {
        ...prev.avatarConfig,
        theme,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Map theme to aesthetic style tokens
    const themeToStyleMap: Record<string, string> = {
      slate: 'modern',
      neon: 'cyberpunk',
      pastel: 'minimalist',
      midnight: 'cosmic_stars',
      corporate: 'corporate',
      cosmic_stars: 'cosmic_stars',
      modern: 'modern',
      minimalist: 'minimalist',
      cyberpunk: 'cyberpunk',
    };

    const chosenTheme = (data as any)?.avatarConfig?.theme || (data as any)?.theme || 'modern';
    const computedAestheticStyle = themeToStyleMap[chosenTheme] || chosenTheme;

    const payload = {
      ...data,
      aestheticStyle: computedAestheticStyle,
      avatarConfig: {
        ...(data as any)?.avatarConfig,
        theme: chosenTheme,
      },
    };

    try {
      await onSave(payload);
      if (typeof (props as any)?.onClose === 'function') {
        (props as any).onClose();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 max-h-[92vh] overflow-y-auto">
        
        {/* Left Controls Column */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Portfolio & Avatar Customizer</h3>
              <p className="text-xs text-slate-400">
                Choose an aesthetic style for your portfolio view, plus customize character appearance
              </p>
            </div>
          </div>

          {/* Aesthetic Theme Selector Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-blue-400" />
                <span>Portfolio View Aesthetic Style</span>
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                Active: <span className="text-white font-bold">{currentAestheticConfig.title}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aestheticStyles.map((style) => {
                const isSelected = currentAestheticKey === style.key;
                const IconComponent = style.icon;

                return (
                  <button
                    key={style.key}
                    type="button"
                    onClick={() => handleAestheticStyleChange(style.key)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all overflow-hidden flex flex-col justify-between group ${
                      isSelected
                        ? `${style.previewBg} ${style.borderActive}`
                        : 'bg-slate-950/80 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Background Sparkling Effect for Cosmic Style Card */}
                    {style.hasGlitterStars && (
                      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
                        <div className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-sky-200 animate-ping" />
                        <div className="absolute bottom-3 left-10 w-1 h-1 rounded-full bg-white animate-pulse" />
                        <div className="absolute top-1/2 right-12 w-2 h-2 rounded-full bg-sky-300 animate-twinkle" />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2 relative z-10">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center border ${
                            isSelected
                              ? 'bg-white/15 border-white/30 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-white'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span
                            className={`text-xs font-bold block leading-tight ${
                              isSelected ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {style.title}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {style.subtitle}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-slate-800 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed relative z-10">
                      {style.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] relative z-10">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-300 font-medium">
                        {style.badge}
                      </span>
                      {style.hasGlitterStars && (
                        <span className="text-sky-300 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 animate-spin" />
                          <span>Glittering Stars</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Character Gender Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Character Persona Gender & Hairstyle</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleGenderChange('female')}
                className={`p-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                  (data.avatarConfig.gender || 'female') === 'female'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Female Persona (Wavy Hair)</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('male')}
                className={`p-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                  data.avatarConfig.gender === 'male'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Male Persona (Short Cut)</span>
              </button>
            </div>
          </div>

          {/* Glasses & Open To Work Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">Thick Frame Glasses</span>
              </div>
              <input
                type="checkbox"
                checked={data.avatarConfig.hasGlasses !== false}
                onChange={(e) => handleGlassesToggle(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-white">Open To Work Badge</span>
              </div>
              <input
                type="checkbox"
                checked={data.openToWork !== false}
                onChange={(e) => setData((prev) => ({ ...prev, openToWork: e.target.checked }))}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Archetype Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Character Archetype & Tech Focus
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {archetypes.map((arch) => (
                <button
                  key={arch.key}
                  type="button"
                  onClick={() => handleArchetypeChange(arch.key)}
                  className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                    data.avatarConfig.archetype === arch.key
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {arch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Palette */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Avatar Glow Accent Palette
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {themes.map((th) => (
                <button
                  key={th.key}
                  type="button"
                  onClick={() => handleThemeChange(th.key)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                    data.avatarConfig.theme === th.key
                      ? 'bg-slate-800 text-white border-blue-500 ring-2 ring-blue-500/20'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: th.previewColor }}
                  />
                  <span className="truncate">{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tagline Edit */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Hero Header Subtitle
            </label>
            <input
              type="text"
              value={data.customTagline || ''}
              onChange={(e) => setData((prev) => ({ ...prev, customTagline: e.target.value }))}
              placeholder="e.g. SOFTWARE ENGINEER · FULL STACK DEVELOPER"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save & Apply Style</span>
            </button>
          </div>
        </div>

        {/* Right Preview Column - Displays Live Theme Preview */}
        <div
          className={`w-full md:w-80 relative overflow-hidden rounded-3xl p-6 flex flex-col items-center justify-between text-center border transition-all duration-500 min-h-[440px] shadow-2xl ${
            currentAestheticConfig.previewBg
          } ${
            currentAestheticKey === 'golden_stardust'
              ? 'border-amber-500/40 shadow-amber-950/50'
              : currentAestheticKey === 'violet_galaxy'
              ? 'border-fuchsia-500/40 shadow-purple-950/60'
              : currentAestheticKey === 'emerald_aurora'
              ? 'border-emerald-500/40 shadow-emerald-950/60'
              : currentAestheticKey === 'crimson_starlight'
              ? 'border-rose-500/40 shadow-rose-950/60'
              : currentAestheticKey === 'ocean_abyss'
              ? 'border-cyan-500/40 shadow-cyan-950/60'
              : currentAestheticKey === 'solar_flare'
              ? 'border-orange-500/40 shadow-orange-950/60'
              : currentAestheticKey === 'cyberpunk'
              ? 'border-emerald-500/40 shadow-emerald-950/40'
              : currentAestheticKey === 'minimalist'
              ? 'border-neutral-700 shadow-neutral-950/40'
              : currentAestheticKey === 'corporate'
              ? 'border-blue-900/70 shadow-blue-950/40'
              : currentAestheticKey === 'warm_editorial'
              ? 'border-amber-900/60 shadow-black/60'
              : 'border-sky-500/40 shadow-blue-950/70'
          }`}
        >
          {/* Live Glittering Stars in Preview Column for Any Star Theme */}
          {currentAestheticConfig.hasGlitterStars && (
            <GlitteringStarsBackground
              variant={currentAestheticConfig.starVariant || 'cosmic_blue'}
              isContained={true}
              count={45}
              showShootingStars={true}
              showConstellations={true}
            />
          )}

          {/* Preview Badge Top */}
          <div className="relative z-10 w-full flex items-center justify-between pb-3 border-b border-white/10 text-[11px]">
            <span className="text-slate-200 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Theme Preview</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                currentAestheticConfig.hasGlitterStars
                  ? 'bg-white/10 text-white border-white/20 shadow-sm'
                  : 'bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              {currentAestheticConfig.title}
            </span>
          </div>

          {/* Center Avatar Preview */}
          <div className="relative z-10 my-4 flex flex-col items-center">
            <AnimatedAvatar config={data.avatarConfig} size="lg" interactive={true} />
            <h4 className="text-lg font-bold text-white mt-3">{data.name}</h4>
            <p className={`text-xs font-semibold ${currentAestheticConfig.accentColor} mb-1`}>
              {data.title}
            </p>
            <p className="text-[11px] text-slate-300 line-clamp-2 px-2 max-w-[220px]">
              {data.customTagline || data.summary}
            </p>
          </div>

          {/* Aesthetic Highlights Pill */}
          <div className="relative z-10 w-full pt-3 border-t border-white/10 space-y-2 text-[11px] text-slate-300">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md text-left">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider mb-0.5">
                Aesthetic Attributes
              </span>
              <p className="text-white text-xs font-medium">
                {currentAestheticConfig.subtitle}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

