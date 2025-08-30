
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingFallbackProps {
  message?: string;
  showCards?: boolean;
  cardCount?: number;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = "Loading...", 
  showCards = false,
  cardCount = 3 
}) => {
  if (showCards) {
    return (
      <div className="space-y-4 p-4">
        {message && (
          <div className="text-sm text-muted-foreground text-center">
            {message}
          </div>
        )}
        {Array.from({ length: cardCount }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};
