import { AlertTriangle, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ResponsibleGamblingWarningProps {
  isExcluded: boolean;
  exclusionMessage?: string;
  showLimitWarning?: boolean;
  limitMessage?: string;
}

export function ResponsibleGamblingWarning({ 
  isExcluded, 
  exclusionMessage, 
  showLimitWarning = false,
  limitMessage 
}: ResponsibleGamblingWarningProps) {
  if (!isExcluded && !showLimitWarning) return null;

  if (isExcluded) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Account Restricted
          </CardTitle>
          <CardDescription>
            {exclusionMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you're struggling with gambling, help is available:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="tel:1-800-522-4700">
                  <Phone className="h-3 w-3 mr-1" />
                  1-800-522-4700
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer">
                  Get Help Online
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showLimitWarning && limitMessage) {
    return (
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Spending Limit Warning:</strong> {limitMessage}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}