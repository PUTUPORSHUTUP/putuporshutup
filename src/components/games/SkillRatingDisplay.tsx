import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Trophy, TrendingUp, Users, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SkillRating {
  skill_tier: string;
  skill_rating: number;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  game_id: string;
  game_name: string;
}

const tierColors = {
  novice: 'bg-gray-500',
  amateur: 'bg-green-500', 
  intermediate: 'bg-blue-500',
  advanced: 'bg-purple-500',
  expert: 'bg-orange-500',
  pro: 'bg-red-500'
};

const tierIcons = {
  novice: Shield,
  amateur: Users,
  intermediate: TrendingUp,
  advanced: Star,
  expert: Trophy,
  pro: Trophy
};

const tierLimits = {
  novice: { maxFee: 10, protection: "Protected from pros" },
  amateur: { maxFee: 25, protection: "Limited to similar skill" },
  intermediate: { maxFee: 50, protection: "Moderate skill matching" },
  advanced: { maxFee: 100, protection: "Open competition" },
  expert: { maxFee: 500, protection: "High stakes allowed" },
  pro: { maxFee: 9999, protection: "No limits" }
};

export const SkillRatingDisplay = () => {
  const { user } = useAuth();
  const [skillRatings, setSkillRatings] = useState<SkillRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSkillRatings();
    }
  }, [user]);

  const loadSkillRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('player_skill_ratings')
        .select(`
          *,
          games(name, display_name)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const formattedRatings = data?.map(rating => ({
        ...rating,
        game_name: rating.games?.display_name || rating.games?.name || 'Unknown Game'
      })) || [];

      setSkillRatings(formattedRatings);
    } catch (error) {
      console.error('Error loading skill ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierRankPosition = (tier: string, rating: number) => {
    const baseRatings = {
      novice: 800,
      amateur: 1000,
      intermediate: 1200,
      advanced: 1500,
      expert: 1800,
      pro: 2100
    };
    
    const currentBase = baseRatings[tier as keyof typeof baseRatings] || 1000;
    const nextTierBase = Object.values(baseRatings).find(r => r > currentBase) || 2500;
    
    const progress = Math.min(100, Math.max(0, 
      ((rating - currentBase) / (nextTierBase - currentBase)) * 100
    ));
    
    return progress;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Skill-Based Matchmaking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Sign in to see your skill ratings and tier protections.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Your Skill Ratings & Fair Play Protection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {skillRatings.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Ratings Yet</h3>
              <p className="text-muted-foreground">
                Play your first matches to establish your skill tier and get fair matchmaking protection.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {skillRatings.map((rating) => {
                const TierIcon = tierIcons[rating.skill_tier as keyof typeof tierIcons];
                const tierLimit = tierLimits[rating.skill_tier as keyof typeof tierLimits];
                const progress = getTierRankPosition(rating.skill_tier, rating.skill_rating);
                
                return (
                  <div key={rating.game_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <TierIcon className="w-5 h-5" />
                        <div>
                          <h4 className="font-semibold">{rating.game_name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`${tierColors[rating.skill_tier as keyof typeof tierColors]} text-white`}
                            >
                              {rating.skill_tier.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Rating: {rating.skill_rating}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Record</div>
                        <div className="font-semibold">
                          {rating.wins}W - {rating.losses}L
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress to next tier</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    <div className="mt-3 p-3 bg-muted/50 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-sm">Protection Active</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Max entry fee: ${tierLimit.maxFee} • {tierLimit.protection}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How Skill-Based Matchmaking Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                Tier Protection
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Novices protected from expert players</li>
                <li>• Entry fee limits based on skill level</li>
                <li>• Fair skill gaps in matchmaking</li>
                <li>• Anti-sandbagging measures</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Skill Progression
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• ELO-based rating system</li>
                <li>• Tier advancement through wins</li>
                <li>• Performance-based adjustments</li>
                <li>• Verified stats tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};