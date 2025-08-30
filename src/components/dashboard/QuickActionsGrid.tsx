
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
      gradient: "from-blue-400 via-blue-500 to-cyan-500",
      onClick: () => navigate('/activity')
    },
    {
      icon: Heart,
      label: "Health Check",
      emoji: "🩺", 
      gradient: "from-red-400 via-pink-500 to-rose-500",
      onClick: () => navigate('/report-symptoms')
    },
    {
      icon: MessageSquare,
      label: "AI Assistant",
      emoji: "🤖",
      gradient: "from-purple-400 via-violet-500 to-indigo-500", 
      onClick: () => navigate('/assistant')
    },
    {
      icon: Camera,
      label: "Upload Report",
      emoji: "📋",
      gradient: "from-green-400 via-emerald-500 to-teal-500",
      onClick: () => navigate(`/health/${petId}?upload=true`)
    },
    {
      icon: Scale,
      label: "Weight Track",
      emoji: "⚖️",
      gradient: "from-orange-400 via-amber-500 to-yellow-500",
      onClick: () => navigate('/weight')
    },
    {
      icon: FileText,
      label: "Health Records",
      emoji: "📊",
      gradient: "from-indigo-400 via-blue-500 to-purple-500",
      onClick: () => navigate(`/health-reports/${petId}`)
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 border-yellow-100 shadow-sm">
      <CardContent className="p-6">
        <h3 className="font-semibold text-gray-900 mb-6 text-center text-lg">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant="outline"
              className={`
                h-24 flex flex-col items-center gap-2 border-0 text-white font-medium
                bg-gradient-to-br ${action.gradient} hover:scale-105 transform transition-all duration-200
                shadow-lg hover:shadow-xl rounded-2xl
              `}
            >
              <div className="text-2xl drop-shadow-sm">{action.emoji}</div>
              <span className="text-xs text-center leading-tight drop-shadow-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsGrid;
