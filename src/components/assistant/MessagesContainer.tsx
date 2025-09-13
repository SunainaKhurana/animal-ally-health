
import { ChatMessage } from '@/hooks/chat/types';
import { useSmartScroll } from '@/hooks/chat/useSmartScroll';
import ChatMessageComponent from './ChatMessage';
import CommonQuestions from './CommonQuestions';
import RetryButton from './RetryButton';
import QuickSuggestions from './QuickSuggestions';
import ScrollToBottomButton from './ScrollToBottomButton';

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
  const {
    containerRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    showScrollToBottom
  } = useSmartScroll({ messages });

  return (
    <div className="relative flex-1">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 p-4 scroll-smooth h-full"
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
      
      <ScrollToBottomButton
        onClick={() => scrollToBottom('smooth')}
        show={showScrollToBottom}
      />
    </div>
  );
};

export default MessagesContainer;
