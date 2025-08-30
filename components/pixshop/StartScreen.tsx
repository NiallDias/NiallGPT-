import React, { useCallback } from 'react';
import { UploadIcon } from './icons';

interface StartScreenProps {
  onImageUpload: (file: File) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onImageUpload }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUpload(e.dataTransfer.files[0]);
    }
  }, [onImageUpload]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="pixshop-background-container" aria-hidden="true">
            <div className="pixshop-nebula"></div>
            <div className="pixshop-stars"></div>
            <div className="pixshop-stars pixshop-stars2"></div>
            <div className="pixshop-stars pixshop-stars3"></div>
        </div>
        <div className="relative text-center z-10">
            <h1 className="text-5xl font-bold mb-4">Welcome to Pixshop <span className="text-purple-400">AI</span></h1>
            <p className="text-lg text-gray-300 mb-8">Your creative partner for intelligent photo editing.</p>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="w-full max-w-lg mx-auto border-2 border-dashed border-gray-600 rounded-xl p-12 cursor-pointer hover:border-purple-500 hover:bg-gray-900/50 transition-colors"
            >
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <UploadIcon className="w-12 h-12 text-gray-500 mb-4"/>
                <span className="text-xl font-semibold">Drag & Drop or Click to Upload</span>
                <span className="text-gray-400 mt-2">PNG, JPG, WEBP accepted</span>
                </label>
            </div>
        </div>
    </div>
  );
};
