
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SymptomReport } from '@/hooks/useSymptomReports';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'processing';
  content: string;
  timestamp: Date;
  hasImage?: boolean;
  reportId?: number;
}

export const useChatMessages = (petId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingReportsRef = useRef<Set<number>>(new Set());
  const lastPollTimeRef = useRef<number>(0);
  const connectionHealthRef = useRef<'connected' | 'disconnected' | 'polling'>('connected');

  // Memoized message map for O(1) lookups
  const messageMap = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    messages.forEach(msg => map.set(msg.id, msg));
    return map;
  }, [messages]);

  // Load historical symptom reports and reconstruct chat history
  useEffect(() => {
    if (!petId) {
      setMessages([]);
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

        const chatMessages: ChatMessage[] = [];
        const pendingReports = new Set<number>();

        reports?.forEach((report: SymptomReport) => {
          // Create user message
          let userContent = '';
          if (report.symptoms && report.symptoms.length > 0) {
            userContent = `Symptoms reported: ${report.symptoms.join(', ')}`;
            if (report.notes) {
              userContent += `\n\nNotes: ${report.notes}`;
            }
          } else if (report.notes) {
            userContent = report.notes;
          } else {
            userContent = "Shared an image";
          }

          const userMessage: ChatMessage = {
            id: `user-${report.id}`,
            type: 'user',
            content: userContent,
            timestamp: new Date(report.created_at),
            hasImage: !!report.photo_url,
            reportId: report.id
          };

          chatMessages.push(userMessage);

          // Create assistant message or processing message
          const hasResponse = report.diagnosis || report.ai_response;
          if (hasResponse) {
            const assistantMessage: ChatMessage = {
              id: `assistant-${report.id}`,
              type: 'assistant',
              content: report.diagnosis || report.ai_response || '',
              timestamp: new Date(report.created_at),
              reportId: report.id
            };
            chatMessages.push(assistantMessage);
          } else {
            // Show processing message for reports without responses
            const processingMessage: ChatMessage = {
              id: `processing-${report.id}`,
              type: 'processing',
              content: report.symptoms && report.symptoms.length > 0 
                ? 'Vet Assistant is analyzing the symptoms... hang tight.'
                : 'Vet Assistant is reviewing... hang tight.',
              timestamp: new Date(report.created_at),
              reportId: report.id
            };
            chatMessages.push(processingMessage);
            pendingReports.add(report.id);
          }
        });

        setMessages(chatMessages);
        pendingReportsRef.current = pendingReports;

        // Start aggressive polling if there are pending reports
        if (pendingReports.size > 0) {
          startAggressivePolling();
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
  }, [petId, toast]);

  // Aggressive polling for pending responses
  const startAggressivePolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    let pollCount = 0;
    const maxPolls = 60; // Poll for 3 minutes max (3s * 60 = 180s)

    pollIntervalRef.current = setInterval(async () => {
      pollCount++;
      
      if (pendingReportsRef.current.size === 0 || pollCount > maxPolls) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        connectionHealthRef.current = 'connected';
        return;
      }

      connectionHealthRef.current = 'polling';
      
      try {
        const pendingIds = Array.from(pendingReportsRef.current);
        const { data: reports, error } = await supabase
          .from('symptom_reports')
          .select('*')
          .in('id', pendingIds);

        if (error) throw error;

        reports?.forEach((report: SymptomReport) => {
          if (report.diagnosis || report.ai_response) {
            handleMakeComResponse(report);
          }
        });

        lastPollTimeRef.current = Date.now();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds
  }, []);

  // Multi-channel real-time listening with improved performance
  useEffect(() => {
    if (!petId) return;

    // Primary channel for updates
    const updateChannel = supabase
      .channel(`symptom-reports-updates-${petId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'symptom_reports',
          filter: `pet_id=eq.${petId}`
        },
        (payload) => {
          console.log('Real-time update received:', payload.new);
          const updatedReport = payload.new;
          
          if (updatedReport.diagnosis || updatedReport.ai_response) {
            handleMakeComResponse(updatedReport);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'symptom_reports',
          filter: `pet_id=eq.${petId}`
        },
        (payload) => {
          console.log('Real-time insert received:', payload.new);
          // Handle immediate responses (if any)
          const newReport = payload.new;
          if (newReport.diagnosis || newReport.ai_response) {
            handleMakeComResponse(newReport);
          }
        }
      )
      .subscribe((status) => {
        console.log('Primary channel status:', status);
        if (status === 'SUBSCRIBED') {
          connectionHealthRef.current = 'connected';
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          connectionHealthRef.current = 'disconnected';
          // Fallback to aggressive polling
          if (pendingReportsRef.current.size > 0) {
            startAggressivePolling();
          }
        }
      });

    // Secondary backup channel for redundancy
    const backupChannel = supabase
      .channel(`symptom-backup-${petId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'symptom_reports',
          filter: `pet_id=eq.${petId}`
        },
        (payload) => {
          // Only process if primary channel hasn't handled it recently
          const timeSinceLastPoll = Date.now() - lastPollTimeRef.current;
          if (timeSinceLastPoll > 1000) {
            const updatedReport = payload.new;
            if (updatedReport.diagnosis || updatedReport.ai_response) {
              handleMakeComResponse(updatedReport);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(updateChannel);
      supabase.removeChannel(backupChannel);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [petId, startAggressivePolling]);

  // Optimized response handler with direct message replacement
  const handleMakeComResponse = useCallback((report: any) => {
    const responseContent = report.diagnosis || report.ai_response;
    if (!responseContent) return;

    // Remove from pending reports
    pendingReportsRef.current.delete(report.id);

    // Stop polling if no more pending reports
    if (pendingReportsRef.current.size === 0 && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      connectionHealthRef.current = 'connected';
    }

    // Optimized state update using requestAnimationFrame for smooth UI
    requestAnimationFrame(() => {
      setMessages(prev => {
        const newMessages = [...prev];
        let updatedProcessing = false;

        // Direct replacement instead of filtering
        for (let i = 0; i < newMessages.length; i++) {
          const msg = newMessages[i];
          
          // Remove processing message
          if (msg.reportId === report.id && msg.type === 'processing') {
            newMessages.splice(i, 1);
            i--; // Adjust index after removal
            updatedProcessing = true;
            continue;
          }
          
          // Update existing assistant message
          if (msg.reportId === report.id && msg.type === 'assistant') {
            newMessages[i] = {
              ...msg,
              content: responseContent,
              timestamp: new Date()
            };
            return newMessages;
          }
        }

        // Add new assistant message if no existing one was found
        if (updatedProcessing || !newMessages.some(msg => msg.reportId === report.id && msg.type === 'assistant')) {
          const assistantMessage: ChatMessage = {
            id: `assistant-${report.id}`,
            type: 'assistant',
            content: responseContent,
            timestamp: new Date(),
            reportId: report.id
          };
          newMessages.push(assistantMessage);
        }

        return newMessages;
      });
    });

    // Minimal toast notification
    console.log('AI response received for report:', report.id);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const addProcessingMessage = useCallback((reportId: number, content: string) => {
    const processingMessage: ChatMessage = {
      id: `processing-${reportId}`,
      type: 'processing',
      content,
      timestamp: new Date(),
      reportId
    };
    
    // Add to pending reports for polling
    pendingReportsRef.current.add(reportId);
    
    // Start aggressive polling immediately
    startAggressivePolling();
    
    addMessage(processingMessage);
  }, [addMessage, startAggressivePolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    messages,
    addMessage,
    addProcessingMessage,
    connectionHealth: connectionHealthRef.current,
    pendingResponsesCount: pendingReportsRef.current.size
  };
};
