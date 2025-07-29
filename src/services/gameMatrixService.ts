import { supabase } from "@/integrations/supabase/client";

export interface GameMatrixData {
  id: string;
  game: string;
  platforms: string[];
  proofMethod: string;
  challengeTypes: string[];
  apiAccess: boolean;
  setupInstructions?: string;
  // New rich configuration fields
  gameModes: string[];
  setupGuide?: string;
  resultSubmission: boolean;
  proofType: string;
  resultOptions: string[];
  timeoutFailsafe: boolean;
  disputeHandler: boolean;
  showTimer: boolean;
  matchType: string[];
  allowedProofTypes: string[];
  autoForfeitMinutes: number;
  detailedNotes?: string;
  // New automation fields
  automatedScoreDetection: boolean;
  hostVerificationMethod: string;
  requiresHostVerification: boolean;
  trendScore: number;
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
    apiAccess: data.api_access,
    setupInstructions: data.setup_instructions,
    // New rich configuration fields
    gameModes: Array.isArray(data.game_modes) ? data.game_modes.map(String) : [],
    setupGuide: data.setup_guide,
    resultSubmission: data.result_submission || true,
    proofType: data.proof_type || 'screenshot',
    resultOptions: Array.isArray(data.result_options) ? data.result_options.map(String) : ['Winner', 'Lost'],
    timeoutFailsafe: data.timeout_failsafe || true,
    disputeHandler: data.dispute_handler || true,
    showTimer: data.show_timer || true,
    matchType: Array.isArray(data.match_type) ? data.match_type.map(String) : [],
    allowedProofTypes: Array.isArray(data.allowed_proof_types) ? data.allowed_proof_types.map(String) : ['Screenshot'],
    autoForfeitMinutes: data.auto_forfeit_minutes || 10,
    detailedNotes: data.detailed_notes,
    // New automation fields
    automatedScoreDetection: data.automated_score_detection || false,
    hostVerificationMethod: data.host_verification_method || 'screenshot',
    requiresHostVerification: data.requires_host_verification || true,
    trendScore: data.trend_score || 0
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
    apiAccess: item.api_access,
    setupInstructions: item.setup_instructions,
    // New rich configuration fields
    gameModes: Array.isArray(item.game_modes) ? item.game_modes.map(String) : [],
    setupGuide: item.setup_guide,
    resultSubmission: item.result_submission || true,
    proofType: item.proof_type || 'screenshot',
    resultOptions: Array.isArray(item.result_options) ? item.result_options.map(String) : ['Winner', 'Lost'],
    timeoutFailsafe: item.timeout_failsafe || true,
    disputeHandler: item.dispute_handler || true,
    showTimer: item.show_timer || true,
    matchType: Array.isArray(item.match_type) ? item.match_type.map(String) : [],
    allowedProofTypes: Array.isArray(item.allowed_proof_types) ? item.allowed_proof_types.map(String) : ['Screenshot'],
    autoForfeitMinutes: item.auto_forfeit_minutes || 10,
    detailedNotes: item.detailed_notes,
    // New automation fields
    automatedScoreDetection: item.automated_score_detection || false,
    hostVerificationMethod: item.host_verification_method || 'screenshot',
    requiresHostVerification: item.requires_host_verification || true,
    trendScore: item.trend_score || 0
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