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
      <circle cx="35" cy="5" r="7" fill="#6EE7B7" />
      <path d="M150 45 C185 -10, 160 -15, 135 20" fill="none" stroke={`url(#${mintHornId})`} strokeWidth="18" strokeLinecap="round" />
      <circle cx="165" cy="5" r="7" fill="#6EE7B7" />

      {/* ARMS */}
      <path d="M45 120 L25 150 A 10 10 0 0 0 45 160 Z" fill={`url(#${lilacHoodId})`} />
      <path d="M155 120 L175 150 A 10 10 0 0 1 155 160 Z" fill={`url(#${lilacHoodId})`} />
      
      {/* HANDS (Mint) */}
      <circle cx="30" cy="155" r="12" fill={`url(#${mintBodyId})`} />
      <circle cx="45" cy="160" r="10" fill={`url(#${mintBodyId})`} />
      <circle cx="170" cy="155" r="12" fill={`url(#${mintBodyId})`} />
      <circle cx="155" cy="160" r="10" fill={`url(#${mintBodyId})`} />

      {/* LEGS & SHOES */}
      <rect x="70" y="155" width="25" height="18" rx="5" fill={`url(#${lilacHoodId})`} />
      <rect x="105" y="155" width="25" height="18" rx="5" fill={`url(#${lilacHoodId})`} />
      <rect x="75" y="170" width="15" height="12" fill="#FFFFFF" />
      <rect x="110" y="170" width="15" height="12" fill="#FFFFFF" />
      <path d="M70 180 Q65 195 85 195 L90 195 Q90 180 85 180 Z" fill={`url(#${mintBodyId})`} />
      <path d="M130 180 Q135 195 115 195 L110 195 Q110 180 115 180 Z" fill={`url(#${mintBodyId})`} />

      {/* BODY */}
      <path d="M100 170 C50 170, 50 80, 100 80 C150 80, 150 170, 100 170 Z" fill={`url(#${mintBodyId})`} />

      {/* NECK RUFFLES */}
      <path d="M60 100 Q70 115 80 100 Q90 115 100 100 Q110 115 120 100 Q130 115 140 100 Z" fill="#FFFFFF" />

      {/* HOOD / HEAD */}
      <rect x="30" y="25" width="140" height="90" rx="35" fill={`url(#${lilacHoodId})`} />
      <circle cx="100" cy="35" r="10" fill="#34D399" />
      <circle cx="98" cy="33" r="3" fill="#FFFFFF" opacity="0.6" />
      <circle cx="75" cy="35" r="4" fill="#6D28D9" opacity="0.4" />
      <circle cx="85" cy="35" r="4" fill="#6D28D9" opacity="0.4" />
      <circle cx="115" cy="35" r="4" fill="#6D28D9" opacity="0.4" />
      <circle cx="125" cy="35" r="4" fill="#6D28D9" opacity="0.4" />

      {/* SIDE FLAPS */}
      <path d="M35 50 Q20 60 25 70 Q15 80 25 90 Q20 100 35 105 Z" fill={`url(#${lilacHoodId})`} />
      <path d="M165 50 Q180 60 175 70 Q185 80 175 90 Q180 100 165 105 Z" fill={`url(#${lilacHoodId})`} />

      {/* FACE */}
      <rect x="45" y="45" width="110" height="65" rx="25" fill={`url(#${skinId})`} />

      {/* EYES - Kinder and more expressive */}
      <g>
        <circle cx="75" cy="72" r="15" fill="#1E293B" />
        <circle cx="72" cy="65" r="5" fill="#FFFFFF" />
        <circle cx="82" cy="78" r="3" fill="#FFFFFF" opacity="0.6" />
        
        <circle cx="125" cy="72" r="15" fill="#1E293B" />
        <circle cx="122" cy="65" r="5" fill="#FFFFFF" />
        <circle cx="132" cy="78" r="3" fill="#FFFFFF" opacity="0.6" />
      </g>

      {/* EYEBROWS - Higher and rounder */}
      <path d="M60 52 Q75 42 90 52" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M140 52 Q125 42 110 52" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />

      {/* CHEEKS */}
      <ellipse cx="60" cy="90" rx="14" ry="7" fill="#F43F5E" opacity="0.25" />
      <ellipse cx="140" cy="90" rx="14" ry="7" fill="#F43F5E" opacity="0.25" />

      {/* LITTLE NOSE */}
      <path d="M98 75 Q100 78 102 75" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />

      {/* MOUTH based on mood */}
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
