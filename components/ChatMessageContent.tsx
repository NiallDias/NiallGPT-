

import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js';
import { TypingIndicator } from './TypingIndicator';
import { EyeIcon } from './icons/EyeIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

const CODE_BLOCK_REGEX = /^```(\w*?)\n([\s\S]*?)\n```$/gm;

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
  
      if (boldItalicText) {
        parts.push(<strong key={key}><em>{boldItalicText}</em></strong>);
      } else if (boldText) {
        parts.push(<strong key={key}>{boldText}</strong>);
      } else if (italicText) {
        parts.push(<em key={key}>{italicText}</em>);
      } else if (linkText && linkUrl) {
        parts.push(
          <a
            key={key}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="themed-link"
            aria-label={`Open link to ${linkText} in a new tab`}
          >
            {linkText}
          </a>
        );
      } else if (fullHashtag) {
        parts.push(<span key={key} className="hashtag-link">{fullHashtag}</span>);
      } else {
        parts.push(fullMatch);
      }
      
      lastIndex = combinedRegex.lastIndex;
    }
  
    if (lastIndex < lineContent.length) {
      parts.push(lineContent.substring(lastIndex));
    }
  
    return parts.length > 0 ? parts : [lineContent];
};

const renderTable = (tableMarkdown: string, messageId: string, tableKey: string): JSX.Element => {
    const rows = tableMarkdown.trim().split('\n');
    if (rows.length < 2) return <span key={tableKey}></span>;

    const headerContent = rows[0];
    const separatorLine = rows[1];
    const bodyContent = rows.slice(2);

    if (!separatorLine.match(/\|.*-.*\|/)) {
        return <pre key={tableKey}><code>{tableMarkdown}</code></pre>;
    }

    const parseRow = (row: string) => row.split('|').map(s => s.trim()).slice(1, -1);
    
    const headers = parseRow(headerContent);
    const bodyRows = bodyContent.map(row => parseRow(row)).filter(row => row.length === headers.length && row.some(cell => cell.trim() !== ''));
    
    const alignments = separatorLine.split('|').map(s => s.trim()).slice(1, -1).map(cell => {
        const hasLeftColon = cell.startsWith(':');
        const hasRightColon = cell.endsWith(':');
        if (hasLeftColon && hasRightColon) return 'center';
        if (hasRightColon) return 'right';
        return 'left';
    });

    return (
        <div key={tableKey} className="overflow-x-auto my-4 rounded-lg" style={{ border: '1px solid var(--border-primary)'}}>
            <table className="min-w-full text-sm" style={{ borderCollapse: 'collapse', backgroundColor: 'var(--bg-secondary)' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
                        {headers.map((header, i) => (
                            <th key={i} className="px-4 py-3 font-semibold text-left" style={{ textAlign: alignments[i], color: 'var(--text-accent)' }}>
                                {parseInlineMarkdown(header, `${tableKey}-th-${i}`)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {bodyRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
                            {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-3" style={{ textAlign: alignments[cellIndex] || 'left', color: 'var(--text-primary)' }}>
                                    {parseInlineMarkdown(cell, `${tableKey}-tr-${rowIndex}-td-${cellIndex}`)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const renderRegularTextSegment = (textSegment: string, messageId: string, segmentKeyPrefix: string): JSX.Element[] => {
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
      const [, , itemText] = orderedListItemMatch;
      const listItemBaseKey = `${segmentKeyPrefix}-li-${keyCounter++}`;
      currentList.items.push(<li key={listItemBaseKey} className="mb-1">{parseInlineMarkdown(itemText, listItemBaseKey)}</li>);
    } else if (unorderedListItemMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [], listKey: `${segmentKeyPrefix}-ul-${keyCounter++}` };
      }
      const [, itemText] = unorderedListItemMatch;
      const listItemBaseKey = `${segmentKeyPrefix}-li-${keyCounter++}`;
      currentList.items.push(<li key={listItemBaseKey} className="mb-1">{parseInlineMarkdown(itemText, listItemBaseKey)}</li>);
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
  
  if (elements.length === 0 && textSegment.trim() !== '') {
     const contentKey = `${segmentKeyPrefix}-single-p-content`;
     return [<p key={`${segmentKeyPrefix}-single-p`} className="my-1">{parseInlineMarkdown(textSegment, contentKey)}</p>];
  }

  return elements;
};

const renderTextWithTables = (text: string, messageId: string, segmentKeyPrefix: string): JSX.Element[] => {
    // This regex identifies a markdown table block. It looks for at least two lines that start and end with '|'.
    // The optional newline (\r?\n?) at the end of the pattern allows it to correctly capture tables
    // even if they are at the very end of the message and don't have a final newline character.
    const tableRegex = /(?:^|\n\n)((?:\|[^\n]+\|\r?\n?){2,})/g;
    const elements: JSX.Element[] = [];
    let lastIndex = 0;
    let match;
    let subSegmentIndex = 0;

    tableRegex.lastIndex = 0;
    while ((match = tableRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            elements.push(...renderRegularTextSegment(text.substring(lastIndex, match.index), messageId, `${segmentKeyPrefix}-subseg-${subSegmentIndex++}`));
        }

        const tableMarkdown = match[1];
        elements.push(renderTable(tableMarkdown, messageId, `${segmentKeyPrefix}-table-${subSegmentIndex++}`));
        
        lastIndex = tableRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        elements.push(...renderRegularTextSegment(text.substring(lastIndex), messageId, `${segmentKeyPrefix}-subseg-${subSegmentIndex++}`));
    }
    
    return elements;
};

interface ChatMessageContentProps {
    text: string;
    messageId: string;
    isLoading: boolean;
    currentAiMessageId: string | null;
    onCodeChange: (codeBlockIndex: number, newCode: string) => void;
    onPreview: (codeContent: string, codeBlockKey: string) => void;
    onCopyCode: (codeContent: string, codeBlockKey: string) => Promise<void>;
    copiedCodeKey: string | null;
}

export const ChatMessageContent: React.FC<ChatMessageContentProps> = React.memo(({
    text,
    messageId,
    isLoading,
    currentAiMessageId,
    onCodeChange,
    onPreview,
    onCopyCode,
    copiedCodeKey,
}) => {

    const CodeBlockRenderer: React.FC<{
        language: string;
        codeContent: string;
        codeBlockKey: string;
        onPreview: (codeContent: string, codeBlockKey: string) => void;
        onCopyCode: (codeContent: string, codeBlockKey: string) => Promise<void>;
        copiedCodeKey: string | null;
    }> = ({ language, codeContent, codeBlockKey, onPreview, onCopyCode, copiedCodeKey }) => {
        const codeRef = useRef<HTMLElement>(null);
        
        useEffect(() => {
            if (codeRef.current) {
                hljs.highlightElement(codeRef.current);
            }
        }, [codeContent, language]);

        const handlePreviewClick = () => onPreview(codeContent, codeBlockKey);
        const handleCopyClick = () => onCopyCode(codeContent, codeBlockKey);

        const CodeButton: React.FC<{onClick: () => void, children: React.ReactNode, title: string}> = ({ onClick, children, title }) => (
            <button
              onClick={onClick}
              title={title}
              aria-label={title}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all font-medium hover:scale-105"
              style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)'}
            >
              {children}
            </button>
        );

        return (
            <div className="my-3 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--code-block-bg)', border: '1px solid var(--code-block-border)' }}>
                <div className="flex justify-between items-center px-4 py-2 text-xs" style={{ backgroundColor: 'var(--code-block-header-bg)', color: 'var(--code-block-header-text)', borderBottom: '1px solid var(--code-block-border)' }}>
                    <span className="font-sans font-semibold uppercase tracking-wider">{language}</span>
                    <div className="flex items-center space-x-2">
                        {language === 'html' && (
                            <CodeButton onClick={handlePreviewClick} title="Preview HTML">
                                <EyeIcon className="w-4 h-4" /> <span>Preview</span>
                            </CodeButton>
                        )}
                        <CodeButton onClick={handleCopyClick} title={copiedCodeKey === codeBlockKey ? "Copied!" : "Copy code"}>
                            {copiedCodeKey === codeBlockKey ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                            <span>{copiedCodeKey === codeBlockKey ? 'Copied' : 'Copy'}</span>
                        </CodeButton>
                    </div>
                </div>
                <pre className="text-sm overflow-x-auto">
                    <code ref={codeRef} className={`language-${language} hljs`}>
                        {codeContent}
                    </code>
                </pre>
            </div>
        );
    };

    if (text.trim() === '...' && currentAiMessageId === messageId && isLoading) { 
        return <TypingIndicator />;
    }
  
    const elements: JSX.Element[] = [];
    CODE_BLOCK_REGEX.lastIndex = 0; 
    let lastIndex = 0;
    let match;
    let segmentIndex = 0;
    let codeBlockIndex = 0;
  
    while ((match = CODE_BLOCK_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const textSegment = text.substring(lastIndex, match.index);
        elements.push(...renderTextWithTables(textSegment, messageId, `${messageId}-seg-${segmentIndex++}`));
      }
  
      const language = match[1]?.toLowerCase() || 'code';
      const codeContent = match[2];
      const codeBlockKey = `${messageId}-code-${codeBlockIndex++}`;
  
      elements.push(
        <CodeBlockRenderer
          key={codeBlockKey}
          language={language}
          codeContent={codeContent}
          codeBlockKey={codeBlockKey}
          onPreview={onPreview}
          onCopyCode={onCopyCode}
          copiedCodeKey={copiedCodeKey}
        />
      );
      lastIndex = CODE_BLOCK_REGEX.lastIndex;
    }
    CODE_BLOCK_REGEX.lastIndex = 0;
  
    if (lastIndex < text.length) {
      const remainingTextSegment = text.substring(lastIndex);
      elements.push(...renderTextWithTables(remainingTextSegment, messageId, `${messageId}-seg-${segmentIndex++}`));
    }
    
    if (elements.length === 0 && text.trim() !== '') {
       return <>{renderTextWithTables(text, messageId, `${messageId}-seg-fallback`)}</>;
    }
    if (elements.length === 0 && text.trim() === '') {
      return <span key={`${messageId}-empty-render`}></span>;
    }
  
    return <>{elements}</>;
});
