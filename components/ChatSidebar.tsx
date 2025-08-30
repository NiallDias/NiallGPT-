import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { AppView, ChatSession } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { ThreeDotsVerticalIcon } from './icons/ThreeDotsVerticalIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { RenameChatModal } from './RenameChatModal';
import { ShareIcon } from './icons/ShareIcon';
import { ShareChatModal } from './ShareChatModal';
import { SearchIcon } from './icons/SearchIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';

interface ChatSidebarProps {
  isVisible: boolean;
  onSetView: (view: AppView) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ isVisible, onSetView }) => {
  const {
    chatSessions,
    activeChatSessionId,
    setActiveChatSessionId,
    createChatSession,
    deleteChatSession,
    currentTheme
  } = useContext(AppSettingsContext);

  const [renamingChat, setRenamingChat] = useState<ChatSession | null>(null);
  const [sharingChat, setSharingChat] = useState<ChatSession | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [showOptionsMenuFor, setShowOptionsMenuFor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const handleCreateNewChat = () => {
    createChatSession();
  };

  const handleSelectChat = (sessionId: string) => {
    setActiveChatSessionId(sessionId);
    setShowOptionsMenuFor(null); 
    setSearchQuery(''); // Clear search on selection
  };
  
  const handleVideoCall = (sessionId: string) => {
    setActiveChatSessionId(sessionId);
    onSetView(AppView.VideoCall);
    setShowOptionsMenuFor(null);
  };

  const handleDeleteChat = (sessionId: string) => {
    setShowOptionsMenuFor(null);
    setDeletingChatId(sessionId);
    setTimeout(() => {
      deleteChatSession(sessionId);
      setDeletingChatId(null);
    }, 400); // Animation duration
  };

  const handleRenameChat = (session: ChatSession) => {
    setRenamingChat(session);
    setShowOptionsMenuFor(null);
  };

  const handleShareChat = (session: ChatSession) => {
    setSharingChat(session);
    setShowOptionsMenuFor(null);
  };

  const toggleOptionsMenu = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent chat selection when clicking dots
    setShowOptionsMenuFor(prev => (prev === sessionId ? null : sessionId));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenuFor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const sortedSessions = [...chatSessions].sort((a, b) => b.timestamp - a.timestamp);
  const filteredSessions = sortedSessions.filter(session => 
    session.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isRGBTheme = currentTheme.id === 'rgb';

  return (
    <aside
      className={`
        flex-shrink-0 h-full transition-all duration-300 ease-in-out overflow-hidden
        ${isVisible ? 'w-64 sm:w-72 md:w-80' : 'w-0'}
      `}
      style={{
        borderRight: `1px solid ${isVisible ? 'var(--border-primary)' : 'transparent'}`
      }}
    >
      <div className="w-64 sm:w-72 md:w-80 h-full flex flex-col" style={{backgroundColor: 'var(--bg-secondary)'}}>
          <div className="p-3 space-y-3 border-b" style={{borderColor: 'var(--border-primary)'}}>
            <button
              onClick={handleCreateNewChat}
              className="w-full flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-[var(--button-accent-bg)]/30 active:scale-100"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-accent)',
                boxShadow: `0 0 8px var(--button-accent-bg)`,
                border: `1px solid var(--button-accent-bg)`
              }}
              aria-label="Create a new chat session"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Chat
            </button>
            <div className="relative">
                <SearchIcon className="w-4 h-4 absolute top-1/2 left-3 transform -translate-y-1/2" style={{color: 'var(--text-secondary)'}}/>
                <input 
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent p-2 pl-9 rounded-md text-sm themed-focus-ring transition-all duration-200 ease-in-out"
                    style={{
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-primary)'
                    }}
                />
            </div>
          </div>
          <nav className="flex-grow overflow-y-auto px-2 py-2 space-y-1">
            {filteredSessions.map((session, index) => {
              const isActive = activeChatSessionId === session.id;
              const isDeleting = deletingChatId === session.id;
              return (
              <div 
                key={session.id} 
                className={`relative ${isDeleting ? 'animate-bounce-out' : 'animate-bounce-in'}`}
                style={{ 
                    animationDelay: isDeleting ? '0ms' : `${index * 50}ms`,
                    zIndex: showOptionsMenuFor === session.id ? 20 : 'auto',
                }}
              >
                <button
                  onClick={() => handleSelectChat(session.id)}
                  className={`
                    w-full flex items-center justify-between p-2.5 text-left rounded-md text-sm transition-all duration-150 group
                    ${isActive && isRGBTheme ? 'animate-rgb-text-color' : ''}
                  `}
                  style={{
                    backgroundColor: 'transparent',
                    color: isActive ? 'var(--text-accent)' : 'var(--text-primary)',
                    boxShadow: isActive ? `0 0 8px -2px var(--text-accent), inset 0 0 8px -4px var(--text-accent)` : 'none',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--navbar-item-hover-bg)';}}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';}}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="truncate flex-grow mr-2">{session.name}</span>
                  <button
                    onClick={(e) => toggleOptionsMenu(e, session.id)}
                    className="p-1 rounded-full opacity-50 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    style={{ 
                        color: isActive ? 'var(--text-accent)' : 'var(--icon-color)',
                        backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label={`Options for chat ${session.name}`}
                    aria-haspopup="true"
                    aria-expanded={showOptionsMenuFor === session.id}
                  >
                    <ThreeDotsVerticalIcon className="w-4 h-4" />
                  </button>
                </button>
                {showOptionsMenuFor === session.id && (
                  <div
                    ref={optionsMenuRef}
                    className="absolute right-0 mt-1 w-40 rounded-md shadow-lg py-1 z-50 animate-fade-in"
                    style={{ backgroundColor: 'var(--modal-bg)', border: `1px solid var(--modal-border)`}}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby={`options-menu-button-${session.id}`}
                  >
                    <button
                      onClick={() => handleVideoCall(session.id)}
                      className="w-full text-left px-3 py-2 text-sm flex items-center"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      role="menuitem"
                    >
                      <VideoCameraIcon className="w-4 h-4 mr-2" /> Video Call
                    </button>
                    <button
                      onClick={() => handleShareChat(session)}
                      className="w-full text-left px-3 py-2 text-sm flex items-center"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      role="menuitem"
                    >
                      <ShareIcon className="w-4 h-4 mr-2" /> Share
                    </button>
                    <button
                      onClick={() => handleRenameChat(session)}
                      className="w-full text-left px-3 py-2 text-sm flex items-center"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      role="menuitem"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" /> Rename
                    </button>
                    <button
                      onClick={() => handleDeleteChat(session.id)}
                      className="w-full text-left px-3 py-2 text-sm flex items-center"
                      style={{ color: 'var(--danger-bg)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'} // Use neutral hover
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      role="menuitem"
                    >
                      <TrashIcon className="w-4 h-4 mr-2" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )})}
          </nav>
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
      </div>
    </aside>
  );
};