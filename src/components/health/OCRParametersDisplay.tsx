
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OCRParameter {
  name: string;
  value: string | number;
  unit?: string;
  reference_range?: string;
  status?: 'normal' | 'high' | 'low' | 'abnormal';
}

interface OCRParametersDisplayProps {
  ocrParameters: any;
}

const OCRParametersDisplay = ({ ocrParameters }: OCRParametersDisplayProps) => {
  if (!ocrParameters) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>No detailed parameters available</p>
      </div>
    );
  }

  // Parse OCR parameters - handle different formats from Make.com
  const parseParameters = (params: any): OCRParameter[] => {
    try {
      // If it's a string, try to parse as JSON
      if (typeof params === 'string') {
        params = JSON.parse(params);
      }

      // Handle array format
      if (Array.isArray(params)) {
        return params.map(param => ({
          name: param.parameter || param.name || 'Unknown Parameter',
          value: param.value || param.result || 'N/A',
          unit: param.unit || '',
          reference_range: param.reference_range || param.normal_range || '',
          status: param.status || 'normal'
        }));
      }

      // Handle object format
      if (typeof params === 'object') {
        return Object.entries(params).map(([key, value]: [string, any]) => ({
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: typeof value === 'object' ? value.value || JSON.stringify(value) : value,
          unit: typeof value === 'object' ? value.unit || '' : '',
          reference_range: typeof value === 'object' ? value.reference_range || '' : '',
          status: typeof value === 'object' ? value.status || 'normal' : 'normal'
        }));
      }

      return [];
    } catch (error) {
      console.error('Error parsing OCR parameters:', error);
      return [];
    }
  };

  const parameters = parseParameters(ocrParameters);

  if (parameters.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>No parameters could be extracted from this report</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Low</Badge>;
      case 'abnormal':
        return <Badge variant="destructive" className="text-xs">Abnormal</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Normal</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Test Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {parameters.map((param, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{param.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-semibold text-gray-800">
                    {param.value} {param.unit}
                  </span>
                  {param.reference_range && (
                    <span className="text-sm text-gray-500">
                      (Ref: {param.reference_range})
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-4">
                {getStatusBadge(param.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OCRParametersDisplay;
