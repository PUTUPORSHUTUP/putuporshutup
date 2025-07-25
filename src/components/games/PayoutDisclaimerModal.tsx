import { AlertTriangle, Shield, Eye, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PayoutDisclaimerModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PayoutDisclaimerModal = ({ open, onConfirm, onCancel }: PayoutDisclaimerModalProps) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Shield className="w-6 h-6 text-red-500" />
            Payout Disclaimer
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              <p className="text-foreground font-medium">
                You are about to claim victory in a skill-based match. By submitting, you confirm:
              </p>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You won the match legitimately</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You're not making a false claim</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You understand that payouts are final once processed</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You may be asked to upload match proof (screenshot, video, etc.)</span>
                </div>
              </div>

              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <Eye className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-600">
                    False submissions may result in:
                  </span>
                </div>
                <ul className="space-y-1 ml-7 text-sm">
                  <li>• Loss of funds</li>
                  <li>• Account restriction</li>
                  <li>• Admin investigation</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Tap "Confirm Result" to continue.</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            Confirm Result
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};