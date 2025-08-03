import { Badge } from '@/components/ui/badge';

type VerificationMethod = 'api' | 'screenshot' | 'manual';

interface MatchOutcomeTagProps {
  method: VerificationMethod;
}

interface OutcomeConfig {
  label: string;
  emoji: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

export const MatchOutcomeTag = ({ method }: MatchOutcomeTagProps) => {
  const outcomeMap: Record<VerificationMethod, OutcomeConfig> = {
    api: {
      label: 'Automated – via API',
      emoji: '🧠',
      variant: 'default'
    },
    screenshot: {
      label: 'Screenshot Required',
      emoji: '📸',
      variant: 'secondary'
    },
    manual: {
      label: 'Manual Review',
      emoji: '👁️',
      variant: 'outline'
    }
  };

  const outcome = outcomeMap[method] || outcomeMap.manual;

  return (
    <Badge variant={outcome.variant} className="text-xs px-2 py-1 font-semibold">
      {outcome.emoji} {outcome.label}
    </Badge>
  );
};