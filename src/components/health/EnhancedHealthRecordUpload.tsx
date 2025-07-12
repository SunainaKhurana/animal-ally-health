
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EnhancedHealthRecordUploadProps {
  petId: string;
  petInfo: {
    name: string;
    type: string;
    breed?: string;
  };
  onUploadComplete?: (reportIds: string[]) => void;
}

const EnhancedHealthRecordUpload = ({ petId, petInfo, onUploadComplete }: EnhancedHealthRecordUploadProps) => {
  const { toast } = useToast();

  const handleDeprecatedNotice = () => {
    toast({
      title: "Component Deprecated",
      description: "Please use the new Upload Health Report functionality in the Care tab.",
      variant: "destructive",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Enhanced Upload - Deprecated
        </CardTitle>
        <CardDescription>
          This enhanced upload component has been deprecated. The new workflow sends files directly to Make.com for processing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Component Deprecated</h3>
          <p className="text-gray-600 mb-4">
            Use the new "Upload Health Report" button in the Care tab for {petInfo.name}
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• New workflow: Direct Make.com webhook integration</p>
            <p>• OCR and AI analysis handled by Make.com</p>
            <p>• Results saved directly to Supabase</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedHealthRecordUpload;
