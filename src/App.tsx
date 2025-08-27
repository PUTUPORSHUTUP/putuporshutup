import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import AdminRoutes from "./pages/AdminRoutes";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Health from "./pages/Health";
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
                <GamertagWarning />
                <ActiveMatchWarning />
                <VipTrialBanner />
          <BrowserRouter>
            <AppHeader />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Index />} />
              <Route path="/queue" element={
                <ProtectedRoute>
                  <QueuePage />
                </ProtectedRoute>
              } />
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
