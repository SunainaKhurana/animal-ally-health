import { useCallback } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseChatLogic = (selectedPetId?: string) => {
  const { toast } = useToast();
  const { addSymptomReport } = useSymptomReports();
  
  const {
    conversation,
    messages,
    loading,
    sendingMessage,
    sendMessage,
    refreshMessages
  } = useConversations(selectedPetId);

  // Handle sending messages from chat input
  const handleSendMessage = useCallback(async (message: string, imageFile?: File) => {
    if (!selectedPetId) return;

    try {
      // Handle attachments if there's an image
      let attachments = null;
      if (imageFile) {
        // For now, we'll just store the file info
        // In a full implementation, you'd upload to Supabase Storage first
        attachments = {
          hasImage: true,
          fileName: imageFile.name,
          fileSize: imageFile.size
        };
      }

      await sendMessage(message, attachments);
      
    } catch (error: any) {
      console.error('Error in handleSendMessage:', error);
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedPetId, sendMessage, toast]);

  // Handle retry functionality
  const handleRetry = useCallback(() => {
    // For now, just refresh messages
    // In a full implementation, you'd retry the last failed message
    refreshMessages();
  }, [refreshMessages]);

  // Handle quick question selection
  const handleQuestionSelect = useCallback(async (question: string) => {
    if (!selectedPetId) return;
    await handleSendMessage(question);
  }, [selectedPetId, handleSendMessage]);

  // Handle symptom submission - integrate with existing system but also send to chat
  const handleSymptomSubmit = useCallback(async (symptoms: string[], notes: string, image?: File) => {
    if (!selectedPetId) return;
    
    try {
      // Create the symptom report using existing system
      await addSymptomReport(selectedPetId, symptoms, notes, image, []);
      
      // Also add to chat conversation
      const chatMessage = `Symptoms: ${symptoms.join(', ')}${notes ? `\n\nNotes: ${notes}` : ''}`;
      
      let attachments = null;
      if (image) {
        attachments = {
          hasImage: true,
          fileName: image.name,
          fileSize: image.size,
          type: 'symptom_report'
        };
      }

      await sendMessage(chatMessage, attachments);
      
    } catch (error: any) {
      console.error('Error submitting symptoms:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit symptoms. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedPetId, addSymptomReport, sendMessage, toast]);

  // Convert messages to the format expected by the UI
  const formattedMessages = messages.map(msg => ({
    id: msg.id,
    type: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.created_at),
    hasImage: msg.attachments?.hasImage || false,
    isProcessing: false
  }));

  return {
    messages: formattedMessages,
    isLoading: loading || sendingMessage,
    showQuickSuggestions: false, // Can be enhanced later
    retryCount: 0, // Can be enhanced later
    lastFailedMessage: null, // Can be enhanced later
    connectionHealth: 'connected' as const, // Since we're using Supabase directly
    pendingResponsesCount: 0, // No polling needed
    handleSendMessage,
    handleRetry,
    handleQuestionSelect,
    handleSymptomSubmit
  };
};