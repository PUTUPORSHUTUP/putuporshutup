import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getActiveDemoMatch, joinDemoMatch } from '@/lib/demo';
import { useToast } from '@/hooks/use-toast';

export default function DemoJoinButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [demoId, setDemoId] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);

  useEffect(() => {
    const loadDemoMatch = async () => {
      try {
        const match = await getActiveDemoMatch();
        setDemoId(match?.id ?? null);
        setStartsAt(match?.starts_at ?? null);
      } catch (error) {
        console.error('Failed to load demo match:', error);
      }
    };
    loadDemoMatch();
  }, []);

  const handleJoin = async () => {
    if (!user) {
      navigate('/auth?next=/');
      return;
    }
    if (!demoId) {
      toast({
        title: "No Demo Match Available",
        description: "No free demo match is open right now. Try again in a minute.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      const result = await joinDemoMatch(demoId, user.id);
      if (result.already) {
        toast({
          title: "Already Joined!",
          description: "You're already in the upcoming free match. Watch for the lobby invite!",
        });
      } else {
        toast({
          title: "Joined Successfully!",
          description: "You're in the free match! Watch for the lobby invite at start time.",
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Join Failed",
        description: `Could not join demo match: ${error?.message ?? error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card/50 rounded-2xl p-4 border border-border">
      <div className="text-lg font-semibold mb-1 text-foreground">🎮 Free Demo Match</div>
      <div className="text-sm text-muted-foreground mb-3">
        Run every ~30 minutes. Try the platform with <strong>no wallet required</strong>.
        {startsAt && (
          <div className="mt-1">
            Next start: {new Date(startsAt).toLocaleTimeString()}
          </div>
        )}
      </div>
      <button
        onClick={handleJoin}
        disabled={loading || !demoId}
        className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white transition-colors"
      >
        {loading ? 'Joining…' : 'Join Free Match'}
      </button>
    </div>
  );
}