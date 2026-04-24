import React from 'react';

export const PaubellGuide: React.FC<{ className?: string, mood?: 'happy' | 'focus' | 'calm' }> = ({ className = '', mood = 'happy' }) => {
  return (
    <img 
      src="/mascot.png" 
      alt={`Paubéll Mascot - ${mood}`} 
      className={`object-contain drop-shadow-xl ${className}`} 
      draggable="false"
    />
  );
};
