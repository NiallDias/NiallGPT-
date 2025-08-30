
import React, { useState, useEffect, useContext } from 'react';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { XCircleIcon } from './icons/XCircleIcon';
import { ChatSession } from '../types';
import { compressToEncodedURIComponent } from 'lz-string';
import { LoadingSpinner } from './LoadingSpinner';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

interface ShareChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatToShare: ChatSession | null;
}

interface SharedChatData {
  session: ChatSession;
  themeId: string;
}

export const ShareChatModal: React.FC<ShareChatModalProps> = ({ isOpen, onClose, chatToShare }) => {
  const { currentTheme } = useContext(AppSettingsContext);
  const [shareUrl, setShareUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen && chatToShare) {
      setIsLoading(true);
      setShareUrl('');
      setIsCopied(false);

      // Generate the URL in a timeout to allow the modal to render first
      setTimeout(() => {
        try {
          const dataToShare: SharedChatData = {
            session: chatToShare,
            themeId: currentTheme.id,
          };
          const jsonString = JSON.stringify(dataToShare);
          const compressedData = compressToEncodedURIComponent(jsonString);
          const url = `${window.location.origin}${window.location.pathname}#share/${compressedData}`;
          setShareUrl(url);
        } catch (error) {
          console.error("Failed to generate share link:", error);
          setShareUrl("Error: Could not generate link.");
        } finally {
          setIsLoading(false);
        }
      }, 50);
    }
  }, [isOpen, chatToShare, currentTheme]);

  const handleCopy = () => {
    if (shareUrl && !isLoading) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[110] transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-chat-title"
    >
      <div
        className="p-6 rounded-lg shadow-2xl w-full max-w-lg relative animate-modal-appear"
        style={{
          backgroundColor: 'var(--modal-bg)',
          border: `1px solid var(--modal-border)`,
          boxShadow: 'var(--modal-shadow)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full transition-colors"
          style={{ color: 'var(--icon-color)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          aria-label="Close share dialog"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>
        <h2
          id="share-chat-title"
          className="text-xl font-semibold mb-4"
          style={{ color: 'var(--text-accent)' }}
        >
          Share Conversation
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)'}}>
          Anyone with this public link will be able to view a read-only version of this conversation.
        </p>
        
        <div className="flex items-center space-x-2">
            <div className="flex-grow p-2.5 rounded-md min-h-[44px] flex items-center" style={{backgroundColor: 'var(--bg-input)', border: `1px solid var(--border-primary)`}}>
                {isLoading ? (
                    <div className="flex items-center space-x-2">
                        <LoadingSpinner size="h-5 w-5" />
                        <span style={{color: 'var(--text-secondary)'}}>Generating link...</span>
                    </div>
                ) : (
                    <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="w-full bg-transparent text-sm focus:outline-none"
                        style={{ color: 'var(--text-primary)' }}
                        aria-label="Shareable link"
                    />
                )}
            </div>
            <button
              onClick={handleCopy}
              disabled={isLoading || !shareUrl || shareUrl.startsWith("Error:")}
              className="px-4 py-2.5 text-sm rounded-md flex items-center justify-center"
              style={{ backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)' }}
            >
              {isCopied ? <CheckIcon className="w-5 h-5"/> : <ClipboardIcon className="w-5 h-5"/>}
              <span className="ml-2 hidden sm:inline">{isCopied ? "Copied!" : "Copy"}</span>
            </button>
        </div>
        
      </div>
      <style>{`
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};