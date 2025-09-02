
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { usePetContext } from '@/contexts/PetContext';

const QuickLogButton = () => {
  const { selectedPet } = usePetContext();
  const navigate = useNavigate();

  if (!selectedPet) return null;

  return (
    <Button 
      onClick={() => navigate(`/health-logs/${selectedPet.id}`)}
      className="w-full bg-orange-500 hover:bg-orange-600"
    >
      <Plus className="h-4 w-4 mr-2" />
      Quick Health Log
    </Button>
  );
};

export default QuickLogButton;
