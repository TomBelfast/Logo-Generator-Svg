
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import StyleSelector from './components/StyleSelector';
import LogoDisplay from './components/LogoDisplay';
import FullscreenModal from './components/FullscreenModal';
import EditModal from './components/EditModal';
import { LOGO_STYLES } from './constants';
import { generateLogo } from './services/geminiService';

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      resolve({ base64, mimeType });
    };
    reader.onerror = error => reject(error);
  });
};

const downloadImage = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export type GeneratedLogo = {
  style: string;
  url: string | null;
  error?: string;
};

export type FullscreenConfig = {
  images: string[];
  startIndex: number;
};

export type EditingConfig = {
  url: string;
  style: string;
};

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [generatedLogos, setGeneratedLogos] = useState<GeneratedLogo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenConfig, setFullscreenConfig] = useState<FullscreenConfig | null>(null);
  const [editingConfig, setEditingConfig] = useState<EditingConfig | null>(null);
  const [numVersions, setNumVersions] = useState<number>(1);
  const [transparentBg, setTransparentBg] = useState<boolean>(false);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setGeneratedLogos([]);
    setError(null);
  };

  const handleStyleChange = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style)
        ? prev.filter(s => s !== style)
        : [...prev, style]
    );
  };

  const handleGenerateClick = useCallback(async () => {
    if ((!imageFile && !prompt.trim()) || selectedStyles.length === 0) {
      setError("Please describe your logo or upload a sketch, and select at least one style.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedLogos([]);
    
    const generationTasks = selectedStyles.flatMap(style => 
      Array.from({ length: numVersions }, (_, i) => ({ style, version: i + 1 }))
    );

    try {
      let base64: string | null = null;
      let mimeType: string | null = null;
      if (imageFile) {
        const result = await fileToBase64(imageFile);
        base64 = result.base64;
        mimeType = result.mimeType;
      }
      
      for (const task of generationTasks) {
        const displayName = numVersions > 1 ? `${task.style} v${task.version}` : task.style;
        try {
          const imageData = await generateLogo(base64, mimeType, task.style, transparentBg, prompt);
          setGeneratedLogos(prev => [...prev, {
            style: displayName,
            url: `data:image/png;base64,${imageData}`,
          }]);
        } catch (err) {
          console.error(`Failed to generate logo for style: ${displayName}`, err);
          const errorMessage = err instanceof Error ? err.message : "Generation failed.";
          setGeneratedLogos(prev => [...prev, {
            style: displayName,
            url: null,
            error: errorMessage,
          }]);
          
          if (errorMessage.includes("Rate limit exceeded")) {
             setError("API rate limit reached. Generation stopped. Please wait and try again, possibly with fewer versions.");
             break; 
          }
        }
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during setup.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, selectedStyles, numVersions, transparentBg, prompt]);

  const handleDownloadAll = () => {
    generatedLogos.forEach(logo => {
      if (logo.url) {
        downloadImage(logo.url, `logo-${logo.style.toLowerCase().replace(/\s/g, '-')}.png`);
      }
    });
  };
  
  const handleOpenFullscreen = (imageUrl: string) => {
    const images = generatedLogos
      .map(logo => logo.url)
      .filter((url): url is string => Boolean(url));
    const startIndex = images.indexOf(imageUrl);
    if (startIndex > -1) {
      setFullscreenConfig({ images, startIndex });
    }
  };
  
  const handleCloseFullscreen = () => {
    setFullscreenConfig(null);
  };

  const handleOpenEdit = (url: string, style: string) => {
    setEditingConfig({ url, style });
  };

  const handleCloseEdit = () => {
    setEditingConfig(null);
  };
  
  const handleApplyEdit = (originalUrl: string, newImageUrl: string) => {
    setGeneratedLogos(prevLogos =>
      prevLogos.map(logo =>
        logo.url === originalUrl ? { ...logo, url: newImageUrl, style: `${logo.style} (edited)` } : logo
      )
    );
    handleCloseEdit();
  };

  const isGenerateDisabled = (!imageFile && !prompt.trim()) || selectedStyles.length === 0 || isLoading;
  const generateButtonText = isLoading 
    ? 'Generating...' 
    : `Generate Logo${selectedStyles.length * numVersions !== 1 ? 's' : ''}`;
    
  const successfulLogosCount = generatedLogos.filter(logo => logo.url).length;

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-white p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-7xl">
        <Header />
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Inputs */}
          <div className="flex flex-col gap-8">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-indigo-400 mb-4">1. Describe Your Logo</h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'a shield with a lion inside', 'a minimalist mountain range'"
                className="w-full h-24 p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                aria-label="Describe your logo"
              />
            </div>
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-indigo-400 mb-4">2. Upload Sketch (Optional)</h2>
              <ImageUploader onImageUpload={handleImageUpload} previewUrl={imagePreview} />
            </div>
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-indigo-400 mb-4">3. Choose Style(s)</h2>
              <StyleSelector 
                styles={LOGO_STYLES} 
                selectedStyles={selectedStyles} 
                onStyleChange={handleStyleChange} 
              />
              <div className="mt-6 flex items-center">
                <input
                  type="checkbox"
                  id="transparent-bg"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-gray-800"
                />
                <label htmlFor="transparent-bg" className="ml-3 text-sm font-medium text-gray-300">
                  Transparent Background
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="flex flex-col gap-8">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg flex flex-col flex-grow">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-xl font-bold text-indigo-400">4. Get Your Logos</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="num-versions" className="text-sm font-medium text-gray-300">Versions:</label>
                    <select
                      id="num-versions"
                      value={numVersions}
                      onChange={(e) => setNumVersions(Number(e.target.value))}
                      className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block px-2 py-1"
                      disabled={isLoading}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  {successfulLogosCount > 0 && (
                    <button
                      onClick={handleDownloadAll}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
                      aria-label={`Download all ${successfulLogosCount} generated logos`}
                    >
                      Download All
                    </button>
                  )}
                </div>
              </div>
              <LogoDisplay 
                logos={generatedLogos} 
                isLoading={isLoading} 
                error={error}
                initialText="Your generated logos will appear here." 
                onOpenFullscreen={handleOpenFullscreen}
                onOpenEdit={handleOpenEdit}
              />
            </div>
            <button
              onClick={handleGenerateClick}
              disabled={isGenerateDisabled}
              className={`w-full py-4 px-6 rounded-lg text-lg font-bold transition-all duration-300 ease-in-out transform hover:scale-105
                ${isGenerateDisabled
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                }`}
            >
              {generateButtonText}
            </button>
          </div>
        </main>
      </div>
      <FullscreenModal config={fullscreenConfig} onClose={handleCloseFullscreen} />
      <EditModal config={editingConfig} onClose={handleCloseEdit} onApplyEdit={handleApplyEdit} />
    </div>
  );
}
