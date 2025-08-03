import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { MobileNavigation } from '@/components/ui/mobile-navigation';
import { useAuth } from '@/hooks/useAuth';

export const AppHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isHomePage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';

  // Don't show header on auth page
  if (isAuthPage) return null;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const currentHour = new Date().getHours();
  const isMatchTime = currentHour >= 8 && currentHour < 22;

  return (
    <>
      {/* Match Hours Banner */}
      <div className="w-full bg-gradient-to-r from-primary/20 to-accent/20 border-b border-primary/30">
        <div className="container px-4 py-2 text-center">
          <p className="text-sm font-medium text-foreground">
            {isMatchTime ? (
              <>🟢 <strong>MATCHES LIVE NOW</strong> • 8 AM - 10 PM EST</>
            ) : (
              <>🔴 <strong>MATCHES CLOSED</strong> • Reopens 8 AM EST • Processing overnight</>
            )}
          </p>
        </div>
      </div>
      
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {!isHomePage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          
          <Link to="/">
            <Button
              variant="ghost"
              size="sm"
              className={isHomePage ? 'text-primary' : ''}
            >
              <Home className="h-4 w-4 mr-1" />
              Home
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <MobileNavigation profile={user} />
        </div>
      </div>
    </header>
    </>
  );
};