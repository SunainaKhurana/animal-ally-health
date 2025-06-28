
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface CommonQuestionsProps {
  petName?: string;
  onQuestionSelect: (question: string) => void;
  isLoading: boolean;
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

const CommonQuestions = ({ petName, onQuestionSelect, isLoading }: CommonQuestionsProps) => {
  return (
    <div className="text-center py-8">
      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500 mb-6">Ask me anything about {petName}</p>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-3">Common questions:</p>
        <div className="grid grid-cols-1 gap-2">
          {COMMON_QUESTIONS.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="text-left justify-start h-auto p-3 text-sm whitespace-normal hover:bg-gray-50"
              onClick={() => onQuestionSelect(question)}
              disabled={isLoading}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommonQuestions;
