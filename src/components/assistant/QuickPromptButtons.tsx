
import { Button } from '@/components/ui/button';
import { usePetContext } from '@/contexts/PetContext';

interface QuickPromptButtonsProps {
  onPromptSelect: (prompt: string) => void;
}

const QuickPromptButtons = ({ onPromptSelect }: QuickPromptButtonsProps) => {
  const { selectedPet } = usePetContext();

  const prompts = [
    "Why is my dog drinking more water than usual?",
    "Should I be worried about vomiting?",
    "What can I feed my dog with diarrhea?",
    "What vaccines are due soon?",
    `How is ${selectedPet?.name}'s health looking this week?`,
    "My dog seems lethargic, what should I watch for?",
    "Is it normal for my dog to eat grass?",
    "How often should I bathe my dog?"
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Common questions:</p>
      <div className="grid grid-cols-1 gap-2">
        {prompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            className="text-left justify-start h-auto p-3 text-sm whitespace-normal"
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
