import React, { useMemo } from 'react';

export type StarThemeVariant =
  | 'cosmic_blue'
  | 'golden_stardust'
  | 'violet_galaxy'
  | 'emerald_aurora'
  | 'crimson_starlight'
  | 'ocean_abyss'
  | 'solar_flare'
  | 'cyber_matrix'
  | 'monochrome_silver';

interface Star {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // px
  type: 'dot' | 'sparkle' | 'starburst' | 'ring_glow' | 'glow';
  delay: number; // seconds
  duration: number; // seconds
  opacity: number;
  color: string;
}

interface ConstellationLine {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
}

interface ShootingStarItem {
  id: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
  length: number;
}

interface GlitteringStarsBackgroundProps {
  variant?: StarThemeVariant;
  isContained?: boolean;
  className?: string;
  count?: number;
  showShootingStars?: boolean;
  showConstellations?: boolean;
}

export const GlitteringStarsBackground: React.FC<GlitteringStarsBackgroundProps> = ({
  variant = 'cosmic_blue',
  isContained = false,
  className = '',
  count = 110,
  showShootingStars = true,
  showConstellations = true,
}) => {
  // Theme-specific color configurations
  const themeConfig = useMemo(() => {
    switch (variant) {
      case 'golden_stardust':
        return {
          baseGradient: 'bg-gradient-to-b from-[#0b0904] via-[#1a1408] to-[#080603]',
          nebulae: [
            'bg-amber-600/15 w-[550px] h-[550px] -top-32 left-1/4 filter blur-[105px]',
            'bg-yellow-600/12 w-[480px] h-[480px] top-1/3 -right-20 filter blur-[95px]',
            'bg-orange-600/10 w-[600px] h-[600px] bottom-10 left-10 filter blur-[115px]',
            'bg-amber-500/12 w-[420px] h-[420px] top-2/3 right-1/4 filter blur-[90px]',
          ],
          starColors: ['#ffffff', '#fef08a', '#fde047', '#f59e0b', '#fbbf24', '#fed7aa', '#fef9c3'],
          gridColor: '#fbbf24',
          lineColor: 'rgba(251, 191, 36, 0.35)',
          meteorGlow: '#f59e0b',
          isAurora: false,
        };
      case 'violet_galaxy':
        return {
          baseGradient: 'bg-gradient-to-b from-[#0b031a] via-[#180836] to-[#06020f]',
          nebulae: [
            'bg-purple-600/18 w-[550px] h-[550px] -top-32 left-1/4 filter blur-[105px]',
            'bg-fuchsia-600/15 w-[480px] h-[480px] top-1/3 -right-20 filter blur-[95px]',
            'bg-violet-600/12 w-[600px] h-[600px] bottom-10 left-10 filter blur-[115px]',
            'bg-indigo-600/12 w-[420px] h-[420px] top-2/3 right-1/4 filter blur-[90px]',
          ],
          starColors: ['#ffffff', '#f5d0fe', '#e879f9', '#c084fc', '#a855f7', '#818cf8', '#fae8ff'],
          gridColor: '#c084fc',
          lineColor: 'rgba(192, 132, 252, 0.35)',
          meteorGlow: '#d946ef',
          isAurora: false,
        };
      case 'emerald_aurora':
        return {
          baseGradient: 'bg-gradient-to-b from-[#02120e] via-[#05241b] to-[#010c08]',
          nebulae: [
            'bg-emerald-600/18 w-[560px] h-[560px] -top-32 left-1/4 filter blur-[105px]',
            'bg-teal-600/15 w-[480px] h-[480px] top-1/3 -right-20 filter blur-[95px]',
            'bg-emerald-500/12 w-[600px] h-[600px] bottom-10 left-10 filter blur-[115px]',
            'bg-cyan-600/12 w-[440px] h-[440px] top-2/3 right-1/4 filter blur-[90px]',
          ],
          starColors: ['#ffffff', '#d1fae5', '#a7f3d0', '#34d399', '#10b981', '#6ee7b7', '#ecfdf5'],
          gridColor: '#34d399',
          lineColor: 'rgba(52, 211, 153, 0.35)',
          meteorGlow: '#10b981',
          isAurora: true,
        };
      case 'crimson_starlight':
        return {
          baseGradient: 'bg-gradient-to-b from-[#160309] via-[#2a0614] to-[#0d0105]',
          nebulae: [
            'bg-rose-600/18 w-[550px] h-[550px] -top-32 left-1/4 filter blur-[105px]',
            'bg-pink-600/15 w-[480px] h-[480px] top-1/3 -right-20 filter blur-[95px]',
            'bg-red-600/12 w-[600px] h-[600px] bottom-10 left-10 filter blur-[115px]',
            'bg-rose-500/12 w-[420px] h-[420px] top-2/3 right-1/4 filter blur-[90px]',
          ],
          starColors: ['#ffffff', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#fff1f2'],
          gridColor: '#fb7185',
          lineColor: 'rgba(251, 113, 133, 0.35)',
          meteorGlow: '#f43f5e',
          isAurora: false,
        };
      case 'ocean_abyss':
        return {
          baseGradient: 'bg-gradient-to-b from-[#020b18] via-[#041933] to-[#010710]',
          nebulae: [
            'bg-cyan-600/18 w-[550px] h-[550px] -top-32 left-1/4 filter blur-[105px]',
            'bg-sky-600/15 w-[480px] h-[480px] top-1/3 -right-20 filter blur-[95px]',
            'bg-teal-600/12 w-[600px] h-[600px] bottom-10 left-10 filter blur-[115px]',
            'bg-blue-600/12 w-[420px] h-[420px] top-2/3 right-1/4 filter blur-[90px]',
          ],
          starColors: ['#ffffff', '#cffafe', '#a5f3fc', '#22d3ee', '#06b6d4', '#38bdf8', '#e0f2fe'],
          gridColor: '#22d3ee',
          lineColor: 'rgba(34, 211, 238, 0.35)',
          meteorGlow: '#06b6d4',
          isAurora: false,
        };
      case 'solar_flare':
        return {
          baseGradient: 'bg-gradient-to-b from-[#180702] via-[#2f1005] to-[#100401]',
          nebulae: [
            'bg-orange-600/18 w-[550px] h-[550px] -top-32 left-1/4 filter blur-[105px]',
            'bg-amber-600/15 w-[480px] h-[480px] top-1/3 -right-20 filter blur-[95px]',
            'bg-red-600/12 w-[600px] h-[600px] bottom-10 left-10 filter blur-[115px]',
            'bg-orange-500/12 w-[420px] h-[420px] top-2/3 right-1/4 filter blur-[90px]',
          ],
          starColors: ['#ffffff', '#ffedd5', '#fed7aa', '#fb923c', '#f97316', '#ea580c', '#fff7ed'],
          gridColor: '#f97316',
          lineColor: 'rgba(249, 115, 22, 0.35)',
          meteorGlow: '#ea580c',
          isAurora: false,
        };
      case 'cyber_matrix':
        return {
          baseGradient: 'bg-gradient-to-b from-[#020617] via-[#030712] to-[#000000]',
          nebulae: [
            'bg-emerald-600/15 w-[550px] h-[550px] -top-32 left-1/4 filter blur-[105px]',
            'bg-cyan-600/12 w-[480px] h-[480px] top-1/3 -right-20 filter blur-[95px]',
            'bg-teal-600/10 w-[600px] h-[600px] bottom-10 left-10 filter blur-[115px]',
            'bg-blue-600/10 w-[420px] h-[420px] top-2/3 right-1/4 filter blur-[90px]',
          ],
          starColors: ['#ffffff', '#a7f3d0', '#34d399', '#10b981', '#38bdf8', '#67e8f9'],
          gridColor: '#10b981',
          lineColor: 'rgba(16, 185, 129, 0.4)',
          meteorGlow: '#10b981',
          isAurora: false,
        };
      case 'monochrome_silver':
        return {
          baseGradient: 'bg-gradient-to-b from-[#09090b] via-[#18181b] to-[#000000]',
          nebulae: [
            'bg-zinc-600/12 w-[550px] h-[550px] -top-32 left-1/4 filter blur-[105px]',
            'bg-neutral-600/10 w-[480px] h-[480px] top-1/3 -right-20 filter blur-[95px]',
            'bg-stone-600/10 w-[600px] h-[600px] bottom-10 left-10 filter blur-[115px]',
            'bg-zinc-500/10 w-[420px] h-[420px] top-2/3 right-1/4 filter blur-[90px]',
          ],
          starColors: ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa'],
          gridColor: '#e4e4e7',
          lineColor: 'rgba(228, 228, 231, 0.25)',
          meteorGlow: '#ffffff',
          isAurora: false,
        };
      case 'cosmic_blue':
      default:
        return {
          baseGradient: 'bg-gradient-to-b from-[#03071b] via-[#061132] to-[#020617]',
          nebulae: [
            'bg-blue-600/15 w-[550px] h-[550px] -top-32 left-1/4 filter blur-[100px]',
            'bg-indigo-600/15 w-[480px] h-[480px] top-1/3 -right-20 filter blur-[95px]',
            'bg-sky-500/10 w-[600px] h-[600px] bottom-10 left-10 filter blur-[110px]',
            'bg-cyan-500/10 w-[420px] h-[420px] top-2/3 right-1/4 filter blur-[90px]',
          ],
          starColors: ['#ffffff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#a5b4fc', '#fef08a'],
          gridColor: '#38bdf8',
          lineColor: 'rgba(56, 189, 248, 0.35)',
          meteorGlow: '#38bdf8',
          isAurora: false,
        };
    }
  }, [variant]);

  // Generate deterministic rich star cluster with varied shapes
  const { stars, constellations } = useMemo(() => {
    const starList: Star[] = [];
    const colors = themeConfig.starColors;

    for (let i = 0; i < count; i++) {
      const seed = (i * 9301 + 49297) % 233280;
      const rnd1 = seed / 233280;
      const rnd2 = ((seed * 9301 + 49297) % 233280) / 233280;
      const rnd3 = ((rnd2 * 233280 * 9301 + 49297) % 233280) / 233280;
      const rnd4 = ((rnd3 * 233280 * 9301 + 49297) % 233280) / 233280;

      // Assign rich star types: dot (55%), sparkle 4-point diamond (20%), starburst 8-point (10%), ring_glow (8%), glow (7%)
      let type: 'dot' | 'sparkle' | 'starburst' | 'ring_glow' | 'glow';
      if (i % 11 === 0) {
        type = 'starburst';
      } else if (i % 7 === 0) {
        type = 'sparkle';
      } else if (i % 13 === 0) {
        type = 'ring_glow';
      } else if (i % 5 === 0) {
        type = 'glow';
      } else {
        type = 'dot';
      }

      let size = 1.5;
      if (type === 'starburst') {
        size = 14 + rnd1 * 10;
      } else if (type === 'sparkle') {
        size = 10 + rnd1 * 8;
      } else if (type === 'ring_glow') {
        size = 5 + rnd1 * 3;
      } else if (type === 'glow') {
        size = 3.5 + rnd1 * 3;
      } else {
        size = 1.2 + rnd1 * 2;
      }

      starList.push({
        id: i,
        x: Math.round(rnd1 * 98 * 10) / 10 + 1,
        y: Math.round(rnd2 * 98 * 10) / 10 + 1,
        size,
        type,
        delay: Math.round(rnd3 * 5 * 10) / 10,
        duration: Math.round((2.0 + rnd4 * 3.2) * 10) / 10,
        opacity: Math.round((0.4 + rnd3 * 0.6) * 100) / 100,
        color: colors[i % colors.length],
      });
    }

    // Connect close prominent stars to form geometric celestial constellations
    const constellationList: ConstellationLine[] = [];
    if (showConstellations) {
      const prominent = starList.filter((s) => s.type === 'sparkle' || s.type === 'starburst' || s.type === 'ring_glow');
      for (let i = 0; i < prominent.length; i++) {
        for (let j = i + 1; j < prominent.length; j++) {
          const dx = prominent[i].x - prominent[j].x;
          const dy = prominent[i].y - prominent[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Only connect if moderately close (between 4% and 12% screen distance)
          if (dist > 4 && dist < 12 && constellationList.length < 18) {
            constellationList.push({
              id: i * 100 + j,
              x1: prominent[i].x,
              y1: prominent[i].y,
              x2: prominent[j].x,
              y2: prominent[j].y,
              opacity: Math.round((0.15 + (1 - dist / 12) * 0.25) * 100) / 100,
            });
          }
        }
      }
    }

    return { stars: starList, constellations: constellationList };
  }, [count, themeConfig.starColors, showConstellations]);

  // Shooting star meteors
  const shootingStars: ShootingStarItem[] = useMemo(() => {
    if (!showShootingStars) return [];
    return [
      { id: 1, top: 12, left: 15, delay: 1.5, duration: 2.8, length: 140 },
      { id: 2, top: 38, left: 45, delay: 6.2, duration: 2.6, length: 160 },
      { id: 3, top: 22, left: 68, delay: 11.5, duration: 3.0, length: 130 },
      { id: 4, top: 58, left: 25, delay: 16.0, duration: 2.9, length: 150 },
    ];
  }, [showShootingStars]);

  return (
    <div
      className={`${
        isContained ? 'absolute inset-0' : 'fixed inset-0'
      } pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* Base Gradient Canvas */}
      <div className={`absolute inset-0 ${themeConfig.baseGradient}`} />

      {/* Aurora Borealis Waves for Emerald Theme */}
      {themeConfig.isAurora && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-70">
          <div
            className="absolute -top-10 -left-20 w-[120%] h-[320px] bg-gradient-to-b from-emerald-500/20 via-teal-400/15 to-transparent blur-[45px] rounded-full"
            style={{ animation: 'auroraFloat 8s ease-in-out infinite' }}
          />
          <div
            className="absolute top-40 -right-20 w-[110%] h-[260px] bg-gradient-to-b from-cyan-400/15 via-emerald-400/10 to-transparent blur-[50px] rounded-full"
            style={{ animation: 'auroraFloat 11s ease-in-out infinite reverse' }}
          />
        </div>
      )}

      {/* Cosmic Nebula Cloud Orbs */}
      {themeConfig.nebulae.map((nebulaClass, idx) => (
        <div
          key={idx}
          className={`absolute rounded-full pointer-events-none ${nebulaClass}`}
        />
      ))}

      {/* Ambient Stardust / Cyber Pattern Mesh */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `radial-gradient(${themeConfig.gridColor} 1px, transparent 1px)`,
          backgroundSize: variant === 'cyber_matrix' ? '24px 24px' : '32px 32px',
        }}
      />

      {/* Shooting Stars / Meteor Trails */}
      {shootingStars.map((m) => (
        <div
          key={m.id}
          className="absolute pointer-events-none"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            width: `${m.length}px`,
            height: '2px',
            background: `linear-gradient(90deg, ${themeConfig.meteorGlow} 0%, rgba(255,255,255,0.9) 70%, transparent 100%)`,
            boxShadow: `0 0 10px ${themeConfig.meteorGlow}`,
            animation: `shootingStar ${m.duration}s ease-in-out infinite`,
            animationDelay: `${m.delay}s`,
            transformOrigin: 'left center',
          }}
        >
          {/* Sparkling Meteor Head */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_12px_#ffffff]"
            style={{ backgroundColor: '#ffffff' }}
          />
        </div>
      ))}

      {/* Dynamic Glittering Stars Layer */}
      <svg
        className="w-full h-full absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={`starGlow_${variant}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Constellation Lines */}
        {constellations.map((line) => (
          <line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke={themeConfig.lineColor}
            strokeWidth="0.85"
            strokeDasharray="3 3"
            opacity={line.opacity}
          />
        ))}

        {/* Stars */}
        {stars.map((star) => {
          // 8-Point Diffraction Starburst
          if (star.type === 'starburst') {
            const r = star.size / 2;
            const inner = r * 0.28;
            return (
              <g
                key={star.id}
                transform={`translate(${star.x}%, ${star.y}%)`}
                style={{
                  animation: `twinkle ${star.duration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                  transformOrigin: '0px 0px',
                }}
              >
                {/* Luminous Outer Halo */}
                <circle
                  cx="0"
                  cy="0"
                  r={r * 0.9}
                  fill={star.color}
                  opacity={star.opacity * 0.45}
                  filter={`url(#starGlow_${variant})`}
                />
                {/* 8-Point Starburst Path */}
                <path
                  d={`M 0,-${r} Q 0,-${inner} ${inner},-${inner} Q ${inner},0 ${r},0 Q ${inner},0 ${inner},${inner} Q 0,${inner} 0,${r} Q 0,${inner} -${inner},${inner} Q -${inner},0 -${r},0 Q -${inner},0 -${inner},-${inner} Q 0,-${inner} 0,-${r} Z`}
                  fill={star.color}
                  opacity={star.opacity}
                />
                {/* Diagonal subtle cross flare */}
                <line x1={-r * 0.65} y1={-r * 0.65} x2={r * 0.65} y2={r * 0.65} stroke={star.color} strokeWidth="0.75" opacity={star.opacity * 0.6} />
                <line x1={-r * 0.65} y1={r * 0.65} x2={r * 0.65} y2={-r * 0.65} stroke={star.color} strokeWidth="0.75" opacity={star.opacity * 0.6} />
                {/* Brilliant Core */}
                <circle cx="0" cy="0" r={r * 0.22} fill="#ffffff" />
              </g>
            );
          }

          // 4-Point Diamond Sparkle Star
          if (star.type === 'sparkle') {
            const half = star.size / 2;
            return (
              <g
                key={star.id}
                transform={`translate(${star.x}%, ${star.y}%)`}
                style={{
                  animation: `twinkle ${star.duration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                  transformOrigin: '0px 0px',
                }}
              >
                {/* Outer Glow Halo */}
                <circle
                  cx="0"
                  cy="0"
                  r={half * 0.85}
                  fill={star.color}
                  opacity={star.opacity * 0.45}
                  filter={`url(#starGlow_${variant})`}
                />
                {/* 4-point Diamond Path */}
                <path
                  d={`M 0,-${half} Q 0,0 ${half},0 Q 0,0 0,${half} Q 0,0 -${half},0 Q 0,0 0,-${half} Z`}
                  fill={star.color}
                  opacity={star.opacity}
                />
                {/* Tiny Core Center */}
                <circle cx="0" cy="0" r={half * 0.24} fill="#ffffff" />
              </g>
            );
          }

          // Orbital Ring Glow Star
          if (star.type === 'ring_glow') {
            return (
              <g
                key={star.id}
                transform={`translate(${star.x}%, ${star.y}%)`}
                style={{
                  animation: `twinkle ${star.duration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                  transformOrigin: '0px 0px',
                }}
              >
                {/* Orbital Ring */}
                <ellipse
                  cx="0"
                  cy="0"
                  rx={star.size * 1.6}
                  ry={star.size * 0.75}
                  fill="none"
                  stroke={star.color}
                  strokeWidth="0.8"
                  opacity={star.opacity * 0.7}
                  transform="rotate(-25)"
                />
                <circle
                  cx="0"
                  cy="0"
                  r={star.size * 0.65}
                  fill={star.color}
                  opacity={star.opacity}
                />
                <circle cx="0" cy="0" r={star.size * 0.25} fill="#ffffff" />
              </g>
            );
          }

          // Soft Glowing Stellar Orb
          if (star.type === 'glow') {
            return (
              <g
                key={star.id}
                style={{
                  animation: `twinkle ${star.duration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                  transformOrigin: `${star.x}% ${star.y}%`,
                }}
              >
                <circle
                  cx={`${star.x}%`}
                  cy={`${star.y}%`}
                  r={star.size * 1.6}
                  fill={star.color}
                  opacity={star.opacity * 0.35}
                  filter={`url(#starGlow_${variant})`}
                />
                <circle
                  cx={`${star.x}%`}
                  cy={`${star.y}%`}
                  r={star.size * 0.7}
                  fill="#ffffff"
                  opacity={star.opacity}
                />
              </g>
            );
          }

          // Standard Pinpoint Star
          return (
            <circle
              key={star.id}
              cx={`${star.x}%`}
              cy={`${star.y}%`}
              r={star.size * 0.65}
              fill={star.color}
              opacity={star.opacity}
              style={{
                animation: `twinkle ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`,
                transformOrigin: `${star.x}% ${star.y}%`,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

