
import React from 'react';
import Loader from './Loader';
import { GeneratedLogo } from '../App';
import DownloadIcon from './icons/DownloadIcon';
import ExpandIcon from './icons/ExpandIcon';
import EditIcon from './icons/EditIcon';

interface LogoDisplayProps {
  logos: GeneratedLogo[];
  isLoading: boolean;
  error: string | null;
  initialText: string;
  onOpenFullscreen: (imageUrl: string) => void;
  onOpenEdit: (imageUrl: string, style: string) => void;
}

const LogoDisplay: React.FC<LogoDisplayProps> = ({ logos, isLoading, error, initialText, onOpenFullscreen, onOpenEdit }) => {
  const hasContent = logos && logos.length > 0;

  const handleDownload = (event: React.MouseEvent, url: string, style: string) => {
    event.stopPropagation(); // Prevent triggering fullscreen view on icon click
    const link = document.createElement('a');
    link.href = url;
    link.download = `logo-${style.toLowerCase().replace(/[\s/]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-700/50 rounded-lg p-4 min-h-[300px]">
      {isLoading && <Loader />}
      {!isLoading && error && (
        <div className="text-center text-red-400">
          <p className="font-bold">An Error Occurred</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      {!isLoading && !error && hasContent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full max-h-96 overflow-y-auto p-2">
          {logos.map(({ style, url, error: itemError }) => (
            <div key={style} className="bg-gray-800 p-2 rounded-lg flex flex-col items-center gap-2">
              <h3 className="text-sm font-semibold text-indigo-300 capitalize">{style}</h3>
              <div className="w-full aspect-square flex items-center justify-center bg-gray-700 rounded p-1 group relative">
                {itemError ? (
                  <div className="text-center text-red-400 p-2">
                    <p className="font-bold text-xs">Failed</p>
                    <p className="text-xs max-w-xs">{itemError}</p>
                  </div>
                ) : url ? (
                  <>
                    <img src={url} alt={`Generated logo in ${style} style`} className="max-w-full max-h-full object-contain" />
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 cursor-pointer"
                      onClick={() => onOpenFullscreen(url)}
                      role="button"
                      tabIndex={0}
                      aria-label={`View ${style} logo fullscreen`}
                      onKeyDown={(e) => e.key === 'Enter' && onOpenFullscreen(url)}
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFullscreen(url);
                        }} 
                        className="text-white p-2 rounded-full bg-gray-900/50 hover:bg-gray-900/80 transition-colors"
                        aria-label={`View ${style} logo fullscreen`}
                      >
                        <ExpandIcon className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if(url) onOpenEdit(url, style);
                        }}
                        className="text-white p-2 rounded-full bg-gray-900/50 hover:bg-gray-900/80 transition-colors"
                        aria-label={`Edit ${style} logo`}
                      >
                        <EditIcon className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={(e) => handleDownload(e, url, style)} 
                        className="text-white p-2 rounded-full bg-gray-900/50 hover:bg-gray-900/80 transition-colors"
                        aria-label={`Download ${style} logo`}
                      >
                        <DownloadIcon className="w-6 h-6" />
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
      {!isLoading && !error && !hasContent && (
        <p className="text-gray-400 text-center">{initialText}</p>
      )}
    </div>
  );
};

export default LogoDisplay;
