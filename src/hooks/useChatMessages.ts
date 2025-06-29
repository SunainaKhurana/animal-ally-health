import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useChatCache } from '@/contexts/ChatCacheContext';
import { usePollingService } from './chat/usePollingService';
import { useRealtimeService } from './chat/useRealtimeService';
import { useMessageService } from './chat/useMessageService';

export type { ChatMessage } from './chat/types';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useChatMessages = (petId?: string) => {
  const { toast } = useToast();
  const messageService = useMessageService();
  const {
    getCachedMessages,
    setCachedMessages,
    addMessage: addCachedMessage,
    updateMessage: updateCachedMessage,
    getPendingReports,
    addPendingReport,
    removePendingReport,
    getLastFetch,
    setLastFetch
  } = useChatCache();

  const pollingService = usePollingService((report) => {
    if (!petId) return;
    
    console.log('Polling service response received:', report.id);
    removePendingReport(petId, report.id);
    
    // Update message in cache
    const processingMessageId = `processing-${report.id}`;
    updateCachedMessage(petId, processingMessageId, {
      id: `assistant-${report.id}`,
      type: 'assistant',
      content: report.ai_response || 'Analysis complete.',
      timestamp: new Date(report.created_at),
      isProcessing: false
    });
  });

  // Use real-time service
  useRealtimeService(
    petId,
    (report) => {
      if (!petId) return;
      
      console.log('Real-time response received:', report.id);
      pollingService.removePendingReport(report.id);
      removePendingReport(petId, report.id);
      
      // Update message in cache
      const processingMessageId = `processing-${report.id}`;
      updateCachedMessage(petId, processingMessageId, {
        id: `assistant-${report.id}`,
        type: 'assistant',
        content: report.ai_response || 'Analysis complete.',
        timestamp: new Date(report.created_at),
        isProcessing: false
      });
    },
    pollingService.lastPollTime,
    pollingService.startAggressivePolling,
    pollingService.pendingResponsesCount
  );

  // Load chat history with caching
  const loadChatHistory = useCallback(async () => {
    if (!petId) {
      console.log('No petId provided, clearing messages');
      messageService.setMessages([]);
      return;
    }

    console.log('Loading chat history for pet:', petId);

    // Check cache first
    const cachedMessages = getCachedMessages(petId);
    const lastFetch = getLastFetch(petId);
    const now = Date.now();

    // If we have recent cached data, use it
    if (cachedMessages.length > 0 && (now - lastFetch) < CACHE_DURATION) {
      console.log('Using cached messages:', cachedMessages.length);
      messageService.setMessages(cachedMessages);
      
      // Restore pending reports
      const pendingReports = getPendingReports(petId);
      pendingReports.forEach(reportId => {
        pollingService.addPendingReport(reportId);
      });
      
      return;
    }

    // Otherwise, fetch from database
    try {
      console.log('Fetching fresh chat history from database...');
      
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

      // Cache the messages
      setCachedMessages(petId, messageService.messages);
      setLastFetch(petId, now);

      // Handle pending reports
      if (pendingReports.size > 0) {
        pendingReports.forEach(reportId => {
          console.log('Adding pending report to polling:', reportId);
          pollingService.addPendingReport(reportId);
          addPendingReport(petId, reportId);
        });
      }

      console.log('Chat history loaded and cached successfully');

    } catch (error: any) {
      console.error('Error loading chat history:', error);

      // Show user-friendly error message
      let errorMessage = "Failed to load chat history. Please try again.";
      
      if (error.message?.includes('Authentication')) {
        errorMessage = "Please sign in again to load your chat history.";
      } else if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.code === 'PGRST116') {
        // No data found - not really an error
        console.log('No chat history found for this pet');
        messageService.setMessages([]);
        setCachedMessages(petId, []);
        setLastFetch(petId, now);
        return;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Set empty messages on error to prevent UI issues
      messageService.setMessages([]);
      setCachedMessages(petId, []);
    }
  }, [petId, messageService, pollingService, toast, getCachedMessages, setCachedMessages, getLastFetch, setLastFetch, getPendingReports, addPendingReport]);

  // Load chat history when pet changes
  useEffect(() => {
    console.log('Pet changed, loading chat history:', petId);
    
    // Clear current messages immediately
    messageService.setMessages([]);
    
    // Cleanup previous polling state
    pollingService.cleanup();
    
    // Load new chat history
    if (petId) {
      loadChatHistory();
    }
  }, [petId, loadChatHistory, messageService, pollingService]);

  const addProcessingMessage = (reportId: number, content: string) => {
    if (!petId) return;
    
    console.log('Adding processing message for report:', reportId);
    pollingService.addPendingReport(reportId);
    addPendingReport(petId, reportId);
    
    const processingMessage = messageService.addProcessingMessage(reportId, content);
    
    // Add to cache
    addCachedMessage(petId, processingMessage);
  };

  const addMessage = (message: any) => {
    if (!petId) return;
    
    const addedMessage = messageService.addMessage(message);
    
    // Add to cache
    addCachedMessage(petId, addedMessage);
    
    return addedMessage;
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
    addMessage,
    addProcessingMessage,
    connectionHealth: pollingService.connectionHealth,
    pendingResponsesCount: pollingService.pendingResponsesCount
  };
};
