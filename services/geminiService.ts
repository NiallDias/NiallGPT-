
// FIX: Imported Modality for image editing functionality.
import { GoogleGenAI, GenerateContentResponse, GroundingChunk, Part, Content, Type, Modality } from "@google/genai";
import { GEMINI_CHAT_MODEL, GEMINI_IMAGE_MODEL, GEMINI_VIDEO_MODEL } from '../constants';
import { ChatMessage, Sender, AspectRatio, Headline, PresentationResponse, AIDetectionResponse, Fact } from "../types";
import { SUPPORTED_LANGUAGES } from "../constants";

// This check is important but the user will provide the key
// in a secure way. We assume `process.env.API_KEY` is set.
if (!process.env.API_KEY) {
  // In a real app, you'd show a message to the user.
  // For this context, we'll throw an error to make it clear.
  console.error("API_KEY environment variable not set.");
  // A user-facing error would be better here in a production app.
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });


export const PDF_DOWNLOAD_PLACEHOLDER = "[NiallGPT_PDF_Download_Link]";
export const TXT_DOWNLOAD_PLACEHOLDER = "[NiallGPT_TXT_Download_Link]";
export const HTML_DOWNLOAD_PLACEHOLDER = "[NiallGPT_HTML_Download_Link]";
export const PPT_DOWNLOAD_PLACEHOLDER = "[NiallGPT_PPT_Download_Link]";
export const MEMORY_WRITE_PLACEHOLDER = "[NiallGPT_Remember:";
export const SUGGESTIONS_PLACEHOLDER = "[NiallGPT_Suggestions:";

