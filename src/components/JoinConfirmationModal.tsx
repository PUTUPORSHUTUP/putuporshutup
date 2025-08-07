import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function JoinConfirmationModal({ isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">You're In!</DialogTitle>
          <DialogDescription className="text-center">
            You've successfully joined the match queue. We'll notify you when it's your time to play.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} className="px-8">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}