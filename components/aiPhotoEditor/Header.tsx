
import React from 'react';
import { NiallGPTLogo } from '../icons/NiallGPTLogo';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon';

interface HeaderProps {
    onGoBack: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onGoBack }) => {
  return (
    <header className="flex-shrink-0 p-3 flex items-center justify-between bg-[var(--bg-secondary)] z-30 border-b border-[var(--border-primary)] shadow-sm animate-fade-in">
      <div className="flex items-center space-x-3">
        <NiallGPTLogo className="w-8 h-8" />
        <h1 className="text-xl font-bold text-[var(--text-primary)]">AI Photo Editor</h1>
      </div>
      
      <button 
        onClick={onGoBack}
        className="flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 bg-[var(--bg-tertiary)] hover:bg-[var(--icon-hover-bg)] text-[var(--text-primary)]"
        aria-label="Go back to AI Tools"
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back to AI Tools
      </button>
    </header>
  );
};
