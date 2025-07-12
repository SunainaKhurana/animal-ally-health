
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HealthRecordUploadProps {
  petId: string;
  petInfo: {
    name: string;
    type: string;
    breed?: string;
  };
  onUploadComplete?: (reportId: string) => void;
}

const HealthRecordUpload = ({ petId, petInfo, onUploadComplete }: HealthRecordUploadProps) => {
  const { toast } = useToast();

  const handleDeprecatedAction = () => {
    toast({
      title: "Component Deprecated",
      description: "Please use the new Upload Health Report button in the Care tab for file uploads.",
      variant: "destructive",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Legacy Upload Component
        </CardTitle>
        <CardDescription>
          This component has been deprecated. Please use the new "Upload Health Report" button in the Care tab.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={handleDeprecatedAction}
            disabled
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">Take Photo</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={handleDeprecatedAction}
            disabled
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">Upload Image</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={handleDeprecatedAction}
            disabled
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs">Upload PDF</span>
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• This component is deprecated</p>
          <p>• Use the new "Upload Health Report" button in the Care tab</p>
          <p>• New workflow: Direct upload to Make.com webhook</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthRecordUpload;
