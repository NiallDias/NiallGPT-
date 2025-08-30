
import React, { useContext } from 'react';
import { AppSettingsContext } from '../../contexts/AppSettingsContext';
import { AppView } from '../../types';
import { PresentationGenerator } from './ai-tools/PresentationGenerator';
import { ImageDescriber } from './ai-tools/ImageDescriber';
import { PromptGenerator } from './ai-tools/PromptGenerator';
import { ManualImageFilter } from './ai-tools/ImageInpainter';
import { TextHumaniser } from './ai-tools/TextHumaniser';
import { AIDetector } from './ai-tools/AIDetector';
import { PaintBrushIcon } from './icons/PaintBrushIcon';

interface AIToolsViewProps {
  onSetView: (view: AppView) => void;
}

const ToolCard: React.FC<{ children: React.ReactNode, animationDelay?: string, className?: string }> = ({ children, animationDelay = '0s', className = '' }) => (
    <div 
        className={`sapphire-card h-full animate-fade-in-stagger p-4 sm:p-6 ${className}`}
        style={{ animationDelay }}
    >
        {children}
    </div>
);

const AIPhotoEditorToolCard: React.FC<{ onSetView: (view: AppView) => void }> = ({ onSetView }) => (
    <div
      className="sapphire-card group h-full relative overflow-hidden cursor-pointer p-6 flex flex-col justify-between"
      onClick={() => onSetView(AppView.AIPhotoEditor)}
    >
      <div className="relative z-10">
        <PaintBrushIcon className="w-10 h-10 text-[var(--text-accent)] mb-4" />
        <h3 className="text-xl font-bold text-[var(--text-primary)]">AI Photo Editor</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Advanced photo editing with AI. Perform localized retouching, apply creative filters, and make professional adjustments using simple text prompts.
        </p>
      </div>
      <p className="text-sm font-semibold text-[var(--text-accent)] mt-4 z-10 relative group-hover:underline">
        Launch Editor &rarr;
      </p>
    </div>
  );

export const AIToolsView: React.FC<AIToolsViewProps> = ({ onSetView }) => {
    const { setRedirectedPrompt } = useContext(AppSettingsContext);

    return (
        <div className="w-full h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 xl:col-span-3 animate-fade-in-stagger" style={{ animationDelay: '50ms' }}>
                    <AIPhotoEditorToolCard onSetView={onSetView} />
                </div>
                
                <ToolCard animationDelay="100ms" className="lg:col-span-2">
                    <PresentationGenerator />
                </ToolCard>

                <ToolCard animationDelay="200ms">
                    <TextHumaniser />
                </ToolCard>

                <ToolCard animationDelay="300ms">
                    <AIDetector />
                </ToolCard>
                
                <ToolCard animationDelay="400ms">
                    <ImageDescriber />
                </ToolCard>
                
                <ToolCard animationDelay="500ms">
                    <PromptGenerator 
                        onSetView={onSetView} 
                        setRedirectedPrompt={setRedirectedPrompt} 
                    />
                </ToolCard>
                
                <ToolCard animationDelay="600ms" className="lg:col-span-2 xl:col-span-3">
                    <ManualImageFilter />
                </ToolCard>
                
            </div>
             <style>{`
                .themed-focus-ring {
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .themed-focus-ring:focus {
                    outline: none;
                    border-color: var(--border-accent);
                    box-shadow: 0 0 0 3px var(--focus-ring-color);
                }
            `}</style>
        </div>
    );
};
