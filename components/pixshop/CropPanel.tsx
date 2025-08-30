import React from 'react';
import { CheckIcon } from './icons';

interface CropPanelProps {
    aspect: number | undefined;
    setAspect: (aspect: number | undefined) => void;
    onApplyCrop: () => void;
}

const aspectRatios = [
    { name: 'Free', value: undefined },
    { name: '16:9', value: 16 / 9 },
    { name: '4:3', value: 4 / 3 },
    { name: '1:1', value: 1 },
    { name: '3:4', value: 3 / 4 },
];

export const CropPanel: React.FC<CropPanelProps> = ({ aspect, setAspect, onApplyCrop }) => {
  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-semibold">Crop Image</h3>
      <div>
        <h4 className="text-md font-semibold mb-2">Aspect Ratio</h4>
        <div className="grid grid-cols-3 gap-2">
          {aspectRatios.map(ar => (
            <button key={ar.name} onClick={() => setAspect(ar.value)} className={`p-3 rounded-md text-sm font-semibold transition-colors ${aspect === ar.value ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
              {ar.name}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onApplyCrop} className="w-full p-2 bg-purple-600 rounded-md font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
        <CheckIcon className="w-5 h-5"/>
        <span>Apply Crop</span>
      </button>
    </div>
  );
};
