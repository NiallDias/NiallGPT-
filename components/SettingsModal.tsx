

import React, { useContext, useState, useEffect } from 'react';
import { AppSettingsContext, themes, fonts } from '../contexts/AppSettingsContext';
import { AppView, ThemeName, ChatSession, FontName } from '../types';
import { XCircleIcon } from './icons/XCircleIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { TrashIcon } from './icons/TrashIcon';
import { LayoutStandardIcon } from './icons/LayoutStandardIcon';
import { LayoutFocusedIcon } from './icons/LayoutFocusedIcon';
import { PencilIcon } from './icons/PencilIcon';
import { SparkleIcon } from './icons/SparkleIcon';

const DEFAULT_BEHAVIOR_PLACEHOLDER = "e.g., Be very concise. / Act like a pirate and call me 'matey'. / Explain complex topics simply.";

const aiPresets = [
  { name: "Creative", behavior: "Be highly creative, expressive, and a bit playful. Use emojis where appropriate and feel free to be more conversational." },
  { name: "Concise", behavior: "Be strictly concise and to the point. Provide factual information without elaboration unless asked. Avoid conversational filler." },
  { name: "Formal", behavior: "Maintain a professional and formal tone. Structure answers clearly and avoid slang, emojis, or overly casual language." },
  { name: "Simple", behavior: "Explain things in the simplest terms possible, as if talking to a beginner. Use analogies and avoid jargon." },
  { name: "Socratic", behavior: "Act as a Socratic tutor. Don't give direct answers. Instead, ask guiding questions to help me think and arrive at the answer myself." },
];

const themeGroups: Record<string, ThemeName[]> = {
    "Showcase Themes": ['aurora', 'rgb', 'black-gold', 'night-sky', 'cherry-blossom'],
    "Focus Themes": ['light', 'dark', 'sapphire'],
    "Creative Themes": ['rainbow', 'ocean-breeze', 'forest-whisper'],
};

const AIPresets: React.FC<{ setBehavior: (behavior: string) => void }> = ({ setBehavior }) => (
  <div className="mt-2">
    <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Or select a preset:</p>
    <div className="flex flex-wrap gap-2">
      {aiPresets.map(preset => (
        <button
          key={preset.name}
          onClick={() => setBehavior(preset.behavior)}
          className="px-3 py-1 text-xs rounded-full transition-colors hover:scale-105"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
          title={preset.behavior}
        >
          {preset.name}
        </button>
      ))}
    </div>
  </div>
);

