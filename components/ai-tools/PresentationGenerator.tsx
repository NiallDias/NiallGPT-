
import React, { useState, useEffect } from 'react';
import { PresentationResponse, PresentationStructure, PptxSlide } from '../../types';
import { generatePresentationContent, generateImage } from '../../services/geminiService';
import PptxGenJS from 'pptxgenjs';
import { LoadingSpinner } from '../LoadingSpinner';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { ClipboardDocumentListIcon } from '../icons/ClipboardDocumentListIcon';

const getNormalizedSlideType = (slide: PptxSlide): 'title' | 'content' | 'bullets' | 'image' | 'shape' => {
    if (slide.imagePrompt) return 'image';
    if (slide.shape) return 'shape';
    if (slide.bulletPoints && slide.bulletPoints.length > 0) return 'bullets';
    if (slide.subtitle) return 'title';
    const lower = (slide.type || '').toLowerCase().replace(/[\s_]+/g, '');
    if (lower.includes('bullet')) return 'bullets';
    if (lower.includes('title')) return 'title';
    if (slide.content && slide.content.match(/^[\s\t]*[\*\-\•]\s/m)) return 'bullets';
    if (lower.includes('content')) return 'content';
    return 'content';
};

export const PresentationGenerator: React.FC = () => {
    const [pptDescription, setPptDescription] = useState('');
    const [isPptLoading, setIsPptLoading] = useState(false);
    const [pptError, setPptError] = useState<string | null>(null);
    const [pptResult, setPptResult] = useState<PresentationResponse | null>(null);
    const [isPptCodeCopied, setIsPptCodeCopied] = useState(false);
    const [pptGenerationStatus, setPptGenerationStatus] = useState('');
    const [downloadedPpt, setDownloadedPpt] = useState(false);
    const [editablePptStructure, setEditablePptStructure] = useState<PresentationStructure | null>(null);

    useEffect(() => {
        if (pptResult) setEditablePptStructure(pptResult.structure);
    }, [pptResult]);

    const generatePptxFromStructure = async (structure: PresentationStructure, statusCallback: (status: string) => void) => {
        statusCallback('Processing slides...');
        const imagePrompts = structure.slides.filter(s => getNormalizedSlideType(s) === 'image' && s.imagePrompt).map(s => s.imagePrompt!);
        const generatedImages: { [prompt: string]: string } = {};

        if (imagePrompts.length > 0) {
            await Promise.all(imagePrompts.map((prompt, index) => {
                statusCallback(`Generating image ${index + 1}/${imagePrompts.length}: "${prompt.substring(0, 30)}..."`);
                return generateImage(prompt, '16:9').then(imageUrl => { generatedImages[prompt] = imageUrl; });
            }));
        }
        
        statusCallback('Assembling presentation...');
        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16X9';
        if (structure.title) pptx.title = structure.title;
        
        structure.slides.forEach(slideData => {
            let slide;
            const slideType = getNormalizedSlideType(slideData);
            switch (slideType) {
                case 'title':
                    slide = pptx.addSlide({ masterName: 'TITLE_SLIDE' });
                    slide.addText(slideData.title || '', { placeholder: 'title' });
                    if (slideData.subtitle) slide.addText(slideData.subtitle, { placeholder: 'body' });
                    break;
                case 'bullets':
                    slide = pptx.addSlide({ masterName: 'TITLE_AND_CONTENT' });
                    slide.addText(slideData.title || '', { placeholder: 'title' });
                    const bulletItems = (slideData.bulletPoints || []).filter(p => p.trim() !== '').map(p => ({ text: p }));
                    if (bulletItems.length > 0) slide.addText(bulletItems, { placeholder: 'body', bullet: true });
                    break;
                case 'content':
                    slide = pptx.addSlide({ masterName: 'TITLE_AND_CONTENT' });
                    slide.addText(slideData.title || '', { placeholder: 'title' });
                    if (slideData.content) slide.addText(slideData.content, { placeholder: 'body' });
                    break;
                case 'image':
                    slide = pptx.addSlide({ masterName: 'PICTURE_WITH_CAPTION' });
                    slide.addText(slideData.title || '', { placeholder: 'title' });
                    if (slideData.imagePrompt && generatedImages[slideData.imagePrompt]) {
                        slide.addImage({ data: generatedImages[slideData.imagePrompt], placeholder: 'picture' });
                    }
                    if (slideData.content) slide.addText(slideData.content, { placeholder: 'body' });
                    break;
                default:
                    // Default case for unsupported types
                    break;
            }
            if (slide && slideData.speakerNotes?.length) slide.addNotes(slideData.speakerNotes.join('\n\n'));
        });

        await pptx.writeFile({ fileName: `${structure.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'NiallGPT'}.pptx` });
        statusCallback('Done! Download should start.');
    };

    const handleGeneratePresentation = async () => {
        if (!pptDescription.trim()) { setPptError("Please enter a description."); return; }
        setIsPptLoading(true); setPptError(null); setPptResult(null); setEditablePptStructure(null); setDownloadedPpt(false);
        setPptGenerationStatus('Generating slide structure...');
        try {
            const response = await generatePresentationContent(pptDescription);
            setPptResult(response);
            await generatePptxFromStructure(response.structure, setPptGenerationStatus);
            setDownloadedPpt(true);
        } catch (e) {
            setPptError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setPptGenerationStatus('');
        } finally {
            setIsPptLoading(false);
        }
    };
    
    const handleUpdateAndDownloadPresentation = async () => {
        if (!editablePptStructure) return;
        setIsPptLoading(true); setPptError(null); setDownloadedPpt(false);
        try {
            await generatePptxFromStructure(editablePptStructure, setPptGenerationStatus);
            setDownloadedPpt(true);
        } catch (e) {
            setPptError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsPptLoading(false);
        }
    };
    
    const handleStructureChange = (index: number, field: keyof PptxSlide, value: string | PptxSlide['shape']) => {
        if (!editablePptStructure) return;
        const newSlides = [...editablePptStructure.slides];
        const newSlide = { ...newSlides[index] };
        if (field === 'bulletPoints' || field === 'speakerNotes') (newSlide[field] as string[]) = (value as string).split('\n');
        else (newSlide as any)[field] = value;
        if (field === 'bulletPoints') newSlide.content = undefined;
        newSlides[index] = newSlide;
        setEditablePptStructure({ ...editablePptStructure, slides: newSlides });
    };
    
    const handleAddSlide = (index: number) => {
        if (!editablePptStructure) return;
        const newSlide: PptxSlide = { type: 'content', title: 'New Slide', content: 'New slide content.' };
        const newSlides = [...editablePptStructure.slides];
        newSlides.splice(index + 1, 0, newSlide);
        setEditablePptStructure({ ...editablePptStructure, slides: newSlides });
    };
    
    const handleDeleteSlide = (index: number) => {
        if (!editablePptStructure || editablePptStructure.slides.length <= 1) return;
        const newSlides = editablePptStructure.slides.filter((_, i) => i !== index);
        setEditablePptStructure({ ...editablePptStructure, slides: newSlides });
    };
    
    const handleCopyPptCode = () => {
        if (pptResult?.pythonCode) {
            navigator.clipboard.writeText(pptResult.pythonCode);
            setIsPptCodeCopied(true);
            setTimeout(() => setIsPptCodeCopied(false), 2000);
        }
    };

    const renderEditableContentField = (slide: PptxSlide, index: number) => {
        const slideType = getNormalizedSlideType(slide);
        const commonStyle = { backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' };
        switch (slideType) {
            case 'title': return <input type="text" value={slide.subtitle || ''} onChange={e => handleStructureChange(index, 'subtitle', e.target.value)} className="w-full p-2 rounded-md themed-focus-ring" style={commonStyle}/>;
            case 'bullets': return <textarea value={(slide.bulletPoints || []).join('\n')} onChange={e => handleStructureChange(index, 'bulletPoints', e.target.value)} rows={4} className="w-full p-2 rounded-md themed-focus-ring" style={commonStyle}/>;
            case 'content': return <textarea value={slide.content || ''} onChange={e => handleStructureChange(index, 'content', e.target.value)} rows={4} className="w-full p-2 rounded-md themed-focus-ring" style={commonStyle}/>;
            case 'image': return <textarea value={slide.imagePrompt || ''} onChange={e => handleStructureChange(index, 'imagePrompt', e.target.value)} rows={3} className="w-full p-2 rounded-md themed-focus-ring" style={commonStyle}/>;
            default: return null;
        }
    }

    return (
        <div className="w-full h-full flex flex-col">
            <h2 className={`text-xl font-bold text-center mb-2 flex items-center justify-center`} style={{color: 'var(--image-gen-title)'}}>
                <ClipboardDocumentListIcon className="w-6 h-6 mr-3"/> Presentation Generator
            </h2>
            <p className="text-center text-sm mb-4" style={{color: 'var(--text-secondary)'}}>Describe your presentation topic, and the AI will generate the structure, content, and downloadable file.</p>
            <div className="max-w-4xl mx-auto w-full">
                <textarea 
                    value={pptDescription} 
                    onChange={(e) => setPptDescription(e.target.value)} 
                    placeholder="e.g., A 5-slide presentation on the benefits of renewable energy, including a title slide and a conclusion." 
                    rows={4} 
                    className="w-full p-3 rounded-md themed-focus-ring" 
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    disabled={isPptLoading} 
                />
                <button 
                    onClick={handleGeneratePresentation}
                    disabled={isPptLoading || !pptDescription.trim()}
                    className="w-full mt-4 p-3 rounded-lg flex items-center justify-center font-bold text-white bg-[var(--image-gen-button-bg)] hover:bg-[var(--image-gen-button-hover-bg)]"
                >
                    {isPptLoading ? <LoadingSpinner size="h-6 w-6"/> : "Generate Presentation"}
                </button>
                {isPptLoading && <p className="text-center mt-4 text-sm font-medium animate-pulse">{pptGenerationStatus}</p>}
                {pptError && <div className="mt-4 p-3 text-center text-sm rounded-md animate-shake bg-red-500/20 text-red-500">{pptError}</div>}
                
                {pptResult && !isPptLoading && (
                    <div className="mt-6 space-y-4 animate-fade-in">
                        {downloadedPpt && <div className="p-3 mb-4 rounded-md flex items-center justify-center text-sm bg-green-500/20 text-green-500"><CheckIcon className="w-5 h-5 mr-2"/> Download complete!</div>}
                        <details className="group details-animation rounded-lg bg-[var(--bg-input)]">
                            <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-[var(--icon-hover-bg)]"><span className="font-semibold">Edit & Refine Presentation</span><ChevronDownIcon className="w-5 h-5 transition-transform group-open:rotate-180"/></summary>
                            <div className="details-content-wrapper"><div className="p-4 border-t">
                                <div className="space-y-4">
                                    {editablePptStructure?.slides.map((slide, index) => (
                                        <div key={index} className="p-3 border rounded-md bg-[var(--bg-tertiary)]"><div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold">Slide {index + 1}</h4>
                                            <button onClick={() => handleDeleteSlide(index)} className="p-1 rounded-full text-red-500 hover:bg-[var(--icon-hover-bg)]"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                        <div className="space-y-2">
                                            <div><label className="text-xs font-medium">Title</label><input type="text" value={slide.title || ''} onChange={e => handleStructureChange(index, 'title', e.target.value)} className="w-full mt-1 p-2 rounded-md themed-focus-ring" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}/></div>
                                            {renderEditableContentField(slide, index)}
                                        </div>
                                        <button onClick={() => handleAddSlide(index)} className="mt-3 w-full flex justify-center items-center text-xs p-1.5 rounded-md hover:bg-[var(--icon-hover-bg)] border border-dashed"><PlusIcon className="w-4 h-4 mr-1"/> Add Slide Below</button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleUpdateAndDownloadPresentation} disabled={isPptLoading} className="w-full mt-4 p-3 rounded-lg flex items-center justify-center font-bold text-white bg-[var(--button-accent-bg)] hover:bg-[var(--button-accent-hover-bg)]">{isPptLoading ? <LoadingSpinner size="h-6 w-6"/> : "Update & Download"}</button>
                            </div></div>
                        </details>
                        <details className="group details-animation rounded-lg bg-[var(--bg-input)]">
                            <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-[var(--icon-hover-bg)]"><span className="font-semibold">View Generated Python Code</span><ChevronDownIcon className="w-5 h-5 transition-transform group-open:rotate-180"/></summary>
                            <div className="details-content-wrapper"><div className="p-2 pt-1">
                                <div className="mt-2 rounded-lg bg-[var(--code-block-bg)] border">
                                    <div className="flex justify-between items-center px-3 py-1.5 text-xs border-b"><span className="font-semibold">python_pptx_script.py</span><button onClick={handleCopyPptCode} className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-black/20">{isPptCodeCopied ? <CheckIcon className="w-4 h-4"/> : <ClipboardIcon className="w-4 h-4"/>}<span>{isPptCodeCopied ? 'Copied!' : 'Copy'}</span></button></div>
                                    <pre className="p-3 text-sm overflow-x-auto max-h-80"><code className="language-python">{pptResult.pythonCode}</code></pre>
                                </div>
                            </div></div>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
};