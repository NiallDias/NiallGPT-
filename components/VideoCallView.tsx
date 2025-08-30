import React from 'react';
import { AppView, ChatMessage, Sender } from '../types';
import { useVideoCall } from '../hooks/useVideoCall';
import { AIVisualizer } from './AIVisualizer';
import { PhoneXMarkIcon } from './icons/PhoneXMarkIcon';
import { LoadingSpinner } from './LoadingSpinner';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { VideoCameraSlashIcon } from './icons/VideoCameraSlashIcon';

interface VideoCallViewProps {
  onSetView: (view: AppView) => void;
}

const TranscriptLine: React.FC<{ message: ChatMessage }> = ({ message }) => (
    <p
      className={`text-lg text-center font-medium p-2 rounded-lg mb-2 animate-subtle-pop-in ${message.sender === Sender.User ? 'self-end' : 'self-start'}`}
      style={{
          color: 'var(--text-primary)',
          backgroundColor: 'rgba(var(--bg-secondary-rgb, 243, 244, 246), 0.7)',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          maxWidth: '80%',
      }}
    >
      <span className="font-bold">{message.sender === Sender.User ? 'You' : 'AI'}: </span>
      {message.text}
    </p>
);


export const VideoCallView: React.FC<VideoCallViewProps> = ({ onSetView }) => {
  const {
    status,
    error,
    transcript,
    videoRef,
    endCall,
    currentUserInput,
    isCameraOn,
    toggleCamera,
    isSpeaking,
    isListening,
    isThinking,
  } = useVideoCall(() => onSetView(AppView.Chat));

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center transition-colors duration-300 z-[100] animate-fade-in" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* AI Visualizer in the background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AIVisualizer isSpeaking={isSpeaking} isListening={isListening} isThinking={isThinking} />
      </div>

      {/* User's Video Feed */}
      <div className="absolute bottom-6 right-6 w-32 h-32 sm:w-48 sm:h-48 rounded-full object-cover shadow-2xl border-4 border-[var(--bg-secondary)] z-20 overflow-hidden bg-[var(--bg-tertiary)] flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
        />
        {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
                <VideoCameraSlashIcon className="w-1/2 h-1/2 text-[var(--text-secondary)]" />
            </div>
        )}
      </div>


      {/* Transcript Overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl h-48 p-4 z-10 overflow-hidden">
        <div className="h-full w-full relative">
          <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end">
            {transcript.slice(-3).map((msg) => (
              <TranscriptLine key={msg.id} message={msg} />
            ))}
            {currentUserInput && (
                 <p className="text-lg text-center font-medium p-2 rounded-lg opacity-70"
                    style={{
                        color: 'var(--text-primary)',
                        backgroundColor: 'rgba(var(--bg-secondary-rgb, 243, 244, 246), 0.5)',
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                    }}
                 >
                    <span className="font-bold">You: </span>
                    <em>{currentUserInput}</em>
                </p>
            )}
          </div>
           <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-t from-transparent to-[var(--bg-primary)] pointer-events-none rotate-180 bottom-0 top-auto"></div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-4">
        <button
          onClick={toggleCamera}
          className="w-16 h-16 rounded-full bg-gray-600/80 text-white flex items-center justify-center shadow-lg hover:bg-gray-700/80 transition-all hover:scale-110"
          style={{backdropFilter: 'blur(4px)'}}
          aria-label={isCameraOn ? "Turn off camera" : "Turn on camera"}
        >
          {isCameraOn ? <VideoCameraIcon className="w-8 h-8" /> : <VideoCameraSlashIcon className="w-8 h-8" />}
        </button>
        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 transition-all hover:scale-110"
          aria-label="End Call"
        >
          <PhoneXMarkIcon className="w-8 h-8" />
        </button>
      </div>

      {/* Error/Loading State */}
      {status === 'ERROR' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 p-3 rounded-lg text-sm bg-red-500/80 text-white shadow-lg">
          Error: {error}
        </div>
      )}
      {status === 'CONNECTING' && (
         <div className="absolute top-6 left-1/2 -translate-x-1/2 p-3 rounded-lg text-sm flex items-center space-x-2" style={{backgroundColor: 'var(--bg-tertiary)'}}>
          <LoadingSpinner size="h-5 w-5" />
          <span>Connecting...</span>
        </div>
      )}
    </div>
  );
};