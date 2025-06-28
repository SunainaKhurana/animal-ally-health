
import { useEffect } from 'react';
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
      pollingService.removePendingReport(report.id);
      messageService.handleResponse(report);
    },
    pollingService.lastPollTime,
    pollingService.startAggressivePolling,
    pollingService.pendingResponsesCount
  );

  // Load historical symptom reports and reconstruct chat history
  useEffect(() => {
    if (!petId) {
      messageService.setMessages([]);
      return;
    }

    const loadChatHistory = async () => {
      try {
        const { data: reports, error } = await supabase
          .from('symptom_reports')
          .select('*')
          .eq('pet_id', petId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const pendingReports = messageService.loadHistoricalMessages(reports || []);

        // Start aggressive polling if there are pending reports
        if (pendingReports.size > 0) {
          pendingReports.forEach(reportId => {
            pollingService.addPendingReport(reportId);
          });
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        toast({
          title: "Error",
          description: "Failed to load chat history",
          variant: "destructive",
        });
      }
    };

    loadChatHistory();
  }, [petId, toast, messageService, pollingService]);

  const addProcessingMessage = (reportId: number, content: string) => {
    pollingService.addPendingReport(reportId);
    messageService.addProcessingMessage(reportId, content);
  };

  // Cleanup on unmount
  useEffect(() => {
    return pollingService.cleanup;
  }, [pollingService]);

  return {
    messages: messageService.messages,
    addMessage: messageService.addMessage,
    addProcessingMessage,
    connectionHealth: pollingService.connectionHealth,
    pendingResponsesCount: pollingService.pendingResponsesCount
  };
};
