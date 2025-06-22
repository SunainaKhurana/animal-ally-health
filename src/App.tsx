
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import Index from "./pages/Index";
import HealthRecords from "./pages/HealthRecords";
import PetProfile from "./pages/PetProfile";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import WeightTracking from "./pages/WeightTracking";
import WalksTracker from "./pages/WalksTracker";
import ActivityTracker from "./pages/ActivityTracker";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="pb-16">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/health" element={<HealthRecords />} />
            <Route path="/health/:petId" element={<HealthRecords />} />
            <Route path="/pet/:petId" element={<PetProfile />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/weight/:petId" element={<WeightTracking />} />
            <Route path="/activity" element={<ActivityTracker />} />
            <Route path="/walks/:petId" element={<WalksTracker />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <BottomNavigation />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
