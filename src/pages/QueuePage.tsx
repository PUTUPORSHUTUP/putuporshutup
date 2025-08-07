import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import JoinConfirmationModal from '@/components/JoinConfirmationModal';

export default function QueuePage() {
  const [showModal, setShowModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleJoin = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to join the queue.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);

    try {
      // Insert into match_queue table with required fields
      const { data, error } = await supabase
        .from('match_queue')
        .insert([{
          user_id: user.id,
          stake_amount: 10.00, // Default stake amount
          game_id: '00000000-0000-0000-0000-000000000000', // You'll need to get this from a game selector
          platform: 'Xbox', // Default platform
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
        }]);

      if (!error) {
        setShowModal(true);
        toast({
          title: "Success!",
          description: "You've joined the match queue.",
        });
      } else {
        throw error;
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      toast({
        title: "Error",
        description: "Failed to join the queue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Quick Match</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Join the match queue to find opponents and start competing!
          </p>
          
          <Button
            onClick={handleJoin}
            disabled={isJoining || !user}
            className="w-full"
            size="lg"
          >
            {isJoining ? "Joining..." : "Join Match Queue"}
          </Button>

          {!user && (
            <p className="text-center text-sm text-muted-foreground">
              Please log in to join matches
            </p>
          )}
        </CardContent>
      </Card>

      <JoinConfirmationModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}