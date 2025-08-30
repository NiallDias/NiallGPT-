


import React, { useContext, useState, useEffect } from 'react';
import { AppView } from '../types';
import { ChatIcon } from './icons/ChatIcon';
import { ImageIcon } from './icons/ImageIcon';
import { AppSettingsContext } from '../contexts/AppSettingsContext'; 
import { SettingsIcon } from './icons/SettingsIcon';
import { MenuIcon } from './icons/MenuIcon';
import { CommandIcon } from './icons/CommandIcon';
import { CubeTransparentIcon } from './icons/CubeTransparentIcon';
import { LanguageIcon } from './icons/LanguageIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { PaintBrushIcon } from './icons/PaintBrushIcon';

// A single digit flipper component
const TimeDigit: React.FC<{ digit: string }> = ({ digit }) => {
    return (
        <div className="relative w-4 h-7 text-lg font-mono font-bold perspective-100">
            <span 
                key={digit} 
                className="absolute inset-0 flex items-center justify-center animate-digit-flip" 
                style={{ backfaceVisibility: 'hidden', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: '3px' }}
            >
                 {digit}
            </span>
        </div>
    );
};


const AnimatedClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);

    const formatTime = (t: Date) => {
        return {
            hours: t.getHours().toString().padStart(2, '0'),
            minutes: t.getMinutes().toString().padStart(2, '0'),
            seconds: t.getSeconds().toString().padStart(2, '0'),
        };
    };

    const { hours, minutes, seconds } = formatTime(time);

    return (
        <div className="flex items-center space-x-0.5 p-1 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)' }} aria-label={`Current time: ${time.toLocaleTimeString()}`}>
            <TimeDigit digit={hours[0]} />
            <TimeDigit digit={hours[1]} />
            <span className="font-bold text-lg animate-pulse-glow" style={{ color: 'var(--text-accent)' }}>:</span>
            <TimeDigit digit={minutes[0]} />
            <TimeDigit digit={minutes[1]} />
            <span className="font-bold text-lg animate-pulse-glow" style={{ color: 'var(--text-accent)' }}>:</span>
            <TimeDigit digit={seconds[0]} />
            <TimeDigit digit={seconds[1]} />
        </div>
    );
};

interface NavbarProps {
  currentView: AppView;
  onSetView: (view: AppView) => void;
  toggleSidebar: () => void;
  openCommandPalette: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSetView, toggleSidebar, openCommandPalette }) => {
  const { currentTheme, setIsSettingsModalOpen } = useContext(AppSettingsContext); 
  const [hoveredView, setHoveredView] = useState<AppView | null>(null);
  const [settingsHovered, setSettingsHovered] = useState(false);

  const navItems = [
    { view: AppView.Chat, label: 'Chat', icon: <ChatIcon className="w-5 h-5 mr-2" /> },
    { view: AppView.ImageGenerator, label: 'Image Generator', icon: <ImageIcon className="w-5 h-5 mr-2" /> },
    { view: AppView.VideoGenerator, label: 'Video Generator', icon: <VideoCameraIcon className="w-5 h-5 mr-2" /> },
    { view: AppView.AIPhotoEditor, label: 'AI Photo Editor', icon: <PaintBrushIcon className="w-5 h-5 mr-2" /> },
    { view: AppView.Translator, label: 'Translator', icon: <LanguageIcon className="w-5 h-5 mr-2" /> },
    { view: AppView.AITools, label: 'AI Tools', icon: <CubeTransparentIcon className="w-5 h-5 mr-2" /> },
  ];

  const isRGBTheme = currentTheme.id === 'rgb';
  const isBlackGoldTheme = currentTheme.id === 'black-gold';

  return (
    <nav 
        className="p-3 shadow-lg sticky top-0 z-50 transition-colors duration-300 animate-fade-in"
        style={{ backgroundColor: 'var(--navbar-bg)', color: 'var(--navbar-text)' }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full transition-colors duration-150 hover:scale-110 animate-bounce-in"
              style={{ color: 'var(--navbar-text)', animationDelay: '50ms' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--navbar-item-hover-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Toggle sidebar"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="animate-bounce-in" style={{ animationDelay: '100ms' }}>
                <AnimatedClock />
            </div>
            <span 
                className={`text-lg sm:text-xl md:text-2xl font-bold block transition-transform duration-300 hover:scale-105 animate-bounce-in ${isRGBTheme || isBlackGoldTheme ? 'niall-gpt-logo-animation' : ''}`}
                style={{ color: 'var(--navbar-text)', animationDelay: '150ms' }}
            >
                NiallGPT
            </span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item, index) => {
            const isActive = currentView === item.view;
            const isHovered = hoveredView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onSetView(item.view)}
                onMouseEnter={() => setHoveredView(item.view)}
                onMouseLeave={() => setHoveredView(null)}
                className={`
                  flex items-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-100 animate-bounce-in
                `}
                style={{
                  color: isActive ? 'var(--navbar-item-active-text)' : 'var(--navbar-text)',
                  backgroundColor: isActive ? 'var(--navbar-item-active-bg)' : (!isActive && isHovered ? 'var(--navbar-item-hover-bg)' : 'transparent'),
                  boxShadow: isActive ? (isRGBTheme ? 'none' : `0 0 8px -2px var(--text-accent)`) : 'none',
                  animationDelay: `${200 + index * 100}ms`
                }}
                aria-label={`Switch to ${item.label} view`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.label.split(' ')[0]}</span>
              </button>
            )
          })}
          <button
            onClick={openCommandPalette}
            className="p-2 rounded-full transition-colors duration-150 hover:scale-110 animate-bounce-in"
            style={{ 
                color: 'var(--settings-icon-color)',
                animationDelay: `${200 + navItems.length * 100}ms`
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--settings-icon-hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Open command palette (Ctrl+K)"
            title="Command Palette (Ctrl+K)"
          >
            <CommandIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            onMouseEnter={() => setSettingsHovered(true)}
            onMouseLeave={() => setSettingsHovered(false)}
            className="p-2 rounded-full transition-colors duration-150 hover:scale-110 animate-bounce-in"
            style={{ 
                color: 'var(--settings-icon-color)',
                backgroundColor: settingsHovered ? 'var(--settings-icon-hover-bg)' : 'transparent',
                animationDelay: `${300 + navItems.length * 100}ms`
            }}
            aria-label="Open settings"
          >
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
};