import { Crown, Star, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVIP } from '@/hooks/useVIP';
import { Skeleton } from '@/components/ui/skeleton';

interface VIPStatusCardProps {
  showTrialButton?: boolean;
  compact?: boolean;
}

export const VIPStatusCard = ({ showTrialButton = true, compact = false }: VIPStatusCardProps) => {
  const { vipStatus, isLoading, startVIPTrial } = useVIP();

  if (isLoading) {
    return (
      <Card className={compact ? "p-4" : ""}>
        <CardContent className={compact ? "p-0" : ""}>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vipStatus) {
    return (
      <Card className={compact ? "p-4" : ""}>
        <CardContent className={compact ? "p-0" : ""}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-muted rounded-lg">
                <Crown className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Regular Member</p>
                <p className="text-sm text-muted-foreground">Upgrade to unlock VIP features</p>
              </div>
            </div>
            {showTrialButton && (
              <Button variant="outline" size="sm" onClick={startVIPTrial}>
                Start Free Trial
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getVIPBadge = () => {
    if (vipStatus.is_premium) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Premium VIP
        </Badge>
      );
    }
    
    if (vipStatus.is_vip_trial) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Star className="h-3 w-3 mr-1" />
          VIP Trial
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        Regular
      </Badge>
    );
  };

  const getStatusIcon = () => {
    if (vipStatus.is_premium) {
      return <Crown className="h-5 w-5 text-yellow-500" />;
    }
    
    if (vipStatus.is_vip_trial) {
      return <Star className="h-5 w-5 text-blue-500" />;
    }

    return <Crown className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (vipStatus.is_premium) {
      return {
        title: "Premium VIP Member",
        description: "Unlimited access to all features"
      };
    }
    
    if (vipStatus.is_vip_trial && vipStatus.trial_days_remaining !== null) {
      return {
        title: "VIP Trial Active",
        description: `${vipStatus.trial_days_remaining} days remaining`
      };
    }

    return {
      title: "Regular Member",
      description: "Limited access to features"
    };
  };

  const statusInfo = getStatusText();

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getStatusIcon()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-medium">{statusInfo.title}</p>
                {getVIPBadge()}
              </div>
              <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
            </div>
          </div>
          {vipStatus.is_vip_trial && vipStatus.trial_days_remaining !== null && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {vipStatus.trial_days_remaining}d
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>VIP Status</span>
          </span>
          {getVIPBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium">{statusInfo.title}</h3>
          <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
        </div>

        {vipStatus.is_vip_trial && vipStatus.trial_days_remaining !== null && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Trial ends in {vipStatus.trial_days_remaining} days</span>
            </div>
            {vipStatus.trial_days_remaining <= 2 && (
              <Button size="sm" variant="default">
                Upgrade Now
              </Button>
            )}
          </div>
        )}

        {!vipStatus.is_vip && !vipStatus.is_premium && showTrialButton && (
          <Button className="w-full" onClick={startVIPTrial}>
            <Star className="h-4 w-4 mr-2" />
            Start 7-Day Free Trial
          </Button>
        )}
      </CardContent>
    </Card>
  );
};