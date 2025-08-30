

import React, { useRef, useEffect } from 'react';
import { useChatManager } from '../hooks/useChatManager';
import { ChatInputBar } from './ChatInputBar';
import { MessageRenderer } from './MessageRenderer';
import { WelcomeSuggestions } from './WelcomeSuggestions';
import { NiallGPTLogo } from './icons/NiallGPTLogo';
import { HtmlPreviewModal } from './HtmlPreviewModal';
import { TypingIndicator } from './TypingIndicator';

export const ChatView: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 scroll-smooth">
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
      {error && (
        <div className="p-3 text-center text-sm transition-colors duration-300 animate-shake" style={{backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)'}}>
          {error}
        </div>
      )}
      
      <ChatInputBar state={state} actions={actions} />
      
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