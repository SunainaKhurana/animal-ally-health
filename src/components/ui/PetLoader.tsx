
import React from 'react';

interface PetLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  type?: 'chasing' | 'tail';
}

const PetLoader = ({ size = 'md', type = 'chasing' }: PetLoaderProps) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  if (type === 'tail') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className={`${sizeClasses[size]} animate-spin`}>
          <div className="relative">
            <div className="text-2xl">🐕</div>
            <style jsx>{`
              @keyframes tail-chase {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .animate-spin {
                animation: tail-chase 1.5s linear infinite;
              }
            `}</style>
          </div>
        </div>
        <p className="ml-3 text-gray-600 animate-pulse">Loading your pets...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${sizeClasses[size]} flex items-center space-x-1 overflow-hidden`}>
        <div className="animate-bounce">🐭</div>
        <div className="animate-bounce" style={{ animationDelay: '0.1s' }}>🐱</div>
        <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>🐕</div>
        <style jsx>{`
          @keyframes chase {
            0%, 20% { transform: translateX(-100px); }
            80%, 100% { transform: translateX(100px); }
          }
          .animate-chase {
            animation: chase 3s ease-in-out infinite;
          }
        `}</style>
      </div>
      <p className="ml-3 text-gray-600 animate-pulse">Loading your pets...</p>
    </div>
  );
};

export default PetLoader;
