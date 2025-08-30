import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { ChatMessage, Sender } from '../types';
import { streamChatMessage } from '../services/geminiService';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { Part } from '@google/genai';

type CallStatus = 'CONNECTING' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR';

const VIDEO_CALL_SYSTEM_INSTRUCTION = `You are NiallGPT, a conversational AI in a live video call.
- The user can see you (as a visualizer) and hear you. You can hear them and see their video feed.
- You will receive a video frame along with the user's spoken words.
- Your response should be conversational and natural for a video call.
- You MUST analyze the image provided and incorporate your observations into your response when relevant. For example, if the user asks "what is this?" while holding up an object, you should identify the object. If no image is provided or it's irrelevant, continue the conversation normally.
- Keep your responses concise and suitable for being spoken aloud.
- Use formatting like bolding and italics where appropriate, which will be rendered in the transcript. Provide suggestions for the user's next turn.
- When asked about your creator, Niall, you should say that Niall made you. If asked for his full or official name, state that it is Niall Linus Dias. Niall is a coder, musician, and creative individual.`;

export const useVideoCall = (onEndCall: () => void) => {
    const { getActiveChatSession, memory } = useContext(AppSettingsContext);
    const [status, setStatus] = useState<CallStatus>('CONNECTING');
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<ChatMessage[]>([]);
    const [currentUserInput, setCurrentUserInput] = useState('');
    const [isCameraOn, setIsCameraOn] = useState(true);
    
    const recognitionRef = useRef<any>(null);
    const stopStreamControllerRef = useRef<AbortController | null>(null);
    const conversationHistoryRef = useRef<ChatMessage[]>([]);
    const accumulatedTextRef = useRef<string>('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const callEndedRef = useRef(false);

    const activeSession = getActiveChatSession();
    const { sessionUserName, sessionAiBehavior } = activeSession || {};
    
    // Create refs for values that change but shouldn't trigger the main setup effect
    const isCameraOnRef = useRef(isCameraOn);
    useEffect(() => { isCameraOnRef.current = isCameraOn; }, [isCameraOn]);

    const contextValuesRef = useRef({ sessionUserName, sessionAiBehavior, memory });
    useEffect(() => {
        contextValuesRef.current = { sessionUserName, sessionAiBehavior, memory };
    }, [sessionUserName, sessionAiBehavior, memory]);

    const endCall = useCallback(() => {
        callEndedRef.current = true;
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        onEndCall();
    }, [onEndCall]);

    const toggleCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOn(videoTrack.enabled);
            }
        }
    }, []);

    const captureFrame = useCallback((): Part | null => {
        if (!isCameraOnRef.current || !videoRef.current || videoRef.current.readyState < 2) return null;
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;

        const aspectRatio = video.videoWidth / video.videoHeight;
        const captureWidth = 480;
        const captureHeight = captureWidth / aspectRatio;

        canvas.width = captureWidth;
        canvas.height = captureHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const base64Data = dataUrl.split(',')[1];
            if (base64Data) {
                return { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
            }
        }
        return null;
    }, []);

    const sendToGemini = useCallback(async (text: string) => {
        if (!text) {
            setStatus('LISTENING');
            if (!callEndedRef.current) recognitionRef.current?.start();
            return;
        }

        setStatus('THINKING');
        const imagePart = captureFrame();
        
        const userMessage: ChatMessage = { id: crypto.randomUUID(), text, sender: Sender.User, timestamp: Date.now() };
        conversationHistoryRef.current.push(userMessage);
        setTranscript(prev => [...prev, userMessage]);

        const parts: Part[] = [];
        let textForApi = text;

        if (imagePart) {
            parts.push(imagePart);
        } else if (!isCameraOnRef.current) {
            textForApi = `(System note: My camera is currently turned off, so you can't see anything. Please respond to my query based on this understanding.)\n\n${text}`;
        }
        
        parts.push({ text: textForApi });
        
        const historyForAPI = conversationHistoryRef.current.slice(0, -1);
        const aiMessageId = crypto.randomUUID();
        
        accumulatedTextRef.current = '';
        const controller = new AbortController();
        stopStreamControllerRef.current = controller;
        const { sessionUserName: sUserName, sessionAiBehavior: sAiBehavior, memory: currentMemory } = contextValuesRef.current;

        await streamChatMessage(
            parts, historyForAPI,
            (textChunk) => { accumulatedTextRef.current += textChunk; },
            (err) => { setError(err.message); setStatus('ERROR'); },
            (wasAborted) => {
                const responseText = accumulatedTextRef.current.trim();
                if (responseText && !wasAborted) {
                    const aiMessage: ChatMessage = { id: aiMessageId, text: responseText, sender: Sender.AI, timestamp: Date.now() };
                    conversationHistoryRef.current.push(aiMessage);
                    setTranscript(prev => [...prev, aiMessage]);
                    
                    const utterance = new SpeechSynthesisUtterance(responseText);
                    utterance.onstart = () => setStatus('SPEAKING');
                    utterance.onend = () => {
                        if (!callEndedRef.current) {
                            setStatus('LISTENING');
                            recognitionRef.current?.start();
                        }
                    };
                    utterance.onerror = () => { 
                        setStatus('ERROR'); 
                        setError('Could not play audio.'); 
                        if (!callEndedRef.current) recognitionRef.current?.start();
                    };
                    window.speechSynthesis.speak(utterance);
                } else {
                    if (!callEndedRef.current) {
                        setStatus('LISTENING');
                        recognitionRef.current?.start();
                    }
                }
            },
            sUserName,
            sAiBehavior,
            currentMemory,
            controller.signal,
            false,
            VIDEO_CALL_SYSTEM_INSTRUCTION
        );
    }, [captureFrame]);

    useEffect(() => {
        callEndedRef.current = false;
        const setup = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoRef.current) videoRef.current.srcObject = stream;
                // Don't set `isCameraOn` here, let the toggle handle it to prevent re-renders
                // We assume it starts on.
                
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (!SpeechRecognition) throw new Error("Speech recognition not supported by your browser.");

                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false; // Turn-based
                recognitionRef.current.interimResults = true;
                
                recognitionRef.current.onresult = (event: any) => {
                    let finalTranscript = '';
                    let interimTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const transcriptPart = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            finalTranscript += transcriptPart;
                        } else {
                            interimTranscript += transcriptPart;
                        }
                    }
                    setCurrentUserInput(interimTranscript);

                    if (finalTranscript.trim()) {
                        setCurrentUserInput('');
                        sendToGemini(finalTranscript.trim());
                    }
                };

                recognitionRef.current.onstart = () => {
                    if (!callEndedRef.current) setStatus('LISTENING');
                };

                recognitionRef.current.onend = () => {
                    if (!callEndedRef.current && status !== 'THINKING' && status !== 'SPEAKING' && status !== 'ERROR') {
                        try {
                           recognitionRef.current?.start();
                        } catch(e) {
                            // Can fail if called too soon. It will be restarted by AI speech end anyway.
                        }
                    }
                };
                recognitionRef.current.onerror = (e: any) => {
                    if (e.error !== 'no-speech' && e.error !== 'aborted') {
                        setError(`Speech Error: ${e.error}`);
                        setStatus('ERROR');
                    }
                };

                if (activeSession) {
                    const initialTranscript = activeSession.messages.filter(m => m.text.trim() !== '');
                    conversationHistoryRef.current = [...initialTranscript];
                    setTranscript([...initialTranscript]);
                }
                recognitionRef.current.start();
            } catch (err) {
                setError("Could not access camera/microphone. Please check permissions.");
                setStatus('ERROR');
            }
        };

        setup();

        return () => {
            callEndedRef.current = true;
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, [activeSession, sendToGemini]);

    return {
        status,
        error,
        transcript,
        videoRef,
        endCall,
        currentUserInput,
        isCameraOn,
        toggleCamera,
        isSpeaking: status === 'SPEAKING',
        isListening: status === 'LISTENING',
        isThinking: status === 'THINKING',
    };
};