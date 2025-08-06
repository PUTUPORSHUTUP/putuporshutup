import { useNavigate } from 'react-router-dom';
import { PremiumSubscription } from '@/components/profile/PremiumSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock, ArrowLeft } from 'lucide-react';

const VIPRequired = () => {
  const navigate = useNavigate();

  const handleSubscriptionUpdate = () => {
    // Redirect to VIP page after successful subscription
    navigate('/vip');
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>

        {/* VIP Required Header */}
        <Card className="bg-gradient-to-r from-destructive/10 to-warning/10 border-destructive/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-bold text-destructive">
              VIP Access Required
            </CardTitle>
            <p className="text-muted-foreground">
              This content is exclusive to VIP members. Start your free trial to access premium features.
            </p>
          </CardHeader>
        </Card>

        {/* VIP Benefits Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              What You're Missing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Access to $10+ high-stakes matches
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Priority matchmaking queue
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Exclusive VIP tournaments
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                VIP badge and recognition
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Early access to new features
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Premium Subscription Component */}
        <PremiumSubscription onSubscriptionUpdate={handleSubscriptionUpdate} />
      </div>
    </div>
  );
};

export default VIPRequired;