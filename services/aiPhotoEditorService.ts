
import { GoogleGenAI, GenerateContentResponse, Part, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const EDITING_MODEL = 'gemini-2.5-flash-image-preview';

const fileToPart = async (file: File): Promise<Part> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
  return { inlineData: { mimeType: file.type, data: base64 } };
};

const handleApiResponse = async (response: GenerateContentResponse): Promise<File> => {
    const { candidates } = response;
  
    if (!candidates || candidates.length === 0 || !candidates[0].content) {
      throw new Error("No content received from the API.");
    }
  
    if (candidates[0].finishReason && ['SAFETY', 'RECITATION', 'OTHER'].includes(candidates[0].finishReason)) {
      throw new Error(`Request blocked due to ${candidates[0].finishReason}.`);
    }
  
    const parts = candidates[0].content.parts;
    if (!parts || !Array.isArray(parts)) {
        throw new Error("Invalid response from API: content parts are missing.");
    }
  
    const imagePart = parts.find(p => p.inlineData);
  
    if (imagePart && imagePart.inlineData) {
      const { mimeType, data } = imagePart.inlineData;
      const blob = await (await fetch(`data:${mimeType};base64,${data}`)).blob();
      return new File([blob], "edited_image.png", { type: mimeType });
    } else {
      const textResponse = parts.find(p => p.text)?.text;
      throw new Error(textResponse || "The API did not return an image. Please try a different prompt.");
    }
  };

export const generateEditedImage = async (imageFile: File, prompt: string, hotspot: { x: number, y: number }): Promise<File> => {
    try {
        const textPrompt = `Apply this edit: "${prompt}". Focus the edit on the area around the object located at approximate coordinates x=${hotspot.x}, y=${hotspot.y}. The rest of the image must remain unchanged.`;
        const imagePart = await fileToPart(imageFile);
        const textPart = { text: textPrompt };

        const response = await ai.models.generateContent({
            model: EDITING_MODEL,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            }
        });

        return handleApiResponse(response);
    } catch (error) {
        console.error("Error in generateEditedImage:", error);
        if (error instanceof Error) {
            if (error.message.includes('SAFETY')) {
                throw new Error('Your request was blocked due to safety policies. Please revise your prompt or image.');
            }
             throw new Error(`Image editing failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during image editing.");
    }
};

export const changeBackground = async (imageFile: File, prompt: string): Promise<File> => {
    try {
        const textPrompt = `You are an expert photo editor. Replace the background of the provided image with a new background described by the following prompt. It is crucial that you keep the foreground subject perfectly intact. After placing the new background, you MUST re-light the foreground subject to match the lighting conditions (e.g., color, intensity, direction) of the new environment, ensuring realistic shadows and highlights for a seamless composition. New background: "${prompt}"`;
        const imagePart = await fileToPart(imageFile);
        const textPart = { text: textPrompt };

        const response = await ai.models.generateContent({
            model: EDITING_MODEL,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            }
        });

        return handleApiResponse(response);
    } catch (error) {
        console.error("Error in changeBackground:", error);
        if (error instanceof Error) {
            if (error.message.includes('SAFETY')) {
                throw new Error('Your request was blocked due to safety policies. Please revise your prompt or image.');
            }
             throw new Error(`Background change failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during background change.");
    }
};

export const generateFilteredImage = async (imageFile: File, filterPrompt: string): Promise<File> => {
    try {
        const textPrompt = `Apply this filter style to the entire image: "${filterPrompt}". The composition and main subjects of the image should remain the same, but the artistic style, color palette, and texture should be transformed.`;
        const imagePart = await fileToPart(imageFile);
        const textPart = { text: textPrompt };

        const response = await ai.models.generateContent({
            model: EDITING_MODEL,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            }
        });
        
        return handleApiResponse(response);
    } catch (error) {
        console.error("Error in generateFilteredImage:", error);
        if (error instanceof Error) {
            if (error.message.includes('SAFETY')) {
                throw new Error('Your request was blocked due to safety policies. Please revise your prompt or image.');
            }
             throw new Error(`Applying filter failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred while applying the filter.");
    }
};

export const generateAdjustedImage = async (imageFile: File, adjustmentPrompt: string): Promise<File> => {
    try {
        const textPrompt = `Apply this professional adjustment to the entire image: "${adjustmentPrompt}". This is for professional edits like 'blur the background', 'enhance details', 'cinematic lighting', not creative filters. The core subjects and composition must not change.`;
        const imagePart = await fileToPart(imageFile);
        const textPart = { text: textPrompt };

        const response = await ai.models.generateContent({
            model: EDITING_MODEL,
            contents: { parts: [imagePart, textPart] },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            }
        });

        return handleApiResponse(response);
    } catch (error) {
        console.error("Error in generateAdjustedImage:", error);
        if (error instanceof Error) {
            if (error.message.includes('SAFETY')) {
                throw new Error('Your request was blocked due to safety policies. Please revise your prompt or image.');
            }
             throw new Error(`Image adjustment failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during image adjustment.");
    }
};
