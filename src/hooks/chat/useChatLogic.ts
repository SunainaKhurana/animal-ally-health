
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useChatMessages, ChatMessage } from '@/hooks/useChatMessages';

export const useChatLogic = (selectedPetId?: string) => {
  const { toast } = useToast();
  const { addSymptomReport } = useSymptomReports();
  const { messages, addMessage, addProcessingMessage, connectionHealth, pendingResponsesCount } = useChatMessages(selectedPetId);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<{ message: string; imageFile?: File } | null>(null);

  // Reset loading and retry states when pet changes
  useEffect(() => {
    console.log('Pet changed, resetting chat states');
    setIsLoading(false);
    setShowQuickSuggestions(false);
    setRetryCount(0);
    setLastFailedMessage(null);
  }, [selectedPetId]);

  const handleSendMessage = async (message: string, imageFile?: File, isRetry: boolean = false) => {
    if (!message.trim() && !imageFile || !selectedPetId) return;

    console.log('Attempting to send message:', { message: message.substring(0, 50), hasImage: !!imageFile, isRetry });

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
      
      const report = await addSymptomReport(
        selectedPetId,
        [],
        message,
        imageFile
      );

      console.log('Symptom report created successfully:', report?.id);

      if (report?.id) {
        addProcessingMessage(report.id, 'Vet Assistant is reviewing... hang tight.');
      }

      setRetryCount(0);
      setLastFailedMessage(null);

      toast({
        title: "Question Submitted",
        description: "Your question is being processed by our vet assistant.",
      });

    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      setLastFailedMessage({ message, imageFile });
      
      const shouldAllowRetry = retryCount < 3 && !error.message?.includes('Authentication');
      
      if (shouldAllowRetry) {
        setRetryCount(prev => prev + 1);
        
        toast({
          title: "Send Failed",
          description: `Message failed to send. Tap retry to try again. (Attempt ${retryCount + 1}/3)`,
          variant: "destructive",
        });
      } else {
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
    if (!selectedPetId) return;
    await handleSendMessage(question);
  };

  const handleSymptomSubmit = async (symptoms: string[], notes: string, image?: File) => {
    if (!selectedPetId) return;

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
      const report = await addSymptomReport(selectedPetId, symptoms, notes, image);

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

  return {
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
  };
};
