
import { useState } from 'react';
import { usePetContext } from '@/contexts/PetContext';
import { useChatLogic } from '@/hooks/chat/useChatLogic';
import SymptomLogger from './SymptomLogger';
import ChatInput from './ChatInput';
import MessagesContainer from './MessagesContainer';
import ChatHeader from './ChatHeader';

const SimplifiedAssistantChat = () => {
  const { selectedPet } = usePetContext();
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);
  
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
    <div className="flex flex-col h-full max-h-[600px]">
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

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default SimplifiedAssistantChat;
