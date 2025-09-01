import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, DollarSign } from 'lucide-react';

export const CODPayoutInfo = () => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          COD Payout Structures
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team-Based Modes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-lg">Team Modes (4v4)</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Search & Destroy</span>
                  <Badge variant="outline" className="border-blue-500/50">Winner Take All</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Winning team gets 90% of pot (10% platform fee)</p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Domination</span>
                  <Badge variant="outline" className="border-blue-500/50">Winner Take All</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Winning team gets 90% of pot (10% platform fee)</p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Hardpoint</span>
                  <Badge variant="outline" className="border-blue-500/50">Winner Take All</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Winning team gets 90% of pot (10% platform fee)</p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Team Deathmatch</span>
                  <Badge variant="outline" className="border-blue-500/50">Winner Take All</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Winning team gets 90% of pot (10% platform fee)</p>
              </div>
            </div>
          </div>

          {/* Individual Modes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-lg">Individual Modes</h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Free for All</span>
                  <Badge variant="outline" className="border-amber-500/50">Top 3 Split</Badge>
                </div>
                <div className="text-sm space-y-1">
                  <p>🥇 1st Place: 50% of pot</p>
                  <p>🥈 2nd Place: 30% of pot</p>
                  <p>🥉 3rd Place: 20% of pot</p>
                </div>
              </div>
              
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Gun Game</span>
                  <Badge variant="outline" className="border-amber-500/50">Top 3 Split</Badge>
                </div>
                <div className="text-sm space-y-1">
                  <p>🥇 1st Place: 60% of pot</p>
                  <p>🥈 2nd Place: 30% of pot</p>
                  <p>🥉 3rd Place: 10% of pot</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Example Calculations */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Payout Examples
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-medium">$10 Gold VIP (8 players)</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Total Pot: $80</p>
                <p>Platform Fee: $8 (10%)</p>
                <p>Prize Pool: $72</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">Team Mode Payout</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Winning Team: $72</p>
                <p>($18 per player)</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">FFA Mode Payout</p>
              <div className="space-y-1 text-muted-foreground">
                <p>1st: $36 (50%)</p>
                <p>2nd: $21.60 (30%)</p>
                <p>3rd: $14.40 (20%)</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};