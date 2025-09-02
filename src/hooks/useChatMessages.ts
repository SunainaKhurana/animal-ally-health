
import { useEffect, useCallback, useRef } from 'react';
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
  const isInitializedRef = useRef(false);
  const lastPetIdRef = useRef<string | undefined>(undefined);
  const isLoadingRef = useRef(false);
  const loadChatHistoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    pollingService.pendingResponsesCount
  );

  // Debounced load function to prevent rapid re-execution
  const loadChatHistory = useCallback(async () => {
    // Clear any pending timeout
    if (loadChatHistoryTimeoutRef.current) {
      clearTimeout(loadChatHistoryTimeoutRef.current);
      loadChatHistoryTimeoutRef.current = null;
    }

    // Prevent loading if already loading or no petId
    if (!petId || isLoadingRef.current) {
      if (!petId) {
        console.log('No petId provided, clearing messages');
        messageService.setMessages([]);
      }
      return;
    }

    // Prevent duplicate loads for the same pet
    if (lastPetIdRef.current === petId && isInitializedRef.current) {
      console.log('Chat history already loaded for pet:', petId);
      return;
    }

    isLoadingRef.current = true;
    console.log('Loading chat history for pet:', petId);

    try {
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
        
        isInitializedRef.current = true;
        lastPetIdRef.current = petId;
        return;
      }

      // Otherwise, fetch from database
      console.log('Fetching fresh chat history from database...');
      
      const { data: reports, error } = await supabase
        .from('symptom_reports')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Database error loading chat history:', error);
        
        // Handle specific error types
        if (error.code === 'PGRST116') {
          // No data found - not really an error
          console.log('No chat history found for this pet');
          messageService.setMessages([]);
          setCachedMessages(petId, []);
          setLastFetch(petId, now);
          isInitializedRef.current = true;
          lastPetIdRef.current = petId;
          return;
        }
        
        // For other errors, show cached or empty state
        console.warn('Failed to load chat history, showing cached or empty state');
        if (cachedMessages.length > 0) {
          messageService.setMessages(cachedMessages);
        } else {
          messageService.setMessages([]);
        }
        isInitializedRef.current = true;
        lastPetIdRef.current = petId;
        return;
      }

      console.log('Raw reports loaded:', reports?.length || 0);

      // Validate and filter reports
      const validReports = (reports || []).filter(report => {
        try {
          const isValid = report && report.id && report.created_at;
          if (!isValid) {
            console.warn('Filtering out invalid report:', report);
          }
          return isValid;
        } catch (err) {
          console.warn('Error validating report:', err);
          return false;
        }
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

      isInitializedRef.current = true;
      lastPetIdRef.current = petId;
      console.log('Chat history loaded and cached successfully');

    } catch (error: any) {
      console.error('Unexpected error loading chat history:', error);
      const now = Date.now();

      // Fallback to cached messages or empty state
      const cachedMessages = getCachedMessages(petId);
      if (cachedMessages.length > 0) {
        console.log('Using cached messages as fallback');
        messageService.setMessages(cachedMessages);
      } else {
        console.log('No cached messages available, showing empty state');
        messageService.setMessages([]);
        setCachedMessages(petId, []);
      }
      
      setLastFetch(petId, now);
      isInitializedRef.current = true;
      lastPetIdRef.current = petId;
    } finally {
      isLoadingRef.current = false;
    }
  }, [petId, messageService, pollingService, getCachedMessages, setCachedMessages, getLastFetch, setLastFetch, getPendingReports, addPendingReport]);

  const debouncedLoadChatHistory = useCallback(() => {
    // Clear any existing timeout
    if (loadChatHistoryTimeoutRef.current) {
      clearTimeout(loadChatHistoryTimeoutRef.current);
    }

    // Set a new timeout
    loadChatHistoryTimeoutRef.current = setTimeout(() => {
      loadChatHistory();
    }, 100);
  }, [loadChatHistory]);

  // Reset when pet changes
  useEffect(() => {
    if (lastPetIdRef.current !== petId) {
      console.log('Pet changed, resetting chat state:', petId);
      
      // Reset state
      isInitializedRef.current = false;
      isLoadingRef.current = false;
      
      // Clear current messages immediately
      messageService.setMessages([]);
      
      // Cleanup previous polling state
      pollingService.cleanup();
      
      // Load new chat history with debouncing
      if (petId) {
        debouncedLoadChatHistory();
      }
    }
  }, [petId, debouncedLoadChatHistory, messageService, pollingService]);

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
      
      // Clear timeout
      if (loadChatHistoryTimeoutRef.current) {
        clearTimeout(loadChatHistoryTimeoutRef.current);
        loadChatHistoryTimeoutRef.current = null;
      }
      
      pollingService.cleanup();
      isInitializedRef.current = false;
      isLoadingRef.current = false;
      lastPetIdRef.current = undefined;
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
