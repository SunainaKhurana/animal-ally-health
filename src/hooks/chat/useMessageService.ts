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
    console.log('Adding message:', message.type, message.id);
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  const addProcessingMessage = useCallback((reportId: number, content: string) => {
    console.log('Adding processing message for report:', reportId);
    const processingMessage: ChatMessage = {
      id: `processing-${reportId}`,
      type: 'processing',
      content,
      timestamp: new Date(),
      reportId
    };
    
    setMessages(prev => [...prev, processingMessage]);
    return processingMessage;
  }, []);

  const handleResponse = useCallback((report: any) => {
    console.log('Handling response for report:', report.id);
    
    if (!report || !report.id) {
      console.warn('Invalid report received:', report);
      return;
    }

    const responseContent = report.diagnosis || report.ai_response;
    if (!responseContent) {
      console.log('No response content found for report:', report.id);
      return;
    }

    console.log('Processing AI response for report:', report.id);

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
            console.log('Removing processing message for report:', report.id);
            newMessages.splice(i, 1);
            i--; // Adjust index after removal
            updatedProcessing = true;
            continue;
          }
          
          // Update existing assistant message
          if (msg.reportId === report.id && msg.type === 'assistant') {
            console.log('Updating existing assistant message for report:', report.id);
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
          console.log('Adding new assistant message for report:', report.id);
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

    console.log('AI response processed successfully for report:', report.id);
  }, []);

  const loadHistoricalMessages = useCallback((reports: any[]) => {
    console.log('Loading historical messages from reports:', reports.length);
    
    if (!Array.isArray(reports)) {
      console.error('Invalid reports data - not an array:', reports);
      return new Set<number>();
    }

    const chatMessages: ChatMessage[] = [];
    const pendingReports = new Set<number>();

    try {
      reports.forEach((report: any, index: number) => {
        console.log(`Processing report ${index + 1}/${reports.length}:`, report.id);

        // Validate report data
        if (!report || !report.id || !report.created_at) {
          console.warn('Skipping invalid report:', report);
          return;
        }

        // Create user message with proper fallbacks
        let userContent = '';
        if (report.symptoms && Array.isArray(report.symptoms) && report.symptoms.length > 0) {
          userContent = `Symptoms reported: ${report.symptoms.join(', ')}`;
          if (report.notes && typeof report.notes === 'string') {
            userContent += `\n\nNotes: ${report.notes}`;
          }
        } else if (report.notes && typeof report.notes === 'string') {
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
        const hasResponse = (report.diagnosis && typeof report.diagnosis === 'string') || 
                           (report.ai_response && typeof report.ai_response === 'string');
                           
        if (hasResponse) {
          console.log('Report has response, creating assistant message:', report.id);
          const assistantMessage: ChatMessage = {
            id: `assistant-${report.id}`,
            type: 'assistant',
            content: report.diagnosis || report.ai_response || '',
            timestamp: new Date(report.created_at),
            reportId: report.id
          };
          chatMessages.push(assistantMessage);
        } else {
          console.log('Report has no response, creating processing message:', report.id);
          // Show processing message for reports without responses
          const processingMessage: ChatMessage = {
            id: `processing-${report.id}`,
            type: 'processing',
            content: report.symptoms && Array.isArray(report.symptoms) && report.symptoms.length > 0 
              ? 'Vet Assistant is analyzing the symptoms... hang tight.'
              : 'Vet Assistant is reviewing... hang tight.',
            timestamp: new Date(report.created_at),
            reportId: report.id
          };
          chatMessages.push(processingMessage);
          pendingReports.add(report.id);
        }
      });

      console.log('Historical messages processed:', chatMessages.length, 'pending:', pendingReports.size);
      setMessages(chatMessages);
      
    } catch (error) {
      console.error('Error processing historical messages:', error);
      setMessages([]);
    }

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
