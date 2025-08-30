
import React, { useState, useEffect, useContext } from 'react';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { XCircleIcon } from './icons/XCircleIcon';

interface RenameChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  currentName: string;
}

export const RenameChatModal: React.FC<RenameChatModalProps> = ({ isOpen, onClose, chatId, currentName }) => {
  const { renameChatSession } = useContext(AppSettingsContext);
  const [newName, setNewName] = useState(currentName);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setTimeout(() => inputRef.current?.focus(), 50); // Delay focus slightly for modal transition
    }
  }, [isOpen, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName.trim() !== currentName) {
      renameChatSession(chatId, newName.trim());
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[110] transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-chat-title"
    >
      <div
        className="p-6 rounded-lg shadow-2xl w-full max-w-sm relative animate-modal-appear"
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
          aria-label="Close rename dialog"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>
        <h2
          id="rename-chat-title"
          className="text-xl font-semibold mb-4"
          style={{ color: 'var(--text-accent)' }}
        >
          Rename Chat
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-2.5 rounded-md themed-focus-ring mb-4"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            placeholder="Enter new chat name"
            aria-label="New chat name"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md"
              style={{ backgroundColor: 'var(--button-accent-bg)', color: 'var(--button-accent-text)' }}
              disabled={!newName.trim() || newName.trim() === currentName}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};