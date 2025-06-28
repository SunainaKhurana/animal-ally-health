
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickSuggestionsProps {
  onQuestionSelect: (question: string) => void;
  isLoading: boolean;
  show: boolean;
}

const QuickSuggestions = ({ onQuestionSelect, isLoading, show }: QuickSuggestionsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const questions = [
    "How is my pet's overall health?",
    "Any concerns I should watch for?",
    "Feeding recommendations?",
    "Exercise suggestions?"
  ];

  if (!show) {
    return null;
  }

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between text-sm text-gray-600 hover:text-gray-800"
      >
        <span>Quick questions</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      
      {isExpanded && (
        <div className="mt-2 space-y-1">
          {questions.map((question, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-gray-600 hover:bg-white"
              onClick={() => onQuestionSelect(question)}
              disabled={isLoading}
            >
              {question}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickSuggestions;
