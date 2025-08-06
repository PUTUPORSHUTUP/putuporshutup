import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface WalletBalanceCardProps {
  balance: number;
}

export const WalletBalanceCard = ({ balance }: WalletBalanceCardProps) => {
  return (
    <Card className="sm:max-w-sm">
      <CardContent className="p-3 sm:p-4 flex items-center gap-3">
        <div className="p-2 bg-green-500/10 rounded-full">
          <DollarSign className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Wallet Balance</p>
          <p className="text-lg font-bold">${balance.toFixed(2)}</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = '/profile'}
        >
          Add Funds
        </Button>
      </CardContent>
    </Card>
  );
};