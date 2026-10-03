
import React from 'react';

interface StyleSelectorProps {
  styles: string[];
  selectedStyles: string[];
  onStyleChange: (style: string) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ styles, selectedStyles, onStyleChange }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {styles.map((style) => (
        <button
          key={style}
          onClick={() => onStyleChange(style)}
          aria-pressed={selectedStyles.includes(style)}
          className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500
            ${selectedStyles.includes(style)
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:scale-105'
            }`}
        >
          {style}
        </button>
      ))}
    </div>
  );
};

export default StyleSelector;
