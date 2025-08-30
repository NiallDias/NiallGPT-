

import React, { useState, useEffect, useRef } from 'react';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { ChatSession, Sender, GroundingChunk, ThemeName } from '../types';
import { themes } from '../contexts/AppSettingsContext';
import { LoadingScreen } from './LoadingScreen';
import { NiallGPTLogo } from './icons/NiallGPTLogo';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import hljs from 'highlight.js';

interface SharedChatData {
  session: ChatSession;
  themeId: ThemeName;
}

// Helper to parse simple markdown formatting (bold, italic, links)
const parseInlineMarkdown = (lineContent: string, baseKey: string): (string | JSX.Element)[] => {
    const combinedRegex = /(\*\*\*([^\*]+?)\*\*\*|\*\*([^\*]+?)\*\*|\*([^\*]+?)\*|\[([^\]]+?)\]\((https?:\/\/[^\s)]+?)\)|(#+([a-zA-Z0-9_]{2,})))/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let keySuffix = 0;
  
    while ((match = combinedRegex.exec(lineContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push(lineContent.substring(lastIndex, match.index));
      }
      const [fullMatch, , boldItalicText, boldText, italicText, linkText, linkUrl, fullHashtag, hashtagText] = match;
      const key = `${baseKey}-md-${keySuffix++}`;
  
      if (boldItalicText) parts.push(<strong key={key}><em>{boldItalicText}</em></strong>);
      else if (boldText) parts.push(<strong key={key}>{boldText}</strong>);
      else if (italicText) parts.push(<em key={key}>{italicText}</em>);
      else if (linkText && linkUrl) parts.push(<a key={key} href={linkUrl} target="_blank" rel="noopener noreferrer" className="themed-link">{linkText}</a>);
      else if (fullHashtag) parts.push(<span key={key} className="hashtag-link">{fullHashtag}</span>);
      else parts.push(fullMatch);
      lastIndex = combinedRegex.lastIndex;
    }
  
    if (lastIndex < lineContent.length) {
      parts.push(lineContent.substring(lastIndex));
    }
  
    return parts.length > 0 ? parts : [lineContent];
};

// Helper to render text with paragraphs and lists
const renderRegularTextSegment = (textSegment: string, segmentKeyPrefix: string): JSX.Element[] => {
    const lines = textSegment.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: { type: 'ul' | 'ol'; items: JSX.Element[]; listKey: string } | null = null;
    let currentParagraphLines: (string | JSX.Element)[][] = [];
    let keyCounter = 0;
  
    const flushParagraph = () => {
      if (currentParagraphLines.length > 0) {
        elements.push(
          <p key={`${segmentKeyPrefix}-p-${keyCounter++}`} className="my-1">
            {currentParagraphLines.map((lineContent, index) => (
              <React.Fragment key={index}>
                {lineContent}
                {index < currentParagraphLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
        currentParagraphLines = [];
      }
    };

    const flushList = () => {
      if (currentList) {
        const ListElement = currentList.type;
        elements.push(
          <ListElement
            key={currentList.listKey}
            className={`${currentList.type === 'ul' ? 'list-disc' : 'list-decimal'} list-inside pl-5 space-y-1 my-2`}
          >
            {currentList.items}
          </ListElement>
        );
        currentList = null;
      }
    };
    
    const headerStyles = ['text-xl', 'text-lg', 'text-base font-bold', 'text-base', 'text-sm font-bold', 'text-sm'];

    lines.forEach((line, lineIndex) => {
        const headerMatch = line.match(/^(#{1,6})\s+(.*)/);
        const hrMatch = line.match(/^\s*([-*_])(\s*\1){2,}\s*$/);
        const orderedListItemMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
        const unorderedListItemMatch = line.match(/^\s*[\*\-\•]\s+(.*)/);

        if (headerMatch) {
            flushParagraph();
            flushList();
            const level = headerMatch[1].length;
            const content = headerMatch[2];
            const Tag = `h${level}` as keyof JSX.IntrinsicElements;
            const headerKey = `${segmentKeyPrefix}-h${level}-${keyCounter++}`;
            elements.push(
                <Tag key={headerKey} className={`font-bold mt-4 mb-2 ${headerStyles[level-1]}`}>
                    {parseInlineMarkdown(content, `${headerKey}-content`)}
                </Tag>
            );
        } else if (hrMatch) {
            flushParagraph();
            flushList();
            elements.push(<hr key={`${segmentKeyPrefix}-hr-${keyCounter++}`} className="my-4 border-t" style={{ borderColor: 'var(--border-primary)' }} />);
        } else if (orderedListItemMatch) {
            flushParagraph();
            if (!currentList || currentList.type !== 'ol') {
                flushList();
                currentList = { type: 'ol', items: [], listKey: `${segmentKeyPrefix}-ol-${keyCounter++}` };
            }
            const listItemBaseKey = `${segmentKeyPrefix}-li-${keyCounter++}`;
            currentList.items.push(<li key={listItemBaseKey} className="mb-1">{parseInlineMarkdown(orderedListItemMatch[2], listItemBaseKey)}</li>);
        } else if (unorderedListItemMatch) {
            flushParagraph();
            if (!currentList || currentList.type !== 'ul') {
                flushList();
                currentList = { type: 'ul', items: [], listKey: `${segmentKeyPrefix}-ul-${keyCounter++}` };
            }
            const listItemBaseKey = `${segmentKeyPrefix}-li-${keyCounter++}`;
            currentList.items.push(<li key={listItemBaseKey} className="mb-1">{parseInlineMarkdown(unorderedListItemMatch[1], listItemBaseKey)}</li>);
        } else if (line.trim()) {
            flushList();
            currentParagraphLines.push(parseInlineMarkdown(line, `${segmentKeyPrefix}-p-line-${lineIndex}`));
        } else {
            flushParagraph();
            flushList();
        }
    });
  
    flushParagraph();
    flushList();
    return elements.length > 0 ? (elements) : (textSegment.trim() ? [<p key={`${segmentKeyPrefix}-single-p`}>{parseInlineMarkdown(textSegment, `${segmentKeyPrefix}-single-p-content`)}</p>] : [<span key={`${segmentKeyPrefix}-empty`}></span>]);
};

// Helper to render formatted text with code blocks
const renderFormattedText = (text: string, messageId: string): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    const codeBlockRegex = /^```(\w*)\n([\s\S]*?)\n```$/gm;
    let lastIndex = 0;
    let match;
    let segmentIndex = 0;
    let codeBlockIndex = 0;
  
    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(...renderRegularTextSegment(text.substring(lastIndex, match.index), `${messageId}-seg-${segmentIndex++}`));
      }
  
      const language = match[1]?.toLowerCase() || 'code';
      const codeContent = match[2];
      const codeBlockKey = `${messageId}-code-${codeBlockIndex++}`;
  
      elements.push(
        <div key={codeBlockKey} className="my-3 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--code-block-bg)', border: '1px solid var(--code-block-border)' }}>
          <div className="flex justify-between items-center px-4 py-2 text-xs" style={{ backgroundColor: 'var(--code-block-header-bg)', color: 'var(--code-block-header-text)', borderBottom: '1px solid var(--code-block-border)' }}>
            <span className="font-sans font-semibold uppercase tracking-wider">{language}</span>
          </div>
          <pre className="text-sm overflow-x-auto">
            <code className={`language-${language}`}>{codeContent}</code>
          </pre>
        </div>
      );
      lastIndex = codeBlockRegex.lastIndex;
    }
  
    if (lastIndex < text.length) {
      elements.push(...renderRegularTextSegment(text.substring(lastIndex), `${messageId}-seg-${segmentIndex++}`));
    }
    return elements;
};

const renderGroundingChunks = (chunks?: GroundingChunk[]) => {
    if (!chunks || chunks.length === 0) return null;
    const webChunks = chunks.filter(chunk => chunk.web && chunk.web.uri);
    if (webChunks.length === 0) return null;

    return (
      <div className="mt-2 text-xs" style={{color: 'var(--text-secondary)'}}>
        <p className="font-semibold mb-1">Sources:</p>
        <ul className="list-disc list-inside space-y-1">
          {webChunks.map((chunk, index) => (
            <li key={index}>
              <a href={chunk.web!.uri} target="_blank" rel="noopener noreferrer" className="themed-link" title={chunk.web!.uri}>
                {chunk.web!.title || chunk.web!.uri}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
};

export const SharedChatView: React.FC<{ compressedData: string }> = ({ compressedData }) => {
  const [chatData, setChatData] = useState<SharedChatData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      if (!compressedData) {
        throw new Error("No data provided in the link.");
      }
      const jsonString = decompressFromEncodedURIComponent(compressedData);
      if (!jsonString) {
        throw new Error("Could not decompress data. The link may be corrupted.");
      }
      const data: SharedChatData = JSON.parse(jsonString);
      setChatData(data);
    } catch (e) {
      console.error("Failed to load shared conversation:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    }
  }, [compressedData]);

  useEffect(() => {
    if (chatData?.themeId) {
      const { themeId } = chatData;
      const root = window.document.documentElement;
      themes.forEach(theme => root.classList.remove(`theme-${theme.id}`));
      root.classList.add(`theme-${themeId}`);
      const darkThemes: ThemeName[] = ['dark', 'black-gold', 'rgb', 'night-sky', 'forest-whisper', 'sapphire'];
      const isDark = darkThemes.includes(themeId);
      root.classList.toggle('dark', isDark);

      // Switch highlight.js theme
      const lightHljsTheme = document.getElementById('hljs-light-theme') as HTMLLinkElement;
      const darkHljsTheme = document.getElementById('hljs-dark-theme') as HTMLLinkElement;
      if (lightHljsTheme && darkHljsTheme) {
        lightHljsTheme.disabled = isDark;
        darkHljsTheme.disabled = !isDark;
      }
    }
  }, [chatData]);

  useEffect(() => {
    if (mainRef.current && chatData) {
        mainRef.current.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block as HTMLElement);
        });
    }
  }, [chatData]);


  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{color: 'var(--danger-bg)'}}>Error Loading Conversation</h2>
        <p style={{color: 'var(--text-secondary)'}}>{error}</p>
        <a href="/" className="themed-link mt-6">Go to NiallGPT</a>
      </div>
    );
  }

  if (!chatData) {
    return <LoadingScreen />;
  }
  
  const { session } = chatData;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="sticky top-0 p-4 shadow-md z-10" style={{ backgroundColor: 'var(--navbar-bg)', borderBottom: '1px solid var(--border-primary)' }}>
        <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
                <NiallGPTLogo className="w-8 h-8 mr-3" />
                <h1 className="text-xl font-bold truncate" style={{ color: 'var(--navbar-text)' }} title={session.name}>
                    {session.name}
                </h1>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded" style={{backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)'}}>
                Read-Only
            </span>
        </div>
      </header>
      
      <main ref={mainRef} className="flex-grow p-4 sm:p-6 overflow-y-auto">
        <div className="space-y-6 max-w-4xl mx-auto">
          {session.messages.filter(msg => !msg.isLoading).map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'} animate-message-appear`}>
              <div className={`flex items-start max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl ${msg.sender === Sender.AI ? 'w-full' : ''}`}>
                {msg.sender === Sender.AI && (
                  <div className="mr-2 self-start flex-shrink-0 pt-1">
                    <NiallGPTLogo className="w-8 h-8" style={{ color: 'var(--text-accent)' }} />
                  </div>
                )}
                <div
                  className={`break-words ${msg.sender === Sender.User ? 'p-3 rounded-xl shadow-md border' : `pt-1 w-full ${!msg.imageUrl ? '' : 'p-2 rounded-xl shadow-md'}`}`}
                  style={{
                    backgroundColor: msg.sender === Sender.User ? 'var(--user-message-bg)' : (msg.imageUrl ? 'var(--bg-secondary)' : 'transparent'),
                    color: msg.sender === Sender.User ? 'var(--user-message-text)' : 'var(--ai-message-text)',
                    borderColor: msg.sender === Sender.User ? 'var(--user-message-border)' : (msg.imageUrl ? 'var(--border-primary)' : 'transparent'),
                  }}
                >
                  {msg.attachment?.type.startsWith('image/') && msg.attachment.previewUrl && (
                    <img src={msg.attachment.previewUrl} alt={msg.attachment.name || 'User upload'} className="max-w-full h-auto rounded-md mb-2 max-h-60 object-contain" />
                  )}
                  {msg.attachment?.type === 'text/plain' && (
                    <div className="flex items-center space-x-2 p-2 rounded-md my-1 text-sm" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                      <DocumentTextIcon className="w-5 h-5 flex-shrink-0" style={{ color: msg.sender === Sender.User ? 'var(--user-message-text)' : 'var(--text-secondary)' }} />
                      <span>{msg.attachment.name}</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">
                    {msg.imageUrl ? (
                        <img src={msg.imageUrl} alt={"AI generated image"} className="rounded-lg max-w-full h-auto max-h-[60vh] object-contain" />
                      ) : (
                        renderFormattedText(msg.text, msg.id)
                      )}
                  </div>
                  {msg.sender === Sender.AI && renderGroundingChunks(msg.groundingChunks)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <footer className="p-4 text-center text-xs" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-primary)' }}>
        Shared from <a href="/" className="themed-link font-bold">NiallGPT</a>. Create your own conversations.
      </footer>
    </div>
  );
};
