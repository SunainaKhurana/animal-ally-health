
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Activity,
  FileText,
  Calendar,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useSymptomReports } from '@/hooks/useSymptomReports';
import { useDailyCheckins } from '@/hooks/useDailyCheckins';
import { useHealthReports } from '@/hooks/useHealthReports';
import { formatDate } from '@/lib/dateUtils';
import { useToast } from '@/hooks/use-toast';

interface HealthAnalysis {
  petId: string;
  symptoms: string[];
  notes: string;
  analysis: string;
  timestamp: string;
  reportDate: string;
  followUp?: {
    status: 'improving' | 'worsening' | 'same';
    notes: string;
    date: string;
  };
}

interface HealthDashboardProps {
  pet: any;
}

const HealthDashboard = ({ pet }: HealthDashboardProps) => {
  const [analyses, setAnalyses] = useState<HealthAnalysis[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<HealthAnalysis | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const { reports } = useSymptomReports();
  const { checkins } = useDailyCheckins();
  const { healthReports } = useHealthReports();
  const { toast } = useToast();

  useEffect(() => {
    // Load health analyses from localStorage
    const storedAnalyses = JSON.parse(localStorage.getItem('petHealthAnalyses') || '[]');
    const petAnalyses = storedAnalyses
      .filter((analysis: HealthAnalysis) => analysis.petId === pet.id)
      .sort((a: HealthAnalysis, b: HealthAnalysis) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    
    setAnalyses(petAnalyses);
    setLatestAnalysis(petAnalyses[0] || null);
  }, [pet.id]);

  const getHealthTrend = () => {
    if (analyses.length < 2) return null;
    
    const latest = analyses[0];
    const previous = analyses[1];
    
    // Simple sentiment analysis based on keywords
    const negativeKeywords = ['urgent', 'concerning', 'serious', 'emergency', 'severe', 'contact vet immediately'];
    const positiveKeywords = ['minor', 'normal', 'routine', 'monitor', 'mild'];
    
    const latestScore = negativeKeywords.some(keyword => 
      latest.analysis.toLowerCase().includes(keyword)
    ) ? -1 : positiveKeywords.some(keyword => 
      latest.analysis.toLowerCase().includes(keyword)
    ) ? 1 : 0;
    
    const previousScore = negativeKeywords.some(keyword => 
      previous.analysis.toLowerCase().includes(keyword)
    ) ? -1 : positiveKeywords.some(keyword => 
      previous.analysis.toLowerCase().includes(keyword)
    ) ? 1 : 0;
    
    if (latestScore > previousScore) return 'improving';
    if (latestScore < previousScore) return 'worsening';
    return 'stable';
  };

  const getUrgencyLevel = (analysis: string) => {
    const urgentKeywords = ['urgent', 'emergency', 'contact vet immediately', 'serious'];
    const moderateKeywords = ['contact vet', 'schedule appointment', 'monitor closely'];
    
    if (urgentKeywords.some(keyword => analysis.toLowerCase().includes(keyword))) {
      return { level: 'urgent', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
    if (moderateKeywords.some(keyword => analysis.toLowerCase().includes(keyword))) {
      return { level: 'moderate', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
    return { level: 'routine', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const handleFollowUp = (status: 'improving' | 'worsening' | 'same') => {
    if (!latestAnalysis) return;
    
    const updatedAnalysis = {
      ...latestAnalysis,
      followUp: {
        status,
        notes: followUpNotes,
        date: new Date().toISOString()
      }
    };
    
    const allAnalyses = JSON.parse(localStorage.getItem('petHealthAnalyses') || '[]');
    const updatedAnalyses = allAnalyses.map((analysis: HealthAnalysis) => 
      analysis.timestamp === latestAnalysis.timestamp ? updatedAnalysis : analysis
    );
    
    localStorage.setItem('petHealthAnalyses', JSON.stringify(updatedAnalyses));
    setLatestAnalysis(updatedAnalysis);
    setAnalyses(prev => prev.map(a => a.timestamp === latestAnalysis.timestamp ? updatedAnalysis : a));
    setShowFollowUp(false);
    setFollowUpNotes('');
    
    toast({
      title: "Follow-up recorded",
      description: "Your update has been saved to the health record.",
    });
  };

  if (!latestAnalysis) {
    return null;
  }

  const trend = getHealthTrend();
  const urgency = getUrgencyLevel(latestAnalysis.analysis);
  const Icon = urgency.icon;

  // Get health data summary
  const recentReports = reports.filter(r => r.pet_id === pet.id).length;
  const recentCheckins = checkins.filter(c => c.pet_id === pet.id).length;
  const medicalRecords = healthReports.filter(r => r.pet_id === pet.id).length;

  return (
    <div className="space-y-6">
      {/* Latest Health Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Latest Health Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={urgency.color}>
                <Icon className="h-3 w-3 mr-1" />
                {urgency.level}
              </Badge>
              {trend && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {trend === 'improving' && <TrendingUp className="h-3 w-3 text-green-500" />}
                  {trend === 'worsening' && <TrendingDown className="h-3 w-3 text-red-500" />}
                  {trend === 'stable' && <Activity className="h-3 w-3 text-blue-500" />}
                  {trend}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">AI Veterinary Assessment</h4>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">{latestAnalysis.analysis}</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            Reported on {formatDate(latestAnalysis.reportDate)}
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Symptoms reported:</p>
            <div className="flex flex-wrap gap-1">
              {latestAnalysis.symptoms.map((symptom, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {symptom}
                </Badge>
              ))}
            </div>
            {latestAnalysis.notes && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Additional notes:</p>
                <p className="text-sm text-gray-600">{latestAnalysis.notes}</p>
              </div>
            )}
          </div>

          {/* Follow-up section */}
          {!latestAnalysis.followUp && !showFollowUp && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">How is {pet.name} doing since this assessment?</p>
              <Button
                onClick={() => setShowFollowUp(true)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Add Follow-up Update
              </Button>
            </div>
          )}

          {showFollowUp && (
            <div className="pt-4 border-t space-y-3">
              <p className="text-sm font-medium text-gray-700">How is {pet.name} doing now?</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleFollowUp('improving')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <ThumbsUp className="h-3 w-3" />
                  Better
                </Button>
                <Button
                  onClick={() => handleFollowUp('same')}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Same
                </Button>
                <Button
                  onClick={() => handleFollowUp('worsening')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <ThumbsDown className="h-3 w-3" />
                  Worse
                </Button>
              </div>
              <Textarea
                placeholder="Any additional notes about how your pet is doing..."
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowFollowUp(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {latestAnalysis.followUp && (
            <div className="pt-4 border-t bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  className={
                    latestAnalysis.followUp.status === 'improving' ? 'bg-green-100 text-green-800' :
                    latestAnalysis.followUp.status === 'worsening' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }
                >
                  {latestAnalysis.followUp.status === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                  {latestAnalysis.followUp.status === 'worsening' && <TrendingDown className="h-3 w-3 mr-1" />}
                  {latestAnalysis.followUp.status === 'improving' ? 'Improving' : 
                   latestAnalysis.followUp.status === 'worsening' ? 'Getting worse' : 'About the same'}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatDate(latestAnalysis.followUp.date)}
                </span>
              </div>
              {latestAnalysis.followUp.notes && (
                <p className="text-sm text-gray-600">{latestAnalysis.followUp.notes}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{recentReports}</div>
            <div className="text-sm text-gray-600">Symptom Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{recentCheckins}</div>
            <div className="text-sm text-gray-600">Daily Check-ins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{medicalRecords}</div>
            <div className="text-sm text-gray-600">Medical Records</div>
          </CardContent>
        </Card>
      </div>

      {/* Health History Trend */}
      {analyses.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Health History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyses.slice(1, 4).map((analysis, index) => {
                const urgency = getUrgencyLevel(analysis.analysis);
                const Icon = urgency.icon;
                
                return (
                  <div key={analysis.timestamp} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Badge className={`${urgency.color} flex-shrink-0`}>
                      <Icon className="h-3 w-3 mr-1" />
                      {urgency.level}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{formatDate(analysis.reportDate)}</span>
                        {analysis.followUp && (
                          <Badge 
                            variant="outline"
                            className={
                              analysis.followUp.status === 'improving' ? 'border-green-300 text-green-700' :
                              analysis.followUp.status === 'worsening' ? 'border-red-300 text-red-700' :
                              'border-blue-300 text-blue-700'
                            }
                          >
                            {analysis.followUp.status === 'improving' ? 'Improved' : 
                             analysis.followUp.status === 'worsening' ? 'Worsened' : 'Stable'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {analysis.symptoms.slice(0, 3).map((symptom, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                        {analysis.symptoms.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{analysis.symptoms.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {analysis.analysis.substring(0, 150)}...
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthDashboard;
