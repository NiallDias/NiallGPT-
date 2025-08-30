import React, { useState, useEffect, useCallback, useRef } from 'react';
import { translateText } from '../../services/geminiService';
import { SUPPORTED_LANGUAGES } from '../../constants';
import { LoadingSpinner } from '../LoadingSpinner';
import { LanguageIcon } from '../icons/LanguageIcon';
import { ArrowPathIcon } from '../icons/ArrowPathIcon';
import { ClipboardIcon } from '../icons/ClipboardIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { SpeakerWaveIcon } from '../icons/SpeakerIcon';
import { StopCircleIcon } from '../icons/StopCircleIcon';

export const TranslatorView: React.FC = () => {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('es'); // Default to Spanish
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sourceCopied, setSourceCopied] = useState(false);
    const [targetCopied, setTargetCopied] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [speakingLang, setSpeakingLang] = useState<'source' | 'target' | null>(null);
    const translationRequestRef = useRef(0);

    const MAX_CHARS = 5000;

    useEffect(() => {
        setCharCount(sourceText.length);
    }, [sourceText]);

    const handleTranslate = useCallback(async (currentSourceText: string) => {
        if (!currentSourceText.trim()) return;
        if (sourceLang === targetLang && sourceLang !== 'auto') {
            setTranslatedText(currentSourceText);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const requestId = ++translationRequestRef.current;

        try {
            const result = await translateText(currentSourceText, sourceLang, targetLang);
            if (requestId === translationRequestRef.current) {
                setTranslatedText(result);
            }
        } catch (e) {
            if (requestId === translationRequestRef.current) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred during translation.');
                setTranslatedText('');
            }
        } finally {
            if (requestId === translationRequestRef.current) {
                setIsLoading(false);
            }
        }
    }, [sourceLang, targetLang]);
    
    useEffect(() => {
        const trimmedSource = sourceText.trim();
        if (!trimmedSource) {
            setTranslatedText('');
            setError(null);
            setIsLoading(false);
            translationRequestRef.current++; // Invalidate any ongoing requests
            return;
        }

        const debounceTimer = setTimeout(() => {
            handleTranslate(sourceText);
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [sourceText, sourceLang, targetLang, handleTranslate]);
    
    useEffect(() => {
        return () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        }
    }, []);

    const handleSpeak = (text: string, langCode: string, type: 'source' | 'target') => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        if (speakingLang === type) {
            setSpeakingLang(null);
            return;
        }

        if (!text) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        const langMap: { [key: string]: string } = {
            'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
            'ja': 'ja-JP', 'ko': 'ko-KR', 'ru': 'ru-RU', 'zh': 'zh-CN', 'pt': 'pt-BR',
            'hi': 'hi-IN', 'ar': 'ar-SA', 'bn': 'bn-IN', 'nl': 'nl-NL', 'pl': 'pl-PL',
            'te': 'te-IN', 'tr': 'tr-TR', 'uk': 'uk-UA', 'vi': 'vi-VN', 'id': 'id-ID',
            'mr': 'mr-IN', 'ta': 'ta-IN'
        };
        
        utterance.lang = langMap[langCode] || langCode;

        utterance.onend = () => setSpeakingLang(null);
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            setError('Could not play audio. Your browser may not support this language.');
            setSpeakingLang(null);
        };
        
        window.speechSynthesis.speak(utterance);
        setSpeakingLang(type);
    };

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') return;
        setSourceLang(targetLang);
        setTargetLang(sourceLang);
        setSourceText(translatedText);
        setTranslatedText(sourceText);
    };

    const handleCopy = (text: string, type: 'source' | 'target') => {
        navigator.clipboard.writeText(text).then(() => {
            if (type === 'source') {
                setSourceCopied(true);
                setTimeout(() => setSourceCopied(false), 2000);
            } else {
                setTargetCopied(true);
                setTimeout(() => setTargetCopied(false), 2000);
            }
        });
    };

    const handleClearSource = () => {
        setSourceText('');
        setTranslatedText('');
        setError(null);
    };
    
    const LanguageSelector: React.FC<{
        value: string;
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
        options: { code: string; name: string }[];
        id: string;
    }> = ({ value, onChange, options, id }) => (
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="p-2 w-full rounded-md bg-[var(--bg-input)] border border-[var(--border-primary)] themed-focus-ring text-sm"
        >
            {options.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
        </select>
    );

    return (
        <div className="w-full h-full flex flex-col items-center">
            <header className="text-center mb-6 animate-fade-in-stagger">
                <h1 className="text-3xl font-bold flex items-center justify-center" style={{ color: 'var(--text-primary)' }}>
                    <LanguageIcon className="w-8 h-8 mr-3 text-[var(--text-accent)]"/>
                    NiallGPT Translator
                </h1>
                <p className="text-md mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Translate text between languages with AI.
                </p>
            </header>

            <div className="w-full max-w-4xl flex flex-col md:flex-row gap-4 items-center mb-4 animate-fade-in-stagger" style={{animationDelay: '100ms'}}>
                <div className="w-full md:w-5/12">
                    <LanguageSelector 
                        id="source-lang"
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        options={SUPPORTED_LANGUAGES}
                    />
                </div>
                <button
                    onClick={handleSwapLanguages}
                    disabled={sourceLang === 'auto'}
                    className="p-2 rounded-full transition-transform duration-300 hover:rotate-180 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{backgroundColor: 'var(--bg-tertiary)'}}
                    title="Swap languages"
                >
                    <ArrowPathIcon className="w-5 h-5" style={{color: 'var(--text-accent)'}} />
                </button>
                <div className="w-full md:w-5/12">
                    <LanguageSelector 
                        id="target-lang"
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        options={SUPPORTED_LANGUAGES.filter(l => l.code !== 'auto')}
                    />
                </div>
            </div>

            <div className="w-full max-w-4xl flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-stagger" style={{animationDelay: '200ms'}}>
                {/* Source Text Area */}
                <div className="sapphire-card p-4 flex flex-col">
                    <textarea 
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value.slice(0, MAX_CHARS))}
                        placeholder="Enter text..."
                        className="w-full flex-grow bg-transparent resize-none focus:outline-none text-base"
                    />
                    <div className="flex justify-between items-center pt-2 border-t" style={{borderColor: 'var(--border-primary)'}}>
                        <div className="flex items-center space-x-2">
                             <button onClick={() => handleSpeak(sourceText, sourceLang, 'source')} disabled={!sourceText || sourceLang === 'auto'} title="Read aloud" className="p-1 rounded-full hover:bg-[var(--icon-hover-bg)] disabled:opacity-50">
                                {speakingLang === 'source' ? <StopCircleIcon className="w-5 h-5 text-[var(--text-accent)]"/> : <SpeakerWaveIcon className="w-5 h-5 text-[var(--text-secondary)]"/>}
                            </button>
                            <button onClick={() => handleCopy(sourceText, 'source')} disabled={!sourceText} title={sourceCopied ? 'Copied!' : 'Copy'} className="p-1 rounded-full hover:bg-[var(--icon-hover-bg)] disabled:opacity-50">
                                {sourceCopied ? <CheckIcon className="w-5 h-5 text-green-500"/> : <ClipboardIcon className="w-5 h-5 text-[var(--text-secondary)]"/>}
                            </button>
                            {sourceText && <button onClick={handleClearSource} title="Clear text" className="p-1 rounded-full hover:bg-[var(--icon-hover-bg)]"><XCircleIcon className="w-5 h-5 text-[var(--text-secondary)]"/></button>}
                        </div>
                        <span className={`text-xs ${charCount > MAX_CHARS ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>{charCount} / {MAX_CHARS}</span>
                    </div>
                </div>

                {/* Target Text Area */}
                <div className="sapphire-card p-4 flex flex-col relative">
                    <div className="w-full flex-grow bg-transparent resize-none text-base whitespace-pre-wrap overflow-y-auto">
                        {isLoading && (
                            <div className="absolute top-2 right-2">
                                <LoadingSpinner size="h-5 w-5"/>
                            </div>
                        )}
                        {!isLoading && !translatedText && <span className="text-[var(--text-secondary)]">Translation will appear here.</span>}
                        {translatedText && <span className={isLoading ? 'opacity-60' : ''}>{translatedText}</span>}
                    </div>
                    {translatedText && (
                        <div className="flex justify-start items-center pt-2 border-t" style={{borderColor: 'var(--border-primary)'}}>
                             <button onClick={() => handleSpeak(translatedText, targetLang, 'target')} disabled={!translatedText} title="Read aloud" className="p-1 rounded-full hover:bg-[var(--icon-hover-bg)] disabled:opacity-50">
                                {speakingLang === 'target' ? <StopCircleIcon className="w-5 h-5 text-[var(--text-accent)]"/> : <SpeakerWaveIcon className="w-5 h-5 text-[var(--text-secondary)]"/>}
                            </button>
                            <button onClick={() => handleCopy(translatedText, 'target')} disabled={!translatedText} title={targetCopied ? 'Copied!' : 'Copy'} className="p-1 rounded-full hover:bg-[var(--icon-hover-bg)]">
                                {targetCopied ? <CheckIcon className="w-5 h-5 text-green-500"/> : <ClipboardIcon className="w-5 h-5 text-[var(--text-secondary)]"/>}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {error && <p className="mt-4 text-center text-sm text-red-500 animate-shake">{error}</p>}
        </div>
    );
};