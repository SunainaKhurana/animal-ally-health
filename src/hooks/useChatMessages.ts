import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  // Listen for real-time updates from Make.com responses
  useEffect(() => {
    if (!petId) return;

    const channel = supabase
      .channel('symptom-reports-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'symptom_reports',
          filter: `pet_id=eq.${petId}`
        },
        (payload) => {
          console.log('Symptom report updated:', payload);
          const updatedReport = payload.new;
          
          // Check if diagnosis or ai_response was added
          if (updatedReport.diagnosis || updatedReport.ai_response) {
            handleMakeComResponse(updatedReport);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [petId]);

  const handleMakeComResponse = (report: any) => {
    const responseContent = report.diagnosis || report.ai_response;
    if (!responseContent) return;

    // Find and update the processing message for this report
    setMessages(prev => prev.map(msg => {
      if (msg.reportId === report.id && msg.type === 'processing') {
        return {
          ...msg,
          type: 'assistant' as const,
          content: responseContent,
          timestamp: new Date()
        };
      }
      return msg;
    }));

    // Remove any duplicate processing messages for this report
    setMessages(prev => prev.filter((msg, index, arr) => {
      if (msg.reportId === report.id && msg.type === 'processing') {
        // Keep only the first processing message for this report
        return arr.findIndex(m => m.reportId === report.id && m.type === 'processing') === index;
      }
      return true;
    }));

    toast({
      title: "Response Received",
      description: "Your vet assistant has provided an analysis.",
    });
  };

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const addProcessingMessage = (reportId: number, content: string) => {
    const processingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'processing',
      content,
      timestamp: new Date(),
      reportId
    };
    setMessages(prev => [...prev, processingMessage]);
  };

  return {
    messages,
    addMessage,
    addProcessingMessage
  };
};
