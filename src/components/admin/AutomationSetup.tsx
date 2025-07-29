import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, 
  Shield, 
  Calendar, 
  TrendingUp, 
  Zap,
  CheckCircle,
  AlertTriangle,
  Play,
  Settings
} from 'lucide-react';

export const AutomationSetup = () => {
  const [setting, setSetting] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const { toast } = useToast();

  const automationFeatures = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Auto Dispute Resolution",
      description: "Automatically resolve disputes using game API verification",
      benefits: ["70% faster resolution", "24/7 availability", "Reduces manual workload"],
      frequency: "Every 15 minutes"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Tournament Scheduler",
      description: "Create and manage tournaments automatically",
      benefits: ["Consistent tournament schedule", "Auto prize distribution", "Player engagement"],
      frequency: "Hourly"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Dynamic Pricing",
      description: "Adjust prices based on demand and supply",
      benefits: ["Optimized revenue", "Market responsiveness", "Player satisfaction"],
      frequency: "Every 30 minutes"
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: "Fraud Detection",
      description: "Monitor and flag suspicious player behavior",
      benefits: ["Platform security", "Fair play enforcement", "Risk mitigation"],
      frequency: "Hourly"
    },
    {
      icon: <Bot className="h-6 w-6" />,
      title: "Market Making",
      description: "Create challenges to maintain game liquidity",
      benefits: ["Active marketplace", "Player retention", "Revenue generation"],
      frequency: "Every 45 minutes"
    }
  ];

  const setupAutomations = async () => {
    setSetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-automations');
      
      if (error) throw error;

      toast({
        title: "Automation Setup Complete! 🚀",
        description: `Configured ${data.automations_configured} automation systems`,
      });

    } catch (error) {
      console.error('Error setting up automations:', error);
      toast({
        title: "Setup Error",
        description: "Failed to configure automation systems",
        variant: "destructive"
      });
    } finally {
      setSetting(false);
    }
  };

  const runAutomationTest = async () => {
    setRunningTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('automation-orchestrator');
      
      if (error) throw error;

      toast({
        title: "Test Completed! ✅",
        description: `Ran ${data.automationsRun} automations in ${data.totalProcessingTime}ms`,
      });

    } catch (error) {
      console.error('Error running automation test:', error);
      toast({
        title: "Test Error",
        description: "Failed to run automation test",
        variant: "destructive"
      });
    } finally {
      setRunningTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold">Automation Hub</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transform your gaming platform with intelligent automation. Reduce manual work, 
          increase efficiency, and provide 24/7 automated services to your players.
        </p>
      </div>

      {/* Benefits Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">90% Faster</h3>
            <p className="text-sm text-muted-foreground">
              Automated dispute resolution and game management
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Revenue Optimized</h3>
            <p className="text-sm text-muted-foreground">
              Dynamic pricing and automated market making
            </p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Fraud Protection</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered detection and automated responses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Features */}
      <div className="grid gap-6 md:grid-cols-2">
        {automationFeatures.map((feature, index) => (
          <Card key={index} className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {feature.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {feature.frequency}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{feature.description}</p>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Key Benefits:</h4>
                <ul className="space-y-1">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button 
          onClick={setupAutomations}
          disabled={setting}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {setting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Setting Up...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Setup All Automations
            </div>
          )}
        </Button>

        <Button 
          onClick={runAutomationTest}
          disabled={runningTest}
          variant="outline"
          size="lg"
        >
          {runningTest ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Testing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Test Automations
            </div>
          )}
        </Button>
      </div>

      {/* Revenue Impact */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-center">Expected Revenue Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">+40%</div>
              <p className="text-sm text-muted-foreground">Faster dispute resolution</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">+25%</div>
              <p className="text-sm text-muted-foreground">Optimized pricing revenue</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">+60%</div>
              <p className="text-sm text-muted-foreground">Tournament participation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};