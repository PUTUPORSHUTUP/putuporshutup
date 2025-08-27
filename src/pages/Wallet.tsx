import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { StreamlinedWallet } from '@/components/StreamlinedWallet';

const Wallet = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              ⚠️ You must be logged in to access your wallet.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Gaming Wallet</h1>
          <p className="text-muted-foreground">
            Effortless deposits, instant withdrawals, automated payouts
          </p>
        </div>
        
        <StreamlinedWallet />
      </div>
    </div>
  );
};

export default Wallet;