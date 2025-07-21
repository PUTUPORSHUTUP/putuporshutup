import { LeaderboardTabs } from '@/components/leaderboards/LeaderboardTabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Leaderboards = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-gaming font-bold">LEADERBOARDS</h1>
            <p className="text-muted-foreground">See where you rank among the gaming elite</p>
          </div>
        </div>

        {/* Leaderboards */}
        <LeaderboardTabs />
      </div>
    </div>
  );
};

export default Leaderboards;