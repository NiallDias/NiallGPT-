

import React from 'react';

export const TypingIndicator: React.FC = React.memo(() => (
    <div className="flex items-center space-x-1.5 p-2" aria-label="NiallGPT is typing">
        <span className="typing-dot" style={{ animationDelay: '0s' }}></span>
        <span className="typing-dot" style={{ animationDelay: '0.2s' }}></span>
        <span className="typing-dot" style={{ animationDelay: '0.4s' }}></span>
        <style>{`
            .typing-dot {
                display: inline-block;
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background-color: var(--text-accent);
                animation: typing-dots 1.4s infinite ease-in-out both;
            }
        `}</style>
    </div>
));