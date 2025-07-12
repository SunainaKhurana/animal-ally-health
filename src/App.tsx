
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PetProvider } from "@/contexts/PetContext";
import { ChatCacheProvider } from "@/contexts/ChatCacheContext";
import Index from "./pages/Index";
import CareTab from "./pages/CareTab";
import ActivityTab from "./pages/ActivityTab";
import AssistantTab from "./pages/AssistantTab";
import MoreTab from "./pages/MoreTab";
import PetProfile from "./pages/PetProfile";
import HealthReportsPage from "./pages/HealthReportsPage";
import NotFound from "./pages/NotFound";
import ReportSymptoms from "./pages/ReportSymptoms";
import CheckHealthStatus from "./pages/CheckHealthStatus";
import ActivityTracker from "./pages/ActivityTracker";
import WalksTracker from "./pages/WalksTracker";
import DailyTracker from "./pages/DailyTracker";
import PrescriptionsTracker from "./pages/PrescriptionsTracker";
import WeightTracking from "./pages/WeightTracking";
import HealthRecords from "./pages/HealthRecords";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PetProvider>
              <ChatCacheProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/care" element={<CareTab />} />
                  <Route path="/activity" element={<ActivityTab />} />
                  <Route path="/assistant" element={<AssistantTab />} />
                  <Route path="/more" element={<MoreTab />} />
                  <Route path="/pet/:petId" element={<PetProfile />} />
                  <Route path="/health-reports/:petId" element={<HealthReportsPage />} />
                  <Route path="/report-symptoms" element={<ReportSymptoms />} />
                  <Route path="/check-health" element={<CheckHealthStatus />} />
                  <Route path="/activity-tracker" element={<ActivityTracker />} />
                  <Route path="/walks" element={<WalksTracker />} />
                  <Route path="/daily-tracker" element={<DailyTracker />} />
                  <Route path="/prescriptions" element={<PrescriptionsTracker />} />
                  <Route path="/weight-tracking" element={<WeightTracking />} />
                  <Route path="/health-records" element={<HealthRecords />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ChatCacheProvider>
            </PetProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
