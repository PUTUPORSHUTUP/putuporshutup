export type ChallengeType = '1v1' | '1v1_lobby' | 'team_vs_team' | 'lobby_competition' | 'stat_based';

export type VerificationMethod = 'manual' | 'screenshot' | 'api' | 'video';

export interface StatCriteria {
  type: 'kills' | 'deaths' | 'kd_ratio' | 'score' | 'placement' | 'damage' | 'custom';
  target_value?: number;
  comparison: 'greater_than' | 'less_than' | 'equals' | 'highest' | 'lowest';
  description?: string;
}

export interface ChallengeTeam {
  id: string;
  challenge_id: string;
  team_name: string;
  team_number: number;
  captain_id: string;
  total_stake: number;
  created_at: string;
  updated_at: string;
  members?: ChallengeTeamMember[];
}

export interface ChallengeTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  stake_paid: number;
  joined_at: string;
  status: string;
  profile?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface ChallengeStats {
  id: string;
  challenge_id: string;
  user_id: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  placement?: number;
  damage_dealt: number;
  custom_stats?: Record<string, any>;
  proof_url?: string;
  verified: boolean;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LobbySession {
  id: string;
  lobby_id: string;
  game_id: string;
  platform: string;
  max_participants: number;
  status: string;
  created_by: string;
  session_start: string;
  session_end?: string;
}

export interface LobbyParticipant {
  id: string;
  lobby_session_id: string;
  user_id: string;
  challenge_id?: string;
  joined_at: string;
  profile?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

export interface EnhancedChallenge {
  id: string;
  title: string;
  description?: string;
  stake_amount: number;
  max_participants: number;
  platform: string;
  game_mode?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  total_pot: number;
  created_at: string;
  creator_id: string;
  winner_id?: string;
  game: {
    id: string;
    name: string;
    display_name: string;
    description: string;
    platform: string[];
    image_url?: string;
    is_active: boolean;
  };
  participant_count: number;
  user_participated?: boolean;
  challenge_participants?: any[];
  
  // Enhanced fields
  challenge_type: ChallengeType;
  team_size?: number;
  lobby_id?: string;
  stat_criteria?: StatCriteria[];
  verification_method: VerificationMethod;
  teams?: ChallengeTeam[];
  stats?: ChallengeStats[];
}