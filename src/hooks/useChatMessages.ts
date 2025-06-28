
import { useState, useEffect } from 'react';
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
          }
        });

        setMessages(chatMessages);
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

  // Listen for real-time updates from Make.com responses with optimized polling
  useEffect(() => {
    if (!petId) return;

    const channel = supabase
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
          console.log('Symptom report updated:', payload);
          const updatedReport = payload.new;
          
          // Check if diagnosis or ai_response was added
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
          console.log('New symptom report created:', payload);
          // This helps sync across devices immediately
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

    setMessages(prev => {
      // Remove the processing message for this report
      const withoutProcessing = prev.filter(msg => 
        !(msg.reportId === report.id && msg.type === 'processing')
      );

      // Add or update the assistant message
      const existingAssistantIndex = withoutProcessing.findIndex(msg => 
        msg.reportId === report.id && msg.type === 'assistant'
      );

      if (existingAssistantIndex >= 0) {
        // Update existing assistant message
        withoutProcessing[existingAssistantIndex] = {
          ...withoutProcessing[existingAssistantIndex],
          content: responseContent,
          timestamp: new Date()
        };
        return withoutProcessing;
      } else {
        // Add new assistant message
        const assistantMessage: ChatMessage = {
          id: `assistant-${report.id}`,
          type: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          reportId: report.id
        };
        return [...withoutProcessing, assistantMessage];
      }
    });

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
      id: `processing-${reportId}`,
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
