
import React, { useState, useRef, useContext } from 'react';
import { analyzeImage } from '../../services/geminiService';
import { LoadingSpinner } from '../LoadingSpinner';
import { ArrowUpOnSquareIcon } from '../icons/ArrowUpOnSquareIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { DocumentMagnifyingGlassIcon } from '../icons/DocumentMagnifyingGlassIcon';
import { AppSettingsContext } from '../../contexts/AppSettingsContext';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

export const ImageDescriber: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isFileReading, setIsFileReading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { imageGallery } = useContext(AppSettingsContext);

    const urlToFile = async (url: string, filename: string, mimeType?: string): Promise<File> => {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const type = mimeType || (res.headers.get('content-type') || 'image/png');
        return new File([buf], filename, { type });
    };

    const handleGallerySelect = async (imageUrl: string) => {
        try {
            setError(null);
            setResult('');
            setIsFileReading(true);
            const file = await urlToFile(imageUrl, `gallery-image-${Date.now()}.png`, 'image/png');
            setSelectedFile(file);
            setImagePreview(imageUrl);
        } catch (e) {
            setError("Could not load image from gallery.");
        } finally {
            setIsFileReading(false);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please select a valid image file.'); return; }
        if (file.size > 4 * 1024 * 1024) { setError("File is too large (max 4MB)."); return; }

        setError(null);
        setResult('');
        setSelectedFile(file);
        setIsFileReading(true);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setIsFileReading(false);
        };
        reader.onerror = () => { setError('Failed to read the file.'); setIsFileReading(false); };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (selectedFile && imagePreview && !isLoading) {
            const base64Data = imagePreview.split(',')[1];
            setIsLoading(true); setError(null); setResult('');
            try {
                const description = await analyzeImage(base64Data, selectedFile.type, "Describe this image in detail.");
                setResult(description);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const handleCopy = () => {
        if (result) {
          navigator.clipboard.writeText(result).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          });
        }
    };

    const clearSelection = () => {
        setSelectedFile(null); setImagePreview(null); setResult(''); setError(null);
        if (inputRef.current) inputRef.current.value = "";
    }

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-xl font-bold mb-2 flex items-center" style={{color: 'var(--text-accent)'}}><DocumentMagnifyingGlassIcon className="w-6 h-6"/><span className="ml-2">Image Describer</span></h3>
            <p className="text-sm mb-4 flex-grow" style={{color: 'var(--text-secondary)'}}>Upload an image and let the AI provide a detailed textual description.</p>
            
            <input type="file" accept="image/*" ref={inputRef} onChange={handleFileChange} className="hidden"/>

            {!imagePreview ? (
                <div>
                    <button onClick={() => inputRef.current?.click()} disabled={isFileReading} className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors hover:border-[var(--border-accent)]" style={{borderColor: 'var(--image-gen-placeholder-border)'}}>
                        {isFileReading ? <LoadingSpinner/> : <ArrowUpOnSquareIcon className="w-10 h-10 mb-2" style={{color: 'var(--text-secondary)'}}/>}
                        <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Upload an image</span>
                    </button>
                    {imageGallery.length > 0 && (
                        <details className="group details-animation rounded-lg bg-[var(--bg-input)] mt-4 border border-[var(--border-primary)]">
                            <summary className="flex items-center justify-between cursor-pointer p-2 list-none hover:bg-[var(--icon-hover-bg)]">
                                <span className="text-sm font-medium ml-1">Or select from gallery</span>
                                <ChevronDownIcon className="w-5 h-5 transition-transform group-open:rotate-180"/>
                            </summary>
                            <div className="details-content-wrapper">
                                <div className="p-2 border-t border-[var(--border-primary)] grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                    {imageGallery.map(img => (
                                        <button key={img.id} onClick={() => handleGallerySelect(img.imageUrl)} className="aspect-square rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-input)] focus:ring-[var(--border-accent)] transition-transform hover:scale-105">
                                            <img src={img.imageUrl} alt={img.prompt} className="w-full h-full object-cover"/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </details>
                    )}
                </div>
            ) : (
                <div className="relative mb-4 animate-fade-in">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-72 object-contain rounded-md" />
                    <button onClick={clearSelection} className="absolute top-1 right-1 p-0.5 rounded-full" style={{backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)'}}><XCircleIcon className="w-6 h-6" /></button>
                </div>
            )}
            
            <button onClick={handleGenerate} disabled={!selectedFile || isLoading || isFileReading} className="w-full mt-auto p-3 rounded-lg font-bold text-white bg-[var(--image-gen-button-bg)] hover:bg-[var(--image-gen-button-hover-bg)] disabled:bg-[var(--button-accent-disabled-bg)] disabled:text-[var(--text-secondary)]">
                {isLoading ? <LoadingSpinner size="h-6 w-6"/> : "Get Description"}
            </button>
            
            {error && <div className="mt-4 p-3 text-center text-sm rounded-md animate-shake bg-red-500/20 text-red-500">{error}</div>}

            {result && !isLoading && (
                 <div className="mt-4 p-3 rounded-md animate-slide-in-bottom" style={{backgroundColor: 'var(--bg-input)'}}>
                     <div className="flex justify-end mb-2">
                        <button onClick={handleCopy} className="flex items-center text-xs px-2 py-1 rounded-md" style={{color: 'var(--text-secondary)', backgroundColor: 'var(--icon-hover-bg)'}}>
                          {isCopied ? <CheckIcon className="w-4 h-4 mr-1"/> : <ClipboardIcon className="w-4 h-4 mr-1"/>}
                          {isCopied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto" style={{color: 'var(--text-primary)'}}>{result}</div>
                 </div>
            )}
        </div>
    );
};
