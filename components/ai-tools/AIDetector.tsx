
import React, { useState } from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { CpuChipIcon } from '../icons/CpuChipIcon';
import { detectAIText } from '../../services/geminiService';
import { AIDetectionResponse } from '../../types';

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
    const radius = 50;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const scoreColor = score > 75 ? '#ef4444' : score > 40 ? '#f97316' : '#22c55e';

    return (
        <div className="relative w-32 h-32">
            <svg
                height="100%"
                width="100%"
                viewBox="0 0 100 100"
                className="-rotate-90"
            >
                <circle
                    stroke="var(--bg-tertiary)"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke={scoreColor}
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: scoreColor }}>
                    {Math.round(score)}%
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    AI Likelihood
                </span>
            </div>
        </div>
    );
};


export const AIDetector: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState<AIDetectionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!inputText.trim() || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const detectionResult = await detectAIText(inputText);
            setResult(detectionResult);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col">
            <h3 className="text-xl font-bold mb-2 flex items-center" style={{color: 'var(--text-accent)'}}>
                <CpuChipIcon className="w-6 h-6"/><span className="ml-2">AI Content Detector</span>
            </h3>
            <p className="text-sm mb-4" style={{color: 'var(--text-secondary)'}}>
                Analyze text to estimate the likelihood of it being AI-generated.
            </p>

            <textarea 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste text here to analyze for AI patterns..."
                rows={6}
                className="w-full p-3 rounded-md themed-focus-ring resize-y"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                disabled={isLoading}
            />

            <button 
                onClick={handleGenerate} 
                disabled={!inputText.trim() || isLoading}
                className="w-full mt-4 p-3 rounded-lg flex items-center justify-center font-bold text-white bg-[var(--image-gen-button-bg)] hover:bg-[var(--image-gen-button-hover-bg)]"
            >
                {isLoading ? <LoadingSpinner size="h-6 w-6"/> : "Analyze Text"}
            </button>
            
            {error && <div className="mt-4 p-3 text-center text-sm rounded-md animate-shake bg-red-500/20 text-red-500">{error}</div>}

            {isLoading && !result && (
                <div className="mt-4 p-4 text-center text-sm rounded-md bg-[var(--bg-input)] animate-pulse">
                    Analyzing linguistic patterns...
                </div>
            )}

            {result && !isLoading && (
                 <div className="mt-4 p-4 rounded-md animate-slide-in-bottom bg-[var(--bg-input)] flex flex-col sm:flex-row items-center gap-4">
                     <div className="flex-shrink-0">
                        <ScoreRing score={result.probability} />
                     </div>
                     <div className="text-center sm:text-left">
                         <h4 className="font-semibold text-md mb-1">Analysis</h4>
                         <p className="text-sm" style={{color: 'var(--text-primary)'}}>{result.analysis}</p>
                     </div>
                 </div>
            )}
        </div>
    );
};