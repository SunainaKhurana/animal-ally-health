import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { usePetContext } from '@/contexts/PetContext';
import PetOverviewTab from '@/components/pet-profile/PetOverviewTab';
import PetWeightTrendsTab from '@/components/pet-profile/PetWeightTrendsTab';
import PetHealthReportsTab from "@/components/pet-profile/PetHealthReportsTab";

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
  dateOfBirth: Date;
  weight: number;
  weightUnit?: string;
  gender: 'male' | 'female';
  photo?: string;
  nextVaccination?: string;
  preExistingConditions?: string[];
  reproductiveStatus?: 'spayed' | 'neutered' | 'not_yet';
}

const PetProfile = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { selectedPet: pet, pets } = usePetContext();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!pet && petId) {
      // Find the pet in the pets array if it's not already selected
      const foundPet = pets.find(p => p.id === petId);
      if (!foundPet) {
        navigate('/pets'); // Redirect if pet is not found
      }
    }
  }, [pet, petId, pets, navigate]);

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <CardHeader>
              <CardTitle>Pet Not Found</CardTitle>
              <CardDescription>The requested pet profile could not be found.</CardDescription>
            </CardHeader>
            <Button onClick={() => navigate('/pets')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">{pet.name}</h1>
            <p className="text-sm text-gray-600">{pet.breed || 'Unknown Breed'}</p>
          </div>
          <div></div> {/* Empty div for spacing */}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="health">Health Reports</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <PetOverviewTab pet={pet} />
          </TabsContent>
          
          <TabsContent value="health" className="mt-6">
            <PetHealthReportsTab 
              petId={pet.id} 
              petInfo={{
                id: pet.id,
                name: pet.name,
                type: pet.type,
                breed: pet.breed
              }}
            />
          </TabsContent>
          
          <TabsContent value="trends" className="mt-6">
            <PetWeightTrendsTab pet={pet} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PetProfile;
