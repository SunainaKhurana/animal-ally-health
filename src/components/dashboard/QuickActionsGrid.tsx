
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Heart, 
  MessageSquare, 
  Camera,
  Scale,
  FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionsGridProps {
  petId: string;
  petType: 'dog' | 'cat';
}

const QuickActionsGrid = ({ petId, petType }: QuickActionsGridProps) => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Activity,
      label: "Log Activity",
      emoji: "🎾",
      color: "from-blue-400 to-blue-600",
      onClick: () => navigate('/activity')
    },
    {
      icon: Heart,
      label: "Health Check",
      emoji: "🩺", 
      color: "from-red-400 to-red-600",
      onClick: () => navigate('/report-symptoms')
    },
    {
      icon: MessageSquare,
      label: "AI Assistant",
      emoji: "🤖",
      color: "from-purple-400 to-purple-600", 
      onClick: () => navigate('/assistant')
    },
    {
      icon: Camera,
      label: "Upload Report",
      emoji: "📋",
      color: "from-green-400 to-green-600",
      onClick: () => navigate(`/health/${petId}?upload=true`)
    },
    {
      icon: Scale,
      label: "Weight Track",
      emoji: "⚖️",
      color: "from-orange-400 to-orange-600",
      onClick: () => navigate('/weight')
    },
    {
      icon: FileText,
      label: "Health Records",
      emoji: "📊",
      color: "from-indigo-400 to-indigo-600",
      onClick: () => navigate(`/health-reports/${petId}`)
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4 text-center">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant="outline"
              className={`
                h-20 flex flex-col items-center gap-2 border-0 text-white font-medium
                bg-gradient-to-br ${action.color} hover:scale-105 transform transition-all
                shadow-md hover:shadow-lg
              `}
            >
              <div className="text-xl">{action.emoji}</div>
              <span className="text-xs text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsGrid;
