
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, MessageCircle, Plus, Camera } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useToast } from '@/hooks/use-toast';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import SymptomLogger from './SymptomLogger';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasImage?: boolean;
}

const COMMON_QUESTIONS = [
  "Is it safe to feed my dog rice?",
  "How much water should my pet drink daily?",
  "What are signs of a healthy pet?",
  "When should I be concerned about my pet's behavior?",
  "Can my pet eat human food?",
  "How often should I bathe my pet?",
  "What vaccinations does my pet need?",
  "How do I know if my pet is in pain?"
];

const SimplifiedAssistantChat = () => {
  const { selectedPet } = usePetContext();
  const { toast } = useToast();
  const { addSymptomReport } = useSymptomReports();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  const handleSendMessage = async (message: string, imageFile?: File) => {
    if (!message.trim() && !imageFile || !selectedPet) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message || "Shared an image",
      timestamp: new Date(),
      hasImage: !!imageFile
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setUploadedImage(null);
    setIsLoading(true);

    try {
      // Always create a symptom report entry for tracking and Make.com processing
      await addSymptomReport(
        selectedPet.id,
        [], // No specific symptoms for general questions
        message,
        imageFile
      );

      // Simulate AI response (this will be replaced by actual Make.com integration)
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Thanks for your question about ${selectedPet.name}. ${generateMockResponse(message)}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleQuestionSelect = (question: string) => {
    setInputMessage(question);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      toast({
        title: "Image Selected",
        description: "Image ready to send with your message",
      });
    }
  };

  const handleSymptomSubmit = async (symptoms: string[], notes: string, image?: File) => {
    if (!selectedPet) return;

    try {
      await addSymptomReport(selectedPet.id, symptoms, notes, image);
      
      const symptomMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: `Symptoms logged: ${symptoms.join(', ')}${notes ? `\n\nNotes: ${notes}` : ''}`,
        timestamp: new Date(),
        hasImage: !!image
      };

      setMessages(prev => [...prev, symptomMessage]);
      setShowSymptomLogger(false);
      setIsLoading(true);

      // Simulate diagnosis response
      setTimeout(() => {
        const diagnosisMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Based on the symptoms you've reported for ${selectedPet.name}, I'm analyzing the information. A detailed assessment will be provided shortly.\n\n⚠️ This is AI-generated advice. Please consult a veterinarian if symptoms persist or worsen.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, diagnosisMessage]);
        setIsLoading(false);
      }, 2000);

      toast({
        title: "Symptoms Logged",
        description: "Processing your symptom report...",
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
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">Ask me anything about {selectedPet?.name}</p>
            
            {/* Common Questions */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">Common questions:</p>
              <div className="grid grid-cols-1 gap-2">
                {COMMON_QUESTIONS.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left justify-start h-auto p-3 text-sm whitespace-normal hover:bg-gray-50"
                    onClick={() => handleQuestionSelect(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="flex items-start gap-2">
                    {message.type === 'assistant' && <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      {message.hasImage && (
                        <div className="mt-2 text-xs opacity-75 flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Image attached
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        {uploadedImage && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Image ready: {uploadedImage.name}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadedImage(null)}
              className="ml-auto h-auto p-1 text-blue-600 hover:text-blue-800"
            >
              ×
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about your pet"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage, uploadedImage || undefined)}
            disabled={isLoading}
          />
          
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={isLoading}
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => handleSendMessage(inputMessage, uploadedImage || undefined)}
            disabled={(!inputMessage.trim() && !uploadedImage) || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper function for mock responses
const generateMockResponse = (question: string): string => {
  return `I'd be happy to help with that! Based on your pet's profile and the question you've asked, I'll provide some guidance. This information is being processed and a detailed response will be available shortly.`;
};

export default SimplifiedAssistantChat;
