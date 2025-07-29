import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Zap, Shield } from "lucide-react";
import { getAllGames, getGameDetails, type GameMatrixData } from "@/services/gameMatrixService";
import { toast } from "sonner";
import { GameInstructions } from "./GameInstructions";

interface GameMatrixSelectorProps {
  onGameSelect: (gameData: GameMatrixData, selectedPlatform: string, selectedChallengeType: string) => void;
}

export function GameMatrixSelector({ onGameSelect }: GameMatrixSelectorProps) {
  const [games, setGames] = useState<GameMatrixData[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameMatrixData | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedChallengeType, setSelectedChallengeType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const gameData = await getAllGames();
      setGames(gameData);
    } catch (error) {
      toast.error("Failed to load games");
      console.error("Error loading games:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameSelect = async (gameName: string) => {
    try {
      const gameData = await getGameDetails(gameName);
      setSelectedGame(gameData);
      setSelectedPlatform("");
      setSelectedChallengeType("");
    } catch (error) {
      toast.error("Failed to load game details");
      console.error("Error loading game details:", error);
    }
  };

  const handleCreateChallenge = () => {
    if (selectedGame && selectedPlatform && selectedChallengeType) {
      onGameSelect(selectedGame, selectedPlatform, selectedChallengeType);
    }
  };

  const isReadyToCreate = selectedGame && selectedPlatform && selectedChallengeType;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Selection */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card
            key={game.id}
            className={`cursor-pointer transition-all hover:scale-105 ${
              selectedGame?.id === game.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleGameSelect(game.game)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                {game.game}
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-1">
                {game.platforms.map((platform) => (
                  <Badge key={platform} variant="outline" className="text-xs">
                    {platform}
                  </Badge>
                ))}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-sm">
                {game.apiAccess ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    API Validation
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Manual Review
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform and Challenge Type Selection */}
      {selectedGame && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Your Challenge</CardTitle>
            <CardDescription>
              Selected: {selectedGame.game}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Platform Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Platform</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGame.platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Challenge Type Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Challenge Type</label>
              <Select value={selectedChallengeType} onValueChange={setSelectedChallengeType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select challenge type" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGame.challengeTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Game Setup Instructions */}
            {selectedPlatform && (
              <GameInstructions 
                gameName={selectedGame.game}
                instructions={selectedGame.setupInstructions}
                platform={selectedPlatform}
              />
            )}

            {/* Proof Method Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {selectedGame.apiAccess ? (
                  <>
                    <Zap className="h-4 w-4 text-green-500" />
                    <span>This game supports automatic API validation</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span>Manual proof submission required</span>
                  </>
                )}
              </div>
            </div>

            {/* Create Challenge Button */}
            {isReadyToCreate && (
              <Button onClick={handleCreateChallenge} className="w-full">
                Create Challenge
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}