
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePets } from "@/hooks/usePets";
import { useOptimizedPrescriptions } from "@/hooks/useOptimizedPrescriptions";
import PrescriptionUpload from "@/components/prescriptions/PrescriptionUpload";

const PrescriptionsTracker = () => {
  const navigate = useNavigate();
  const { petId } = useParams();
  const { pets } = usePets();
  const { prescriptions, loading } = useOptimizedPrescriptions(petId);
  const [showUpload, setShowUpload] = useState(false);

  const pet = pets.find(p => p.id === petId);

  const handleUploadComplete = () => {
    setShowUpload(false);
  };

  if (!pet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p>Pet not found</p>
              <Button onClick={() => navigate('/activity')} className="mt-4">
                Go Back
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/activity')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900">Prescriptions</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Pet Info */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
              {pet.photo ? (
                <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl text-white">{pet.type === 'dog' ? '🐕' : '🐱'}</span>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{pet.name}</h2>
              <p className="text-sm text-gray-600">{pet.breed}</p>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        {showUpload && (
          <PrescriptionUpload
            petId={petId!}
            petInfo={{
              name: pet.name,
              type: pet.type,
              breed: pet.breed
            }}
            onUploadComplete={handleUploadComplete}
          />
        )}

        {/* Add Prescription Button */}
        {!showUpload && (
          <Button 
            onClick={() => setShowUpload(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 h-12"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Prescription
          </Button>
        )}

        {/* Prescriptions List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription History</h3>

          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600">Loading prescriptions...</p>
                </CardContent>
              </Card>
            ) : prescriptions.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400 mb-4">💊</div>
                  <h4 className="font-medium text-gray-900 mb-2">No prescriptions yet</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload your first prescription to track medications
                  </p>
                  <Button 
                    onClick={() => setShowUpload(true)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Prescription
                  </Button>
                </CardContent>
              </Card>
            ) : (
              prescriptions.map((prescription) => (
                <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{prescription.title}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                        prescription.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {prescription.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Prescribed: {new Date(prescription.prescribed_date).toLocaleDateString()}</span>
                    </div>
                    
                    {prescription.medications && Array.isArray(prescription.medications) && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Medications:</p>
                        {prescription.medications.map((med: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                            <p className="font-medium">{med.name || `Medication ${index + 1}`}</p>
                            {med.dosage && <p className="text-gray-600">Dosage: {med.dosage}</p>}
                            {med.frequency && <p className="text-gray-600">Frequency: {med.frequency}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>Uploaded: {new Date(prescription.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionsTracker;