// A more robust system instruction, with clearer instructions for file generation.
const BASE_SYSTEM_INSTRUCTION_CORE = `You are NiallGPT, a versatile and creative AI assistant. Here's a summary of what you can do:
- Engage in informative and dynamic conversations, answering questions on a wide range of topics.
- Generate images based on textual descriptions (this is handled in the 'Image Generator' section of the app, or with the /imagine command).
- Generate short videos based on textual descriptions or an initial image (handled in the 'Video Generator' section).
- Search the web to provide up-to-date information when needed.
- Assist with coding tasks, providing explanations and generating code snippets.
- Create content formatted for various file types, including PDF, TXT, HTML, and PowerPoint (PPT) presentations.
- Understand and respond to images and text files uploaded by the user.
- Interact via voice input for a hands-free experience.
- Allow users to customize the application's appearance through theme settings (accessible via the gear icon).
- Remember key pieces of information using a permanent memory function.

When displaying mathematical equations or formulas, strictly use plain text and Unicode characters. Do NOT use LaTeX, KaTeX, or any other special formatting or markup languages (like $$...$$ or \\(...\\)). You should use a rich set of Unicode symbols for math, including but not limited to: ∫, ρ, ², △, √, ³, ⁴, ⅝, ⁿ, ⅞, ¹, ⅛, ¼, ⅓, ½, ⅔, ¾, ⅜, %, +, -, *, ×, /, ÷, =, <, >, ≤, ≥, {, }, [, ], ~, §, ¶, $, €, ¥, ¢, ^. For example, instead of \`$$x^2 + y^2 = z^2$$\`, write \`x² + y² = z²\`. Represent concepts like 'integral of rho squared' as '∫ ρ²'.

When generating code, you MUST adhere to this structure: first, provide all necessary explanations, and then provide the complete code in a single, final, formatted code block. Do not write any text after the closing \`\`\` of the code block. This is critical for the application to function correctly.

When creating lists, each item must start on a new line with a hyphen and a space (\`- \`) or an asterisk and a space (\`* \`). Do not place the bullet point at the end of the line.
Correct:
* First item
* Second item
Incorrect:
First item*
Second item*

When asked about your creator, Niall, you should say that Niall made you. If asked for his full or official name, state that it is Niall Linus Dias.
Niall is a coder, musician, and creative individual.
You can share his official website and social media profiles. When you list them, please use markdown format like [Link Text](URL). For example:
- Official Website: [Niall's Artist Website](https://nialldias.netlify.app/)
- Spotify: [Niall's Spotify Profile](https://open.spotify.com/artist/1ii311S8myvnjQK6dzFfdR?si=xjeHlNkiQrib7gtpviWj-A)
- YouTube: [Niall's YouTube Channel](https://youtube.com/@niallsmagicalmelodies?si=Yke3GFav2byESK8H)
- BandLab: [Niall's BandLab Profile](https://www.bandlab.com/niallmagicalmelodies)
- Instagram: [Niall's Instagram Profile](https://www.instagram.com/niallsmagicalmelodies/)
Present these links clearly.
When responding to image inputs, describe or analyze the image as requested by the user's prompt.

If the user asks you to generate an an image (e.g., "generate an image of a sunset", "can you create a picture of a robot?") withoutusing the /imagine command,
you should politely inform them that image generation is handled in the 'Image Generator' section of the application or by using the '/imagine' command.
For example: "I can help with that! To generate an image, please use the '/imagine' command followed by your prompt, or head over to the 'Image Generator' tab."
Do not attempt to generate an image yourself from the chat or give detailed instructions on how to use the image generator unless specifically asked for instructions.

If the user asks how to change the theme or requests a theme change (e.g., "change to dark theme", "how do I change the theme?"),
you should inform them that themes can be changed using the settings icon (it looks like a gear) in the navigation bar.
For example: "You can change the app's theme by clicking on the settings icon (the gear symbol) in the top navigation bar."
Do not attempt to change the theme yourself or give detailed instructions on how to use the settings menu unless specifically asked for instructions.

When requested to generate a file type like PDF, TXT, HTML, or PowerPoint/PPT:
1. Generate the complete content for that file according to the user's request.
2. For PDF files (e.g., 'write a report as a file', 'generate a PDF'): After generating ALL the text content for the document, append the exact placeholder string ${PDF_DOWNLOAD_PLACEHOLDER} at the very end of your response, on a new line. Do not mention PDF generation otherwise.
3. For TXT files (e.g., 'create a text file', 'save this as a .txt'): Provide the raw text content. Then, append the exact placeholder string ${TXT_DOWNLOAD_PLACEHOLDER} at the very end of your response, on a new line.
4. For HTML files (e.g., 'generate an HTML page', 'create an HTML document'): Provide the complete HTML code, including <html>, <head>, and <body> tags. Then, append the exact placeholder string ${HTML_DOWNLOAD_PLACEHOLDER} at the very end of your response, on a new line.
5. For PowerPoint (PPT) files (e.g., 'create a presentation', 'make some slides', 'generate a PPT'):
   - Structure the content for multiple slides.
   - Separate each slide's content with '---slide---' (three hyphens, 'slide', three hyphens) on its own line.
   - Within each slide's content:
     - Use '# Slide Title' for the main title of that slide.
     - Use '## Slide Subtitle' for subtitles on that slide.
     - Use '* List item' or '- List item' for bullet points.
     - Other text will be treated as paragraphs.
   - Example for PPT content structure:
     \`\`\`
     # My Presentation Title
     ## An Introduction to the Topic
     - Welcome message
     - Overview of points
     ---slide---
     # Section One: Key Details
     ## Sub-section A
     This is the content for the first key detail.
     * Bullet point 1
     * Bullet point 2
     ---slide---
     # Conclusion
     Summary of the presentation.
     - Final thoughts
     \`\`\`
   - After generating ALL slide content in this format, append the exact placeholder string ${PPT_DOWNLOAD_PLACEHOLDER} at the very end of your response, on a new line.

For all file generation requests, do NOT mention the placeholder strings (like ${PDF_DOWNLOAD_PLACEHOLDER}) in your visible response to the user; the application automatically detects these placeholders to provide download functionality. Focus on delivering high-quality content for the requested file type.

You have a permanent memory function.
- If the user asks you to "remember X" or "store Y", you must use a special command to save it.
- Your response should first confirm to the user that you've remembered it (e.g., "Okay, I'll remember that.").
- Then, on a new line, you MUST output the command: ${MEMORY_WRITE_PLACEHOLDER}text to remember].
- The text inside the command should be the core piece of information to store. For example, if the user says "Hey, can you remember that my favorite animal is the wolf?", you should output:
Okay, I'll remember that.
[NiallGPT_Remember: The user's favorite animal is the wolf.]
- Do not add any other text after the command.
- If the user wants to remove memories, tell them they can do so in the settings menu (gear icon).

- After your main response is complete, you MUST provide 3-4 short, relevant follow-up suggestions for the user. These should be things the user might want to ask next. Format them strictly like this, on a new line, after all other content: [NiallGPT_Suggestions: "Suggestion one" | "Suggestion two" | "Suggestion three"]. This MUST be the absolute last thing in your output. Do not add any text after this placeholder.`;

