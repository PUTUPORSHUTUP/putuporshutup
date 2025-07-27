import { supabase } from "@/integrations/supabase/client";

export interface GameMatrixData {
  id: string;
  game: string;
  platforms: string[];
  proofMethod: string;
  challengeTypes: string[];
  apiAccess: boolean;
}

// Core Logic for PUOSU Challenge Setup (Based on game_matrix Supabase table)

// 1. Fetch game matrix row based on user selection
export async function getGameDetails(gameName: string): Promise<GameMatrixData> {
  const { data, error } = await supabase
    .from('game_matrix')
    .select('*')
    .eq('game', gameName)
    .single();

  if (error) throw new Error('Game not found');

  return {
    id: data.id,
    game: data.game,
    platforms: data.platforms.split(', ').map((p: string) => p.trim()),
    proofMethod: data.proof_method,
    challengeTypes: data.challenge_type.split(', ').map((c: string) => c.trim()),
    apiAccess: data.api_access
  };
}

// 2. Get all available games from the matrix
export async function getAllGames(): Promise<GameMatrixData[]> {
  const { data, error } = await supabase
    .from('game_matrix')
    .select('*')
    .order('game');

  if (error) throw new Error('Failed to fetch games');

  return data.map(item => ({
    id: item.id,
    game: item.game,
    platforms: item.platforms.split(', ').map((p: string) => p.trim()),
    proofMethod: item.proof_method,
    challengeTypes: item.challenge_type.split(', ').map((c: string) => c.trim()),
    apiAccess: item.api_access
  }));
}

// 3. Example hook for match result logic (simplified)
export async function validateMatchResults(gameName: string, platform: string, username: string) {
  const gameData = await getGameDetails(gameName);
  
  if (gameData.proofMethod === 'API') {
    // API validation logic would go here
    console.log(`API validation for ${gameName} on ${platform} for user ${username}`);
    return { validated: true, method: 'API' };
  } else {
    // Manual proof submission
    console.log(`Manual validation required for ${gameName}`);
    return { validated: false, method: 'Manual' };
  }
}