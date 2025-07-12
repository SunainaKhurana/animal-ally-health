
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Activity } from 'lucide-react';
import { HealthReport } from '@/hooks/useHealthReports';

interface HealthReportsTrendsProps {
  reports: HealthReport[];
  petName: string;
}

const HealthReportsTrends = ({ reports, petName }: HealthReportsTrendsProps) => {
  // Sort reports by date for timeline
  const sortedReports = [...reports].sort((a, b) => 
    new Date(a.actual_report_date || a.report_date).getTime() - 
    new Date(b.actual_report_date || b.report_date).getTime()
  );

  // Group reports by type for analysis
  const reportsByType = reports.reduce((acc, report) => {
    const type = report.report_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(report);
    return acc;
  }, {} as Record<string, HealthReport[]>);

  // Calculate basic statistics
  const totalReports = reports.length;
  const reportTypes = Object.keys(reportsByType).length;
  const recentReports = reports.filter(report => {
    const reportDate = new Date(report.actual_report_date || report.report_date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return reportDate >= threeMonthsAgo;
  }).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Health Trends for {petName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalReports}</div>
            <div className="text-sm text-blue-800">Total Reports</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{reportTypes}</div>
            <div className="text-sm text-green-800">Report Types</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{recentReports}</div>
            <div className="text-sm text-purple-800">Last 3 Months</div>
          </div>
        </div>

        {/* Report Types Breakdown */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Report Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(reportsByType).map(([type, typeReports]) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type} ({typeReports.length})
              </Badge>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recent Timeline
          </h4>
          <div className="space-y-3">
            {sortedReports.slice(-5).reverse().map((report) => (
              <div key={report.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{report.title}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(report.actual_report_date || report.report_date).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {report.report_type}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthReportsTrends;
