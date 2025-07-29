import { supabase } from "@/integrations/supabase/client";

export interface PlayerStatLog {
  user_id: string;
  game_name: string;
  platform: string;
  challenge_id?: string;
  stats_data: Record<string, any>;
  match_date?: Date;
}

/**
 * Silent stat logging service - logs player statistics without notifications
 * This helps build player profiles and track performance over time
 */
export class StatLoggingService {
  
  /**
   * Log player stats silently (no notifications or alerts)
   */
  static async logPlayerStats(statLog: PlayerStatLog): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('player_stats')
        .insert({
          user_id: statLog.user_id,
          game_name: statLog.game_name,
          platform: statLog.platform,
          challenge_id: statLog.challenge_id,
          stats_data: statLog.stats_data,
          match_date: statLog.match_date ? statLog.match_date.toISOString() : new Date().toISOString()
        });

      if (error) {
        console.error('Silent stat logging failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Silent stat logging error:', error);
      return false;
    }
  }

  /**
   * Log match completion stats
   */
  static async logMatchCompletion(
    userId: string,
    challengeId: string,
    gameName: string,
    platform: string,
    result: string,
    additionalStats?: Record<string, any>
  ): Promise<void> {
    const statsData = {
      match_result: result,
      completion_time: new Date().toISOString(),
      challenge_type: 'match_completion',
      ...additionalStats
    };

    await this.logPlayerStats({
      user_id: userId,
      game_name: gameName,
      platform: platform,
      challenge_id: challengeId,
      stats_data: statsData
    });
  }

  /**
   * Log challenge creation activity
   */
  static async logChallengeCreation(
    userId: string,
    challengeId: string,
    gameName: string,
    platform: string,
    stakeAmount: number
  ): Promise<void> {
    const statsData = {
      activity_type: 'challenge_created',
      stake_amount: stakeAmount,
      creation_time: new Date().toISOString()
    };

    await this.logPlayerStats({
      user_id: userId,
      game_name: gameName,
      platform: platform,
      challenge_id: challengeId,
      stats_data: statsData
    });
  }

  /**
   * Log challenge participation
   */
  static async logChallengeParticipation(
    userId: string,
    challengeId: string,
    gameName: string,
    platform: string,
    stakeAmount: number
  ): Promise<void> {
    const statsData = {
      activity_type: 'challenge_joined',
      stake_amount: stakeAmount,
      join_time: new Date().toISOString()
    };

    await this.logPlayerStats({
      user_id: userId,
      game_name: gameName,
      platform: platform,
      challenge_id: challengeId,
      stats_data: statsData
    });
  }

  /**
   * Get player statistics summary (for profile display)
   */
  static async getPlayerStatsSummary(userId: string, gameName?: string) {
    try {
      let query = supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', userId);

      if (gameName) {
        query = query.eq('game_name', gameName);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Process stats to create summary
      const summary = {
        total_matches: data?.length || 0,
        wins: data?.filter(s => {
          const statsData = s.stats_data as any;
          return statsData?.match_result?.includes('1st') || 
                 statsData?.match_result?.toLowerCase().includes('won');
        }).length || 0,
        challenges_created: data?.filter(s => {
          const statsData = s.stats_data as any;
          return statsData?.activity_type === 'challenge_created';
        }).length || 0,
        recent_activity: data?.slice(0, 10) || []
      };

      return summary;
    } catch (error) {
      console.error('Error fetching player stats summary:', error);
      return null;
    }
  }
}