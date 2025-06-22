
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateCardProps {
  title: string;
  description: string;
  showButton: boolean;
  onButtonClick: () => void;
}

const EmptyStateCard = ({ title, description, showButton, onButtonClick }: EmptyStateCardProps) => {
  if (!showButton) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">{title}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed border-2 border-gray-200">
      <CardContent className="p-8 text-center">
        <div className="text-gray-400 mb-4">📋</div>
        <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        <Button 
          onClick={onButtonClick}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Report
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyStateCard;
