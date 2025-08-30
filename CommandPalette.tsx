

import React, { useState, useEffect, useMemo, useContext, useRef, useCallback } from 'react';
import { AppSettingsContext, themes } from '../contexts/AppSettingsContext';
import { AppView, ChatSession } from '../types';
import { SearchIcon } from './icons/SearchIcon';
import { ChatIcon } from './icons/ChatIcon';
import { ImageIcon } from './icons/ImageIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { PlusIcon } from './icons/PlusIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { CubeTransparentIcon } from './icons/CubeTransparentIcon';
import { BeakerIcon } from './icons/BeakerIcon';
import { Squares2X2Icon } from './icons/Squares2X2Icon';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { LanguageIcon } from './icons/LanguageIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';

interface Command {
  id: string;
  name: string;
  section: 'Navigation' | 'Actions' | 'Themes' | 'Chats';
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  onClose: () => void;
  onSetView: (view: AppView) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, onSetView }) => {
  const { 
    setIsSettingsModalOpen, 
    setCurrentThemeById, 
    chatSessions, 
    setActiveChatSessionId,
    createChatSession,
    layout,
  } = useContext(AppSettingsContext);

  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200); // Match animation duration
  }, [onClose]);

  const commands: Command[] = useMemo(() => {
    const themeCommands: Command[] = themes.map(theme => ({
      id: `theme-${theme.id}`,
      name: `Set Theme: ${theme.name}`,
      section: 'Themes',
      icon: theme.id.includes('light') || theme.id.includes('breeze') || theme.id.includes('rainbow') ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>,
      action: () => setCurrentThemeById(theme.id),
      keywords: `theme ${theme.name}`
    }));
    
    const chatCommands: Command[] = [...chatSessions]
      .sort((a,b) => b.timestamp - a.timestamp)
      .map(chat => ({
        id: `chat-${chat.id}`,
        name: chat.name,
        section: 'Chats',
        icon: <ChatIcon className="w-5 h-5" />,
        action: () => {
            setActiveChatSessionId(chat.id);
            onSetView(AppView.Chat);
        },
        keywords: 'chat conversation jump to'
    }));
    
    const navigationCommands: Command[] = [
        { id: 'goto-chat', name: 'Go to Chat', section: 'Navigation', icon: <ChatIcon className="w-5 h-5"/>, action: () => onSetView(AppView.Chat), keywords: 'home conversation' },
        ...(layout === 'modern' ? [{ id: 'goto-dashboard', name: 'Go to Dashboard', section: 'Navigation' as const, icon: <Squares2X2Icon className="w-5 h-5"/>, action: () => onSetView(AppView.Dashboard), keywords: 'home main start' }] : []),
        { id: 'goto-image', name: 'Go to Image Generator', section: 'Navigation', icon: <ImageIcon className="w-5 h-5"/>, action: () => onSetView(AppView.ImageGenerator), keywords: 'imagine create' },
        { id: 'goto-video', name: 'Go to Video Generator', section: 'Navigation', icon: <VideoCameraIcon className="w-5 h-5"/>, action: () => onSetView(AppView.VideoGenerator), keywords: 'movie film create' },
        { id: 'goto-translator', name: 'Go to Translator', section: 'Navigation', icon: <LanguageIcon className="w-5 h-5"/>, action: () => onSetView(AppView.Translator), keywords: 'translate language' },
        { id: 'goto-tools', name: 'Go to AI Tools', section: 'Navigation', icon: <CubeTransparentIcon className="w-5 h-5"/>, action: () => onSetView(AppView.AITools), keywords: 'apps describe prompt' },
        ...(layout === 'modern' ? [{ id: 'goto-codelab', name: 'Go to Code Lab', section: 'Navigation' as const, icon: <BeakerIcon className="w-5 h-5"/>, action: () => onSetView(AppView.CodeLab), keywords: 'code programming dev' }] : []),
        ...(layout === 'modern' ? [{ id: 'goto-calculator', name: 'Go to Calculator', section: 'Navigation' as const, icon: <CalculatorIcon className="w-5 h-5"/>, action: () => onSetView(AppView.Calculator), keywords: 'math solve' }] : []),
        { id: 'open-settings', name: 'Open Settings', section: 'Navigation', icon: <SettingsIcon className="w-5 h-5"/>, action: () => setIsSettingsModalOpen(true) },
        { id: 'view-policy', name: 'View Policy & Terms', section: 'Navigation', icon: <DocumentTextIcon className="w-5 h-5"/>, action: () => onSetView(AppView.Policy), keywords: 'legal privacy' },
    ];

    return [
      ...navigationCommands,
      { id: 'new-chat', name: 'New Chat', section: 'Actions', icon: <PlusIcon className="w-5 h-5"/>, action: () => { createChatSession(); onSetView(AppView.Chat) } },
      ...themeCommands,
      ...chatCommands
    ];
  }, [chatSessions, onSetView, setIsSettingsModalOpen, setCurrentThemeById, setActiveChatSessionId, createChatSession, layout]);

  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    const lowercasedSearch = search.toLowerCase();
    return commands.filter(cmd => 
      cmd.name.toLowerCase().includes(lowercasedSearch) ||
      cmd.section.toLowerCase().includes(lowercasedSearch) ||
      (cmd.keywords && cmd.keywords.toLowerCase().includes(lowercasedSearch))
    );
  }, [search, commands]);
  
  const groupedCommands = useMemo(() => {
    return filteredCommands.reduce((acc, cmd) => {
        (acc[cmd.section] = acc[cmd.section] || []).push(cmd);
        return acc;
    }, {} as Record<string, Command[]>);
  }, [filteredCommands]);

  const flatCommands = useMemo(() => Object.values(groupedCommands).flat(), [groupedCommands]);

  useEffect(() => {
    setActiveIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : flatCommands.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev < flatCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const command = flatCommands[activeIndex];
        if (command) {
          command.action();
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, flatCommands, handleClose]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  useEffect(() => {
    const activeElement = document.getElementById(`command-${flatCommands[activeIndex]?.id}`);
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, flatCommands]);
  
  const handleSelectCommand = useCallback((cmd: Command) => {
    cmd.action();
    handleClose();
  }, [handleClose]);

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-60 flex justify-center pt-[15vh] p-4 z-[100] transition-opacity duration-300 ${isClosing ? 'animate-fade-out-fast' : 'animate-fade-in'}`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-2xl rounded-lg shadow-2xl flex flex-col overflow-hidden ${isClosing ? 'animate-command-palette-disappear' : 'animate-command-palette-appear'}`}
        style={{
          backgroundColor: 'var(--modal-bg)',
          border: '1px solid var(--border-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center p-3 border-b" style={{borderColor: 'var(--border-primary)'}}>
          <SearchIcon className="w-5 h-5 mr-3 flex-shrink-0" style={{color: 'var(--text-secondary)'}}/>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full bg-transparent focus:outline-none text-base"
            style={{color: 'var(--text-primary)'}}
          />
        </div>
        <div ref={listRef} className="flex-grow overflow-y-auto max-h-[50vh] p-2">
            {flatCommands.length > 0 ? (
                Object.entries(groupedCommands).map(([section, cmds]) => (
                    <div key={section} className="mb-2">
                        <h3 className="text-xs font-semibold uppercase px-2 py-1" style={{color: 'var(--text-secondary)'}}>{section}</h3>
                        <ul>
                            {cmds.map(cmd => {
                                const isSelected = cmd.id === flatCommands[activeIndex]?.id;
                                return (
                                <li key={cmd.id}>
                                    <button
                                        id={`command-${cmd.id}`}
                                        onClick={() => handleSelectCommand(cmd)}
                                        className="w-full flex items-center text-left p-2 rounded-md"
                                        style={{ 
                                            backgroundColor: isSelected ? 'var(--icon-hover-bg)' : 'transparent',
                                            color: isSelected ? 'var(--text-accent)' : 'var(--text-primary)'
                                        }}
                                    >
                                        <span className="mr-3" style={{color: isSelected ? 'var(--text-accent)' : 'var(--text-secondary)'}}>{cmd.icon}</span>
                                        <span>{cmd.name}</span>
                                    </button>
                                </li>
                            )})}
                        </ul>
                    </div>
                ))
            ) : (
                <div className="text-center p-8" style={{color: 'var(--text-secondary)'}}>
                    <p>No results found for "{search}"</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};