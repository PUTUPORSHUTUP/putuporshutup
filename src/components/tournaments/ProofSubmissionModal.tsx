import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, AlertCircle, Camera, Video, Link, Database } from "lucide-react";

interface ProofSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentMatchId?: string;
  challengeId?: string;
  onSubmitted?: () => void;
}

export function ProofSubmissionModal({
  open,
  onOpenChange,
  tournamentMatchId,
  challengeId,
  onSubmitted
}: ProofSubmissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    proofType: 'screenshot' as 'screenshot' | 'video' | 'stream_link' | 'api_data',
    proofUrl: '',
    statsClaimed: {
      kills: '',
      deaths: '',
      assists: '',
      damage_dealt: '',
      placement: '',
      score: ''
    },
    notes: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.proofUrl.trim()) {
      toast({
        title: "Error",
        description: "Proof URL is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First check for suspicious stats
      const statsData = {
        kills: parseInt(form.statsClaimed.kills) || 0,
        deaths: parseInt(form.statsClaimed.deaths) || 1,
        assists: parseInt(form.statsClaimed.assists) || 0,
        damage_dealt: parseFloat(form.statsClaimed.damage_dealt) || 0,
        placement: parseInt(form.statsClaimed.placement) || 0,
        score: parseInt(form.statsClaimed.score) || 0
      };

      // Call suspicious stats detection function
      const { data: isSuspicious, error: suspiciousError } = await supabase
        .rpc('detect_suspicious_stats', {
          user_id_param: (await supabase.auth.getUser()).data.user?.id,
          stats_data: statsData
        });

      if (suspiciousError) {
        console.error('Error checking suspicious stats:', suspiciousError);
      }

      // Submit proof regardless, but flag if suspicious
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('proof_submissions')
        .insert({
          tournament_match_id: tournamentMatchId || null,
          challenge_id: challengeId || null,
          submitted_by: user.user.id,
          proof_type: form.proofType,
          proof_url: form.proofUrl.trim(),
          stats_claimed: statsData,
          verification_status: isSuspicious ? 'flagged' : 'pending'
        });

      if (error) throw error;

      toast({
        title: "Proof Submitted!",
        description: isSuspicious 
          ? "Your proof has been submitted but flagged for review due to unusual stats."
          : "Your proof has been submitted and is awaiting verification."
      });

      setForm({
        proofType: 'screenshot',
        proofUrl: '',
        statsClaimed: {
          kills: '',
          deaths: '',
          assists: '',
          damage_dealt: '',
          placement: '',
          score: ''
        },
        notes: ''
      });

      onSubmitted?.();
      onOpenChange(false);

    } catch (error) {
      console.error('Error submitting proof:', error);
      toast({
        title: "Error",
        description: "Failed to submit proof. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const proofTypeIcons = {
    screenshot: Camera,
    video: Video,
    stream_link: Link,
    api_data: Database
  };

  const ProofIcon = proofTypeIcons[form.proofType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Submit Match Proof
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Proof Type</Label>
            <Select value={form.proofType} onValueChange={(value: any) => setForm(prev => ({ ...prev, proofType: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="screenshot">Screenshot</SelectItem>
                <SelectItem value="video">Video Recording</SelectItem>
                <SelectItem value="stream_link">Stream/VOD Link</SelectItem>
                <SelectItem value="api_data">Game API Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="proofUrl" className="flex items-center gap-2">
              <ProofIcon className="w-4 h-4" />
              Proof URL *
            </Label>
            <Input
              id="proofUrl"
              type="url"
              value={form.proofUrl}
              onChange={(e) => setForm(prev => ({ ...prev, proofUrl: e.target.value }))}
              placeholder="https://imgur.com/... or https://twitch.tv/..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kills">Kills</Label>
              <Input
                id="kills"
                type="number"
                min="0"
                value={form.statsClaimed.kills}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  statsClaimed: { ...prev.statsClaimed, kills: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="deaths">Deaths</Label>
              <Input
                id="deaths"
                type="number"
                min="0"
                value={form.statsClaimed.deaths}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  statsClaimed: { ...prev.statsClaimed, deaths: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="assists">Assists</Label>
              <Input
                id="assists"
                type="number"
                min="0"
                value={form.statsClaimed.assists}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  statsClaimed: { ...prev.statsClaimed, assists: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="damage">Damage Dealt</Label>
              <Input
                id="damage"
                type="number"
                min="0"
                value={form.statsClaimed.damage_dealt}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  statsClaimed: { ...prev.statsClaimed, damage_dealt: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="placement">Placement</Label>
              <Input
                id="placement"
                type="number"
                min="1"
                value={form.statsClaimed.placement}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  statsClaimed: { ...prev.statsClaimed, placement: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="score">Total Score</Label>
              <Input
                id="score"
                type="number"
                min="0"
                value={form.statsClaimed.score}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  statsClaimed: { ...prev.statsClaimed, score: e.target.value }
                }))}
              />
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Provide accurate stats and valid proof. Suspicious stats will be automatically flagged for review.
              False submissions may result in account penalties.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Proof"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}