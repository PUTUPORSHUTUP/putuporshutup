import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Games from "./pages/Games";
import Tournaments from "./pages/Tournaments";
import Leaderboards from "./pages/Leaderboards";
import Social from "./pages/Social";
import Auth from "./pages/Auth";
import Moderator from "./pages/Moderator";
import NotFound from "./pages/NotFound";
import StartTrial from "./pages/StartTrial";
import Sponsor from "./pages/Sponsor";
import SponsorSignup from "./pages/SponsorSignup";
import SponsorDashboard from "./pages/SponsorDashboard";
import SundayShowdown from "./pages/SundayShowdown";
import HowItWorks from "./pages/HowItWorks";
import Education from "./pages/Education";
import Promotion from "./pages/Promotion";
import VIP from "./pages/VIP";
import VIPRequired from "./pages/VIPRequired";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { GamertagWarning } from '@/components/GamertagWarning';
import { ActiveMatchWarning } from '@/components/ActiveMatchWarning';
import { AppHeader } from '@/components/layout/AppHeader';

const App = () => {
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background font-gaming">
                <Toaster />
                <Sonner />
                <div className="w-full bg-blue-900 text-center text-blue-300 py-2 text-sm font-semibold">
                  🔴 Live System Test Happening Tonight. Expect temporary resets or rapid matches. Thank you for helping us build!
                </div>
                <GamertagWarning />
                <ActiveMatchWarning />
          <BrowserRouter>
            <AppHeader />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/games" element={<Games />} />
              <Route path="/tournaments" element={
                <ProtectedRoute>
                  <Tournaments />
                </ProtectedRoute>
              } />
              <Route path="/social" element={
                <ProtectedRoute>
                  <Social />
                </ProtectedRoute>
              } />
              <Route path="/leaderboards" element={<Leaderboards />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/moderator" element={
                <ProtectedRoute>
                  <Moderator />
                </ProtectedRoute>
              } />
              <Route path="/sponsor" element={<Sponsor />} />
              <Route path="/sponsor-signup" element={<SponsorSignup />} />
              <Route path="/sponsor-dashboard" element={
                <ProtectedRoute>
                  <SponsorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/education" element={<Education />} />
              <Route path="/sunday-showdown" element={<SundayShowdown />} />
              <Route path="/promotion" element={
                <ProtectedRoute>
                  <Promotion />
                </ProtectedRoute>
              } />
              <Route path="/vip" element={
                <ProtectedRoute>
                  <VIP />
                </ProtectedRoute>
              } />
              <Route path="/vip-required" element={
                <ProtectedRoute>
                  <VIPRequired />
                </ProtectedRoute>
              } />
              <Route path="/start-trial" element={
                <ProtectedRoute>
                  <StartTrial />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          </div>
        </TooltipProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
