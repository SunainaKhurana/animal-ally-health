
import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PetProvider } from "@/contexts/PetContext";
import { ChatCacheProvider } from "@/contexts/ChatCacheContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { realtimeManager } from "@/lib/realtimeSubscriptionManager";
import Index from "./pages/Index";
import CareTab from "./pages/CareTab";
import AssistantTab from "./pages/AssistantTab";
import ActivityTab from "./pages/ActivityTab";
import MoreTab from "./pages/MoreTab";
import PetProfile from "./pages/PetProfile";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import HealthRecords from "./pages/HealthRecords";
import HealthReportsPage from "./pages/HealthReportsPage";
import ReportSymptoms from "./pages/ReportSymptoms";
import CheckHealthStatus from "./pages/CheckHealthStatus";
import PrescriptionsTracker from "./pages/PrescriptionsTracker";
import WeightTracking from "./pages/WeightTracking";
import WalksTracker from "./pages/WalksTracker";
import ActivityTracker from "./pages/ActivityTracker";
import DailyTracker from "./pages/DailyTracker";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Cleanup realtime subscriptions on app unmount
  useEffect(() => {
    return () => {
      realtimeManager.cleanup();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <AuthGuard>
                <PetProvider>
                  <ChatCacheProvider>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/care" element={<CareTab />} />
                      <Route path="/assistant" element={<AssistantTab />} />
                      <Route path="/activity" element={<ActivityTab />} />
                      <Route path="/more" element={<MoreTab />} />
                      <Route path="/pet/:petId" element={<PetProfile />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<UserProfile />} />
                      <Route path="/health" element={<Navigate to="/health/" replace />} />
                      <Route path="/health/:petId?" element={<HealthRecords />} />
                      <Route path="/health-reports/:petId" element={<HealthReportsPage />} />
                      <Route path="/report-symptoms" element={<ReportSymptoms />} />
                      <Route path="/check-health" element={<CheckHealthStatus />} />
                      <Route path="/prescriptions" element={<PrescriptionsTracker />} />
                      <Route path="/weight" element={<WeightTracking />} />
                      <Route path="/walks" element={<WalksTracker />} />
                      <Route path="/activity-tracker" element={<ActivityTracker />} />
                      <Route path="/daily-tracker" element={<DailyTracker />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ChatCacheProvider>
                </PetProvider>
              </AuthGuard>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
