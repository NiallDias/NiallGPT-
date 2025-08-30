import React from 'react';
import { NiallGPTLogo } from './icons/NiallGPTLogo';

interface AIVisualizerProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
}

export const AIVisualizer: React.FC<AIVisualizerProps> = ({ isSpeaking, isListening, isThinking }) => {
  const status = isSpeaking ? "Speaking" : isListening ? "Listening..." : isThinking ? "Thinking..." : "Connecting...";

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
        {/* Pulsating glows */}
        <div className={`ai-visualizer-glow one ${isSpeaking ? 'speaking' : ''}`}></div>
        <div className={`ai-visualizer-glow two ${isSpeaking ? 'speaking' : ''}`}></div>
        <div className={`ai-visualizer-glow three ${isSpeaking ? 'speaking' : ''}`}></div>

        <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 p-4 bg-[var(--bg-secondary)] rounded-full shadow-lg">
          <NiallGPTLogo />
        </div>
      </div>
      <p className="mt-6 text-lg font-medium text-center" style={{ color: 'var(--text-primary)' }}>
        {status}
      </p>
    </div>
  );
};