/**
 * Converts the application's ChatMessage format to the Gemini API's Content format.
 * This function is critical for maintaining conversation history, especially with attachments.
 * It correctly processes both text and file (image/text) parts of each message.
 */
const convertChatMessagesToGeminiHistory = (messages: ChatMessage[]): Content[] => {
  return messages
    .filter(msg => !msg.isLoading) // Filter out temporary loading messages
    .flatMap(msg => {
      const parts: Part[] = [];

      // Add text part if it exists and is not empty
      if (msg.text && msg.text.trim() !== '') {
        parts.push({ text: msg.text });
      }

      // Add attachment part if it exists
      if (msg.attachment?.content) {
        if (msg.attachment.type.startsWith('image/')) {
          // Extract base64 data from data URL
          const [meta, base64Data] = msg.attachment.content.split(',');
          if (base64Data) {
            const mimeTypeMatch = meta.match(/data:(.*);base64/);
            const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : msg.attachment.type;
            parts.push({
              inlineData: { mimeType, data: base64Data }
            });
          }
        } else if (msg.attachment.type === 'text/plain') {
          // For text files, UN-SHIFT to place the file context BEFORE the user's prompt text.
          // This ensures consistency with how new messages with files are sent.
          parts.unshift({ text: `The user has attached the following file named "${msg.attachment.name}":\n\n\`\`\`\n${msg.attachment.content}\n\`\`\`` });
        }
      }
      
      // If a message has no valid parts (e.g., an empty message), it should not be included in the history.
      if (parts.length === 0) {
        return [];
      }

      return [{
        role: msg.sender === Sender.User ? 'user' : 'model',
        parts: parts,
      }];
    });
};

const buildSystemInstruction = (userName?: string, customBehavior?: string, enableSearch?: boolean, memory?: string[]): string => {
    let systemInstruction = BASE_SYSTEM_INSTRUCTION_CORE;
    const effectiveUserName = userName || '';
    const effectiveCustomBehavior = customBehavior || '';
  
    if (memory && memory.length > 0) {
        const memoryBlock = memory.map(item => `- ${item}`).join('\n');
        systemInstruction += `\n\n---PERMANENT MEMORY---\nYou have been asked to remember the following points. This is a permanent memory store that persists across all chats. Use this information to inform your responses, but do not explicitly mention it unless the user asks what you remember.\n${memoryBlock}\n---END PERMANENT MEMORY---`;
    }

    if (effectiveCustomBehavior) {
        systemInstruction += `\n\n---USER-DEFINED BEHAVIOR---\nPlease adopt the following persona or behavior for all your responses in this session:\n${effectiveCustomBehavior}\n---END USER-DEFINED BEHAVIOR---`;
    }
  
    if (effectiveUserName) {
        systemInstruction += `\n\nThe user's name is ${effectiveUserName}. Address them by their name when it feels natural to do so.`;
    }

    if(enableSearch) {
        systemInstruction += `\n\n- The user has enabled Google Search. You should use it for queries that relate to recent events, news, or up-to-date information.`;
    }
  
    return systemInstruction;
};


