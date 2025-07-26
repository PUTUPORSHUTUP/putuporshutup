import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, RefreshCw } from 'lucide-react';
import { OTP_CONFIG } from '@/lib/passwordSecurity';

interface OTPInputProps {
  onVerify: (otp: string) => Promise<boolean>;
  onResend?: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export const OTPInput = ({ 
  onVerify, 
  onResend, 
  isLoading = false,
  className = "" 
}: OTPInputProps) => {
  const [otp, setOtp] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_CONFIG.expiryMinutes * 60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState<string>('');

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === OTP_CONFIG.length && !isLoading && !isBlocked) {
      handleVerify();
    }
  }, [otp, isLoading, isBlocked]);

  const handleVerify = async () => {
    if (attempts >= OTP_CONFIG.maxAttempts) {
      setIsBlocked(true);
      setError(`Too many attempts. Please wait ${OTP_CONFIG.cooldownMinutes} minutes.`);
      return;
    }

    try {
      const isValid = await onVerify(otp);
      
      if (isValid) {
        setError('');
        setAttempts(0);
      } else {
        setAttempts(prev => prev + 1);
        setOtp('');
        
        const remaining = OTP_CONFIG.maxAttempts - (attempts + 1);
        if (remaining > 0) {
          setError(`Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
        } else {
          setIsBlocked(true);
          setError(`Too many attempts. Please wait ${OTP_CONFIG.cooldownMinutes} minutes.`);
        }
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
      setOtp('');
    }
  };

  const handleResend = async () => {
    if (!onResend || !canResend) return;
    
    try {
      await onResend();
      setTimeLeft(OTP_CONFIG.expiryMinutes * 60);
      setCanResend(false);
      setOtp('');
      setAttempts(0);
      setIsBlocked(false);
      setError('');
    } catch (error) {
      setError('Failed to resend code. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Enter Verification Code</h3>
        <p className="text-sm text-muted-foreground">
          Enter the {OTP_CONFIG.length}-digit code sent to your device
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          value={otp}
          onChange={setOtp}
          maxLength={OTP_CONFIG.length}
          disabled={isLoading || isBlocked}
        >
          <InputOTPGroup>
            {Array.from({ length: OTP_CONFIG.length }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {/* Timer display */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          {timeLeft > 0 ? (
            <>Code expires in {formatTime(timeLeft)}</>
          ) : (
            <>Code expired</>
          )}
        </span>
      </div>

      {/* Error display */}
      {error && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertDescription className="text-destructive text-center">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Resend button */}
      {onResend && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={!canResend || isLoading}
            className="text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Resend Code
          </Button>
        </div>
      )}

      {/* Attempts remaining */}
      {attempts > 0 && !isBlocked && (
        <p className="text-center text-sm text-muted-foreground">
          {OTP_CONFIG.maxAttempts - attempts} attempt{OTP_CONFIG.maxAttempts - attempts !== 1 ? 's' : ''} remaining
        </p>
      )}
    </div>
  );
};