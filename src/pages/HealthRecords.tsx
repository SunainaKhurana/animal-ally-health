
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, TrendingUp, User } from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { usePets } from "@/hooks/usePets";
import { useHealthReports } from "@/hooks/useHealthReports";
import HealthRecordUpload from "@/components/health/HealthRecordUpload";
import HealthReportCard from "@/components/health/HealthReportCard";
import PetSelector from "@/components/pets/PetSelector";

const HealthRecords = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pets } = usePets();
  const { reports, loading, deleteReport } = useHealthReports(petId);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState(petId);

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

  const handlePetChange = (newPet: any) => {
    setSelectedPetId(newPet.id);
    navigate(`/health/${newPet.id}`, { replace: true });
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
          <HealthRecordUpload
            petId={pet.id}
            petInfo={{
              name: pet.name,
              type: pet.type,
              breed: pet.breed
            }}
            onUploadComplete={() => setShowUpload(false)}
          />
        )}

        {/* Reports List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
            {reports.length > 1 && (
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
            ) : reports.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400 mb-4">📋</div>
                  <h4 className="font-medium text-gray-900 mb-2">No health records yet</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload your first diagnostic report to get started
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
              reports.map((report) => (
                <HealthReportCard
                  key={report.id}
                  report={report}
                  onDelete={deleteReport}
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
