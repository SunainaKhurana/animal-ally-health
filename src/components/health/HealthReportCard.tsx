import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Sparkles, Edit2, Save, X, ExternalLink, Link, Brain } from "lucide-react";
import { HealthReport } from "@/hooks/useHealthReports";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AIHealthReportSummary from "./AIHealthReportSummary";

interface HealthReportCardProps {
  report: HealthReport;
  onDelete?: (reportId: string) => void;
  onTriggerAI?: (reportId: string) => void;
  autoExpand?: boolean;
}

const HealthReportCard = ({ report, onDelete, onTriggerAI, autoExpand = false }: HealthReportCardProps) => {
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

  // Safe JSON parsing with error handling - enhanced to handle structured AI analysis
  const parseAIAnalysis = (aiAnalysis: string | null) => {
    if (!aiAnalysis) return null;
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiAnalysis);
      // Check if it's the new structured format
      if (parsed && typeof parsed === 'object' && parsed.summary) {
        return { structured: true, data: parsed };
      }
      return { structured: false, data: parsed };
    } catch (error) {
      console.log('AI analysis is not JSON format, treating as plain text:', aiAnalysis.substring(0, 50) + '...');
      // If it's not JSON, treat it as plain text analysis
      return {
        structured: false,
        data: {
          analysis: aiAnalysis,
          disclaimer: "This AI analysis is for informational purposes only and should not replace professional veterinary advice. Always consult with your veterinarian for proper diagnosis and treatment."
        }
      };
    }
  };

  const analysis = parseAIAnalysis(report.ai_analysis);
  const extractedData = report.extracted_text ? (() => {
    try {
      return JSON.parse(report.extracted_text);
    } catch (error) {
      console.log('Extracted text is not JSON format');
      return null;
    }
  })() : null;

  // Always show the card, regardless of AI analysis status
  return (
    <Card className={analysis ? "border-green-200 bg-green-50/30 shadow-sm" : "border-gray-200 bg-white shadow-sm"}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              {analysis ? (
                <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              ) : (
                <Brain className="h-4 w-4 text-gray-400 flex-shrink-0" />
              )}
              {isEditing ? (
                <Input
                  value={editedLabel}
                  onChange={(e) => setEditedLabel(e.target.value)}
                  placeholder={report.title}
                  className="text-base font-semibold h-8"
                />
              ) : (
                <span className="truncate">{report.report_label || report.title}</span>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {analysis ? 'AI Analysis' : 'Ready for Analysis'} • {new Date(report.actual_report_date || report.report_date).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={analysis ? "bg-green-100 text-green-800 text-xs" : "bg-gray-100 text-gray-800 text-xs"}>
              {analysis ? 'AI Analyzed' : 'Uploaded'}
            </Badge>
            {isEditing ? (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="text-green-600 hover:text-green-700 h-7 w-7 p-0"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedLabel(report.report_label || '');
                    setEditedVetDiagnosis(report.vet_diagnosis || '');
                  }}
                  className="text-gray-600 hover:text-gray-700 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-700 h-7 w-7 p-0"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 hover:bg-transparent h-auto">
              <span className="flex items-center gap-2 text-sm">
                {analysis ? (
                  <>
                    <Sparkles className="h-3 w-3 text-yellow-500" />
                    AI Analysis & Report Details
                  </>
                ) : (
                  <>
                    <Brain className="h-3 w-3 text-gray-400" />
                    Report Details & Analysis Options
                  </>
                )}
              </span>
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-3">
            {/* Vet Diagnosis Section */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2 text-sm">Vet's Diagnosis</h4>
              {isEditing ? (
                <Textarea
                  value={editedVetDiagnosis}
                  onChange={(e) => setEditedVetDiagnosis(e.target.value)}
                  placeholder="Enter vet's diagnosis or notes..."
                  rows={3}
                  className="bg-white text-xs"
                />
              ) : (
                <p className="text-xs text-blue-800">
                  {report.vet_diagnosis || "No diagnosis entered yet"}
                </p>
              )}
            </div>

            {/* AI Analysis or Call-to-Action */}
            {analysis ? (
              <>
                {/* Check if it's structured analysis */}
                {analysis.structured ? (
                  <AIHealthReportSummary data={analysis.data} />
                ) : (
                  /* Legacy AI Analysis Display */
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2 text-sm">
                      <Sparkles className="h-3 w-3" />
                      AI Summary & Insights
                    </h4>
                    <p className="text-xs text-green-800 whitespace-pre-wrap leading-relaxed">{analysis.data.analysis}</p>
                  </div>
                )}

                {/* Test Results */}
                {extractedData?.parameters && extractedData.parameters.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Test Results</h4>
                    <div className="space-y-2">
                      {extractedData.parameters.map((param: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-xs bg-white p-2 rounded">
                          <span className="font-medium">{param.name}</span>
                          <div className="flex items-center gap-2">
                            <span>{param.value} {param.unit}</span>
                            {param.status && (
                              <Badge 
                                variant={param.status === 'normal' ? 'default' : 'destructive'}
                                className="text-xs h-4"
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

                {/* Questions for Vet - only show for legacy format */}
                {!analysis.structured && analysis.data.vetQuestions && analysis.data.vetQuestions.length > 0 && (
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-900 mb-2 text-sm">Questions to Ask Your Vet</h4>
                    <ul className="text-xs text-orange-800 space-y-1">
                      {analysis.data.vetQuestions.map((question: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-600 mt-0.5 flex-shrink-0">•</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Reports */}
                {relatedReports.length > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2 text-sm">
                      <Link className="h-3 w-3" />
                      Related {report.report_type} Reports
                    </h4>
                    <div className="space-y-2">
                      {relatedReports.map((relatedReport) => (
                        <div key={relatedReport.id} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                          <span className="truncate flex-1 mr-2">{relatedReport.report_label || relatedReport.title}</span>
                          <span className="text-gray-600 flex-shrink-0">
                            {new Date(relatedReport.actual_report_date || relatedReport.report_date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No AI Analysis - Show Call to Action */
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                <Brain className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <h4 className="font-medium text-amber-900 mb-2 text-sm">AI Analysis Available</h4>
                <p className="text-xs text-amber-800 mb-3">
                  Get detailed insights about this health report using AI analysis
                </p>
                {onTriggerAI && (
                  <Button
                    onClick={() => onTriggerAI(report.id)}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Brain className="h-3 w-3 mr-1" />
                    Analyze with AI
                  </Button>
                )}
              </div>
            )}

            {/* View Original File */}
            {report.image_url && (
              <div className="flex justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full text-xs h-8">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Original File
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full h-full md:max-w-4xl md:h-auto md:max-h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle className="truncate text-base">
                        Original Report: {report.report_label || report.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center">
                      <img 
                        src={report.image_url} 
                        alt={report.title}
                        className="w-full h-auto rounded-lg shadow-lg"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Disclaimer - only show for legacy format or if no structured disclaimer */}
            {(!analysis || !analysis.structured) && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Important:</strong> {analysis?.data?.disclaimer || "This AI analysis is for informational purposes only and should not replace professional veterinary advice. Always consult with your veterinarian for proper diagnosis and treatment."}
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default HealthReportCard;
