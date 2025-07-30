import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Menu, 
  Home, 
  Gamepad2, 
  Trophy, 
  Users, 
  Crown,
  User,
  LogOut,
  Shield,
  Bell,
  X,
  Megaphone
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface MobileNavigationProps {
  profile?: any;
}

export const MobileNavigation = ({ profile }: MobileNavigationProps) => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  // Simulate notification count - you can replace with real data
  useEffect(() => {
    // This would typically come from your notification system
    setNotifications(3);
  }, []);

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/', color: 'text-blue-500' },
    { icon: Gamepad2, label: 'Games', path: '/games', color: 'text-green-500' },
    { icon: Trophy, label: 'Tournaments', path: '/tournaments', color: 'text-yellow-500' },
    { icon: Users, label: 'Social', path: '/social', color: 'text-purple-500' },
    { icon: Crown, label: 'Leaderboards', path: '/leaderboards', color: 'text-orange-500' },
  ];

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-2">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0 bg-background border-l border-border">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-gaming font-bold">MENU</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Welcome back!</p>
                <p className="text-xs text-muted-foreground">Ready to game?</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="relative">
                  <NotificationCenter />
                  {notifications > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-600"
                    >
                      {notifications}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4">
          {user ? (
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={handleNavClick}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-12 text-left hover:bg-muted/50 transition-colors"
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${item.color}`} />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </Link>
              ))}
              
              <div className="my-4 border-t border-border" />
              
              <Link to="/profile" onClick={handleNavClick}>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-12 text-left hover:bg-muted/50"
                >
                  <User className="w-5 h-5 mr-3 text-gray-500" />
                  <span className="font-medium">Profile</span>
                </Button>
              </Link>

              <Link to="/promotion" onClick={handleNavClick}>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-12 text-left hover:bg-muted/50"
                >
                  <Megaphone className="w-5 h-5 mr-3 text-pink-500" />
                  <span className="font-medium">Promotion Tools</span>
                </Button>
              </Link>

              {profile?.is_admin && (
                <Link to="/admin" onClick={handleNavClick}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-12 text-left hover:bg-muted/50"
                  >
                    <Shield className="w-5 h-5 mr-3 text-red-500" />
                    <span className="font-medium">Admin Dashboard</span>
                  </Button>
                </Link>
              )}

              <div className="my-4 border-t border-border" />

              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 text-left hover:bg-destructive/10 text-destructive"
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
              >
                <LogOut className="w-5 h-5 mr-3" />
                <span className="font-medium">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-6 border border-dashed border-border rounded-lg">
                <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Sign in to access all features
                </p>
                <div className="space-y-2">
                  <Link to="/auth" onClick={handleNavClick}>
                    <Button className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={handleNavClick}>
                    <Button variant="outline" className="w-full">
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="space-y-2">
                <Link to="/" onClick={handleNavClick}>
                  <Button variant="ghost" className="w-full justify-start h-12">
                    <Home className="w-5 h-5 mr-3 text-blue-500" />
                    Home
                  </Button>
                </Link>
                <Link to="/leaderboards" onClick={handleNavClick}>
                  <Button variant="ghost" className="w-full justify-start h-12">
                    <Crown className="w-5 h-5 mr-3 text-orange-500" />
                    Leaderboards
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              GAMING PLATFORM v2.0
            </p>
            <p className="text-xs text-muted-foreground">
              The ultimate wagering experience
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};