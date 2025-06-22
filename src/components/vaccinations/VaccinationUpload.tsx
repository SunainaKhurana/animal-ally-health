
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Check } from "lucide-react";
import { extractVaccinationData } from "@/lib/ocrService";

interface VaccinationUploadProps {
  selectedPet: any;
}

const VaccinationUpload = ({ selectedPet }: VaccinationUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      // Process the image with OCR
      const vaccinationData = await extractVaccinationData(file);
      setExtractedData(vaccinationData);
      
      // Auto-calculate next vaccination date (simplified logic)
      const nextDate = new Date();
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      
      console.log("Vaccination data extracted:", vaccinationData);
      console.log("Next vaccination due:", nextDate.toDateString());
      
    } catch (error) {
      console.error("OCR processing failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        id="vaccination-upload"
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-80 mx-4">
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <h3 className="font-semibold mb-2">Processing Image...</h3>
              <p className="text-sm text-gray-600">Extracting vaccination information using OCR</p>
            </CardContent>
          </Card>
        </div>
      )}

      {extractedData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-80 mx-4">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Vaccination Record Added</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Extracted Information:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vaccine:</span>
                    <Badge variant="secondary">{extractedData.vaccine || "DHPP"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date:</span>
                    <span className="text-sm">{extractedData.date || "2024-01-15"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Next Due:</span>
                    <span className="text-sm font-medium text-orange-600">2025-01-15</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setExtractedData(null)} 
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Done
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default VaccinationUpload;
