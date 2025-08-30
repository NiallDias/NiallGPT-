import React, { useState } from 'react';
import { solveMathProblem } from '../../services/geminiService';
import { LoadingSpinner } from '../LoadingSpinner';
import { CalculatorIcon } from '../icons/CalculatorIcon';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { CheckIcon } from '../icons/CheckIcon';

const parseResult = (text: string) => {
    const finalAnswerRegex = /Final Answer:\s*(.*)/i;
    const match = text.match(finalAnswerRegex);
    if (match) {
        return {
            explanation: text.substring(0, match.index).trim(),
            finalAnswer: match[1].trim()
        };
    }
    return { explanation: text, finalAnswer: null };
};

export const NiallGptCalculator: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<{ explanation: string; finalAnswer: string | null } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    const handleSolve = async () => {
        if (!query.trim() || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const responseText = await solveMathProblem(query);
            setResult(parseResult(responseText));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (result) {
            const textToCopy = result.finalAnswer ? `${result.explanation}\n\nFinal Answer: ${result.finalAnswer}` : result.explanation;
            navigator.clipboard.writeText(textToCopy).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-xl font-bold mb-2 flex items-center" style={{ color: 'var(--text-accent)' }}>
                <CalculatorIcon className="w-6 h-6" />
                <span className="ml-2">NiallGPT Calculator</span>
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Solve complex math problems using natural language.
            </p>

            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') handleSolve(); }}
                    placeholder="e.g., (5 * 8) + sqrt(144)"
                    className="flex-grow p-3 rounded-md themed-focus-ring text-base"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSolve}
                    disabled={!query.trim() || isLoading}
                    className="p-3 rounded-lg font-bold text-white bg-[var(--image-gen-button-bg)] hover:bg-[var(--image-gen-button-hover-bg)] disabled:bg-[var(--button-accent-disabled-bg)] disabled:text-[var(--text-secondary)]"
                >
                    {isLoading ? <LoadingSpinner size="h-6 w-6" /> : "Solve"}
                </button>
            </div>
            
            {error && <div className="mt-4 p-3 text-center text-sm rounded-md animate-shake bg-red-500/20 text-red-500">{error}</div>}

            {result && !isLoading && (
                <div className="mt-4 p-3 rounded-md animate-slide-in-bottom flex-grow flex flex-col" style={{ backgroundColor: 'var(--bg-input)' }}>
                    <div className="flex justify-end mb-2">
                        <button onClick={handleCopy} className="flex items-center text-xs px-2 py-1 rounded-md" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--icon-hover-bg)' }}>
                            {isCopied ? <CheckIcon className="w-4 h-4 mr-1" /> : <ClipboardIcon className="w-4 h-4 mr-1" />}
                            {isCopied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                    <div className="text-sm whitespace-pre-wrap max-h-48 overflow-y-auto" style={{ color: 'var(--text-primary)' }}>
                        {result.explanation}
                    </div>
                    {result.finalAnswer && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                            <p className="text-md font-bold" style={{ color: 'var(--text-accent)' }}>
                                Final Answer: <span className="p-2 rounded-md" style={{backgroundColor: 'var(--bg-tertiary)'}}>{result.finalAnswer}</span>
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};