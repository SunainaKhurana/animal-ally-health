import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OCRParameter {
  name: string;
  value: string | number;
  unit?: string;
  reference_range?: string;
}

interface OCRParametersDisplayProps {
  ocrParameters: any;
}

const OCRParametersDisplay = ({ ocrParameters }: OCRParametersDisplayProps) => {
  console.log('🔍 OCR Parameters received:', ocrParameters);
  
  if (!ocrParameters) {
    console.log('❌ No OCR parameters provided');
    return (
      <div className="text-center py-6 text-gray-500">
        <p>No detailed parameters available</p>
      </div>
    );
  }

  const parseParameters = (params: any): OCRParameter[] => {
    try {
      console.log('🔍 Raw params type:', typeof params, params);
      
      if (typeof params === 'string') {
        if (params.includes('{"parameter"')) {
          const jsonObjects = params
            .replace(/^"|"$/g, '')
            .split('}, {')
            .map((obj, index, array) => {
              if (index === 0 && !obj.startsWith('{')) obj = '{' + obj;
              if (index === array.length - 1 && !obj.endsWith('}')) obj = obj + '}';
              if (index > 0 && index < array.length - 1) obj = '{' + obj + '}';
              return obj;
            });
          
          console.log('🔍 Split JSON objects:', jsonObjects);
          
          const parsedObjects = jsonObjects.map(objStr => {
            try {
              return JSON.parse(objStr);
            } catch (e) {
              console.error('Failed to parse JSON object:', objStr, e);
              return null;
            }
          }).filter(Boolean);
          
          return parsedObjects.map(param => ({
            name: param.parameter || param.name || 'Unknown Parameter',
            value: param.actual_value || param.value || param.result || 'N/A',
            unit: param.unit || '',
            reference_range: param.reference_range || param.normal_range || ''
          }));
        }
        
        try {
          params = JSON.parse(params);
        } catch (e) {
          console.error('Failed to parse JSON string:', e);
          return [];
        }
      }

      if (Array.isArray(params)) {
        return params.map(param => ({
          name: param.parameter || param.name || 'Unknown Parameter',
          value: param.actual_value || param.value || param.result || 'N/A',
          unit: param.unit || '',
          reference_range: param.reference_range || param.normal_range || ''
        }));
      }

      if (typeof params === 'object') {
        const entries = Object.entries(params);
        const results: OCRParameter[] = [];
        
        for (const [key, value] of entries) {
          const parameter: OCRParameter = {
            name: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            value: typeof value === 'object' ? (value as any).value || JSON.stringify(value) : value,
            unit: typeof value === 'object' ? (value as any).unit || '' : '',
            reference_range: typeof value === 'object' ? (value as any).reference_range || '' : ''
          };
          results.push(parameter);
        }
        
        return results;
      }

      return [];
    } catch (error) {
      console.error('Error parsing OCR parameters:', error);
      return [];
    }
  };

  const parameters = parseParameters(ocrParameters);
  console.log('🔍 Parsed parameters:', parameters);

  if (parameters.length === 0) {
    console.log('❌ No parameters could be parsed');
    return (
      <div className="text-center py-6 text-gray-500">
        <p>No parameters could be extracted from this report</p>
        <p className="text-sm mt-2">Raw data: {JSON.stringify(ocrParameters).slice(0, 100)}...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Laboratory Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-gray-900">Parameter</th>
                <th className="text-left p-3 font-medium text-gray-900">Value</th>
                <th className="text-left p-3 font-medium text-gray-900">Unit</th>
                <th className="text-left p-3 font-medium text-gray-900">Reference Range</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((param, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{param.name}</td>
                  <td className="p-3 font-semibold text-gray-900">{param.value}</td>
                  <td className="p-3 text-gray-600">{param.unit || '-'}</td>
                  <td className="p-3 text-gray-600">{param.reference_range || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OCRParametersDisplay;