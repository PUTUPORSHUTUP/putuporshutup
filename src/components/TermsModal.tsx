import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
}

export const TermsModal = ({ open, onAccept }: TermsModalProps) => {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Check if user has scrolled to bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasReadTerms(true);
    }
  };

  const handleAccept = () => {
    if (acceptedTerms && hasReadTerms) {
      localStorage.setItem('puosu_terms_accepted', 'true');
      localStorage.setItem('puosu_terms_date', new Date().toISOString());
      onAccept();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            PUOSU - Terms of Use & Legal Disclaimers
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea 
          className="h-[400px] w-full border rounded-lg p-4"
          onScrollCapture={handleScroll}
        >
          <div className="space-y-4 text-sm">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-yellow-800">
                  <p className="font-medium">Important Notice:</p>
                  <p className="text-xs mt-1">
                    Please read all terms carefully. You must scroll to the bottom and agree to continue.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium">
                By participating in a challenge on the Put Up or Shut Up platform, you agree to the following:
              </p>
              
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="text-primary font-semibold">1.</span>
                  <p>All matches are based solely on skill. No form of gambling or chance is involved.</p>
                </div>

                <div className="flex gap-3">
                  <span className="text-primary font-semibold">2.</span>
                  <p>Challenge fees are held securely and only released based on valid match results.</p>
                </div>

                <div className="flex gap-3">
                  <span className="text-primary font-semibold">3.</span>
                  <p>If you fail to submit results or proof within the designated time, you may forfeit your entry fee.</p>
                </div>

                <div className="flex gap-3">
                  <span className="text-primary font-semibold">4.</span>
                  <p>All disputes are reviewed by PUOSU moderators. Their decision is final.</p>
                </div>

                <div className="flex gap-3">
                  <span className="text-primary font-semibold">5.</span>
                  <p>Internet disconnections, console crashes, and lag are not valid excuses unless verified with proof.</p>
                </div>

                <div className="flex gap-3">
                  <span className="text-primary font-semibold">6.</span>
                  <p>Use of cheats, mods, or unauthorized tools will result in forfeiture and possible ban.</p>
                </div>

                <div className="flex gap-3">
                  <span className="text-primary font-semibold">7.</span>
                  <p>Refunds are not guaranteed unless both players agree, or an admin rules it necessary.</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3 mt-4">
                <p className="text-sm font-medium text-center">
                  By tapping "Accept Challenge," you accept these terms and agree to play fairly.
                </p>
              </div>

              <div className="border-t pt-3 mt-4">
                <p className="text-xs text-muted-foreground">
                  For full legal policies, privacy policy, and user agreement, please visit our website or contact legal@putuporshutup.com
                </p>
              </div>
            </div>

            {hasReadTerms && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                <p className="text-green-800 text-xs font-medium">
                  ✓ You have read all terms. You may now accept to continue.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="accept-terms" 
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              disabled={!hasReadTerms}
            />
            <label 
              htmlFor="accept-terms" 
              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                !hasReadTerms ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              I have read, understood, and agree to the Terms of Use and Legal Disclaimers
            </label>
          </div>

          <Button 
            onClick={handleAccept}
            disabled={!acceptedTerms || !hasReadTerms}
            className="w-full"
          >
            {!hasReadTerms ? 'Please scroll to read all terms' : 
             !acceptedTerms ? 'Please check the agreement box' : 
             'Accept Terms & Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};