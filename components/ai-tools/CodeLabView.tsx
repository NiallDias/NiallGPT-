import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { streamChatMessage } from '../../services/geminiService';
import { Part } from '@google/genai';
import { LoadingSpinner } from '../LoadingSpinner';
import { ChatMessageContent } from '../ChatMessageContent';
import { SendIcon } from '../icons/SendIcon';
import { StopIcon } from '../icons/StopIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { AppSettingsContext } from '../../contexts/AppSettingsContext';
import { CodeLabProject, CodeLabMessage } from '../../types';
import { FolderOpenIcon } from '../icons/FolderOpenIcon';
import { ChevronDownIcon } from '../icons/ChevronDownIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { NiallGPTLogo } from '../icons/NiallGPTLogo';
import hljs from 'highlight.js';
import { ArrowsPointingOutIcon } from '../icons/ArrowsPointingOutIcon';
import { ArrowsPointingInIcon } from '../icons/ArrowsPointingInIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { PaperclipIcon } from '../icons/PaperclipIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { CheckIcon } from '../icons/CheckIcon';

const SYSTEM_INSTRUCTION = `You are an expert coding assistant named NiallGPT, operating within a 'Code Lab' environment. Your purpose is to help users with their coding tasks. You can write code, explain concepts, debug errors, and optimize performance.
- When asked about your creator, you must say that Niall made you. His full name is Niall Linus Dias.
- When the user provides code, analyze it based on their request.
- When asked to generate code, provide it in a formatted code block with the correct language identifier (e.g., \`\`\`javascript).
- CRITICAL: Provide all explanations *before* the code block. The code block must be the absolute last part of your response. Do not add any text, summaries, or pleasantries after the final \`\`\`.`;

const LANGUAGES = [
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'java', name: 'Java' },
    { id: 'csharp', name: 'C#' },
    { id: 'go', name: 'Go' },
    { id: 'rust', name: 'Rust' },
    { id: 'shell', name: 'Shell' },
];

const DEFAULT_HTML_PROJECT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interactive Box</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f0f0f0;
      font-family: sans-serif;
      transition: background-color 0.5s ease;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }
    #box {
      width: 150px;
      height: 150px;
      background-color: #4682b4; /* steelblue */
      border-radius: 10px;
      margin: 0 auto 20px auto;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: grab;
    }
    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      border: none;
      border-radius: 5px;
      background-color: #333;
      color: white;
      transition: transform 0.2s ease, background-color 0.2s ease;
    }
    button:hover {
        background-color: #555;
        transform: scale(1.05);
    }
    button:active {
        transform: scale(0.98);
    }
  </style>
</head>
<body>
  <div class="container">
    <div id="box"></div>
    <button id="actionBtn">Click Me!</button>
  </div>
  <script>
    const box = document.getElementById('box');
    const btn = document.getElementById('actionBtn');
    const body = document.body;

    const items = [
        { color: '#ff6347', radius: '50%', bg: '#fff0f0' }, // Tomato
        { color: '#4682b4', radius: '10px', bg: '#f0f8ff' }, // SteelBlue
        { color: '#32cd32', radius: '0%',   bg: '#f0fff0' }, // LimeGreen
        { color: '#ffd700', radius: '25px', bg: '#fffacd' }, // Gold
        { color: '#6a5acd', radius: '50% 10px', bg: '#e6e6fa' } // SlateBlue
    ];
    let currentIndex = 0;

    btn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % items.length;
      const currentItem = items[currentIndex];
      
      box.style.backgroundColor = currentItem.color;
      box.style.borderRadius = currentItem.radius;
      body.style.backgroundColor = currentItem.bg;
      box.style.transform = 'scale(1.1) rotate(' + (Math.random() * 20 - 10) + 'deg)';
      
      setTimeout(() => {
        box.style.transform = 'scale(1)';
      }, 200);
    });
  </script>