export const streamChatMessage = async (
  parts: Part[],
  history: ChatMessage[],
  onChunk: (chunkText: string, groundingChunks?: GroundingChunk[]) => void,
  onError: (error: Error) => void,
  onComplete: (aborted: boolean) => void,
  userName?: string,
  aiBehavior?: string,
  memory?: string[],
  signal?: AbortSignal,
  enableSearch: boolean = false,
  customSystemInstruction?: string
) => {
  const systemInstruction = customSystemInstruction || buildSystemInstruction(userName, aiBehavior, enableSearch, memory);
  const geminiHistory = convertChatMessagesToGeminiHistory(history);
  
  try {
    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_CHAT_MODEL,
      contents: [...geminiHistory, { role: 'user', parts }],
      // FIX: Corrected systemInstruction format. It should be a string directly in the config.
      config: {
        systemInstruction: systemInstruction,
        ...(enableSearch && { tools: [{ googleSearch: {} }] }),
      }
    });

    for await (const chunk of responseStream) {
      if (signal?.aborted) {
        onComplete(true);
        return;
      }
      onChunk(chunk.text, chunk.candidates?.[0]?.groundingMetadata?.groundingChunks);
    }
    onComplete(false);
  } catch (err) {
    console.error("Gemini API Error:", err);
    onError(err instanceof Error ? err : new Error('An unknown error occurred during the API call.'));
    onComplete(true);
  }
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio, negativePrompt?: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: GEMINI_IMAGE_MODEL,
      prompt: prompt,
      config: {
        ...(negativePrompt && { negativePrompt }),
        numberOfImages: 1,
        aspectRatio: aspectRatio,
        outputMimeType: 'image/png'
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    } else {
      throw new Error('No image was generated. The prompt may have been blocked.');
    }
  } catch (error) {
    console.error('Image generation failed:', error);
    if (error instanceof Error) {
        // Customize error messages based on potential API feedback
        if (error.message.includes('SAFETY')) {
            throw new Error('Image generation failed due to safety policies. Please revise your prompt.');
        }
        throw new Error(`Image generation error: ${error.message}`);
    }
    throw new Error('An unknown error occurred during image generation.');
  }
};

export const generateVideo = async (
    prompt: string, 
    image: { imageBytes: string; mimeType: string; } | undefined,
    onStatusUpdate: (status: string) => void
): Promise<string> => {
    try {
        onStatusUpdate("Initializing video generation...");
        let operation = await ai.models.generateVideos({
            model: GEMINI_VIDEO_MODEL,
            prompt: prompt,
            ...(image && { image: { imageBytes: image.imageBytes, mimeType: image.mimeType } }),
            config: { numberOfVideos: 1 }
        });

        onStatusUpdate("Request sent. This may take a few minutes...");

        const pollInterval = 10000; // 10 seconds
        let checks = 0;
        const maxChecks = 30; // 5 minutes timeout

        while (!operation.done && checks < maxChecks) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            onStatusUpdate(`Checking status (${checks + 1}/${maxChecks})... Your video is being created.`);
            operation = await ai.operations.getVideosOperation({ operation: operation });
            checks++;
        }

        if (!operation.done) {
            throw new Error("Video generation timed out after 5 minutes.");
        }

        if (operation.error) {
            throw new Error(`Video generation failed with error: ${operation.error.message}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was found.");
        }

        onStatusUpdate("Video generated! Downloading video data...");
        // Append API key for fetching
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video file. Status: ${response.status}`);
        }
        
        onStatusUpdate("Creating video URL...");
        const videoBlob = await response.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        onStatusUpdate("Done!");

        return videoUrl;

    } catch (error) {
        console.error("Video generation service error:", error);
        if (error instanceof Error) {
            throw new Error(`Video generation error: ${error.message}`);
        }
        throw new Error("An unknown error occurred during video generation.");
    }
};

