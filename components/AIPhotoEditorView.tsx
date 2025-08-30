
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { StartScreen } from './aiPhotoEditor/StartScreen';
import { Header } from './aiPhotoEditor/Header';
import { Spinner } from './aiPhotoEditor/Spinner';
import { FilterPanel } from './aiPhotoEditor/FilterPanel';
import { AdjustmentPanel } from './aiPhotoEditor/AdjustmentPanel';
import { CropPanel } from './aiPhotoEditor/CropPanel';
import { BackgroundPanel } from './aiPhotoEditor/BackgroundPanel';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, changeBackground } from '../../services/aiPhotoEditorService';
import { AppView } from '../../types';
import { WandSparklesIcon } from './icons/WandSparklesIcon';
import { CropIcon } from './icons/CropIcon';
import { AdjustmentsHorizontalIcon } from './icons/AdjustmentsHorizontalIcon';
import { PaintBrushIcon } from './icons/PaintBrushIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { ArrowUturnRightIcon } from './icons/ArrowUturnRightIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { PhotoIcon } from './icons/PhotoIcon';

interface AIPhotoEditorViewProps {
    onSetView: (view: AppView) => void;
}

type Tab = 'retouch' | 'crop' | 'adjust' | 'filters' | 'bg';

const centerAspectCrop = (mediaWidth: number, mediaHeight: number, aspect: number) => {
    return centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight
    );
};

