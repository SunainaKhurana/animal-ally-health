
import { useRef, useEffect } from 'react';
import { ChatMessage } from '@/hooks/useChatMessages';
import ChatMessageComponent from './ChatMessage';
import CommonQuestions from './CommonQuestions';
import RetryButton from './RetryButton';
import QuickSuggestions from './QuickSuggestions';

interface MessagesContainerProps {
  messages: ChatMessage[];
  selectedPetName?: string;
  onQuestionSelect: (question: string) => void;
  isLoading: boolean;
  lastFailedMessage: { message: string; imageFile?: File } | null;
  retryCount: number;
  onRetry: () => void;
  showQuickSuggestions: boolean;
}

const MessagesContainer = ({
  messages,
  selectedPetName,
  onQuestionSelect,
  isLoading,
  lastFailedMessage,
  retryCount,
  onRetry,
  showQuickSuggestions
}: MessagesContainerProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Optimized auto-scroll with requestAnimationFrame
  useEffect(() => {
    if (messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages]);

  // Auto-scroll to bottom when messages container becomes visible
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const container = messagesContainerRef.current;
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [messages.length]);

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto space-y-4 p-4 scroll-smooth"
    >
      {messages.length === 0 ? (
        <CommonQuestions
          petName={selectedPetName}
          onQuestionSelect={onQuestionSelect}
          isLoading={isLoading}
        />
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
          
          <RetryButton
            onRetry={onRetry}
            isLoading={isLoading}
            retryCount={retryCount}
          />
          
          <QuickSuggestions
            onQuestionSelect={onQuestionSelect}
            isLoading={isLoading}
            show={showQuickSuggestions && messages.length > 0}
          />
          
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default MessagesContainer;