// FIX: Added missing inpaintImage function for the Image Modifier tool.
export const inpaintImage = async (originalImageBase64: string, maskImageBase64: string, mimeType: string, prompt: string): Promise<string> => {
    // maskImageBase64 is not used by gemini-2.5-flash-image-preview but we keep the signature.
    try {
        const imagePart = {
            inlineData: {
                data: originalImageBase64,
                mimeType: mimeType,
            },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePartResponse?.inlineData) {
            const base64ImageBytes: string = imagePartResponse.inlineData.data;
            return `data:${imagePartResponse.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
        
        const textResponse = response.candidates?.[0]?.content?.parts?.find(p => p.text)?.text;
        if (textResponse) {
            throw new Error(`The model returned text instead of an image: ${textResponse}`);
        }

        throw new Error("No image was generated by the model.");

    } catch (error) {
        console.error("Image editing failed:", error);
        if (error instanceof Error) {
            if (error.message.includes('SAFETY')) {
                throw new Error('Image generation failed due to safety policies. Please revise your prompt.');
            }
            throw new Error(`Image editing error: ${error.message}`);
        }
        throw new Error("An unknown error occurred during image editing.");
    }
};


export const enhanceChatPrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL,
            contents: `You are an expert in crafting effective prompts for large language models. Refine the following user prompt to be clearer, more detailed, and better structured to elicit a high-quality response from an AI assistant. Return ONLY the refined prompt, without any other text or explanation. User prompt: "${prompt}"`,
        });
        return response.text.trim();
    } catch (err) {
        console.error('Failed to enhance chat prompt:', err);
        throw new Error('Could not get a suggestion from the AI.');
    }
};

export const enhanceImagePrompt = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL,
            contents: `You are an expert prompt engineer for AI image generation models like DALL-E, Midjourney, and Imagen. Enhance the following user prompt to be highly descriptive, visually rich, and artistic. Focus on details like style (e.g., photorealistic, digital painting, fantasy), lighting (e.g., cinematic lighting, soft morning light), composition (e.g., wide-angle shot, close-up), and mood. Add specific, evocative keywords. Return ONLY the enhanced prompt, without any other text or explanation. User prompt: "${prompt}"`,
        });
        return response.text.trim();
    } catch (err) {
        console.error('Failed to enhance image prompt:', err);
        throw new Error('Could not get a suggestion from the AI.');
    }
};

export const analyzeImage = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const imagePart = { inlineData: { data: base64Data, mimeType } };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL,
            contents: { parts: [imagePart, textPart] },
        });

        return response.text.trim();
    } catch (err) {
        console.error('Image analysis failed:', err);
        throw new Error('The AI could not analyze the image.');
    }
};

export const generatePresentationContent = async (description: string): Promise<PresentationResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL,
            contents: `Based on the following description, generate the structure for a PowerPoint presentation. The structure should be a JSON object with a "slides" array. Each slide object in the array should have a "type" (e.g., 'title', 'bullets', 'content', 'image'), a "title", and other relevant fields like "subtitle", "bulletPoints", "content", "imagePrompt", or "speakerNotes". Also generate a python-pptx script to create this presentation. The final response should be a JSON object with two keys: "structure" (the presentation structure) and "pythonCode" (the python script). Description: "${description}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        structure: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                slides: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            type: { type: Type.STRING },
                                            title: { type: Type.STRING },
                                            subtitle: { type: Type.STRING },
                                            bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            content: { type: Type.STRING },
                                            imagePrompt: { type: Type.STRING },
                                            speakerNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            shape: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    type: { type: Type.STRING },
                                                    text: { type: Type.STRING },
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        pythonCode: { type: Type.STRING }
                    },
                    required: ['structure', 'pythonCode']
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse as PresentationResponse;

    } catch (err) {
        console.error('Failed to generate presentation content:', err);
        throw new Error('Could not generate presentation content from the AI.');
    }
};

export const solveMathProblem = async (problem: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL,
            contents: `You are a math expert. Solve the following problem and provide a step-by-step explanation. Conclude your response with the final answer on a new line, formatted as "Final Answer: [your answer]". Problem: "${problem}"`,
        });
        return response.text.trim();
    } catch (err) {
        console.error('Math problem solving failed:', err);
        throw new Error('The AI could not solve the math problem.');
    }
};

export const solveMathProblemFromImage = async (base64Data: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const imagePart = { inlineData: { data: base64Data, mimeType } };
        const textPart = { text: `You are a math expert. Analyze the math problem in this image. Solve it and provide a step-by-step explanation. Conclude your response with the final answer on a new line, formatted as "Final Answer: [your answer]". Additional context from user: "${prompt}"` };

        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL,
            contents: { parts: [imagePart, textPart] },
        });
        return response.text.trim();
    } catch (err) {
        console.error('Math problem from image solving failed:', err);
        throw new Error('The AI could not solve the math problem from the image.');
    }
};