export const AIPhotoEditorView: React.FC<AIPhotoEditorViewProps> = ({ onSetView }) => {
    const [history, setHistory] = useState<File[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('retouch');

    const [retouchPrompt, setRetouchPrompt] = useState('');
    const [editHotspot, setEditHotspot] = useState<{ x: number; y: number } | null>(null);
    const [displayHotspot, setDisplayHotspot] = useState<{ x: number; y: number } | null>(null);

    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<Crop>();
    const [aspect, setAspect] = useState<number | undefined>(undefined);

    const imgRef = useRef<HTMLImageElement>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

    useEffect(() => {
        let currentUrl: string | null = null;
        if (history.length > 0 && historyIndex >= 0) {
            currentUrl = URL.createObjectURL(history[historyIndex]);
            setCurrentImageUrl(currentUrl);
        } else {
            setCurrentImageUrl(null);
        }
    
        return () => {
            if (currentUrl) URL.revokeObjectURL(currentUrl);
        };
    }, [history, historyIndex]);

    const addImageToHistory = (newImageFile: File) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newImageFile);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleImageUpload = (file: File) => {
        setHistory([file]);
        setHistoryIndex(0);
        setError(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setActiveTab('retouch');
    };

    const handleGenerate = async () => {
        if (!editHotspot || !retouchPrompt.trim() || isLoading) return;
        setIsLoading(true);
        setLoadingMessage('Applying smart retouch...');
        setError(null);
        try {
            const currentImage = history[historyIndex];
            const newImage = await generateEditedImage(currentImage, retouchPrompt, editHotspot);
            addImageToHistory(newImage);
            setRetouchPrompt('');
            setEditHotspot(null);
            setDisplayHotspot(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (activeTab !== 'retouch' || !imgRef.current) return;
        const rect = imgRef.current.getBoundingClientRect();
        const { naturalWidth, naturalHeight, width, height } = imgRef.current;
        
        const displayX = e.clientX - rect.left;
        const displayY = e.clientY - rect.top;

        const naturalX = Math.round((displayX / width) * naturalWidth);
        const naturalY = Math.round((displayY / height) * naturalHeight);

        setEditHotspot({ x: naturalX, y: naturalY });
        setDisplayHotspot({ x: displayX, y: displayY });
    };
    
    const handleApplyFilter = async (prompt: string) => {
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true);
        setLoadingMessage('Applying creative filter...');
        setError(null);
        try {
            const currentImage = history[historyIndex];
            const newImage = await generateFilteredImage(currentImage, prompt);
            addImageToHistory(newImage);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyAdjustment = async (prompt: string) => {
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true);
        setLoadingMessage('Making adjustments...');
        setError(null);
        try {
            const currentImage = history[historyIndex];
            const newImage = await generateAdjustedImage(currentImage, prompt);
            addImageToHistory(newImage);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyBackground = async (prompt: string) => {
        if (!prompt.trim() || isLoading) return;
        setIsLoading(true);
        setLoadingMessage('Changing background...');
        setError(null);
        try {
            const currentImage = history[historyIndex];
            const newImage = await changeBackground(currentImage, prompt);
            addImageToHistory(newImage);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApplyCrop = useCallback(() => {
        if (!completedCrop || !imgRef.current) return;
        const canvas = document.createElement('canvas');
        const image = imgRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0, 0,
            canvas.width, canvas.height
        );
    
        canvas.toBlob(blob => {
            if (blob) {
                const croppedFile = new File([blob], "cropped_image.png", { type: "image/png" });
                addImageToHistory(croppedFile);
                setCrop(undefined);
                setCompletedCrop(undefined);
            }
        }, "image/png", 1);
    }, [completedCrop, history, historyIndex]);

    const handleUndo = () => {
        if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) setHistoryIndex(historyIndex + 1);
    };

    const handleDownload = () => {
        if (currentImageUrl) {
            const a = document.createElement('a');
            a.href = currentImageUrl;
            a.download = 'NiallGPT-edit.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        if (aspect) {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspect));
        }
    }
    
    const handleGoBack = () => {
        onSetView(AppView.AITools);
    };


    return (
        <div className="h-full w-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden animate-fade-in">
            <Header onGoBack={handleGoBack} />

            {!currentImageUrl ? (
                <StartScreen onImageUpload={handleImageUpload} />
            ) : (
                <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                    {/* Editing Panel */}
                    <aside className="w-full lg:w-80 flex-shrink-0 bg-[var(--bg-secondary)] border-b lg:border-b-0 lg:border-r border-[var(--border-primary)] p-4 flex flex-col space-y-6 overflow-y-auto z-20 animate-slide-in-left">
                        <nav className="flex justify-around bg-[var(--bg-tertiary)] p-1 rounded-lg">
                            {(['retouch', 'crop', 'adjust', 'filters', 'bg'] as Tab[]).map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full p-2 rounded-md transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 text-sm font-semibold flex flex-col items-center space-y-1 ${activeTab === tab ? 'bg-[var(--button-accent-bg)] text-[var(--button-accent-text)]' : 'hover:bg-[var(--icon-hover-bg)]'}`}>
                                    {tab === 'retouch' && <WandSparklesIcon className="w-5 h-5"/>}
                                    {tab === 'crop' && <CropIcon className="w-5 h-5"/>}
                                    {tab === 'adjust' && <AdjustmentsHorizontalIcon className="w-5 h-5"/>}
                                    {tab === 'filters' && <PaintBrushIcon className="w-5 h-5"/>}
                                    {tab === 'bg' && <PhotoIcon className="w-5 h-5"/>}
                                    <span className="capitalize">{tab === 'bg' ? 'BG' : tab}</span>
                                </button>
                            ))}
                        </nav>
                        
                        {error && (
                            <div className="bg-red-500/20 border border-red-500 text-red-500 p-3 rounded-md animate-shake">
                                <p className="font-bold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        
                        <div key={activeTab} className="animate-fade-in">
                            {activeTab === 'retouch' && (
                                <div className="flex flex-col space-y-4">
                                    <h3 className="text-lg font-semibold">Smart Retouch</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">Click a point on the image and describe your edit.</p>
                                    <textarea value={retouchPrompt} onChange={e => setRetouchPrompt(e.target.value)} placeholder="e.g., Change shirt color to red" rows={3} className="w-full p-2 bg-[var(--bg-input)] rounded-md themed-focus-ring text-sm" />
                                    <button onClick={handleGenerate} disabled={!editHotspot || !retouchPrompt.trim() || isLoading} className="w-full p-2 bg-[var(--button-accent-bg)] text-[var(--button-accent-text)] rounded-md font-semibold hover:bg-[var(--button-accent-hover-bg)] transition-colors disabled:bg-[var(--button-accent-disabled-bg)] disabled:cursor-not-allowed">Apply Edit</button>
                                </div>
                            )}
                            {activeTab === 'crop' && <CropPanel aspect={aspect} setAspect={setAspect} onApplyCrop={handleApplyCrop} />}
                            {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} />}
                            {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} />}
                            {activeTab === 'bg' && <BackgroundPanel onApplyBackground={handleApplyBackground} />}
                        </div>

                    </aside>

                    {/* Image Display */}
                    <section className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative bg-[var(--bg-tertiary)] animate-slide-in-right">
                        {isLoading && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30"><Spinner /><p className="mt-4 text-lg">{loadingMessage}</p></div>}
                        <div className="flex items-center space-x-2 absolute top-4 right-4 z-20 bg-[var(--bg-secondary)] p-2 rounded-lg shadow-lg">
                            <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-md hover:bg-[var(--icon-hover-bg)] disabled:opacity-50 transition-all duration-200 hover:scale-110 active:scale-95" title="Undo"><ArrowUturnLeftIcon className="w-5 h-5"/></button>
                            <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md hover:bg-[var(--icon-hover-bg)] disabled:opacity-50 transition-all duration-200 hover:scale-110 active:scale-95" title="Redo"><ArrowUturnRightIcon className="w-5 h-5"/></button>
                            <button onClick={handleDownload} className="p-2 rounded-md hover:bg-[var(--icon-hover-bg)] transition-all duration-200 hover:scale-110 active:scale-95" title="Download"><DownloadIcon className="w-5 h-5"/></button>
                        </div>

                        <div className="relative max-w-full max-h-full flex items-center justify-center">
                            {activeTab === 'crop' ? (
                                <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={aspect}>
                                    <img key={currentImageUrl} ref={imgRef} src={currentImageUrl!} alt="editable image" className="max-w-full max-h-[80vh] object-contain block animate-image-appear" onLoad={onImageLoad} />
                                </ReactCrop>
                            ) : (
                                <img key={currentImageUrl} ref={imgRef} src={currentImageUrl!} alt="editable image" className="max-w-full max-h-[80vh] object-contain block cursor-crosshair animate-image-appear" onClick={handleImageClick} />
                            )}
                            {displayHotspot && activeTab === 'retouch' && (
                                <div className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-hotspot-pulse" style={{ left: displayHotspot.x - 8, top: displayHotspot.y - 8 }}></div>
                            )}
                        </div>
                    </section>
                </main>
            )}
        </div>
    );
};