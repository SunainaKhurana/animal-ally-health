import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { usePets } from "@/hooks/usePets";
import { useImprovedHealthReports } from "@/hooks/useImprovedHealthReports";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ImprovedHealthReportUpload from "@/components/health/ImprovedHealthReportUpload";
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
  
  // Use first pet if no petId in URL, or find pet by ID
  const selectedPet = petId ? pets.find(p => p.id === petId) : pets[0];
  const currentPetId = selectedPet?.id;
  
  const { healthReports, loading, deleteReport, refetch } = useImprovedHealthReports(currentPetId);
  const [showUpload, setShowUpload] = useState(false);
  const [recentlyUploadedId, setRecentlyUploadedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-open upload if URL parameter is set
  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setShowUpload(true);
    }
  }, [searchParams]);

  // Set up real-time updates for health reports
  useEffect(() => {
    if (!currentPetId) return;

    const channel = supabase
      .channel('health-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_reports',
          filter: `pet_id=eq.${currentPetId}`
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
  }, [currentPetId, refetch, toast]);

  const handlePetChange = (newPet: any) => {
    navigate(`/health/${newPet.id}`, { replace: true });
  };

  const handleUploadComplete = (reportId: string) => {
    console.log('📋 Health Records - Upload completed for report:', reportId);
    setShowUpload(false);
    setRecentlyUploadedId(reportId);
    
    toast({
      title: "Report Uploaded Successfully! 🎉",
      description: "Your health report has been saved and is ready for analysis.",
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleUpload = () => {
    setShowUpload(!showUpload);
  };

  const handleShowUpload = () => {
    setShowUpload(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    console.log('🗑️ Deleting health report from Health Records:', reportId);
    await deleteReport(reportId);
  };

  // Error states
  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p>No pets found. Add a pet first to view health records.</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!selectedPet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Pet not found</p>
              <Button onClick={() => navigate('/health')} className="mt-4">
                Back to Health Records
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const completedReports = healthReports.filter(r => r.status === 'completed');
  const processingReports = healthReports.filter(r => r.status === 'processing');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <HealthRecordsHeader pet={selectedPet} onToggleUpload={handleToggleUpload} />

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Pet Selector - Show if multiple pets */}
        {pets.length > 1 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Switch Pet:</p>
            <PetSelector
              pets={pets}
              selectedPet={selectedPet}
              onSelectPet={handlePetChange}
            />
          </div>
        )}

        <PetInfoCard pet={selectedPet} />

        {/* Upload Section */}
        {showUpload && (
          <ImprovedHealthReportUpload
            petId={selectedPet.id}
            petInfo={{
              name: selectedPet.name,
              type: selectedPet.type,
              breed: selectedPet.breed
            }}
            onUploadComplete={handleUploadComplete}
          />
        )}

        <ProcessingReportsSection />

        <CompletedReportsSection 
          reports={completedReports}
          loading={loading}
          onDelete={handleDeleteReport}
          onShowUpload={handleShowUpload}
          recentlyUploadedId={recentlyUploadedId}
        />
      </div>
    </div>
  );
};

export default HealthRecords;