export const humaniseText = async (text: string, tone: 'Default' | 'Casual' | 'Formal' | 'Creative'): Promise<string> => {
    let toneInstruction = '';
    switch (tone) {
        case 'Casual':
            toneInstruction = 'Use a casual, conversational tone.';
            break;
        case 'Formal':
            toneInstruction = 'Use a formal, professional tone.';
            break;
        case 'Creative':
            toneInstruction = 'Use a more creative and expressive writing style.';
            break;
        default:
            toneInstruction = 'Use a standard, natural tone.';
            break;
    }
    
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL,
            contents: `Rewrite the following text to make it sound more human-like and natural. Vary sentence structure, use more common vocabulary, and improve the flow. Avoid robotic or overly complex phrasing. ${toneInstruction} Text to humanise: "${text}"`,
        });
        return response.text.trim();
    } catch (err) {
        console.error('Text humanisation failed:', err);
        throw new Error('The AI could not humanise the text.');
    }
};

export const detectAIText = async (text: string): Promise<AIDetectionResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL,
            contents: `Analyze the following text for linguistic patterns typically associated with AI generation, such as uniformity, perplexity, and burstiness. Provide your analysis as a JSON object with two keys: "probability" (a number between 0 and 100 representing the likelihood it was AI-generated) and "analysis" (a brief string explaining your reasoning). Text to analyze: "${text}"`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        probability: { type: Type.NUMBER },
                        analysis: { type: Type.STRING },
                    },
                    required: ['probability', 'analysis']
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse as AIDetectionResponse;

    } catch (err) {
        console.error('AI text detection failed:', err);
        throw new Error('The AI could not analyze the text for detection.');
    }
};

export const translateText = async (text: string, sourceLang: string, targetLang: string): Promise<string> => {
    const sourceLanguageName = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.name || 'the source language';
    const targetLanguageName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name;

    if (!targetLanguageName) {
        throw new Error('Invalid target language specified.');
    }

    try {
        const prompt = sourceLang === 'auto'
            ? `Detect the language of the following text and translate it to ${targetLanguageName}. Provide only the translated text, with no extra commentary. Text: "${text}"`
            : `Translate the following text from ${sourceLanguageName} to ${targetLanguageName}. Provide only the translated text, with no extra commentary. Text: "${text}"`;

        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL,
            contents: prompt,
        });
        return response.text.trim();
    } catch (err) {
        console.error('Translation failed:', err);
        throw new Error('The AI could not translate the text.');
    }
};

export const fetchLatestHeadlines = async (): Promise<Headline[]> => {
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL,
            contents: `Summarize the top 4 latest world news headlines.`,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (!chunks || chunks.length === 0) {
            throw new Error("No headlines were returned from the search.");
        }
        
        const headlines: Headline[] = chunks
            .map(chunk => chunk.web)
            .filter((web): web is { uri: string; title: string } => !!(web && web.uri && web.title && web.title.trim() !== ""))
            .slice(0, 4) // Limit to 4 headlines
            .map(web => ({
                title: web.title,
                uri: web.uri,
                // The main text response is a general summary, so a generic snippet is more reliable.
                // The image will be generated client-side for better visuals and reliability.
                snippet: "Click to read more about this story.",
                imageUrl: undefined, // Let the component generate this.
            }));

        return headlines;

    } catch (err) {
        console.error("Error fetching headlines:", err);
        throw new Error("Could not fetch the latest news headlines.");
    }
};

export async function fetchInterestingFacts(): Promise<Fact[]> {
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_CHAT_MODEL,
      contents: "Generate 5 interesting and surprising facts. For each fact, provide a short, visually compelling image prompt that illustrates the fact. The prompt should be suitable for an AI image generator.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            facts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: {
                    type: Type.STRING,
                    description: 'An interesting and surprising fact.'
                  },
                  imagePrompt: {
                    type: Type.STRING,
                    description: 'A short, visually compelling prompt for an AI image generator to illustrate the fact.'
                  }
                },
                required: ['text', 'imagePrompt']
              }
            }
          },
          required: ['facts']
        }
      }
    });

    const jsonResponse = JSON.parse(response.text);
    const factsWithPrompts: { text: string; imagePrompt: string }[] = jsonResponse.facts;

    if (!factsWithPrompts || factsWithPrompts.length === 0) {
        throw new Error("AI did not return any facts.");
    }

    // Return facts without imageUrl. The component will generate them.
    return factsWithPrompts.map(fact => ({ ...fact, imageUrl: undefined }));

  } catch (error) {
    console.error("Error fetching interesting facts:", error);
    throw new Error("Failed to load interesting facts. Please try again later.");
  }
}