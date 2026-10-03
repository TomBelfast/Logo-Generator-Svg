
import React, { useState, useEffect, useCallback } from 'react';
import { EditingConfig } from '../App';
import { editLogo } from '../services/geminiService';
import CloseIcon from './icons/CloseIcon';
import Loader from './Loader';

interface EditModalProps {
  config: EditingConfig | null;
  onClose: () => void;
  onApplyEdit: (originalUrl: string, newImageUrl: string) => void;
}

const urlToBase64 = async (url: string): Promise<{ base64: string, mimeType: string }> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const [, base64] = result.split(',');
      const mimeType = blob.type || 'application/octet-stream';
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const EditModal: React.FC<EditModalProps> = ({ config, onClose, onApplyEdit }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when modal is opened or closed
    if (!config) {
      setTimeout(() => {
        setPrompt('');
        setIsLoading(false);
        setError(null);
        setEditedImage(null);
      }, 300); // Wait for fade-out animation
    }
  }, [config]);

  const handleGenerateEdit = async () => {
    if (!config || !prompt.trim()) {
      setError("Please enter a description of your changes.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const { base64, mimeType } = await urlToBase64(config.url);
      const newImageBase64 = await editLogo(base64, mimeType, prompt);
      setEditedImage(newImageBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (config && editedImage) {
      const newImageUrl = `data:image/png;base64,${editedImage}`;
      onApplyEdit(config.url, newImageUrl);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!config) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-300 animate-[fade-in_0.2s_ease-out]"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] p-6 m-4 flex flex-col relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-indigo-400">Edit Logo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close edit modal"
          >
            <CloseIcon className="w-7 h-7" />
          </button>
        </div>
        
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2">
          {/* Left Column: Original and Edit controls */}
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">Original</h3>
              <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center p-2">
                <img src={config.url} alt="Original Logo" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
            <div>
              <label htmlFor="edit-prompt" className="block text-lg font-semibold text-gray-300 mb-2">Describe your changes</label>
              <textarea
                id="edit-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'make the triangle red', 'add a circle around it'"
                className="w-full h-28 p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                disabled={isLoading}
              />
            </div>
            <button
                onClick={handleGenerateEdit}
                disabled={isLoading || !prompt.trim()}
                className={`w-full py-3 px-6 rounded-lg text-base font-bold transition-all duration-300 ease-in-out
                  ${isLoading || !prompt.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
              >
                {isLoading ? 'Generating...' : 'Generate Edit'}
              </button>
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Result</h3>
            <div className="flex-grow aspect-square bg-gray-700/50 rounded-lg flex items-center justify-center p-2 relative">
                {isLoading && <Loader />}
                {!isLoading && error && (
                    <div className="text-center text-red-400 p-4">
                        <p className="font-bold">Editing Failed</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}
                {!isLoading && !error && editedImage && (
                    <img src={`data:image/png;base64,${editedImage}`} alt="Edited Logo" className="max-w-full max-h-full object-contain" />
                )}
                {!isLoading && !error && !editedImage && (
                    <p className="text-gray-400 text-center">Your edited logo will appear here.</p>
                )}
            </div>
             {editedImage && !isLoading && (
                <button
                    onClick={handleApply}
                    className="mt-4 w-full py-3 px-6 rounded-lg text-base font-bold bg-green-600 hover:bg-green-500 text-white transition-colors"
                >
                    Apply Changes
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
