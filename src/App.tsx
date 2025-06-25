
import "./index.css";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PetProvider } from "@/contexts/PetContext";
import Index from "./pages/Index";
import HealthRecords from "./pages/HealthRecords";
import ReportSymptoms from "./pages/ReportSymptoms";
import CheckHealthStatus from "./pages/CheckHealthStatus";
import WalksTracker from "./pages/WalksTracker";
import WeightTracking from "./pages/WeightTracking";
import ActivityTracker from "./pages/ActivityTracker";
import DailyTracker from "./pages/DailyTracker";
import PrescriptionsTracker from "./pages/PrescriptionsTracker";
import PetProfile from "./pages/PetProfile";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CareTab from "./pages/CareTab";
import ActivityTab from "./pages/ActivityTab";
import AssistantTab from "./pages/AssistantTab";
import MoreTab from "./pages/MoreTab";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <PetProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/care" element={<CareTab />} />
              <Route path="/activity" element={<ActivityTab />} />
              <Route path="/assistant" element={<AssistantTab />} />
              <Route path="/more" element={<MoreTab />} />
              
              {/* Legacy routes - redirect or maintain for backward compatibility */}
              <Route path="/health/:petId" element={<HealthRecords />} />
              <Route path="/report-symptoms" element={<ReportSymptoms />} />
              <Route path="/check-health" element={<CheckHealthStatus />} />
              <Route path="/walks" element={<WalksTracker />} />
              <Route path="/weight" element={<WeightTracking />} />
              <Route path="/activity-tracker" element={<ActivityTracker />} />
              <Route path="/daily" element={<DailyTracker />} />
              <Route path="/prescriptions" element={<PrescriptionsTracker />} />
              <Route path="/pet/:petId" element={<PetProfile />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PetProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
