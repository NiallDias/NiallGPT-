
import React, { useState } from 'react';
import { AdjustmentsHorizontalIcon } from '../icons/AdjustmentsHorizontalIcon';

const adjustments = [
    { name: 'Blur Background', prompt: 'Create a shallow depth of field effect by professionally blurring the background, keeping the main subject in sharp focus.' },
    { name: 'Enhance Details', prompt: 'Subtly enhance the details and sharpness of the image without adding artifacts. Increase local contrast.' },
    { name: 'Cinematic Light', prompt: 'Apply cinematic lighting to the image, with dramatic shadows and highlights.' },
    { name: 'Warm Tone', prompt: 'Apply a warm, golden hour lighting effect to the entire image.' },
    { name: 'Cool Tone', prompt: 'Apply a cool, blueish tone to the image for a moody atmosphere.' },
];

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void;
}

export const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment }) => {
  const [customPrompt, setCustomPrompt] = useState('');

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-semibold">Adjustments</h3>
      <div className="flex flex-col space-y-2">
        {adjustments.map(adj => (
          <button key={adj.name} onClick={() => onApplyAdjustment(adj.prompt)} className="p-3 bg-[var(--bg-tertiary)] rounded-md text-sm font-semibold hover:bg-[var(--icon-hover-bg)] transition-colors text-left">
            {adj.name}
          </button>
        ))}
      </div>
      <div>
        <h4 className="text-md font-semibold mb-2">Custom Adjustment</h4>
        <div className="flex space-x-2">
          <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} type="text" placeholder="e.g., Increase vibrance" className="flex-grow p-2 bg-[var(--bg-input)] rounded-md themed-focus-ring text-sm" />
          <button onClick={() => onApplyAdjustment(customPrompt)} disabled={!customPrompt.trim()} className="p-2 bg-[var(--button-accent-bg)] text-[var(--button-accent-text)] rounded-md hover:bg-[var(--button-accent-hover-bg)] transition-colors disabled:bg-[var(--button-accent-disabled-bg)]">
            <AdjustmentsHorizontalIcon className="w-5 h-5"/>
          </button>
        </div>
      </div>
    </div>
  );
};
