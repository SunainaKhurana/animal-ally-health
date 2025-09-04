import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Plus, HelpCircle } from 'lucide-react';
import CommonQuestions from './CommonQuestions';
import SymptomLogger from './SymptomLogger';

interface AssistantInitialViewProps {
  petName?: string;
  onQuestionSelect: (question: string) => void;
  onSymptomSubmit: (symptoms: string[], notes: string, image?: File) => Promise<void>;
  isLoading: boolean;
}

const AssistantInitialView = ({ 
  petName, 
  onQuestionSelect, 
  onSymptomSubmit,
  isLoading 
}: AssistantInitialViewProps) => {
  const [showCommonQuestions, setShowCommonQuestions] = useState(false);
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);

  const handleSymptomSubmitAndClose = async (symptoms: string[], notes: string, image?: File) => {
    await onSymptomSubmit(symptoms, notes, image);
    setShowSymptomLogger(false);
  };

  if (showSymptomLogger) {
    return (
      <SymptomLogger
        onSubmit={handleSymptomSubmitAndClose}
        onCancel={() => setShowSymptomLogger(false)}
      />
    );
  }

  if (showCommonQuestions) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Common Questions</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommonQuestions(false)}
          >
            Close
          </Button>
        </div>
        <CommonQuestions
          petName={petName}
          onQuestionSelect={(question) => {
            onQuestionSelect(question);
            setShowCommonQuestions(false);
          }}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="text-center py-8 px-4">
      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 mb-6">Ask me anything about {petName}</p>
      
      <div className="space-y-3">
        <Button
          onClick={() => setShowSymptomLogger(true)}
          className="w-full bg-red-500 hover:bg-red-600 text-white"
          size="lg"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Symptoms
        </Button>
        
        <Button
          onClick={() => setShowCommonQuestions(true)}
          variant="outline"
          className="w-full"
          size="lg"
          disabled={isLoading}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Common Questions
        </Button>
      </div>
    </div>
  );
};

export default AssistantInitialView;