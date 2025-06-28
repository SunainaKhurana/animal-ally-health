
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useToast } from '@/hooks/use-toast';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useChatMessages, ChatMessage } from '@/hooks/useChatMessages';
import SymptomLogger from './SymptomLogger';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';
import CommonQuestions from './CommonQuestions';

const SimplifiedAssistantChat = () => {
  const { selectedPet } = usePetContext();
  const { toast } = useToast();
  const { addSymptomReport } = useSymptomReports();
  const { messages, addMessage, addProcessingMessage } = useChatMessages(selectedPet?.id);
  const [isLoading, setIsLoading] = useState(false);
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-scroll to bottom when messages container becomes visible
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length]);

  const handleSendMessage = async (message: string, imageFile?: File) => {
    if (!message.trim() && !imageFile || !selectedPet) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message || "Shared an image",
      timestamp: new Date(),
      hasImage: !!imageFile
    };

    addMessage(userMessage);
    setIsLoading(true);
    setShowQuickSuggestions(true); // Show suggestions after sending a message

    try {
      // Create symptom report entry for Make.com processing
      const report = await addSymptomReport(
        selectedPet.id,
        [], // Empty symptoms array for general questions
        message, // Question goes into notes field
        imageFile
      );

      // Add processing message with friendly text
      if (report?.id) {
        addProcessingMessage(report.id, 'Vet Assistant is reviewing... hang tight.');
      }

      toast({
        title: "Question Submitted",
        description: "Your question is being processed by our vet assistant.",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = async (question: string) => {
    if (!selectedPet) return;
    await handleSendMessage(question);
  };

  const handleSymptomSubmit = async (symptoms: string[], notes: string, image?: File) => {
    if (!selectedPet) return;

    const symptomMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: `Symptoms reported: ${symptoms.join(', ')}${notes ? `\n\nNotes: ${notes}` : ''}`,
      timestamp: new Date(),
      hasImage: !!image
    };

    addMessage(symptomMessage);
    setShowQuickSuggestions(true); // Show suggestions after logging symptoms

    try {
      const report = await addSymptomReport(selectedPet.id, symptoms, notes, image);
      
      setShowSymptomLogger(false);

      // Add processing message for symptom diagnosis
      if (report?.id) {
        addProcessingMessage(report.id, 'Vet Assistant is analyzing the symptoms... hang tight.');
      }

      toast({
        title: "Symptoms Logged",
        description: "Your symptom report is being analyzed by our vet assistant.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log symptoms. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (showSymptomLogger) {
    return (
      <SymptomLogger
        onSubmit={handleSymptomSubmit}
        onCancel={() => setShowSymptomLogger(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Log Symptoms Button */}
      <div className="p-4 border-b">
        <Button
          onClick={() => setShowSymptomLogger(true)}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Symptoms
        </Button>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-4 p-4 scroll-smooth"
      >
        {messages.length === 0 ? (
          <CommonQuestions
            petName={selectedPet?.name}
            onQuestionSelect={handleQuestionSelect}
            isLoading={isLoading}
          />
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} />
            ))}
            
            {/* Quick Suggestions (Collapsed by default) */}
            {showQuickSuggestions && messages.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickSuggestions(!showQuickSuggestions)}
                  className="w-full justify-between text-sm text-gray-600 hover:text-gray-800"
                >
                  <span>Quick questions</span>
                  {showQuickSuggestions ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                
                {showQuickSuggestions && (
                  <div className="mt-2 space-y-1">
                    {[
                      "How is my pet's overall health?",
                      "Any concerns I should watch for?",
                      "Feeding recommendations?",
                      "Exercise suggestions?"
                    ].map((question, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs text-gray-600 hover:bg-white"
                        onClick={() => handleQuestionSelect(question)}
                        disabled={isLoading}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Invisible div for auto-scrolling */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default SimplifiedAssistantChat;
