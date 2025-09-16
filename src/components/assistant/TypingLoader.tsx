import React from 'react';
import { Bot } from 'lucide-react';

const TypingLoader = () => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-lg p-3 bg-gray-100 text-gray-900">
        <div className="flex items-start gap-2">
          <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-600" />
          <div className="flex-1">
            <div className="flex items-center space-x-1 py-1">
              <span className="text-xs text-gray-500 mr-2">Assistant is typing</span>
              <span className="bg-gray-400 rounded-full w-1.5 h-1.5 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="bg-gray-400 rounded-full w-1.5 h-1.5 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="bg-gray-400 rounded-full w-1.5 h-1.5 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingLoader;