import React, { useState, useRef, useEffect, useContext } from 'react';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { SendIcon } from './icons/SendIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { StopCircleIcon } from './icons/StopCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ImageIcon } from './icons/ImageIcon';
import { StopIcon } from './icons/StopIcon';
import { SearchWebIcon } from './icons/SearchWebIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { LoadingSpinner } from './LoadingSpinner';

export const ChatInputBar = ({ state, actions }) => {
  const { layout } = useContext(AppSettingsContext);
  const isModern = layout === 'modern';

  const {
    input, isLoading, isRecording, selectedFile, filePreviewUrl, isFileReading,
    editingMessageId, isGeneratingStream, isWebSearchModeActive, activeSession,
    selectedFileType, selectedFileContent, isEnhancing
  } = state;
  const {
    setInput, handleSendMessage, handleKeyPress, handleStopGenerating,
    toggleRecording, handleFileUpload, removeSelectedFile, imageInputRef, textInputRef,
    setIsWebSearchModeActive, handleEnhanceChatPrompt
  } = actions;

  const [showFileTypeSelector, setShowFileTypeSelector] = useState<boolean>(false);
  const paperclipButtonRef = useRef<HTMLButtonElement>(null);
  const fileTypeSelectorRef = useRef<HTMLDivElement>(null);

  const isSendDisabled = !activeSession || isFileReading || (!isGeneratingStream && (isLoading || (input.trim() === '' && !selectedFile) || editingMessageId !== null));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showFileTypeSelector &&
        fileTypeSelectorRef.current && !fileTypeSelectorRef.current.contains(event.target as Node) &&
        paperclipButtonRef.current && !paperclipButtonRef.current.contains(event.target as Node)
      ) {
        setShowFileTypeSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFileTypeSelector]);

  const toggleFileTypeSelector = () => setShowFileTypeSelector(prev => !prev);
  const handleSelectImageType = () => { setShowFileTypeSelector(false); imageInputRef.current?.click(); };
  const handleSelectTextType = () => { setShowFileTypeSelector(false); textInputRef.current?.click(); };

  return (
    <div 
      className="p-3 sm:p-4 transition-colors duration-300"
      style={{backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)'}}
    >
      {selectedFile && (
        <div className="mb-2 relative max-w-md p-1 rounded animate-slide-in-bottom" style={{border: '1px solid var(--border-primary)'}}>
          {selectedFileType?.startsWith('image/') && filePreviewUrl && <img src={filePreviewUrl} alt="Selected preview" className="w-auto h-32 object-contain rounded" />}
          {selectedFileType === 'text/plain' && selectedFile && (
            <div className="flex items-center space-x-2 p-2 rounded" style={{backgroundColor: 'var(--bg-tertiary)'}}>
              <DocumentTextIcon className="w-8 h-8 flex-shrink-0" style={{color: 'var(--text-secondary)'}}/>
              <div className="truncate">
                <p className="text-sm font-medium" style={{color: 'var(--text-primary)'}}>{selectedFile.name}</p>
                {selectedFileContent && <p className="text-xs truncate" style={{color: 'var(--text-secondary)'}}>{selectedFileContent.substring(0,100)}...</p>}
              </div>
            </div>
          )}
          <button onClick={removeSelectedFile} className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full p-0.5" style={{backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)'}} aria-label="Remove selected file"><XCircleIcon className="w-5 h-5" /></button>
        </div>
      )}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <input type="file" accept="image/*" ref={imageInputRef} onChange={handleFileUpload} className="hidden" aria-label="Upload image file"/>
        <input type="file" accept=".txt" ref={textInputRef} onChange={handleFileUpload} className="hidden" aria-label="Upload text file"/>
        
        <div className="relative">
          <button ref={paperclipButtonRef} onClick={toggleFileTypeSelector} className="chat-icon-button p-3" disabled={isLoading || isEnhancing || editingMessageId !== null || !activeSession}>
            <PaperclipIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          {showFileTypeSelector && (
            <div ref={fileTypeSelectorRef} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max p-2 rounded-md shadow-xl z-20 animate-slide-in-bottom" style={{backgroundColor: 'var(--modal-bg)', border: `1px solid var(--modal-border)`}}>
              <ul className="space-y-1">
                <li><button onClick={handleSelectImageType} className="file-type-btn" disabled={isLoading || isEnhancing || editingMessageId !== null || !activeSession}><ImageIcon className="w-4 h-4 mr-2"/>Upload Image</button></li>
                <li><button onClick={handleSelectTextType} className="file-type-btn" disabled={isLoading || isEnhancing || editingMessageId !== null || !activeSession}><DocumentTextIcon className="w-4 h-4 mr-2"/>Upload Text</button></li>
              </ul>
            </div>
          )}
        </div>

        <button onClick={() => setIsWebSearchModeActive(prev => !prev)} className={`chat-icon-button p-3 border-2 ${isWebSearchModeActive ? 'active-web-search-button' : ''}`} style={{borderColor: 'transparent', boxShadow: isWebSearchModeActive ? `0 0 8px var(--text-accent)` : 'none'}} disabled={isGeneratingStream || isLoading || isEnhancing || editingMessageId !== null || !activeSession}>
          <SearchWebIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{color: isWebSearchModeActive ? 'var(--text-accent)' : 'var(--icon-color)'}}/>
        </button>
        
        <div className={`flex-grow flex items-center rounded-full themed-focus-ring-container ${isModern ? 'sapphire-chat-input-container' : ''}`} style={{backgroundColor: isModern ? 'var(--bg-secondary)' : 'var(--bg-input)', border: `1px solid var(--border-primary)`}}>
          <button 
              onClick={handleEnhanceChatPrompt} 
              className="chat-icon-button p-2 ml-2" 
              style={{ color: 'var(--image-gen-button-bg)' }}
              disabled={!input.trim() || isGeneratingStream || isLoading || isRecording || editingMessageId !== null || !activeSession || isFileReading || isEnhancing}
              title="Enhance prompt with AI"
          >
            {isEnhancing ? <LoadingSpinner size="h-5 sm:h-6"/> : <SparkleIcon className="w-5 h-5 sm:h-6"/>}
          </button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
            placeholder={!activeSession ? "Select or create a chat" : (isGeneratingStream ? "Generating response..." : (isRecording ? "Listening..." : (isFileReading ? "Processing file..." : (selectedFile ? `Message for ${selectedFile.name}...` : "Ask anything, or try /imagine..."))))}
            className="flex-grow w-full bg-transparent p-3 pl-2 focus:outline-none" style={{color: 'var(--text-primary)'}}
            disabled={isGeneratingStream || isLoading || isEnhancing || isRecording || editingMessageId !== null || !activeSession || isFileReading}
            aria-label="Chat input"
          />
          <button onClick={toggleRecording} className={`chat-icon-button p-2 mr-2 ${isRecording ? 'recording-active animate-pulse-glow' : ''}`} style={{color: isRecording ? 'var(--danger-text)' : 'var(--icon-color)', backgroundColor: isRecording ? 'var(--danger-bg)' : 'transparent'}} disabled={isGeneratingStream || isLoading || isEnhancing || editingMessageId !== null || !activeSession}>
            {isRecording ? <StopCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicrophoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>

        <button onClick={() => isGeneratingStream ? handleStopGenerating() : handleSendMessage()} disabled={isSendDisabled} className="chat-icon-button p-3"
          style={{
              backgroundColor: isGeneratingStream ? 'var(--danger-bg)' : 'transparent',
              color: isGeneratingStream ? 'var(--danger-text)' : (isSendDisabled ? 'var(--text-secondary)' : 'var(--text-accent)'),
              boxShadow: isGeneratingStream || isSendDisabled ? 'none' : `0 0 8px var(--text-accent)`,
              cursor: isSendDisabled && !isGeneratingStream ? 'not-allowed' : 'pointer'
          }}>
          {isGeneratingStream ? <StopIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </div>
      <style>{`
          .file-type-btn { display: flex; align-items: center; width: 100%; text-align: left; padding: 0.5rem 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; color: var(--text-primary); transition: background-color 0.15s, transform 0.15s; }
          .file-type-btn:hover:not([disabled]) { background-color: var(--icon-hover-bg); transform: translateX(2px); }
          .chat-icon-button { display: flex; align-items: center; justify-content: center; border-radius: 9999px; transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out, box-shadow 0.2s ease-in-out, transform 0.1s ease-out; flex-shrink: 0; color: var(--icon-color); }
          .chat-icon-button:not([disabled]):hover { background-color: var(--icon-hover-bg); transform: scale(1.1); }
          button:disabled { opacity: 0.5; cursor: not-allowed; }
          .themed-focus-ring-container:focus-within { outline: none; box-shadow: 0 0 0 3px var(--focus-ring-color); border-color: var(--border-accent) !important; }
      `}</style>
    </div>
  );
};