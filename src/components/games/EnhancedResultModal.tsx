import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Medal, Target, X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Challenge {
  id: string;
  title: string;
  game_id: string;
  total_pot: number;
  status: string;
}

interface EnhancedResultModalProps {
  challenge: Challenge;
  onResultSubmitted: () => void;
  resultOptions?: string[];
  gameData?: {
    result_options: string[];
    allowed_proof_types: string[];
  };
}

export const EnhancedResultModal = ({ 
  challenge, 
  onResultSubmitted, 
  resultOptions = ["1st Place", "2nd Place", "3rd Place", "Lost"],
  gameData 
}: EnhancedResultModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [proofText, setProofText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Use game data result options if available, otherwise fall back to props
  const availableResults = gameData?.result_options || resultOptions;

  const getResultIcon = (result: string) => {
    if (result.includes('1st') || result.toLowerCase().includes('won')) {
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    } else if (result.includes('2nd') || result.includes('3rd')) {
      return <Medal className="w-5 h-5 text-gray-500" />;
    } else {
      return <X className="w-5 h-5 text-red-500" />;
    }
  };

  const getResultColor = (result: string) => {
    if (result.includes('1st') || result.toLowerCase().includes('won')) {
      return 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100';
    } else if (result.includes('2nd')) {
      return 'border-gray-300 bg-gray-50 hover:bg-gray-100';
    } else if (result.includes('3rd')) {
      return 'border-orange-300 bg-orange-50 hover:bg-orange-100';
    } else {
      return 'border-red-300 bg-red-50 hover:bg-red-100';
    }
  };

  const handleSubmitResult = async () => {
    if (!selectedResult || !user) {
      toast({
        title: "Missing Information",
        description: "Please select your result and add proof details",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, report the challenge result
      const { error: resultError } = await supabase.functions.invoke('report-match-result', {
        body: {
          challenge_id: challenge.id,
          result: selectedResult,
          proof_text: proofText
        }
      });

      if (resultError) throw resultError;

      // Silent stat logging - log this result without notifications
      const { error: statsError } = await supabase
        .from('player_stats')
        .insert({
          user_id: user.id,
          game_name: challenge.title,
          platform: 'Multiple', // Could be enhanced to track actual platform
          challenge_id: challenge.id,
          stats_data: {
            result: selectedResult,
            proof_provided: proofText.length > 0,
            timestamp: new Date().toISOString()
          }
        });

      if (statsError) {
        console.error('Stats logging error (non-critical):', statsError);
      }

      toast({
        title: "Result Submitted!",
        description: `Your ${selectedResult} result has been recorded`,
      });

      setOpen(false);
      setSelectedResult('');
      setProofText('');
      onResultSubmitted();

    } catch (error: any) {
      console.error('Error submitting result:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit result. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-green-600 hover:bg-green-700 text-white">
          <Trophy className="w-4 h-4 mr-2" />
          Submit My Result
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Submit Your Result
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{challenge.title}</CardTitle>
              <div className="text-sm text-muted-foreground">
                Total Pot: ${challenge.total_pot}
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-3">
            <h3 className="font-medium text-sm">How did you place?</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {availableResults.map((result) => (
                <Card 
                  key={result}
                  className={`cursor-pointer transition-all ${
                    selectedResult === result 
                      ? `ring-2 ring-primary ${getResultColor(result)}` 
                      : `hover:scale-105 ${getResultColor(result)}`
                  }`}
                  onClick={() => setSelectedResult(result)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      {getResultIcon(result)}
                      <span className="font-medium text-sm">{result}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Proof/Additional Details</label>
            <Textarea
              placeholder="Provide details about your match result, screenshots taken, or any additional context..."
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Include screenshots, video timestamps, or match details to support your result
            </p>
          </div>

          {gameData?.allowed_proof_types && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium mb-2">Accepted Proof Types:</p>
              <div className="flex flex-wrap gap-1">
                {gameData.allowed_proof_types.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmitResult}
            disabled={!selectedResult || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Result...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit {selectedResult || 'Result'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};