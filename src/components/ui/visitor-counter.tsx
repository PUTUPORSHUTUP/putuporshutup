import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Eye, TrendingUp, Clock } from 'lucide-react';

interface VisitStats {
  total_visits: number;
  unique_visitors: number;
  visits_today: number;
  visits_this_week: number;
}

export const VisitorCounter = () => {
  const [stats, setStats] = useState<VisitStats>({
    total_visits: 0,
    unique_visitors: 0,
    visits_today: 0,
    visits_this_week: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track this visit
    trackVisit();
    
    // Load initial stats
    loadStats();

    // Set up real-time subscription for visit updates
    const channel = supabase
      .channel('visitor-stats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'site_visits'
        },
        () => {
          loadStats(); // Reload stats when new visit is tracked
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const trackVisit = async () => {
    try {
      // Generate or get session ID
      let sessionId = sessionStorage.getItem('visitor_session');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('visitor_session', sessionId);
      }

      // Get visitor ID (user ID if authenticated, session ID if anonymous)
      const { data: { user } } = await supabase.auth.getUser();
      const visitorId = user?.id || sessionId;

      await supabase
        .from('site_visits')
        .insert({
          visitor_id: visitorId,
          page_path: '/',
          session_id: sessionId,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_visit_stats');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats({
          total_visits: Number(data[0].total_visits) || 0,
          unique_visitors: Number(data[0].unique_visitors) || 0,
          visits_today: Number(data[0].visits_today) || 0,
          visits_this_week: Number(data[0].visits_this_week) || 0
        });
      }
    } catch (error) {
      console.error('Error loading visit stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card/50 border-neon-green/20">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-2"></div>
              <div className="h-6 bg-muted rounded mb-1"></div>
              <div className="h-4 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card/50 border-neon-green/20 hover:border-neon-green/40 transition-colors">
        <CardContent className="p-4 text-center">
          <Eye className="w-8 h-8 text-neon-green mx-auto mb-2" />
          <div className="text-2xl font-orbitron font-bold text-neon-green">
            {formatNumber(stats.total_visits)}
          </div>
          <div className="text-sm text-muted-foreground font-orbitron">
            Total Visits
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-neon-green/20 hover:border-neon-green/40 transition-colors">
        <CardContent className="p-4 text-center">
          <Users className="w-8 h-8 text-neon-green mx-auto mb-2" />
          <div className="text-2xl font-orbitron font-bold text-neon-green">
            {formatNumber(stats.unique_visitors)}
          </div>
          <div className="text-sm text-muted-foreground font-orbitron">
            Unique Visitors
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-neon-green/20 hover:border-neon-green/40 transition-colors">
        <CardContent className="p-4 text-center">
          <Clock className="w-8 h-8 text-neon-green mx-auto mb-2" />
          <div className="text-2xl font-orbitron font-bold text-neon-green">
            {formatNumber(stats.visits_today)}
          </div>
          <div className="text-sm text-muted-foreground font-orbitron">
            Today
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-neon-green/20 hover:border-neon-green/40 transition-colors">
        <CardContent className="p-4 text-center">
          <TrendingUp className="w-8 h-8 text-neon-green mx-auto mb-2" />
          <div className="text-2xl font-orbitron font-bold text-neon-green">
            {formatNumber(stats.visits_this_week)}
          </div>
          <div className="text-sm text-muted-foreground font-orbitron">
            This Week
          </div>
        </CardContent>
      </Card>
    </div>
  );
};