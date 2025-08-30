import React, { useState } from 'react';
import { PhotoIcon } from '../icons/PhotoIcon';

interface BackgroundPanelProps {
  onApplyBackground: (prompt: string) => void;
}

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({ onApplyBackground }) => {
  const [prompt, setPrompt] = useState('');

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-semibold">Change Background</h3>
      <p className="text-xs text-[var(--text-secondary)]">Describe the new background you want. The AI will replace the existing background while keeping the main subject.</p>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="e.g., A busy street in Tokyo at night, with neon lights"
        rows={4}
        className="w-full p-2 bg-[var(--bg-input)] rounded-md themed-focus-ring text-sm resize-y"
      />
      <button
        onClick={() => onApplyBackground(prompt)}
        disabled={!prompt.trim()}
        className="w-full p-2 bg-[var(--button-accent-bg)] text-[var(--button-accent-text)] rounded-md font-semibold hover:bg-[var(--button-accent-hover-bg)] transition-colors disabled:bg-[var(--button-accent-disabled-bg)] disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <PhotoIcon className="w-5 h-5" />
        <span>Apply Background</span>
      </button>
    </div>
  );
};
