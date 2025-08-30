


export enum Sender {
  User = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  id: string;
  text: string; 
  sender: Sender;
  timestamp: number;
  attachment?: {
    name: string;
    type: string; 
    previewUrl?: string;
    content: string; // Data URL for images, raw text for .txt files
  };
  isVoiceInput?: boolean;
  groundingChunks?: GroundingChunk[];
  isEdited?: boolean;
  originalText?: string; 
  isLoading?: boolean; 
  isSpokenByAI?: boolean; 
  audioUrl?: string;
  imageUrl?: string;
  suggestions?: string[];
}

export enum AppView {
  Chat = 'chat',
  ImageGenerator = 'imageGenerator',
  VideoGenerator = 'videoGenerator',
  AITools = 'aiTools',
  Policy = 'policy',
  Dashboard = 'dashboard',
  CodeLab = 'codeLab',
  Calculator = 'calculator',
  Translator = 'translator',
  VideoCall = 'videoCall',
  AIPhotoEditor = 'aiPhotoEditor',
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedContext?: {
    uri?: string; 
    title?: string;
  };
}

export type ThemeName = 
  | 'black-gold' 
  | 'light' 
  | 'dark' 
  | 'rgb' 
  | 'rainbow' 
  | 'night-sky' 
  | 'ocean-breeze' 
  | 'forest-whisper'
  | 'sapphire'
  | 'cherry-blossom'
  | 'aurora';

export interface Theme {
  id: ThemeName;
  name: string; 
}

export type FontName = 'inter' | 'roboto' | 'lora' | 'poppins';

export interface Font {
  id: FontName;
  name: string;
  cssVariable: string;
}

export enum UserAction {
  Edit = 'edit',
  Regenerate = 'regenerate',
  Speak = 'speak',
  StopSpeaking = 'stop_speaking',
  StartVoiceChat = 'start_voice_chat',
  StopVoiceChat = 'stop_voice_chat',
  RenameChat = 'rename_chat',
  DeleteChat = 'delete_chat',
}

export interface UserSettings { // Global/Default settings
  userName: string;
  aiBehavior: string;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  timestamp: number; // For sorting, creation/last message time
  // Session-specific settings, fallback to global if undefined
  sessionUserName?: string; 
  sessionAiBehavior?: string; 
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface GalleryImage {
  id: string;
  imageUrl: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  timestamp: number;
}

export interface Headline {
  title: string;
  uri: string;
  snippet: string;
  imageUrl?: string;
}

export interface PptxSlide {
  type: string; // Was: 'title' | 'bullets' | 'image' | 'content' | 'shape';
  title?: string;
  subtitle?: string;
  bulletPoints?: string[];
  content?: string;
  imagePrompt?: string;
  speakerNotes?: string[];
  shape?: {
      type: string; // Was: 'RECTANGLE' | 'OVAL' | 'ROUNDED_RECTANGLE';
      text: string;
  };
}

export interface PresentationStructure {
  slides: PptxSlide[];
  title?: string; 
}

export interface PresentationResponse {
  structure: PresentationStructure;
  pythonCode: string;
}

export type LayoutName = 'standard' | 'focused' | 'modern';

export interface CodeLabProject {
  id: string;
  name: string;
  code: string;
  language: string;
  timestamp: number;
}

export interface CodeLabMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
}

export interface AIDetectionResponse {
    probability: number;
    analysis: string;
}

export interface Fact {
  text: string;
  imagePrompt: string;
  imageUrl?: string;
}