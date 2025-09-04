import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Plus, Search } from 'lucide-react';

interface FlexibleEmptyStateProps {
  title: string;
  description: string;
  illustration?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  exploreAction?: {
    label: string;
    onClick: () => void;
    description: string;
  };
  className?: string;
}

export const FlexibleEmptyState = ({
  title,
  description,
  illustration,
  primaryAction,
  secondaryAction,
  exploreAction,
  className = ''
}: FlexibleEmptyStateProps) => {
  return (
    <Card className={className}>
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
        
        <div className="space-y-3">
          {primaryAction && (
            <Button 
              onClick={primaryAction.onClick}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              {primaryAction.icon || <Plus className="h-4 w-4 mr-2" />}
              {primaryAction.label}
            </Button>
          )}
          
          {exploreAction && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">{exploreAction.description}</p>
              <Button 
                onClick={exploreAction.onClick}
                variant="outline"
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                {exploreAction.label}
              </Button>
            </div>
          )}
          
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick}
              variant="ghost"
              className="w-full"
            >
              {secondaryAction.icon || <ArrowRight className="h-4 w-4 mr-2" />}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};