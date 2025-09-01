import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DemoJoinButton from '@/components/DemoJoinButton';
import { QuickMatch } from '@/components/games/QuickMatch';

export default function QueuePage() {
  const navigate = useNavigate();

  const handleMatchFound = (wagerId: string) => {
    // Navigate to the wager/match details when a match is found
    navigate(`/games?wager=${wagerId}`);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold">🎮 Match Queue</CardTitle>
          <p className="text-muted-foreground">
            Find opponents and join competitive matches. Set your stake and get matched with players of similar skill.
          </p>
          <div className="mt-4">
            <DemoJoinButton />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <QuickMatch onMatchFound={handleMatchFound} />
          
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
            >
              Back Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}