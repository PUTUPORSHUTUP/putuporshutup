import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Clock, 
  Users, 
  Trophy, 
  Play, 
  Settings,
  Activity,
  AlertCircle,
  CheckCircle
} from "lucide-react";

export const TournamentAutomationDashboard = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();

  const runLifecycleManager = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('tournament-lifecycle');
      
      if (error) throw error;

      setLastResult(data);
      
      toast({
        title: "Tournament Lifecycle Updated",
        description: `Processed ${data.results.started_tournaments} tournaments, ${data.results.closed_registration} registrations closed`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runTournamentCreator = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('automation-orchestrator');
      
      if (error) throw error;

      toast({
        title: "Automation Complete",
        description: "Tournament automation cycle completed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tournament Automation Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* The Grand Vision Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Tournament Creation</p>
                    <p className="text-xs text-green-600 dark:text-green-400">✅ Automated</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Registration System</p>
                    <p className="text-xs text-green-600 dark:text-green-400">✅ Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Lifecycle Management</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">🔄 Processing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Lobby Management</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">🎮 Ready</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Manual Controls */}
          <div className="space-y-4">
            <h3 className="font-medium">Manual Controls</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={runTournamentCreator}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Trophy className="h-4 w-4" />
                {isRunning ? "Creating..." : "Create New Tournament"}
              </Button>

              <Button 
                onClick={runLifecycleManager}
                disabled={isRunning}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                {isRunning ? "Processing..." : "Run Lifecycle Check"}
              </Button>
            </div>
          </div>

          {/* Automation Roadmap */}
          <div className="space-y-4">
            <h3 className="font-medium">The Grand Automation Vision</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">✅ <strong>Phase 1:</strong> Automated tournament creation with unique posters</span>
              </div>
              
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">✅ <strong>Phase 2:</strong> Player registration system with payment processing</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">🔄 <strong>Phase 3:</strong> Automated bracket generation and match scheduling</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Play className="h-4 w-4 text-blue-600" />
                <span className="text-sm">🎮 <strong>Phase 4:</strong> Lobby creation and player coordination</span>
              </div>
              
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-gray-600" />
                <span className="text-sm">⏳ <strong>Phase 5:</strong> Result verification and prize distribution</span>
              </div>
            </div>
          </div>

          {/* Last Run Results */}
          {lastResult && (
            <div className="space-y-4">
              <h3 className="font-medium">Last Automation Results</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded">
                  <p className="text-2xl font-bold text-primary">{lastResult.results?.started_tournaments || 0}</p>
                  <p className="text-xs text-muted-foreground">Tournaments Started</p>
                </div>
                
                <div className="text-center p-3 bg-muted rounded">
                  <p className="text-2xl font-bold text-primary">{lastResult.results?.closed_registration || 0}</p>
                  <p className="text-xs text-muted-foreground">Registrations Closed</p>
                </div>
                
                <div className="text-center p-3 bg-muted rounded">
                  <p className="text-2xl font-bold text-primary">{lastResult.results?.created_lobbies || 0}</p>
                  <p className="text-xs text-muted-foreground">Lobbies Created</p>
                </div>
                
                <div className="text-center p-3 bg-muted rounded">
                  <p className="text-2xl font-bold text-primary">{lastResult.results?.errors?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
            </div>
          )}

          {/* How It All Works */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">🌟 How The Magic Works While You Sleep:</h4>
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>• <strong>6 PM:</strong> System creates tournament with unique poster & collectible rarity</p>
              <p>• <strong>6 PM - 5 PM next day:</strong> Players register and pay entry fees</p>
              <p>• <strong>5 PM:</strong> Registration closes, bracket auto-generates</p>
              <p>• <strong>6 PM:</strong> Tournament starts, lobbies created, players notified</p>
              <p>• <strong>6-9 PM:</strong> Matches played, results verified, winners advance</p>
              <p>• <strong>9 PM:</strong> Champions crowned, prizes distributed automatically</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};