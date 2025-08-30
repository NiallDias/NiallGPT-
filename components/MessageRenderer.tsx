


import React, { useRef, useContext } from 'react';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { ChatMessage, Sender } from '../types';
import { NiallGPTLogo } from './icons/NiallGPTLogo';
import { TypingIndicator } from './TypingIndicator';
import { ChatMessageContent } from './ChatMessageContent';
import { GroundingChunksDisplay } from './GroundingChunksDisplay';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PencilIcon } from './icons/PencilIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { SpeakerWaveIcon } from './icons/SpeakerIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { FilePdfIcon } from './icons/FilePdfIcon';
import { FileHtmlIcon } from './icons/FileHtmlIcon';
import { FilePptIcon } from './icons/FilePptIcon';
import { ResponseSuggestions } from './ResponseSuggestions';
import {
  PDF_DOWNLOAD_PLACEHOLDER,
  TXT_DOWNLOAD_PLACEHOLDER,
  HTML_DOWNLOAD_PLACEHOLDER,
  PPT_DOWNLOAD_PLACEHOLDER,
} from '../services/geminiService';

interface MessageRendererProps {
  message: ChatMessage;
  isEditing: boolean;
  isSpeaking: boolean;
  currentAiMessageId: string | null;
  copiedMessageId: string | null;
  copiedCodeKey: string | null;
  editingText: string;
  isLoading: boolean;
  onEdit: (message: ChatMessage) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingTextChange: (text: string) => void;
  onEditInputKeyPress: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onRegenerate: (message: ChatMessage) => void;
  onSpeak: (message: ChatMessage) => void;
  onCopyResponse: (message: ChatMessage) => void;
  onDownloadFile: (content: string, filename: string, mimeType: string) => void;
  onDownloadPdf: (textContent: string) => void;
  onDownloadPpt: (markdownContent: string) => void;
  onCodeChange: (messageId: string, codeBlockIndex: number, newCode: string) => void;
  onPreview: (codeContent: string, messageId: string, codeBlockKey: string) => void;
  onCopyCode: (codeContent: string, codeBlockKey: string) => Promise<void>;
  onSuggestionClick: (text: string) => void;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
  message, isEditing, isSpeaking, currentAiMessageId, copiedMessageId,
  copiedCodeKey, editingText, isLoading, onEdit, onSaveEdit, onCancelEdit,
  onEditingTextChange, onEditInputKeyPress, onRegenerate, onSpeak,
  onCopyResponse, onDownloadFile, onDownloadPdf, onDownloadPpt,
  onCodeChange, onPreview, onCopyCode, onSuggestionClick
}) => {
  const { layout } = useContext(AppSettingsContext);
  const isModern = layout === 'modern';
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.style.height = 'auto';
      editInputRef.current.style.height = `${editInputRef.current.scrollHeight}px`;
    }
  }, [isEditing, editingText]);

  let textToRender = message.text;
  let showPdfButton = false, showTxtButton = false, showHtmlButton = false, showPptButton = false;

  if (message.sender === Sender.AI && message.text && !message.isLoading) {
    if (textToRender.endsWith(PDF_DOWNLOAD_PLACEHOLDER)) {
        textToRender = textToRender.substring(0, textToRender.length - PDF_DOWNLOAD_PLACEHOLDER.length).trim();
        showPdfButton = true;
    } else if (textToRender.endsWith(TXT_DOWNLOAD_PLACEHOLDER)) {
        textToRender = textToRender.substring(0, textToRender.length - TXT_DOWNLOAD_PLACEHOLDER.length).trim();
        showTxtButton = true;
    } else if (textToRender.endsWith(HTML_DOWNLOAD_PLACEHOLDER)) {
        textToRender = textToRender.substring(0, textToRender.length - HTML_DOWNLOAD_PLACEHOLDER.length).trim();
        showHtmlButton = true;
    } else if (textToRender.endsWith(PPT_DOWNLOAD_PLACEHOLDER)) {
        textToRender = textToRender.substring(0, textToRender.length - PPT_DOWNLOAD_PLACEHOLDER.length).trim();
        showPptButton = true;
    }
  }
  
  const renderDownloadButtons = () => {
    if (message.sender !== Sender.AI || message.isLoading) return null;

    const hasButtons = showPdfButton || showTxtButton || showHtmlButton || showPptButton;
    if (!hasButtons) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-2 animate-slide-in-bottom" style={{animationDelay: '100ms'}}>
        {showPdfButton && (
            <button onClick={() => onDownloadPdf(textToRender)} className="flex items-center text-sm px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)'}}><FilePdfIcon className="w-4 h-4 mr-2" /> Download PDF</button>
        )}
        {showTxtButton && (
            <button onClick={() => onDownloadFile(textToRender, `NiallGPT_document_${Date.now()}.txt`, 'text/plain;charset=utf-8')} className="flex items-center text-sm px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)'}}><DocumentTextIcon className="w-4 h-4 mr-2" /> Download TXT</button>
        )}
        {showHtmlButton && (
            <button onClick={() => onDownloadFile(textToRender, `NiallGPT_page_${Date.now()}.html`, 'text/html;charset=utf-8')} className="flex items-center text-sm px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)'}}><FileHtmlIcon className="w-4 h-4 mr-2" /> Download HTML</button>
        )}
        {showPptButton && (
            <button onClick={() => onDownloadPpt(textToRender)} className="flex items-center text-sm px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)'}}><FilePptIcon className="w-4 h-4 mr-2" /> Download PPT</button>
        )}
      </div>
    );
  }

  const renderSuggestions = () => {
    if (message.sender === Sender.AI && !message.isLoading && message.suggestions && message.suggestions.length > 0) {
        return <ResponseSuggestions suggestions={message.suggestions} onSuggestionClick={onSuggestionClick} />;
    }
    return null;
  }

  const userMessageBaseClass = "p-3 rounded-xl shadow-md border";
  const aiMessageBaseClass = `pt-1 w-full ${!message.imageUrl ? '' : 'p-2 rounded-xl shadow-md'}`;
  
  const userMessageModernClass = isModern ? 'sapphire-user-message' : '';
  const aiMessageModernClass = isModern ? 'sapphire-ai-message' : '';

  const userMessageDynamicClass = `${userMessageBaseClass} ${userMessageModernClass}`;
  const aiMessageDynamicClass = `${aiMessageBaseClass} ${aiMessageModernClass}`;

  return (
    <div className={`flex ${message.sender === Sender.User ? 'justify-end' : 'justify-start'} ${message.sender === Sender.User ? 'animate-bounce-in' : 'animate-message-appear'}`}>
      <div className={`flex items-start max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl ${message.sender === Sender.AI ? 'w-full' : ''}`}>
        {message.sender === Sender.AI && (
          <div className="mr-2 self-start flex-shrink-0 pt-1">
            <NiallGPTLogo className="w-8 h-8" style={{color: 'var(--text-accent)'}} />
          </div>
        )}
        <div 
          className={`break-words transition-colors duration-300 relative group ${message.sender === Sender.User ? userMessageDynamicClass : aiMessageDynamicClass }`}
          style={{
              backgroundColor: message.sender === Sender.User ? 'var(--user-message-bg)' : (message.imageUrl ? 'var(--bg-secondary)' : 'transparent'),
              color: message.sender === Sender.User ? 'var(--user-message-text)' : 'var(--ai-message-text)',
              borderColor: message.sender === Sender.User ? 'var(--user-message-border)' : (message.imageUrl ? 'var(--border-primary)' : 'transparent'),
          }}
        >
          {isEditing && message.sender === Sender.User ? (
            <div className="w-full">
              <textarea
                  ref={editInputRef} value={editingText}
                  onChange={(e) => onEditingTextChange(e.target.value)}
                  onKeyPress={onEditInputKeyPress}
                  className="w-full p-2 rounded-md resize-none overflow-hidden themed-focus-ring"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', minHeight: '40px' }}
                  rows={1}
              />
              <div className="flex justify-end space-x-2 mt-2">
                  <button onClick={onCancelEdit} className="px-3 py-1 text-xs rounded" style={{backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)'}}>Cancel</button>
                  <button onClick={onSaveEdit} className="px-3 py-1 text-xs rounded" style={{backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)'}}>Save</button>
              </div>
            </div>
          ) : (
            <>
              {message.attachment && (
                <div className="p-1.5 rounded-lg mb-2" style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
                  {message.attachment.type.startsWith('image/') && message.attachment.previewUrl && <img src={message.attachment.previewUrl} alt={message.attachment.name || "User upload"} className="max-w-full h-auto max-h-60 object-contain rounded-md" />}
                  {message.attachment.type === 'text/plain' && <div className="flex items-center space-x-2 text-sm p-1"><DocumentTextIcon className="w-5 h-5 flex-shrink-0" /><span className="truncate">{message.attachment.name}</span></div>}
                </div>
              )}
              <div className="whitespace-pre-wrap">
                {message.imageUrl ? (
                  <img src={message.imageUrl} alt={"AI generated image for " + message.text} className="rounded-lg max-w-full h-auto max-h-[60vh] object-contain" />
                ) : (
                  <ChatMessageContent
                      text={textToRender || ''} messageId={message.id}
                      isLoading={!!message.isLoading} currentAiMessageId={currentAiMessageId}
                      onCodeChange={(codeBlockIndex, newCode) => onCodeChange(message.id, codeBlockIndex, newCode)}
                      onPreview={(codeContent, codeBlockKey) => onPreview(codeContent, message.id, codeBlockKey)}
                      onCopyCode={onCopyCode} copiedCodeKey={copiedCodeKey}
                  />
                )}
                {(message.isEdited && message.sender === Sender.User) && <span className="text-xs opacity-70 ml-1">(edited)</span>}
              </div>
              {message.isLoading && message.sender === Sender.AI && message.id === currentAiMessageId && <TypingIndicator />}

              <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200 transform-gpu translate-x-2 group-hover:translate-x-0">
                {message.sender === Sender.User && !isEditing && <button onClick={() => onEdit(message)} className="p-1 rounded-full" style={{backgroundColor: 'var(--icon-hover-bg)', color: 'var(--icon-color)'}} title="Edit message" disabled={isLoading}><PencilIcon className="w-4 h-4" /></button>}
                {message.sender === Sender.AI && message.text && !message.text.includes("[Stopped by user]") && !message.isLoading && (
                  <>
                    <button onClick={() => onCopyResponse(message)} className="p-1 rounded-full" style={{backgroundColor: 'var(--icon-hover-bg)', color: 'var(--icon-color)'}} title={copiedMessageId === message.id ? "Copied!" : "Copy response"} disabled={isLoading}>{copiedMessageId === message.id ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}</button>
                    <button onClick={() => onSpeak(message)} className={`p-1 rounded-full ${isSpeaking ? 'active-speak-button' : ''}`} style={{backgroundColor: 'transparent', color: isSpeaking ? 'var(--text-accent)' : 'var(--icon-color)', boxShadow: isSpeaking ? `0 0 6px var(--text-accent)` : 'none',}} title={isSpeaking ? "Stop speaking" : "Speak message"} disabled={isLoading}><SpeakerWaveIcon className="w-4 h-4" /></button>
                    <button onClick={() => onRegenerate(message)} className="p-1 rounded-full" style={{backgroundColor: 'var(--icon-hover-bg)', color: 'var(--icon-color)'}} title="Regenerate response" disabled={isLoading}><ArrowPathIcon className="w-4 h-4" /></button>
                  </>
                )}
              </div>
              {message.sender === Sender.AI && <GroundingChunksDisplay chunks={message.groundingChunks} />}
              {renderSuggestions()}
              {renderDownloadButtons()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};