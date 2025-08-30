import React, { useState, useContext, useRef, useEffect } from 'react';
import { generateImage, enhanceImagePrompt } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageIcon } from './icons/ImageIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { AspectRatio, GalleryImage } from '../types';
import { ASPECT_RATIOS } from '../constants';
import { SparkleIcon } from './icons/SparkleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';

export const ImageGeneratorView: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [isNewImage, setIsNewImage] = useState(false);
  
  const { 
    imageGallery, 
    addToImageGallery, 
    deleteFromImageGallery,
    redirectedPrompt,
    setRedirectedPrompt,
  } = useContext(AppSettingsContext);
  
  const promptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (redirectedPrompt && setRedirectedPrompt) {
      setPrompt(redirectedPrompt);
      setRedirectedPrompt(null); // Clear it after use
      window.scrollTo({ top: 0, behavior: 'smooth' });
      promptInputRef.current?.focus();
    }
  }, [redirectedPrompt, setRedirectedPrompt]);

  const handleGenerateImage = async () => {
    if (prompt.trim() === '' || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const generatedImgUrl = await generateImage(prompt.trim(), aspectRatio, negativePrompt.trim());
      setImageUrl(generatedImgUrl);
      setIsNewImage(true);
      setTimeout(() => setIsNewImage(false), 2100); // Animation duration + buffer
      const newImage: GalleryImage = {
        id: crypto.randomUUID(),
        imageUrl: generatedImgUrl,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim(),
        aspectRatio,
        timestamp: Date.now(),
      };
      addToImageGallery(newImage);
    } catch (err) {
      setError(err instanceof Error ? `Error: ${err.message}` : 'An unknown error occurred. Please try again.');
      setImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing || isLoading) return;
    setIsEnhancing(true);
    setError(null);
    try {
        const enhanced = await enhanceImagePrompt(prompt);
        setPrompt(enhanced);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get prompt suggestion.');
    } finally {
        setIsEnhancing(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleGenerateImage();
    }
  };

  const handleDownloadImage = (url: string, p: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    const safePrompt = p.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 30);
    link.download = `NiallGPT_${safePrompt || 'image'}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseGalleryImage = (image: GalleryImage) => {
    setPrompt(image.prompt);
    setNegativePrompt(image.negativePrompt);
    setAspectRatio(image.aspectRatio);
    promptInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteGalleryImage = (id: string) => {
    setDeletingImageId(id);
    setTimeout(() => {
        deleteFromImageGallery(id);
        setDeletingImageId(null);
    }, 400); // Animation duration
  };

  const isGenerateDisabled = isLoading || prompt.trim() === '';

  return (
    <div className="flex flex-col items-center justify-start w-full h-full">
      <div className="w-full max-w-2xl mb-6">
        <div className="sapphire-container space-y-4 p-4">
            <div className="flex items-center space-x-2">
                <input
                    ref={promptInputRef}
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="A futuristic car soaring through a neon city..."
                    className="flex-grow p-3 rounded-md themed-focus-ring text-base"
                    style={{backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)'}}
                    disabled={isLoading}
                    aria-label="Image generation prompt"
                />
                <button
                    onClick={handleEnhancePrompt}
                    disabled={isEnhancing || isLoading || !prompt.trim()}
                    className="p-3 rounded-md transition-colors group"
                    style={{color: 'var(--image-gen-button-bg)'}}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="Enhance Prompt with AI"
                    aria-label="Enhance prompt"
                >
                    {isEnhancing ? <LoadingSpinner size="h-6 w-6" /> : <SparkleIcon className="w-6 h-6 transition-transform group-hover:scale-125" />}
                </button>
            </div>
            
            <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Negative prompt (e.g., text, blurry, watermark)"
                className="w-full p-3 rounded-md themed-focus-ring text-sm"
                style={{backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)'}}
                disabled={isLoading}
                aria-label="Negative prompt"
            />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="w-full sm:w-auto">
                    <label className="text-sm font-medium mr-3" style={{color: 'var(--text-secondary)'}}>Aspect Ratio:</label>
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        {ASPECT_RATIOS.map((ar, index) => (
                            <button
                                key={ar.value}
                                onClick={() => setAspectRatio(ar.value)}
                                disabled={isLoading}
                                className={`px-4 py-2 text-sm font-medium transition-all ${
                                    index === 0 ? 'rounded-l-lg' : ''
                                } ${
                                    index === ASPECT_RATIOS.length - 1 ? 'rounded-r-lg' : ''
                                } border-y border-x hover:scale-105`}
                                style={{
                                    backgroundColor: aspectRatio === ar.value ? 'var(--image-gen-button-bg)' : 'var(--bg-tertiary)',
                                    color: aspectRatio === ar.value ? 'var(--button-accent-text)' : 'var(--text-primary)',
                                    borderColor: 'var(--border-primary)'
                                }}
                            >
                                {ar.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleGenerateImage}
                    disabled={isGenerateDisabled}
                    className="w-full sm:w-auto text-white p-3 rounded-lg transition-all duration-200 ease-in-out flex items-center justify-center font-bold hover:scale-105"
                    style={{
                        background: isGenerateDisabled ? 'var(--button-accent-disabled-bg)' : 'var(--image-gen-button-bg)',
                        color: isGenerateDisabled ? 'var(--text-secondary)' : 'var(--button-accent-text)',
                        cursor: isGenerateDisabled ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => { if (!isGenerateDisabled) e.currentTarget.style.background = 'var(--image-gen-button-hover-bg)'; }}
                    onMouseLeave={(e) => { if (!isGenerateDisabled) e.currentTarget.style.background = 'var(--image-gen-button-bg)'; }}
                    aria-label="Generate image"
                >
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                    <span>Generate</span>
                </button>
            </div>
        </div>
      </div>

      {error && (
        <div className="my-4 p-4 text-center rounded-lg shadow-md w-full max-w-2xl text-sm transition-colors duration-300 animate-shake"
            style={{backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)'}}
        >
          {error}
        </div>
      )}

      <div className="mt-2 flex-grow w-full max-w-5xl flex flex-col justify-center items-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg w-full max-w-md aspect-square animate-bounce-in" style={{color: 'var(--text-secondary)', borderColor: 'var(--image-gen-placeholder-border)', backgroundColor: 'var(--image-gen-placeholder-bg)'}}>
            <LoadingSpinner size="h-16 w-16" />
            <p className="mt-4 text-lg">Generating your masterpiece...</p>
          </div>
        ) : imageUrl ? (
          <div className="w-full flex flex-col items-center animate-bounce-in">
            <div className={`image-container p-2 rounded-lg shadow-xl w-full max-w-2xl aspect-square max-h-[60vh] transition-colors duration-300 ${isNewImage ? 'animate-shimmer' : ''}`}>
              <img src={imageUrl} alt={prompt || 'Generated image'} className="rounded-md w-full h-full object-contain" />
            </div>
            <button
              onClick={() => handleDownloadImage(imageUrl, prompt)}
              className="mt-4 px-6 py-3 rounded-lg transition-all duration-200 flex items-center justify-center font-bold hover:scale-105"
              style={{ background: 'var(--download-button-bg)', color: 'var(--button-accent-text)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--download-button-hover-bg)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--download-button-bg)'}
              aria-label="Download generated image"
            >
              <DownloadIcon className="w-6 h-6 mr-2" />
              <span>Download Image</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg w-full max-w-md aspect-square transition-colors duration-300 animate-placeholder-pulse" style={{color: 'var(--text-secondary)', borderColor: 'var(--image-gen-placeholder-border)', backgroundColor: 'var(--image-gen-placeholder-bg)'}}>
            <ImageIcon className="w-24 h-24 mb-4" style={{color: 'var(--image-gen-placeholder-icon)'}}/>
            <p className="text-center text-base">Your generated images will appear here.</p>
          </div>
        )}
      </div>

      {imageGallery.length > 0 && (
        <div className="w-full max-w-7xl mt-12">
            <h3 className="text-2xl font-bold mb-4 text-center animate-bounce-in" style={{color: 'var(--text-primary)', animationDelay: '400ms'}}>Image Gallery</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {imageGallery.map((img, index) => {
                    const isDeleting = deletingImageId === img.id;
                    return (
                    <div key={img.id} className={`sapphire-card group relative aspect-square overflow-hidden rounded-lg cursor-pointer ${isDeleting ? 'animate-bounce-out' : 'animate-subtle-pop-in'}`} style={{animationDelay: isDeleting ? '0ms' : `${100 + index * 50}ms`, backgroundColor: 'var(--bg-tertiary)'}}>
                        <img src={img.imageUrl} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                           <p className="text-white text-xs font-bold line-clamp-3 transform-gpu translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out">{img.prompt}</p>
                           <div className="flex space-x-2 mt-2 transform-gpu translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out delay-100">
                               <button onClick={() => handleUseGalleryImage(img)} className="gallery-btn" title="Use Prompt & Settings"><PencilIcon className="w-4 h-4"/></button>
                               <button onClick={() => handleDownloadImage(img.imageUrl, img.prompt)} className="gallery-btn" title="Download Image"><DownloadIcon className="w-4 h-4"/></button>
                               <button onClick={() => handleDeleteGalleryImage(img.id)} className="gallery-btn danger" title="Delete Image"><TrashIcon className="w-4 h-4"/></button>
                           </div>
                        </div>
                    </div>
                )})}
            </div>
        </div>
      )}
      <style>{`
        .image-container {
          background-color: var(--bg-secondary);
          background-image: 
            linear-gradient(45deg, var(--bg-tertiary) 25%, transparent 25%, transparent 75%, var(--bg-tertiary) 75%, var(--bg-tertiary)),
            linear-gradient(45deg, var(--bg-tertiary) 25%, transparent 25%, transparent 75%, var(--bg-tertiary) 75%, var(--bg-tertiary));
          background-size: 20px 20px;
          background-position: 0 0, 10px 10px;
        }
        .gallery-btn {
          background-color: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.375rem;
          border-radius: 9999px;
          transition: background-color 0.2s, transform 0.2s;
        }
        .gallery-btn:hover {
          background-color: rgba(255, 255, 255, 0.4);
          transform: scale(1.1);
        }
        .gallery-btn.danger:hover {
          background-color: var(--danger-bg);
        }
        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};