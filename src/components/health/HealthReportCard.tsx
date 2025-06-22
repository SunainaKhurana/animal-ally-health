
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { HealthReport } from "@/hooks/useHealthReports";

interface HealthReportCardProps {
  report: HealthReport;
  onDelete?: (reportId: string) => void;
}

const HealthReportCard = ({ report, onDelete }: HealthReportCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const analysis = report.ai_analysis ? JSON.parse(report.ai_analysis) : null;
  const extractedData = report.extracted_text ? JSON.parse(report.extracted_text) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              {getStatusIcon(report.status)}
              {report.title}
            </CardTitle>
            <CardDescription>
              {report.report_type} • {new Date(report.report_date).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(report.status)}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(report.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {report.status === 'completed' && analysis && (
        <CardContent>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <span>View AI Analysis</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-4">
              {/* AI Analysis */}
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">AI Analysis</h4>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{analysis.analysis}</p>
                </div>

                {/* Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <p className="text-xs text-amber-800">{analysis.disclaimer}</p>
                </div>

                {/* Vet Questions */}
                {analysis.vetQuestions && analysis.vetQuestions.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Questions for Your Vet</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      {analysis.vetQuestions.map((question: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Extracted Parameters */}
                {extractedData?.parameters && extractedData.parameters.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Extracted Parameters</h4>
                    <div className="space-y-2">
                      {extractedData.parameters.map((param: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
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
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}

      {report.status === 'processing' && (
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 animate-spin" />
            Processing and analyzing report...
          </div>
        </CardContent>
      )}

      {report.status === 'failed' && (
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            Failed to process report. Please try uploading again.
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default HealthReportCard;
