import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { StartScreen } from './pixshop/StartScreen';
import { Header } from './pixshop/Header';
import { RetouchIcon, CropIcon, AdjustIcon, FilterIcon, UndoIcon, RedoIcon, DownloadIcon, CompareIcon } from './pixshop/icons';
import { Spinner } from './pixshop/Spinner';
import { FilterPanel } from './pixshop/FilterPanel';
import { AdjustmentPanel } from './pixshop/AdjustmentPanel';
import { CropPanel } from './pixshop/CropPanel';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage } from '../../services/pixshopGeminiService';

type Tab = 'retouch' | 'crop' | 'adjust' | 'filters';

const centerAspectCrop = (mediaWidth: number, mediaHeight: number, aspect: number) => {
    return centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
        mediaWidth,
        mediaHeight
    );
};

export const PixshopView: React.FC = () => {
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
    const [aspect, setAspect] = useState<number | undefined>(16 / 9);

    const [isComparing, setIsComparing] = useState(false);

    const imgRef = useRef<HTMLImageElement>(null);
    const currentImageUrl = history.length > 0 && historyIndex >= 0 ? URL.createObjectURL(history[historyIndex]) : null;
    const originalImageUrl = history.length > 0 ? URL.createObjectURL(history[0]) : null;

    useEffect(() => {
        document.documentElement.classList.add('pixshop-active');
        return () => {
            document.documentElement.classList.remove('pixshop-active');
        };
    }, []);

    useEffect(() => {
        return () => {
            if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
            if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
        };
    }, [currentImageUrl, originalImageUrl]);

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
            a.download = 'pixshop-edit.png';
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

    if (!currentImageUrl) return <StartScreen onImageUpload={handleImageUpload} />;

    return (
        <div className="h-screen w-screen flex flex-col bg-black text-white font-sans overflow-hidden">
            <div className="pixshop-background-container" aria-hidden="true">
                <div className="pixshop-nebula"></div>
                <div className="pixshop-stars"></div>
                <div className="pixshop-stars pixshop-stars2"></div>
                <div className="pixshop-stars pixshop-stars3"></div>
            </div>
            
            <Header />

            <main className="flex-1 flex overflow-hidden relative">
                {/* Editing Panel */}
                <aside className="w-80 bg-gray-900/50 backdrop-blur-sm p-4 flex flex-col space-y-6 overflow-y-auto z-20">
                    <nav className="flex justify-around bg-gray-800/60 p-1 rounded-lg">
                        {(['retouch', 'crop', 'adjust', 'filters'] as Tab[]).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full p-2 rounded-md transition-colors text-sm font-semibold flex flex-col items-center space-y-1 ${activeTab === tab ? 'bg-purple-600' : 'hover:bg-gray-700/80'}`}>
                                {tab === 'retouch' && <RetouchIcon className="w-5 h-5"/>}
                                {tab === 'crop' && <CropIcon className="w-5 h-5"/>}
                                {tab === 'adjust' && <AdjustIcon className="w-5 h-5"/>}
                                {tab === 'filters' && <FilterIcon className="w-5 h-5"/>}
                                <span className="capitalize">{tab}</span>
                            </button>
                        ))}
                    </nav>
                    
                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm p-3 rounded-md animate-shake">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}
                    
                    {activeTab === 'retouch' && (
                        <div className="flex flex-col space-y-4">
                            <h3 className="text-lg font-semibold">Smart Retouch</h3>
                            <p className="text-xs text-gray-400">Click a point on the image and describe your edit.</p>
                            <textarea value={retouchPrompt} onChange={e => setRetouchPrompt(e.target.value)} placeholder="e.g., Change shirt color to red" rows={3} className="w-full p-2 bg-gray-800 rounded-md focus:ring-2 focus:ring-purple-500 outline-none text-sm" />
                            <button onClick={handleGenerate} disabled={!editHotspot || !retouchPrompt.trim() || isLoading} className="w-full p-2 bg-purple-600 rounded-md font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">Apply Edit</button>
                        </div>
                    )}
                    {activeTab === 'crop' && <CropPanel aspect={aspect} setAspect={setAspect} onApplyCrop={handleApplyCrop} />}
                    {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} />}
                    {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} />}

                </aside>

                {/* Image Display */}
                <section className="flex-1 flex flex-col items-center justify-center p-8 relative">
                    {isLoading && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30"><Spinner /><p className="mt-4 text-lg">{loadingMessage}</p></div>}
                    <div className="flex items-center space-x-4 absolute top-4 right-8 z-20 bg-gray-900/50 backdrop-blur-sm p-2 rounded-lg">
                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-md hover:bg-gray-700/80 disabled:opacity-50"><UndoIcon className="w-5 h-5"/></button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md hover:bg-gray-700/80 disabled:opacity-50"><RedoIcon className="w-5 h-5"/></button>
                        <button onMouseDown={() => setIsComparing(true)} onMouseUp={() => setIsComparing(false)} onMouseLeave={() => setIsComparing(false)} className="p-2 rounded-md hover:bg-gray-700/80"><CompareIcon className="w-5 h-5"/></button>
                        <button onClick={handleDownload} className="p-2 rounded-md hover:bg-gray-700/80"><DownloadIcon className="w-5 h-5"/></button>
                    </div>

                    <div className="relative max-w-full max-h-full flex items-center justify-center">
                        {activeTab === 'crop' ? (
                            <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={aspect}>
                                <img ref={imgRef} src={isComparing ? originalImageUrl! : currentImageUrl} alt="editable image" className="max-w-full max-h-[80vh] object-contain block" onLoad={onImageLoad} />
                            </ReactCrop>
                        ) : (
                            <img ref={imgRef} src={isComparing ? originalImageUrl! : currentImageUrl} alt="editable image" className="max-w-full max-h-[80vh] object-contain block cursor-crosshair" onClick={handleImageClick} />
                        )}
                        {displayHotspot && activeTab === 'retouch' && (
                            <div className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-ping" style={{ left: displayHotspot.x - 8, top: displayHotspot.y - 8 }}></div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};
