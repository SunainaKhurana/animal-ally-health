
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { usePets } from "@/hooks/usePets";
import { useHealthReports } from "@/hooks/useHealthReports";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EnhancedHealthRecordUpload from "@/components/health/EnhancedHealthRecordUpload";
import PetSelector from "@/components/pets/PetSelector";
import HealthRecordsHeader from "@/components/health/HealthRecordsHeader";
import PetInfoCard from "@/components/health/PetInfoCard";
import ProcessingReportsSection from "@/components/health/ProcessingReportsSection";
import CompletedReportsSection from "@/components/health/CompletedReportsSection";

const HealthRecords = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pets } = usePets();
  const { reports, loading, deleteReport, refetch } = useHealthReports(petId);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(petId);
  const [recentlyUploadedId, setRecentlyUploadedId] = useState<string | null>(null);
  const { toast } = useToast();

  const pet = pets.find(p => p.id === selectedPetId);

  // Auto-open upload if URL parameter is set
  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setShowUpload(true);
    }
  }, [searchParams]);

  // Update selected pet if URL changes
  useEffect(() => {
    if (petId && petId !== selectedPetId) {
      setSelectedPetId(petId);
    }
  }, [petId, selectedPetId]);

  // Set up real-time updates for health reports
  useEffect(() => {
    if (!petId) return;

    const channel = supabase
      .channel('health-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_reports',
          filter: `pet_id=eq.${petId}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'UPDATE' && payload.new.status === 'completed') {
            setRecentlyUploadedId(payload.new.id);
            
            toast({
              title: "Analysis Complete! 🎉",
              description: "Your health report has been analyzed. Check out the AI insights below.",
              duration: 5000,
            });
          }
          
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [petId, refetch, toast]);

  const handlePetChange = (newPet: any) => {
    setSelectedPetId(newPet.id);
    navigate(`/health/${newPet.id}`, { replace: true });
  };

  const handleUploadComplete = (reportIds: string[]) => {
    setShowUpload(false);
    if (reportIds.length > 0) {
      setRecentlyUploadedId(reportIds[0]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleUpload = () => {
    setShowUpload(!showUpload);
  };

  const handleShowUpload = () => {
    setShowUpload(true);
  };

  // Error states
  if (!pet && pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p>No pets found</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Pet not found</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const completedReports = reports.filter(r => r.status === 'completed');
  const processingReports = reports.filter(r => r.status === 'processing');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <HealthRecordsHeader pet={pet} onToggleUpload={handleToggleUpload} />

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Pet Selector - Show if multiple pets */}
        {pets.length > 1 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Switch Pet:</p>
            <PetSelector
              pets={pets}
              selectedPet={pet}
              onSelectPet={handlePetChange}
            />
          </div>
        )}

        <PetInfoCard pet={pet} />

        {/* Upload Section */}
        {showUpload && (
          <EnhancedHealthRecordUpload
            petId={pet.id}
            petInfo={{
              name: pet.name,
              type: pet.type,
              breed: pet.breed
            }}
            onUploadComplete={handleUploadComplete}
          />
        )}

        <ProcessingReportsSection 
          reports={processingReports}
          onDelete={deleteReport}
        />

        <CompletedReportsSection 
          reports={completedReports}
          loading={loading}
          onDelete={deleteReport}
          onShowUpload={handleShowUpload}
          recentlyUploadedId={recentlyUploadedId}
        />
      </div>
    </div>
  );
};

export default HealthRecords;
