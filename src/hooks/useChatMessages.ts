
import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePollingService } from './chat/usePollingService';
import { useRealtimeService } from './chat/useRealtimeService';
import { useMessageService } from './chat/useMessageService';

export type { ChatMessage } from './chat/types';

export const useChatMessages = (petId?: string) => {
  const { toast } = useToast();
  const messageService = useMessageService();
  const pollingService = usePollingService(messageService.handleResponse);

  // Use real-time service
  useRealtimeService(
    petId,
    (report) => {
      console.log('Real-time response received:', report.id);
      pollingService.removePendingReport(report.id);
      messageService.handleResponse(report);
    },
    pollingService.lastPollTime,
    pollingService.startAggressivePolling,
    pollingService.pendingResponsesCount
  );

  // Memoized function to load chat history
  const loadChatHistory = useCallback(async () => {
    if (!petId) {
      console.log('No petId provided, clearing messages');
      messageService.setMessages([]);
      return;
    }

    console.log('Loading chat history for pet:', petId);

    try {
      const { data: reports, error } = await supabase
        .from('symptom_reports')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Database error loading chat history:', error);
        throw error;
      }

      console.log('Raw reports loaded:', reports?.length || 0);

      // Validate and filter reports
      const validReports = (reports || []).filter(report => {
        const isValid = report && report.id && report.created_at;
        if (!isValid) {
          console.warn('Filtering out invalid report:', report);
        }
        return isValid;
      });

      console.log('Valid reports after filtering:', validReports.length);

      const pendingReports = messageService.loadHistoricalMessages(validReports);

      console.log('Pending reports count:', pendingReports.size);

      // Start aggressive polling if there are pending reports
      if (pendingReports.size > 0) {
        pendingReports.forEach(reportId => {
          console.log('Adding pending report to polling:', reportId);
          pollingService.addPendingReport(reportId);
        });
      }

      console.log('Chat history loaded successfully');

    } catch (error: any) {
      console.error('Error loading chat history - Details:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        petId
      });

      // Show user-friendly error message
      let errorMessage = "Failed to load chat history. Please try again.";
      
      if (error.message?.includes('Authentication')) {
        errorMessage = "Please sign in again to load your chat history.";
      } else if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.code === 'PGRST116') {
        errorMessage = "No chat history found for this pet.";
        // This is not really an error, just set empty messages
        messageService.setMessages([]);
        return;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Set empty messages on error to prevent UI issues
      messageService.setMessages([]);
    }
  }, [petId, messageService, pollingService, toast]);

  // Load historical symptom reports and reconstruct chat history
  useEffect(() => {
    console.log('useEffect triggered for pet:', petId);
    loadChatHistory();
  }, [loadChatHistory]);

  const addProcessingMessage = (reportId: number, content: string) => {
    console.log('Adding processing message for report:', reportId);
    pollingService.addPendingReport(reportId);
    messageService.addProcessingMessage(reportId, content);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up chat messages hook');
      pollingService.cleanup();
    };
  }, [pollingService]);

  return {
    messages: messageService.messages,
    addMessage: messageService.addMessage,
    addProcessingMessage,
    connectionHealth: pollingService.connectionHealth,
    pendingResponsesCount: pollingService.pendingResponsesCount
  };
};
