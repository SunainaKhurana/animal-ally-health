
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePetContext } from '@/contexts/PetContext';
import { useSupabaseChatLogic } from '@/hooks/chat/useSupabaseChatLogic';
import AssistantInitialView from './AssistantInitialView';
import ChatInput from './ChatInput';
import MessagesContainer from './MessagesContainer';
import ConnectionStatus from './ConnectionStatus';

const SimplifiedAssistantChat = () => {
  const { selectedPet } = usePetContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialMessage, setInitialMessage] = useState<string>('');
  
  // Check for prefilled content from URL params
  useEffect(() => {
    const prefillContent = searchParams.get('prefill');
    if (prefillContent) {
      setInitialMessage(decodeURIComponent(prefillContent));
      // Remove the prefill param from URL after using it
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('prefill');
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);
  
  const {
    messages,
    isLoading,
    showQuickSuggestions,
    retryCount,
    lastFailedMessage,
    connectionHealth,
    pendingResponsesCount,
    handleSendMessage,
    handleRetry,
    handleQuestionSelect,
    handleSymptomSubmit
  } = useSupabaseChatLogic(selectedPet?.id);

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="p-4 border-b">
        <ConnectionStatus
          connectionHealth={connectionHealth}
          pendingResponsesCount={pendingResponsesCount}
        />
      </div>

      {messages.length === 0 ? (
        <div className="flex-1">
          <AssistantInitialView
            petName={selectedPet?.name}
            onQuestionSelect={handleQuestionSelect}
            onSymptomSubmit={handleSymptomSubmit}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <>
          <MessagesContainer
            messages={messages}
            selectedPetName={selectedPet?.name}
            onQuestionSelect={handleQuestionSelect}
            isLoading={isLoading}
            lastFailedMessage={lastFailedMessage}
            retryCount={retryCount}
            onRetry={handleRetry}
            showQuickSuggestions={showQuickSuggestions}
          />
        </>
      )}

      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading}
        initialMessage={initialMessage}
      />
    </div>
  );
};

export default SimplifiedAssistantChat;
