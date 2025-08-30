import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ThemeName, Theme, UserSettings, ChatSession, ChatMessage, GroundingChunk, GalleryImage, LayoutName, Font, FontName, Sender, CodeLabProject } from '../types';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

export const themes: Theme[] = [
  { id: 'aurora', name: 'Aurora' },
  { id: 'sapphire', name: 'Sapphire' },
  { id: 'black-gold', name: 'Black & Gold' },
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'rgb', name: 'RGB Delight' },
  { id: 'rainbow', name: 'Rainbow Sherbet' },
  { id: 'night-sky', name: 'Night Sky' },
  { id: 'ocean-breeze', name: 'Ocean Breeze' },
  { id: 'forest-whisper', name: 'Forest Whisper' },
  { id: 'cherry-blossom', name: 'Cherry Blossom' },
];

export const fonts: Font[] = [
  { id: 'inter', name: 'Inter', cssVariable: 'var(--font-family-sans)' },
  { id: 'roboto', name: 'Roboto', cssVariable: 'var(--font-family-roboto)' },
  { id: 'lora', name: 'Lora', cssVariable: 'var(--font-family-serif)' },
  { id: 'poppins', name: 'Poppins', cssVariable: 'var(--font-family-display)' },
];

const DEFAULT_THEME = themes[0]; 
const DEFAULT_FONT = fonts[0];
const DEFAULT_USER_NAME = '';
const DEFAULT_AI_BEHAVIOR = '';
const DEFAULT_LAYOUT: LayoutName = 'modern';
const MAX_GALLERY_IMAGES = 15; // Limit to prevent localStorage quota issues.

const createInitialDefaultChatSession = (globalUserName?: string, globalAiBehavior?: string): ChatSession => ({
  id: crypto.randomUUID(),
  name: 'Chat 1',
  messages: [],
  timestamp: Date.now(),
  sessionUserName: globalUserName,
  sessionAiBehavior: globalAiBehavior,
});

interface AppSettingsContextProps extends UserSettings {
  currentTheme: Theme;
  setCurrentThemeById: (themeId: ThemeName) => void;
  currentFont: Font;
  setCurrentFontById: (fontId: FontName) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  setUserName: (name: string) => void; 
  setAIBehavior: (behavior: string) => void; 
  resetAllSettings: () => void;
  layout: LayoutName;
  setLayout: (layout: LayoutName) => void;
  animatedBackgrounds: boolean;
  setAnimatedBackgrounds: (enabled: boolean) => void;
  isModernSidebarCollapsed: boolean;
  setIsModernSidebarCollapsed: (isCollapsed: boolean) => void;

  chatSessions: ChatSession[];
  activeChatSessionId: string | null;
  setActiveChatSessionId: (sessionId: string | null) => void;
  createChatSession: (name?: string) => ChatSession;
  deleteChatSession: (sessionId: string) => void;
  renameChatSession: (sessionId: string, newName: string) => void;
  updateChatSessionMessages: (sessionId: string, newMessages: ChatMessage[]) => void;
  getActiveChatSession: () => ChatSession | undefined;
  updateActiveChatSessionSettings: (settings: { userName?: string; aiBehavior?: string }) => void;
  
  updateStreamingMessage: (sessionId: string, messageId: string, textChunk: string, isInitialChunk: boolean, groundingChunks?: GroundingChunk[]) => void;
  completeStreamingMessage: (sessionId: string, messageId: string, finalFullText: string, wasAborted: boolean, suggestions?: string[]) => void;
  
  imageGallery: GalleryImage[];
  addToImageGallery: (image: GalleryImage) => void;
  deleteFromImageGallery: (imageId: string) => void;

  redirectedPrompt: string | null;
  setRedirectedPrompt: (prompt: string | null) => void;

  memory: string[];
  addMemoryItem: (item: string) => void;
  deleteMemoryItem: (index: number) => void;
  updateMemoryItem: (index: number, newItem: string) => void;
  
