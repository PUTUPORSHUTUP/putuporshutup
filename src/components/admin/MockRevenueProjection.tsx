import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, CreditCard, Trophy, DollarSign } from 'lucide-react';

interface MonthlyData {
  month: string;
  activeUsers: number;
  basicMembers: number;
  premiumMembers: number;
  challengeVolume: number;
  tournamentEntries: number;
  depositVolume: number;
  challengeFees: number;
  membershipRevenue: number;
  tournamentFees: number;
  depositFees: number;
  totalRevenue: number;
}

const MockRevenueProjection = () => {
  const [scenario, setScenario] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');

  // Mock data for different growth scenarios
  const generateMockData = (growthType: 'conservative' | 'moderate' | 'aggressive'): MonthlyData[] => {
    const baseMultipliers = {
      conservative: { users: 1.05, volume: 1.08 },
      moderate: { users: 1.12, volume: 1.15 },
      aggressive: { users: 1.20, volume: 1.25 }
    };

    const multiplier = baseMultipliers[growthType];
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return months.map((month, index) => {
      const growth = Math.pow(multiplier.users, index);
      const volumeGrowth = Math.pow(multiplier.volume, index);
      
      const activeUsers = Math.floor(500 * growth);
      const basicMembers = Math.floor(activeUsers * 0.15); // 15% conversion to basic
      const premiumMembers = Math.floor(activeUsers * 0.08); // 8% conversion to premium
      
      const challengeVolume = Math.floor(25000 * volumeGrowth);
      const tournamentEntries = Math.floor(150 * growth);
      const depositVolume = Math.floor(45000 * volumeGrowth);
      
      // Revenue calculations based on current fee structure
      const challengeFees = Math.floor(challengeVolume * 0.035); // Average 3.5% after membership discounts
      const membershipRevenue = (basicMembers * 9.99) + (premiumMembers * 19.99);
      const tournamentFees = Math.floor(tournamentEntries * 25 * 0.05); // $25 avg entry, 5% fee
      const depositFees = Math.floor(depositVolume * 0.04); // Average 4% deposit fee
      
      const totalRevenue = challengeFees + membershipRevenue + tournamentFees + depositFees;

      return {
        month,
        activeUsers,
        basicMembers,
        premiumMembers,
        challengeVolume,
        tournamentEntries,
        depositVolume,
        challengeFees,
        membershipRevenue,
        tournamentFees,
        depositFees,
        totalRevenue
      };
    });
  };

  const data = generateMockData(scenario);
  const yearlyTotals = data.reduce((acc, month) => ({
    activeUsers: Math.max(acc.activeUsers, month.activeUsers),
    challengeVolume: acc.challengeVolume + month.challengeVolume,
    tournamentEntries: acc.tournamentEntries + month.tournamentEntries,
    depositVolume: acc.depositVolume + month.depositVolume,
    challengeFees: acc.challengeFees + month.challengeFees,
    membershipRevenue: acc.membershipRevenue + month.membershipRevenue,
    tournamentFees: acc.tournamentFees + month.tournamentFees,
    depositFees: acc.depositFees + month.depositFees,
    totalRevenue: acc.totalRevenue + month.totalRevenue
  }), {
    activeUsers: 0,
    challengeVolume: 0,
    tournamentEntries: 0,
    depositVolume: 0,
    challengeFees: 0,
    membershipRevenue: 0,
    tournamentFees: 0,
    depositFees: 0,
    totalRevenue: 0
  });

  const RevenueCard = ({ title, amount, icon: Icon, description }: {
    title: string;
    amount: number;
    icon: React.ElementType;
    description: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${amount.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Projections</h1>
          <p className="text-muted-foreground">Mock data for goal setting and planning</p>
        </div>
        <div className="flex gap-2">
          {(['conservative', 'moderate', 'aggressive'] as const).map((type) => (
            <Badge
              key={type}
              variant={scenario === type ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setScenario(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Yearly Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RevenueCard
          title="Total Annual Revenue"
          amount={yearlyTotals.totalRevenue}
          icon={DollarSign}
          description="All revenue streams combined"
        />
        <RevenueCard
          title="Challenge Fees"
          amount={yearlyTotals.challengeFees}
          icon={TrendingUp}
          description="5% platform fee (with membership discounts)"
        />
        <RevenueCard
          title="Membership Revenue"
          amount={yearlyTotals.membershipRevenue}
          icon={Users}
          description="Basic ($9.99) + Premium ($19.99) monthly"
        />
        <RevenueCard
          title="Transaction Fees"
          amount={yearlyTotals.depositFees + yearlyTotals.tournamentFees}
          icon={CreditCard}
          description="Deposit fees + tournament entry fees"
        />
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Progression</CardTitle>
              <CardDescription>
                {scenario.charAt(0).toUpperCase() + scenario.slice(1)} growth scenario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-right p-2">Users</th>
                      <th className="text-right p-2">Challenge Vol</th>
                      <th className="text-right p-2">Membership</th>
                      <th className="text-right p-2">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((month) => (
                      <tr key={month.month} className="border-b">
                        <td className="p-2 font-medium">{month.month}</td>
                        <td className="text-right p-2">{month.activeUsers.toLocaleString()}</td>
                        <td className="text-right p-2">${month.challengeVolume.toLocaleString()}</td>
                        <td className="text-right p-2">${month.membershipRevenue.toLocaleString()}</td>
                        <td className="text-right p-2 font-bold">${month.totalRevenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Peak Active Users:</span>
                    <span className="font-bold">{yearlyTotals.activeUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Basic Members (Dec):</span>
                    <span className="font-bold">{data[11].basicMembers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Premium Members (Dec):</span>
                    <span className="font-bold">{data[11].premiumMembers.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Gaming Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Challenge Volume:</span>
                    <span className="font-bold">${yearlyTotals.challengeVolume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tournament Entries:</span>
                    <span className="font-bold">{yearlyTotals.tournamentEntries.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Monthly Growth:</span>
                    <span className="font-bold">{scenario === 'conservative' ? '5%' : scenario === 'moderate' ? '12%' : '20%'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenue Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Revenue per User (Dec):</span>
                    <span className="font-bold">${(data[11].totalRevenue / data[11].activeUsers).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Recurring Revenue:</span>
                    <span className="font-bold">${data[11].membershipRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Take Rate:</span>
                    <span className="font-bold">3.5-5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Sources (Annual)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Challenge Platform Fees</span>
                    <div className="text-right">
                      <div className="font-bold">${yearlyTotals.challengeFees.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {((yearlyTotals.challengeFees / yearlyTotals.totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Membership Subscriptions</span>
                    <div className="text-right">
                      <div className="font-bold">${yearlyTotals.membershipRevenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {((yearlyTotals.membershipRevenue / yearlyTotals.totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Deposit Fees</span>
                    <div className="text-right">
                      <div className="font-bold">${yearlyTotals.depositFees.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {((yearlyTotals.depositFees / yearlyTotals.totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tournament Entry Fees</span>
                    <div className="text-right">
                      <div className="font-bold">${yearlyTotals.tournamentFees.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        {((yearlyTotals.tournamentFees / yearlyTotals.totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Scenarios Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(['conservative', 'moderate', 'aggressive'] as const).map((type) => {
                    const scenarioData = generateMockData(type);
                    const total = scenarioData.reduce((sum, month) => sum + month.totalRevenue, 0);
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type}</span>
                        <div className="text-right">
                          <div className="font-bold">${total.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            {type === 'conservative' ? '5% monthly' : type === 'moderate' ? '12% monthly' : '20% monthly'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Fee Structure</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Challenge platform fee: 5% (3.5% avg after discounts)</li>
                <li>• Basic membership: $9.99/month (50% fee reduction)</li>
                <li>• Premium membership: $19.99/month (75% fee reduction)</li>
                <li>• Deposit fees: 2-6% tiered structure</li>
                <li>• Tournament entry fees: 5% platform fee</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Growth Assumptions</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Conservative: 5% user growth, 8% volume growth</li>
                <li>• Moderate: 12% user growth, 15% volume growth</li>
                <li>• Aggressive: 20% user growth, 25% volume growth</li>
                <li>• 15% basic membership conversion rate</li>
                <li>• 8% premium membership conversion rate</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MockRevenueProjection;