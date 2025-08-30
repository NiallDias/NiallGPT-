

import { AspectRatio } from './types';

export const GEMINI_CHAT_MODEL = 'gemini-2.5-flash';
// FIX: Updated image model to 'imagen-4.0-generate-001' as per guidelines.
export const GEMINI_IMAGE_MODEL = 'imagen-4.0-generate-001';
export const GEMINI_VIDEO_MODEL = 'veo-2.0-generate-001';

export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
    { value: '1:1', label: '1:1' },
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
];

export const SUPPORTED_LANGUAGES = [
    { code: 'auto', name: 'Auto-detect' },
    { code: 'ar', name: 'Arabic' },
    { code: 'bn', name: 'Bengali' },
    { code: 'zh', name: 'Chinese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'id', name: 'Indonesian' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'mr', name: 'Marathi' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'es', name: 'Spanish' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'tr', name: 'Turkish' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'vi', name: 'Vietnamese' },
];