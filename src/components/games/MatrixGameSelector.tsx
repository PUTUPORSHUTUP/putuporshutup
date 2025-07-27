import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GameMatrixData, getGameDetails, getAllGames } from "@/services/gameMatrixService";
import { Gamepad2, Shield, Zap } from "lucide-react";

interface MatrixGameSelectorProps {
  onGameSelect: (game: string, platform: string, challengeType: string, gameData: GameMatrixData) => void;
  selectedPlatform?: string;
}

export function MatrixGameSelector({ onGameSelect, selectedPlatform }: MatrixGameSelectorProps) {
  const [games, setGames] = useState<GameMatrixData[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameMatrixData | null>(null);
  const [selectedPlatform_, setSelectedPlatform_] = useState<string>('');
  const [selectedChallengeType, setSelectedChallengeType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const gameData = await getAllGames();
      setGames(gameData);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameSelect = async (gameName: string) => {
    try {
      const gameData = await getGameDetails(gameName);
      setSelectedGame(gameData);
      setSelectedPlatform_('');
      setSelectedChallengeType('');
    } catch (error) {
      console.error('Failed to load game details:', error);
    }
  };

  const handleCreateChallenge = () => {
    if (selectedGame && selectedPlatform_ && selectedChallengeType) {
      onGameSelect(selectedGame.game, selectedPlatform_, selectedChallengeType, selectedGame);
    }
  };

  const filteredGames = selectedPlatform 
    ? games.filter(game => game.platforms.includes(selectedPlatform))
    : games;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGames.map((game) => (
          <Card 
            key={game.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedGame?.id === game.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleGameSelect(game.game)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gamepad2 className="h-5 w-5" />
                {game.game}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {game.platforms.map((platform) => (
                  <Badge key={platform} variant="secondary" className="text-xs">
                    {platform}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {game.apiAccess ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Auto Verify
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Manual Review
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {game.challengeTypes.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedGame && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Challenge for {selectedGame.game}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Platform</label>
              <Select value={selectedPlatform_} onValueChange={setSelectedPlatform_}>
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

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              {selectedGame.apiAccess ? (
                <>
                  <Zap className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Results will be automatically verified via API</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Results require manual proof submission and review</span>
                </>
              )}
            </div>

            <Button 
              onClick={handleCreateChallenge}
              disabled={!selectedPlatform_ || !selectedChallengeType}
              className="w-full"
            >
              Create Challenge
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}