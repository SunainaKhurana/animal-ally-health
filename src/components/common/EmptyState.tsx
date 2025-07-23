import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  illustration,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) => {
  return (
    <Card className={`${className}`}>
      <CardContent className="p-8 text-center">
        {illustration && (
          <div className="flex justify-center mb-6">
            <img 
              src={illustration} 
              alt={title}
              className="w-32 h-32 object-contain opacity-80"
            />
          </div>
        )}
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
        {actionLabel && onAction && (
          <Button 
            onClick={onAction}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};