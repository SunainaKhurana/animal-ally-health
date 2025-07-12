
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { HealthReport } from '@/hooks/useHealthReports';

interface HealthReportsFiltersProps {
  filters: {
    reportType: string;
    dateRange: string;
    status: string;
  };
  onFiltersChange: (filters: any) => void;
  reports: HealthReport[];
}

const HealthReportsFilters = ({ filters, onFiltersChange, reports }: HealthReportsFiltersProps) => {
  // Get unique report types
  const reportTypes = [...new Set(reports.map(report => report.report_type))];
  
  const hasActiveFilters = filters.reportType || filters.dateRange || filters.status;

  const clearFilters = () => {
    onFiltersChange({
      reportType: '',
      dateRange: '',
      status: ''
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            Filters:
          </div>
          
          <Select
            value={filters.reportType}
            onValueChange={(value) => onFiltersChange({ ...filters, reportType: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {reportTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthReportsFilters;
