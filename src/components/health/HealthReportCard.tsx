
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronRight, Edit2, Save, X, Calendar, Stethoscope, Brain, FileText, Camera } from "lucide-react";
import { HealthReport } from "@/hooks/useHealthReports";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HealthReportCardProps {
  report: HealthReport;
  onDelete?: (reportId: string) => void;
  onTriggerAI?: (reportId: string) => void;
  onTap?: (report: HealthReport) => void;
  showAsListItem?: boolean;
}

const HealthReportCard = ({ 
  report, 
  onDelete, 
  onTriggerAI, 
  onTap,
  showAsListItem = false 
}: HealthReportCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(report.report_label || '');
  const [editedVetDiagnosis, setEditedVetDiagnosis] = useState(report.vet_diagnosis || '');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const { toast } = useToast();

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('health_reports')
        .update({
          report_label: editedLabel || null,
          vet_diagnosis: editedVetDiagnosis || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', report.id);

      if (error) throw error;

      toast({
        title: "Report Updated",
        description: "Your changes have been saved successfully.",
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Update Failed",
        description: "Could not save your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Parse AI analysis to get key findings
  const parseAIAnalysis = (aiAnalysis: string | null) => {
    if (!aiAnalysis) return null;
    
    try {
      // Remove markdown code blocks if present
      const cleanedAnalysis = aiAnalysis.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const parsed = JSON.parse(cleanedAnalysis);
      return parsed;
    } catch (error) {
      console.log('AI analysis is not JSON format');
      return { analysis: aiAnalysis };
    }
  };

  const analysis = parseAIAnalysis(report.ai_analysis);
  const hasAIAnalysis = !!analysis;

  // Extract key highlights for list view
  const getKeyHighlights = () => {
    if (!analysis) return [];
    
    if (analysis.key_highlights) {
      return analysis.key_highlights.slice(0, 3);
    }
    
    if (analysis.summary) {
      return [analysis.summary];
    }
    
    return [];
  };

  const keyHighlights = getKeyHighlights();

  // List view layout (matches screenshots)
  if (showAsListItem) {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onTap?.(report)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Report Icon */}
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>

            {/* Report Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {report.report_label || report.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(report.actual_report_date || report.report_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })} • {report.vet_diagnosis ? 'Dr. ' + report.vet_diagnosis.split(' ')[0] : 'No vet noted'}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>

              {/* Thumbnail Images */}
              {report.image_url && (
                <div className="flex gap-2 mb-3">
                  <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={report.image_url} 
                      alt="Report thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Mock second thumbnail for demo */}
                  <div className="w-16 h-12 bg-red-100 rounded flex items-center justify-center">
                    <FileText className="h-4 w-4 text-red-500" />
                    <span className="text-xs ml-1">PDF</span>
                  </div>
                </div>
              )}

              {/* AI Analysis Highlights */}
              {hasAIAnalysis && keyHighlights.length > 0 && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <span className="text-sm font-medium text-blue-900">AI Analysis Highlights</span>
                  </div>
                  <ul className="space-y-1">
                    {keyHighlights.map((highlight, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-center gap-2">
                        <span className="text-blue-600">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detail view layout (matches screenshots)
  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
          <FileText className="h-8 w-8 text-purple-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            {isEditing ? (
              <Input
                value={editedLabel}
                onChange={(e) => setEditedLabel(e.target.value)}
                placeholder={report.title}
                className="text-xl font-bold"
              />
            ) : (
              <h1 className="text-xl font-bold text-gray-900">
                {report.report_label || report.title}
              </h1>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
            >
              {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-gray-600">{report.report_type}</p>
        </div>
      </div>

      {/* Report Details */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Date</h3>
          <p className="text-gray-600">
            {new Date(report.actual_report_date || report.report_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Veterinarian</h3>
          {isEditing ? (
            <Input
              value={editedVetDiagnosis}
              onChange={(e) => setEditedVetDiagnosis(e.target.value)}
              placeholder="Enter vet's name"
            />
          ) : (
            <p className="text-gray-600">
              {report.vet_diagnosis || 'Not specified'}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <h3 className="font-semibold text-gray-900 mb-1">Clinic</h3>
          <p className="text-gray-600">Metro Veterinary Center</p>
        </div>
      </div>

      {/* Attachments */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
        <div className="grid grid-cols-2 gap-3">
          {report.image_url && (
            <div 
              className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowImageDialog(true)}
            >
              <img 
                src={report.image_url} 
                alt="Report attachment"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Mock PDF attachment */}
          <div className="aspect-square bg-red-50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-red-100 transition-colors">
            <FileText className="h-12 w-12 text-red-500 mb-2" />
            <span className="text-sm font-medium text-red-700">Chemistry_Panel.pdf</span>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Report Summary</h3>
        {hasAIAnalysis ? (
          <div className="space-y-4">
            {/* Key Highlights Box */}
            {keyHighlights.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">AI</span>
                  </div>
                  <span className="font-medium text-blue-900">AI Analysis</span>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Key Highlights</h4>
                  <ul className="space-y-1">
                    {keyHighlights.map((highlight, index) => (
                      <li key={index} className="text-blue-800 flex items-center gap-2">
                        <span className="text-blue-600">•</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {analysis.summary && (
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Detailed Analysis</h4>
                    <p className="text-blue-800 leading-relaxed">{analysis.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Full Report Analysis */}
            {analysis.meaning && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Full Report</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {analysis.meaning}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">All values within normal ranges.</p>
            {onTriggerAI && (
              <Button
                onClick={() => onTriggerAI(report.id)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Brain className="h-4 w-4 mr-2" />
                Run AI Analysis
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t">
        <Button variant="outline" className="flex-1">
          <Camera className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button variant="outline" className="flex-1">
          <FileText className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" className="flex-1">
          <Edit2 className="h-4 w-4 mr-2" />
          Copy
        </Button>
      </div>

      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Report Image</DialogTitle>
          </DialogHeader>
          {report.image_url && (
            <div className="flex justify-center">
              <img 
                src={report.image_url} 
                alt="Full report"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthReportCard;
