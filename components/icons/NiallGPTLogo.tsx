import React from 'react';

// A simple abstract logo for NiallGPT. Could be a stylized N, a spark, or a chat bubble.
// Using a simple "NG" monogram with a spark/glow for now.
export const NiallGPTLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: 'var(--logo-color-1, #D4AF37)', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: 'var(--logo-color-2, #B08D57)', stopOpacity: 1 }} />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Optional: Add a subtle background shape or glow */}
    {/* <circle cx="50" cy="50" r="45" fill="url(#goldGradient)" opacity="0.1" filter="url(#glow)" /> */}
    <text 
      x="50%" 
      y="50%" 
      dy=".3em" 
      fontFamily="Arial, Helvetica, sans-serif" 
      fontSize="50" 
      fontWeight="bold" 
      textAnchor="middle" 
      fill="url(#goldGradient)"
      // filter="url(#glow)" // Glow can make text blurry, use with care
    >
      N
    </text>
     <path d="M75 25 L70 30 L80 45 L70 60 L75 65 L85 50 Z" fill="url(#goldGradient)" opacity="0.8"/>
     <path d="M78 48 L85 45 L90 50 L85 55 Z" fill="var(--logo-color-1, #D4AF37)" />
  </svg>
);