</body>
</html>`;

interface ProjectManagerProps {
    projects: CodeLabProject[], 
    onSave: (name: string) => void, 
    onLoad: (project: CodeLabProject) => void, 
    onDelete: (projectId: string) => void, 
    onSaveCurrentProject: () => void,
    deletingProjectId: string | null,
    loadedProjectId: string | null,
    isDirty: boolean,
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, onSave, onLoad, onDelete, onSaveCurrentProject, deletingProjectId, loadedProjectId, isDirty }) => {
    const [newProjectName, setNewProjectName] = useState('');

    const handleSaveClick = () => {
        if (newProjectName.trim()) {
            onSave(newProjectName.trim());
            setNewProjectName('');
        }
    };
    
    return (
        <details className="group details-animation rounded-lg bg-[var(--bg-input)] mb-4 border border-[var(--border-primary)] shadow-sm">
            <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-[var(--icon-hover-bg)] list-none">
                <div className="flex items-center">
                    <FolderOpenIcon className="w-5 h-5 mr-3 text-[var(--text-secondary)]"/>
                    <span className="font-semibold text-md text-[var(--text-primary)]">My Projects</span>
                </div>
                <ChevronDownIcon className="w-5 h-5 text-[var(--text-secondary)] transition-transform group-open:rotate-180"/>
            </summary>
            <div className="details-content-wrapper">
                <div className="p-3 border-t border-[var(--border-primary)]">
                     <div className="flex items-center space-x-2 mb-3">
                        <input
                            type="text"
                            placeholder="New project name..."
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') handleSaveClick(); }}
                            className="flex-grow p-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-primary)] themed-focus-ring text-sm"
                        />
                        <button 
                            onClick={handleSaveClick}
                            disabled={!newProjectName.trim()}
                            className="p-2 rounded-md text-white flex-shrink-0 transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: 'var(--button-accent-bg)'}}
                            title="Save as New Project"
                        >
                            <SaveIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {projects.length > 0 ? projects.map((p, index) => {
                             const isLoaded = loadedProjectId === p.id;
                             return (
                                <div 
                                    key={p.id} 
                                    className={`
                                        flex items-center justify-between p-2 rounded-md group/item transition-all duration-300
                                        ${deletingProjectId === p.id ? 'animate-bounce-out' : 'animate-slide-in-bottom'}
                                        ${isLoaded ? 'bg-[var(--icon-hover-bg)]' : 'bg-[var(--bg-tertiary)]'}
                                    `}
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        animationFillMode: deletingProjectId === p.id ? 'forwards' : 'backwards'
                                    }}
                                >
                                    <button onClick={() => onLoad(p)} className="flex-grow text-left flex items-center min-w-0">
                                        <div className="truncate">
                                            <p className="text-sm font-medium truncate text-[var(--text-primary)]">{p.name}</p>
                                            <p className="text-xs text-[var(--text-secondary)] uppercase">{p.language}</p>
                                        </div>
                                        {isLoaded && !isDirty && <span title="Saved"><CheckIcon className="w-4 h-4 ml-2 text-green-500 flex-shrink-0"/></span>}
                                        {isLoaded && isDirty && <div className="w-2 h-2 ml-2 rounded-full bg-yellow-500 flex-shrink-0" title="Unsaved changes"></div>}
                                    </button>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                        {isLoaded && isDirty && (
                                            <button onClick={onSaveCurrentProject} className="p-1.5 rounded-full bg-green-500/20 text-green-500 transition-transform duration-150 hover:scale-110 active:scale-95" title="Save changes">
                                                <SaveIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-full hover:bg-[var(--icon-hover-bg)] text-[var(--danger-bg)] transition-transform duration-150 hover:scale-110 active:scale-95" title="Delete project">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                             )
                        }) : (
                            <p className="text-center text-sm text-[var(--text-secondary)] py-4">No saved projects.</p>
                        )}
                    </div>
                </div>
            </div>
        </details>
    )
}


export const CodeLabView: React.FC = () => {
    const { codeLabProjects, addCodeLabProject, deleteCodeLabProject, updateCodeLabProject } = useContext(AppSettingsContext);
    const [code, setCode] = useState(DEFAULT_HTML_PROJECT);
    const [prompt, setPrompt] = useState('');
    const [language, setLanguage] = useState('html');
    const [messages, setMessages] = useState<CodeLabMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const stopStreamControllerRef = useRef<AbortController | null>(null);
    const accumulatedTextRef = useRef<string>('');
    const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
    const [htmlPreviewContent, setHtmlPreviewContent] = useState('');
    const [activeTab, setActiveTab] = useState<'preview' | 'output'>('preview');
    const [lineNumbers, setLineNumbers] = useState('1');
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const chatOutputRef = useRef<HTMLDivElement>(null);
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
    const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
    const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);
    const [isAnimatingFullScreenExit, setIsAnimatingFullScreenExit] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isFileReading, setIsFileReading] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [originalCode, setOriginalCode] = useState('');
    const [originalLang, setOriginalLang] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (loadedProjectId) {
            if (code !== originalCode || language !== originalLang) {
                setIsDirty(true);
            } else {
                setIsDirty(false);
            }
        } else {
            setIsDirty(false);
        }
    }, [code, language, loadedProjectId, originalCode, originalLang]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please select a valid image file.'); return; }
        if (file.size > 4 * 1024 * 1024) { setError("File is too large (max 4MB)."); return; }
        
        setError(null);
        setSelectedFile(file);
        setIsFileReading(true);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setIsFileReading(false);
        };
        reader.onerror = () => { setError('Failed to read the file.'); setIsFileReading(false); };
        reader.readAsDataURL(file);
    };
    
    const clearImage = useCallback(() => {
        setImagePreview(null);
        setSelectedFile(null);
        setIsFileReading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
    }, []);

    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current && preRef.current) {
            const scrollTop = textareaRef.current.scrollTop;
            const scrollLeft = textareaRef.current.scrollLeft;
            lineNumbersRef.current.scrollTop = scrollTop;
            preRef.current.scrollTop = scrollTop;
            preRef.current.scrollLeft = scrollLeft;
        }
    };

    useEffect(() => {
        const lineCount = code.split('\n').length;
        const numbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
        setLineNumbers(numbers);
    }, [code]);

    useEffect(() => {
        if (chatOutputRef.current) {
            chatOutputRef.current.scrollTop = chatOutputRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (language === 'html') {
                setHtmlPreviewContent(code);
            } else if (language === 'css') {
                setHtmlPreviewContent(`<style>${code}</style>`);
            } else if (language === 'javascript') {
                setHtmlPreviewContent(`
                    <html>
                        <head>
                            <style> body { font-family: sans-serif; color: var(--text-primary); } .log { border-bottom: 1px solid var(--border-primary); padding: 4px; font-family: var(--font-code); white-space: pre-wrap;} .log-error { color: #ff8a8a; }</style>
                        </head>
                        <body>
                            <script>
                                const originalLog = console.log; const originalError = console.error;
                                console.log = (...args) => { const el = document.createElement('div'); el.className = 'log'; el.textContent = args.map(a => JSON.stringify(a, null, 2)).join(' '); document.body.appendChild(el); originalLog(...args); };
                                console.error = (...args) => { const el = document.createElement('div'); el.className = 'log log-error'; el.textContent = 'ERROR: ' + args.map(a => JSON.stringify(a, null, 2)).join(' '); document.body.appendChild(el); originalError(...args); };
                                try { ${code} } catch (e) { console.error(e.message); }
                            </script>
                        </body>
                    </html>
                `);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [code, language]);
    
    const handleExitFullScreen = useCallback(() => {
        setIsAnimatingFullScreenExit(true);
        setTimeout(() => {
            setIsPreviewFullScreen(false);
            setIsAnimatingFullScreenExit(false);
        }, 300); // Match fade-out animation duration
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isPreviewFullScreen) {
                handleExitFullScreen();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPreviewFullScreen, handleExitFullScreen]);

    const handleGenerate = useCallback(async () => {
        if ((!prompt.trim() && !code.trim() && !selectedFile)) return;

        setActiveTab('output');
        setIsLoading(true);
        setError(null);
        accumulatedTextRef.current = '';
        const controller = new AbortController();
        stopStreamControllerRef.current = controller;

        const userMessage: CodeLabMessage = { id: crypto.randomUUID(), sender: 'user', content: prompt };
        const aiMessageId = crypto.randomUUID();
        const aiPlaceholder: CodeLabMessage = { id: aiMessageId, sender: 'ai', content: '...' };

        setMessages(prev => [...prev, userMessage, aiPlaceholder]);
        setPrompt('');

        const parts: Part[] = [];

        if (imagePreview && selectedFile) {
            const base64Data = imagePreview.split(',')[1];
            parts.push({ inlineData: { mimeType: selectedFile.type, data: base64Data } });
        }

        let fullPrompt = `Task: ${prompt}`;
        if (code.trim()) {
            fullPrompt += `\n\nHere is the relevant code written in ${language}:\n\`\`\`${language}\n${code}\n\`\`\``
        }
        parts.push({ text: fullPrompt });

        clearImage();

        try {
            await streamChatMessage(
                parts,
                [],
                (textChunk) => {
                    accumulatedTextRef.current += textChunk;
                    const fullResponse = accumulatedTextRef.current;
                    
                    const codeBlockRegex = /```(\w*)\n([\s\S]*?)($|\n```$)/;
                    const match = fullResponse.match(codeBlockRegex);

                    if (match) {
                        const explanationPart = fullResponse.substring(0, match.index).trim();
                        const lang = match[1] || language;
                        const codePart = match[2];

                        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: explanationPart } : m));
                        
                        const foundLang = LANGUAGES.find(l => l.id.toLowerCase() === lang.toLowerCase() || l.name.toLowerCase() === lang.toLowerCase());
                        if (foundLang) setLanguage(foundLang.id);
                        
                        setCode(codePart);
                    } else {
                        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: fullResponse } : m));
                    }
                },
                (err) => {
                    setError(`Error: ${err.message}. Please try again.`);
                    setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: `[Error: ${err.message}]` } : m));
                },
                (wasAborted) => {
                    const finalFullText = accumulatedTextRef.current;
                    const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```\s*$/;
                    const match = finalFullText.match(codeBlockRegex);
                    let finalExplanation = finalFullText;
                    if (match) {
                        finalExplanation = finalFullText.substring(0, match.index).trim();
                        const codePart = match[2].trim();
                        setCode(codePart);
                    }
            
                    if (wasAborted) {
                        finalExplanation += '\n\n[Stopped by user]';
                    }
                    
                    if (finalExplanation.trim() === '' && match) {
                        finalExplanation = "I have updated the code in the editor based on your request.";
                    }
                    
                    setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, content: finalExplanation || (wasAborted ? '[Stopped by user]' : '[Empty Response]') } : m));
                    setIsLoading(false);
                    stopStreamControllerRef.current = null;
                },
                undefined,
                undefined,
                [],
                controller.signal,
                false,
                SYSTEM_INSTRUCTION
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            setIsLoading(false);
        }
    }, [code, prompt, language, selectedFile, imagePreview, clearImage]);

    const handleStop = () => stopStreamControllerRef.current?.abort();
    const handleClear = () => { setCode(''); setPrompt(''); setMessages([]); setError(null); setActiveTab('preview'); clearImage(); setLoadedProjectId(null); setIsDirty(false);};
    const handleCopyCode = async (content: string, key: string) => { await navigator.clipboard.writeText(content); setCopiedCodeKey(key); setTimeout(() => setCopiedCodeKey(null), 2000); };
    
    const handleDownloadCode = () => {
        const fileExtensionMap: Record<string, { extension: string; mimeType: string }> = {
            html: { extension: 'html', mimeType: 'text/html' },
            css: { extension: 'css', mimeType: 'text/css' },
            javascript: { extension: 'js', mimeType: 'application/javascript' },
            python: { extension: 'py', mimeType: 'text/x-python' },
            typescript: { extension: 'ts', mimeType: 'application/typescript' },
            java: { extension: 'java', mimeType: 'text/x-java-source' },
            csharp: { extension: 'cs', mimeType: 'text/plain' },
            go: { extension: 'go', mimeType: 'text/x-go' },
            rust: { extension: 'rs', mimeType: 'text/rust' },
            shell: { extension: 'sh', mimeType: 'application/x-sh' },
        };

        const { extension, mimeType } = fileExtensionMap[language] || { extension: 'txt', mimeType: 'text/plain' };
        const blob = new Blob([code], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `codelab_project.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSaveProject = (name: string) => {
        if (name) {
            const newProject = addCodeLabProject({ name, code, language });
            setLoadedProjectId(newProject.id);
            setOriginalCode(code);
            setOriginalLang(language);
            setIsDirty(false);
        }
    };
    
    const handleLoadProject = (project: CodeLabProject) => {
        setCode(project.code);
        setLanguage(project.language);
        setLoadedProjectId(project.id);
        setOriginalCode(project.code);
        setOriginalLang(project.language);
        setIsDirty(false);
    };

    const handleSaveCurrentProject = () => {
        if (loadedProjectId && isDirty) {
            updateCodeLabProject(loadedProjectId, { code, language });
            setOriginalCode(code);
            setOriginalLang(language);
            setIsDirty(false);
        }
    };
    
    const handleDeleteProject = (projectId: string) => {
        if (loadedProjectId === projectId) {
            setLoadedProjectId(null);
            setOriginalCode('');
            setOriginalLang('');
            setIsDirty(false);
        }
        setDeletingProjectId(projectId);
        setTimeout(() => {
            deleteCodeLabProject(projectId);
            setDeletingProjectId(null);
        }, 500);
    };
    
    const isWebLanguage = ['html', 'css', 'javascript'].includes(language);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)]">
            {isPreviewFullScreen && (
                <div className={`fixed inset-0 bg-[var(--bg-primary)] z-[200] flex flex-col ${isAnimatingFullScreenExit ? 'animate-fade-out' : 'animate-fade-in'}`}>
                    <header className="flex-shrink-0 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] p-2 flex justify-end items-center shadow-sm">
                        <button 
                            onClick={handleExitFullScreen} 
                            className="flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--icon-hover-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            title="Exit Full Screen (Esc)"
                        >
                            <ArrowsPointingInIcon className="w-5 h-5" />
                            <span className="ml-2 hidden sm:inline">Exit Full Screen</span>
                        </button>
                    </header>
                    <div className="flex-grow min-h-0">
                        <iframe 
                            srcDoc={htmlPreviewContent} 
                            title="Full Screen Live Preview" 
                            className="w-full h-full bg-white border-none"
                            sandbox="allow-scripts allow-popups allow-forms allow-modals"
                        />
                    </div>
                </div>
            )}

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col min-h-0 animate-slide-in-bottom">
                    <ProjectManager 
                        projects={codeLabProjects}
                        onSave={handleSaveProject}
                        onLoad={handleLoadProject}
                        onDelete={handleDeleteProject}
                        onSaveCurrentProject={handleSaveCurrentProject}
                        deletingProjectId={deletingProjectId}
                        loadedProjectId={loadedProjectId}
                        isDirty={isDirty}
                    />
                    <div className="flex items-center justify-between mb-3">
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="p-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-primary)] themed-focus-ring text-sm">
                            {LANGUAGES.map(lang => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                        </select>
                        <div className="flex items-center space-x-1">
                            <button onClick={handleDownloadCode} disabled={!code.trim()} className="p-2 rounded-full hover:bg-[var(--icon-hover-bg)] text-[var(--text-secondary)] disabled:opacity-50" title="Download Code">
                                <DownloadIcon className="w-5 h-5" />
                            </button>
                            <button onClick={handleClear} disabled={isLoading} className="p-2 rounded-full hover:bg-[var(--icon-hover-bg)] text-[var(--text-secondary)]" title="Clear All"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div className="code-editor-wrapper shadow-md flex-grow">
                        <div ref={lineNumbersRef} className="line-numbers"><pre><code>{lineNumbers}</code></pre></div>
                        <div className="relative w-full h-full overflow-hidden">
                            <pre ref={preRef} className="code-editor-textarea m-0 absolute inset-0 z-0" aria-hidden="true">
                                <code
                                    className={`language-${language} hljs`}
                                    dangerouslySetInnerHTML={{ __html: hljs.highlight(code, { language, ignoreIllegals: true }).value }}
                                />
                            </pre>
                            <textarea
                                ref={textareaRef}
                                onScroll={handleScroll}
                                onInput={handleScroll}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder={`Your ${language} code goes here...`}
                                className="code-editor-textarea m-0 absolute inset-0 z-10 bg-transparent resize-none"
                                style={{
                                    color: 'transparent',
                                    caretColor: 'var(--text-primary)',
                                    WebkitTextFillColor: 'transparent',
                                }}
                                spellCheck="false"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                     {imagePreview && (
                        <div className="relative mt-2 p-1 border border-[var(--border-primary)] rounded-md animate-slide-in-bottom">
                            <img src={imagePreview} alt="Code context" className="w-auto h-24 object-contain rounded" />
                            <button onClick={clearImage} disabled={isLoading} className="absolute top-0 right-0 -mt-2 -mr-2 p-0.5 rounded-full" style={{backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)'}}>
                                <XCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center space-x-2 mt-3 flex-shrink-0">
                        <input type="file" accept="image/*" ref={imageInputRef} onChange={handleFileChange} className="hidden" />
                        <button onClick={() => imageInputRef.current?.click()} disabled={isLoading || isFileReading} className="p-3 rounded-full hover:bg-[var(--icon-hover-bg)] text-[var(--text-secondary)]">
                            <PaperclipIcon className="w-5 h-5"/>
                        </button>
                         <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask AI to explain, debug, or generate code..." className="flex-grow p-3 rounded-full bg-[var(--bg-input)] border border-[var(--border-primary)] themed-focus-ring text-sm" onKeyPress={(e) => { if (e.key === 'Enter') handleGenerate(); }}/>
                         <button onClick={isLoading ? handleStop : handleGenerate} className="p-3 rounded-full text-white flex-shrink-0" style={{background: isLoading ? 'var(--danger-bg)' : 'var(--button-accent-bg)'}}>
                            {isLoading ? <StopIcon className="w-6 h-6"/> : <SendIcon className="w-6 h-6"/>}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col min-h-0 animate-slide-in-bottom" style={{animationDelay: '100ms'}}>
                    <div className="flex-shrink-0 flex items-center justify-between border-b border-[var(--border-primary)] mb-3">
                        <div className="flex items-center">
                            <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'preview' ? 'text-[var(--text-accent)] border-b-2 border-[var(--text-accent)]' : 'text-[var(--text-secondary)]'}`}>Preview</button>
                            <button onClick={() => setActiveTab('output')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'output' ? 'text-[var(--text-accent)] border-b-2 border-[var(--text-accent)]' : 'text-[var(--text-secondary)]'}`}>AI Output</button>
                        </div>
                        {activeTab === 'preview' && isWebLanguage && (
                             <button 
                                onClick={() => setIsPreviewFullScreen(true)} 
                                className="p-2 rounded-full hover:bg-[var(--icon-hover-bg)] text-[var(--text-secondary)]"
                                title="Enter Full Screen"
                            >
                                <ArrowsPointingOutIcon className="w-5 h-5"/>
                            </button>
                        )}
                    </div>
                    <div className="flex-grow rounded-lg bg-[var(--bg-secondary)] min-h-0 overflow-hidden">
                        {activeTab === 'preview' && (
                            isWebLanguage ? (
                                <iframe srcDoc={htmlPreviewContent} title="Live Preview" className="w-full h-full bg-white animate-view-change" sandbox="allow-scripts allow-popups allow-forms allow-modals"/>
                            ) : (
                                <div className="w-full h-full overflow-auto bg-[var(--code-block-bg)] p-4 animate-view-change">
                                    <pre>
                                        <code
                                            className={`language-${language} hljs text-sm`}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight(code, { language, ignoreIllegals: true }).value }}
                                        />
                                    </pre>
                                </div>
                            )
                        )}
                        {activeTab === 'output' && (
                            <div ref={chatOutputRef} className="w-full h-full p-3 overflow-y-auto space-y-4 animate-view-change">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end animate-bounce-in' : 'justify-start animate-message-appear'}`}>
                                        {msg.sender === 'ai' && <div className="mr-2 self-start flex-shrink-0 pt-1"><NiallGPTLogo className="w-8 h-8" style={{color: 'var(--text-accent)'}} /></div>}
                                        <div className={`break-words max-w-[90%] ${msg.sender === 'user' ? 'p-3 rounded-xl shadow-md border bg-[var(--user-message-bg)] text-[var(--user-message-text)]' : 'pt-1 w-full'}`}>
                                            {msg.sender === 'user' ? (
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            ) : (
                                                <ChatMessageContent
                                                    text={msg.content} messageId={msg.id}
                                                    isLoading={isLoading && msg.content === '...'}
                                                    currentAiMessageId={isLoading ? msg.id : null}
                                                    onCodeChange={() => {}} 
                                                    onPreview={() => {}}
                                                    onCopyCode={handleCopyCode} copiedCodeKey={copiedCodeKey}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && messages.length > 0 && messages[messages.length - 1].sender !== 'ai' && (
                                    <div className="flex justify-start animate-message-appear">
                                        <div className="mr-2 self-start flex-shrink-0 pt-1"><NiallGPTLogo className="w-8 h-8" style={{color: 'var(--text-accent)'}} /></div>
                                        <LoadingSpinner/>
                                    </div>
                                )}
                                {!isLoading && messages.length === 0 && <div className="flex items-center justify-center h-full text-[var(--text-secondary)] text-sm">AI response will appear here.</div>}
                                {error && <div className="p-3 text-sm rounded-md bg-red-500/20 text-red-500">{error}</div>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};