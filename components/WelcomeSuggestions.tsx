

import React, { useContext } from 'react';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { ImageIcon } from './icons/ImageIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { GiftIcon } from './icons/GiftIcon';
import { PencilIcon } from './icons/PencilIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { EyeIcon } from './icons/EyeIcon';
import { NiallGPTLogo } from './icons/NiallGPTLogo';

interface WelcomeSuggestionsProps {
    onSuggestionClick: (text: string) => void;
}

export const WelcomeSuggestions: React.FC<WelcomeSuggestionsProps> = React.memo(({ onSuggestionClick }) => {
  const { layout } = useContext(AppSettingsContext);
  const isModern = layout === 'modern';

  const suggestions = [
    { text: '/imagine a futuristic city skyline at sunset', label: 'Imagine an image', icon: <ImageIcon className="w-5 h-5" /> },
    { text: 'Brainstorm three creative names for a new coffee shop.', label: 'Brainstorm', icon: <LightBulbIcon className="w-5 h-5" /> },
    { text: 'Write a Python function that sorts a list of numbers.', label: 'Code', icon: <CodeBracketIcon className="w-5 h-5" /> },
    { text: 'Make a 5-step plan to learn a new language.', label: 'Make a plan', icon: <ListBulletIcon className="w-5 h-5" /> },
    { text: 'Analyze this data for trends and give me a summary: ', label: 'Analyze data', icon: <ChartBarIcon className="w-5 h-5" /> },
    { text: 'Surprise me with an interesting fact about the ocean.', label: 'Surprise me', icon: <GiftIcon className="w-5 h-5" /> },
    { text: 'Help me write a professional email to my boss asking for a promotion.', label: 'Help me write', icon: <PencilIcon className="w-5 h-5" /> },
    { text: 'Get advice on a career in software engineering.', label: 'Get advice', icon: <AcademicCapIcon className="w-5 h-5" /> },
    { text: 'Can you analyze this image for me?', label: 'Analyze images', icon: <EyeIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fade-in">
        <NiallGPTLogo className="w-24 h-24 mb-4" style={{ color: 'var(--text-accent)' }} />
        <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>NiallGPT</h1>
        <h2 className="text-lg font-normal mb-8" style={{ color: 'var(--text-secondary)' }}>
            What can I help you with today?
        </h2>
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
             {suggestions.slice(0, 5).map((suggestion, index) => (
                <button 
                  key={suggestion.label} 
                  onClick={() => onSuggestionClick(suggestion.text)} 
                  className={isModern ? 'sapphire-suggestion-button' : 'suggestion-button animate-bounce-in'}
                  style={{animationDelay: `${100 + index * 50}ms`}}
                >
                    {suggestion.icon} <span>{suggestion.label}</span>
                </button>
            ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mt-3">
            {suggestions.slice(5).map((suggestion, index) => (
                <button 
                  key={suggestion.label} 
                  onClick={() => onSuggestionClick(suggestion.text)} 
                  className={isModern ? 'sapphire-suggestion-button' : 'suggestion-button animate-bounce-in'}
                  style={{animationDelay: `${100 + (index + 5) * 50}ms`}}
                >
                    {suggestion.icon} <span>{suggestion.label}</span>
                </button>
            ))}
        </div>
        <style>{`
            .suggestion-button {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.6rem 0.8rem;
                border-radius: 9999px;
                border: 1px solid var(--border-primary);
                background-color: transparent;
                color: var(--text-primary);
                font-size: 0.875rem;
                transition: background-color 0.2s, border-color 0.2s, transform 0.1s, box-shadow 0.2s;
            }
            .suggestion-button:hover {
                background-color: var(--bg-secondary);
                border-color: var(--border-accent);
                transform: translateY(-2px);
                box-shadow: 0 0 10px -2px var(--border-accent);
            }
            .suggestion-button svg, .sapphire-suggestion-button svg {
                color: var(--text-secondary);
                width: 1.1rem;
                height: 1.1rem;
            }
        `}</style>
    </div>
  );
});