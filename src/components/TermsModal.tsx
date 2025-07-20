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

            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-red-600">1. Age Restriction</h3>
                <p>Users must be 18 years or older to use this platform. In jurisdictions where the age of majority is 21, users must be 21 or older.</p>
              </div>

              <div>
                <h3 className="font-semibold text-blue-600">2. Skill-Based Betting Disclosure</h3>
                <p>PUOSU is a skill-based competition platform. Users wager on their own gaming performance in peer-vs-peer matches. No games of chance are offered or hosted by PUOSU.</p>
              </div>

              <div>
                <h3 className="font-semibold text-orange-600">3. No Responsibility for Lost Connections</h3>
                <p>PUOSU is not liable for any losses resulting from internet disconnection, power outages, or hardware/software failures during gameplay.</p>
              </div>

              <div>
                <h3 className="font-semibold text-purple-600">4. Cheating and Match Integrity</h3>
                <p>If a user is found cheating or manipulating gameplay results, they forfeit their deposit and may be banned from the platform permanently.</p>
              </div>

              <div>
                <h3 className="font-semibold text-green-600">5. Dispute Resolution</h3>
                <p>Disputes must be submitted through the in-app admin panel within 15 minutes of match completion. The decision of PUOSU Admins is final in all dispute cases.</p>
              </div>

              <div>
                <h3 className="font-semibold text-indigo-600">6. Platform Responsibility Limitation</h3>
                <p>PUOSU is not responsible for verifying user skill levels or performance. Wagers are placed at the user's own risk and discretion.</p>
              </div>

              <div>
                <h3 className="font-semibold text-pink-600">7. Content & Communication</h3>
                <p>Users may not post offensive, threatening, or harassing content. Violations will result in immediate suspension or permanent ban.</p>
              </div>

              <div>
                <h3 className="font-semibold text-teal-600">8. Refunds and Withdrawals</h3>
                <p>All wagers are final. There are no refunds except in cases of confirmed technical errors or admin-approved exceptions.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700">9. Terms Acceptance</h3>
                <p>By using PUOSU, users agree to these terms and any future revisions.</p>
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