interface SettingsModalProps {
  onSetView: (view: AppView) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onSetView }) => {
  const { 
    currentTheme, 
    setCurrentThemeById,
    currentFont,
    setCurrentFontById,
    setIsSettingsModalOpen,
    userName: globalUserName, // Global default user name
    setUserName: setGlobalUserName, // Sets global default user name
    aiBehavior: globalAiBehavior, // Global default AI behavior
    setAIBehavior: setGlobalAIBehavior, // Sets global default AI behavior
    resetAllSettings,
    getActiveChatSession,
    updateActiveChatSessionSettings,
    memory,
    deleteMemoryItem,
    updateMemoryItem,
    layout,
    setLayout,
    animatedBackgrounds,
    setAnimatedBackgrounds,
  } = useContext(AppSettingsContext);

  const activeChatSession = getActiveChatSession();
  const [isClosing, setIsClosing] = useState(false);

  // State for global settings form
  const [localGlobalUserName, setLocalGlobalUserName] = useState(globalUserName);
  const [localGlobalAIBehavior, setLocalGlobalAIBehavior] = useState(globalAiBehavior);
  const [globalUserNameSaved, setGlobalUserNameSaved] = useState(false);
  const [globalBehaviorSaved, setGlobalBehaviorSaved] = useState(false);

  // State for active chat settings form
  const [localActiveChatUserName, setLocalActiveChatUserName] = useState('');
  const [localActiveChatAIBehavior, setLocalActiveChatAIBehavior] = useState('');
  const [activeChatUserNameSaved, setActiveChatUserNameSaved] = useState(false);
  const [activeChatBehaviorSaved, setActiveChatBehaviorSaved] = useState(false);
  
  const [deletingMemoryIndex, setDeletingMemoryIndex] = useState<number | null>(null);
  const [editingMemoryIndex, setEditingMemoryIndex] = useState<number | null>(null);
  const [editingMemoryText, setEditingMemoryText] = useState<string>('');


  useEffect(() => {
    setLocalGlobalUserName(globalUserName);
    setLocalGlobalAIBehavior(globalAiBehavior);
  }, [globalUserName, globalAiBehavior]);

  useEffect(() => {
    if (activeChatSession) {
      setLocalActiveChatUserName(activeChatSession.sessionUserName ?? globalUserName); // Fallback to global if not set
      setLocalActiveChatAIBehavior(activeChatSession.sessionAiBehavior ?? globalAiBehavior); // Fallback to global if not set
    }
  }, [activeChatSession, globalUserName, globalAiBehavior]);

  const handleThemeChange = (themeId: ThemeName) => {
    setCurrentThemeById(themeId);
  };

  const handleFontChange = (fontId: FontName) => {
    setCurrentFontById(fontId);
  };
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
        setIsSettingsModalOpen(false);
    }, 300); // Duration of the animation
  };

  const handleSaveGlobalUserName = () => {
    setGlobalUserName(localGlobalUserName);
    setGlobalUserNameSaved(true);
    setTimeout(() => setGlobalUserNameSaved(false), 2000);
  };

  const handleSaveGlobalAIBehavior = () => {
    setGlobalAIBehavior(localGlobalAIBehavior);
    setGlobalBehaviorSaved(true);
    setTimeout(() => setGlobalBehaviorSaved(false), 2000);
  };

  const handleSaveActiveChatUserName = () => {
    if (activeChatSession) {
      updateActiveChatSessionSettings({ userName: localActiveChatUserName });
      setActiveChatUserNameSaved(true);
      setTimeout(() => setActiveChatUserNameSaved(false), 2000);
    }
  };
  
  const handleSaveActiveChatAIBehavior = () => {
    if (activeChatSession) {
      updateActiveChatSessionSettings({ aiBehavior: localActiveChatAIBehavior });
      setActiveChatBehaviorSaved(true);
      setTimeout(() => setActiveChatBehaviorSaved(false), 2000);
    }
  };
  
  const handleViewPolicies = () => {
    onSetView(AppView.Policy);
    setIsSettingsModalOpen(false);
  };

  const handleDeleteMemoryClick = (indexToDelete: number) => {
    // Prevent another delete action while one is animating
    if (deletingMemoryIndex !== null) return;

    setDeletingMemoryIndex(indexToDelete);
    setTimeout(() => {
      deleteMemoryItem(indexToDelete);
      setDeletingMemoryIndex(null);
    }, 400); // Matches .animate-bounce-out duration
  };

  const handleEditMemoryClick = (index: number, currentText: string) => {
      setEditingMemoryIndex(index);
      setEditingMemoryText(currentText);
  };

  const handleCancelEditMemory = () => {
      setEditingMemoryIndex(null);
      setEditingMemoryText('');
  };

  const handleSaveEditMemory = () => {
      if (editingMemoryIndex !== null) {
          updateMemoryItem(editingMemoryIndex, editingMemoryText);
      }
      handleCancelEditMemory();
  };

  const handleEditInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleSaveEditMemory();
      } else if (e.key === 'Escape') {
          handleCancelEditMemory();
      }
  };

  const isModernActive = layout === 'modern';
  const isStandardActive = layout === 'standard';
  const isFocusedActive = layout === 'focused';

  return (
    <div 
        className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[100] transition-opacity duration-300 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
        onClick={handleClose}
    >
      <div 
        className={`p-6 rounded-lg shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto ${isClosing ? 'animate-modal-disappear' : 'animate-modal-appear'}`}
        style={{ 
            backgroundColor: 'var(--modal-bg)', 
            border: `1px solid var(--modal-border)`,
            boxShadow: 'var(--modal-shadow)' 
        }}
        onClick={(e) => e.stopPropagation()} 
      >
        <button 
            onClick={handleClose}
            className="absolute top-3 right-3 p-1 rounded-full transition-colors"
            style={{color: 'var(--icon-color)'}}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Close settings"
        >
            <XCircleIcon className="w-6 h-6" />
        </button>
        <h2 
            className="text-2xl font-semibold mb-6 text-center"
            style={{color: 'var(--text-accent)'}}
        >
            Settings
        </h2>

        {/* Permanent Memory Section */}
        <div className="mb-6 p-4 rounded-md" style={{border: `1px solid var(--border-primary)`}}>
          <h3 className="text-lg font-semibold mb-3" style={{color: 'var(--text-accent)'}}>Permanent Memory</h3>
          <p className="text-xs mb-3" style={{color: 'var(--text-secondary)'}}>
              Things you've asked NiallGPT to remember. This memory is applied to all chats.
          </p>
          {memory.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 rounded-md">
              {memory.map((item, index) => (
                <div 
                    key={index} 
                    className={`flex items-center justify-between p-2 rounded-md ${deletingMemoryIndex === index ? 'animate-bounce-out' : 'animate-subtle-pop-in'}`}
                    style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        animationDelay: deletingMemoryIndex === null ? `${index * 30}ms` : '0s'
                    }}
                >
                  {editingMemoryIndex === index ? (
                      <div className="flex-grow flex items-center space-x-2 w-full">
                          <input
                              type="text"
                              value={editingMemoryText}
                              onChange={(e) => setEditingMemoryText(e.target.value)}
                              onKeyDown={handleEditInputKeyDown}
                              className="w-full p-1 rounded-md themed-focus-ring text-sm"
                              style={{backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)'}}
                              autoFocus
                              onFocus={(e) => e.target.select()}
                          />
                          <div className="flex-shrink-0 flex items-center space-x-1">
                              <button onClick={handleSaveEditMemory} className="px-2 py-1 text-xs rounded" style={{backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)'}}>Save</button>
                              <button onClick={handleCancelEditMemory} className="px-2 py-1 text-xs rounded" style={{backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)'}}>Cancel</button>
                          </div>
                      </div>
                  ) : (
                      <>
                          <p className="text-sm flex-grow mr-2 break-all" style={{color: 'var(--text-primary)'}}>{item}</p>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                              <button 
                                  onClick={() => handleEditMemoryClick(index, item)}
                                  className="p-1 rounded-full hover:bg-[var(--icon-hover-bg)] transition-colors"
                                  style={{ color: 'var(--icon-color)' }}
                                  aria-label={`Edit memory: ${item}`}
                              >
                                  <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                  onClick={() => handleDeleteMemoryClick(index)}
                                  disabled={deletingMemoryIndex !== null}
                                  className="p-1 rounded-full hover:bg-[var(--icon-hover-bg)] transition-colors disabled:opacity-50"
                                  style={{ color: 'var(--danger-bg)' }}
                                  aria-label={`Delete memory: ${item}`}
                              >
                                  <TrashIcon className="w-4 h-4" />
                              </button>
                          </div>
                      </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center p-4 rounded-md" style={{color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)'}}>Memory is empty.</p>
          )}
        </div>


        {/* Global User Preferences Section */}
        <div className="mb-6 p-4 rounded-md" style={{border: `1px solid var(--border-primary)`}}>
            <h3 className="text-lg font-semibold mb-3" style={{color: 'var(--text-accent)'}}>Global Defaults (for New Chats)</h3>
            <div className="mb-4">
                <label htmlFor="globalUserName" className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>Default User Name</label>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        id="globalUserName"
                        value={localGlobalUserName}
                        onChange={(e) => setLocalGlobalUserName(e.target.value)}
                        placeholder="Default name for new chats"
                        className="w-full p-2 rounded-md themed-focus-ring"
                        style={{backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)'}}
                    />
                    <button 
                        onClick={handleSaveGlobalUserName}
                        className="px-3 py-2 text-sm rounded-md whitespace-nowrap"
                        style={{backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)'}}
                    >
                        {globalUserNameSaved ? "Saved!" : "Save Default"}
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="globalAiBehavior" className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>Default AI Behavior</label>
                <p className="text-xs mb-1" style={{color: 'var(--text-secondary)'}}>How new chats should behave.</p>
                <div className="flex flex-col space-y-2">
                    <textarea
                        id="globalAiBehavior"
                        value={localGlobalAIBehavior}
                        onChange={(e) => setLocalGlobalAIBehavior(e.target.value)}
                        placeholder={DEFAULT_BEHAVIOR_PLACEHOLDER}
                        rows={3}
                        className="w-full p-2 rounded-md themed-focus-ring resize-y"
                        style={{backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)'}}
                    />
                    <AIPresets setBehavior={setLocalGlobalAIBehavior} />
                    <button 
                        onClick={handleSaveGlobalAIBehavior}
                        className="px-3 py-2 text-sm rounded-md self-end whitespace-nowrap mt-2"
                        style={{backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)'}}
                    >
                         {globalBehaviorSaved ? "Saved!" : "Save Default"}
                    </button>
                </div>
            </div>
        </div>
        
        {/* Active Chat Settings Section */}
        {activeChatSession && (
          <div className="mb-6 p-4 rounded-md" style={{border: `1px solid var(--border-primary)`}}>
            <h3 className="text-lg font-semibold mb-3" style={{color: 'var(--text-accent)'}}>
                Settings for: <span className="font-bold italic">"{activeChatSession.name}"</span>
            </h3>
            <div className="mb-4">
                <label htmlFor="activeChatUserName" className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>User Name for this Chat</label>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        id="activeChatUserName"
                        value={localActiveChatUserName}
                        onChange={(e) => setLocalActiveChatUserName(e.target.value)}
                        placeholder={`Using default: ${globalUserName || 'None'}`}
                        className="w-full p-2 rounded-md themed-focus-ring"
                        style={{backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)'}}
                    />
                    <button 
                        onClick={handleSaveActiveChatUserName}
                        className="px-3 py-2 text-sm rounded-md whitespace-nowrap"
                        style={{backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)'}}
                    >
                        {activeChatUserNameSaved ? "Saved!" : "Save for Chat"}
                    </button>
                </div>
            </div>
            <div>
                <label htmlFor="activeChatAiBehavior" className="block text-sm font-medium mb-1" style={{color: 'var(--text-secondary)'}}>AI Behavior for this Chat</label>
                 <p className="text-xs mb-1" style={{color: 'var(--text-secondary)'}}>Define how NiallGPT behaves in this specific chat.</p>
                <div className="flex flex-col space-y-2">
                    <textarea
                        id="activeChatAiBehavior"
                        value={localActiveChatAIBehavior}
                        onChange={(e) => setLocalActiveChatAIBehavior(e.target.value)}
                        placeholder={globalAiBehavior || DEFAULT_BEHAVIOR_PLACEHOLDER}
                        rows={3}
                        className="w-full p-2 rounded-md themed-focus-ring resize-y"
                        style={{backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)'}}
                    />
                    <AIPresets setBehavior={setLocalActiveChatAIBehavior} />
                    <button 
                        onClick={handleSaveActiveChatAIBehavior}
                        className="px-3 py-2 text-sm rounded-md self-end whitespace-nowrap mt-2"
                        style={{backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)'}}
                    >
                         {activeChatBehaviorSaved ? "Saved!" : "Save for Chat"}
                    </button>
                </div>
            </div>
          </div>
        )}

        {/* Layout Selection Section */}
        <div className="mb-8">
            <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--text-accent)'}}>Layout</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                    onClick={() => setLayout('modern')}
                    className={`p-4 rounded-md border transition-all duration-200 flex flex-col items-center justify-center text-center active:scale-100
                        ${isModernActive ? 'scale-[1.03]' : 'hover:scale-105 hover:border-[var(--text-accent)] hover:bg-[var(--bg-tertiary)]'}
                    `}
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: isModernActive ? 'var(--text-accent)' : 'var(--text-primary)',
                        borderColor: isModernActive ? 'var(--text-accent)' : 'var(--border-primary)',
                        boxShadow: isModernActive ? `0 0 10px -1px var(--text-accent)` : 'none',
                    }}
                    aria-pressed={isModernActive}
                >
                    <SparkleIcon className="w-8 h-8 mb-2"/>
                    <h4 className="font-semibold mb-1 text-sm">Modern</h4>
                    <p className="text-xs" style={{color: 'var(--text-secondary)'}}>A sleek, new interface.</p>
                </button>
                <button
                    onClick={() => setLayout('standard')}
                    className={`p-4 rounded-md border transition-all duration-200 flex flex-col items-center justify-center text-center active:scale-100
                        ${isStandardActive ? 'scale-[1.03]' : 'hover:scale-105 hover:border-[var(--text-accent)] hover:bg-[var(--bg-tertiary)]'}
                    `}
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: isStandardActive ? 'var(--text-accent)' : 'var(--text-primary)',
                        borderColor: isStandardActive ? 'var(--text-accent)' : 'var(--border-primary)',
                        boxShadow: isStandardActive ? `0 0 10px -1px var(--text-accent)` : 'none',
                    }}
                    aria-pressed={isStandardActive}
                >
                    <LayoutStandardIcon className="w-8 h-8 mb-2"/>
                    <h4 className="font-semibold mb-1 text-sm">Standard</h4>
                    <p className="text-xs" style={{color: 'var(--text-secondary)'}}>The default full-width layout.</p>
                </button>
                <button
                    onClick={() => setLayout('focused')}
                    className={`p-4 rounded-md border transition-all duration-200 flex flex-col items-center justify-center text-center active:scale-100
                        ${isFocusedActive ? 'scale-[1.03]' : 'hover:scale-105 hover:border-[var(--text-accent)] hover:bg-[var(--bg-tertiary)]'}
                    `}
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: isFocusedActive ? 'var(--text-accent)' : 'var(--text-primary)',
                        borderColor: isFocusedActive ? 'var(--text-accent)' : 'var(--border-primary)',
                        boxShadow: isFocusedActive ? `0 0 10px -1px var(--text-accent)` : 'none',
                    }}
                    aria-pressed={isFocusedActive}
                >
                    <LayoutFocusedIcon className="w-8 h-8 mb-2"/>
                    <h4 className="font-semibold mb-1 text-sm">Focused</h4>
                    <p className="text-xs" style={{color: 'var(--text-secondary)'}}>Centered content for reading.</p>
                </button>
            </div>
        </div>

        {/* Theme Selection Section */}
        <div className="mb-8 transition-opacity duration-300">
            <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--text-accent)'}}>Select Theme</h3>
            {Object.entries(themeGroups).map(([groupName, themeIds]) => (
                <div key={groupName} className="mb-4">
                    <h4 className="text-sm font-semibold mb-2" style={{color: 'var(--text-secondary)'}}>{groupName}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {themes.filter(t => themeIds.includes(t.id)).map((theme) => {
                            const isActive = currentTheme.id === theme.id;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => handleThemeChange(theme.id)}
                                    className="p-4 rounded-md text-sm font-medium border transition-all duration-200 flex flex-col items-center justify-center h-24 hover:scale-105 active:scale-100"
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: isActive ? 'var(--text-accent)' : 'var(--text-primary)',
                                        borderColor: 'var(--border-primary)',
                                        boxShadow: isActive ? `0 0 10px -1px var(--text-accent)` : 'none',
                                        transform: isActive ? 'scale(1.03)' : 'scale(1)',
                                    }}
                                    aria-pressed={isActive}
                                >
                                    <div className="w-8 h-8 rounded-full mb-2 theme-swatch" data-themeid={theme.id}></div>
                                    {theme.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>

        {/* Font Selection Section */}
        {layout !== 'modern' && (
          <div className="mb-8 transition-opacity duration-300">
              <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--text-accent)'}}>Typography</h3>
              <div className="grid grid-cols-2 gap-3">
                  {fonts.map((font) => {
                      const isActive = currentFont.id === font.id;
                      return (
                          <button
                              key={font.id}
                              onClick={() => handleFontChange(font.id)}
                              className="p-4 rounded-md text-sm font-medium border transition-all duration-200 flex items-center justify-center h-20 hover:scale-105 active:scale-100"
                              style={{
                                  backgroundColor: 'var(--bg-secondary)',
                                  color: isActive ? 'var(--text-accent)' : 'var(--text-primary)',
                                  borderColor: 'var(--border-primary)',
                                  boxShadow: isActive ? `0 0 10px -1px var(--text-accent)` : 'none',
                                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                                  fontFamily: font.cssVariable,
                                  fontSize: '1rem',
                              }}
                              aria-pressed={isActive}
                          >
                              {font.name}
                          </button>
                      );
                  })}
              </div>
          </div>
        )}
        
        {/* Visual Effects Section */}
        <div className="mb-8">
            <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--text-accent)'}}>Visual Effects</h3>
            <div className="p-4 rounded-md flex items-center justify-between" style={{backgroundColor: 'var(--bg-tertiary)'}}>
                <div>
                  <label htmlFor="animated-bg-toggle" className="font-medium cursor-pointer" style={{color: 'var(--text-primary)'}}>
                    Enable Theme Animations
                  </label>
                  <p className="text-xs mt-1" style={{color: 'var(--text-secondary)'}}>
                    Toggles effects like falling petals, moving stars, or spinning nebulas on certain themes.
                  </p>
                </div>
                <label htmlFor="animated-bg-toggle" className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="animated-bg-toggle" 
                    className="sr-only peer" 
                    checked={animatedBackgrounds}
                    onChange={(e) => setAnimatedBackgrounds(e.target.checked)}
                  />
                  <div className="w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-[var(--focus-ring-color)] bg-[var(--bg-input)] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-[var(--border-primary)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--button-accent-bg)]"></div>
                </label>
            </div>
        </div>

        {/* Legal & Application Settings Section */}
        <div>
            <h3 className="text-xl font-semibold mb-3" style={{color: 'var(--text-accent)'}}>Legal & Application</h3>
            <div className="space-y-4">
                <button
                    onClick={handleViewPolicies}
                    className="w-full text-left px-4 py-3 text-sm rounded-md transition-colors flex items-center"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                >
                    <DocumentTextIcon className="w-5 h-5 mr-3 flex-shrink-0" style={{color: 'var(--text-secondary)'}}/>
                    <span>Privacy Policy & Terms of Service</span>
                </button>
            </div>
        </div>

        <div className="text-center mt-6 text-xs" style={{color: 'var(--text-secondary)'}}>
            Pro-tip: Press <kbd className="px-2 py-1 text-xs font-sans font-semibold rounded" style={{backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)'}}>Ctrl/Cmd</kbd> + <kbd className="px-2 py-1 text-xs font-sans font-semibold rounded" style={{backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)'}}>K</kbd> to open the command palette.
        </div>
      </div>
      <style>{`
        .theme-swatch[data-themeid="light"] { background-color: #ffffff; border: 1px solid #e5e7eb; }
        .theme-swatch[data-themeid="dark"] { background-color: #171717; border: 1px solid #404040; }
        .theme-swatch[data-themeid="black-gold"] { background-color: #0A0A0A; border: 1px solid #B08D57; }
        .theme-swatch[data-themeid="rgb"] { background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red); border: 1px solid #a2b4ca; }
        .theme-swatch[data-themeid="aurora"] { background: linear-gradient(45deg, #03040B, #141728, #38bdf8); border: 1px solid #38bdf8; }
        .theme-swatch[data-themeid="sapphire"] { background-color: #0B1229; border: 1px solid #3B82F6; }
        .theme-swatch[data-themeid="rainbow"] {
          background: linear-gradient(45deg, #ff007f, #00c6ff);
          border: 1px solid var(--border-primary);
          background-clip: padding-box; /* Fix for potential oval shape rendering */
        }
        .theme-swatch[data-themeid="night-sky"] { background-color: #0d1120; border: 1px solid #7c3aed; }
        .theme-swatch[data-themeid="ocean-breeze"] { background-color: #e0ffff; border: 1px solid #005f5f; }
        .theme-swatch[data-themeid="forest-whisper"] { background-color: #f0fff0; border: 1px solid #228b22; }
        .theme-swatch[data-themeid="cherry-blossom"] { background: linear-gradient(45deg, #FF7A9A, #FFE5E9); border: 1px solid #FADAE0; }
      `}</style>
    </div>
  );
};