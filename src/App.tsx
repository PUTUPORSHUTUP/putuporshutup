import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import AdminRoutes from "./pages/AdminRoutes";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSimPanel from "./components/AdminSimPanel";
import Games from "./pages/Games";
import Tournaments from "./pages/Tournaments";
import Leaderboards from "./pages/Leaderboards";
import Social from "./pages/Social";
import Auth from "./pages/Auth";
import Moderator from "./pages/Moderator";
import NotFound from "./pages/NotFound";
import Health from "./pages/Health";
import StartTrial from "./pages/StartTrial";
import VIPSuccess from "./pages/VIPSuccess";
import Sponsor from "./pages/Sponsor";
import SponsorSignup from "./pages/SponsorSignup";
import SponsorDashboard from "./pages/SponsorDashboard";
import SundayShowdown from "./pages/SundayShowdown";
import TournamentDetail from "./pages/TournamentDetail";
import HowItWorks from "./pages/HowItWorks";
import Education from "./pages/Education";
import Promotion from "./pages/Promotion";
import VIP from "./pages/VIP";
import VIPRequired from "./pages/VIPRequired";
import Wallet from "./pages/Wallet";
import QueuePage from "./pages/QueuePage";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { GamertagWarning } from '@/components/GamertagWarning';
import { ActiveMatchWarning } from '@/components/ActiveMatchWarning';
import { AppHeader } from '@/components/layout/AppHeader';
import Footer from '@/components/layout/Footer';
import VipTrialBanner from '@/components/VipTrialBanner';

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
                <VipTrialBanner />
          <BrowserRouter>
            <AppHeader />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="/health" element={<Health />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
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