  codeLabProjects: CodeLabProject[];
  addCodeLabProject: (project: Omit<CodeLabProject, 'id' | 'timestamp'>) => CodeLabProject;
  deleteCodeLabProject: (projectId: string) => void;
  updateCodeLabProject: (projectId: string, updates: Partial<Omit<CodeLabProject, 'id'>>) => void;
}

export const AppSettingsContext = createContext<AppSettingsContextProps>({
  currentTheme: DEFAULT_THEME,
  setCurrentThemeById: () => {},
  currentFont: DEFAULT_FONT,
  setCurrentFontById: () => {},
  isSettingsModalOpen: false,
  setIsSettingsModalOpen: () => {},
  userName: DEFAULT_USER_NAME,
  aiBehavior: DEFAULT_AI_BEHAVIOR,
  setUserName: () => {},
  setAIBehavior: () => {},
  resetAllSettings: () => {},
  layout: DEFAULT_LAYOUT,
  setLayout: () => {},
  animatedBackgrounds: true,
  setAnimatedBackgrounds: () => {},
  isModernSidebarCollapsed: false,
  setIsModernSidebarCollapsed: () => {},
  chatSessions: [],
  activeChatSessionId: null,
  setActiveChatSessionId: () => {},
  createChatSession: () => createInitialDefaultChatSession(),
  deleteChatSession: () => {},
  renameChatSession: () => {},
  updateChatSessionMessages: () => {},
  getActiveChatSession: () => undefined,
  updateActiveChatSessionSettings: () => {},
  updateStreamingMessage: () => {},
  completeStreamingMessage: () => {},
  imageGallery: [],
  addToImageGallery: () => {},
  deleteFromImageGallery: () => {},
  redirectedPrompt: null,
  setRedirectedPrompt: () => {},
  memory: [],
  addMemoryItem: () => {},
  deleteMemoryItem: () => {},
  updateMemoryItem: () => {},
  codeLabProjects: [],
  addCodeLabProject: () => ({ id: '', name: '', code: '', language: '', timestamp: 0 }),
  deleteCodeLabProject: () => {},
  updateCodeLabProject: () => {},
});

interface AppSettingsProviderProps {
  children: ReactNode;
}

