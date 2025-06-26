
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, User, Bot, Camera, AlertTriangle } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';
import { useToast } from '@/hooks/use-toast';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import QuickPromptButtons from './QuickPromptButtons';
import ManualSymptomSelector from './ManualSymptomSelector';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isSymptomReport?: boolean;
  isDiagnosis?: boolean;
}

const EnhancedAssistantChat = () => {
  const { selectedPet } = usePetContext();
  const { toast } = useToast();
  const { addSymptomReport } = useSymptomReports();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSymptomSelector, setShowSymptomSelector] = useState(false);
  const [awaitingDiagnosis, setAwaitingDiagnosis] = useState(false);

  // Initialize with greeting message
  useState(() => {
    if (selectedPet && messages.length === 0) {
      const greetingMessage: ChatMessage = {
        id: 'greeting',
        type: 'system',
        content: `👋 Hi! I'm your AI Health Assistant.\n\nYou can tell me what's going on with ${selectedPet.name} today by describing symptoms or concerns in your own words.\n\nOr, if you prefer, you can skip symptoms and just ask any question about your pet's health or care.`,
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
    }
  });

  const handleSendMessage = async (message: string, isSymptomDescription = false) => {
    if (!message.trim() || !selectedPet) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
      isSymptomReport: isSymptomDescription
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (isSymptomDescription) {
        // Extract symptoms from natural language and create symptom report
        const symptoms = extractSymptomsFromText(message);
        await addSymptomReport(selectedPet.id, symptoms, message);
        
        setAwaitingDiagnosis(true);
        
        // Simulate AI diagnosis response (replace with actual Make.com integration)
        setTimeout(() => {
          const diagnosisMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `Based on the symptoms you've described for ${selectedPet.name}, here's my assessment:\n\n${generateMockDiagnosis(symptoms, message)}\n\n⚠️ This is AI-generated advice. Please consult a veterinarian if symptoms persist or worsen.`,
            timestamp: new Date(),
            isDiagnosis: true
          };
          setMessages(prev => [...prev, diagnosisMessage]);
          setAwaitingDiagnosis(false);
          setIsLoading(false);
        }, 2000);
      } else {
        // General AI chat response
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `I'd be happy to help with your question about ${selectedPet.name}. ${generateGeneralResponse(message)}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      setAwaitingDiagnosis(false);
    }
  };

  const handleSymptomSubmit = async (symptoms: string[], notes: string) => {
    if (!selectedPet) return;

    try {
      await addSymptomReport(selectedPet.id, symptoms, notes);
      
      const symptomMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: `Symptoms reported: ${symptoms.join(', ')}${notes ? `\n\nAdditional notes: ${notes}` : ''}`,
        timestamp: new Date(),
        isSymptomReport: true
      };

      setMessages(prev => [...prev, symptomMessage]);
      setShowSymptomSelector(false);
      setAwaitingDiagnosis(true);
      setIsLoading(true);

      // Simulate diagnosis generation
      setTimeout(() => {
        const diagnosisMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Based on the symptoms you've selected for ${selectedPet.name}, here's my assessment:\n\n${generateMockDiagnosis(symptoms, notes)}\n\n⚠️ This is AI-generated advice. Please consult a veterinarian if symptoms persist or worsen.`,
          timestamp: new Date(),
          isDiagnosis: true
        };
        setMessages(prev => [...prev, diagnosisMessage]);
        setAwaitingDiagnosis(false);
        setIsLoading(false);
      }, 2000);

      toast({
        title: "Symptoms Reported",
        description: "Generating AI diagnosis...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit symptoms. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePromptSelect = (prompt: string) => {
    const isSymptomRelated = prompt.toLowerCase().includes('vomiting') || 
                           prompt.toLowerCase().includes('diarrhea') || 
                           prompt.toLowerCase().includes('lethargic');
    handleSendMessage(prompt, isSymptomRelated);
  };

  if (showSymptomSelector) {
    return (
      <ManualSymptomSelector
        onSymptomsSubmit={handleSymptomSubmit}
        onCancel={() => setShowSymptomSelector(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">Loading assistant...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : message.type === 'system'
                    ? 'bg-gray-50 text-gray-800 border border-gray-200'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="flex items-start gap-2">
                    {message.type === 'assistant' && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.type === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    {message.type === 'system' && <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      {message.isDiagnosis && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          AI-generated diagnosis
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
            
            {/* Quick Prompts after greeting */}
            {messages.length === 1 && messages[0].type === 'system' && (
              <div className="space-y-4">
                <Button
                  onClick={() => setShowSymptomSelector(true)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  size="lg"
                >
                  📝 Select symptoms manually or add your own
                </Button>
                
                <QuickPromptButtons onPromptSelect={handlePromptSelect} />
              </div>
            )}
            
            {(isLoading || awaitingDiagnosis) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg max-w-[80%]">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm">
                      {awaitingDiagnosis ? 'Analyzing symptoms...' : 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder={`Describe what's happening with ${selectedPet?.name} or ask any question...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const extractSymptomsFromText = (text: string): string[] => {
  const symptoms = [];
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('vomit')) symptoms.push('Vomiting');
  if (lowercaseText.includes('diarrhea') || lowercaseText.includes('loose stool')) symptoms.push('Diarrhea');
  if (lowercaseText.includes('letharg') || lowercaseText.includes('tired') || lowercaseText.includes('low energy')) symptoms.push('Lethargy');
  if (lowercaseText.includes('not eating') || lowercaseText.includes('appetite')) symptoms.push('Loss of appetite');
  if (lowercaseText.includes('drinking') && lowercaseText.includes('water')) symptoms.push('Excessive drinking');
  if (lowercaseText.includes('cough')) symptoms.push('Coughing');
  if (lowercaseText.includes('limp') || lowercaseText.includes('leg')) symptoms.push('Limping');
  if (lowercaseText.includes('scratch') || lowercaseText.includes('itch')) symptoms.push('Scratching/Itching');
  
  return symptoms.length > 0 ? symptoms : ['General concern'];
};

const generateMockDiagnosis = (symptoms: string[], notes: string): string => {
  const symptomsText = Array.isArray(symptoms) ? symptoms.join(', ') : symptoms;
  
  return `I've analyzed the reported symptoms: ${symptomsText}.\n\nBased on this information and your pet's profile, here are some possibilities to consider:\n\n• Monitor your pet closely for any changes\n• Ensure they stay hydrated\n• Consider dietary adjustments if digestive issues are present\n• Schedule a vet visit if symptoms persist or worsen\n\nWould you like me to provide more specific advice based on these symptoms?`;
};

const generateGeneralResponse = (question: string): string => {
  return `Based on your question, I can provide some general guidance. However, for the most accurate advice specific to your pet's situation, I'd recommend discussing this with your veterinarian. Is there anything specific about the symptoms or behavior you'd like me to help you understand better?`;
};

export default EnhancedAssistantChat;
