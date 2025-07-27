import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Gamepad2, Users, Link, Target, Trophy, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface RulesOfEngagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RulesOfEngagementModal = ({ open, onOpenChange }: RulesOfEngagementModalProps) => {
  const challengeTypes = [
    {
      id: '1v1',
      title: '1v1 Direct Competition',
      icon: <Gamepad2 className="w-6 h-6" />,
      color: 'text-blue-600',
      howToWin: 'Beat your opponent in a head-to-head match',
      howToLose: 'Get defeated by your opponent or forfeit',
      waysToChallenge: [
        'Create a new 1v1 challenge and set stakes',
        'Accept an existing 1v1 challenge',
        'Send direct challenge to specific player'
      ],
      details: [
        'Winner takes the entire pot (minus platform fee)',
        'Loser forfeits their stake',
        'Both players must have equal stakes',
        'Results verified through mutual confirmation or proof submission',
        'If loser refuses to confirm, winner provides proof and wins automatically'
      ]
    },
    {
      id: '1v1_lobby',
      title: '1v1 Lobby Challenges',
      icon: <Link className="w-6 h-6" />,
      color: 'text-green-600',
      howToWin: 'Outperform your opponent on specific stats in the same lobby',
      howToLose: 'Opponent achieves better stats or you fail to meet criteria',
      waysToChallenge: [
        'Create lobby challenge with specific stat criteria',
        'Both players join the same game lobby/match',
        'Challenge can be same team or opposite teams',
        'Auto-verify through lobby stats at match end'
      ],
      details: [
        'Players compete on individual stats (kills, deaths, score, etc.)',
        'Can be on same team or opposite teams',
        'Lobby ID must match for both players',
        'Results verified through mutual confirmation or proof submission',
        'Stats automatically tracked when possible for verification'
      ]
    },
    {
      id: 'team_vs_team',
      title: 'Team vs Team',
      icon: <Users className="w-6 h-6" />,
      color: 'text-purple-600',
      howToWin: 'Your team defeats the opposing team',
      howToLose: 'Opposing team wins or your team forfeits',
      waysToChallenge: [
        'Create team challenge and recruit teammates',
        'Join existing team looking for members',
        'Challenge another complete team',
        'Auto-match with similar skill teams'
      ],
      details: [
        'Each team member contributes equal stake',
        'Winning team splits the pot equally',
        'Team captain manages the challenge',
        'Results verified through mutual confirmation or proof submission',
        'All team members must confirm participation'
      ]
    },
    {
      id: 'lobby_competition',
      title: 'Lobby Competition',
      icon: <Trophy className="w-6 h-6" />,
      color: 'text-orange-600',
      howToWin: 'Achieve the best performance among all participants',
      howToLose: 'Other players outperform you in the lobby',
      waysToChallenge: [
        'Join open lobby competitions',
        'Create lobby with specific criteria',
        'Invite friends to compete in same match',
        'Enter ongoing tournaments'
      ],
      details: [
        'All participants join the same lobby/match',
        'Individual performance determines ranking',
        'Top performer(s) win based on criteria',
        'Results verified through mutual confirmation or proof submission',
        'Pot distributed based on performance ranking'
      ]
    },
    {
      id: 'stat_based',
      title: 'Stat Challenge',
      icon: <Target className="w-6 h-6" />,
      color: 'text-red-600',
      howToWin: 'Achieve better stats than your opponents',
      howToLose: 'Opponents outperform you on the target statistics',
      waysToChallenge: [
        'Challenge others to beat your record',
        'Join stat-based competitions',
        'Create specific stat competitions',
        'Compete on custom performance metrics'
      ],
      details: [
        'Compete against other players on specific stats',
        'Custom criteria: kills, score, damage, accuracy, etc.',
        'All participants compete for the same stat goals',
        'Results verified through mutual confirmation or proof submission',
        'Winner determined by best performance on target metrics'
      ]
    }
  ];

  const universalRules = [
    {
      title: 'Result Verification Process',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      rules: [
        'Stage 1: Both players confirm results (Winner clicks "I Won", Loser clicks "I Lost")',
        'If both confirm: Pot automatically transfers to winner',
        'Stage 2: If loser refuses to confirm, winner submits proof (screenshot/video)',
        'Winner automatically receives pot when proof is submitted',
        'Disputes reviewed by moderators only if proof is clearly invalid'
      ]
    },
    {
      title: 'Stakes & Payments',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      rules: [
        'Minimum stake: $1.00',
        'All participants must contribute equal amounts',
        'Stakes held in escrow until match completion',
        'No refunds once match begins'
      ]
    },
    {
      title: 'Penalties & Fair Play',
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      rules: [
        'No-show after 15 minutes = automatic forfeit',
        'Refusing to confirm obvious loss = stake forfeiture',
        'Submitting false proof = account suspension',
        'Platform fee applies to all completed challenges'
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-gaming text-2xl text-center">
            RULES OF ENGAGEMENT
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[80vh] pr-4">
          <div className="space-y-8">
            {/* Challenge Types */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-center">Challenge Types</h3>
              
              {challengeTypes.map((type, index) => (
                <Card key={type.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={type.color}>
                        {type.icon}
                      </div>
                      <CardTitle className="text-lg">{type.title}</CardTitle>
                      <Badge variant="outline">{index === 1 ? 'NEW' : 'Popular'}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* How to Win/Lose */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">How to Win:</h4>
                        <p className="text-sm text-muted-foreground">{type.howToWin}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">How to Lose:</h4>
                        <p className="text-sm text-muted-foreground">{type.howToLose}</p>
                      </div>
                    </div>
                    
                    {/* Ways to Challenge */}
                    <div>
                      <h4 className="font-semibold mb-2">Ways to Challenge:</h4>
                      <ul className="space-y-1">
                        {type.waysToChallenge.map((way, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {way}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Details */}
                    <div>
                      <h4 className="font-semibold mb-2">Key Details:</h4>
                      <ul className="space-y-1">
                        {type.details.map((detail, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Separator />
            
            {/* Universal Rules */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-center">Universal Rules</h3>
              
              <div className="grid md:grid-cols-3 gap-6">
                {universalRules.map((section) => (
                  <Card key={section.title}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {section.icon}
                        <CardTitle className="text-base">{section.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {section.rules.map((rule, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary text-xs">▸</span>
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Remember: This is skill-based competition, not gambling. May the best player win! 🏆
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};