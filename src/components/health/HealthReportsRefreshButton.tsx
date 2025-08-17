
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HealthReportsRefreshButtonProps {
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

const HealthReportsRefreshButton = ({ onRefresh, isLoading = false }: HealthReportsRefreshButtonProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    if (isRefreshing || isLoading) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: "Reports Refreshed",
        description: "Health reports have been updated with the latest data.",
      });
    } catch (error) {
      console.error('Refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not refresh reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing || isLoading}
      className="h-8 px-3 text-xs"
    >
      {isRefreshing ? (
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <RefreshCw className="h-3 w-3 mr-1" />
      )}
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
  );
};

export default HealthReportsRefreshButton;
