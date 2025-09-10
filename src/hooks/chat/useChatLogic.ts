
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useChatMessages } from '@/hooks/useChatMessages';
import { supabase } from '@/integrations/supabase/client';

export const useChatLogic = (selectedPetId?: string) => {
  const { toast } = useToast();
  const { addSymptomReport } = useSymptomReports();
  const { 
    messages, 
    addMessage,
    connectionHealth, 
    pendingResponsesCount
  } = useChatMessages(selectedPetId);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState<{ message: string; imageFile?: File } | null>(null);
  
  // Use ref to track the current pet ID to prevent race conditions
  const selectedPetIdRef = useRef(selectedPetId);

  // Reset states when pet changes
  useEffect(() => {
    if (selectedPetIdRef.current !== selectedPetId) {
      console.log('Pet changed in chat logic, resetting states');
      selectedPetIdRef.current = selectedPetId;
      
      // Reset all states
      setIsLoading(false);
      setShowQuickSuggestions(false);
      setRetryCount(0);
      setLastFailedMessage(null);
    }
  }, [selectedPetId]);

  const handleSendMessage = useCallback(async (message: string, imageFile?: File, isRetry: boolean = false) => {
    if (!selectedPetId) return;
    
    // Prevent duplicate requests
    if (isLoading && !isRetry) {
      console.log('Already processing a message, skipping duplicate request');
      return;
    }

    try {
      setIsLoading(true);
      setShowQuickSuggestions(false);
      
      // Reset retry state if this is a new message (not a retry)
      if (!isRetry) {
        setRetryCount(0);
        setLastFailedMessage(null);
      }

      // Add user message
      const userMessage = addMessage({
        type: 'user',
        content: message,
        hasImage: !!imageFile
      });

      // Check if this is a query about existing health concerns (from Ask AI button)
      const isHealthLogQuery = message.includes("I'd like to ask about these health concerns for my pet:");
      
      if (isHealthLogQuery) {
        console.log('Detected health log query, sending directly to Make.com');
        await sendHealthLogQueryToMake(selectedPetId, message, imageFile, messages);
      } else {
        // Convert symptoms string to array and submit to symptom reports with chat context
        const symptoms = message.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        console.log('Submitting symptoms to report system:', symptoms);
        const reportData = await addSymptomReport(selectedPetId, symptoms, message, imageFile, messages);
        
        console.log('Symptom report created:', reportData);
      }
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Check if pet ID changed during the async operation
      if (selectedPetIdRef.current !== selectedPetId) {
        console.log('Pet ID changed during operation, ignoring error');
        return;
      }
      
      setLastFailedMessage({ message, imageFile });
      
      // Show error toast
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPetId, isLoading, addMessage, messages, addSymptomReport, toast]);

  const handleRetry = () => {
    if (lastFailedMessage) {
      console.log('Retrying failed message...');
      handleSendMessage(lastFailedMessage.message, lastFailedMessage.imageFile, true);
    }
  };

  const handleQuestionSelect = async (question: string) => {
    if (!selectedPetId) return;
    await handleSendMessage(question);
  };

  const handleSymptomSubmit = useCallback(async (symptoms: string[], notes: string, image?: File) => {
    if (!selectedPetId) return;
    
    try {
      setIsLoading(true);
      
      // Add user message to chat
      const userMessage = addMessage({
        type: 'user',
        content: `Symptoms: ${symptoms.join(', ')}${notes ? `\nNotes: ${notes}` : ''}`,
        hasImage: !!image
      });

      // Submit symptom report with chat context
      const reportData = await addSymptomReport(selectedPetId, symptoms, notes, image, messages);
      
      console.log('Symptom report created:', reportData);
      
    } catch (error: any) {
      console.error('Error submitting symptoms:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit symptoms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPetId, addMessage, messages, addSymptomReport, toast]);

  const sendHealthLogQueryToMake = async (
    petId: string,
    query: string,
    imageFile?: File,
    chatContext?: any[]
  ) => {
    try {
      console.log('Sending health log query to Make.com webhook');
      
      // Get pet details for context
      const { data: pet } = await supabase.from('pets')
        .select('name, breed, species, age_years, age_months, weight_kg, gender, pre_existing_conditions')
        .eq('id', petId)
        .single();

      // Get recent health reports for additional context
      const { data: recentReports } = await supabase
        .from('health_reports')
        .select('report_type, ai_diagnosis, key_findings, report_date')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent symptom reports for pattern analysis
      const { data: recentSymptoms } = await supabase
        .from('symptom_reports')
        .select('symptoms, diagnosis, reported_on')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(10);

      const payload = {
        isHealthLogQuery: true,
        query,
        petId,
        petProfile: pet,
        recentHealthReports: recentReports || [],
        recentSymptomReports: recentSymptoms || [],
        chatContext: chatContext || [],
        timestamp: new Date().toISOString()
      };

      console.log('Make.com webhook payload for health log query:', payload);

      const response = await fetch('https://hook.eu2.make.com/es5jhdfotkr146ihy2ll02vjyuq75wdv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Make.com webhook failed: ${response.status} ${response.statusText}`);
      }

      // Add processing message to indicate AI is working
      const processingMessage = addMessage({
        type: 'processing',
        content: 'AI is analyzing your health log query...'
      });

      console.log('Successfully sent health log query to Make.com webhook');
      
      // The response will be handled by the polling/realtime system
      
    } catch (error) {
      console.error('Error sending health log query to Make.com:', error);
      addMessage({
        type: 'assistant',
        content: 'I apologize, but I\'m unable to analyze your health log query at the moment. Please try again later.'
      });
      throw error;
    }
  };

  return {
    messages,
    isLoading,
    showQuickSuggestions,
    retryCount,
    lastFailedMessage,
    connectionHealth,
    pendingResponsesCount,
    handleSendMessage,
    handleRetry,
    handleQuestionSelect,
    handleSymptomSubmit
  };
};
