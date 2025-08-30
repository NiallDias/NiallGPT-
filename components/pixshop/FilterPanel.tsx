import React, { useState } from 'react';
import { WandIcon } from './icons';

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
          <button key={filter.name} onClick={() => onApplyFilter(filter.prompt)} className="p-3 bg-gray-800 rounded-md text-sm font-semibold hover:bg-gray-700 transition-colors text-left">
            {filter.name}
          </button>
        ))}
      </div>
      <div>
        <h4 className="text-md font-semibold mb-2">Custom Filter</h4>
        <div className="flex space-x-2">
          <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} type="text" placeholder="Describe a style..." className="flex-grow p-2 bg-gray-800 rounded-md focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
          <button onClick={() => onApplyFilter(customPrompt)} disabled={!customPrompt.trim()} className="p-2 bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-600">
            <WandIcon className="w-5 h-5"/>
          </button>
        </div>
      </div>
    </div>
  );
};
