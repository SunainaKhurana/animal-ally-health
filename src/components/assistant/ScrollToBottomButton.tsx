
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  show: boolean;
}

const ScrollToBottomButton = ({ onClick, show }: ScrollToBottomButtonProps) => {
  if (!show) return null;

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <Button
        onClick={onClick}
        size="sm"
        className="rounded-full shadow-lg bg-blue-500 hover:bg-blue-600 text-white"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ScrollToBottomButton;
