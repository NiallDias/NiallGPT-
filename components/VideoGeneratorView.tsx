
import React, { useState, useRef } from 'react';
import { generateVideo } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ArrowUpOnSquareIcon } from './icons/ArrowUpOnSquareIcon';
import { XCircleIcon } from './icons/XCircleIcon';

const reassuringMessages = [
    "Crafting your visual story...",
    "The digital film crew is at work.",
    "Rendering pixels into motion...",
    "This can take a few minutes, good things come to those who wait!",
    "Assembling scenes, please hold on.",
    "The AI is directing its masterpiece."
];

export const VideoGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [reassuringMessage, setReassuringMessage] = useState(reassuringMessages[0]);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isFileReading, setIsFileReading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const intervalRef = useRef<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please select a valid image file.'); return; }
        if (file.size > 4 * 1024 * 1024) { setError("File is too large (max 4MB)."); return; }
        
        setError(null);
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

    const clearSelection = () => {
        setSelectedFile(null);
        setImagePreview(null);
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleGenerateVideo = async () => {
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setStatus('');
        
        intervalRef.current = window.setInterval(() => {
            setReassuringMessage(reassuringMessages[Math.floor(Math.random() * reassuringMessages.length)]);
        }, 5000);

        try {
            let imagePayload: { imageBytes: string; mimeType: string; } | undefined = undefined;
            if (selectedFile && imagePreview) {
                imagePayload = {
                    imageBytes: imagePreview.split(',')[1],
                    mimeType: selectedFile.type
                };
            }

            const generatedVideoUrl = await generateVideo(prompt.trim(), imagePayload, setStatus);
            setVideoUrl(generatedVideoUrl);
            
        } catch (err) {
            setError(err instanceof Error ? `Error: ${err.message}` : 'An unknown error occurred. Please try again.');
            setVideoUrl(null);
        } finally {
            setIsLoading(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
    };
    
    const handleDownloadVideo = () => {
        if (!videoUrl) return;
        const link = document.createElement('a');
        link.href = videoUrl;
        const safePrompt = prompt.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 30);
        link.download = `NiallGPT_${safePrompt || 'video'}_${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isGenerateDisabled = isLoading || !prompt.trim() || isFileReading;

    return (
        <div className="flex flex-col items-center w-full h-full p-4">
            <div className="w-full max-w-2xl">
                 <h2 className="text-2xl sm:text-3xl font-bold text-center mb-1 animate-bounce-in" style={{ color: 'var(--image-gen-title)', animationDelay: '100ms' }}>
                    NiallGPT Video Generator
                </h2>
                <p className="text-center text-sm mb-6 animate-bounce-in" style={{color: 'var(--text-secondary)', animationDelay: '200ms'}}>
                    Create short videos from a text prompt and an optional image.
                </p>
                <div className="space-y-4 p-4 rounded-lg shadow-md animate-bounce-in" style={{backgroundColor: 'var(--bg-secondary)', animationDelay: '300ms'}}>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A majestic lion roaring on a rocky cliff at sunrise"
                        rows={3}
                        className="w-full p-3 rounded-md themed-focus-ring text-base resize-y"
                        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                        disabled={isLoading}
                        aria-label="Video generation prompt"
                    />
                     <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {!imagePreview ? (
                            <button onClick={() => inputRef.current?.click()} disabled={isFileReading || isLoading} className="w-full sm:w-auto flex items-center justify-center p-3 border-2 border-dashed rounded-lg transition-colors hover:border-[var(--border-accent)]" style={{borderColor: 'var(--image-gen-placeholder-border)'}}>
                                {isFileReading ? <LoadingSpinner size="h-5 w-5"/> : <ArrowUpOnSquareIcon className="w-5 h-5 mr-2" style={{color: 'var(--text-secondary)'}}/>}
                                <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Add Image (Optional)</span>
                            </button>
                        ) : (
                            <div className="relative animate-fade-in">
                                <img src={imagePreview} alt="Preview" className="w-auto h-24 object-contain rounded-md" />
                                <button onClick={clearSelection} disabled={isLoading} className="absolute top-0 right-0 -m-2 p-0.5 rounded-full" style={{backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)'}}><XCircleIcon className="w-5 h-5" /></button>
                            </div>
                        )}
                         <input type="file" accept="image/*" ref={inputRef} onChange={handleFileChange} className="hidden"/>

                        <button
                            onClick={handleGenerateVideo}
                            disabled={isGenerateDisabled}
                            className="w-full sm:w-auto text-white p-3 rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center font-bold hover:scale-105"
                            style={{ backgroundColor: isGenerateDisabled ? 'var(--button-accent-disabled-bg)' : 'var(--image-gen-button-bg)', color: isGenerateDisabled ? 'var(--text-secondary)' : 'var(--button-accent-text)' }}
                        >
                            <VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                            <span>Generate Video</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {error && (
                <div className="mt-6 p-4 text-center rounded-lg shadow-md w-full max-w-2xl text-sm transition-colors duration-300 animate-shake" style={{backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)'}}>
                    {error}
                </div>
            )}
            
            <div className="mt-6 flex-grow w-full max-w-3xl flex flex-col justify-center items-center">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 w-full animate-bounce-in" style={{color: 'var(--text-secondary)'}}>
                        <LoadingSpinner size="h-16 w-16" />
                        <p className="mt-4 text-lg">{reassuringMessage}</p>
                        <p className="mt-2 text-xs font-mono">{status}</p>
                    </div>
                ) : videoUrl ? (
                    <div className="w-full flex flex-col items-center animate-bounce-in">
                        <video ref={videoRef} src={videoUrl} controls autoPlay loop muted playsInline className="rounded-lg shadow-xl w-full max-w-full aspect-video bg-black"></video>
                        <button onClick={handleDownloadVideo} className="mt-4 px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center font-bold hover:scale-105" style={{ backgroundColor: 'var(--download-button-bg)', color: 'var(--button-accent-text)' }}>
                            <DownloadIcon className="w-6 h-6 mr-2" />
                            <span>Download Video</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg w-full max-w-md aspect-video transition-colors duration-300" style={{color: 'var(--text-secondary)', borderColor: 'var(--image-gen-placeholder-border)', backgroundColor: 'var(--image-gen-placeholder-bg)'}}>
                        <VideoCameraIcon className="w-24 h-24 mb-4" style={{color: 'var(--image-gen-placeholder-icon)'}}/>
                        <p className="text-center text-base">Your generated video will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};