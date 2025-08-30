
import React, { useEffect, useRef } from 'react';
import { XCircleIcon } from './icons/XCircleIcon';

interface HtmlPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  title?: string;
}

export const HtmlPreviewModal: React.FC<HtmlPreviewModalProps> = ({ isOpen, onClose, htmlContent, title = "HTML Preview" }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && iframeRef.current) {
      // Setting srcDoc will create a new document in the iframe
      // It inherits a unique opaque origin, good for sandboxing.
      iframeRef.current.srcdoc = htmlContent;
    }
  }, [isOpen, htmlContent]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[150] transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="html-preview-title"
    >
      <div
        className="p-4 sm:p-6 rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col relative animate-modal-appear"
        style={{
          backgroundColor: 'var(--modal-bg)',
          border: `1px solid var(--modal-border)`,
          boxShadow: 'var(--modal-shadow)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            id="html-preview-title"
            className="text-xl sm:text-2xl font-semibold"
            style={{ color: 'var(--text-accent)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full transition-colors"
            style={{ color: 'var(--icon-color)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Close HTML preview"
          >
            <XCircleIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>
        <div className="flex-grow border rounded overflow-hidden" style={{borderColor: 'var(--border-primary)'}}>
          <iframe
            ref={iframeRef}
            title="HTML Preview Content"
            sandbox="allow-scripts allow-popups allow-forms allow-modals" // allow-same-origin is excluded for security
            className="w-full h-full bg-white" // Typically preview HTML on a white background
            // srcDoc is set via useEffect to ensure it updates correctly when modal reopens
          />
        </div>
        <p className="text-xs mt-3 text-center" style={{color: 'var(--text-secondary)'}}>
          Content is rendered in a sandboxed environment. Complex scripts or external resources might behave differently.
        </p>
      </div>
    </div>
  );
};