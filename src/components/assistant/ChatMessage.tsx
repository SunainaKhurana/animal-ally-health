
import React from 'react';
import { Bot, Camera } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    type: 'user' | 'assistant' | 'processing' | 'typing';
    content: string;
    timestamp: Date;
    hasImage?: boolean;
  };
}

import LoadingDots from '@/components/ui/loading-dots';
import TypingLoader from './TypingLoader';

const ChatMessage = React.memo(({ message }: ChatMessageProps) => {
  // Handle typing loader as a special case
  if (message.type === 'typing') {
    return <TypingLoader />;
  }

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-lg p-3 ${
        message.type === 'user' 
          ? 'bg-blue-500 text-white' 
          : message.type === 'assistant'
          ? 'bg-gray-100 text-gray-900'
          : 'bg-blue-50 text-blue-800 border border-blue-200'
      }`}>
        <div className="flex items-start gap-2">
          {message.type === 'processing' && (
            <div className="mt-1">
              <LoadingDots />
            </div>
          )}
          {message.type === 'assistant' && (
            <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-600" />
          )}
          <div className="flex-1">
            <p className="text-sm whitespace-pre-line">{message.content}</p>
            {message.hasImage && (
              <div className="mt-2 text-xs opacity-75 flex items-center gap-1">
                <Camera className="h-3 w-3" />
                Image attached
              </div>
            )}
          </div>
        </div>
        <p className="text-xs opacity-70 mt-1">
          {message.timestamp ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
        </p>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;
