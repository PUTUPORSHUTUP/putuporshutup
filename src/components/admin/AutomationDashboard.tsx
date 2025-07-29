import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getAllGames, getAutomatedGames, getGamesByTrendScore, type GameMatrixData } from '@/services/gameMatrixService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bot, Eye, TrendingUp, Zap, Camera, Video, Monitor } from 'lucide-react';

export const AutomationDashboard: React.FC = () => {
  const [allGames, setAllGames] = useState<GameMatrixData[]>([]);
  const [automatedGames, setAutomatedGames] = useState<GameMatrixData[]>([]);
  const [trendingGames, setTrendingGames] = useState<GameMatrixData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [all, automated, trending] = await Promise.all([
        getAllGames(),
        getAutomatedGames(),
        getGamesByTrendScore()
      ]);
      
      setAllGames(all);
      setAutomatedGames(automated);
      setTrendingGames(trending);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationIcon = (method: string) => {
    switch (method) {
      case 'webcam': return <Camera className="w-4 h-4" />;
      case 'stream': return <Video className="w-4 h-4" />;
      case 'screenshot': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getVerificationColor = (method: string) => {
    switch (method) {
      case 'webcam': return 'bg-blue-500';
      case 'stream': return 'bg-red-500';
      case 'screenshot': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const automationRate = allGames.length > 0 ? (automatedGames.length / allGames.length) * 100 : 0;
  const avgTrendScore = allGames.length > 0 ? allGames.reduce((sum, game) => sum + game.trendScore, 0) / allGames.length : 0;

  // Chart data
  const trendData = trendingGames.map(game => ({
    name: game.game.length > 15 ? game.game.substring(0, 15) + '...' : game.game,
    score: game.trendScore,
    automated: game.automatedScoreDetection
  }));

  const verificationData = allGames.reduce((acc, game) => {
    const method = game.hostVerificationMethod;
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(verificationData).map(([method, count]) => ({
    name: method,
    value: count,
    color: getVerificationColor(method)
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allGames.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automated Games</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automatedGames.length}</div>
            <p className="text-xs text-muted-foreground">
              {automationRate.toFixed(1)}% automation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trend Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgTrendScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Based on popularity metrics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Methods</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(verificationData).length}</div>
            <p className="text-xs text-muted-foreground">
              Different verification types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="automation">Automation Status</TabsTrigger>
          <TabsTrigger value="trending">Trending Games</TabsTrigger>
          <TabsTrigger value="verification">Verification Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Progress</CardTitle>
                <CardDescription>
                  Current automation coverage across all games
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Automated Games</span>
                    <span>{automatedGames.length}/{allGames.length}</span>
                  </div>
                  <Progress value={automationRate} className="h-2" />
                </div>
                <div className="text-sm text-muted-foreground">
                  {automationRate >= 50 ? 'Great progress!' : 'More games need automation'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Game Trend Scores</CardTitle>
                <CardDescription>
                  Popularity ranking of top games
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allGames.map((game) => (
              <Card key={game.id} className={`${game.automatedScoreDetection ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{game.game}</CardTitle>
                    <Badge variant={game.automatedScoreDetection ? "default" : "secondary"}>
                      {game.automatedScoreDetection ? <Bot className="w-3 h-3 mr-1" /> : <Monitor className="w-3 h-3 mr-1" />}
                      {game.automatedScoreDetection ? 'Automated' : 'Manual'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Trend Score:</span>
                    <Badge variant="outline">{game.trendScore}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Verification:</span>
                    <div className="flex items-center gap-1">
                      {getVerificationIcon(game.hostVerificationMethod)}
                      <span className="capitalize">{game.hostVerificationMethod}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>API Access:</span>
                    <Badge variant={game.apiAccess ? "default" : "secondary"}>
                      {game.apiAccess ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Trending Games</CardTitle>
              <CardDescription>
                Games ranked by popularity and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingGames.slice(0, 5).map((game, index) => (
                  <div key={game.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{game.game}</h3>
                        <p className="text-sm text-muted-foreground">
                          {game.platforms.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {game.trendScore}
                      </Badge>
                      {game.automatedScoreDetection && (
                        <Badge className="flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          Auto
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Method Distribution</CardTitle>
                <CardDescription>
                  How games are verified across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verification Details</CardTitle>
                <CardDescription>
                  Breakdown of verification requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(verificationData).map(([method, count]) => (
                  <div key={method} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getVerificationIcon(method)}
                      <div>
                        <span className="font-medium capitalize">{method}</span>
                        <p className="text-sm text-muted-foreground">
                          {method === 'webcam' && 'Real-time face verification'}
                          {method === 'stream' && 'Live stream monitoring'}
                          {method === 'screenshot' && 'Static image proof'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{count} games</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage automation settings and game configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={loadDashboardData}>
            Refresh Data
          </Button>
          <Button variant="outline">
            Export Report
          </Button>
          <Button variant="outline">
            Configure Automation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};