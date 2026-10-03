
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className="w-12 h-12 rounded-full animate-spin
                    border-4 border-solid border-indigo-500 border-t-transparent"
      ></div>
      <p className="text-indigo-300">Generating your logo...</p>
    </div>
  );
};

export default Loader;
