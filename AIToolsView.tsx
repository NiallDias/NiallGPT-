import React, { useContext } from 'react';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { AppView } from '../types';
import { LatestHeadlines } from './ai-tools/LatestHeadlines';
import { PresentationGenerator } from './ai-tools/PresentationGenerator';
import { ImageDescriber } from './ai-tools/ImageDescriber';
import { PromptGenerator } from './ai-tools/PromptGenerator';
import { ImageInpainter } from './ai-tools/ImageInpainter';
import { ImageModifier } from './ai-tools/ImageModifier';

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


export const AIToolsView: React.FC<AIToolsViewProps> = ({ onSetView }) => {
    const { setRedirectedPrompt } = useContext(AppSettingsContext);

    return (
        <div className="w-full h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                
                <ToolCard animationDelay="100ms" className="lg:col-span-2 xl:col-span-1">
                    <LatestHeadlines />
                </ToolCard>

                <ToolCard animationDelay="200ms" className="lg:col-span-2">
                    <PresentationGenerator />
                </ToolCard>
                
                <ToolCard animationDelay="300ms">
                    <ImageDescriber />
                </ToolCard>
                
                <ToolCard animationDelay="400ms">
                    <PromptGenerator 
                        onSetView={onSetView} 
                        setRedirectedPrompt={setRedirectedPrompt} 
                    />
                </ToolCard>
                
                <ToolCard animationDelay="500ms">
                    <ImageModifier />
                </ToolCard>
                
                <ToolCard animationDelay="600ms" className="lg:col-span-2 xl:col-span-3">
                    <ImageInpainter />
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