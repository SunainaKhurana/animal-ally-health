import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CareTab from "./pages/CareTab";
import ActivityTab from "./pages/ActivityTab";
import AssistantTab from "./pages/AssistantTab";
import MoreTab from "./pages/MoreTab";
import PetProfile from "./pages/PetProfile";
import HealthRecords from "./pages/HealthRecords";
import WeightTracking from "./pages/WeightTracking";
import WalksTracker from "./pages/WalksTracker";
import DailyTracker from "./pages/DailyTracker";
import ActivityTracker from "./pages/ActivityTracker";
import CheckHealthStatus from "./pages/CheckHealthStatus";
import ReportSymptoms from "./pages/ReportSymptoms";
import PrescriptionsTracker from "./pages/PrescriptionsTracker";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import HealthReportsPage from "./pages/HealthReportsPage";
import HealthLogsPage from "./pages/HealthLogsPage";
import HealthActivityDetails from "./pages/HealthActivityDetails";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { PetProvider } from "./contexts/PetContext";
import { ChatCacheProvider } from "./contexts/ChatCacheContext";

import { AuthGuard } from "./components/auth/AuthGuard";
import AuthForm from "./components/auth/AuthForm";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <PetProvider>
          <ChatCacheProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
                <Route path="/login" element={<AuthForm />} />
                <Route path="/auth" element={<AuthForm />} />
                <Route path="/care" element={<AuthGuard><CareTab /></AuthGuard>} />
                <Route path="/activity" element={<AuthGuard><ActivityTab /></AuthGuard>} />
                <Route path="/assistant" element={<AuthGuard><AssistantTab /></AuthGuard>} />
                <Route path="/more" element={<AuthGuard><MoreTab /></AuthGuard>} />
                <Route path="/pet/:petId" element={<AuthGuard><PetProfile /></AuthGuard>} />
                <Route path="/health/:petId" element={<AuthGuard><HealthRecords /></AuthGuard>} />
                <Route path="/health-reports/:petId" element={<AuthGuard><HealthReportsPage /></AuthGuard>} />
                <Route path="/health-logs/:petId" element={<AuthGuard><HealthLogsPage /></AuthGuard>} />
                <Route path="/health-activity" element={<AuthGuard><HealthActivityDetails /></AuthGuard>} />
                <Route path="/weight/:petId" element={<AuthGuard><WeightTracking /></AuthGuard>} />
                <Route path="/walks/:petId" element={<AuthGuard><WalksTracker /></AuthGuard>} />
                <Route path="/daily-tracker" element={<AuthGuard><DailyTracker /></AuthGuard>} />
                <Route path="/activity-tracker" element={<AuthGuard><ActivityTracker /></AuthGuard>} />
                <Route path="/check-health" element={<AuthGuard><CheckHealthStatus /></AuthGuard>} />
                <Route path="/report-symptoms" element={<AuthGuard><ReportSymptoms /></AuthGuard>} />
                <Route path="/prescriptions" element={<AuthGuard><PrescriptionsTracker /></AuthGuard>} />
                <Route path="/profile" element={<AuthGuard><UserProfile /></AuthGuard>} />
                <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ChatCacheProvider>
        </PetProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;