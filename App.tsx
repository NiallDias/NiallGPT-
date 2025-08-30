import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ChatView } from './components/ChatView';
import { ImageGeneratorView } from './components/ImageGeneratorView';
import { AppView, LayoutName } from './types';
import { AppSettingsContext } from './contexts/AppSettingsContext';
import { SettingsModal } from './components/SettingsModal';
import { LoadingScreen } from './components/LoadingScreen'; 
import { ChatSidebar } from './components/ChatSidebar';
import './components/HtmlPreviewModal'; // Ensure it's bundled
import { PolicyView } from './components/PolicyView';
import { SharedChatView } from './components/SharedChatView';
import { CommandPalette } from './components/CommandPalette';
import { AIToolsView } from './components/AIToolsView';
import { ModernSidebar } from './components/modern/ModernSidebar';
import { ModernDashboard } from './components/modern/ModernDashboard';
import { CodeLabView } from './components/ai-tools/CodeLabView';
import { CalculatorView } from './components/ai-tools/CalculatorView';
import { TranslatorView } from './components/ai-tools/TranslatorView';
import { VideoGeneratorView } from './components/VideoGeneratorView';
import { VideoCallView } from './components/VideoCallView';
import { AIPhotoEditorView } from './components/AIPhotoEditorView';

const App: React.FC = () => {
  const { isSettingsModalOpen, setIsSettingsModalOpen, chatSessions, activeChatSessionId, layout, isModernSidebarCollapsed } = useContext(AppSettingsContext);
  
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const initialLayout = (localStorage.getItem('layout') as LayoutName) || 'modern';
    if (initialLayout === 'modern') {
      return AppView.Dashboard;
    }
    return AppView.Chat;
  });

  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [sharedContent, setSharedContent] = useState<string | null>(null);
  const [isCheckingHash, setIsCheckingHash] = useState(true);
  
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    const stored = localStorage.getItem('sidebarVisible');
    return stored !== null ? stored === 'true' : true;
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    if (layout === 'standard') {
        localStorage.setItem('sidebarVisible', String(isSidebarVisible));
    }
  }, [isSidebarVisible, layout]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith('#share/')) {
        const compressedData = window.location.hash.substring('#share/'.length);
        setSharedContent(compressedData);
      } else {
        setSharedContent(null);
      }
      setIsCheckingHash(false);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check on load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (chatSessions.length > 0 && activeChatSessionId !== undefined) {
       const timer = setTimeout(() => setIsAppReady(true), 100); 
       return () => clearTimeout(timer);
    }
  }, [chatSessions, activeChatSessionId]);

  const [showExtendedLoading, setShowExtendedLoading] = useState(true);
   useEffect(() => {
    const extendedTimer = setTimeout(() => setShowExtendedLoading(false), 1500);
    return () => clearTimeout(extendedTimer);
  }, []);

  useEffect(() => {
    if (layout === 'standard' || layout === 'focused') {
      if ([AppView.Dashboard, AppView.CodeLab, AppView.Calculator, AppView.AIPhotoEditor].includes(currentView)) {
        setCurrentView(AppView.Chat);
      }
    } else if (layout === 'modern' && currentView === AppView.Chat && !activeChatSessionId) {
      // If we switch to modern and are somehow in chat view with no active chat, go to dashboard.
      setCurrentView(AppView.Dashboard);
    }
  }, [layout, currentView, activeChatSessionId]);


  if (isCheckingHash || (!sharedContent && (!isAppReady || showExtendedLoading))) {
    return <LoadingScreen />;
  }
  
  if (sharedContent) {
    return <SharedChatView compressedData={sharedContent} />;
  }

  if (currentView === AppView.Policy) {
    return <PolicyView onSetView={setCurrentView} />;
  }
  
  if (currentView === AppView.VideoCall) {
    return <VideoCallView onSetView={setCurrentView} />;
  }

  if (currentView === AppView.AIPhotoEditor) {
    return <AIPhotoEditorView onSetView={setCurrentView} />;
  }

  // MODERN LAYOUT
  if (layout === 'modern') {
    const renderModernView = () => {
        switch(currentView) {
            case AppView.Dashboard: return <ModernDashboard onSetView={setCurrentView} />;
            case AppView.ImageGenerator: return <ImageGeneratorView />;
            case AppView.VideoGenerator: return <VideoGeneratorView />;
            case AppView.AITools: return <AIToolsView onSetView={setCurrentView} />;
            case AppView.CodeLab: return <CodeLabView />;
            case AppView.Calculator: return <CalculatorView />;
            case AppView.Translator: return <TranslatorView />;
            case AppView.Chat:
            default: return <ChatView onSetView={setCurrentView} />;
        }
    };

    return (
        <div className={`h-screen overflow-hidden font-modern modern-layout ${isModernSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <ModernSidebar 
                currentView={currentView}
                onSetView={setCurrentView}
                openCommandPalette={() => setIsCommandPaletteOpen(true)}
                openSettings={() => setIsSettingsModalOpen(true)}
            />
            <main className="min-w-0 flex flex-col overflow-hidden relative main-content-glow">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 body-grid-bg">
                    <div className="w-full h-full animate-view-change">
                        {renderModernView()}
                    </div>
                </div>
            </main>
            {isSettingsModalOpen && <SettingsModal onSetView={setCurrentView} />}
            {isCommandPaletteOpen && <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} onSetView={setCurrentView} />}
        </div>
    );
  }

  // STANDARD / FOCUSED LAYOUT
  return (
    <div 
        className={`h-screen flex flex-col transition-colors duration-300 overflow-hidden`}
        style={{ color: 'var(--text-primary)' }}
    >
      <Navbar 
        currentView={currentView} 
        onSetView={setCurrentView}
        toggleSidebar={toggleSidebar}
        openCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar isVisible={isSidebarVisible} onSetView={setCurrentView} />
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className={`w-full h-full animate-view-change ${layout === 'focused' ? 'max-w-5xl mx-auto' : ''}`}>
            {currentView === AppView.Chat && <ChatView onSetView={setCurrentView} />}
            {currentView === AppView.ImageGenerator && <ImageGeneratorView />}
            {currentView === AppView.VideoGenerator && <VideoGeneratorView />}
            {currentView === AppView.AITools && <AIToolsView onSetView={setCurrentView} />}
            {currentView === AppView.Translator && <TranslatorView />}
          </div>
        </main>
      </div>
      {isSettingsModalOpen && <SettingsModal onSetView={setCurrentView} />}
      {isCommandPaletteOpen && <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} onSetView={setCurrentView} />}
    </div>
  );
};

export default App;