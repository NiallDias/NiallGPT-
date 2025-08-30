

import React, { useContext } from 'react';
import { NiallGPTLogo } from './icons/NiallGPTLogo';
import { AppSettingsContext } from '../contexts/AppSettingsContext';

export const LoadingScreen: React.FC = () => {
  const { currentTheme } = useContext(AppSettingsContext);

  const isRGBTheme = currentTheme.id === 'rgb';
  const isBlackGoldTheme = currentTheme.id === 'black-gold';

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center transition-colors duration-300 z-[200] animate-fade-in"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="text-center">
        <NiallGPTLogo 
            className={`w-32 h-32 sm:w-40 sm:h-40 mb-8 transition-transform hover:scale-105 ${isRGBTheme || isBlackGoldTheme ? 'niall-gpt-logo-animation' : ''}`} 
        />
        <p 
          className={`
            text-lg sm:text-xl md:text-2xl font-medium
            ${isRGBTheme ? 'animate-rgb-text-shadow' : ''}
          `}
          style={{ 
            color: isRGBTheme ? undefined : 'var(--text-accent)',
          }}
        >
          Welcome to NiallGPT
        </p>
      </div>
      <div className="absolute bottom-8 text-sm" style={{ color: 'var(--text-secondary)'}}>
        Initializing...
      </div>
    </div>
  );
};