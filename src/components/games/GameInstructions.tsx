import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface GameInstructionsProps {
  gameName: string;
  instructions?: string;
  platform: string;
}

export const GameInstructions: React.FC<GameInstructionsProps> = ({
  gameName,
  instructions,
  platform
}) => {
  const copyInstructions = () => {
    if (instructions) {
      navigator.clipboard.writeText(instructions);
      toast.success('Instructions copied to clipboard!');
    }
  };

  if (!instructions) {
    return (
      <Card className="border-orange-200 dark:border-orange-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              Setup instructions not available for {gameName} on {platform}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {gameName} Setup Instructions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={copyInstructions}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
            {instructions}
          </pre>
        </div>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Pro Tip:</strong> Share these instructions with all participants before starting your tournament to ensure everyone knows how to set up the lobby correctly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};