export const AppSettingsProvider: React.FC<AppSettingsProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<Theme>(() => {
    const storedThemeId = localStorage.getItem('themeId') as ThemeName | null;
    return themes.find(t => t.id === storedThemeId) || DEFAULT_THEME;
  });

  const [currentFont, setCurrentFontState] = useState<Font>(() => {
    const storedFontId = localStorage.getItem('fontId') as FontName | null;
    return fonts.find(f => f.id === storedFontId) || DEFAULT_FONT;
  });

  const [userName, setUserNameState] = useState<string>(() => localStorage.getItem('globalUserName') || DEFAULT_USER_NAME);
  const [aiBehavior, setAIBehaviorState] = useState<string>(() => localStorage.getItem('globalAiBehavior') || DEFAULT_AI_BEHAVIOR);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [redirectedPrompt, setRedirectedPrompt] = useState<string | null>(null);
  const [layout, setLayoutState] = useState<LayoutName>(() => (localStorage.getItem('layout') as LayoutName) || DEFAULT_LAYOUT);
  const [animatedBackgrounds, setAnimatedBackgroundsState] = useState<boolean>(() => {
    const stored = localStorage.getItem('animatedBackgrounds');
    // Default to true if not set or is 'true'
    return stored === 'false' ? false : true;
  });
  const [isModernSidebarCollapsed, setIsModernSidebarCollapsedState] = useState<boolean>(() => {
    const stored = localStorage.getItem('isModernSidebarCollapsed');
    return stored === 'true'; // Default to false if not set
  });

  const [chatSessions, setChatSessionsState] = useState<ChatSession[]>(() => {
    const storedSessions = localStorage.getItem('chatSessions');
    if (storedSessions) {
      try {
        const decompressed = decompressFromUTF16(storedSessions);
        if (decompressed) {
          const parsed = JSON.parse(decompressed);
          return Array.isArray(parsed) ? parsed : [];
        }
        // Fallback for old, uncompressed data
        const parsed = JSON.parse(storedSessions);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Failed to load/parse chat sessions. Data might be corrupted.", e);
        localStorage.removeItem('chatSessions'); // Clear corrupted data
        return [];
      }
    }
    return [];
  });
  
  const [activeChatSessionId, setActiveChatSessionIdState] = useState<string | null>(() => {
    return localStorage.getItem('activeChatSessionId');
  });

  const [imageGallery, setImageGalleryState] = useState<GalleryImage[]>(() => {
    const storedGallery = localStorage.getItem('imageGallery');
    if (storedGallery) {
      try {
        const decompressed = decompressFromUTF16(storedGallery);
        if (decompressed) {
          const parsed = JSON.parse(decompressed);
          return Array.isArray(parsed) ? parsed : [];
        }
        // Fallback for old, uncompressed data
        const parsed = JSON.parse(storedGallery);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Failed to load/parse image gallery. Data might be corrupted.", e);
        localStorage.removeItem('imageGallery'); // Clear corrupted data
        return [];
      }
    }
    return [];
  });
  
  const [memory, setMemory] = useState<string[]>(() => {
    const stored = localStorage.getItem('niallGptMemory');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    }
    return [];
  });
  
  const [codeLabProjects, setCodeLabProjects] = useState<CodeLabProject[]>(() => {
    const stored = localStorage.getItem('codeLabProjects');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    }
    return [];
  });

  // Initialize default chat if none exist or activeId is invalid
  useEffect(() => {
    const currentLoadedSessions = chatSessions; 
    const currentLoadedActiveId = activeChatSessionId;
    const globalDefaultUserName = userName; 
    const globalDefaultAiBehavior = aiBehavior;

    if (currentLoadedSessions.length === 0) {
      const newSession = createInitialDefaultChatSession(globalDefaultUserName, globalDefaultAiBehavior);
      setChatSessionsState([newSession]);
      setActiveChatSessionIdState(newSession.id);
    } else if (!currentLoadedActiveId || !currentLoadedSessions.find(s => s.id === currentLoadedActiveId)) {
      const sortedSessions = [...currentLoadedSessions].sort((a, b) => b.timestamp - a.timestamp);
      setActiveChatSessionIdState(sortedSessions.length > 0 ? sortedSessions[0].id : null);
    }
  }, []); // Run only once on mount to initialize state from localStorage

  useEffect(() => {
    localStorage.setItem('themeId', currentTheme.id);
    const root = window.document.documentElement;
    // Remove all theme classes first
    themes.forEach(theme => {
      root.classList.remove(`theme-${theme.id}`);
    });
    // Fix: Explicitly remove theme-modern to prevent background from persisting
    root.classList.remove('theme-modern');

    // Add the currently selected theme class
    root.classList.add(`theme-${currentTheme.id}`);
    
    const darkThemes: ThemeName[] = ['aurora', 'sapphire', 'dark', 'black-gold', 'rgb', 'night-sky'];
    const isDark = darkThemes.includes(currentTheme.id);
    root.classList.toggle('dark', isDark);
    root.classList.toggle('no-animated-backgrounds', !animatedBackgrounds);
    
    // Switch highlight.js theme
    const lightHljsTheme = document.getElementById('hljs-light-theme') as HTMLLinkElement;
    const darkHljsTheme = document.getElementById('hljs-dark-theme') as HTMLLinkElement;
    if (lightHljsTheme && darkHljsTheme) {
        lightHljsTheme.disabled = isDark;
        darkHljsTheme.disabled = !isDark;
    }
  }, [currentTheme, animatedBackgrounds]);

  useEffect(() => {
    localStorage.setItem('fontId', currentFont.id);
    document.documentElement.style.setProperty('--font-primary', currentFont.cssVariable);
  }, [currentFont]);

  useEffect(() => { localStorage.setItem('globalUserName', userName); }, [userName]);
  useEffect(() => { localStorage.setItem('globalAiBehavior', aiBehavior); }, [aiBehavior]);
  useEffect(() => { localStorage.setItem('layout', layout); }, [layout]);
  useEffect(() => { localStorage.setItem('animatedBackgrounds', String(animatedBackgrounds)); }, [animatedBackgrounds]);
  useEffect(() => { localStorage.setItem('isModernSidebarCollapsed', String(isModernSidebarCollapsed)); }, [isModernSidebarCollapsed]);


  useEffect(() => {
    try {
      const compressedSessions = compressToUTF16(JSON.stringify(chatSessions));
      localStorage.setItem('chatSessions', compressedSessions);
    } catch (e) {
      console.error("Failed to save chat sessions to localStorage:", e);
      alert("Error: Could not save your chat history. Your browser's storage might be full.");
    }
  }, [chatSessions]);

  useEffect(() => { 
    if (activeChatSessionId) localStorage.setItem('activeChatSessionId', activeChatSessionId);
    else localStorage.removeItem('activeChatSessionId');
  }, [activeChatSessionId]);
  
  useEffect(() => {
    try {
      const compressedGallery = compressToUTF16(JSON.stringify(imageGallery));
      localStorage.setItem('imageGallery', compressedGallery);
    } catch (e) {
      console.error("Failed to save image gallery to localStorage:", e);
      alert("Error: Could not save the image gallery. Your browser's storage might be full.");
    }
  }, [imageGallery]);

  useEffect(() => {
    localStorage.setItem('niallGptMemory', JSON.stringify(memory));
  }, [memory]);

  useEffect(() => {
    localStorage.setItem('codeLabProjects', JSON.stringify(codeLabProjects));
  }, [codeLabProjects]);

  const setCurrentThemeById = (themeId: ThemeName) => {
    const foundTheme = themes.find(t => t.id === themeId);
    if (foundTheme) setCurrentThemeState(foundTheme);
  };

  const setCurrentFontById = (fontId: FontName) => {
    const foundFont = fonts.find(f => f.id === fontId);
    if (foundFont) setCurrentFontState(foundFont);
  };

  const setLayout = (layoutName: LayoutName) => {
    setLayoutState(layoutName);
  };
  
  const setAnimatedBackgrounds = (enabled: boolean) => {
    setAnimatedBackgroundsState(enabled);
  };

  const setIsModernSidebarCollapsed = (isCollapsed: boolean) => {
    setIsModernSidebarCollapsedState(isCollapsed);
  };

  const setUserName = (name: string) => setUserNameState(name.trim());
  const setAIBehavior = (behavior: string) => setAIBehaviorState(behavior.trim());
  
  const setActiveChatSessionId = (sessionId: string | null) => {
    setActiveChatSessionIdState(sessionId);
  };

  const createChatSession = (name?: string): ChatSession => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      name: name || `Chat ${chatSessions.length + 1}`, 
      messages: [],
      timestamp: Date.now(),
      sessionUserName: userName, 
      sessionAiBehavior: aiBehavior, 
    };
    setChatSessionsState(prevSessions => [...prevSessions, newSession]);
    setActiveChatSessionIdState(newSession.id);
    return newSession;
  };

  const deleteChatSession = (sessionIdToDelete: string) => {
    const sessionsAfterDelete = chatSessions.filter(s => s.id !== sessionIdToDelete);

    if (sessionsAfterDelete.length === 0) {
        // If no chats are left, create a new default one and make it active.
        const newDefaultChat = createInitialDefaultChatSession(userName, aiBehavior);
        setChatSessionsState([newDefaultChat]);
        setActiveChatSessionIdState(newDefaultChat.id);
        return;
    }

    // Update session list first
    setChatSessionsState(sessionsAfterDelete);

    // If the active chat was deleted, select the most recent remaining one.
    if (activeChatSessionId === sessionIdToDelete) {
        const sortedRemaining = [...sessionsAfterDelete].sort((a, b) => b.timestamp - a.timestamp);
        setActiveChatSessionIdState(sortedRemaining[0].id);
    }
    // If a non-active chat was deleted, the active ID doesn't need to change.
  };

  const renameChatSession = (sessionId: string, newName: string) => {
    setChatSessionsState(prevSessions =>
      prevSessions.map(s => (s.id === sessionId ? { ...s, name: newName.trim(), timestamp: Date.now() } : s))
    );
  };

  const updateChatSessionMessages = (sessionId: string, newMessages: ChatMessage[]) => {
    setChatSessionsState(prevSessions =>
      prevSessions.map(s =>
        s.id === sessionId ? { ...s, messages: newMessages, timestamp: Date.now() } : s
      )
    );
  };
  
  const getActiveChatSession = (): ChatSession | undefined => {
    return chatSessions.find(session => session.id === activeChatSessionId);
  };

  const updateActiveChatSessionSettings = (settings: { userName?: string; aiBehavior?: string }) => {
    if (!activeChatSessionId) return;
    setChatSessionsState(prevSessions => 
      prevSessions.map(session => {
        if (session.id === activeChatSessionId) {
          const updatedSession = {
            ...session,
            sessionUserName: settings.userName !== undefined ? settings.userName.trim() : session.sessionUserName,
            sessionAiBehavior: settings.aiBehavior !== undefined ? settings.aiBehavior.trim() : session.sessionAiBehavior,
            timestamp: Date.now(),
          };
          return updatedSession;
        }
        return session;
      })
    );
  };
  
  const addToImageGallery = (image: GalleryImage) => {
    setImageGalleryState(prev => {
        const newGallery = [image, ...prev];
        // Enforce a limit to prevent localStorage from exceeding its quota.
        if (newGallery.length > MAX_GALLERY_IMAGES) {
            return newGallery.slice(0, MAX_GALLERY_IMAGES);
        }
        return newGallery;
    });
  };

  const deleteFromImageGallery = (imageId: string) => {
    setImageGalleryState(prev => prev.filter(img => img.id !== imageId));
  };


  const resetAllSettings = () => {
    // Clear relevant localStorage items
    localStorage.removeItem('themeId');
    localStorage.removeItem('fontId');
    localStorage.removeItem('globalUserName');
    localStorage.removeItem('globalAiBehavior');
    localStorage.removeItem('chatSessions');
    localStorage.removeItem('activeChatSessionId');
    localStorage.removeItem('imageGallery');
    localStorage.removeItem('niallGptMemory');
    localStorage.removeItem('layout');
    localStorage.removeItem('animatedBackgrounds');
    localStorage.removeItem('codeLabProjects');
    localStorage.removeItem('isModernSidebarCollapsed');

    // Reset state to defaults
    setCurrentThemeState(DEFAULT_THEME);
    setCurrentFontState(DEFAULT_FONT);
    setUserNameState(DEFAULT_USER_NAME);
    setAIBehaviorState(DEFAULT_AI_BEHAVIOR);
    setMemory([]);
    setLayoutState(DEFAULT_LAYOUT);
    setAnimatedBackgroundsState(true);
    setIsModernSidebarCollapsedState(false);
    const newDefaultChat = createInitialDefaultChatSession(DEFAULT_USER_NAME, DEFAULT_AI_BEHAVIOR);
    setChatSessionsState([newDefaultChat]);
    setActiveChatSessionIdState(newDefaultChat.id); 
    setImageGalleryState([]);
    setCodeLabProjects([]);
    setIsSettingsModalOpen(false);
  };

  const updateStreamingMessage = (sessionId: string, messageId: string, textChunk: string, isInitialChunk: boolean, groundingChunks?: GroundingChunk[]) => {
    setChatSessionsState(prevSessions =>
      prevSessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            messages: session.messages.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  text: isInitialChunk ? textChunk : (msg.text === '...' ? textChunk : msg.text + textChunk),
                  groundingChunks: groundingChunks || msg.groundingChunks,
                  isLoading: true,
                };
              }
              return msg;
            }),
            timestamp: Date.now(), 
          };
        }
        return session;
      })
    );
  };

  const completeStreamingMessage = (sessionId: string, messageId: string, finalFullText: string, wasAborted: boolean, suggestions?: string[]) => {
    const textForMessage = finalFullText;
     setChatSessionsState(prevSessions =>
      prevSessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            messages: session.messages.map(msg =>
              msg.id === messageId ? { 
                ...msg, 
                text: textForMessage.trim() === '' ? (wasAborted ? '[Stopped by user]' : '[Empty Response]') : textForMessage, 
                isLoading: false,
                suggestions: suggestions,
              } : msg
            ),
            timestamp: Date.now(), 
          };
        }
        return session;
      })
    );
  };

  const addMemoryItem = (item: string) => {
    const trimmedItem = item.trim();
    if (!trimmedItem) return;
    setMemory(prev => {
        // Prevent duplicates
        if (prev.includes(trimmedItem)) {
            return prev;
        }
        return [trimmedItem, ...prev]; // Add to top for visibility in settings
    });
  };

  const deleteMemoryItem = (indexToDelete: number) => {
      setMemory(prev => prev.filter((_, index) => index !== indexToDelete));
  };

  const updateMemoryItem = (indexToUpdate: number, newItem: string) => {
    const trimmedItem = newItem.trim();
    if (!trimmedItem) {
        // If the user saves an empty string, delete the item instead.
        deleteMemoryItem(indexToUpdate);
        return;
    }
    setMemory(prev => {
        // Prevent duplicate entries
        if (prev.some((item, index) => item === trimmedItem && index !== indexToUpdate)) {
            return prev;
        }
        return prev.map((item, index) => index === indexToUpdate ? trimmedItem : item);
    });
  };
  
  const addCodeLabProject = (project: Omit<CodeLabProject, 'id' | 'timestamp'>): CodeLabProject => {
    const newProject: CodeLabProject = {
      ...project,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setCodeLabProjects(prev => [newProject, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    return newProject;
  };

  const deleteCodeLabProject = (projectId: string) => {
      setCodeLabProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const updateCodeLabProject = (projectId: string, updates: Partial<Omit<CodeLabProject, 'id'>>) => {
      setCodeLabProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, ...updates, timestamp: Date.now() } : p
      ).sort((a, b) => b.timestamp - a.timestamp));
  };

  return (
    <AppSettingsContext.Provider 
        value={{ 
            currentTheme, 
            setCurrentThemeById, 
            currentFont,
            setCurrentFontById,
            isSettingsModalOpen, 
            setIsSettingsModalOpen,
            userName, 
            setUserName, 
            aiBehavior, 
            setAIBehavior, 
            resetAllSettings,
            layout,
            setLayout,
            animatedBackgrounds,
            setAnimatedBackgrounds,
            isModernSidebarCollapsed,
            setIsModernSidebarCollapsed,
            chatSessions,
            activeChatSessionId,
            setActiveChatSessionId,
            createChatSession,
            deleteChatSession,
            renameChatSession,
            updateChatSessionMessages,
            getActiveChatSession,
            updateActiveChatSessionSettings,
            updateStreamingMessage,
            completeStreamingMessage,
            imageGallery,
            addToImageGallery,
            deleteFromImageGallery,
            redirectedPrompt,
            setRedirectedPrompt,
            memory,
            addMemoryItem,
            deleteMemoryItem,
            updateMemoryItem,
            codeLabProjects,
            addCodeLabProject,
            deleteCodeLabProject,
            updateCodeLabProject,
        }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};