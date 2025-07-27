import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Clock, DollarSign, Eye, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SecureCustomChallengeConfigProps {
  onConfigChange: (config: CustomChallengeConfig) => void;
  initialConfig?: Partial<CustomChallengeConfig>;
}

interface CustomChallengeConfig {
  challengeType: string;
  stakeAmount: number;
  timeLimit: number;
  verificationMethod: 'screenshot' | 'manual' | 'auto';
  maxParticipants: number;
  platformFeeProtection: boolean;
  escrowRequired: boolean;
  antiCheatMeasures: string[];
}

export const SecureCustomChallengeConfig = ({ onConfigChange, initialConfig = {} }: SecureCustomChallengeConfigProps) => {
  const [config, setConfig] = useState<CustomChallengeConfig>({
    challengeType: initialConfig.challengeType || '1v1',
    stakeAmount: initialConfig.stakeAmount || 10,
    timeLimit: initialConfig.timeLimit || 30,
    verificationMethod: initialConfig.verificationMethod || 'screenshot',
    maxParticipants: initialConfig.maxParticipants || 2,
    platformFeeProtection: initialConfig.platformFeeProtection ?? true,
    escrowRequired: initialConfig.escrowRequired ?? true,
    antiCheatMeasures: initialConfig.antiCheatMeasures || ['verification_required', 'time_limit_enforced']
  });

  // Security constraints - these cannot be disabled
  const SECURITY_CONSTRAINTS = {
    minStake: 1,
    maxStake: 500, // Prevents massive fraud attempts
    minTimeLimit: 5, // Prevents instant scams
    maxTimeLimit: 120, // Prevents indefinite challenges
    maxParticipants: 10, // Prevents mass exploitation
    requiredAntiCheat: ['verification_required', 'time_limit_enforced'],
    forcedProtections: {
      platformFeeProtection: true, // Always on - protects platform revenue
      escrowRequired: true, // Always on - prevents direct theft
      moderatorReview: true // Always on for custom challenges
    }
  };

  const updateConfig = (updates: Partial<CustomChallengeConfig>) => {
    const newConfig = { ...config, ...updates };
    
    // Apply security constraints
    newConfig.stakeAmount = Math.max(SECURITY_CONSTRAINTS.minStake, 
      Math.min(SECURITY_CONSTRAINTS.maxStake, newConfig.stakeAmount));
    
    newConfig.timeLimit = Math.max(SECURITY_CONSTRAINTS.minTimeLimit,
      Math.min(SECURITY_CONSTRAINTS.maxTimeLimit, newConfig.timeLimit));
    
    newConfig.maxParticipants = Math.max(1,
      Math.min(SECURITY_CONSTRAINTS.maxParticipants, newConfig.maxParticipants));
    
    // Force security protections
    newConfig.platformFeeProtection = SECURITY_CONSTRAINTS.forcedProtections.platformFeeProtection;
    newConfig.escrowRequired = SECURITY_CONSTRAINTS.forcedProtections.escrowRequired;
    
    // Ensure required anti-cheat measures
    const requiredMeasures = SECURITY_CONSTRAINTS.requiredAntiCheat;
    const missingMeasures = requiredMeasures.filter(measure => !newConfig.antiCheatMeasures.includes(measure));
    newConfig.antiCheatMeasures = [...newConfig.antiCheatMeasures, ...missingMeasures];

    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const validateConfig = () => {
    const issues = [];
    
    if (config.stakeAmount < SECURITY_CONSTRAINTS.minStake || config.stakeAmount > SECURITY_CONSTRAINTS.maxStake) {
      issues.push(`Stake must be between $${SECURITY_CONSTRAINTS.minStake}-$${SECURITY_CONSTRAINTS.maxStake}`);
    }
    
    if (config.timeLimit < SECURITY_CONSTRAINTS.minTimeLimit || config.timeLimit > SECURITY_CONSTRAINTS.maxTimeLimit) {
      issues.push(`Time limit must be between ${SECURITY_CONSTRAINTS.minTimeLimit}-${SECURITY_CONSTRAINTS.maxTimeLimit} minutes`);
    }

    if (issues.length > 0) {
      toast({
        title: "Configuration Issues",
        description: issues.join(', '),
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg text-amber-800">Custom Challenge - Security Protected</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Custom challenges include mandatory security protections to prevent fraud and ensure fair play. 
              Some settings are locked for platform security.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Challenge Type */}
            <div className="space-y-2">
              <Label>Challenge Type</Label>
              <Select value={config.challengeType} onValueChange={(value) => updateConfig({ challengeType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1v1">1 vs 1 Match</SelectItem>
                  <SelectItem value="team_vs_team">Team vs Team</SelectItem>
                  <SelectItem value="stat_based">Stat Challenge</SelectItem>
                  <SelectItem value="lobby_competition">Lobby Competition</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stake Amount */}
            <div className="space-y-2">
              <Label>Stake Amount ($)</Label>
              <Input
                type="number"
                value={config.stakeAmount}
                onChange={(e) => updateConfig({ stakeAmount: Number(e.target.value) })}
                min={SECURITY_CONSTRAINTS.minStake}
                max={SECURITY_CONSTRAINTS.maxStake}
              />
              <p className="text-xs text-muted-foreground">
                Range: ${SECURITY_CONSTRAINTS.minStake} - ${SECURITY_CONSTRAINTS.maxStake} (fraud prevention)
              </p>
            </div>

            {/* Time Limit */}
            <div className="space-y-2">
              <Label>Time Limit (minutes)</Label>
              <Input
                type="number"
                value={config.timeLimit}
                onChange={(e) => updateConfig({ timeLimit: Number(e.target.value) })}
                min={SECURITY_CONSTRAINTS.minTimeLimit}
                max={SECURITY_CONSTRAINTS.maxTimeLimit}
              />
              <p className="text-xs text-muted-foreground">
                Range: {SECURITY_CONSTRAINTS.minTimeLimit} - {SECURITY_CONSTRAINTS.maxTimeLimit} minutes (prevents exploitation)
              </p>
            </div>

            {/* Max Participants */}
            <div className="space-y-2">
              <Label>Max Participants</Label>
              <Input
                type="number"
                value={config.maxParticipants}
                onChange={(e) => updateConfig({ maxParticipants: Number(e.target.value) })}
                min={1}
                max={SECURITY_CONSTRAINTS.maxParticipants}
              />
              <p className="text-xs text-muted-foreground">
                Max: {SECURITY_CONSTRAINTS.maxParticipants} players (security limit)
              </p>
            </div>

            {/* Verification Method */}
            <div className="space-y-2">
              <Label>Verification Method</Label>
              <Select value={config.verificationMethod} onValueChange={(value: any) => updateConfig({ verificationMethod: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screenshot">Screenshot Required</SelectItem>
                  <SelectItem value="manual">Manual Review</SelectItem>
                  <SelectItem value="auto">Auto Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Security Protections (Locked) */}
          <div className="mt-6 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Mandatory Security Protections
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox checked={true} disabled />
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  <Label className="text-sm text-muted-foreground">Platform Fee Protection</Label>
                  <Badge variant="secondary" className="text-xs">LOCKED</Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox checked={true} disabled />
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <Label className="text-sm text-muted-foreground">Escrow Required</Label>
                  <Badge variant="secondary" className="text-xs">LOCKED</Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox checked={true} disabled />
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  <Label className="text-sm text-muted-foreground">Moderator Review</Label>
                  <Badge variant="secondary" className="text-xs">LOCKED</Badge>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox checked={true} disabled />
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <Label className="text-sm text-muted-foreground">Time Limit Enforced</Label>
                  <Badge variant="secondary" className="text-xs">LOCKED</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Security Summary</p>
                <p className="text-xs text-green-700 mt-1">
                  All funds are held in escrow, platform fees are protected, and all custom challenges 
                  require moderator approval before going live. Time limits prevent indefinite disputes.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={validateConfig} 
            className="w-full mt-4"
            variant="outline"
          >
            Validate Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};