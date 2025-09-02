
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useChatMessages } from '@/hooks/useChatMessages';

export const useChatLogic = (selectedPetId?: string) => {
  const { toast } = useToast();
  const { addSymptomReport } = useSymptomReports();
  const { 
    messages, 
    addMessage,
    connectionHealth, 
    pendingResponsesCount
  } = useChatMessages(selectedPetId);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<{ message: string; imageFile?: File } | null>(null);
  
  // Use ref to track the current pet ID to prevent race conditions
  const selectedPetIdRef = useRef(selectedPetId);

  // Reset states when pet changes
  useEffect(() => {
    if (selectedPetIdRef.current !== selectedPetId) {
      console.log('Pet changed in chat logic, resetting states');
      selectedPetIdRef.current = selectedPetId;
      
      // Reset all states
      setIsLoading(false);
      setShowQuickSuggestions(false);
      setRetryCount(0);
      setLastFailedMessage(null);
    }
  }, [selectedPetId]);

  const handleSendMessage = useCallback(async (message: string, imageFile?: File, isRetry: boolean = false) => {
    if (!selectedPetId) return;
    
    // Prevent duplicate requests
    if (isLoading && !isRetry) {
      console.log('Already processing a message, skipping duplicate request');
      return;
    }

    try {
      setIsLoading(true);
      setShowQuickSuggestions(false);
      
      // Reset retry state if this is a new message (not a retry)
      if (!isRetry) {
        setRetryCount(0);
        setLastFailedMessage(null);
      }

      // Add user message
      const userMessage = addMessage({
        type: 'user',
        content: message,
        hasImage: !!imageFile
      });

      // Convert symptoms string to array and submit to symptom reports with chat context
      const symptoms = message.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      console.log('Submitting symptoms to report system:', symptoms);
      const reportData = await addSymptomReport(selectedPetId, symptoms, message, imageFile, messages);
      
      console.log('Symptom report created:', reportData);
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Check if pet ID changed during the async operation
      if (selectedPetIdRef.current !== selectedPetId) {
        console.log('Pet ID changed during operation, ignoring error');
        return;
      }
      
      setLastFailedMessage({ message, imageFile });
      
      // Show error toast
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPetId, isLoading, addMessage, messages, addSymptomReport, toast]);

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

  const handleSymptomSubmit = useCallback(async (symptoms: string[], notes: string, image?: File) => {
    if (!selectedPetId) return;
    
    try {
      setIsLoading(true);
      
      // Add user message to chat
      const userMessage = addMessage({
        type: 'user',
        content: `Symptoms: ${symptoms.join(', ')}${notes ? `\nNotes: ${notes}` : ''}`,
        hasImage: !!image
      });

      // Submit symptom report with chat context
      const reportData = await addSymptomReport(selectedPetId, symptoms, notes, image, messages);
      
      console.log('Symptom report created:', reportData);
      
    } catch (error: any) {
      console.error('Error submitting symptoms:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit symptoms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPetId, addMessage, messages, addSymptomReport, toast]);

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
