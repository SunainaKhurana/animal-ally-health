
import { Button } from '@/components/ui/button';
import { usePetContext } from '@/contexts/PetContext';

interface QuickPromptButtonsProps {
  onPromptSelect: (prompt: string) => void;
}

const QuickPromptButtons = ({ onPromptSelect }: QuickPromptButtonsProps) => {
  const { selectedPet } = usePetContext();

  const prompts = [
    "Why is my pet drinking more water than usual?",
    "Should I be worried about vomiting?",
    "What can I feed my pet with diarrhea?",
    "My pet seems lethargic, what should I watch for?",
    "Is it normal for my pet to eat grass?",
    "What vaccinations are due for my pet?",
    `How is ${selectedPet?.name}'s overall health?`,
    "My pet is not eating, what should I do?"
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Or ask a quick question:</p>
      <div className="grid grid-cols-1 gap-2">
        {prompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            className="text-left justify-start h-auto p-3 text-sm whitespace-normal hover:bg-gray-50"
            onClick={() => onPromptSelect(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickPromptButtons;
