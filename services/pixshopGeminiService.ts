import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// This model is hypothetical based on the user's request.
// In a real scenario, this would need to map to a valid, available model.
const EDITING_MODEL = 'gemini-2.5-flash';

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
  const systemPrompt = `You are an expert photo editor. The user has provided an image and a "hotspot" coordinate (x, y) on that image, along with a text prompt describing an edit.
Your task is to apply the requested edit ONLY to the relevant object or area indicated by the hotspot.
The rest of the image, outside of the edited area, must remain completely unchanged, pixel for pixel.
Analyze the user's prompt and the image area around the hotspot to perform a precise, localized retouch.
Hotspot: x=${hotspot.x}, y=${hotspot.y}
User's Edit Request: "${prompt}"`;

  const imagePart = await fileToPart(imageFile);
  const textPart = { text: "Edit the image according to the system prompt." };

  const response = await ai.models.generateContent({
    model: EDITING_MODEL,
    contents: { parts: [imagePart, textPart] },
    config: {
        systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] }
    }
  });

  return handleApiResponse(response);
};

export const generateFilteredImage = async (imageFile: File, filterPrompt: string): Promise<File> => {
    const systemPrompt = `You are an expert photo editor applying a creative filter. The user has provided an image and a text prompt describing the desired style.
Your task is to re-render the ENTIRE image in the style described by the prompt. The composition and main subjects of the image should remain the same, but the artistic style, color palette, and texture should be transformed.
Filter Style Request: "${filterPrompt}"`;

    const imagePart = await fileToPart(imageFile);
    const textPart = { text: "Apply the filter based on the system prompt." };

    const response = await ai.models.generateContent({
        model: EDITING_MODEL,
        contents: { parts: [imagePart, textPart] },
        config: {
            systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] }
        }
    });
    
    return handleApiResponse(response);
};

export const generateAdjustedImage = async (imageFile: File, adjustmentPrompt: string): Promise<File> => {
    const systemPrompt = `You are an expert photo editor performing a professional adjustment. The user has provided an image and a text prompt describing the desired adjustment.
Your task is to apply the adjustment globally to the entire image. This is for professional edits like 'blur the background', 'enhance details', 'cinematic lighting', not creative filters. The core subjects and composition must not change.
Adjustment Request: "${adjustmentPrompt}"`;

    const imagePart = await fileToPart(imageFile);
    const textPart = { text: "Apply the adjustment based on the system prompt." };

    const response = await ai.models.generateContent({
        model: EDITING_MODEL,
        contents: { parts: [imagePart, textPart] },
        config: {
            systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] }
        }
    });

    return handleApiResponse(response);
};