
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Sparkles, Edit2, Save, X, ExternalLink, Link } from "lucide-react";
import { HealthReport } from "@/hooks/useHealthReports";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HealthReportCardProps {
  report: HealthReport;
  onDelete?: (reportId: string) => void;
  autoExpand?: boolean;
}

const HealthReportCard = ({ report, onDelete, autoExpand = false }: HealthReportCardProps) => {
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(report.report_label || '');
  const [editedVetDiagnosis, setEditedVetDiagnosis] = useState(report.vet_diagnosis || '');
  const [relatedReports, setRelatedReports] = useState<HealthReport[]>([]);
  const { toast } = useToast();

  // Auto-expand if analysis is completed and autoExpand is true
  useEffect(() => {
    if (autoExpand && report.ai_analysis) {
      setIsExpanded(true);
    }
  }, [autoExpand, report.ai_analysis]);

  // Fetch related reports of the same type
  useEffect(() => {
    const fetchRelatedReports = async () => {
      if (report.ai_analysis) {
        const { data } = await supabase
          .from('health_reports')
          .select('*')
          .eq('pet_id', report.pet_id)
          .eq('report_type', report.report_type)
          .neq('id', report.id)
          .order('actual_report_date', { ascending: false, nullsFirst: false })
          .limit(5);
        
        setRelatedReports(data || []);
      }
    };
    
    fetchRelatedReports();
  }, [report]);

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

  const analysis = report.ai_analysis ? JSON.parse(report.ai_analysis) : null;
  const extractedData = report.extracted_text ? JSON.parse(report.extracted_text) : null;

  // Only show the card if there's AI analysis to display
  if (!analysis) {
    return null;
  }

  return (
    <Card className="border-green-200 bg-green-50/30 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              {isEditing ? (
                <Input
                  value={editedLabel}
                  onChange={(e) => setEditedLabel(e.target.value)}
                  placeholder={report.title}
                  className="text-lg font-semibold"
                />
              ) : (
                <span>{report.report_label || report.title}</span>
              )}
            </CardTitle>
            <CardDescription>
              AI Analysis Results • {new Date(report.actual_report_date || report.report_date).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">
              AI Analyzed
            </Badge>
            {isEditing ? (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="text-green-600 hover:text-green-700"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedLabel(report.report_label || '');
                    setEditedVetDiagnosis(report.vet_diagnosis || '');
                  }}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                AI Analysis & Report Details
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Vet Diagnosis Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Vet's Diagnosis</h4>
              {isEditing ? (
                <Textarea
                  value={editedVetDiagnosis}
                  onChange={(e) => setEditedVetDiagnosis(e.target.value)}
                  placeholder="Enter vet's diagnosis or notes..."
                  rows={3}
                  className="bg-white"
                />
              ) : (
                <p className="text-sm text-blue-800">
                  {report.vet_diagnosis || "No diagnosis entered yet"}
                </p>
              )}
            </div>

            {/* Main AI Analysis */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Summary & Insights
              </h4>
              <p className="text-sm text-green-800 whitespace-pre-wrap leading-relaxed">{analysis.analysis}</p>
            </div>

            {/* Test Results */}
            {extractedData?.parameters && extractedData.parameters.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Test Results</h4>
                <div className="space-y-2">
                  {extractedData.parameters.map((param: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                      <span className="font-medium">{param.name}</span>
                      <div className="flex items-center gap-2">
                        <span>{param.value} {param.unit}</span>
                        {param.status && (
                          <Badge 
                            variant={param.status === 'normal' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {param.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions for Vet */}
            {analysis.vetQuestions && analysis.vetQuestions.length > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-2">Questions to Ask Your Vet</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  {analysis.vetQuestions.map((question: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Reports */}
            {relatedReports.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Related {report.report_type} Reports
                </h4>
                <div className="space-y-2">
                  {relatedReports.map((relatedReport) => (
                    <div key={relatedReport.id} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                      <span>{relatedReport.report_label || relatedReport.title}</span>
                      <span className="text-gray-600">
                        {new Date(relatedReport.actual_report_date || relatedReport.report_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View Original File */}
            {report.image_url && (
              <div className="flex justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original File
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>Original Report: {report.report_label || report.title}</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center">
                      <img 
                        src={report.image_url} 
                        alt={report.title}
                        className="max-w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> {analysis.disclaimer || "This AI analysis is for informational purposes only and should not replace professional veterinary advice. Always consult with your veterinarian for proper diagnosis and treatment."}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default HealthReportCard;
