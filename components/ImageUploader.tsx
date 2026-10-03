
import React, { useRef, useCallback } from 'react';
import UploadIcon from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  previewUrl: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, previewUrl }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if(file && file.type.startsWith('image/')) {
        onImageUpload(file);
    }
  }, [onImageUpload]);
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
      />
      <label
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="cursor-pointer flex justify-center items-center w-full h-64 border-2 border-dashed border-gray-600 hover:border-indigo-500 rounded-lg transition-colors duration-300 bg-gray-700/50"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Sketch Preview" className="max-w-full max-h-full object-contain p-2" />
        ) : (
          <div className="text-center text-gray-400">
            <UploadIcon className="mx-auto h-12 w-12" />
            <p className="mt-2">Click to upload or drag & drop</p>
            <p className="text-xs">PNG, JPG, WEBP</p>
          </div>
        )}
      </label>
    </div>
  );
};

export default ImageUploader;
