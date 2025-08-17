
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronRight, Edit2, Save, X, Calendar, Stethoscope, Brain, FileText, Camera, Loader2, Trash2 } from "lucide-react";
import { HealthReport } from "@/hooks/useHealthReports";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import OCRParametersDisplay from "./OCRParametersDisplay";

interface HealthReportCardProps {
  report: HealthReport;
  onDelete?: (reportId: string) => void;
  onTap?: (report: HealthReport) => void;
  showAsListItem?: boolean;
}

const HealthReportCard = ({ 
  report, 
  onDelete, 
  onTap,
  showAsListItem = false
}: HealthReportCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLabel, setEditedLabel] = useState(report.report_label || '');
  const [editedVetDiagnosis, setEditedVetDiagnosis] = useState(report.vet_diagnosis || '');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingFromList, setIsDeletingFromList] = useState(false);
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

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    
    if (showAsListItem) {
      setIsDeletingFromList(true);
    }
    
    try {
      await onDelete(report.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setIsDeletingFromList(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (showDeleteDialog || isDeleting || isDeletingFromList) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    if (onTap && showAsListItem) {
      onTap(report);
    }
  };

  const formatKeyFindings = (keyFindings: string | null) => {
    if (!keyFindings) return [];
    
    // Split by bullet points, periods, or new lines and clean up
    const findings = keyFindings
      .split(/[•\n]|(?:\d+\.)|(?:-\s)/)
      .map(finding => finding.trim())
      .filter(finding => finding.length > 0 && finding !== '.' && finding !== '-');
    
    return findings.slice(0, 3); // Show max 3 findings in list view
  };

  const getReportImages = () => {
    const images = [];
    if (report.image_url) {
      images.push(report.image_url);
    }
    return images;
  };

  const reportImages = getReportImages();
  const keyFindings = formatKeyFindings(report.key_findings);

  // List view layout
  if (showAsListItem) {
    return (
      <Card 
        className={`cursor-pointer hover:shadow-md transition-all duration-200 ${
          showDeleteDialog || isDeleting || isDeletingFromList ? 'pointer-events-none opacity-75' : ''
        }`}
        onClick={handleCardClick}
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
                <div className="flex items-center gap-1 flex-shrink-0">
                  {onDelete && (
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDeleteDialog(true);
                          }}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 pointer-events-auto"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Health Report</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{report.report_label || report.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteDialog(false);
                            }}
                            disabled={isDeleting}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfirm();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              'Delete'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Thumbnail Images */}
              {reportImages.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {reportImages.slice(0, 3).map((imageUrl, index) => (
                    <div key={index} className="w-16 h-12 bg-gray-100 rounded overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={`Report image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                  {reportImages.length > 3 && (
                    <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-600">+{reportImages.length - 3}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Summary Section */}
              {keyFindings.length > 0 ? (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-blue-900">Summary</span>
                  </div>
                  <ul className="space-y-1">
                    {keyFindings.map((finding, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="flex items-center gap-2 text-gray-600">
                    {report.status === 'processing' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analysis in progress...</span>
                      </>
                    ) : (
                      <span className="text-sm">No summary available yet</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Detail view layout
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
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
              >
                {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              </Button>
              {onDelete && (
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-600"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Health Report</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{report.report_label || report.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteConfirm}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
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
      {reportImages.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
          <div className="grid grid-cols-2 gap-3">
            {reportImages.map((imageUrl, index) => (
              <div 
                key={index}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setShowImageDialog(true)}
              >
                <img 
                  src={imageUrl} 
                  alt={`Report attachment ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Summary */}
      {report.key_findings && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Report Summary</h3>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                {formatKeyFindings(report.key_findings).map((finding, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-gray-700">{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Analysis */}
      {report.ai_analysis && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">AI Analysis</h3>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <span className="font-medium text-blue-900">Detailed Analysis</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {report.ai_analysis}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Report - OCR Parameters */}
      {report.ocr_parameters && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Full Report</h3>
          <OCRParametersDisplay ocrParameters={report.ocr_parameters} />
        </div>
      )}

      {/* No Analysis Available */}
      {!report.key_findings && !report.ai_analysis && !report.ocr_parameters && (
        <div className="text-center py-8">
          {report.status === 'processing' ? (
            <div>
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analyzing report... This may take a moment.
              </p>
            </div>
          ) : (
            <p className="text-gray-600">No analysis available yet.</p>
          )}
        </div>
      )}

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
            <DialogTitle>Report Images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reportImages.map((imageUrl, index) => (
              <div key={index} className="flex justify-center">
                <img 
                  src={imageUrl} 
                  alt={`Full report ${index + 1}`}
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthReportCard;
