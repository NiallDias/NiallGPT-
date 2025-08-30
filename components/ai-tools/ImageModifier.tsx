

import React, { useState, useRef } from 'react';
import { inpaintImage } from '../../services/geminiService';
import { LoadingSpinner } from '../LoadingSpinner';
import { ArrowUpOnSquareIcon } from '../icons/ArrowUpOnSquareIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { WandSparklesIcon } from '../icons/WandSparklesIcon';
import { DownloadIcon } from '../icons/DownloadIcon';

export const ImageModifier: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [resultUrl, setResultUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isFileReading, setIsFileReading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please select a valid image file.'); return; }
        if (file.size > 4 * 1024 * 1024) { setError("File is too large (max 4MB)."); return; }
        setError(null); setSelectedFile(file); setIsFileReading(true);
        const reader = new FileReader();
        reader.onloadend = () => { setImagePreview(reader.result as string); setIsFileReading(false); };
        reader.onerror = () => { setError('Failed to read the file.'); setIsFileReading(false); };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!selectedFile || !imagePreview || !prompt.trim()) { setError("Upload an image and provide a modification prompt."); return; }
        setIsLoading(true); setError(null); setResultUrl('');
        try {
            const originalImageBase64 = imagePreview.split(',')[1];
            const img = await new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload=()=>res(i); i.src=imagePreview; });
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = img.width; maskCanvas.height = img.height;
            const maskCtx = maskCanvas.getContext('2d')!;
            maskCtx.fillStyle = 'white'; maskCtx.fillRect(0, 0, img.width, img.height);
            const maskImageBase64 = maskCanvas.toDataURL('image/png').split(',')[1];
            const finalPrompt = `Modify the style of the entire image based on this instruction: "${prompt}". Keep the original composition but apply the new style.`;
            const result = await inpaintImage(originalImageBase64, maskImageBase64, selectedFile.type, finalPrompt);
            setResultUrl(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred during modification.');
        } finally { setIsLoading(false); }
    };

    const clearSelection = () => {
        setSelectedFile(null); setImagePreview(null); setPrompt(''); setResultUrl(''); setError(null);
        if (inputRef.current) inputRef.current.value = "";
    }

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-xl font-bold mb-2 flex items-center" style={{color: 'var(--text-accent)'}}><WandSparklesIcon className="w-6 h-6"/><span className="ml-2">Image Modifier</span></h3>
            <p className="text-sm mb-4 flex-grow" style={{color: 'var(--text-secondary)'}}>Upload an image, describe the changes you want, and generate a new version.</p>
            <input type="file" accept="image/*" ref={inputRef} onChange={handleFileChange} className="hidden"/>
            {!imagePreview ? (
                <button onClick={() => inputRef.current?.click()} disabled={isFileReading} className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:border-[var(--border-accent)]" style={{borderColor: 'var(--image-gen-placeholder-border)'}}>
                    {isFileReading ? <LoadingSpinner/> : <ArrowUpOnSquareIcon className="w-10 h-10 mb-2" style={{color: 'var(--text-secondary)'}}/>}
                    <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Upload an image</span>
                </button>
            ) : (
                <div className="relative mb-4 animate-fade-in">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-contain rounded-md" />
                    <button onClick={clearSelection} className="absolute top-1 right-1 p-0.5 rounded-full" style={{backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)'}}><XCircleIcon className="w-6 h-6" /></button>
                </div>
            )}
            <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Make the car red" className="w-full p-3 my-4 rounded-md themed-focus-ring" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} disabled={isLoading || !imagePreview}/>
            <button onClick={handleGenerate} disabled={!selectedFile || !prompt.trim() || isLoading || isFileReading} className="w-full mt-auto p-3 rounded-lg font-bold text-white bg-[var(--image-gen-button-bg)] hover:bg-[var(--image-gen-button-hover-bg)] disabled:bg-[var(--button-accent-disabled-bg)] disabled:text-[var(--text-secondary)]">
                {isLoading ? <LoadingSpinner size="h-6 w-6"/> : "Modify Image"}
            </button>
            {error && <div className="mt-4 p-3 text-center text-sm rounded-md animate-shake bg-red-500/20 text-red-500">{error}</div>}
            {resultUrl && !isLoading && (
                 <div className="mt-4 p-2 rounded-md animate-image-appear flex flex-col items-center" style={{backgroundColor: 'var(--bg-input)'}}>
                    <img src={resultUrl} alt="Modified image" className="rounded-md w-full h-full object-contain max-h-72"/>
                    <button onClick={() => {const link=document.createElement('a'); link.href=resultUrl; link.download=`NiallGPT_modified_${Date.now()}.png`; link.click();}} className="mt-3 px-4 py-2 rounded-lg flex items-center text-sm font-bold bg-[var(--download-button-bg)] text-[var(--button-accent-text)]"><DownloadIcon className="w-5 h-5 mr-2" /><span>Download</span></button>
                 </div>
            )}
        </div>
    );
};