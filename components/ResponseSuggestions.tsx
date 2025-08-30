import React from 'react';

interface ResponseSuggestionsProps {
    suggestions: string[];
    onSuggestionClick: (text: string) => void;
}

export const ResponseSuggestions: React.FC<ResponseSuggestionsProps> = ({ suggestions, onSuggestionClick }) => {
    return (
        <div className="mt-4 flex flex-wrap gap-2 animate-fade-in-stagger" style={{ animationDelay: '200ms' }}>
            {suggestions.map((suggestion, index) => (
                <button
                    key={index}
                    onClick={() => onSuggestionClick(suggestion)}
                    className="suggestion-pill animate-subtle-pop-in"
                    style={{ animationDelay: `${index * 60}ms` }}
                >
                    {suggestion}
                </button>
            ))}
            <style>{`
                .suggestion-pill {
                    padding: 0.4rem 0.8rem;
                    border-radius: 9999px;
                    border: 1px solid var(--border-primary);
                    background-color: transparent;
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                    font-weight: 500;
                    transition: all 0.2s ease-in-out;
                    cursor: pointer;
                }
                .suggestion-pill:hover {
                    background-color: var(--icon-hover-bg);
                    border-color: var(--border-accent);
                    color: var(--text-accent);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px -2px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};
