import React, { useId } from 'react';

export const PaubellGuide: React.FC<{ className?: string, mood?: 'happy' | 'focus' | 'calm', outfit?: string }> = ({ className = '', mood = 'happy', outfit = 'default' }) => {
  const uniqId = useId().replace(/:/g, '');
  const mintBodyId = `mint-body-${uniqId}`;
  const lilacHoodId = `lilac-hood-${uniqId}`;
  const skinId = `skin-${uniqId}`;
  const mintHornId = `mint-horn-${uniqId}`;

  return (
    <svg viewBox="-20 -40 240 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={`PaubellGuide overflow-visible ${className}`}>
      <defs>
        <radialGradient id={mintBodyId} cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="70%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#34D399" />
        </radialGradient>

        <linearGradient id={lilacHoodId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        <radialGradient id={skinId} cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#FFE4E6" />
          <stop offset="100%" stopColor="#FECDD3" />
        </radialGradient>

        <linearGradient id={mintHornId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>

      {/* HORNS */}
      <path d="M50 45 C15 -10, 40 -15, 65 20" fill="none" stroke={`url(#${mintHornId})`} strokeWidth="18" strokeLinecap="round" />
      <circle cx="35" cy="5" r="7" fill="#A7F3D0" />
      <circle cx="33" cy="3" r="2" fill="#FFFFFF" opacity="0.6" />
      
      <path d="M150 45 C185 -10, 160 -15, 135 20" fill="none" stroke={`url(#${mintHornId})`} strokeWidth="18" strokeLinecap="round" />
      <circle cx="165" cy="5" r="7" fill="#A7F3D0" />
      <circle cx="163" cy="3" r="2" fill="#FFFFFF" opacity="0.6" />

      {/* ARMS - Re-integrated but maintaining round volume */}
      <path d="M60 120 Q30 135 30 155" stroke={`url(#${lilacHoodId})`} strokeWidth="22" strokeLinecap="round" fill="none" />
      <path d="M140 120 Q170 135 170 155" stroke={`url(#${lilacHoodId})`} strokeWidth="22" strokeLinecap="round" fill="none" />
      
      {/* HANDS (Mint) - Connected hands */}
      <circle cx="30" cy="155" r="14" fill={`url(#${mintBodyId})`} />
      <circle cx="170" cy="155" r="14" fill={`url(#${mintBodyId})`} />

      {/* LEGS - Round and connected bottom */}
      <rect x="70" y="160" width="28" height="25" rx="10" fill={`url(#${lilacHoodId})`} />
      <rect x="102" y="160" width="28" height="25" rx="10" fill={`url(#${lilacHoodId})`} />
      <path d="M84 185 L84 198 Q84 205 70 205" stroke={`url(#${mintBodyId})`} strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M116 185 L116 198 Q116 205 130 205" stroke={`url(#${mintBodyId})`} strokeWidth="14" strokeLinecap="round" fill="none" />

      {/* BODY - Rounder and friendlier */}
      <path d="M100 175 C50 175, 50 85, 100 85 C150 85, 150 175, 100 175 Z" fill={`url(#${mintBodyId})`} />

      {/* NECK RUFFLES - Decorative and bridging */}
      <path d="M60 100 Q70 115 80 100 Q90 115 100 100 Q110 115 120 100 Q130 115 140 100 Z" fill="#FFFFFF" />

      {/* HOOD / HEAD - Classic Paubell proportions */}
      <rect x="30" y="25" width="140" height="90" rx="35" fill={`url(#${lilacHoodId})`} />
      <circle cx="100" cy="35" r="10" fill="#34D399" />
      <circle cx="98" cy="33" r="3" fill="#FFFFFF" opacity="0.6" />

      {/* FACE */}
      <rect x="45" y="45" width="110" height="65" rx="25" fill={`url(#${skinId})`} />

      {/* EYES - Expressive Kawaii style */}
      <g>
        <circle cx="75" cy="72" r="16" fill="#1E293B" />
        <circle cx="71" cy="65" r="6" fill="#FFFFFF" />
        <circle cx="82" cy="78" r="3" fill="#FFFFFF" opacity="0.6" />
        
        <circle cx="125" cy="72" r="16" fill="#1E293B" />
        <circle cx="121" cy="65" r="6" fill="#FFFFFF" />
        <circle cx="132" cy="78" r="3" fill="#FFFFFF" opacity="0.6" />
      </g>

      {/* EYEBROWS */}
      <path d="M60 52 Q75 42 90 52" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M140 52 Q125 42 110 52" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />

      {/* CHEEKS */}
      <ellipse cx="60" cy="90" rx="14" ry="7" fill="#F43F5E" opacity="0.2" />
      <ellipse cx="140" cy="90" rx="14" ry="7" fill="#F43F5E" opacity="0.2" />

      {/* LITTLE NOSE */}
      <path d="M98 75 Q100 78 102 75" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />

      {/* MOUTH - Expressive Cute style */}
      {mood === 'happy' && (
        <g>
          <path d="M90 85 Q100 110 110 85 Z" fill="#9F1239" stroke="#7E22CE" strokeWidth="1" />
          <path d="M92 85 L95 90 L100 85 L105 90 L108 85 Z" fill="#FFFFFF" />
        </g>
      )}
      {mood === 'calm' && (
        <path d="M92 92 Q100 98 108 92" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {mood === 'focus' && (
        <path d="M95 90 L105 90" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}

      {/* OUTFITS */}
      {outfit === 'casual' && (
        <g id="casual-style">
          {/* Beanie / Cap */}
          <path d="M40 35 Q100 5 160 35 L160 55 Q100 65 40 55 Z" fill="#6366F1" />
          <path d="M40 55 Q100 65 160 55" stroke="#4338CA" strokeWidth="4" fill="none" />
        </g>
      )}

      {outfit === 'tech' && (
        <g id="tech-gear">
          {/* Cyber Headset */}
          <rect x="25" y="50" width="15" height="40" rx="4" fill="#14B8A6" />
          <rect x="160" y="50" width="15" height="40" rx="4" fill="#14B8A6" />
          <path d="M40 50 Q100 30 160 50" stroke="#14B8A6" strokeWidth="6" fill="none" opacity="0.8" />
          <circle cx="32.5" cy="70" r="4" fill="#FFFFFF" />
          <circle cx="167.5" cy="70" r="4" fill="#FFFFFF" />
          {/* Mic */}
          <path d="M40 85 Q55 95 65 92" stroke="#14B8A6" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      )}

      {outfit === 'royal' && (
        <g id="crown">
          {/* Golden Crown */}
          <path d="M70 25 L80 5 L100 20 L120 5 L130 25 Z" fill="#FBBF24" />
          <rect x="70" y="25" width="60" height="8" rx="2" fill="#FBBF24" />
          <circle cx="80" cy="5" r="3" fill="#FBBF24" />
          <circle cx="100" cy="20" r="3" fill="#FBBF24" />
          <circle cx="120" cy="5" r="3" fill="#FBBF24" />
          {/* Rubies */}
          <circle cx="100" cy="30" r="2.5" fill="#F43F5E" />
          <circle cx="85" cy="30" r="2" fill="#3B82F6" />
          <circle cx="115" cy="30" r="2" fill="#3B82F6" />
        </g>
      )}

      {/* Aliases for old outfits to prevent breaking if selected */}
      {outfit === 'study' && (
        <g id="glasses">
          <circle cx="80" cy="70" r="18" stroke="#4F46E5" strokeWidth="4" fill="none" />
          <circle cx="120" cy="70" r="18" stroke="#4F46E5" strokeWidth="4" fill="none" />
          <path d="M98 70 L102 70" stroke="#4F46E5" strokeWidth="4" />
        </g>
      )}

      {outfit === 'sleep' && (
        <g id="sleeping-cap">
          <path d="M70 25 C90 10, 140 10, 160 40 C170 70, 145 85, 145 85 C145 85, 130 95, 150 110 L165 125 C175 135, 185 130, 185 120 C185 105, 175 80, 175 60 C175 30, 140 -5, 90 5 C60 10, 70 25, 70 25 Z" fill="#10B981" />
          <circle cx="165" cy="125" r="12" fill="#FFFFFF" />
          <path d="M70 25 Q115 15 160 40" stroke="#059669" strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>
      )}

      {outfit === 'party' && (
        <g id="party-hat">
          <path d="M100 0 L75 40 L125 40 Z" fill="#F43F5E" />
          <circle cx="100" cy="0" r="8" fill="#FBBF24" />
          <path d="M80 40 L120 40" stroke="#10B981" strokeWidth="6" strokeLinecap="round" />
          <path d="M90 20 L110 20" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};
