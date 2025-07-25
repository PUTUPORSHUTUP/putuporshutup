import { Shield, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TilledBadgeProps {
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

export const TilledBadge = ({ variant = "default", className = "" }: TilledBadgeProps) => {
  if (variant === "compact") {
    return (
      <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
        <Shield className="h-3 w-3 text-green-600" />
        <span className="text-xs">Tilled Secure</span>
      </Badge>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded border border-green-200">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-green-700 font-medium">Tilled Secure Payment</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <CheckCircle className="h-3 w-3" />
          <span className="text-xs">Powered by Tilled</span>
        </div>
      </div>
    );
  }

  return (
    <Badge variant="outline" className={`flex items-center gap-1 border-green-200 text-green-700 ${className}`}>
      <Shield className="h-3 w-3" />
      <span className="text-xs">Tilled Secure Payment Powered</span>
    </Badge>
  );
};