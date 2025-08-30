
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PetProvider } from "@/contexts/PetContext";
import { ChatCacheProvider } from "@/contexts/ChatCacheContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import Index from "./pages/Index";
import CareTab from "./pages/CareTab";
import ActivityTab from "./pages/ActivityTab";
import AssistantTab from "./pages/AssistantTab";
import MoreTab from "./pages/MoreTab";
import PetProfile from "./pages/PetProfile";
import HealthReportsPage from "./pages/HealthReportsPage";
import WeightTracking from "./pages/WeightTracking";
import WalksTracker from "./pages/WalksTracker";
import PrescriptionsTracker from "./pages/PrescriptionsTracker";
import ReportSymptoms from "./pages/ReportSymptoms";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import ActivityTracker from "./pages/ActivityTracker";
import DailyTracker from "./pages/DailyTracker";
import CheckHealthStatus from "./pages/CheckHealthStatus";
import NotFound from "./pages/NotFound";

// Create query client with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <AuthGuard>
                <ErrorBoundary>
                  <PetProvider>
                    <ErrorBoundary>
                      <ChatCacheProvider>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/care" element={<CareTab />} />
                          <Route path="/activity" element={<ActivityTab />} />
                          <Route path="/assistant" element={<AssistantTab />} />
                          <Route path="/more" element={<MoreTab />} />
                          <Route path="/pet/:petId" element={<PetProfile />} />
                          <Route path="/health-reports" element={<HealthReportsPage />} />
                          <Route path="/health-reports/:petId" element={<HealthReportsPage />} />
                          <Route path="/weight/:petId" element={<WeightTracking />} />
                          <Route path="/walks/:petId" element={<WalksTracker />} />
                          <Route path="/prescriptions/:petId" element={<PrescriptionsTracker />} />
                          <Route path="/report-symptoms/:petId" element={<ReportSymptoms />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/profile" element={<UserProfile />} />
                          <Route path="/activity-tracker/:petId" element={<ActivityTracker />} />
                          <Route path="/daily-tracker/:petId" element={<DailyTracker />} />
                          <Route path="/health-status/:petId" element={<CheckHealthStatus />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ChatCacheProvider>
                    </ErrorBoundary>
                  </PetProvider>
                </ErrorBoundary>
              </AuthGuard>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
