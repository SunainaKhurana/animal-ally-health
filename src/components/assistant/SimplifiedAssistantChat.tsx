
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useToast } from '@/hooks/use-toast';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useChatMessages, ChatMessage } from '@/hooks/useChatMessages';
import SymptomLogger from './SymptomLogger';
import ChatInput from './ChatInput';
import ConnectionStatus from './ConnectionStatus';
import MessagesContainer from './MessagesContainer';

const SimplifiedAssistantChat = () => {
  const { selectedPet } = usePetContext();
  const { toast } = useToast();
  const { addSymptomReport } = useSymptomReports();
  const { messages, addMessage, addProcessingMessage, connectionHealth, pendingResponsesCount } = useChatMessages(selectedPet?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<{ message: string; imageFile?: File } | null>(null);

  const handleSendMessage = async (message: string, imageFile?: File, isRetry: boolean = false) => {
    if (!message.trim() && !imageFile || !selectedPet) return;

    console.log('Attempting to send message:', { message: message.substring(0, 50), hasImage: !!imageFile, isRetry });

    // Check if we're already loading and not retrying
    if (isLoading && !isRetry) {
      console.log('Already loading, ignoring duplicate request');
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message || "Shared an image",
      timestamp: new Date(),
      hasImage: !!imageFile
    };

    if (!isRetry) {
      addMessage(userMessage);
    }
    
    setIsLoading(true);
    setShowQuickSuggestions(true);

    try {
      console.log('Submitting symptom report...');
      
      // Create symptom report entry for Make.com processing
      const report = await addSymptomReport(
        selectedPet.id,
        [], // Empty symptoms array for general questions
        message, // Question goes into notes field
        imageFile
      );

      console.log('Symptom report created successfully:', report?.id);

      // Add processing message with friendly text
      if (report?.id) {
        addProcessingMessage(report.id, 'Vet Assistant is reviewing... hang tight.');
      }

      // Clear retry state on success
      setRetryCount(0);
      setLastFailedMessage(null);

      toast({
        title: "Question Submitted",
        description: "Your question is being processed by our vet assistant.",
      });

    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Store failed message for retry
      setLastFailedMessage({ message, imageFile });
      
      // Determine if we should show retry option
      const shouldAllowRetry = retryCount < 3 && !error.message?.includes('Authentication');
      
      if (shouldAllowRetry) {
        setRetryCount(prev => prev + 1);
        
        toast({
          title: "Send Failed",
          description: `Message failed to send. Tap retry to try again. (Attempt ${retryCount + 1}/3)`,
          variant: "destructive",
        });
      } else {
        // Reset retry count after max attempts
        setRetryCount(0);
        setLastFailedMessage(null);
        
        let errorMessage = "Failed to submit your question. Please try again.";
        if (error.message?.includes('Authentication')) {
          errorMessage = "Please sign in again to submit your question.";
        } else if (error.message?.includes('network')) {
          errorMessage = "Network error. Please check your connection.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      console.log('Retrying failed message...');
      handleSendMessage(lastFailedMessage.message, lastFailedMessage.imageFile, true);
    }
  };

  const handleQuestionSelect = async (question: string) => {
    if (!selectedPet) return;
    await handleSendMessage(question);
  };

  const handleSymptomSubmit = async (symptoms: string[], notes: string, image?: File) => {
    if (!selectedPet) return;

    const symptomMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: `Symptoms reported: ${symptoms.join(', ')}${notes ? `\n\nNotes: ${notes}` : ''}`,
      timestamp: new Date(),
      hasImage: !!image
    };

    addMessage(symptomMessage);
    setShowQuickSuggestions(true);

    try {
      const report = await addSymptomReport(selectedPet.id, symptoms, notes, image);
      
      setShowSymptomLogger(false);

      // Add processing message for symptom diagnosis
      if (report?.id) {
        addProcessingMessage(report.id, 'Vet Assistant is analyzing the symptoms... hang tight.');
      }

      toast({
        title: "Symptoms Logged",
        description: "Your symptom report is being analyzed by our vet assistant.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log symptoms. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (showSymptomLogger) {
    return (
      <SymptomLogger
        onSubmit={handleSymptomSubmit}
        onCancel={() => setShowSymptomLogger(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Connection Status & Log Symptoms Button */}
      <div className="p-4 border-b">
        <ConnectionStatus
          connectionHealth={connectionHealth}
          pendingResponsesCount={pendingResponsesCount}
        />
        
        <Button
          onClick={() => setShowSymptomLogger(true)}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Symptoms
        </Button>
      </div>

      {/* Messages */}
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

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default SimplifiedAssistantChat;
