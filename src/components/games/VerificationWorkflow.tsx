import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, Video, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerificationWorkflowProps {
  wagerId: string;
  verificationMethod: string;
  onVerificationComplete: () => void;
}

export const VerificationWorkflow = ({ wagerId, verificationMethod, onVerificationComplete }: VerificationWorkflowProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const handleSubmitProof = async () => {
    setUploading(true);
    try {
      // TODO: Implement actual file upload and result submission
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload
      
      toast({
        title: "Proof Submitted",
        description: "Your verification proof has been submitted for review.",
      });
      
      setOpen(false);
      onVerificationComplete();
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to submit proof. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const getVerificationIcon = () => {
    switch (verificationMethod) {
      case 'screenshot': return Camera;
      case 'video': return Video;
      case 'api': return CheckCircle;
      default: return AlertTriangle;
    }
  };

  const getVerificationTitle = () => {
    switch (verificationMethod) {
      case 'screenshot': return 'Submit Screenshot Proof';
      case 'video': return 'Submit Video Proof';
      case 'api': return 'Auto-Verification';
      default: return 'Submit Match Results';
    }
  };

  const getVerificationDescription = () => {
    switch (verificationMethod) {
      case 'screenshot': return 'Upload a clear screenshot of the final score/results screen';
      case 'video': return 'Upload a video recording of the match conclusion and results';
      case 'api': return 'Results will be automatically verified through game API';
      default: return 'Provide details about the match results';
    }
  };

  const Icon = getVerificationIcon();

  if (verificationMethod === 'api') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium">Auto-Verification Enabled</h4>
              <p className="text-sm text-muted-foreground">
                Results will be automatically verified through the game's API
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Icon className="w-4 h-4 mr-2" />
          Submit Results
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {getVerificationTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {getVerificationDescription()}
          </div>

          {(verificationMethod === 'screenshot' || verificationMethod === 'video') && (
            <div>
              <Label htmlFor="proof">
                {verificationMethod === 'screenshot' ? 'Screenshot' : 'Video'} Upload
              </Label>
              <div className="mt-2 border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload or drag and drop
                </p>
                <Input
                  type="file"
                  accept={verificationMethod === 'screenshot' ? 'image/*' : 'video/*'}
                  className="hidden"
                  id="proof"
                />
                <Button variant="outline" size="sm" onClick={() => document.getElementById('proof')?.click()}>
                  Choose File
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="proofUrl">Proof URL (Optional)</Label>
            <Input
              id="proofUrl"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://example.com/screenshot.png"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context about the match results..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmitProof} disabled={uploading} className="flex-1">
              {uploading ? 'Uploading...' : 'Submit Proof'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};