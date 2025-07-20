import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Mail } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "",
    username: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement Supabase auth login
    console.log("Login:", loginForm);
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    setIsLoading(true);
    // TODO: Implement Supabase auth signup
    console.log("Signup:", signupForm);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background-dark border-neon-orange/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-gaming text-center text-neon-orange">
            JOIN THE ARENA
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-background-darker">
            <TabsTrigger value="login" className="text-neon-blue data-[state=active]:bg-neon-blue/20">
              LOG IN
            </TabsTrigger>
            <TabsTrigger value="signup" className="text-neon-green data-[state=active]:bg-neon-green/20">
              SIGN UP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground-light flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  EMAIL
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-background-darker border-neon-blue/30 focus:border-neon-blue"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground-light flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  PASSWORD
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-background-darker border-neon-blue/30 focus:border-neon-blue"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-neon-blue hover:shadow-glow-blue"
                disabled={isLoading}
              >
                {isLoading ? "LOGGING IN..." : "LOG IN"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username" className="text-foreground-light flex items-center gap-2">
                  <User className="w-4 h-4" />
                  USERNAME
                </Label>
                <Input
                  id="signup-username"
                  type="text"
                  value={signupForm.username}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                  className="bg-background-darker border-neon-green/30 focus:border-neon-green"
                  placeholder="gamer_tag"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-foreground-light flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  EMAIL
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-background-darker border-neon-green/30 focus:border-neon-green"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-foreground-light flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  PASSWORD
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-background-darker border-neon-green/30 focus:border-neon-green"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground-light flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  CONFIRM PASSWORD
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="bg-background-darker border-neon-green/30 focus:border-neon-green"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-neon-green hover:shadow-glow-green"
                disabled={isLoading}
              >
                {isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}