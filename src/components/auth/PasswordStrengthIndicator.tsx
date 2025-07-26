import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { validatePasswordStrength, checkPasswordBreach } from '@/lib/passwordSecurity';

interface PasswordStrengthIndicatorProps {
  password: string;
  showBreachCheck?: boolean;
  className?: string;
}

export const PasswordStrengthIndicator = ({ 
  password, 
  showBreachCheck = true,
  className = "" 
}: PasswordStrengthIndicatorProps) => {
  const [breachStatus, setBreachStatus] = useState<{
    checked: boolean;
    isCompromised: boolean;
    occurrences?: number;
    error?: string;
  }>({ checked: false, isCompromised: false });

  const strength = validatePasswordStrength(password);

  useEffect(() => {
    if (!password || !showBreachCheck) {
      setBreachStatus({ checked: false, isCompromised: false });
      return;
    }

    // Debounce breach checking
    const timer = setTimeout(async () => {
      if (password.length >= 6) { // Only check reasonable length passwords
        const result = await checkPasswordBreach(password);
        setBreachStatus({
          checked: true,
          isCompromised: result.isCompromised,
          occurrences: result.occurrences,
          error: result.error
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [password, showBreachCheck]);

  if (!password) return null;

  const getStrengthColor = (score: number) => {
    if (score < 30) return 'bg-destructive';
    if (score < 60) return 'bg-yellow-500';
    if (score < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (score: number) => {
    if (score < 30) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Good';
    return 'Strong';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Strength indicator */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength</span>
          <span className={`font-medium ${
            strength.score < 30 ? 'text-destructive' :
            strength.score < 60 ? 'text-yellow-600' :
            strength.score < 80 ? 'text-blue-600' :
            'text-green-600'
          }`}>
            {getStrengthText(strength.score)}
          </span>
        </div>
        <Progress 
          value={strength.score} 
          className={`h-2 ${getStrengthColor(strength.score)}`}
        />
      </div>

      {/* Issues list */}
      {strength.issues.length > 0 && (
        <div className="text-sm space-y-1">
          {strength.issues.map((issue, index) => (
            <div key={index} className="flex items-center gap-2 text-muted-foreground">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              {issue}
            </div>
          ))}
        </div>
      )}

      {/* Breach check result */}
      {showBreachCheck && breachStatus.checked && (
        <Alert className={`${
          breachStatus.isCompromised ? 'border-destructive bg-destructive/10' : 
          'border-green-500 bg-green-500/10'
        }`}>
          <div className="flex items-center gap-2">
            {breachStatus.isCompromised ? (
              <ShieldAlert className="h-4 w-4 text-destructive" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={
              breachStatus.isCompromised ? 'text-destructive' : 'text-green-700'
            }>
              {breachStatus.isCompromised ? (
                <>
                  ⚠️ This password has been found in {breachStatus.occurrences?.toLocaleString()} data breaches. 
                  Please choose a different password.
                </>
              ) : (
                <>
                  ✅ Password not found in known data breaches.
                </>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Breach check error */}
      {showBreachCheck && breachStatus.error && (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <Shield className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            {breachStatus.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};