import { useAuth } from "@/contexts/AuthContext";
import { usePetContext } from "@/contexts/PetContext";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  ChevronDown, 
  Plus, 
  Bell, 
  Sun, 
  Pill, 
  Shield, 
  ChevronRight,
  Calendar,
  Home as HomeIcon,
  FileText,
  MessageCircle,
  Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PetLoader from "@/components/ui/PetLoader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useSmartActivityData } from "@/hooks/useSmartActivityData";

const Index = () => {
  const { user, session } = useAuth();
  const { pets, loading: petsLoading, error: petsError, selectedPet, setSelectedPet } = usePetContext();
  const { dashboardData, loading: dashboardLoading } = useDashboardData();
  const { activities, loading: activitiesLoading, showWeekly } = useSmartActivityData();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Debug state changes
  useEffect(() => {
    console.log('📱 Index Page State Update:', {
      user: user ? { id: user.id, email: user.email } : null,
      session: session ? 'Valid' : 'None',
      pets: pets.map(p => ({ id: p.id, name: p.name })),
      selectedPet: selectedPet ? { id: selectedPet.id, name: selectedPet.name } : null,
      petsLoading,
      petsError
    });
  }, [user, session, pets, selectedPet, petsLoading, petsError]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 17) return "Good afternoon!";
    return "Good evening!";
  };

  // Generate health summary text
  const getHealthSummary = () => {
    if (!selectedPet || dashboardLoading) return "";
    
    const hasRecentActivity = dashboardData.hasActivity;
    const healthStatus = dashboardData.healthStatus;
    
    if (healthStatus === 'good' && hasRecentActivity) {
      return `${selectedPet.name} is in excellent health with all vitals in normal range.`;
    } else if (healthStatus === 'good') {
      return `${selectedPet.name} appears healthy. Consider logging recent activities.`;
    } else if (healthStatus === 'attention') {
      return `${selectedPet.name} may need attention. Check recent health reports.`;
    }
    return `Here's ${selectedPet.name}'s health summary for today`;
  };

  // Transform weekly activity data for chart
  const getWeeklyActivityData = () => {
    if (!dashboardData.weeklyActivity) return [];
    
    return dashboardData.weeklyActivity.map(day => ({
      day: day.day,
      value: (day.walks * 30) + (day.feedings * 5) + (day.playtime * 45), // Convert to minutes
      percentage: Math.min(100, ((day.walks * 30) + (day.feedings * 5) + (day.playtime * 45)) / 2) // Scale for visual
    }));
  };

  const weeklyData = getWeeklyActivityData();
  const totalWeeklyActivity = weeklyData.reduce((sum, day) => sum + day.value, 0);
  const averageDailyActivity = weeklyData.length > 0 ? totalWeeklyActivity / weeklyData.length : 0;
  const previousWeekAverage = averageDailyActivity * 0.89; // Mock previous week data
  const activityChange = previousWeekAverage > 0 ? ((averageDailyActivity - previousWeekAverage) / previousWeekAverage) * 100 : 12;

  if (petsLoading) {
    return <PetLoader type="chasing" size="md" />;
  }

  if (petsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">😿</div>
            <p className="text-red-600 mb-4">{petsError}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-dashed border-2 border-purple-200">
          <CardContent className="p-8 text-center">
            <div className="text-8xl mb-6">🐾</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Welcome to Pet Zone!</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Add your first furry friend to get started with tracking their health and activities.
            </p>
            <Button 
              onClick={() => navigate('/more')} 
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white shadow-lg rounded-full px-8 py-3 text-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Pet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedPet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-gray-600">Please select a pet to view their dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          {/* Pet Selector */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 p-2 hover:bg-purple-50">
                <Avatar className="h-12 w-12 ring-2 ring-white shadow-lg">
                  <AvatarImage src={selectedPet?.photo} alt={selectedPet?.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-lg">
                    {selectedPet?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-800 text-lg">
                    {selectedPet?.name}'s Zone
                  </span>
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="h-auto bg-white">
              <SheetHeader>
                <SheetTitle className="text-purple-800">Select Pet</SheetTitle>
              </SheetHeader>
              <div className="grid gap-3 mt-4 pb-4">
                {pets.map((pet) => (
                  <Button
                    key={pet.id}
                    variant={selectedPet?.id === pet.id ? "default" : "ghost"}
                    className={`flex items-center gap-3 justify-start h-auto p-3 ${
                      selectedPet?.id === pet.id 
                        ? "bg-purple-100 border-purple-200 text-purple-800" 
                        : "hover:bg-purple-50"
                    }`}
                    onClick={() => {
                      setSelectedPet(pet);
                      setOpen(false);
                    }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={pet.photo} alt={pet.name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                        {pet.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium">{pet.name}'s Zone</p>
                      <p className="text-sm text-gray-500 capitalize">{pet.breed} {pet.type}</p>
                    </div>
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 justify-center h-12 border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => {
                    navigate('/more');
                    setOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add New Pet
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200"
              onClick={() => navigate('/more')}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
              onClick={() => navigate('/care')}
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Greeting Section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
            <Sun className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {getGreeting()}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {getHealthSummary()}
            </p>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card 
            className="bg-gradient-to-br from-purple-400 via-purple-500 to-pink-500 border-0 cursor-pointer hover:scale-105 transition-transform shadow-lg"
            onClick={() => navigate('/report-symptoms')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg">Add Medication</h3>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 border-0 cursor-pointer hover:scale-105 transition-transform shadow-lg"
            onClick={() => navigate('/care')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg">Add Vaccine</h3>
            </CardContent>
          </Card>
        </div>

        {/* Smart Today's Activities */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-purple-800">
              {showWeekly ? "This Week's Activities" : "Today's Activities"}
            </h2>
            <Button 
              variant="ghost" 
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={() => navigate('/activity')}
            >
              See All
            </Button>
          </div>
          
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white/80 backdrop-blur-sm border-white/20">
                  <CardContent className="p-4">
                    <div className="animate-pulse flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-white/20">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="font-semibold text-gray-900 mb-2">No activities yet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Start logging {selectedPet?.name}'s activities to see them here
                </p>
                <Button 
                  onClick={() => navigate('/activity')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  Log Activity
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card 
                  key={activity.id} 
                  className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-colors cursor-pointer"
                  onClick={() => navigate(activity.route)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${activity.color} rounded-full flex items-center justify-center text-lg`}>
                          {activity.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{activity.title}</h3>
                          <p className="text-xs text-gray-600">{activity.time} · {activity.status}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Health Insights Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-purple-800 mb-6">Health Insights</h2>
          
          <Card className="bg-white/80 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
                  <p className="text-sm text-gray-600">Last 7 days</p>
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                  +{Math.round(activityChange)}%
                </div>
              </div>
              
              {/* Activity Bar Chart */}
              <div className="flex items-end justify-between h-32 mb-4">
                {weeklyData.map((day, index) => (
                  <div key={day.day} className="flex flex-col items-center gap-2 flex-1">
                    <div className="flex-1 flex items-end w-full px-1">
                      <div 
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          index % 2 === 0 
                            ? 'bg-gradient-to-t from-purple-400 to-purple-500' 
                            : 'bg-gradient-to-t from-pink-400 to-pink-500'
                        }`}
                        style={{ 
                          height: `${Math.max(8, day.percentage)}%`,
                          minHeight: '8px'
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{day.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center min-h-[64px] px-3 py-2 rounded-lg text-purple-600 bg-purple-50"
            onClick={() => navigate('/')}
          >
            <HomeIcon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center min-h-[64px] px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700"
            onClick={() => navigate('/report-symptoms')}
          >
            <Pill className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Meds</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center min-h-[64px] px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700"
            onClick={() => navigate('/care')}
          >
            <Shield className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Vaccines</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center min-h-[64px] px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700"
            onClick={() => navigate('/health-reports')}
          >
            <FileText className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Reports</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center min-h-[64px] px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700"
            onClick={() => navigate('/assistant')}
          >
            <MessageCircle className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Chat</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex flex-col items-center justify-center min-h-[64px] px-3 py-2 rounded-lg text-gray-500 hover:text-gray-700"
            onClick={() => navigate('/activity')}
          >
            <Activity className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Activity</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
