import React from 'react';

const LoadingDots = () => {
  return (
    <div className="flex space-x-1 justify-center items-center">
      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  );
};

export default LoadingDots;