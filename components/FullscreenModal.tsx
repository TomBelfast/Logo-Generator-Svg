
import React, { useState, useEffect, useCallback } from 'react';
import CloseIcon from './icons/CloseIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import { FullscreenConfig } from '../App';

interface FullscreenModalProps {
  config: FullscreenConfig | null;
  onClose: () => void;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({ config, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (config) {
      setCurrentIndex(config.startIndex);
    }
  }, [config]);

  const goToPrevious = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (config && config.images.length > 1) {
      const isFirst = currentIndex === 0;
      const newIndex = isFirst ? config.images.length - 1 : currentIndex - 1;
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, config]);

  const goToNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (config && config.images.length > 1) {
      const isLast = currentIndex === config.images.length - 1;
      const newIndex = isLast ? 0 : currentIndex + 1;
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, config]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (config) {
        if (event.key === 'ArrowLeft') {
          goToPrevious();
        } else if (event.key === 'ArrowRight') {
          goToNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, config, goToPrevious, goToNext]);

  if (!config) {
    return null;
  }
  
  const imageUrl = config.images[currentIndex];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 transition-opacity duration-300 animate-[fade-in_0.2s_ease-out]" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {config.images.length > 1 && (
        <button 
          onClick={goToPrevious}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors z-10"
          aria-label="Previous image"
        >
          <ArrowLeftIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      )}

      <div 
        className="relative max-w-4xl w-[90%] max-h-[90vh] p-4 flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt="Fullscreen Logo" 
          className="w-auto h-auto max-w-full max-h-full object-contain" 
        />
        <button
          onClick={onClose}
          className="absolute top-0 right-0 m-2 sm:m-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
          aria-label="Close fullscreen view"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {config.images.length > 1 && (
        <button 
          onClick={goToNext}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors z-10"
          aria-label="Next image"
        >
          <ArrowRightIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      )}
    </div>
  );
};

export default FullscreenModal;
