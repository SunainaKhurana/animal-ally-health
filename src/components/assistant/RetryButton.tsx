
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RetryButtonProps {
  onRetry: () => void;
  isLoading: boolean;
  retryCount: number;
}

const RetryButton = ({ onRetry, isLoading, retryCount }: RetryButtonProps) => {
  if (retryCount === 0 || retryCount >= 3) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="text-red-600 border-red-200 hover:bg-red-50"
        disabled={isLoading}
      >
        <AlertCircle className="h-4 w-4 mr-2" />
        Retry sending message
      </Button>
    </div>
  );
};

export default RetryButton;
