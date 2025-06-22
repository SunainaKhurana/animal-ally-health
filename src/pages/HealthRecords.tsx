
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, TrendingUp, Sparkles, Upload } from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { usePets } from "@/hooks/usePets";
import { useHealthReports } from "@/hooks/useHealthReports";
import { supabase } from "@/integrations/supabase/client";
import EnhancedHealthRecordUpload from "@/components/health/EnhancedHealthRecordUpload";
import HealthReportCard from "@/components/health/HealthReportCard";
import PetSelector from "@/components/pets/PetSelector";
import { useToast } from "@/hooks/use-toast";

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
            // Set this as recently uploaded for auto-expand
            setRecentlyUploadedId(payload.new.id);
            
            toast({
              title: "Analysis Complete! 🎉",
              description: "Your health report has been analyzed. Check out the AI insights below.",
              duration: 5000,
            });
          }
          
          // Refresh the reports list
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
    // Scroll to top to show the new report
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Health Records</h1>
            <p className="text-sm text-gray-600">{pet.name}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUpload(!showUpload)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

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

        {/* Pet Info Card */}
        <Card className="bg-gradient-to-r from-orange-500 to-orange-400 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {pet.photo && (
                <img 
                  src={pet.photo} 
                  alt={pet.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{pet.name}</h2>
                <p className="text-orange-100">
                  {pet.breed} • {pet.type} • {pet.gender}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Processing Reports */}
        {processingReports.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-500" />
              Processing Reports
            </h3>
            <div className="space-y-4">
              {processingReports.map((report) => (
                <HealthReportCard
                  key={report.id}
                  report={report}
                  onDelete={deleteReport}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Reports */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {completedReports.length > 0 && <Sparkles className="h-5 w-5 text-green-500" />}
              {completedReports.length > 0 ? 'Analyzed Reports' : 'Reports'}
            </h3>
            {completedReports.length > 1 && (
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                View Trends
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">Loading reports...</p>
                </CardContent>
              </Card>
            ) : completedReports.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400 mb-4">📋</div>
                  <h4 className="font-medium text-gray-900 mb-2">No health records yet</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload your first diagnostic report to get AI-powered insights in plain language
                  </p>
                  <Button 
                    onClick={() => setShowUpload(true)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              completedReports.map((report) => (
                <HealthReportCard
                  key={report.id}
                  report={report}
                  onDelete={deleteReport}
                  autoExpand={report.id === recentlyUploadedId}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthRecords;
