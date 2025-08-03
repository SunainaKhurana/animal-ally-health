
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { HealthReport } from '@/hooks/useHealthReports';

interface HealthReportDisplayProps {
  report: HealthReport;
  onAskAI?: (reportId: string) => void;
}

const HealthReportDisplay = ({ report, onAskAI }: HealthReportDisplayProps) => {
  const [imageError, setImageError] = useState(false);

  const getStatusBadge = () => {
    switch (report.status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Analyzed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {report.report_label || report.title || report.report_type}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {report.report_type} • {formatDate(report.actual_report_date || report.report_date)}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Report Image */}
        {report.image_url && (
          <div className="space-y-2">
            {!imageError ? (
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative cursor-pointer group">
                    <img 
                      src={report.image_url} 
                      alt={report.title || 'Health Report'}
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {report.report_label || report.title || report.report_type}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center">
                    <img 
                      src={report.image_url} 
                      alt={report.title || 'Health Report'}
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
                <p className="text-gray-500">Image unavailable</p>
              </div>
            )}
          </div>
        )}

        {/* AI Diagnosis */}
        {report.status === 'completed' && report.ai_analysis ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-500" />
              <h4 className="font-semibold text-green-800">
                AI Analysis Available
              </h4>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                Diagnosis generated on {formatDate(report.updated_at || report.created_at)}
              </p>
              {/* Show truncated analysis */}
              <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                {typeof report.ai_analysis === 'string' 
                  ? report.ai_analysis 
                  : JSON.stringify(report.ai_analysis)
                }
              </p>
            </div>
            {onAskAI && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAskAI(report.id)}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI about this report
              </Button>
            )}
          </div>
        ) : report.status === 'processing' ? (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
            <p className="text-sm text-yellow-800">Processing report...</p>
          </div>
        ) : report.status === 'failed' ? (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">
              Failed to process this report. Please try uploading again.
            </p>
          </div>
        ) : null}

        {/* Key Findings */}
        {report.key_findings && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800">Key Findings</h4>
            <p className="text-sm text-gray-600">{report.key_findings}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthReportDisplay;
