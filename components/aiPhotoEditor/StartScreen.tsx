
import React, { useCallback } from 'react';
import { ArrowUpOnSquareIcon } from '../icons/ArrowUpOnSquareIcon';

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
    <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative text-center z-10">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 animate-subtle-pop-in text-[var(--text-accent)]">AI Photo Editor</h1>
            <p className="text-lg text-[var(--text-secondary)] mb-8 animate-subtle-pop-in" style={{animationDelay: '150ms'}}>Your creative partner for intelligent photo editing.</p>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="w-full max-w-lg mx-auto border-2 border-dashed rounded-xl p-12 cursor-pointer hover:border-[var(--border-accent)] hover:bg-[var(--bg-tertiary)] transition-colors animate-subtle-pop-in"
                style={{borderColor: 'var(--border-primary)', animationDelay: '300ms'}}
            >
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center text-[var(--text-secondary)]">
                    <ArrowUpOnSquareIcon className="w-12 h-12 mb-4"/>
                    <span className="text-xl font-semibold text-[var(--text-primary)]">Drag & Drop or Click to Upload</span>
                    <span className="mt-2">PNG, JPG, WEBP accepted</span>
                </label>
            </div>
        </div>
    </main>
  );
};
