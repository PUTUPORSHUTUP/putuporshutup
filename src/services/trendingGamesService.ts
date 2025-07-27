import { supabase } from '@/integrations/supabase/client';

interface TrendingGameData {
  name: string;
  display_name: string;
  platform: string[];
  trend_score: number;
  estimated_revenue_potential: number;
  player_count: number;
  description?: string;
  image_url?: string;
}

interface GameRevenue {
  game_id: string;
  revenue_30d: number;
  revenue_7d: number;
  total_challenges: number;
  avg_stake: number;
}

export class TrendingGamesService {
  // Fetch trending games from multiple sources
  static async fetchTrendingGames(): Promise<TrendingGameData[]> {
    try {
      // In production, you would call real APIs here
      // For now, returning a comprehensive list of trending games
      const trendingGames: TrendingGameData[] = [
        {
          name: "apex_legends",
          display_name: "Apex Legends",
          platform: ["PC", "PlayStation", "Xbox"],
          trend_score: 95,
          estimated_revenue_potential: 850,
          player_count: 100000000,
          description: "Battle royale hero shooter",
          image_url: "/game-images/apex-legends.jpg"
        },
        {
          name: "fortnite",
          display_name: "Fortnite",
          platform: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
          trend_score: 92,
          estimated_revenue_potential: 920,
          player_count: 400000000,
          description: "Battle royale with building mechanics",
          image_url: "/game-images/fortnite.jpg"
        },
        {
          name: "valorant",
          display_name: "Valorant",
          platform: ["PC"],
          trend_score: 88,
          estimated_revenue_potential: 780,
          player_count: 23000000,
          description: "Tactical first-person shooter",
          image_url: "/game-images/valorant.jpg"
        },
        {
          name: "call_of_duty_warzone",
          display_name: "Call of Duty: Warzone",
          platform: ["PC", "PlayStation", "Xbox"],
          trend_score: 85,
          estimated_revenue_potential: 720,
          player_count: 85000000,
          description: "Battle royale shooter",
          image_url: "/game-images/warzone.jpg"
        },
        {
          name: "rocket_league",
          display_name: "Rocket League",
          platform: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
          trend_score: 82,
          estimated_revenue_potential: 650,
          player_count: 75000000,
          description: "Vehicular soccer game",
          image_url: "/game-images/rocket-league.jpg"
        },
        {
          name: "counter_strike_2",
          display_name: "Counter-Strike 2",
          platform: ["PC"],
          trend_score: 80,
          estimated_revenue_potential: 600,
          player_count: 32000000,
          description: "Tactical first-person shooter",
          image_url: "/game-images/cs2.jpg"
        },
        {
          name: "fifa_24",
          display_name: "EA Sports FC 24",
          platform: ["PC", "PlayStation", "Xbox"],
          trend_score: 78,
          estimated_revenue_potential: 580,
          player_count: 45000000,
          description: "Football simulation",
          image_url: "/game-images/fifa24.jpg"
        },
        {
          name: "overwatch_2",
          display_name: "Overwatch 2",
          platform: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
          trend_score: 75,
          estimated_revenue_potential: 520,
          player_count: 35000000,
          description: "Team-based first-person shooter",
          image_url: "/game-images/overwatch2.jpg"
        },
        {
          name: "league_of_legends",
          display_name: "League of Legends",
          platform: ["PC"],
          trend_score: 73,
          estimated_revenue_potential: 480,
          player_count: 180000000,
          description: "Multiplayer online battle arena",
          image_url: "/game-images/lol.jpg"
        },
        {
          name: "dota_2",
          display_name: "Dota 2",
          platform: ["PC"],
          trend_score: 70,
          estimated_revenue_potential: 450,
          player_count: 11000000,
          description: "Multiplayer online battle arena",
          image_url: "/game-images/dota2.jpg"
        },
        {
          name: "pubg",
          display_name: "PUBG: Battlegrounds",
          platform: ["PC", "PlayStation", "Xbox"],
          trend_score: 68,
          estimated_revenue_potential: 420,
          player_count: 227000000,
          description: "Battle royale shooter",
          image_url: "/game-images/pubg.jpg"
        },
        {
          name: "rainbow_six_siege",
          display_name: "Rainbow Six Siege",
          platform: ["PC", "PlayStation", "Xbox"],
          trend_score: 65,
          estimated_revenue_potential: 400,
          player_count: 55000000,
          description: "Tactical first-person shooter",
          image_url: "/game-images/r6-siege.jpg"
        },
        {
          name: "cod_modern_warfare_3",
          display_name: "Call of Duty: Modern Warfare III",
          platform: ["PC", "PlayStation", "Xbox"],
          trend_score: 63,
          estimated_revenue_potential: 380,
          player_count: 25000000,
          description: "First-person shooter",
          image_url: "/game-images/mw3.jpg"
        },
        {
          name: "nba_2k24",
          display_name: "NBA 2K24",
          platform: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
          trend_score: 60,
          estimated_revenue_potential: 350,
          player_count: 8000000,
          description: "Basketball simulation",
          image_url: "/game-images/nba2k24.jpg"
        },
        {
          name: "street_fighter_6",
          display_name: "Street Fighter 6",
          platform: ["PC", "PlayStation", "Xbox"],
          trend_score: 58,
          estimated_revenue_potential: 320,
          player_count: 3000000,
          description: "Fighting game",
          image_url: "/game-images/sf6.jpg"
        },
        {
          name: "tekken_8",
          display_name: "Tekken 8",
          platform: ["PC", "PlayStation", "Xbox"],
          trend_score: 55,
          estimated_revenue_potential: 300,
          player_count: 2000000,
          description: "3D fighting game",
          image_url: "/game-images/tekken8.jpg"
        },
        {
          name: "mortal_kombat_1",
          display_name: "Mortal Kombat 1",
          platform: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
          trend_score: 53,
          estimated_revenue_potential: 280,
          player_count: 1500000,
          description: "Fighting game",
          image_url: "/game-images/mk1.jpg"
        },
        {
          name: "madden_nfl_24",
          display_name: "Madden NFL 24",
          platform: ["PC", "PlayStation", "Xbox"],
          trend_score: 50,
          estimated_revenue_potential: 260,
          player_count: 5000000,
          description: "American football simulation",
          image_url: "/game-images/madden24.jpg"
        },
        {
          name: "fall_guys",
          display_name: "Fall Guys",
          platform: ["PC", "PlayStation", "Xbox", "Nintendo Switch"],
          trend_score: 48,
          estimated_revenue_potential: 240,
          player_count: 50000000,
          description: "Battle royale party game",
          image_url: "/game-images/fall-guys.jpg"
        },
        {
          name: "among_us",
          display_name: "Among Us",
          platform: ["PC", "Mobile", "PlayStation", "Xbox", "Nintendo Switch"],
          trend_score: 45,
          estimated_revenue_potential: 220,
          player_count: 500000000,
          description: "Social deduction game",
          image_url: "/game-images/among-us.jpg"
        }
      ];

      // Sort by trend score descending
      return trendingGames.sort((a, b) => b.trend_score - a.trend_score);
    } catch (error) {
      console.error('Error fetching trending games:', error);
      throw error;
    }
  }

