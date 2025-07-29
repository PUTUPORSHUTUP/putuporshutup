import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Shield, Trophy, Zap, AlertTriangle } from "lucide-react";
import { type GameMatrixData } from "@/services/gameMatrixService";

interface EnhancedGameConfigProps {
  gameData: GameMatrixData;
  selectedGameMode: string;
  selectedMatchType: string;
  onGameModeChange: (gameMode: string) => void;
  onMatchTypeChange: (matchType: string) => void;
}

export function EnhancedGameConfig({ 
  gameData, 
  selectedGameMode, 
  selectedMatchType,
  onGameModeChange, 
  onMatchTypeChange 
}: EnhancedGameConfigProps) {
  return (
    <div className="space-y-4">
      {/* Game Mode Selection */}
      {gameData.gameModes.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Game Mode</label>
          <Select value={selectedGameMode} onValueChange={onGameModeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select game mode" />
            </SelectTrigger>
            <SelectContent>
              {gameData.gameModes.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {mode}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Match Type Selection */}
      {gameData.matchType.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Match Type</label>
          <Select value={selectedMatchType} onValueChange={onMatchTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select match type" />
            </SelectTrigger>
            <SelectContent>
              {gameData.matchType.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Game Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Configuration</CardTitle>
          <CardDescription>
            {gameData.game} setup details and options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Proof Method */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {gameData.proofType === 'api' ? (
              <>
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-sm">Automatic API validation</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Manual {gameData.proofType} verification</span>
              </>
            )}
          </div>

          {/* Result Options */}
          <div>
            <h4 className="text-sm font-medium mb-2">Possible Results</h4>
            <div className="flex flex-wrap gap-1">
              {gameData.resultOptions.map((option) => (
                <Badge key={option} variant="outline" className="text-xs">
                  <Trophy className="h-3 w-3 mr-1" />
                  {option}
                </Badge>
              ))}
            </div>
          </div>

          {/* Allowed Proof Types */}
          <div>
            <h4 className="text-sm font-medium mb-2">Allowed Proof Types</h4>
            <div className="flex flex-wrap gap-1">
              {gameData.allowedProofTypes.map((proofType) => (
                <Badge key={proofType} variant="secondary" className="text-xs">
                  {proofType}
                </Badge>
              ))}
            </div>
          </div>

          {/* Auto-Forfeit Timer */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Auto-forfeit after {gameData.autoForfeitMinutes} minutes</span>
          </div>

          {/* Detailed Notes */}
          {gameData.detailedNotes && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-1">Important Notes</h4>
              <p className="text-sm text-muted-foreground">{gameData.detailedNotes}</p>
            </div>
          )}

          {/* Match Features */}
          <div className="grid grid-cols-2 gap-2">
            {gameData.showTimer && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Timer enabled
              </div>
            )}
            {gameData.disputeHandler && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                Dispute system
              </div>
            )}
            {gameData.timeoutFailsafe && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                Timeout protection
              </div>
            )}
            {gameData.resultSubmission && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Trophy className="h-3 w-3" />
                Result submission
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}