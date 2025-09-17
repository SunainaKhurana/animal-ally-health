import { useCallback } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/hooks/chat/types';

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
        // TODO: Upload to Supabase Storage first, then store the URL
        // For now, we'll just store basic metadata
        attachments = {
          hasImage: true,
          fileName: imageFile.name,
          fileSize: imageFile.size,
          tempImage: true // Flag to indicate this needs proper upload
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
        // TODO: Upload to Supabase Storage first, then store the URL
        attachments = {
          hasImage: true,
          fileName: image.name,
          fileSize: image.size,
          type: 'symptom_report',
          tempImage: true // Flag to indicate this needs proper upload
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
  const formattedMessages: ChatMessage[] = messages.map(msg => ({
    id: msg.id,
    type: msg.role === 'typing' ? 'typing' : msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: new Date(msg.created_at),
    hasImage: msg.attachments?.hasImage || false,
    isProcessing: msg.role === 'typing'
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