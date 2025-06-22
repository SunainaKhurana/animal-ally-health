
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePets } from "@/hooks/usePets";
import PetOverviewTab from "@/components/pet-profile/PetOverviewTab";
import PetHealthRecordsTab from "@/components/pet-profile/PetHealthRecordsTab";
import PetWeightTrendsTab from "@/components/pet-profile/PetWeightTrendsTab";
import { useToast } from "@/hooks/use-toast";

const PetProfile = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { pets } = usePets();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const pet = pets.find(p => p.id === petId);

  useEffect(() => {
    if (!pet && pets.length > 0) {
      toast({
        title: "Pet not found",
        description: "Redirecting to home page",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [pet, pets, navigate, toast]);

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">🐕 🐱</div>
          <p className="text-gray-600">Loading pet profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-bold text-gray-900">{pet.name}</h1>
            <Button variant="ghost" size="sm">
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Pet Hero Card */}
        <div className="pt-20 pb-6 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-500">
                {pet.photo ? (
                  <img 
                    src={pet.photo} 
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-6xl text-white opacity-80">
                      {pet.type === 'dog' ? '🐕' : '🐱'}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 right-4">
                  <Button size="sm" className="rounded-full bg-white/20 backdrop-blur-sm border-white/30">
                    <Camera className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{pet.name}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    {pet.breed}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {pet.gender}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {pet.weight} {pet.weightUnit || 'lbs'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <div className="max-w-md mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <PetOverviewTab pet={pet} />
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <PetHealthRecordsTab petId={pet.id} petInfo={pet} />
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <PetWeightTrendsTab petId={pet.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PetProfile;
