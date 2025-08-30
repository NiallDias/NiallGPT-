
import React, { useState } from 'react';
import { PaintBrushIcon } from '../icons/PaintBrushIcon';

const filters = [
    { name: 'Cinematic', prompt: 'Cinematic, dramatic lighting, high contrast, film grain' },
    { name: 'Vintage', prompt: 'Vintage photo, sepia tones, faded colors, old paper texture' },
    { name: 'Anime', prompt: 'Vibrant anime style, cel-shaded, bold lines, bright colors' },
    { name: 'Oil Painting', prompt: 'Impressionistic oil painting, visible brushstrokes, rich texture' },
    { name: 'Cyberpunk', prompt: 'Cyberpunk, neon lights, futuristic, dystopian, glowing elements' },
    { name: 'Watercolor', prompt: 'Soft watercolor painting, blended colors, light washes' },
];

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter }) => {
  const [customPrompt, setCustomPrompt] = useState('');

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-semibold">Creative Filters</h3>
      <div className="grid grid-cols-2 gap-2">
        {filters.map(filter => (
          <button key={filter.name} onClick={() => onApplyFilter(filter.prompt)} className="p-3 bg-[var(--bg-tertiary)] rounded-md text-sm font-semibold hover:bg-[var(--icon-hover-bg)] transition-colors text-left">
            {filter.name}
          </button>
        ))}
      </div>
      <div>
        <h4 className="text-md font-semibold mb-2">Custom Filter</h4>
        <div className="flex space-x-2">
          <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} type="text" placeholder="Describe a style..." className="flex-grow p-2 bg-[var(--bg-input)] rounded-md themed-focus-ring text-sm" />
          <button onClick={() => onApplyFilter(customPrompt)} disabled={!customPrompt.trim()} className="p-2 bg-[var(--button-accent-bg)] text-[var(--button-accent-text)] rounded-md hover:bg-[var(--button-accent-hover-bg)] transition-colors disabled:bg-[var(--button-accent-disabled-bg)]">
            <PaintBrushIcon className="w-5 h-5"/>
          </button>
        </div>
      </div>
    </div>
  );
};
