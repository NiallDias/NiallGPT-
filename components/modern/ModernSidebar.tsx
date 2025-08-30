import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppSettingsContext } from '../../contexts/AppSettingsContext';
import { AppView, ChatSession } from '../../types';
import { NiallGPTLogo } from '../icons/NiallGPTLogo';
import { Squares2X2Icon } from '../icons/Squares2X2Icon';
import { BeakerIcon } from '../icons/BeakerIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { CommandIcon } from '../icons/CommandIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { ChatIcon } from '../icons/ChatIcon';
import { ThreeDotsVerticalIcon } from '../icons/ThreeDotsVerticalIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { RenameChatModal } from '../RenameChatModal';
import { SearchIcon } from '../icons/SearchIcon';
import { ChevronDoubleLeftIcon } from '../icons/ChevronDoubleLeftIcon';
import { ChevronDoubleRightIcon } from '../icons/ChevronDoubleRightIcon';
import { ImageIcon } from '../icons/ImageIcon';
import { CubeTransparentIcon } from '../icons/CubeTransparentIcon';
import { CalculatorIcon } from '../icons/CalculatorIcon';
import { LanguageIcon } from '../icons/LanguageIcon';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import { ShareIcon } from '../icons/ShareIcon';
import { ShareChatModal } from '../ShareChatModal';
import { PaintBrushIcon } from '../icons/PaintBrushIcon';

interface ModernSidebarProps {
    currentView: AppView;
    onSetView: (view: AppView) => void;
    openCommandPalette: () => void;
    openSettings: () => void;
}

const CollapsedNavButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void; }> = ({ label, icon, isActive, onClick }) => (
    <div className="tooltip-container">
        <button
            onClick={onClick}
            className={`p-3 rounded-lg relative transition-colors ${isActive ? 'bg-[var(--bg-tertiary)] text-[var(--text-accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
        >
            {icon}
            {isActive && <div className="absolute left-0 top-1/4 h-1/2 w-1 bg-[var(--text-accent)] rounded-r-full"></div>}
        </button>
        <span className="tooltip-text">{label}</span>
    </div>
);

export const ModernSidebar: React.FC<ModernSidebarProps> = ({ currentView, onSetView, openCommandPalette, openSettings }) => {
    const { 
        chatSessions, 
        activeChatSessionId, 
        setActiveChatSessionId, 
        createChatSession,
        deleteChatSession,
        isModernSidebarCollapsed,
        setIsModernSidebarCollapsed,
    } = useContext(AppSettingsContext);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [showOptionsMenuFor, setShowOptionsMenuFor] = useState<string | null>(null);
    const [renamingChat, setRenamingChat] = useState<ChatSession | null>(null);
    const [sharingChat, setSharingChat] = useState<ChatSession | null>(null);
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
    const optionsMenuRef = useRef<HTMLDivElement>(null);
    const [isAnimatingClose, setIsAnimatingClose] = useState(false);
    
    const sortedSessions = [...chatSessions].sort((a, b) => b.timestamp - a.timestamp);
    const filteredSessions = sortedSessions.filter(session =>
        session.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
            setShowOptionsMenuFor(null);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectChat = (sessionId: string) => {
        setActiveChatSessionId(sessionId);
        onSetView(AppView.Chat);
        setShowOptionsMenuFor(null);
    };

    const handleNewChat = () => {
        const newSession = createChatSession();
        setActiveChatSessionId(newSession.id);
        onSetView(AppView.Chat);
    };

    const handleDeleteChat = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setShowOptionsMenuFor(null);
        setDeletingChatId(sessionId);
        setTimeout(() => {
            deleteChatSession(sessionId);
            setDeletingChatId(null);
        }, 400); 
    };
    
    const handleRenameChat = (e: React.MouseEvent, session: ChatSession) => {
        e.stopPropagation();
        setRenamingChat(session);
        setShowOptionsMenuFor(null);
    };

    const handleShareChat = (e: React.MouseEvent, session: ChatSession) => {
        e.stopPropagation();
        setSharingChat(session);
        setShowOptionsMenuFor(null);
    };

    const handleVideoCall = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setActiveChatSessionId(sessionId);
        onSetView(AppView.VideoCall);
        setShowOptionsMenuFor(null);
    };
    
    const handleCollapse = () => {
        if (isAnimatingClose) return;
        setIsAnimatingClose(true);
        setTimeout(() => {
            setIsModernSidebarCollapsed(true);
            setIsAnimatingClose(false);
        }, 300); // Animation duration
    };

    const NavButton: React.FC<{
        label: string;
        icon: React.ReactNode;
        isActive: boolean;
        onClick: () => void;
    }> = ({ label, icon, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center p-3 rounded-lg text-left transition-colors duration-150 relative sidebar-chat-button ${isActive ? 'active bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
        >
            <div className="mr-3">{icon}</div>
            <p className="font-semibold text-sm">{label}</p>
        </button>
    );

    if (isModernSidebarCollapsed && !isAnimatingClose) {
        return (
            <aside className="h-full bg-[var(--bg-secondary)] flex flex-col border-r border-[var(--border-primary)] sidebar-grid-bg transition-all duration-300 ease-in-out overflow-hidden">
                <div className="flex flex-col h-full items-center justify-between py-3">
                    <div className="flex flex-col items-center space-y-2">
                        <button onClick={() => setIsModernSidebarCollapsed(false)} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]" title="Expand Sidebar">
                            <NiallGPTLogo className="w-8 h-8"/>
                        </button>
                        <div className="w-full px-2">
                            <hr className="border-t border-[var(--border-primary)]" />
                        </div>
                        <CollapsedNavButton label="New Chat" icon={<PlusIcon className="w-6 h-6"/>} isActive={false} onClick={handleNewChat} />
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2">
                        <CollapsedNavButton label="Discover" icon={<Squares2X2Icon className="w-6 h-6"/>} isActive={currentView === AppView.Dashboard} onClick={() => onSetView(AppView.Dashboard)} />
                        <CollapsedNavButton label="Image Generator" icon={<ImageIcon className="w-6 h-6"/>} isActive={currentView === AppView.ImageGenerator} onClick={() => onSetView(AppView.ImageGenerator)} />
                        <CollapsedNavButton label="Video Generator" icon={<VideoCameraIcon className="w-6 h-6"/>} isActive={currentView === AppView.VideoGenerator} onClick={() => onSetView(AppView.VideoGenerator)} />
                        <CollapsedNavButton label="AI Photo Editor" icon={<PaintBrushIcon className="w-6 h-6"/>} isActive={currentView === AppView.AIPhotoEditor} onClick={() => onSetView(AppView.AIPhotoEditor)} />
                        <CollapsedNavButton label="Translator" icon={<LanguageIcon className="w-6 h-6"/>} isActive={currentView === AppView.Translator} onClick={() => onSetView(AppView.Translator)} />
                        <CollapsedNavButton label="AI Tools" icon={<CubeTransparentIcon className="w-6 h-6"/>} isActive={currentView === AppView.AITools} onClick={() => onSetView(AppView.AITools)} />
                        <CollapsedNavButton label="Code Lab" icon={<BeakerIcon className="w-6 h-6"/>} isActive={currentView === AppView.CodeLab} onClick={() => onSetView(AppView.CodeLab)} />
                        <CollapsedNavButton label="Calculator" icon={<CalculatorIcon className="w-6 h-6"/>} isActive={currentView === AppView.Calculator} onClick={() => onSetView(AppView.Calculator)} />
                    </div>

                    <div className="flex flex-col items-center space-y-2">
                         <CollapsedNavButton label="Command Palette" icon={<CommandIcon className="w-6 h-6"/>} isActive={false} onClick={openCommandPalette} />
                        <CollapsedNavButton label="Settings" icon={<SettingsIcon className="w-6 h-6"/>} isActive={false} onClick={openSettings} />
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <>
        <aside className="h-full bg-[var(--bg-secondary)] flex flex-col p-3 space-y-2 border-r border-[var(--border-primary)] sidebar-grid-bg transition-all duration-300 ease-in-out overflow-y-hidden">
            <div className={`flex items-center justify-between p-2 flex-shrink-0 animate-fade-in-slide-down`}>
                <button
                    onClick={() => onSetView(AppView.Dashboard)}
                    className="flex items-center space-x-2 text-left p-1 rounded-md transition-colors hover:bg-[var(--bg-tertiary)]"
                    title="Go to Dashboard"
                >
                    <NiallGPTLogo className="w-8 h-8"/>
                    <span className="text-lg font-bold text-[var(--text-primary)]">NiallGPT</span>
                </button>
                <button onClick={handleCollapse} className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]" title="Collapse Sidebar">
                    <ChevronDoubleLeftIcon className="w-5 h-5"/>
                </button>
            </div>
            
            <div className={`px-2 ${isAnimatingClose ? 'animate-fade-out-slide-up' : 'animate-fade-in-slide-down'}`}>
                <button onClick={handleNewChat} className="w-full flex items-center justify-center p-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 border border-[var(--border-accent)] text-[var(--text-accent)] hover:bg-[var(--text-accent)]/10">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Chat
                </button>
            </div>

            <div className={`space-y-1 flex-shrink-0 border-b border-[var(--border-primary)] py-3 ${isAnimatingClose ? 'animate-fade-out-slide-up' : 'animate-fade-in-slide-down'}`} style={{animationDelay: '50ms'}}>
                 <NavButton label="Discover" icon={<Squares2X2Icon className="w-5 h-5"/>} isActive={currentView === AppView.Dashboard} onClick={() => onSetView(AppView.Dashboard)} />
                 <NavButton label="Image Generator" icon={<ImageIcon className="w-5 h-5"/>} isActive={currentView === AppView.ImageGenerator} onClick={() => onSetView(AppView.ImageGenerator)} />
                 <NavButton label="Video Generator" icon={<VideoCameraIcon className="w-5 h-5"/>} isActive={currentView === AppView.VideoGenerator} onClick={() => onSetView(AppView.VideoGenerator)} />
                 <NavButton label="AI Photo Editor" icon={<PaintBrushIcon className="w-5 h-5"/>} isActive={currentView === AppView.AIPhotoEditor} onClick={() => onSetView(AppView.AIPhotoEditor)} />
                 <NavButton label="Translator" icon={<LanguageIcon className="w-5 h-5"/>} isActive={currentView === AppView.Translator} onClick={() => onSetView(AppView.Translator)} />
                 <NavButton label="AI Tools" icon={<CubeTransparentIcon className="w-5 h-5"/>} isActive={currentView === AppView.AITools} onClick={() => onSetView(AppView.AITools)} />
                 <NavButton label="Code Lab" icon={<BeakerIcon className="w-5 h-5"/>} isActive={currentView === AppView.CodeLab} onClick={() => onSetView(AppView.CodeLab)} />
                 <NavButton label="Calculator" icon={<CalculatorIcon className="w-5 h-5"/>} isActive={currentView === AppView.Calculator} onClick={() => onSetView(AppView.Calculator)} />
            </div>
            
            <div className={`flex-grow flex flex-col min-h-0 ${isAnimatingClose ? 'animate-fade-out-slide-up' : 'animate-fade-in-slide-down'}`} style={{animationDelay: '100ms'}}>
                <div className="px-2 pb-2 flex-shrink-0">
                    <div className="relative">
                        <SearchIcon className="w-4 h-4 absolute top-1/2 left-3 transform -translate-y-1/2" style={{color: 'var(--text-secondary)'}}/>
                        <input type="text" placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-2 pl-9 rounded-md text-sm themed-focus-ring" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}/>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto space-y-1 pr-1">
                    {filteredSessions.map(session => {
                        const isActive = activeChatSessionId === session.id && currentView === AppView.Chat;
                        const isDeleting = deletingChatId === session.id;
                        return (
                        <div 
                            key={session.id} 
                            className={`relative group ${isDeleting ? 'animate-bounce-out' : 'animate-subtle-pop-in'}`}
                            style={{ zIndex: showOptionsMenuFor === session.id ? 10 : 'auto' }}
                        >
                            <button
                                onClick={() => handleSelectChat(session.id)}
                                className={`sidebar-chat-button w-full flex items-center justify-between text-left truncate text-sm px-3 py-2 rounded-md transition-all duration-150 ${isActive ? 'active bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
                            >
                               <span className="truncate">{session.name}</span>
                                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setShowOptionsMenuFor(prev => prev === session.id ? null : session.id); }} className="p-1 rounded-full hover:bg-[var(--icon-hover-bg)]">
                                        <ThreeDotsVerticalIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </button>
                            {showOptionsMenuFor === session.id && (
                                <div ref={optionsMenuRef} className="options-menu-container animate-fade-in">
                                    <div className="py-1">
                                        <button onClick={(e) => handleVideoCall(e, session.id)} className="options-menu-button"><VideoCameraIcon className="w-4 h-4 mr-3"/>Video Call</button>
                                        <button onClick={(e) => handleShareChat(e, session)} className="options-menu-button"><ShareIcon className="w-4 h-4 mr-3"/>Share</button>
                                        <button onClick={(e) => handleRenameChat(e, session)} className="options-menu-button"><PencilIcon className="w-4 h-4 mr-3"/>Rename</button>
                                        <button onClick={(e) => handleDeleteChat(e, session.id)} className="options-menu-button delete"><TrashIcon className="w-4 h-4 mr-3"/>Delete</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )})}
                </div>
            </div>

            <div className={`flex-shrink-0 border-t border-[var(--border-primary)] pt-3 space-y-2 ${isAnimatingClose ? 'animate-fade-out-slide-up' : 'animate-fade-in-slide-down'}`} style={{animationDelay: '150ms'}}>
                 <button onClick={openCommandPalette} className="w-full flex items-center p-2 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <CommandIcon className="w-5 h-5 mr-3"/>
                    <span className="text-sm">Command Palette</span>
                 </button>
                 <button onClick={openSettings} className="w-full flex items-center p-2 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <SettingsIcon className="w-5 h-5 mr-3"/>
                    <span className="text-sm">Settings</span>
                 </button>
            </div>
        </aside>
            {renamingChat && (
                <RenameChatModal
                    isOpen={!!renamingChat}
                    onClose={() => setRenamingChat(null)}
                    chatId={renamingChat.id}
                    currentName={renamingChat.name}
                />
            )}
            {sharingChat && (
                <ShareChatModal
                    isOpen={!!sharingChat}
                    onClose={() => setSharingChat(null)}
                    chatToShare={sharingChat}
                />
            )}
        </>
    );
};