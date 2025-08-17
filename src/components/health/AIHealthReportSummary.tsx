
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Home, AlertTriangle, Activity, Stethoscope, AlertCircle } from 'lucide-react';

interface TestResult {
  parameter: string;
  normal_range: string;
  actual_value: string;
  analysis: string;
}

interface AIHealthReportData {
  summary: string;
  meaning: string;
  home_care: string;
  urgent_signs: string;
  test_results: TestResult[];
  final_analysis: string;
  disclaimer: string;
  key_highlights?: string[];
}

interface AIHealthReportSummaryProps {
  data: AIHealthReportData;
}

const AIHealthReportSummary = ({ data }: AIHealthReportSummaryProps) => {
  const getAnalysisColor = (analysis: string) => {
    const lowerAnalysis = analysis.toLowerCase();
    if (lowerAnalysis.includes('normal') || lowerAnalysis.includes('within')) {
      return 'bg-green-100 text-green-800';
    } else if (lowerAnalysis.includes('elevated') || lowerAnalysis.includes('high') || lowerAnalysis.includes('low')) {
      return 'bg-orange-100 text-orange-800';
    } else if (lowerAnalysis.includes('critical') || lowerAnalysis.includes('abnormal')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* AI Summary & Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-blue-900 text-sm">AI Summary & Insights</h3>
          </div>
          <p className="font-medium text-blue-900 mb-2 text-sm">{data.summary}</p>
          <p className="text-xs text-blue-700 leading-relaxed">{data.meaning}</p>
          
          {data.key_highlights && data.key_highlights.length > 0 && (
            <div className="mt-3 space-y-1">
              <h4 className="font-medium text-blue-900 text-xs">Key Highlights</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                {data.key_highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5 flex-shrink-0">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Home Care Tips */}
      {data.home_care && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold text-green-900 text-sm">Home Care Tips</h3>
            </div>
            <div className="text-xs text-green-800 leading-relaxed whitespace-pre-line">
              {data.home_care}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Urgent Signs to Watch */}
      {data.urgent_signs && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <h3 className="font-semibold text-red-900 text-sm">Urgent Signs to Watch</h3>
            </div>
            <div className="text-xs text-red-800 leading-relaxed whitespace-pre-line">
              {data.urgent_signs}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results Table */}
      {data.test_results && data.test_results.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Test Results</h3>
            </div>
            <div className="space-y-2">
              {data.test_results.map((result, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900 text-xs">{result.parameter}</span>
                    <Badge className={`text-xs h-5 ${getAnalysisColor(result.analysis)}`}>
                      {result.analysis}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Normal Range:</span>
                      <div>{result.normal_range}</div>
                    </div>
                    <div>
                      <span className="font-medium">Actual Value:</span>
                      <div>{result.actual_value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Assessment */}
      {data.final_analysis && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold text-purple-900 text-sm">Final Assessment</h3>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">{data.final_analysis}</p>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 text-sm mb-1">Important Disclaimer</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                {data.disclaimer}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIHealthReportSummary;
