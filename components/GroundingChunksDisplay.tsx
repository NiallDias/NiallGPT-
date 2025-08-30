import React from 'react';
import { GroundingChunk } from '../types';

interface GroundingChunksDisplayProps {
    chunks?: GroundingChunk[];
}

export const GroundingChunksDisplay: React.FC<GroundingChunksDisplayProps> = React.memo(({ chunks }) => {
    if (!chunks || chunks.length === 0) return null;
    const webChunks = chunks.filter(chunk => chunk.web && chunk.web.uri && chunk.web.title);
    if (webChunks.length === 0) return null;

    return (
      <div className="mt-2 text-xs animate-slide-in-bottom" style={{color: 'var(--text-secondary)', animationDelay: '50ms'}}>
        <p className="font-semibold mb-1">Sources:</p>
        <ul className="list-disc list-inside space-y-1">
          {webChunks.map((chunk, index) => (
            <li key={index}>
              <a 
                href={chunk.web!.uri} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="themed-link" 
                title={chunk.web!.uri}
                aria-label={`Read more about ${chunk.web!.title || 'source'} at ${chunk.web!.uri}`}
              >
                {chunk.web!.title || chunk.web!.uri}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
});