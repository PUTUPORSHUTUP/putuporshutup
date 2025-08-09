import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, DollarSign, RefreshCw, FileText } from 'lucide-react';

interface LegalModalProps {
  open: boolean;
  onAccept: () => void;
  onClose?: () => void;
  actionText?: string;
}

export const ComprehensiveLegalModal = ({ 
  open, 
  onAccept, 
  onClose, 
  actionText = "Join Queue" 
}: LegalModalProps) => {
  const [readSections, setReadSections] = useState({
    terms: false,
    fees: false,
    refunds: false,
    withdrawals: false,
  });
  const [acceptedAll, setAcceptedAll] = useState(false);
  const [activeTab, setActiveTab] = useState('terms');

  // Reset states when modal opens
  useEffect(() => {
    if (open) {
      setReadSections({
        terms: false,
        fees: false,
        refunds: false,
        withdrawals: false,
      });
      setAcceptedAll(false);
      setActiveTab('terms');
    }
  }, [open]);

  const handleSectionRead = (section: keyof typeof readSections) => {
    setReadSections(prev => ({ ...prev, [section]: true }));
  };

  const handleScroll = (section: keyof typeof readSections) => (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      handleSectionRead(section);
    }
  };

  const allSectionsRead = Object.values(readSections).every(Boolean);

  const handleAccept = () => {
    if (acceptedAll && allSectionsRead) {
      const timestamp = new Date().toISOString();
      localStorage.setItem('puosu_legal_accepted', 'true');
      localStorage.setItem('puosu_legal_date', timestamp);
      localStorage.setItem('puosu_legal_version', '2.0');
      onAccept();
    }
  };

  const getTabIcon = (section: keyof typeof readSections) => {
    const icons = {
      terms: Shield,
      fees: DollarSign,
      refunds: RefreshCw,
      withdrawals: FileText,
    };
    const IconComponent = icons[section];
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && onClose?.()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Legal Requirements - Please Review All Sections
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Progress Indicator */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(readSections).map(([section, read]) => (
              <Badge 
                key={section}
                variant={read ? "default" : "secondary"}
                className="text-xs"
              >
                {getTabIcon(section as keyof typeof readSections)}
                <span className="ml-1 capitalize">{section}</span>
                {read && " ✓"}
              </Badge>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="terms" className="text-xs">
                {getTabIcon('terms')} Terms
              </TabsTrigger>
              <TabsTrigger value="fees" className="text-xs">
                {getTabIcon('fees')} Fees
              </TabsTrigger>
              <TabsTrigger value="refunds" className="text-xs">
                {getTabIcon('refunds')} Refunds
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="text-xs">
                {getTabIcon('withdrawals')} Withdrawals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="terms">
              <ScrollArea 
                className="h-[300px] w-full border rounded-lg p-4"
                onScrollCapture={handleScroll('terms')}
              >
                <div className="space-y-4 text-sm">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-blue-800">
                        <p className="font-medium">Terms of Use</p>
                        <p className="text-xs mt-1">Scroll to the bottom to mark as read</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Platform Rules & Fair Play</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>1. Skill-Based Competition:</strong> All matches are based solely on player skill. No gambling or chance-based elements.</p>
                      <p><strong>2. Fair Play Requirement:</strong> Use of cheats, exploits, or unauthorized software is prohibited and results in immediate disqualification.</p>
                      <p><strong>3. Match Integrity:</strong> Players must compete honestly and submit accurate results with valid proof.</p>
                      <p><strong>4. Platform Responsibility:</strong> PUOSU provides the platform but is not responsible for technical issues, connection problems, or gameplay outcomes.</p>
                      <p><strong>5. Dispute Resolution:</strong> All disputes are reviewed by PUOSU moderators whose decisions are final.</p>
                      <p><strong>6. Account Security:</strong> Players are responsible for maintaining account security and authorized access only.</p>
                      <p><strong>7. Age Requirement:</strong> Must be 18+ or have parental consent to participate in cash competitions.</p>
                      <p><strong>8. Compliance:</strong> Players must comply with local laws regarding skill-based competitions in their jurisdiction.</p>
                    </div>

                    <h4 className="font-semibold mt-6">Match Procedures</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Timing:</strong> Players must check in within specified time windows or forfeit their entry.</p>
                      <p><strong>Proof Submission:</strong> Results must be submitted with valid screenshots or video proof within 10 minutes of match completion.</p>
                      <p><strong>Communication:</strong> All match-related communication should occur through the platform's official channels.</p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                      <p className="text-green-800 text-sm font-medium">
                        ✓ Terms of Use section complete
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="fees">
              <ScrollArea 
                className="h-[300px] w-full border rounded-lg p-4"
                onScrollCapture={handleScroll('fees')}
              >
                <div className="space-y-4 text-sm">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="text-yellow-800">
                        <p className="font-medium">Fee Disclosure</p>
                        <p className="text-xs mt-1">All platform fees and charges</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Platform Fee Structure</h4>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-3">
                        <h5 className="font-medium text-primary">Standard Match Fee</h5>
                        <p className="text-lg font-bold">10%</p>
                        <p className="text-xs text-muted-foreground">Deducted from total prize pool before winner payout</p>
                      </div>
                      
                      <div className="border rounded-lg p-3">
                        <h5 className="font-medium text-primary">Tournament Entry Fee</h5>
                        <p className="text-lg font-bold">15%</p>
                        <p className="text-xs text-muted-foreground">Includes bracket management and prize distribution</p>
                      </div>

                      <div className="border rounded-lg p-3">
                        <h5 className="font-medium text-primary">Withdrawal Processing</h5>
                        <p className="text-lg font-bold">$2.50 flat fee</p>
                        <p className="text-xs text-muted-foreground">Per withdrawal transaction (minimum $10 withdrawal)</p>
                      </div>
                    </div>

                    <h4 className="font-semibold mt-6">Fee Examples</h4>
                    <div className="space-y-2 text-sm bg-muted p-3 rounded-lg">
                      <p><strong>$10 1v1 Match:</strong></p>
                      <p>• Total pot: $20</p>
                      <p>• Platform fee (10%): $2</p>
                      <p>• Winner receives: $18</p>
                    </div>

                    <div className="space-y-2 text-sm bg-muted p-3 rounded-lg">
                      <p><strong>$50 Tournament (8 players):</strong></p>
                      <p>• Total pot: $400</p>
                      <p>• Platform fee (15%): $60</p>
                      <p>• Prize pool: $340</p>
                    </div>

                    <h4 className="font-semibold mt-6">No Hidden Fees</h4>
                    <div className="space-y-2 text-sm">
                      <p>✓ No deposit fees</p>
                      <p>✓ No account maintenance fees</p>
                      <p>✓ No inactivity fees</p>
                      <p>✓ All fees clearly disclosed before participation</p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                      <p className="text-green-800 text-sm font-medium">
                        ✓ Fee disclosure section complete
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="refunds">
              <ScrollArea 
                className="h-[300px] w-full border rounded-lg p-4"
                onScrollCapture={handleScroll('refunds')}
              >
                <div className="space-y-4 text-sm">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <RefreshCw className="w-4 h-4 text-red-600 mt-0.5" />
                      <div className="text-red-800">
                        <p className="font-medium">Refund & System Crash Policy</p>
                        <p className="text-xs mt-1">When and how refunds are processed</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Automatic Refund Conditions</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>System Failures:</strong> Full refunds issued if our systems prevent match completion</p>
                      <p><strong>Server Crashes:</strong> Automatic refund if match cannot be validated due to server issues</p>
                      <p><strong>Payment Processing Errors:</strong> Immediate refund if payment fails after match entry</p>
                      <p><strong>Platform Maintenance:</strong> Refunds issued if unexpected maintenance disrupts active matches</p>
                    </div>

                    <h4 className="font-semibold mt-6">Refund Request Process</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>1. Mutual Agreement:</strong> Both players agree to cancel - full refund minus processing fee</p>
                      <p><strong>2. Technical Issues:</strong> Submit ticket with evidence within 24 hours of match</p>
                      <p><strong>3. Admin Review:</strong> Platform administrators investigate and determine eligibility</p>
                      <p><strong>4. Processing Time:</strong> Approved refunds processed within 3-5 business days</p>
                    </div>

                    <h4 className="font-semibold mt-6">No Refund Conditions</h4>
                    <div className="space-y-2 text-sm bg-red-50 p-3 rounded-lg">
                      <p>✗ Player disconnection or internet issues</p>
                      <p>✗ Hardware failures on player's end</p>
                      <p>✗ Dissatisfaction with match outcome</p>
                      <p>✗ Failure to submit results on time</p>
                      <p>✗ Violation of platform rules</p>
                      <p>✗ Account suspension or ban</p>
                    </div>

                    <h4 className="font-semibold mt-6">Emergency Procedures</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Immediate Response:</strong> System monitors for crashes and automatically flags affected matches</p>
                      <p><strong>Investigation:</strong> Technical team reviews logs and determines cause</p>
                      <p><strong>Communication:</strong> Users notified via email and platform notifications</p>
                      <p><strong>Resolution:</strong> Refunds processed automatically for qualifying incidents</p>
                    </div>

                    <div className="border-t pt-3 mt-4">
                      <p className="text-xs text-muted-foreground">
                        Refund decisions are final. For disputes, contact support@putuporshutup.com
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                      <p className="text-green-800 text-sm font-medium">
                        ✓ Refund policy section complete
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="withdrawals">
              <ScrollArea 
                className="h-[300px] w-full border rounded-lg p-4"
                onScrollCapture={handleScroll('withdrawals')}
              >
                <div className="space-y-4 text-sm">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-purple-600 mt-0.5" />
                      <div className="text-purple-800">
                        <p className="font-medium">Withdrawal Policy</p>
                        <p className="text-xs mt-1">How to cash out your winnings</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Withdrawal Requirements</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Minimum Amount:</strong> $10.00 per withdrawal</p>
                      <p><strong>Processing Fee:</strong> $2.50 flat fee per transaction</p>
                      <p><strong>Verification:</strong> Identity verification required for withdrawals over $100</p>
                      <p><strong>Processing Time:</strong> 3-5 business days for most methods</p>
                    </div>

                    <h4 className="font-semibold mt-6">Available Methods</h4>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-3">
                        <h5 className="font-medium text-primary">PayPal</h5>
                        <p className="text-sm">• Processing: 1-2 business days</p>
                        <p className="text-sm">• Limits: $10 - $2,500 per transaction</p>
                        <p className="text-sm">• Requirements: Verified PayPal account</p>
                      </div>
                      
                      <div className="border rounded-lg p-3">
                        <h5 className="font-medium text-primary">Cash App</h5>
                        <p className="text-sm">• Processing: 1-2 business days</p>
                        <p className="text-sm">• Limits: $10 - $1,000 per transaction</p>
                        <p className="text-sm">• Requirements: Valid Cash App $cashtag</p>
                      </div>

                      <div className="border rounded-lg p-3">
                        <h5 className="font-medium text-primary">Bank Transfer (ACH)</h5>
                        <p className="text-sm">• Processing: 3-5 business days</p>
                        <p className="text-sm">• Limits: $25 - $10,000 per transaction</p>
                        <p className="text-sm">• Requirements: US bank account verification</p>
                      </div>
                    </div>

                    <h4 className="font-semibold mt-6">Security & Verification</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Identity Verification:</strong> Required for withdrawals exceeding $100 cumulative</p>
                      <p><strong>Documents Needed:</strong> Government ID and proof of address</p>
                      <p><strong>Anti-Fraud:</strong> Automated screening for suspicious withdrawal patterns</p>
                      <p><strong>Account Holds:</strong> 24-48 hour holds may apply to new withdrawal methods</p>
                    </div>

                    <h4 className="font-semibold mt-6">Important Limitations</h4>
                    <div className="space-y-2 text-sm bg-orange-50 p-3 rounded-lg">
                      <p>• Maximum 1 withdrawal per 24-hour period</p>
                      <p>• Funds must be in account for 72 hours before withdrawal</p>
                      <p>• Suspended accounts cannot process withdrawals</p>
                      <p>• Tax reporting required for winnings over $600 annually</p>
                    </div>

                    <div className="border-t pt-3 mt-4">
                      <p className="text-xs text-muted-foreground">
                        Withdrawal policies subject to change. Users will be notified of any policy updates.
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                      <p className="text-green-800 text-sm font-medium">
                        ✓ Withdrawal policy section complete
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Agreement Section */}
          <div className="space-y-4 border-t pt-4">
            {!allSectionsRead && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <p className="text-amber-800 text-sm font-medium">
                    Please read all sections before proceeding
                  </p>
                </div>
              </div>
            )}

            {allSectionsRead && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="accept-all-legal" 
                  checked={acceptedAll}
                  onCheckedChange={(checked) => setAcceptedAll(checked === true)}
                />
                <label 
                  htmlFor="accept-all-legal" 
                  className="text-sm font-medium leading-none"
                >
                  I have read, understood, and agree to all terms, fees, refund policy, and withdrawal policy
                </label>
              </div>
            )}

            <Button 
              onClick={handleAccept}
              disabled={!acceptedAll || !allSectionsRead}
              className="w-full"
            >
              {!allSectionsRead ? 'Please read all sections first' : 
               !acceptedAll ? 'Please check the agreement box' : 
               actionText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};