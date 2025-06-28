
import { useState, useCallback, useMemo } from 'react';
import { ChatMessage } from './types';

export const useMessageService = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Memoized message map for O(1) lookups
  const messageMap = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    messages.forEach(msg => map.set(msg.id, msg));
    return map;
  }, [messages]);

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
    
    addMessage(processingMessage);
  }, [addMessage]);

  // Optimized response handler with direct message replacement
  const handleResponse = useCallback((report: any) => {
    const responseContent = report.diagnosis || report.ai_response;
    if (!responseContent) return;

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

    console.log('AI response received for report:', report.id);
  }, []);

  const loadHistoricalMessages = useCallback((reports: any[]) => {
    const chatMessages: ChatMessage[] = [];
    const pendingReports = new Set<number>();

    reports?.forEach((report: any) => {
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
    return pendingReports;
  }, []);

  return {
    messages,
    messageMap,
    addMessage,
    addProcessingMessage,
    handleResponse,
    loadHistoricalMessages,
    setMessages
  };
};
