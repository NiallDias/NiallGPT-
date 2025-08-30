import React, { useState, useRef, useCallback, useContext } from 'react';
import { ArrowUpOnSquareIcon } from '../icons/ArrowUpOnSquareIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { PaintBrushIcon } from '../icons/PaintBrushIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { ArrowUturnLeftIcon } from '../icons/ArrowUturnLeftIcon';
import { AppSettingsContext } from '../../contexts/AppSettingsContext';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';

const initialFilters = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
};

type FilterName = keyof typeof initialFilters;

const filterControls: { name: FilterName, label: string, min: number, max: number, unit: string }[] = [
    { name: 'brightness', label: 'Brightness', min: 0, max: 200, unit: '%' },
    { name: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%' },
    { name: 'saturate', label: 'Saturation', min: 0, max: 200, unit: '%' },
    { name: 'grayscale', label: 'Grayscale', min: 0, max: 100, unit: '%' },
    { name: 'sepia', label: 'Sepia', min: 0, max: 100, unit: '%' },
    { name: 'hueRotate', label: 'Hue', min: 0, max: 360, unit: 'deg' },
];

export const ManualImageFilter: React.FC = () => {
    const [filters, setFilters] = useState(initialFilters);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('edited_image.png');
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
            clearState();
            const file = await urlToFile(imageUrl, `gallery-image-${Date.now()}.png`, 'image/png');
            setFileName(file.name);
            setImagePreview(imageUrl);
        } catch (e) {
            setError("Could not load image from gallery.");
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
        if (file.size > 10 * 1024 * 1024) { setError("File is too large (max 10MB)."); return; }
        
        clearState();
        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleFilterChange = (name: FilterName, value: string) => {
        setFilters(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    };

    const generateFilterString = useCallback(() => {
        return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) hue-rotate(${filters.hueRotate}deg)`;
    }, [filters]);

    const resetFilters = () => setFilters(initialFilters);
    
    const clearState = () => {
        setImagePreview(null);
        setError(null);
        setFilters(initialFilters);
        if (inputRef.current) inputRef.current.value = "";
    };
    
    const handleDownload = () => {
        if (!imagePreview) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.filter = generateFilterString();
            ctx.drawImage(img, 0, 0);

            const link = document.createElement('a');
            link.href = canvas.toDataURL();
            link.download = `edited-${fileName}`;
            link.click();
        };
        img.src = imagePreview;
    };


    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-xl font-bold mb-2 flex items-center" style={{color: 'var(--text-accent)'}}>
                <PaintBrushIcon className="w-6 h-6"/><span className="ml-2">Manual Image Filters</span>
            </h3>
            <p className="text-sm mb-4" style={{color: 'var(--text-secondary)'}}>
                Adjust brightness, contrast, saturation and more. Your images are processed securely and are never uploaded.
            </p>
            <input type="file" accept="image/*" ref={inputRef} onChange={handleFileChange} className="hidden" />

            <div className="flex-grow grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[400px]">
                {/* Image Preview */}
                <div className="md:col-span-3 flex flex-col items-center justify-center bg-[var(--bg-input)] rounded-lg p-2 relative">
                    {!imagePreview ? (
                        <div className="w-full h-full p-2 flex flex-col">
                            <button onClick={() => inputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg hover:border-[var(--border-accent)]" style={{borderColor: 'var(--image-gen-placeholder-border)'}}>
                                <ArrowUpOnSquareIcon className="w-10 h-10 mb-2" style={{color: 'var(--text-secondary)'}}/>
                                <span className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Upload Image</span>
                            </button>

                            {imageGallery.length > 0 && (
                                <details className="group details-animation rounded-lg bg-[var(--bg-secondary)] mt-4 border border-[var(--border-primary)]">
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
                        <>
                            <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain rounded-md" style={{ filter: generateFilterString() }}/>
                            <button onClick={clearState} className="absolute top-2 right-2 p-1 rounded-full bg-[var(--danger-bg)] text-[var(--danger-text)] hover:scale-110 transition-transform">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </>
                    )}
                </div>

                {/* Controls */}
                <div className={`md:col-span-2 flex flex-col p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] ${!imagePreview ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h4 className="font-semibold mb-4 text-lg text-center">Controls</h4>
                    <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                        {filterControls.map(({ name, label, min, max, unit }) => (
                            <div key={name}>
                                <label htmlFor={name} className="flex justify-between text-sm font-medium mb-1">
                                    <span>{label}</span>
                                    <span>{filters[name]}{unit}</span>
                                </label>
                                <input
                                    id={name}
                                    type="range"
                                    min={min}
                                    max={max}
                                    value={filters[name]}
                                    onChange={(e) => handleFilterChange(name, e.target.value)}
                                    className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex space-x-2 mt-4 flex-shrink-0">
                         <button onClick={resetFilters} className="w-full p-2 flex items-center justify-center rounded-lg text-sm font-bold bg-[var(--bg-tertiary)] hover:bg-[var(--icon-hover-bg)] transition-colors">
                             <ArrowUturnLeftIcon className="w-5 h-5 mr-2"/> Reset
                        </button>
                        <button onClick={handleDownload} className="w-full p-2 flex items-center justify-center rounded-lg text-sm font-bold bg-[var(--download-button-bg)] text-[var(--button-accent-text)] hover:bg-[var(--download-button-hover-bg)] transition-colors">
                           <DownloadIcon className="w-5 h-5 mr-2"/> Download
                        </button>
                    </div>
                </div>
            </div>
             {error && <div className="mt-4 p-3 text-center text-sm rounded-md animate-shake bg-red-500/20 text-red-500">{error}</div>}
             <style>{`
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: var(--text-accent);
                    border-radius: 50%;
                    cursor: pointer;
                }
                input[type=range]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    background: var(--text-accent);
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                }
             `}</style>
        </div>
    );
};