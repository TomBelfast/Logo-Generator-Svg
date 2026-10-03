
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Removes a solid color background from a base64 image string.
 * @param base64Image The base64 string of the image.
 * @param mimeType The MIME type of the image.
 * @param keyColor The RGB color to remove.
 * @param threshold The tolerance for color matching (0-255).
 * @returns A promise that resolves with the new base64 string of the logo with an alpha channel.
 */
const removeSolidBackground = (
  base64Image: string,
  mimeType: string,
  keyColor: { r: number; g: number; b: number },
  threshold: number = 40
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate the Euclidean distance in the RGB color space
        const distance = Math.sqrt(
          Math.pow(r - keyColor.r, 2) +
          Math.pow(g - keyColor.g, 2) +
          Math.pow(b - keyColor.b, 2)
        );

        // If the color is within the threshold, make it transparent
        if (distance <= threshold) {
          data[i + 3] = 0; // Set alpha to 0
        }
      }

      ctx.putImageData(imageData, 0, 0);
      // Export as PNG to support transparency
      const newBase64 = canvas.toDataURL('image/png').split(',')[1];
      resolve(newBase64);
    };

    img.onerror = () => reject(new Error('Failed to load image for background removal.'));
    img.src = `data:${mimeType};base64,${base64Image}`;
  });
};


export const generateLogo = async (
  base64ImageData: string | null,
  mimeType: string | null,
  style: string,
  isTransparent: boolean,
  userPrompt: string
): Promise<string> => {
  // Branch 1: Sketch is provided. Use gemini-2.5-flash-image-preview
  if (base64ImageData && mimeType) {
    const model = 'gemini-2.5-flash-image-preview';
    let inputDescription = 'Input: A user-provided sketch.';
    if (userPrompt.trim()) {
      inputDescription += ` The user also provided this description: "${userPrompt}". Adhere to it closely.`;
    }

    const prompt = isTransparent
      ? `Task: Generate a professional logo for background removal.
${inputDescription}
Style: '${style}'.
Appearance: High-resolution, vector graphic look.
Background: Solid, pure green screen (hex code #00FF00). The logo itself must not contain this green color.
Output: The final image only. No text.`
      : `Task: Generate a professional logo.
${inputDescription}
Style: '${style}'.
Appearance: High-resolution, vector graphic look.
Background: Solid, plain white. No shadows or gradients.
Output: The final image only. No text.`;
    
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            { inlineData: { data: base64ImageData, mimeType: mimeType } },
            { text: prompt },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);

      if (!imagePart || !imagePart.inlineData) {
          const finishReason = response.candidates?.[0]?.finishReason;
          let errorMessage = "AI did not return an image. Please try again.";
          if (finishReason === 'SAFETY') {
              errorMessage = "Generation failed due to safety policies. Please adjust your sketch or prompt and try again.";
          }
          throw new Error(errorMessage);
      }
      
      if (isTransparent) {
        const keyColor = { r: 0, g: 255, b: 0 }; // Hardcoded #00FF00
        return await removeSolidBackground(
          imagePart.inlineData.data,
          imagePart.inlineData.mimeType,
          keyColor
        );
      } else {
        return imagePart.inlineData.data;
      }

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      if (error instanceof Error) {
          if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
              throw new Error("Rate limit exceeded. Please wait a moment and try again with fewer versions.");
          }
          // re-throw other specific errors to be displayed to the user
          throw error;
      }
      throw new Error("Failed to generate logo due to an unknown API error.");
    }
  }
  // Branch 2: No sketch, text prompt only. Use imagen-4.0-generate-001.
  else if (userPrompt.trim()) {
    const model = 'imagen-4.0-generate-001';
    
    const backgroundInstruction = isTransparent 
        ? "The logo must have a solid, pure green screen background (hex code #00FF00). The logo itself must not contain this specific green color."
        : "The logo must have a solid, plain white background. No shadows or gradients.";
        
    const prompt = `A professional logo with a '${style}' style.
Description: "${userPrompt}".
Appearance: High-resolution, vector graphic look.
${backgroundInstruction}
The final image should only contain the logo. No text, no other elements.`;
    
    try {
      const response = await ai.models.generateImages({
        model: model,
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
      });

      const imageBase64 = response.generatedImages?.[0]?.image?.imageBytes;

      if (!imageBase64) {
        throw new Error("AI did not return an image. Please try again with a different prompt.");
      }

      if (isTransparent) {
        const keyColor = { r: 0, g: 255, b: 0 };
        return await removeSolidBackground(
          imageBase64,
          'image/png',
          keyColor
        );
      } else {
        return imageBase64;
      }
    } catch (error) {
      console.error("Error calling Imagen API:", error);
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("Rate limit exceeded. Please wait a moment and try again with fewer versions.");
        }
        if (error.message.includes('SAFETY')) {
            throw new Error("Generation failed due to safety policies. Please adjust your prompt and try again.");
        }
        throw error;
      }
      throw new Error("Failed to generate logo due to an unknown API error.");
    }
  }
  // Branch 3: Nothing provided. Should be caught in App.tsx, but as a safeguard.
  else {
    throw new Error("A text description or a sketch is required to generate a logo.");
  }
};


export const editLogo = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const model = 'gemini-2.5-flash-image-preview';
  const fullPrompt = `Task: Edit the provided image based on the user's request.
User Request: "${prompt}".
Output: The edited image only. Do not include any text or other content.`;
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: fullPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (imagePart?.inlineData) {
      return imagePart.inlineData.data;
    }
    
    const finishReason = response.candidates?.[0]?.finishReason;
    let errorMessage = "API did not return an edited image. Please try a different prompt.";
    if (finishReason === 'SAFETY') {
        errorMessage = "Edit failed due to safety policies. Please adjust your prompt and try again.";
    }
    throw new Error(errorMessage);

  } catch (error) {
    console.error("Error calling Gemini API for editing:", error);
     if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
            throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        throw error;
    }
    throw new Error("Failed to edit logo due to an unknown API error.");
  }
};
