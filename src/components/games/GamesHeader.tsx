import { Button } from '@/components/ui/button';
import { Plus, Lightbulb } from 'lucide-react';

interface GamesHeaderProps {
  onCreateChallenge: () => void;
  onSuggestGame: () => void;
}

export const GamesHeader = ({ onCreateChallenge, onSuggestGame }: GamesHeaderProps) => {
  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-gaming text-primary">GAMES & CHALLENGES</h1>
          <p className="text-muted-foreground mt-2">Challenge players and win big</p>
        </div>
        
        {/* Mobile-first action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-last sm:order-none">
          <Button 
            onClick={onCreateChallenge}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            CREATE CHALLENGE
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={onSuggestGame}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Lightbulb className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">SUGGEST GAME</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};