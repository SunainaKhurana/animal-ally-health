
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
}

const FloatingActionButton = ({ onClick, className, children }: FloatingActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-orange-500 hover:bg-orange-600 z-40",
        className
      )}
      size="icon"
    >
      {children || <Plus className="h-6 w-6" />}
    </Button>
  );
};

export default FloatingActionButton;
