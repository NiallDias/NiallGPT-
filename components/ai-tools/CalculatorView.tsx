

import React, { useState } from 'react';
import { solveMathProblem, solveMathProblemFromImage } from '../../services/geminiService';
import { LoadingSpinner } from '../LoadingSpinner';
import { CalculatorIcon } from '../icons/CalculatorIcon';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { SendIcon } from '../icons/SendIcon';
import { ChatMessageContent } from '../ChatMessageContent';
import { TypingIndicator } from '../TypingIndicator';
import { PaperclipIcon } from '../icons/PaperclipIcon';
import { XCircleIcon } from '../icons/XCircleIcon';

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

const mathSymbols = ['√', 'π', '²', '³', '^', '(', ')', '%', '×', '÷', '+', '-'];

export const CalculatorView: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<{ explanation: string; finalAnswer: string | null } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isFileReading, setIsFileReading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please select a valid image file.'); return; }
        if (file.size > 4 * 1024 * 1024) { setError("File is too large (max 4MB)."); return; }
        
        setError(null);
        setResult(null);
        setSelectedFile(file);
        setIsFileReading(true);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setIsFileReading(false);
        };
        reader.onerror = () => { setError('Failed to read the file.'); setIsFileReading(false); };
        reader.readAsDataURL(file);
    };
    
    const clearImage = () => {
        setImagePreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSolve = async () => {
        if ((!query.trim() && !selectedFile) || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            let responseText = '';
            if (selectedFile && imagePreview) {
                const base64Data = imagePreview.split(',')[1];
                responseText = await solveMathProblemFromImage(base64Data, selectedFile.type, query);
            } else {
                responseText = await solveMathProblem(query);
            }
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

    const handleSymbolClick = (symbol: string) => {
        setQuery(prev => prev + symbol);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-4">
            <div className="w-full max-w-2xl flex flex-col">
                <header className="text-center mb-6 animate-fade-in-stagger">
                    <h1 className="text-3xl font-bold flex items-center justify-center" style={{ color: 'var(--text-primary)' }}>
                        <CalculatorIcon className="w-8 h-8 mr-3 text-[var(--text-accent)]"/>
                        NiallGPT Calculator
                    </h1>
                    <p className="text-md mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Your AI-powered assistant for solving mathematical problems.
                    </p>
                </header>

                <div className="sapphire-card flex-grow flex flex-col p-4 min-h-[28rem] animate-fade-in-stagger" style={{animationDelay: '100ms'}}>
                    <div className="flex-grow rounded-lg p-4 mb-4 overflow-y-auto" style={{backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-primary)'}}>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
                                <TypingIndicator />
                                <p className="mt-1 text-sm font-sans" style={{color: 'var(--text-secondary)'}}>NiallGPT is thinking...</p>
                            </div>
                        ) : result ? (
                            <div className="animate-fade-in">
                                <div className="flex justify-end mb-2">
                                    <button onClick={handleCopy} className="flex items-center text-xs px-2 py-1 rounded-md" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--icon-hover-bg)' }}>
                                        {isCopied ? <CheckIcon className="w-4 h-4 mr-1" /> : <ClipboardIcon className="w-4 h-4 mr-1" />}
                                        {isCopied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <div className="text-sm font-sans" style={{color: 'var(--text-primary)'}}>
                                   <ChatMessageContent
                                        text={result.explanation}
                                        messageId="calculator-result"
                                        isLoading={false}
                                        currentAiMessageId={null}
                                        onCodeChange={()=>{}}
                                        onPreview={()=>{}}
                                        onCopyCode={async ()=>{}}
                                        copiedCodeKey={null}
                                    />
                                </div>
                                {result.finalAnswer && (
                                     <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                        <p className="text-xl font-bold font-mono" style={{ color: 'var(--text-accent)' }}>
                                            = {result.finalAnswer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center text-lg font-sans" style={{color: 'var(--text-secondary)'}}>
                                {error ? <span className="text-red-500 text-sm">{error}</span> : "The solution will appear here."}
                            </div>
                        )}
                    </div>
                     {imagePreview && (
                        <div className="relative mb-4 animate-fade-in self-center">
                            <img src={imagePreview} alt="Math problem preview" className="max-w-full max-h-48 object-contain rounded-md" />
                            <button onClick={clearImage} disabled={isLoading} className="absolute top-1 right-1 p-0.5 rounded-full" style={{backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)'}}><XCircleIcon className="w-6 h-6" /></button>
                        </div>
                    )}

                    <div className="mb-4 flex flex-wrap justify-center gap-2">
                        {mathSymbols.map(symbol => (
                            <button
                                key={symbol}
                                onClick={() => handleSymbolClick(symbol)}
                                onMouseDown={(e) => e.preventDefault()}
                                className="w-10 h-10 flex items-center justify-center text-lg font-mono rounded-full transition-colors"
                                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                aria-label={`Insert symbol ${symbol}`}
                                disabled={isLoading}
                            >
                                {symbol}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center space-x-2">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || isFileReading} className="p-3 rounded-full hover:bg-[var(--icon-hover-bg)] text-[var(--text-secondary)]"><PaperclipIcon className="w-6 h-6"/></button>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleSolve(); }}
                            placeholder={selectedFile ? "Add context for the image..." : "e.g., (5 * 8) + sqrt(144) or 'what is 25% of 300?'"}
                            className="flex-grow p-3 rounded-full bg-[var(--bg-input)] border border-[var(--border-primary)] themed-focus-ring text-sm"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSolve}
                            disabled={(!query.trim() && !selectedFile) || isLoading}
                            className="p-3 rounded-full text-white flex-shrink-0"
                            style={{ background: 'var(--button-accent-bg)' }}
                            aria-label="Solve problem"
                        >
                           {isLoading ? <LoadingSpinner size="h-6 h-6" /> : <SendIcon className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};