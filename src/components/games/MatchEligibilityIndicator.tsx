import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { calculateMatchEligibility, type MatchEligibility } from '@/lib/walletValidation';

interface MatchEligibilityIndicatorProps {
  entryFee: number;
  balance: number;
  className?: string;
}

export const MatchEligibilityIndicator = ({ 
  entryFee, 
  balance, 
  className = "" 
}: MatchEligibilityIndicatorProps) => {
  const eligibility = calculateMatchEligibility(balance);
  const canAfford = balance >= entryFee;
  
  if (canAfford) {
    return (
      <Badge variant="default" className={`bg-green-500/10 text-green-700 dark:text-green-400 ${className}`}>
        <DollarSign className="w-3 h-3 mr-1" />
        Eligible
      </Badge>
    );
  }
  
  const shortfall = entryFee - balance;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:text-red-400">
        <Lock className="w-3 h-3 mr-1" />
        Need ${shortfall.toFixed(2)} more
      </Badge>
      <Button asChild size="sm" variant="outline">
        <Link to="/wallet">Top Up</Link>
      </Button>
    </div>
  );
};