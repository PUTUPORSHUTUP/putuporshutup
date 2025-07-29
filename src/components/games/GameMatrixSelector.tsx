import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Zap, Shield, Bot, TrendingUp, Camera, Video, Monitor } from "lucide-react";
import { getAllGames, getGameDetails, type GameMatrixData } from "@/services/gameMatrixService";
import { toast } from "sonner";
import { GameInstructions } from "./GameInstructions";
import { EnhancedGameConfig } from "./EnhancedGameConfig";

interface GameMatrixSelectorProps {
  onGameSelect: (gameData: GameMatrixData, selectedPlatform: string, selectedChallengeType: string, selectedGameMode?: string, selectedMatchType?: string) => void;
}

export function GameMatrixSelector({ onGameSelect }: GameMatrixSelectorProps) {
  const [games, setGames] = useState<GameMatrixData[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameMatrixData | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedChallengeType, setSelectedChallengeType] = useState<string>("");
  const [selectedGameMode, setSelectedGameMode] = useState<string>("");
  const [selectedMatchType, setSelectedMatchType] = useState<string>("");
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
      setSelectedGameMode("");
      setSelectedMatchType("");
    } catch (error) {
      toast.error("Failed to load game details");
      console.error("Error loading game details:", error);
    }
  };

  const handleCreateChallenge = () => {
    if (selectedGame && selectedPlatform && selectedChallengeType) {
      onGameSelect(selectedGame, selectedPlatform, selectedChallengeType, selectedGameMode, selectedMatchType);
    }
  };

  const getVerificationIcon = (method: string) => {
    switch (method) {
      case 'webcam': return <Camera className="w-3 h-3" />;
      case 'stream': return <Video className="w-3 h-3" />;
      case 'screenshot': return <Monitor className="w-3 h-3" />;
      default: return <Monitor className="w-3 h-3" />;
    }
  };

  const getTrendScoreColor = (score: number) => {
    if (score >= 90) return 'bg-red-500 text-white';
    if (score >= 80) return 'bg-orange-500 text-white';
    if (score >= 70) return 'bg-yellow-500 text-black';
    if (score >= 50) return 'bg-blue-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const isReadyToCreate = selectedGame && selectedPlatform && selectedChallengeType;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Select a Game</h2>
          <p className="text-muted-foreground">Choose your game to create a challenge</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select a Game</h2>
        <p className="text-muted-foreground">Choose your game to create a challenge</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game) => (
          <Card 
            key={game.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedGame?.id === game.id ? 'ring-2 ring-primary shadow-lg' : ''
            } ${game.automatedScoreDetection ? 'border-green-200 dark:border-green-800' : ''}`}
            onClick={() => handleGameSelect(game.game)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  {game.game}
                </CardTitle>
                <div className="flex gap-2">
                  {game.trendScore > 0 && (
                    <Badge variant="outline" className={`flex items-center gap-1 ${getTrendScoreColor(game.trendScore)}`}>
                      <TrendingUp className="w-3 h-3" />
                      {game.trendScore}
                    </Badge>
                  )}
                  {game.automatedScoreDetection && (
                    <Badge variant="default" className="flex items-center gap-1 bg-green-600 text-white">
                      <Bot className="w-3 h-3" />
                      Auto
                    </Badge>
                  )}
                  {game.apiAccess && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      API
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Platforms:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {game.platforms.map((platform) => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium">Challenge Types:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {game.challengeTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getVerificationIcon(game.hostVerificationMethod)}
                    <span className="capitalize">{game.hostVerificationMethod}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {game.requiresHostVerification && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform and Challenge Type Selection */}
      {selectedGame && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Configure Your Challenge
              {selectedGame.trendScore > 0 && (
                <Badge variant="outline" className={`flex items-center gap-1 ${getTrendScoreColor(selectedGame.trendScore)}`}>
                  <TrendingUp className="w-3 h-3" />
                  Trending #{selectedGame.trendScore}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              Selected: {selectedGame.game}
              {selectedGame.automatedScoreDetection && (
                <Badge className="flex items-center gap-1 bg-green-600 text-white">
                  <Bot className="w-3 h-3" />
                  Automated Score Detection
                </Badge>
              )}
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

            {/* Enhanced Game Configuration */}
            {selectedPlatform && selectedChallengeType && (
              <EnhancedGameConfig
                gameData={selectedGame}
                selectedGameMode={selectedGameMode}
                selectedMatchType={selectedMatchType}
                onGameModeChange={setSelectedGameMode}
                onMatchTypeChange={setSelectedMatchType}
              />
            )}

            {/* Game Setup Instructions */}
            {selectedPlatform && (
              <GameInstructions 
                gameName={selectedGame.game}
                instructions={selectedGame.setupGuide || selectedGame.setupInstructions}
                platform={selectedPlatform}
              />
            )}

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