  // Get current game revenue analytics
  static async getGameRevenue(): Promise<GameRevenue[]> {
    try {
      const { data: challenges } = await supabase
        .from('challenges')
        .select(`
          game_id,
          stake_amount,
          total_pot,
          created_at,
          status
        `)
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const gameMap = new Map<string, any>();
      
      challenges?.forEach(challenge => {
        const gameId = challenge.game_id;
        if (!gameMap.has(gameId)) {
          gameMap.set(gameId, {
            game_id: gameId,
            revenue_30d: 0,
            revenue_7d: 0,
            total_challenges: 0,
            stakes: []
          });
        }
        
        const game = gameMap.get(gameId);
        const challengeDate = new Date(challenge.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - challengeDate.getTime()) / (1000 * 60 * 60 * 24));
        
        game.total_challenges++;
        game.stakes.push(challenge.stake_amount);
        game.revenue_30d += challenge.total_pot * 0.1; // 10% platform fee
        
        if (daysDiff <= 7) {
          game.revenue_7d += challenge.total_pot * 0.1;
        }
      });

      return Array.from(gameMap.values()).map(game => ({
        ...game,
        avg_stake: game.stakes.length > 0 ? game.stakes.reduce((a: number, b: number) => a + b, 0) / game.stakes.length : 0
      }));
    } catch (error) {
      console.error('Error fetching game revenue:', error);
      throw error;
    }
  }

  // Optimize games list automatically
  static async optimizeGamesList(): Promise<{
    added: TrendingGameData[];
    removed: string[];
    message: string;
  }> {
    try {
      const [trendingGames, gameRevenue] = await Promise.all([
        this.fetchTrendingGames(),
        this.getGameRevenue()
      ]);

      // Get current active games
      const { data: currentGames } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true);

      if (!currentGames) {
        throw new Error('Failed to fetch current games');
      }

      // Identify underperforming games
      const underperformers = gameRevenue
        .filter(game => game.revenue_30d < 50 && game.total_challenges < 5)
        .slice(-5); // Get worst 5

      // Get top trending games not in current list
      const currentGameNames = currentGames.map(g => g.name);
      const newGamesToAdd = trendingGames
        .filter(game => !currentGameNames.includes(game.name))
        .slice(0, Math.min(underperformers.length, 5)); // Ensure we maintain top 25

      let addedGames: TrendingGameData[] = [];
      let removedGames: string[] = [];

      if (newGamesToAdd.length > 0 && underperformers.length > 0) {
        // Add new trending games
        const { error: insertError } = await supabase
          .from('games')
          .insert(
            newGamesToAdd.map(game => ({
              name: game.name,
              display_name: game.display_name,
              platform: game.platform,
              description: game.description,
              image_url: game.image_url,
              is_active: true
            }))
          );

        if (insertError) throw insertError;

        // Get the underperforming game names
        const underperformerIds = underperformers.map(g => g.game_id);
        const gamesToRemove = currentGames.filter(g => underperformerIds.includes(g.id));

        // Deactivate underperforming games
        const { error: updateError } = await supabase
          .from('games')
          .update({ is_active: false })
          .in('id', underperformerIds);

        if (updateError) throw updateError;

        addedGames = newGamesToAdd;
        removedGames = gamesToRemove.map(g => g.display_name);
      }

      return {
        added: addedGames,
        removed: removedGames,
        message: addedGames.length > 0 
          ? `Optimized games list: Added ${addedGames.length} trending games, removed ${removedGames.length} underperformers`
          : 'Games list is already optimized'
      };
    } catch (error) {
      console.error('Error optimizing games list:', error);
      throw error;
    }
  }

  // Get optimization recommendations
  static async getOptimizationRecommendations(): Promise<{
    shouldOptimize: boolean;
    recommendations: string[];
    potentialRevenue: number;
  }> {
    try {
      const [trendingGames, gameRevenue] = await Promise.all([
        this.fetchTrendingGames(),
        this.getGameRevenue()
      ]);

      const { data: currentGames } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true);

      if (!currentGames) {
        throw new Error('Failed to fetch current games');
      }

      const underperformers = gameRevenue.filter(game => 
        game.revenue_30d < 50 && game.total_challenges < 5
      );

      const currentGameNames = currentGames.map(g => g.name);
      const missingTrendingGames = trendingGames
        .filter(game => !currentGameNames.includes(game.name))
        .slice(0, 10);

      const recommendations: string[] = [];
      let potentialRevenue = 0;

      if (underperformers.length > 0) {
        recommendations.push(`Remove ${underperformers.length} underperforming games generating <$50/month`);
      }

      if (missingTrendingGames.length > 0) {
        const topMissing = missingTrendingGames.slice(0, 3);
        recommendations.push(`Add trending games: ${topMissing.map(g => g.display_name).join(', ')}`);
        potentialRevenue = topMissing.reduce((sum, game) => sum + game.estimated_revenue_potential, 0);
      }

      if (currentGames.length < 25) {
        recommendations.push(`Scale up to 25 games for maximum revenue potential`);
      }

      return {
        shouldOptimize: recommendations.length > 0,
        recommendations,
        potentialRevenue
      };
    } catch (error) {
      console.error('Error getting optimization recommendations:', error);
      throw error;
    }
  }
}

export default TrendingGamesService;