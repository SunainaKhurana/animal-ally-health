
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { usePets } from '@/hooks/usePets';
import PetSwitcher from '@/components/pet-zone/PetSwitcher';
import PetZoneNavigation from '@/components/navigation/PetZoneNavigation';
import PetDashboard from '@/components/pet-zone/PetDashboard';
import PetLoader from '@/components/ui/PetLoader';

const Index = () => {
  const navigate = useNavigate();
  const { pets, loading, error, refetch } = usePets();

  useEffect(() => {
    document.title = 'PetZone';
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
        <PetLoader type="chasing" size="md" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">PetZone</h1>
            <PetSwitcher />
          </div>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">😿</div>
            <p className="text-red-500 mb-4">Error loading pets: {error}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>

        <PetZoneNavigation />
      </div>
    );
  }

  // Show no pets state
  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 pb-20">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">PetZone</h1>
            <PetSwitcher />
          </div>
        </div>

        {/* No pets content */}
        <div className="max-w-lg mx-auto p-4 space-y-6">
          <Card>
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold mb-4">No Pets Added Yet</h2>
              <p className="text-gray-600 mb-4">Get started by adding your first pet.</p>
              <Button onClick={() => navigate('/settings/add-pet')}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Pet
              </Button>
            </CardContent>
          </Card>
        </div>

        <PetZoneNavigation />
      </div>
    );
  }

  // Show rich dashboard content
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">PetZone</h1>
          <PetSwitcher />
        </div>
      </div>

      {/* Rich Dashboard Content */}
      <div className="max-w-lg mx-auto">
        <PetDashboard />
      </div>

      <PetZoneNavigation />
    </div>
  );
};

export default Index;
