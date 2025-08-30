import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { ChatMessage, Sender, ChatSession } from '../types';
import { 
  streamChatMessage, 
  generateImage,
  enhanceChatPrompt,
  PDF_DOWNLOAD_PLACEHOLDER,
  TXT_DOWNLOAD_PLACEHOLDER,
  HTML_DOWNLOAD_PLACEHOLDER,
  PPT_DOWNLOAD_PLACEHOLDER,
  MEMORY_WRITE_PLACEHOLDER
} from '../services/geminiService';
import { AppSettingsContext } from '../contexts/AppSettingsContext';
import { Part } from '@google/genai';
import jsPDF from 'jspdf';
import PptxGenJS from 'pptxgenjs';

export const useChatManager = (messagesEndRef: React.RefObject<HTMLDivElement>) => {
  const { 
    activeChatSessionId, 
    getActiveChatSession, 
    updateChatSessionMessages,
    updateStreamingMessage,
    completeStreamingMessage,
    currentTheme, 
    userName: globalUserName, 
    aiBehavior: globalAiBehavior, 
    memory,
    addMemoryItem,
  } = useContext(AppSettingsContext);

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAiMessageId, setCurrentAiMessageId] = useState<string | null>(null);
  const accumulatedTextRef = useRef<string>('');
  
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const recognitionStartInputRef = useRef<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [isFileReading, setIsFileReading] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  
  const stopStreamControllerRef = useRef<AbortController | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [htmlPreviewContent, setHtmlPreviewContent] = useState<string>('');
  const [htmlPreviewTarget, setHtmlPreviewTarget] = useState<{ messageId: string, codeBlockKey: string } | null>(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [isWebSearchModeActive, setIsWebSearchModeActive] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);

  const activeSession = getActiveChatSession();
  const messages = activeSession?.messages || [];
  
  const currentSessionUserName = activeSession?.sessionUserName ?? globalUserName;
  const currentSessionAiBehavior = activeSession?.sessionAiBehavior ?? globalAiBehavior;

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    // Focus logic would need to be handled in the component if required
  };

  const handleImagineCommand = useCallback(async (prompt: string) => {
    if (!activeChatSessionId || isLoading) return;
    setIsLoading(true); setError(null);
    const userMessage: ChatMessage = { id: crypto.randomUUID(), text: `/imagine ${prompt}`, sender: Sender.User, timestamp: Date.now() };
    const aiMessageId = crypto.randomUUID();
    const aiThinkingMessage: ChatMessage = { id: aiMessageId, text: `_Imagining: "${prompt}"_`, sender: Sender.AI, timestamp: Date.now(), isLoading: true };
    const currentMessages = getActiveChatSession()?.messages ?? [];
    updateChatSessionMessages(activeChatSessionId, [...currentMessages, userMessage, aiThinkingMessage]);
    try {
        const imageUrl = await generateImage(prompt, '1:1');
        const aiImageMessage: ChatMessage = { id: aiMessageId, text: `Image generated for: "${prompt}"`, sender: Sender.AI, timestamp: Date.now(), isLoading: false, imageUrl: imageUrl };
        updateChatSessionMessages(activeChatSessionId, [...currentMessages, userMessage, aiImageMessage]);
    } catch (err) {
        const errorText = err instanceof Error ? err.message : "An unknown error occurred.";
        const aiErrorMessage: ChatMessage = { id: aiMessageId, text: `Sorry, I couldn't generate the image. Error: ${errorText}`, sender: Sender.AI, timestamp: Date.now(), isLoading: false };
        updateChatSessionMessages(activeChatSessionId, [...currentMessages, userMessage, aiErrorMessage]);
        setError(`Image generation failed: ${errorText}`);
    } finally {
        setIsLoading(false);
    }
  }, [activeChatSessionId, isLoading, getActiveChatSession, updateChatSessionMessages]);

  const sendChatMessageWrapper = useCallback(async (
    messageContent: Part[], 
    userMessageText: string, 
    history: ChatMessage[], 
    attachmentDetails: ChatMessage['attachment'] | undefined, 
    options: {
        isRegeneration?: boolean;
        aiMessageIdToUpdate?: string; // Must be provided for regeneration
        searchOverride?: boolean;
    }
  ) => {
    if (!activeChatSessionId) return;

    const aiMessageId = options.aiMessageIdToUpdate || crypto.randomUUID();
    
    if (isLoading && !options.isRegeneration) return; // Prevent multiple new messages at once
    
    setIsLoading(true); 
    setError(null); 
    accumulatedTextRef.current = ''; 
    setCurrentAiMessageId(aiMessageId);

    if (!options.isRegeneration) {
        const userMessage: ChatMessage = { id: crypto.randomUUID(), text: userMessageText, sender: Sender.User, timestamp: Date.now(), isVoiceInput: false, attachment: attachmentDetails };
        const aiPlaceholderMessage: ChatMessage = { id: aiMessageId, text: '...', sender: Sender.AI, timestamp: Date.now(), isLoading: true };
        updateChatSessionMessages(activeChatSessionId, [...history, userMessage, aiPlaceholderMessage]);
    }
    
    const controller = new AbortController();
    stopStreamControllerRef.current = controller;
    let isFirstChunk = true;
    
    const searchEnabled = options.searchOverride !== undefined ? options.searchOverride : isWebSearchModeActive;

    try {
        await streamChatMessage(
          messageContent,
          history,
          (textChunk, groundingChunks) => { 
            accumulatedTextRef.current += textChunk;
            if (activeChatSessionId) {
              updateStreamingMessage(activeChatSessionId, aiMessageId, textChunk, isFirstChunk, groundingChunks);
              if (isFirstChunk) isFirstChunk = false;
            }
          },
          (err) => { 
            setError(`Error: ${err.message}. Please try again.`);
            if (activeChatSessionId) completeStreamingMessage(activeChatSessionId, aiMessageId, `[Error: ${err.message}]`, true);
          },
          (wasAborted) => { 
            let finalFullText = accumulatedTextRef.current;
            let suggestions: string[] | undefined = undefined;

            const suggestionsRegex = /\[NiallGPT_Suggestions:([^\]]+)\]/g;
            finalFullText = finalFullText.replace(suggestionsRegex, (match, suggestionsContent) => {
                if (suggestionsContent) {
                    suggestions = suggestionsContent.split('|').map((s: string) => s.trim().replace(/^"|"$/g, ''));
                }
                return '';
            }).trim();

            const memoryRegex = /\[NiallGPT_Remember:(.*?)\]/g;
            finalFullText = finalFullText.replace(memoryRegex, (match, memoryContent) => {
                if (memoryContent) addMemoryItem(memoryContent.trim());
                return '';
            }).trim();

            if (activeChatSessionId) completeStreamingMessage(activeChatSessionId, aiMessageId, finalFullText, wasAborted, suggestions);
            setCurrentAiMessageId(null); 
            setIsLoading(false); 
            setError(null);
            stopStreamControllerRef.current = null;
            if (!options.isRegeneration && searchEnabled) {
                setIsWebSearchModeActive(false);
            }
          },
          currentSessionUserName,
          currentSessionAiBehavior,
          memory,
          controller.signal,
          searchEnabled
        );
    } catch (err) {
        setIsLoading(false); 
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        if (activeChatSessionId) completeStreamingMessage(activeChatSessionId, aiMessageId, `[Error processing request]`, true);
        setCurrentAiMessageId(null);
    }
  }, [activeChatSessionId, isLoading, currentSessionUserName, currentSessionAiBehavior, memory, isWebSearchModeActive, addMemoryItem, completeStreamingMessage, updateChatSessionMessages, updateStreamingMessage]);

  const handleSendMessage = useCallback(async () => {
    const currentInput = input.trim();
    if ((currentInput === '' && !selectedFile) || isLoading || !activeChatSessionId || isFileReading) return;
    
    if (currentInput.toLowerCase().startsWith('/imagine ')) {
        const prompt = currentInput.substring(9).trim();
        setInput('');
        if (prompt) handleImagineCommand(prompt);
        else setError("Please provide a prompt after /imagine.");
        return;
    }

    const apiPayloadParts: Part[] = [];
    let userMessageText = currentInput;

    if (selectedFile && selectedFileType && selectedFileContent) {
        // For multimodal prompts, the text part should be first if it exists
        if (userMessageText) {
            apiPayloadParts.push({ text: userMessageText });
        }
        
        if (selectedFileType.startsWith('image/')) {
            apiPayloadParts.push({ inlineData: { mimeType: selectedFile.type, data: selectedFileContent.split(',')[1] } });
        } else if (selectedFileType === 'text/plain') {
            // For text files, the file content can be prepended to the user's prompt text to give context
            const fileContext = `The user has attached the following file named "${selectedFile.name}":\n\n\`\`\`\n${selectedFileContent}\n\`\`\`\n\n${userMessageText}`;
            apiPayloadParts[0] = { text: fileContext }; // Replace the text part
        }
    } else {
        apiPayloadParts.push({ text: userMessageText });
    }
    
    let attachmentForMessage: ChatMessage['attachment'] | undefined;
    if(selectedFile && selectedFileContent) {
        attachmentForMessage = { name: selectedFile.name, type: selectedFile.type, previewUrl: filePreviewUrl, content: selectedFileContent };
    }

    setInput(''); setSelectedFile(null); setFilePreviewUrl(null); setSelectedFileContent(null); setSelectedFileType(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (textInputRef.current) textInputRef.current.value = "";
    
    await sendChatMessageWrapper(apiPayloadParts, userMessageText, messages, attachmentForMessage, { isRegeneration: false });
  }, [input, selectedFile, isLoading, isFileReading, activeChatSessionId, selectedFileContent, selectedFileType, handleImagineCommand, sendChatMessageWrapper, messages, filePreviewUrl]);

  const handleStopGenerating = () => stopStreamControllerRef.current?.abort();

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEditInputKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  const toggleRecording = useCallback(async () => {
    if (!recognitionRef.current) { setError('Speech recognition is not available.'); return; }
    if (isRecording) {
      recognitionRef.current.manualStop = true;
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            recognitionStartInputRef.current = input;
            recognitionRef.current.start(); 
            setIsRecording(true); 
            setError(null);
        } catch (permError) {
            setError('Microphone permission denied.'); setIsRecording(false);
        }
    }
  }, [isRecording, input]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError("File is too large (max 4MB)."); return; }
    
    setIsFileReading(true); setSelectedFile(file); setSelectedFileType(file.type); setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const content = reader.result as string;
      setSelectedFileContent(content);
      if (file.type.startsWith('image/')) setFilePreviewUrl(content);
      else setFilePreviewUrl(null);
      setIsFileReading(false);
    };
    reader.onerror = () => {
        setError('Failed to read file.');
        setIsFileReading(false);
    }
    if (file.type.startsWith('image/')) reader.readAsDataURL(file);
    else if (file.type === 'text/plain') reader.readAsText(file);
    else { setError(`Unsupported file type: ${file.type}.`); setSelectedFile(null); setIsFileReading(false); }
  }, []);

  const removeSelectedFile = useCallback(() => {
    setSelectedFile(null); setFilePreviewUrl(null); setSelectedFileContent(null); setSelectedFileType(null); setIsFileReading(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (textInputRef.current) textInputRef.current.value = "";
  }, []);

  const toggleSpeakMessage = useCallback((message: ChatMessage) => {
    if (speakingMessageId === message.id) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        return;
    }
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    let textToSpeak = message.text.replace(/\[NiallGPT_.*?_Link\]/g, '').replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g, '$1').replace(/```[\s\S]*?```/g, 'Code block.');
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => { setError('Could not play audio.'); setSpeakingMessageId(null); };
    window.speechSynthesis.speak(utterance);
    setSpeakingMessageId(message.id);
  }, [speakingMessageId]);
  
  const handleEditMessage = (message: ChatMessage) => {
    let textForEditing = (message.originalText || message.text).replace(/\[NiallGPT_.*?_Link\]/g, '').trim();
    setEditingMessageId(message.id);
    setEditingText(textForEditing);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };
  
  const handleSaveEdit = useCallback(async () => {
      if (!editingMessageId || !activeChatSessionId) return;
      const session = getActiveChatSession();
      if (!session) return;
  
      const messageIndex = session.messages.findIndex(msg => msg.id === editingMessageId);
      if (messageIndex === -1) return;
  
      const originalMessage = session.messages[messageIndex];
      const originalTextContent = originalMessage.originalText || originalMessage.text;
  
      if (originalTextContent.trim() === editingText.trim()) {
          handleCancelEdit();
          return;
      }
  
      // Truncate the history at the point of the edit
      const historyForCall = session.messages.slice(0, messageIndex);
      
      const editedUserMessage: ChatMessage = { 
          ...originalMessage, 
          text: editingText.trim(), 
          isEdited: true, 
          originalText: originalTextContent, 
          timestamp: Date.now() 
      };
  
      const aiMessageId = crypto.randomUUID();
      const aiPlaceholderMessage: ChatMessage = { id: aiMessageId, text: '...', sender: Sender.AI, timestamp: Date.now(), isLoading: true };
  
      // Update the session state immediately, removing all subsequent messages
      updateChatSessionMessages(activeChatSessionId, [...historyForCall, editedUserMessage, aiPlaceholderMessage]);
  
      const apiPayloadParts: Part[] = [{ text: editedUserMessage.text }];
      if (editedUserMessage.attachment?.content) {
          if (editedUserMessage.attachment.type.startsWith('image/')) {
              const base64Data = editedUserMessage.attachment.content.split(',')[1];
              apiPayloadParts.push({ inlineData: { mimeType: editedUserMessage.attachment.type, data: base64Data } });
          } else if (editedUserMessage.attachment.type === 'text/plain') {
              const fileContext = `The user has attached the following file named "${editedUserMessage.attachment.name}":\n\n\`\`\`\n${editedUserMessage.attachment.content}\n\`\`\`\n\n${editedUserMessage.text}`;
              apiPayloadParts[0] = { text: fileContext };
          }
      }
  
      setEditingMessageId(null); 
      setEditingText('');
  
      // Manually orchestrate the stream call
      setIsLoading(true); 
      setError(null); 
      accumulatedTextRef.current = ''; 
      setCurrentAiMessageId(aiMessageId);
      
      const controller = new AbortController();
      stopStreamControllerRef.current = controller;
      let isFirstChunk = true;
  
      try {
          await streamChatMessage(
              apiPayloadParts,
              historyForCall,
              (textChunk, groundingChunks) => { 
                  accumulatedTextRef.current += textChunk;
                  if (activeChatSessionId) updateStreamingMessage(activeChatSessionId, aiMessageId, textChunk, isFirstChunk, groundingChunks);
                  if (isFirstChunk) isFirstChunk = false;
              },
              (err) => { 
                  setError(`Error: ${err.message}. Please try again.`);
                  if (activeChatSessionId) completeStreamingMessage(activeChatSessionId, aiMessageId, `[Error: ${err.message}]`, true);
              },
              (wasAborted) => { 
                  let finalFullText = accumulatedTextRef.current;
                  let suggestions: string[] | undefined = undefined;
                  
                  const suggestionsRegex = /\[NiallGPT_Suggestions:([^\]]+)\]/g;
                  finalFullText = finalFullText.replace(suggestionsRegex, (match, suggestionsContent) => {
                      if (suggestionsContent) {
                          suggestions = suggestionsContent.split('|').map((s: string) => s.trim().replace(/^"|"$/g, ''));
                      }
                      return '';
                  }).trim();

                  const memoryRegex = /\[NiallGPT_Remember:(.*?)\]/g;
                  finalFullText = finalFullText.replace(memoryRegex, (match, memoryContent) => {
                      if (memoryContent) addMemoryItem(memoryContent.trim());
                      return '';
                  }).trim();
                  if (activeChatSessionId) completeStreamingMessage(activeChatSessionId, aiMessageId, finalFullText, wasAborted, suggestions);
                  setCurrentAiMessageId(null); 
                  setIsLoading(false); 
                  setError(null);
                  stopStreamControllerRef.current = null;
              },
              currentSessionUserName,
              currentSessionAiBehavior,
              memory,
              controller.signal,
              isWebSearchModeActive 
          );
      } catch (err) {
          setIsLoading(false); 
          setError(err instanceof Error ? err.message : "An unexpected error occurred.");
          if (activeChatSessionId) completeStreamingMessage(activeChatSessionId, aiMessageId, `[Error processing request]`, true);
          setCurrentAiMessageId(null);
      }
  
  }, [editingMessageId, editingText, activeChatSessionId, getActiveChatSession, updateChatSessionMessages, currentSessionUserName, currentSessionAiBehavior, memory, isWebSearchModeActive, addMemoryItem, completeStreamingMessage, updateStreamingMessage]);

  const handleRegenerateResponse = useCallback(async (aiMessageToRegenerate: ChatMessage) => {
    if (isLoading || !activeChatSessionId || !activeSession) return;
    const messageIndex = activeSession.messages.findIndex(msg => msg.id === aiMessageToRegenerate.id);
    if (messageIndex <= 0) return;
    const userMessage = activeSession.messages[messageIndex - 1];
    if (userMessage.sender !== Sender.User) { setError("Could not find the original user prompt."); return; }
    
    // Clear the old AI message text before regenerating
    const messagesWithPlaceholder = activeSession.messages.map(msg => 
      msg.id === aiMessageToRegenerate.id ? { ...msg, text: '...', isLoading: true, groundingChunks: [] } : msg
    );
    updateChatSessionMessages(activeChatSessionId, messagesWithPlaceholder);

    const historyForRegen = activeSession.messages.slice(0, messageIndex - 1);
    
    const apiPayloadParts: Part[] = [];
    let userMessageText = userMessage.text;

    if (userMessage.attachment?.content) {
        if (userMessageText) {
            apiPayloadParts.push({ text: userMessageText });
        }
        if (userMessage.attachment.type.startsWith('image/')) {
            const base64Data = userMessage.attachment.content.split(',')[1];
            apiPayloadParts.push({ inlineData: { mimeType: userMessage.attachment.type, data: base64Data } });
        } else if (userMessage.attachment.type === 'text/plain') {
            const fileContext = `The user has attached the following file named "${userMessage.attachment.name}":\n\n\`\`\`\n${userMessage.attachment.content}\n\`\`\`\n\n${userMessageText}`;
            apiPayloadParts[0] = { text: fileContext };
        }
    } else {
        apiPayloadParts.push({ text: userMessageText });
    }

    const forceSearch = isWebSearchModeActive || (aiMessageToRegenerate.groundingChunks?.length ?? 0) > 0;
    
    await sendChatMessageWrapper(apiPayloadParts, userMessage.text, historyForRegen, userMessage.attachment, {
        isRegeneration: true,
        aiMessageIdToUpdate: aiMessageToRegenerate.id,
        searchOverride: forceSearch
    });

  }, [isLoading, activeChatSessionId, activeSession, isWebSearchModeActive, sendChatMessageWrapper, updateChatSessionMessages]);

  const handleDownloadFile = useCallback((content: string, filename: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  }, []);
  
  const handleDownloadPdf = useCallback((textContent: string) => {
      const pdf = new jsPDF();
      const textWithoutCode = textContent.replace(/^```(\w*?)\n([\s\S]*?)\n```$/gm, '\n(Code block omitted from PDF)\n');
      const lines = pdf.splitTextToSize(textWithoutCode, 180); 
      let cursorY = 10;
      lines.forEach((line: string) => {
        if (cursorY > 280) { pdf.addPage(); cursorY = 10; }
        pdf.text(line, 10, cursorY);
        cursorY += 7;
      });
      pdf.save(`NiallGPT_document_${Date.now()}.pdf`);
  }, []);
  
  const handleDownloadPpt = useCallback((markdownContent: string) => {
    try {
        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16X9';
        pptx.author = "NiallGPT";

        const slidesMarkdown = markdownContent.split(/\n---\s*slide\s*---\n/i);

        slidesMarkdown.forEach((slideMarkdown, index) => {
            if (slideMarkdown.trim() === '') return;

            const slide = pptx.addSlide();
            const lines = slideMarkdown.trim().split('\n');
            let hasTitle = false;
            let hasSubtitle = false;

            const bodyContent: PptxGenJS.TextProps[] = [];

            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;

                if (!hasTitle && trimmedLine.startsWith('# ')) {
                    const titleText = trimmedLine.substring(2);
                    slide.addText(titleText, { 
                        x: 0.5, y: 0.5, w: '90%', h: 1, 
                        fontSize: 32, bold: true, align: 'center' 
                    });
                    if (index === 0 && !pptx.title) pptx.title = titleText.substring(0, 50);
                    hasTitle = true;
                } else if (!hasSubtitle && trimmedLine.startsWith('## ')) {
                    const subtitleText = trimmedLine.substring(3);
                    slide.addText(subtitleText, {
                        x: 0.5, y: 1.25, w: '90%', h: 0.75,
                        fontSize: 24, align: 'center'
                    });
                    hasSubtitle = true;
                } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
                    bodyContent.push({
                        text: trimmedLine.substring(2),
                        options: { bullet: true, indentLevel: 1, breakLine: true }
                    });
                } else {
                    bodyContent.push({
                        text: trimmedLine,
                        options: { breakLine: true }
                    });
                }
            });

            if (bodyContent.length > 0) {
                slide.addText(bodyContent, {
                    x: 0.75, y: 2.5, w: '85%', h: '55%',
                    fontSize: 18, color: "363636", valign: 'top'
                });
            }
        });
        
        if (slidesMarkdown.filter(s => s.trim() !== '').length === 0) {
            setError("The content for the PPT was empty or incorrectly formatted.");
            return;
        }

        if (!pptx.title) pptx.title = "NiallGPT_Presentation";

        pptx.writeFile({ fileName: `${pptx.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pptx` });

    } catch (e) {
        console.error("Error generating PPTX:", e);
        setError("An error occurred while creating the PowerPoint presentation.");
    }
  }, []);

  const handleCodeChange = (messageId: string, codeBlockIndex: number, newCode: string) => {
    // This functionality for inline code editing seems incomplete.
    console.log('handleCodeChange called but not implemented', { messageId, codeBlockIndex, newCode });
  };

  const handlePreviewClick = useCallback((codeContent: string, codeBlockKey: string) => {
    setHtmlPreviewContent(codeContent);
    // The messageId part of the target seems to be unused, but we keep the structure
    setHtmlPreviewTarget({ messageId: '', codeBlockKey: codeBlockKey });
    setIsPreviewModalOpen(true);
  }, []);

  const handleCopyCodeClick = useCallback(async (codeContent: string, codeBlockKey: string) => {
    await navigator.clipboard.writeText(codeContent);
    setCopiedCodeKey(codeBlockKey);
    setTimeout(() => setCopiedCodeKey(null), 2000);
  }, []);

  const handleCopyResponse = useCallback((message: ChatMessage) => {
    navigator.clipboard.writeText(message.text.replace(/\[NiallGPT_.*?_Link\]/g, '').trim());
    setCopiedMessageId(message.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  }, []);

  const handleEnhanceChatPrompt = useCallback(async () => {
    if (!input.trim() || isLoading || isEnhancing) return;
    const originalInput = input;
    setIsEnhancing(true);
    setError(null);
    try {
        const enhanced = await enhanceChatPrompt(input);
        setInput(enhanced);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get prompt suggestion.');
        setInput(originalInput);
    } finally {
        setIsEnhancing(false);
    }
  }, [input, isLoading, isEnhancing]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interim_transcript = '';
        let final_transcript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript_part = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                final_transcript += transcript_part;
            } else {
                interim_transcript += transcript_part;
            }
        }
        
        setInput(recognitionStartInputRef.current + final_transcript + interim_transcript);
        
        if (final_transcript) {
            recognitionStartInputRef.current += final_transcript;
        }
      };

      recognitionRef.current.onend = () => {
        if (!recognitionRef.current.manualStop) {
          setIsRecording(false);
        }
        recognitionRef.current.manualStop = false;
        recognitionStartInputRef.current = '';
      };

      recognitionRef.current.onerror = (event: any) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };
    }
  }, []);
  
  const isGeneratingStream = currentAiMessageId !== null && isLoading;

  return {
    state: {
      input,
      isLoading,
      isGeneratingStream,
      error,
      currentAiMessageId,
      isRecording,
      selectedFile,
      filePreviewUrl,
      selectedFileContent,
      selectedFileType,
      isFileReading,
      speakingMessageId,
      editingMessageId,
      editingText,
      isPreviewModalOpen,
      htmlPreviewContent,
      htmlPreviewTarget,
      copiedCodeKey,
      isWebSearchModeActive,
      copiedMessageId,
      isEnhancing,
      activeSession,
      messages,
    },
    actions: {
      setInput,
      handleSendMessage,
      handleKeyPress,
      handleStopGenerating,
      toggleRecording,
      handleFileUpload,
      removeSelectedFile,
      imageInputRef,
      textInputRef,
      setIsWebSearchModeActive,
      handleSuggestionClick,
      handleEditMessage,
      handleRegenerateResponse,
      toggleSpeakMessage,
      handleCopyResponse,
      handleDownloadFile,
      handleDownloadPdf,
      handleDownloadPpt,
      handleCodeChange,
      handlePreviewClick,
      handleCopyCodeClick,
      handleSaveEdit,
      handleCancelEdit,
      setEditingText,
      handleEditInputKeyPress,
      setIsPreviewModalOpen,
      setHtmlPreviewTarget,
      handleEnhanceChatPrompt,
    }
  };
};