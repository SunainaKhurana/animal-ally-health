
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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

    try {
      // Create symptom report entry for Make.com processing
      const report = await addSymptomReport(
        selectedPet.id,
        [], // Empty symptoms array for general questions
        message, // Question goes into notes field
        imageFile
      );

      // Add processing message
      if (report?.id) {
        addProcessingMessage(report.id, 'Vet assistant is reviewing your question...');
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

    try {
      const report = await addSymptomReport(selectedPet.id, symptoms, notes, image);
      
      setShowSymptomLogger(false);

      // Add processing message for symptom diagnosis
      if (report?.id) {
        addProcessingMessage(report.id, 'Vet assistant is analyzing the symptoms...');
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
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
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
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default SimplifiedAssistantChat;
