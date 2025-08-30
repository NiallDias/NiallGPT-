import React, { useRef, useEffect, useContext, useState } from 'react';
import { useChatManager } from '../hooks/useChatManager';
import { ChatInputBar } from './ChatInputBar';
import { MessageRenderer } from './MessageRenderer';
import { WelcomeSuggestions } from './WelcomeSuggestions';
import { NiallGPTLogo } from './icons/NiallGPTLogo';
import { HtmlPreviewModal } from './HtmlPreviewModal';
import { TypingIndicator } from './TypingIndicator';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { AppView } from '../types';
import { ShareChatModal } from './ShareChatModal';
import { ShareIcon } from './icons/ShareIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';

interface ChatViewProps {
  onSetView: (view: AppView) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ onSetView }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { layout } = useContext(AppSettingsContext);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const {
    state,
    actions,
  } = useChatManager(messagesEndRef);
  
  const {
    activeSession,
    messages,
    error,
    isLoading,
    currentAiMessageId,
    editingMessageId,
    editingText,
    isPreviewModalOpen,
    htmlPreviewContent,
    copiedCodeKey,
    copiedMessageId,
    speakingMessageId,
    isGeneratingStream,
  } = state;

  const {
    handleSuggestionClick,
    handleEditMessage,
    handleRegenerateResponse,
    toggleSpeakMessage,
    handleCopyResponse,
    handleDownloadFile,
    handleDownloadPdf,
    handleDownloadPpt,
    handleCodeChange,
    handlePreviewClick,
    handleCopyCodeClick,
    handleSaveEdit,
    handleCancelEdit,
    setEditingText,
    handleEditInputKeyPress,
    setIsPreviewModalOpen,
    setHtmlPreviewTarget,
  } = actions;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentAiMessageId, editingMessageId]);
  
  if (!activeSession) {
    return (
        <div 
            className="flex flex-col h-full items-center justify-center p-4 transition-colors duration-300"
            style={{color: 'var(--text-secondary)'}}
        >
            <NiallGPTLogo className="w-24 h-24 mb-4" />
            <p className="text-lg">No active chat.</p>
            <p>Please select a chat from the sidebar or create a new one.</p>
        </div>
    );
  }

  return (
    <div 
        className="flex flex-col h-full transition-colors duration-300"
    >
      {/* Conditional Header for new chats */}
      {messages.length === 0 && !isLoading && (
          <div className={`flex-shrink-0 p-3 border-b flex items-center justify-between animate-fade-in ${layout === 'modern' ? 'bg-[var(--bg-secondary)]' : ''}`} style={{borderColor: 'var(--border-primary)'}}>
              <h2 className="text-lg font-semibold truncate" title={activeSession.name}>{activeSession.name}</h2>
              <div className="flex items-center space-x-2">
                  <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex items-center px-3 py-1.5 rounded-md text-sm transition-colors"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      aria-label="Share this chat"
                      title="Share Chat"
                  >
                      <ShareIcon className="w-4 h-4 mr-2" />
                      <span>Share</span>
                  </button>
                  <button
                      onClick={() => onSetView(AppView.VideoCall)}
                      className="flex items-center px-3 py-1.5 rounded-md text-sm transition-colors"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                      aria-label="Start a video call"
                      title="Start Video Call"
                  >
                      <VideoCameraIcon className="w-4 h-4 mr-2" />
                      <span>Video Call</span>
                  </button>
              </div>
          </div>
      )}

      {/* Wrapper for the fade effect. It is not scrollable. */}
      <div className="relative flex-grow overflow-hidden message-list-container">
        {/* This inner div is the one that scrolls. */}
        <div className="h-full overflow-y-auto p-4 sm:p-6 scroll-smooth">
          {messages.length === 0 && !isLoading ? (
              <WelcomeSuggestions onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <MessageRenderer
                  key={msg.id}
                  message={msg}
                  isEditing={editingMessageId === msg.id}
                  isSpeaking={speakingMessageId === msg.id}
                  currentAiMessageId={currentAiMessageId}
                  copiedMessageId={copiedMessageId}
                  copiedCodeKey={copiedCodeKey}
                  editingText={editingText}
                  isLoading={isLoading}
                  onEdit={handleEditMessage}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onEditingTextChange={setEditingText}
                  onEditInputKeyPress={handleEditInputKeyPress}
                  onRegenerate={handleRegenerateResponse}
                  onSpeak={toggleSpeakMessage}
                  onCopyResponse={handleCopyResponse}
                  onDownloadFile={handleDownloadFile}
                  onDownloadPdf={handleDownloadPdf}
                  onDownloadPpt={handleDownloadPpt}
                  onCodeChange={handleCodeChange}
                  onPreview={handlePreviewClick}
                  onCopyCode={handleCopyCodeClick}
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}
            </div>
          )}
          {isLoading && currentAiMessageId === null && activeSession && messages.length > 0 && !messages.find(m => m.id === currentAiMessageId && m.isLoading) && ( 
            <div className="flex justify-start">
               <div className="flex items-end max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
                  <div className="mr-2 self-start flex-shrink-0 pt-1">
                      <NiallGPTLogo className="w-8 h-8" style={{color: 'var(--text-accent)'}} />
                  </div>
                  <div className="p-3 rounded-xl shadow-md" style={{backgroundColor: 'var(--ai-message-bg)'}}>
                      <TypingIndicator />
                  </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {error && (
        <div className="p-3 text-center text-sm transition-colors duration-300 animate-shake" style={{backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)'}}>
          {error}
        </div>
      )}
      
      <ChatInputBar state={state} actions={actions} />

      <ShareChatModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        chatToShare={activeSession}
      />
      
      <HtmlPreviewModal 
        isOpen={isPreviewModalOpen}
        onClose={() => {
            setIsPreviewModalOpen(false);
            setHtmlPreviewTarget(null);
        }}
        htmlContent={htmlPreviewContent}
      />
    </div>
  );
};