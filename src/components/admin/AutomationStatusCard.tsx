import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Shield, 
  Calendar, 
  Bot, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface AutomationStatsProps {
  disputes_resolved: number;
  tournaments_created: number;
  prices_updated: number;
  accounts_flagged: number;
  challenges_created: number;
  total_time_saved_hours: number;
  revenue_optimized: number;
}

export const AutomationStatusCard = ({ stats }: { stats: AutomationStatsProps }) => {
  const automationMetrics = [
    {
      icon: <Shield className="h-5 w-5 text-blue-600" />,
      title: "Disputes Auto-Resolved",
      value: stats.disputes_resolved,
      description: "Resolved via API verification",
      trend: "+40% faster than manual"
    },
    {
      icon: <Calendar className="h-5 w-5 text-green-600" />,
      title: "Tournaments Created",
      value: stats.tournaments_created,
      description: "Automatically scheduled",
      trend: "+60% participation rate"
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      title: "Dynamic Price Updates",
      value: stats.prices_updated,
      description: "Market-responsive pricing",
      trend: `+$${stats.revenue_optimized.toFixed(0)} revenue`
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      title: "Fraud Alerts",
      value: stats.accounts_flagged,
      description: "Suspicious accounts flagged",
      trend: "95% accuracy rate"
    },
    {
      icon: <Bot className="h-5 w-5 text-indigo-600" />,
      title: "Market Challenges",
      value: stats.challenges_created,
      description: "Auto-generated for liquidity",
      trend: "+25% player engagement"
    }
  ];

  const efficiency = Math.min(100, (stats.total_time_saved_hours / 168) * 100); // Weekly efficiency

  return (
    <div className="space-y-6">
      {/* Overall Efficiency */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Automation Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Weekly Automation Score</span>
              <Badge variant="outline">{efficiency.toFixed(0)}%</Badge>
            </div>
            <Progress value={efficiency} className="h-2" />
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total_time_saved_hours}h
                </div>
                <p className="text-xs text-muted-foreground">Time Saved</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${stats.revenue_optimized.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">Revenue Optimized</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {automationMetrics.map((metric, index) => (
          <Card key={index} className="border-l-4 border-l-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {metric.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{metric.title}</h4>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="text-xs text-green-600 font-medium">
                  {metric.trend}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Real-time Automation Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto animate-pulse"></div>
              <p className="text-xs font-medium">Dispute Bot</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="space-y-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto animate-pulse"></div>
              <p className="text-xs font-medium">Tournament AI</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="space-y-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto animate-pulse"></div>
              <p className="text-xs font-medium">Price Engine</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="space-y-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto animate-pulse"></div>
              <p className="text-xs font-medium">Fraud Detector</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="space-y-2">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto animate-pulse"></div>
              <p className="text-xs font-medium">Market Maker</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};