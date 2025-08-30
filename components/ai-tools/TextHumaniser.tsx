
import React, { useState } from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { UserGroupIcon } from '../icons/UserGroupIcon';
import { humaniseText } from '../../services/geminiService';

type Tone = 'Default' | 'Casual' | 'Formal' | 'Creative';

export const TextHumaniser: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [activeTone, setActiveTone] = useState<Tone>('Default');

    const tones: Tone[] = ['Default', 'Casual', 'Formal', 'Creative'];

    const handleGenerate = async () => {
        if (!inputText.trim() || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResult('');
        try {
            const humanisedText = await humaniseText(inputText, activeTone);
            setResult(humanisedText);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
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

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-xl font-bold mb-2 flex items-center" style={{color: 'var(--text-accent)'}}>
                <UserGroupIcon className="w-6 h-6"/><span className="ml-2">Text Humaniser</span>
            </h3>
            <p className="text-sm mb-4" style={{color: 'var(--text-secondary)'}}>
                Refine AI-generated text to sound more natural and engaging.
            </p>

            <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your AI-generated text here..."
                rows={6}
                className="w-full p-3 rounded-md themed-focus-ring resize-y"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                disabled={isLoading}
            />

            <div className="my-4">
                <label className="text-sm font-medium mr-3" style={{color: 'var(--text-secondary)'}}>Tone:</label>
                <div className="inline-flex rounded-md shadow-sm" role="group">
                    {tones.map((tone, index) => (
                        <button
                            key={tone}
                            onClick={() => setActiveTone(tone)}
                            disabled={isLoading}
                            className={`px-4 py-2 text-xs font-medium transition-all ${index === 0 ? 'rounded-l-lg' : ''} ${index === tones.length - 1 ? 'rounded-r-lg' : ''} border-y border-x hover:scale-105`}
                            style={{
                                backgroundColor: activeTone === tone ? 'var(--image-gen-button-bg)' : 'var(--bg-tertiary)',
                                color: activeTone === tone ? 'var(--button-accent-text)' : 'var(--text-primary)',
                                borderColor: 'var(--border-primary)'
                            }}
                        >
                            {tone}
                        </button>
                    ))}
                </div>
            </div>

            <button 
                onClick={handleGenerate} 
                disabled={!inputText.trim() || isLoading}
                className="w-full p-3 rounded-lg flex items-center justify-center font-bold text-white bg-[var(--image-gen-button-bg)] hover:bg-[var(--image-gen-button-hover-bg)]"
            >
                {isLoading ? <LoadingSpinner size="h-6 w-6"/> : "Humanise Text"}
            </button>
            
            {error && <div className="mt-4 p-3 text-center text-sm rounded-md animate-shake bg-red-500/20 text-red-500">{error}</div>}

            {result && !isLoading && (
                 <div className="mt-4 p-3 rounded-md animate-slide-in-bottom bg-[var(--bg-input)]">
                     <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-md">Result:</h4>
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