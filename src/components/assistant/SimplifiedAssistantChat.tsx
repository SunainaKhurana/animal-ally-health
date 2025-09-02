
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePetContext } from '@/contexts/PetContext';
import { useChatLogic } from '@/hooks/chat/useChatLogic';
import SymptomLogger from './SymptomLogger';
import ChatInput from './ChatInput';
import MessagesContainer from './MessagesContainer';
import ChatHeader from './ChatHeader';

const SimplifiedAssistantChat = () => {
  const { selectedPet } = usePetContext();
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);
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
  } = useChatLogic(selectedPet?.id);

  const handleSymptomSubmitAndClose = async (symptoms: string[], notes: string, image?: File) => {
    await handleSymptomSubmit(symptoms, notes, image);
    setShowSymptomLogger(false);
  };

  if (showSymptomLogger) {
    return (
      <SymptomLogger
        onSubmit={handleSymptomSubmitAndClose}
        onCancel={() => setShowSymptomLogger(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        connectionHealth={connectionHealth}
        pendingResponsesCount={pendingResponsesCount}
        onLogSymptoms={() => setShowSymptomLogger(true)}
      />

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

      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading}
        initialMessage={initialMessage}
      />
    </div>
  );
};

export default SimplifiedAssistantChat;
